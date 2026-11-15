import type {
  NormalizedTrainLiveStatus,
  RouteGeometry,
  StationSearchResult,
  TrainSearchResult,
} from "../types";

export interface RailwayDataProvider {
  getProviderName(): string;
  getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<NormalizedTrainLiveStatus | null>;
  getRouteGeometry(trainNumber: string): Promise<RouteGeometry | null>;
  searchTrains(query: string): Promise<TrainSearchResult[]>;
  searchStations(query: string): Promise<StationSearchResult[]>;
}
