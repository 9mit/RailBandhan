import type {
  NormalizedTrainLiveStatus,
  RouteGeometry,
  StationSearchResult,
  TrainSearchResult,
} from "../types";
import type { RailwayDataProvider } from "./base";
import { DeterministicRailwayProvider } from "./deterministic";

export class MockRailwayProvider implements RailwayDataProvider {
  private deterministic = new DeterministicRailwayProvider();

  getProviderName(): string {
    return "MockSimulation";
  }

  async getLiveStatus(
    trainNumber: string,
    journeyDate: string,
  ): Promise<NormalizedTrainLiveStatus | null> {
    const status = await this.deterministic.getLiveStatus(
      trainNumber,
      journeyDate,
    );
    if (status) {
      status.sourceProvider = "MockSimulation";
      status.confidence = "estimated";
    }
    return status;
  }

  async getRouteGeometry(trainNumber: string): Promise<RouteGeometry | null> {
    return this.deterministic.getRouteGeometry(trainNumber);
  }

  async searchTrains(query: string): Promise<TrainSearchResult[]> {
    return this.deterministic.searchTrains(query);
  }

  async searchStations(query: string): Promise<StationSearchResult[]> {
    return this.deterministic.searchStations(query);
  }
}
