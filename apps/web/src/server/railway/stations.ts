export interface CanonicalStation {
  code: string;
  name: string;
  hindiName?: string;
  aliases: string[];
  lat?: number;
  lng?: number;
}

export const CANONICAL_STATIONS: CanonicalStation[] = [
  {
    code: "SC",
    name: "Secunderabad Junction",
    hindiName: "सिकंदराबाद जंक्शन",
    aliases: ["SECUNDERABAD", "SECUNDERABAD JN", "HYDERABAD SC", "SECUNDERBAD"],
    lat: 17.4334,
    lng: 78.5045,
  },
  {
    code: "KZJ",
    name: "Kazipet Junction",
    hindiName: "काजीपेट जंक्शन",
    aliases: ["KAZIPET", "KZJ JN"],
    lat: 17.9784,
    lng: 79.5222,
  },
  {
    code: "WL",
    name: "Warangal",
    hindiName: "वारंगल",
    aliases: ["WARANGAL JN", "WARANGAL"],
    lat: 17.9689,
    lng: 79.5941,
  },
  {
    code: "RDM",
    name: "Ramagundam",
    hindiName: "रामागुंडम",
    aliases: ["RAMAGUNDAM"],
    lat: 18.7618,
    lng: 79.4746,
  },
  {
    code: "MCI",
    name: "Manchiryal",
    hindiName: "मंचेरियल",
    aliases: ["MANCHERIAL", "MANCHIRYAL"],
    lat: 18.8711,
    lng: 79.4619,
  },
  {
    code: "BPA",
    name: "Bellampalli",
    hindiName: "बेल्लमपल्ली",
    aliases: ["BELLAMPALLI"],
    lat: 19.0667,
    lng: 79.4833,
  },
  {
    code: "SKZR",
    name: "Sirpur Kaghaznagar",
    hindiName: "सिरपुर कागजनगर",
    aliases: ["KAGHAZNAGAR", "SIRPUR KAGHAZNAGAR"],
    lat: 19.3333,
    lng: 79.4833,
  },
  {
    code: "BPQ",
    name: "Balharshah Junction",
    hindiName: "बल्लारशाह जंक्शन",
    aliases: ["BALLARPUR", "BALHARSHAH", "BALHARSHAH JN"],
    lat: 19.8519,
    lng: 79.3519,
  },
  {
    code: "CD",
    name: "Chandrapur",
    hindiName: "चंद्रपुर",
    aliases: ["CHANDRAPUR"],
    lat: 19.9575,
    lng: 79.2961,
  },
  {
    code: "NGP",
    name: "Nagpur Junction",
    hindiName: "नागपुर जंक्शन",
    aliases: ["NAGPUR", "NAGPUR JN"],
    lat: 21.1524,
    lng: 79.0888,
  },
  {
    code: "BPL",
    name: "Bhopal Junction",
    hindiName: "भोपाल जंक्शन",
    aliases: ["BHOPAL", "BHOPAL JN", "BHOPAL MAIN"],
    lat: 23.2599,
    lng: 77.4126,
  },
  {
    code: "VGLB",
    name: "Virangana Lakshmibai Jhansi Junction",
    hindiName: "वीरांगना लक्ष्मीबाई झाँसी जंक्शन",
    aliases: ["JHS", "JHANSI", "JHANSI JN", "VIRANGANA LAKSHMIBAI"],
    lat: 25.4484,
    lng: 78.5685,
  },
  {
    code: "GWL",
    name: "Gwalior Junction",
    hindiName: "ग्वालियर जंक्शन",
    aliases: ["GWALIOR", "GWALIOR JN"],
    lat: 26.2183,
    lng: 78.1828,
  },
  {
    code: "AGC",
    name: "Agra Cantt",
    hindiName: "आगरा कैंट",
    aliases: ["AGRA", "AGRA CANTT JN", "AGRA CANTT"],
    lat: 27.1594,
    lng: 77.9944,
  },
  {
    code: "MTJ",
    name: "Mathura Junction",
    hindiName: "मथुरा जंक्शन",
    aliases: ["MATHURA", "MATHURA JN"],
    lat: 27.4924,
    lng: 77.6737,
  },
  {
    code: "NDLS",
    name: "New Delhi",
    hindiName: "नई दिल्ली",
    aliases: ["NEW DELHI", "DELHI NDLS", "DLI", "NEW DELHI RAILWAY STATION"],
    lat: 28.6415,
    lng: 77.2207,
  },
  {
    code: "BCT",
    name: "Mumbai Central",
    hindiName: "मुंबई सेंट्रल",
    aliases: ["MUMBAI CENTRAL", "BOMBAY CENTRAL", "MMCT"],
    lat: 18.9696,
    lng: 72.8193,
  },
  {
    code: "ST",
    name: "Surat",
    hindiName: "सूरत",
    aliases: ["SURAT JN", "SURAT"],
    lat: 21.2049,
    lng: 72.8406,
  },
  {
    code: "BRC",
    name: "Vadodara Junction",
    hindiName: "वडोदरा जंक्शन",
    aliases: ["VADODARA", "BARODA", "VADODARA JN"],
    lat: 22.3107,
    lng: 73.1812,
  },
  {
    code: "RTM",
    name: "Ratlam Junction",
    hindiName: "रतलाम जंक्शन",
    aliases: ["RATLAM", "RATLAM JN"],
    lat: 23.3441,
    lng: 75.0456,
  },
  {
    code: "KOTA",
    name: "Kota Junction",
    hindiName: "कोटा जंक्शन",
    aliases: ["KOTA", "KOTA JN"],
    lat: 25.2238,
    lng: 75.8774,
  },
  {
    code: "CSMT",
    name: "Chhatrapati Shivaji Maharaj Terminus",
    hindiName: "छत्रपति शिवाजी महाराज टर्मिनस",
    aliases: ["MUMBAI CSMT", "VT", "CSTM", "VICTORIA TERMINUS"],
    lat: 18.9401,
    lng: 72.8354,
  },
  {
    code: "HWH",
    name: "Howrah Junction",
    hindiName: "हावड़ा जंक्शन",
    aliases: ["HOWRAH", "HOWRAH JN", "KOLKATA HWH"],
    lat: 22.5838,
    lng: 88.3426,
  },
  {
    code: "MAS",
    name: "MGR Chennai Central",
    hindiName: "एमजीआर चेन्नई सेंट्रल",
    aliases: ["CHENNAI CENTRAL", "MADRAS CENTRAL", "MAS JN"],
    lat: 13.0827,
    lng: 80.2707,
  },
  {
    code: "CNB",
    name: "Kanpur Central",
    hindiName: "कानपुर सेंट्रल",
    aliases: ["KANPUR", "KANPUR JN", "CNB JN"],
    lat: 26.4547,
    lng: 80.3507,
  },
  {
    code: "BSB",
    name: "Varanasi Junction",
    hindiName: "वाराणसी जंक्शन",
    aliases: ["VARANASI", "BANARAS", "VARANASI JN", "BSB JN"],
    lat: 25.3268,
    lng: 82.9866,
  },
  {
    code: "PNBE",
    name: "Patna Junction",
    hindiName: "पटना जंक्शन",
    aliases: ["PATNA", "PATNA JN", "PNBE JN"],
    lat: 25.6022,
    lng: 85.1376,
  },
  {
    code: "TVC",
    name: "Thiruvananthapuram Central",
    hindiName: "तिरुवनंतपुरम सेंट्रल",
    aliases: ["TRIVANDRUM", "TRIVANDRUM CENTRAL", "TVC JN"],
    lat: 8.4875,
    lng: 76.9535,
  },
  {
    code: "PURI",
    name: "Puri",
    hindiName: "पुरी",
    aliases: ["PURI JN", "JAGANNATH PURI"],
    lat: 19.8135,
    lng: 85.8312,
  },
  {
    code: "GKP",
    name: "Gorakhpur Junction",
    hindiName: "गोरखपुर जंक्शन",
    aliases: ["GORAKHPUR", "GORAKHPUR JN", "GKP JN"],
    lat: 26.7606,
    lng: 83.3732,
  },
  {
    code: "RKMP",
    name: "Rani Kamlapati",
    hindiName: "रानी कमलापति",
    aliases: ["HABIBGANJ", "HABIBGANJ JN", "RANI KAMLAPATI BHOPAL", "RKMP JN"],
    lat: 23.2123,
    lng: 77.4398,
  },
  {
    code: "GZB",
    name: "Ghaziabad Junction",
    hindiName: "गाजियाबाद जंक्शन",
    aliases: ["GHAZIABAD", "GHAZIABAD JN"],
    lat: 28.6678,
    lng: 77.4378,
  },
  {
    code: "LKO",
    name: "Lucknow Charbagh",
    hindiName: "लखनऊ चारबाग",
    aliases: ["LUCKNOW", "LUCKNOW CHARBAGH", "LKO JN"],
    lat: 26.8315,
    lng: 80.9234,
  },
  {
    code: "BBS",
    name: "Bhubaneswar",
    hindiName: "भुवनेश्वर",
    aliases: ["BHUBANESWAR JN", "BHUBANESHWAR"],
    lat: 20.2668,
    lng: 85.8436,
  },
  {
    code: "YPR",
    name: "Yesvantpur Junction",
    hindiName: "यशवंतपुर जंक्शन",
    aliases: ["YESVANTPUR", "YESHWANTHPUR", "BANGALORE YPR"],
    lat: 13.0238,
    lng: 77.5503,
  },
  {
    code: "SDAH",
    name: "Sealdah",
    hindiName: "सियालदह",
    aliases: ["SEALDAH JN", "KOLKATA SEALDAH"],
    lat: 22.5675,
    lng: 88.3712,
  },
  {
    code: "BKN",
    name: "Bikaner Junction",
    hindiName: "बीकानेर जंक्शन",
    aliases: ["BIKANER", "BIKANER JN"],
    lat: 28.0167,
    lng: 73.3119,
  },
  {
    code: "ERS",
    name: "Ernakulam Junction",
    hindiName: "एरणाकुलम जंक्शन",
    aliases: ["ERNAKULAM", "COCHIN", "KOCHI ERS"],
    lat: 9.9675,
    lng: 76.2892,
  },
  {
    code: "ASR",
    name: "Amritsar Junction",
    hindiName: "अमृतसर जंक्शन",
    aliases: ["AMRITSAR", "AMRITSAR JN"],
    lat: 31.6339,
    lng: 74.8723,
  },
  {
    code: "GNC",
    name: "Gandhinagar Capital",
    hindiName: "गांधीनगर कैपिटल",
    aliases: ["GANDHINAGAR", "GANDHINAGAR CAPITAL"],
    lat: 23.2384,
    lng: 72.6392,
  },
];

