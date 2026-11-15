import { AppError } from "@/lib/errors";
import { normalizeStationInput } from "./stations";

export interface RouteStop {
  stationCode: string;
  stopIndex: number;
  distanceKm: number;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
}

export interface CanonicalTrainRoute {
  trainNumber: string;
  trainName: string;
  type: string;
  originCode: string;
  destinationCode: string;
  stops: RouteStop[];
}

export const CANONICAL_TRAIN_ROUTES: CanonicalTrainRoute[] = [
  {
    trainNumber: "12723",
    trainName: "Telangana Express",
    type: "Superfast",
    originCode: "SC",
    destinationCode: "NDLS",
    stops: [
      {
        stationCode: "SC",
        stopIndex: 0,
        distanceKm: 0,
        scheduledArrival: null,
        scheduledDeparture: "06:00",
      },
      {
        stationCode: "KZJ",
        stopIndex: 1,
        distanceKm: 132,
        scheduledArrival: "08:03",
        scheduledDeparture: "08:05",
      },
      {
        stationCode: "WL",
        stopIndex: 2,
        distanceKm: 142,
        scheduledArrival: "08:18",
        scheduledDeparture: "08:20",
      },
      {
        stationCode: "RDM",
        stopIndex: 3,
        distanceKm: 243,
        scheduledArrival: "09:34",
        scheduledDeparture: "09:35",
      },
      {
        stationCode: "MCI",
        stopIndex: 4,
        distanceKm: 257,
        scheduledArrival: "09:49",
        scheduledDeparture: "09:50",
      },
      {
        stationCode: "BPA",
        stopIndex: 5,
        distanceKm: 277,
        scheduledArrival: "10:04",
        scheduledDeparture: "10:05",
      },
      {
        stationCode: "SKZR",
        stopIndex: 6,
        distanceKm: 315,
        scheduledArrival: "10:39",
        scheduledDeparture: "10:40",
      },
      {
        stationCode: "BPQ",
        stopIndex: 7,
        distanceKm: 385,
        scheduledArrival: "12:15",
        scheduledDeparture: "12:20",
      },
      {
        stationCode: "CD",
        stopIndex: 8,
        distanceKm: 399,
        scheduledArrival: "12:38",
        scheduledDeparture: "12:40",
      },
      {
        stationCode: "NGP",
        stopIndex: 9,
        distanceKm: 593,
        scheduledArrival: "15:20",
        scheduledDeparture: "15:25",
      },
      {
        stationCode: "BPL",
        stopIndex: 10,
        distanceKm: 983,
        scheduledArrival: "21:45",
        scheduledDeparture: "21:55",
      },
      {
        stationCode: "VGLB",
        stopIndex: 11,
        distanceKm: 1275,
        scheduledArrival: "01:30",
        scheduledDeparture: "01:38",
      },
      {
        stationCode: "GWL",
        stopIndex: 12,
        distanceKm: 1372,
        scheduledArrival: "02:45",
        scheduledDeparture: "02:47",
      },
      {
        stationCode: "AGC",
        stopIndex: 13,
        distanceKm: 1490,
        scheduledArrival: "04:25",
        scheduledDeparture: "04:27",
      },
      {
        stationCode: "MTJ",
        stopIndex: 14,
        distanceKm: 1544,
        scheduledArrival: "05:03",
        scheduledDeparture: "05:05",
      },
      {
        stationCode: "NDLS",
        stopIndex: 15,
        distanceKm: 1685,
        scheduledArrival: "07:40",
        scheduledDeparture: null,
      },
    ],
  },
  {
    trainNumber: "12951",
    trainName: "Mumbai Rajdhani Express",
    type: "Rajdhani",
    originCode: "BCT",
    destinationCode: "NDLS",
    stops: [
      {
        stationCode: "BCT",
        stopIndex: 0,
        distanceKm: 0,
        scheduledArrival: null,
        scheduledDeparture: "17:00",
      },
      {
        stationCode: "ST",
        stopIndex: 1,
        distanceKm: 263,
        scheduledArrival: "19:43",
        scheduledDeparture: "19:48",
      },
      {
        stationCode: "BRC",
        stopIndex: 2,
        distanceKm: 393,
        scheduledArrival: "21:06",
        scheduledDeparture: "21:16",
      },
      {
        stationCode: "RTM",
        stopIndex: 3,
        distanceKm: 653,
        scheduledArrival: "00:02",
        scheduledDeparture: "00:05",
      },
      {
        stationCode: "KOTA",
        stopIndex: 4,
        distanceKm: 920,
        scheduledArrival: "03:15",
        scheduledDeparture: "03:20",
      },
      {
        stationCode: "NDLS",
        stopIndex: 5,
        distanceKm: 1386,
        scheduledArrival: "08:32",
        scheduledDeparture: null,
      },
    ],
  },
  {
    trainNumber: "12002",
    trainName: "Bhopal Shatabdi Express",
    type: "Shatabdi",
    originCode: "NDLS",
    destinationCode: "RKMP",
    stops: [
      {
        stationCode: "NDLS",
        stopIndex: 0,
        distanceKm: 0,
        scheduledArrival: null,
        scheduledDeparture: "06:00",
      },
      {
        stationCode: "MTJ",
        stopIndex: 1,
        distanceKm: 141,
        scheduledArrival: "07:19",
        scheduledDeparture: "07:20",
      },
      {
        stationCode: "AGC",
        stopIndex: 2,
        distanceKm: 195,
        scheduledArrival: "07:50",
        scheduledDeparture: "07:55",
      },
      {
        stationCode: "GWL",
        stopIndex: 3,
        distanceKm: 313,
        scheduledArrival: "09:23",
        scheduledDeparture: "09:28",
      },
      {
        stationCode: "VGLB",
        stopIndex: 4,
        distanceKm: 410,
        scheduledArrival: "10:45",
        scheduledDeparture: "10:53",
      },
      {
        stationCode: "BPL",
        stopIndex: 5,
        distanceKm: 702,
        scheduledArrival: "14:07",
        scheduledDeparture: "14:12",
      },
      {
        stationCode: "RKMP",
        stopIndex: 6,
        distanceKm: 708,
        scheduledArrival: "14:40",
        scheduledDeparture: null,
      },
    ],
  },
  {
    trainNumber: "22436",
    trainName: "Vande Bharat Express",
    type: "Vande Bharat",
    originCode: "NDLS",
    destinationCode: "BSB",
    stops: [
      {
        stationCode: "NDLS",
        stopIndex: 0,
        distanceKm: 0,
        scheduledArrival: null,
        scheduledDeparture: "06:00",
      },
      {
        stationCode: "CNB",
        stopIndex: 1,
        distanceKm: 440,
        scheduledArrival: "10:08",
        scheduledDeparture: "10:10",
      },
      {
        stationCode: "BSB",
        stopIndex: 2,
        distanceKm: 759,
        scheduledArrival: "14:00",
        scheduledDeparture: null,
      },
    ],
  },
  {
    trainNumber: "12301",
    trainName: "Howrah Rajdhani Express",
    type: "Rajdhani",
    originCode: "HWH",
    destinationCode: "NDLS",
    stops: [
      {
        stationCode: "HWH",
        stopIndex: 0,
        distanceKm: 0,
        scheduledArrival: null,
        scheduledDeparture: "16:55",
      },
      {
        stationCode: "CNB",
        stopIndex: 1,
        distanceKm: 1013,
        scheduledArrival: "04:50",
        scheduledDeparture: "04:55",
      },
      {
        stationCode: "NDLS",
        stopIndex: 2,
        distanceKm: 1451,
        scheduledArrival: "10:05",
        scheduledDeparture: null,
      },
    ],
  },
  {
    trainNumber: "20901",
    trainName: "Vande Bharat Express",
    type: "Vande Bharat",
    originCode: "BCT",
    destinationCode: "GNC",
    stops: [
      {
        stationCode: "BCT",
        stopIndex: 0,
        distanceKm: 0,
        scheduledArrival: null,
        scheduledDeparture: "06:10",
      },
      {
        stationCode: "ST",
        stopIndex: 1,
        distanceKm: 263,
        scheduledArrival: "08:58",
        scheduledDeparture: "09:01",
      },
      {
        stationCode: "BRC",
        stopIndex: 2,
        distanceKm: 393,
        scheduledArrival: "10:13",
        scheduledDeparture: "10:16",
      },
      {
        stationCode: "GNC",
        stopIndex: 3,
        distanceKm: 522,
        scheduledArrival: "12:25",
        scheduledDeparture: null,
      },
    ],
  },
  {
    trainNumber: "12004",
    trainName: "Lucknow Shatabdi Express",
    type: "Shatabdi",
    originCode: "NDLS",
    destinationCode: "LKO",
    stops: [
      {
        stationCode: "NDLS",
        stopIndex: 0,
        distanceKm: 0,
        scheduledArrival: null,
        scheduledDeparture: "06:10",
      },
      {
        stationCode: "GZB",
        stopIndex: 1,
        distanceKm: 26,
        scheduledArrival: "06:47",
        scheduledDeparture: "06:49",
      },
      {
        stationCode: "CNB",
        stopIndex: 2,
        distanceKm: 440,
        scheduledArrival: "11:20",
        scheduledDeparture: "11:25",
      },
      {
        stationCode: "LKO",
        stopIndex: 3,
        distanceKm: 512,
        scheduledArrival: "12:40",
        scheduledDeparture: null,
      },
    ],
  },
];

