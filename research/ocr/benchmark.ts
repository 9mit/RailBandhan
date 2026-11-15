import fs from 'fs';
import path from 'path';

interface TicketGroundTruth {
  pnr?: string;
  trainNumber?: string;
  trainName?: string;
  journeyDate?: string;
  boardingStationCode?: string;
  destinationStationCode?: string;
  coach?: string;
  berth?: string;
  travelClass?: string;
}

interface BenchmarkSample {
  id: string;
  type: string;
  description: string;
  rawText: string;
  groundTruth: TicketGroundTruth;
}

interface ExtractedFields {
  pnr: string | null;
  trainNumber: string | null;
  trainName: string | null;
  journeyDate: string | null;
  boardingStationCode: string | null;
  destinationStationCode: string | null;
  coach: string | null;
  berth: string | null;
  travelClass: string | null;
  confidenceScore: number;
}

// Deterministic normalizer and regex extractor
export function extractFieldsDeterministic(text: string): ExtractedFields {
  const clean = text
    .replace(/[Il|]/g, (m, offset, str) => {
      // If surrounded by digits, replace with 1
      const prev = str[offset - 1] ?? '';
      const next = str[offset + 1] ?? '';
      return /\d/.test(prev) || /\d/.test(next) ? '1' : m;
    })
    .replace(/[Oo]/g, (m, offset, str) => {
      const prev = str[offset - 1] ?? '';
      const next = str[offset + 1] ?? '';
      return /\d/.test(prev) || /\d/.test(next) ? '0' : m;
    });

  // 1. PNR: 10 digits
  const pnrMatch =
    clean.match(/\bPNR[:\s-]*([0-9]{3,4}[-\s]?[0-9]{6,7})\b/i) ||
    clean.match(/\b([0-9]{10})\b/);
  const pnr = pnrMatch ? pnrMatch[1].replace(/[-\s]/g, '') : null;

  // 2. Train Number: 5 digits
  const trainMatch =
    clean.match(/\b(?:TRAIN|TRN|गाड़ी सं)[.:\s#-]*([0-9]{5})\b/i) ||
    clean.match(/\b(12\d{3}|11\d{3}|20\d{3}|22\d{3}|14\d{3})\b/);
  const trainNumber = trainMatch ? trainMatch[1] : null;

  // 3. Date: DD/MM/YYYY or YYYY-MM-DD or DD-Mon-YYYY
  let journeyDate: string | null = null;
  const isoDate = clean.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/);
  const dmyDate = clean.match(/\b(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/](20\d{2}|\d{2})\b/);
  const monthNameDate = clean.match(
    /\b(0[1-9]|[12]\d|3[01])[- ](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[- ](20\d{2})\b/i,
  );

  const monthsMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  if (isoDate) {
    journeyDate = `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  } else if (dmyDate) {
    const yr = dmyDate[3].length === 2 ? `20${dmyDate[3]}` : dmyDate[3];
    journeyDate = `${yr}-${dmyDate[2].padStart(2, '0')}-${dmyDate[1].padStart(2, '0')}`;
  } else if (monthNameDate) {
    const mon = monthsMap[monthNameDate[2].toLowerCase().slice(0, 3)];
    journeyDate = `${monthNameDate[3]}-${mon}-${monthNameDate[1].padStart(2, '0')}`;
  }

  // 4. Stations: (CODE) or FROM CODE TO CODE or CODE -> CODE
  let boardingStationCode: string | null = null;
  let destinationStationCode: string | null = null;

  const fromToMatch = clean.match(
    /(?:FROM|प्रस्थान)[.:\s]*([A-Z\s]+?)\s*(?:\(([A-Z]{2,5})\))?[\s\S]{1,80}?(?:TO|गंतव्य)[.:\s]*([A-Z\s]+?)\s*(?:\(([A-Z]{2,5})\))?/i,
  );
  if (fromToMatch) {
    boardingStationCode = fromToMatch[2] ?? fromToMatch[1]?.trim().split(/\s+/)[0];
    destinationStationCode = fromToMatch[4] ?? fromToMatch[3]?.trim().split(/\s+/)[0];
  }

  if (!boardingStationCode || !destinationStationCode) {
    const arrowMatch = clean.match(/\b([A-Z]{2,5})\s*(?:→|->|to)\s*([A-Z]{2,5})\b/i);
    if (arrowMatch) {
      boardingStationCode = arrowMatch[1].toUpperCase();
      destinationStationCode = arrowMatch[2].toUpperCase();
    }
  }

  // 5. Coach, Berth, Class
  const coachMatch = clean.match(/\b(?:COACH|कोच)[.:\s]*([A-Z][0-9]?)\b/i) || clean.match(/\b([BASHM][1-9]|D[1-9]|C[1-9]|S[1-9][0-9]?)\b/);
  const coach = coachMatch ? coachMatch[1].toUpperCase() : null;

  const berthMatch = clean.match(/\b(?:BERTH|SEAT|बर्थ)[.:\s]*([0-9]{1,3})\b/i) || clean.match(/\b(?:MB|LB|UB|SL|SU)\b/);
  const berth = berthMatch ? berthMatch[1] : null;

  const classMatch = clean.match(/\b(?:CLASS|श्रेणी)[.:\s]*(1A|2A|3A|3E|SL|CC|EC|2S)\b/i) || clean.match(/\b(1A|2A|3A|3E|SL|CC|EC|2S)\b/i);
  const travelClass = classMatch ? classMatch[1].toUpperCase() : null;

  // Confidence calculation
  let score = 0;
  if (pnr) score += 0.25;
  if (trainNumber) score += 0.25;
  if (journeyDate) score += 0.2;
  if (boardingStationCode && destinationStationCode) score += 0.2;
  if (coach || berth || travelClass) score += 0.1;

  return {
    pnr,
    trainNumber,
    trainName: null,
    journeyDate,
    boardingStationCode: boardingStationCode ? boardingStationCode.toUpperCase() : null,
    destinationStationCode: destinationStationCode ? destinationStationCode.toUpperCase() : null,
    coach,
    berth,
    travelClass,
    confidenceScore: Number(score.toFixed(2)),
  };
}

export function runOcrBenchmark(): {
  totalSamples: number;
  fieldAccuracy: Record<string, { correct: number; total: number; percentage: number }>;
  completeTicketAccuracy: number;
  averageLatencyMs: number;
} {
  const datasetPath = path.resolve(__dirname, '../datasets/synthetic-tickets.json');
  const rawData = fs.readFileSync(datasetPath, 'utf8');
  const samples: BenchmarkSample[] = JSON.parse(rawData);

  const fields = ['pnr', 'trainNumber', 'journeyDate', 'boardingStationCode', 'destinationStationCode', 'coach', 'travelClass'] as const;
  const fieldStats: Record<string, { correct: number; total: number }> = {};
  for (const f of fields) {
    fieldStats[f] = { correct: 0, total: 0 };
  }

  let completeTicketsCorrect = 0;
  const startTime = Date.now();

  for (const sample of samples) {
    const extracted = extractFieldsDeterministic(sample.rawText);
    let sampleAllCorrect = true;

    for (const f of fields) {
      const expected = sample.groundTruth[f];
      if (expected !== undefined) {
        fieldStats[f].total += 1;
        const actual = extracted[f];
        if (actual && actual.toLowerCase() === expected.toLowerCase()) {
          fieldStats[f].correct += 1;
        } else {
          sampleAllCorrect = false;
        }
      }
    }

    if (sampleAllCorrect) {
      completeTicketsCorrect += 1;
    }
  }

  const durationMs = Date.now() - startTime;
  const avgLatency = samples.length > 0 ? durationMs / samples.length : 0;

  const resultFieldAccuracy: Record<string, { correct: number; total: number; percentage: number }> = {};
  for (const f of fields) {
    const stats = fieldStats[f];
    resultFieldAccuracy[f] = {
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    };
  }

  return {
    totalSamples: samples.length,
    fieldAccuracy: resultFieldAccuracy,
    completeTicketAccuracy: Math.round((completeTicketsCorrect / samples.length) * 100),
    averageLatencyMs: Number(avgLatency.toFixed(3)),
  };
}

if (require.main === module) {
  const results = runOcrBenchmark();
  console.log('=== OCR & Document-AI Deterministic Benchmark Results ===');
  console.log(JSON.stringify(results, null, 2));
}
