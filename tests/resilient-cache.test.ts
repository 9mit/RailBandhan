import { describe, it, expect } from 'vitest';
import { ResilientCache, CircuitBreaker } from '@/server/cache/resilient-cache';

describe('Resilient Multi-Tier Cache & Circuit Breaker', () => {
  it('stores and retrieves cached items with TTL expiration', async () => {
    const cache = new ResilientCache();
    await cache.set('train:12723:status', { delay: 15 }, { ttlMs: 500 });

    const value = await cache.get<{ delay: number }>('train:12723:status');
    expect(value).not.toBeNull();
    expect(value?.delay).toBe(15);
  });

  it('wraps fetcher functions with transparent caching', async () => {
    const cache = new ResilientCache();
    let callCount = 0;

    const fetcher = async () => {
      callCount += 1;
      return { train: '12951', onTime: true };
    };

    const first = await cache.wrap('train:12951:info', fetcher, { ttlMs: 1000 });
    const second = await cache.wrap('train:12951:info', fetcher, { ttlMs: 1000 });

    expect(first.train).toBe('12951');
    expect(second.train).toBe('12951');
    expect(callCount).toBe(1); // Cached on second call
  });

  it('trips circuit breaker on repeated failures and falls back gracefully', async () => {
    const breaker = new CircuitBreaker(3, 1000); // 3 failures trips breaker
    let primaryAttempts = 0;
    let fallbackCalls = 0;

    const failingPrimary = async () => {
      primaryAttempts += 1;
      throw new Error('External API Down');
    };

    const safeFallback = async () => {
      fallbackCalls += 1;
      return { status: 'fallback_active' };
    };

    // Execute 3 failing attempts
    for (let i = 0; i < 3; i += 1) {
      const res = await breaker.execute(failingPrimary, safeFallback);
      expect(res.status).toBe('fallback_active');
    }

    expect(primaryAttempts).toBe(3);
    expect(fallbackCalls).toBe(3);

    // 4th call: Circuit is OPEN -> primary should not even be called
    const fourth = await breaker.execute(failingPrimary, safeFallback);
    expect(fourth.status).toBe('fallback_active');
    expect(primaryAttempts).toBe(3); // Unchanged!
    expect(fallbackCalls).toBe(4);
  });
});
