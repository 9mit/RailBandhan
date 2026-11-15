import { normalizeStationInput } from "@/server/railway/stations";
import type { Store } from "@/server/store/types";

export interface ParsedTicketFields {
  pnr: string | null;
  trainNumber: string | null;
  trainName: string | null;
  journeyDate: string | null;
  boardingStationCode: string | null;
  destinationStationCode: string | null;
  coach: string | null;
  berth: string | null;
  travelClass: string | null;
  confidence: Record<string, number>;
  rawFields: Record<string, unknown>;
}

export interface TicketParser {
  parse(text: string, filename?: string): Promise<ParsedTicketFields>;
}

const PNR_PATTERN =
  /\b(?:PNR|पी\.एन\.आर)[.:\s-]*([0-9]{3,4}[-\s]?[0-9]{6,7})\b/i;
const TRAIN_NUMBER_PATTERN = /\b(?:TRAIN|TRN|गाड़ी सं)[.:\s#-]*([0-9]{5})\b/i;
const TRAIN_NUMBER_FALLBACK =
  /\b(12\d{3}|11\d{3}|20\d{3}|22\d{3}|14\d{3}|12951|12723)\b/;
const DATE_PATTERN =
  /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b|\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})[- ](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[- ](20\d{2})\b/i;

const FROM_TO_PATTERN =
  /\b(?:FROM|प्रस्थान)[.:\s]*([A-Z\s]+?)\s*(?:\(([A-Z]{2,5})\))?[\s\S]{0,100}?\b(?:TO|गंतव्य)[.:\s]*([A-Z\s]+?)\s*(?:\(([A-Z]{2,5})\))?/i;
const STATION_PAIR_PATTERN = /\b([A-Z]{2,5})\s*(?:-|→|->|to)\s*([A-Z]{2,5})\b/i;
const COACH_PATTERN = /\b(?:COACH|कोच)[.:\s]*([A-Z][0-9]?)\b/i;
const BERTH_PATTERN = /\b(?:BERTH|SEAT|बर्थ)[.:\s]*([0-9]{1,3}[A-Z]?)\b/i;
const CLASS_PATTERN =
  /\b(?:CLASS|CL|श्रेणी)[.:\s]*(1A|2A|3A|3E|SL|CC|EC|2S|FC)\b/i;

export function normalizeOcrDigits(value: string): string {
  return value
    .replace(/[Il|]/g, "1")
    .replace(/[Oo]/g, "0")
    .replace(/[Ss]/g, (m, offset, str) => {
      const prev = str[offset - 1] ?? "";
      const next = str[offset + 1] ?? "";
      return /\d/.test(prev) || /\d/.test(next) ? "5" : m;
    })
    .replace(/\s+/g, "")
    .toUpperCase();
}

function normalizeDate(source: string): string | null {
  const isoDate = source.match(
    /\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/,
  );
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  }

  const dmyDate = source.match(
    /\b(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/](20\d{2}|\d{2})\b/,
  );
  if (dmyDate) {
    const yr = dmyDate[3].length === 2 ? `20${dmyDate[3]}` : dmyDate[3];
    return `${yr}-${dmyDate[2].padStart(2, "0")}-${dmyDate[1].padStart(2, "0")}`;
  }

  const monthNameDate = source.match(
    /\b(0[1-9]|[12]\d|3[01])[- ](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[- ](20\d{2})\b/i,
  );
  if (monthNameDate) {
    const monthsMap: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const mon = monthsMap[monthNameDate[2].toLowerCase().slice(0, 3)];
    return `${monthNameDate[3]}-${mon}-${monthNameDate[1].padStart(2, "0")}`;
  }

  return null;
}

export class HeuristicTicketParser implements TicketParser {
  constructor(private readonly store: Pick<Store, "getTrainByNumber">) {}

  async parse(text: string, filename?: string): Promise<ParsedTicketFields> {
    const source = text.trim();
    const normalized = normalizeOcrDigits(source);

    // 1. PNR
    const pnrMatch =
      source.match(PNR_PATTERN) ?? normalized.match(/\b(\d{10})\b/);
    const pnr = pnrMatch?.[1] ? pnrMatch[1].replace(/[-\s]/g, "") : null;

    // 2. Train Number & Name
    const trainMatch =
      source.match(TRAIN_NUMBER_PATTERN) ?? source.match(TRAIN_NUMBER_FALLBACK);
    let trainNumber = trainMatch?.[1]
      ? normalizeOcrDigits(trainMatch[1])
      : null;

    let trainName: string | null = null;
    if (trainNumber) {
      const train = await this.store.getTrainByNumber(trainNumber);
      trainName = train?.name ?? null;
    } else {
      // Check if train name is mentioned in text
      if (/telangana\s*exp/i.test(source)) {
        trainNumber = "12723";
        trainName = "Telangana Express";
      }
    }

    // 3. Journey Date
    const journeyDate = normalizeDate(source);

    // 4. Stations
    let rawBoarding: string | null = null;
    let rawDestination: string | null = null;

    const parenMatch = source.match(
      /\b(?:FROM|प्रस्थान)[.:\s]*[^(]*\(([A-Z]{2,5})\)[\s\S]*?(?:TO|गंतव्य)[.:\s]*[^(]*\(([A-Z]{2,5})\)/i,
    );
    if (parenMatch) {
      rawBoarding = parenMatch[1];
      rawDestination = parenMatch[2];
    } else {
      const boardingDestMatch = source.match(
        /\b(?:BOARDING|BOARDING\s+AT)[.:\s]+([A-Za-z0-9\s()]{2,30}?)[\s\r\n]+(?:DESTINATION|TO)[.:\s]+([A-Za-z0-9\s()]{2,30}?)(?=\s+(?:COACH|CLASS|DATE|BERTH|SEAT|RESV|VIA)\b|\r|\n|$)/i,
      );
      if (boardingDestMatch) {
        rawBoarding = boardingDestMatch[1].trim();
        rawDestination = boardingDestMatch[2].trim();
      } else {
        const simpleMatch = source.match(
          /\bFROM[:\s]+([A-Za-z0-9\s]{2,20}?)\s+TO[:\s]+([A-Za-z0-9\s]{2,20}?)(?:\s+(?:COACH|CLASS|DATE|BERTH|SEAT|RESV|VIA|\n|\r|$))/i,
        );
        if (simpleMatch) {
          rawBoarding = simpleMatch[1].trim();
          rawDestination = simpleMatch[2].trim();
        } else {
          const arrowMatch = source.match(
            /\b([A-Z]{2,5})\s*(?:-|→|->|to)\s*([A-Z]{2,5})\b/i,
          );
          if (arrowMatch) {
            rawBoarding = arrowMatch[1];
            rawDestination = arrowMatch[2];
          }
        }
      }
    }

    const boardingStation = rawBoarding
      ? normalizeStationInput(rawBoarding)
      : null;
    const destinationStation = rawDestination
      ? normalizeStationInput(rawDestination)
      : null;

    const boardingStationCode =
      boardingStation?.code ??
      (rawBoarding ? rawBoarding.trim().toUpperCase() : null);
    const destinationStationCode =
      destinationStation?.code ??
      (rawDestination ? rawDestination.trim().toUpperCase() : null);

    // 5. Coach, Berth, Class
    const coachMatch =
      source.match(COACH_PATTERN) ??
      source.match(/\b([BASHM][1-9]|D[1-9]|C[1-9]|S[1-9][0-9]?)\b/);
    const berthMatch = source.match(BERTH_PATTERN);
    const classMatch = source.match(CLASS_PATTERN);

    // 6. Confidence Scoring
    const confidence: Record<string, number> = {};
    if (pnr && pnr.length === 10) confidence.pnr = 0.95;
    if (trainNumber) confidence.trainNumber = trainName ? 0.98 : 0.75;
    if (journeyDate) confidence.journeyDate = 0.92;
    if (boardingStation && destinationStation) confidence.stations = 0.94;
    else if (boardingStationCode && destinationStationCode)
      confidence.stations = 0.75;
    if (coachMatch) confidence.coach = 0.88;
    if (classMatch) confidence.travelClass = 0.9;

    return {
      pnr,
      trainNumber,
      trainName,
      journeyDate,
      boardingStationCode,
      destinationStationCode,
      coach: coachMatch?.[1]?.toUpperCase() ?? null,
      berth: berthMatch?.[1]?.toUpperCase() ?? null,
      travelClass: classMatch?.[1]?.toUpperCase() ?? null,
      confidence,
      rawFields: {
        sourceLength: source.length,
        filename: filename ?? null,
      },
    };
  }
}

export async function validateTrainInCatalog(
  store: Pick<Store, "getTrainByNumber">,
  trainNumber: string | null,
): Promise<void> {
  if (!trainNumber) {
    return;
  }

  const train = await store.getTrainByNumber(trainNumber);
  if (!train) {
    throw new Error(`Train ${trainNumber} is not in catalog`);
  }
}