// Levenshtein distance implementation for typo tolerance
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i += 1) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i += 1) {
    for (let j = 1; j <= an; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

export function normalizeStationInput(input: string): CanonicalStation | null {
  const clean = input
    .trim()
    .toUpperCase()
    .replace(/[^\w\s]/g, "");
  if (!clean) return null;

  // 1. Exact station code match
  const exactCode = CANONICAL_STATIONS.find((s) => s.code === clean);
  if (exactCode) return exactCode;

  // 2. Exact name or alias match
  const exactAlias = CANONICAL_STATIONS.find(
    (s) =>
      s.name.toUpperCase() === clean ||
      s.aliases.some((a) => a.toUpperCase() === clean),
  );
  if (exactAlias) return exactAlias;

  // 3. Substring match
  const substringMatch = CANONICAL_STATIONS.find(
    (s) =>
      s.name.toUpperCase().includes(clean) ||
      clean.includes(s.name.toUpperCase()) ||
      s.aliases.some(
        (a) =>
          clean.includes(a.toUpperCase()) || a.toUpperCase().includes(clean),
      ),
  );
  if (substringMatch) return substringMatch;

  // 4. Fuzzy Levenshtein match (max distance 2 for short codes, 3 for full names)
  let bestMatch: CanonicalStation | null = null;
  let minDistance = 999;

  for (const s of CANONICAL_STATIONS) {
    const codeDist = levenshteinDistance(clean, s.code);
    if (codeDist <= 1 && codeDist < minDistance) {
      minDistance = codeDist;
      bestMatch = s;
    }

    for (const alias of s.aliases) {
      const aliasDist = levenshteinDistance(clean, alias.toUpperCase());
      const maxAllowed = alias.length > 5 ? 3 : 1;
      if (aliasDist <= maxAllowed && aliasDist < minDistance) {
        minDistance = aliasDist;
        bestMatch = s;
      }
    }
  }

  return bestMatch;
}
