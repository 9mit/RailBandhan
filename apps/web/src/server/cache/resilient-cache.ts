export interface CacheOptions {
  ttlMs?: number;
  staleWhileRevalidateMs?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleUntil: number;
}

export class ResilientCache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private revalidating = new Set<string>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.staleUntil) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  isFresh(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.expiresAt;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttlMs ?? 60_000;
    const swr = options?.staleWhileRevalidateMs ?? ttl * 2;
    const now = Date.now();

    this.memoryCache.set(key, {
      value,
      expiresAt: now + ttl,
      staleUntil: now + swr,
    });
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async wrap<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      // If stale (not fresh), trigger background revalidation
      if (!this.isFresh(key) && !this.revalidating.has(key)) {
        this.revalidating.add(key);
        fetcher()
          .then((fresh) => this.set(key, fresh, options))
          .catch(() => {})
          .finally(() => this.revalidating.delete(key));
      }
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, options);
    return fresh;
  }
}


export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeoutMs: number = 30_000,
  ) {}

  async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        return fallback();
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount += 1;
      this.lastFailureTime = now;
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
      }
      return fallback();
    }
  }
}

let globalCacheInstance: ResilientCache | null = null;

export function getResilientCache(): ResilientCache {
  if (!globalCacheInstance) {
    globalCacheInstance = new ResilientCache();
  }
  return globalCacheInstance;
}
