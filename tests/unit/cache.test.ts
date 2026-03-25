import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readCache, writeCache, isCacheFresh, getCachedOrCompute, _setCacheDir } from '../../src/sentiment/cache.js';
import type { SentimentSnapshot } from '../../src/types.js';

function makeSentiment(overrides: Partial<SentimentSnapshot> = {}): SentimentSnapshot {
  return {
    timestamp: new Date().toISOString(),
    markets: { 'test-market': 0.5 },
    signals: [],
    composites: { geopoliticalRisk: 0.5, monetaryPolicyDovish: 0.5, riskAppetite: 0.5 },
    marketCount: 1,
    avgVolume24h: 100000,
    ...overrides,
  };
}

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'polymarket-cache-test-'));
  _setCacheDir(tempDir);
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('cache', () => {
  it('writeCache + readCache round-trip', () => {
    const snapshot = makeSentiment();
    writeCache(snapshot);
    const cached = readCache();
    expect(cached).not.toBeNull();
    expect(cached!.marketCount).toBe(1);
    expect(cached!.cachedAt).toBeDefined();
  });

  it('readCache returns null for missing file', () => {
    const result = readCache();
    expect(result).toBeNull();
  });

  it('readCache returns null for corrupt JSON', () => {
    fs.writeFileSync(path.join(tempDir, 'sentiment.json'), 'not json{{{');
    const result = readCache();
    expect(result).toBeNull();
  });

  it('isCacheFresh: true when within TTL', () => {
    const snapshot = makeSentiment();
    writeCache(snapshot);
    expect(isCacheFresh(3600)).toBe(true);
  });

  it('isCacheFresh: false when expired', () => {
    const snapshot = makeSentiment();
    // Write with old cachedAt
    const data = { ...snapshot, cachedAt: new Date(Date.now() - 7200 * 1000).toISOString() };
    fs.writeFileSync(path.join(tempDir, 'sentiment.json'), JSON.stringify(data));
    expect(isCacheFresh(3600)).toBe(false);
  });

  it('isCacheFresh: false when no cache exists', () => {
    expect(isCacheFresh()).toBe(false);
  });

  it('getCachedOrCompute: returns cached when fresh', async () => {
    const snapshot = makeSentiment({ marketCount: 42 });
    writeCache(snapshot);

    const computeFn = vi.fn().mockResolvedValue(makeSentiment({ marketCount: 99 }));
    const result = await getCachedOrCompute({ ttlSeconds: 3600, computeFn });
    expect(result.marketCount).toBe(42);
    expect(computeFn).not.toHaveBeenCalled();
  });

  it('getCachedOrCompute: recomputes when expired', async () => {
    const oldSnapshot = makeSentiment({ marketCount: 42 });
    const data = { ...oldSnapshot, cachedAt: new Date(Date.now() - 7200 * 1000).toISOString() };
    fs.writeFileSync(path.join(tempDir, 'sentiment.json'), JSON.stringify(data));

    const computeFn = vi.fn().mockResolvedValue(makeSentiment({ marketCount: 99 }));
    const result = await getCachedOrCompute({ ttlSeconds: 3600, computeFn });
    expect(result.marketCount).toBe(99);
    expect(computeFn).toHaveBeenCalled();
  });
});