export class RailwayGraph {
  static getRoute(trainNumber: string): CanonicalTrainRoute | null {
    const normalized = trainNumber.trim().replace(/\s+/g, "");
    return (
      CANONICAL_TRAIN_ROUTES.find((r) => r.trainNumber === normalized) ?? null
    );
  }

  static validateRoute(
    trainNumber: string,
    boardingCode: string,
    destinationCode: string,
  ): {
    route: CanonicalTrainRoute;
    boardingStop: RouteStop;
    destinationStop: RouteStop;
  } {
    const route = this.getRoute(trainNumber);
    if (!route) {
      throw new AppError("validation", `Unknown train number: ${trainNumber}`);
    }

    const normBoarding =
      normalizeStationInput(boardingCode)?.code ?? boardingCode.toUpperCase();
    const normDest =
      normalizeStationInput(destinationCode)?.code ??
      destinationCode.toUpperCase();

    if (normBoarding === normDest) {
      throw new AppError(
        "validation",
        "Boarding and destination stations must differ",
      );
    }

    const boardingStop = route.stops.find(
      (s) => s.stationCode === normBoarding,
    );
    if (!boardingStop) {
      throw new AppError(
        "validation",
        `Train ${trainNumber} does not stop at ${normBoarding}`,
      );
    }

    const destinationStop = route.stops.find((s) => s.stationCode === normDest);
    if (!destinationStop) {
      throw new AppError(
        "validation",
        `Train ${trainNumber} does not stop at ${normDest}`,
      );
    }

    if (destinationStop.stopIndex <= boardingStop.stopIndex) {
      throw new AppError(
        "validation",
        "Destination must be after boarding station on route",
      );
    }

    return { route, boardingStop, destinationStop };
  }

