import { describe, it, expect } from 'vitest';
import { computeSentiment } from '../../src/sentiment/compute.js';

describe('Sentiment Integration', () => {
  it('computeSentiment returns valid SentimentSnapshot', { timeout: 30000 }, async () => {
    const snapshot = await computeSentiment({ noCache: true });
    expect(snapshot).toHaveProperty('timestamp');
    expect(snapshot).toHaveProperty('composites');
    expect(snapshot).toHaveProperty('signals');
    expect(snapshot).toHaveProperty('marketCount');
    expect(snapshot).toHaveProperty('avgVolume24h');
  });

  it('all composite values are between 0 and 1', { timeout: 30000 }, async () => {
    const snapshot = await computeSentiment({ noCache: true });
    const { composites } = snapshot;
    expect(composites.geopoliticalRisk).toBeGreaterThanOrEqual(0);
    expect(composites.geopoliticalRisk).toBeLessThanOrEqual(1);
    expect(composites.monetaryPolicyDovish).toBeGreaterThanOrEqual(0);
    expect(composites.monetaryPolicyDovish).toBeLessThanOrEqual(1);
    expect(composites.riskAppetite).toBeGreaterThanOrEqual(0);
    expect(composites.riskAppetite).toBeLessThanOrEqual(1);
  });

  it('marketCount >= 0', { timeout: 30000 }, async () => {
    const snapshot = await computeSentiment({ noCache: true });
    expect(snapshot.marketCount).toBeGreaterThanOrEqual(0);
  });

  it('returns non-zero markets (verifies closed markets are excluded)', { timeout: 30000 }, async () => {
    const snapshot = await computeSentiment({ noCache: true, minVolume: 0 });
    expect(snapshot.marketCount).toBeGreaterThan(0);
    expect(snapshot.signals.length).toBeGreaterThan(0);
  });

  it('signals only contain non-closed markets with real prices', { timeout: 30000 }, async () => {
    const snapshot = await computeSentiment({ noCache: true, minVolume: 0 });
    for (const signal of snapshot.signals) {
      // Every signal should have a non-zero yes or no price (not both 0 like resolved markets)
      expect(signal.yesPrice + signal.noPrice).toBeGreaterThan(0);
      expect(signal.url).toContain('polymarket.com');
    }
  });
});
