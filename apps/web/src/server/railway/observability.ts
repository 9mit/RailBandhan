import type { ProviderHealthScore } from './types';

export interface RailwayTelemetryLog {
  id: string;
  provider: string;
  endpoint: string;
  targetId: string; // trainNumber or stationCode
  timestamp: string;
  latencyMs: number;
  status: 'success' | 'error' | 'fallback' | 'circuit_broken';
  cacheHit: boolean;
  freshnessSeconds: number;
  errorMessage?: string;
}

export class RailwayObservability {
  private static logs: RailwayTelemetryLog[] = [];
  private static maxLogs = 500;
  private static providerStats = new Map<
    string,
    {
      total: number;
      success: number;
      failed: number;
      latencies: number[];
      cacheHits: number;
      freshnessValues: number[];
      consecutiveFailures: number;
      lastSuccess: string | null;
      lastFailure: string | null;
    }
  >();

  static recordRequest(log: Omit<RailwayTelemetryLog, 'id'>): void {
    const entry: RailwayTelemetryLog = {
      id: crypto.randomUUID(),
      ...log,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    let stats = this.providerStats.get(log.provider);
    if (!stats) {
      stats = {
        total: 0,
        success: 0,
        failed: 0,
        latencies: [],
        cacheHits: 0,
        freshnessValues: [],
        consecutiveFailures: 0,
        lastSuccess: null,
        lastFailure: null,
      };
      this.providerStats.set(log.provider, stats);
    }

    stats.total++;
    if (log.cacheHit) {
      stats.cacheHits++;
    }

    if (log.status === 'success') {
      stats.success++;
      stats.consecutiveFailures = 0;
      stats.lastSuccess = log.timestamp;
      stats.latencies.push(log.latencyMs);
      if (stats.latencies.length > 100) stats.latencies.shift();
      stats.freshnessValues.push(log.freshnessSeconds);
      if (stats.freshnessValues.length > 100) stats.freshnessValues.shift();
    } else if (log.status === 'error' || log.status === 'circuit_broken') {
      stats.failed++;
      stats.consecutiveFailures++;
      stats.lastFailure = log.timestamp;
    }
  }

  static getHealthScore(providerName: string): ProviderHealthScore {
    const stats = this.providerStats.get(providerName);
    if (!stats || stats.total === 0) {
      return {
        providerName,
        availabilityPercent: 100,
        averageLatencyMs: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        cacheHitRatio: 0,
        averageFreshnessSeconds: 0,
        lastSuccessTimestamp: null,
        lastFailureTimestamp: null,
        isHealthy: true,
        consecutiveFailures: 0,
      };
    }

    const avgLatency =
      stats.latencies.length > 0
        ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length)
        : 0;

    const avgFreshness =
      stats.freshnessValues.length > 0
        ? Math.round(stats.freshnessValues.reduce((a, b) => a + b, 0) / stats.freshnessValues.length)
        : 0;

    const nonCacheTotal = Math.max(1, stats.total - stats.cacheHits);
    const availability = Number(((stats.success / nonCacheTotal) * 100).toFixed(1));
    const cacheHitRatio = Number((stats.cacheHits / stats.total).toFixed(3));

    return {
      providerName,
      availabilityPercent: Math.min(100, availability),
      averageLatencyMs: avgLatency,
      totalRequests: stats.total,
      successfulRequests: stats.success,
      failedRequests: stats.failed,
      cacheHitRatio,
      averageFreshnessSeconds: avgFreshness,
      lastSuccessTimestamp: stats.lastSuccess,
      lastFailureTimestamp: stats.lastFailure,
      isHealthy: stats.consecutiveFailures < 5,
      consecutiveFailures: stats.consecutiveFailures,
    };
  }

  static getAllProviderHealth(): ProviderHealthScore[] {
    const result: ProviderHealthScore[] = [];
    for (const name of this.providerStats.keys()) {
      result.push(this.getHealthScore(name));
    }
    return result;
  }

  static getRecentLogs(limit = 50): RailwayTelemetryLog[] {
    return this.logs.slice(0, limit);
  }

  static reset(): void {
    this.logs = [];
    this.providerStats.clear();
  }
}