  /**
   * Deterministic segment overlap calculation.
   * A user journey with interval [uStart, uEnd] overlaps a segment [sStart, sEnd]
   * if and only if max(uStart, sStart) < min(uEnd, sEnd).
   */
  static doSegmentsOverlap(
    userStartIdx: number,
    userEndIdx: number,
    segmentStartIdx: number,
    segmentEndIdx: number,
  ): boolean {
    const overlapStart = Math.max(userStartIdx, segmentStartIdx);
    const overlapEnd = Math.min(userEndIdx, segmentEndIdx);
    return overlapStart < overlapEnd;
  }

  /**
   * Returns list of stations traversed between boarding and destination.
   */
  static getTraversedStops(
    trainNumber: string,
    fromCode: string,
    toCode: string,
  ): RouteStop[] {
    const { route, boardingStop, destinationStop } = this.validateRoute(
      trainNumber,
      fromCode,
      toCode,
    );
    return route.stops.filter(
      (s) =>
        s.stopIndex >= boardingStop.stopIndex &&
        s.stopIndex <= destinationStop.stopIndex,
    );
  }

  /**
   * Progress calculation: percentage completed given current stop index or km.
   */
  static calculateProgress(
    boardingKm: number,
    destKm: number,
    currentKm: number,
  ): { progressPercent: number; distanceRemainingKm: number } {
    const totalKm = Math.max(1, destKm - boardingKm);
    const travelledKm = Math.min(totalKm, Math.max(0, currentKm - boardingKm));
    const progressPercent = Math.round((travelledKm / totalKm) * 100);
    const distanceRemainingKm = Math.max(0, destKm - currentKm);

    return { progressPercent, distanceRemainingKm };
  }
}
