import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MarketSignal, SentimentSnapshot } from '../../src/types.js';

vi.mock('../../src/api/gamma.js', () => ({
  getMarkets: vi.fn().mockResolvedValue([
    {
      id: '1',
      question: 'Fed rate cut?',
      slug: 'fed-rate-cut',
      conditionId: '0x1',
      outcomePrices: '["0.60","0.40"]',
      volume: 5000000,
      volume24hr: 300000,
      active: true,
      closed: false,
      endDate: '2025-12-31T00:00:00Z',
      description: 'Test',
      tags: [],
    },
  ]),
}));

vi.mock('../../src/sentiment/cache.js', () => ({
  getCachedOrCompute: vi.fn().mockImplementation(async (opts: { computeFn?: () => Promise<SentimentSnapshot> }) => {
    if (opts?.computeFn) return opts.computeFn();
    throw new Error('no compute fn');
  }),
  writeCache: vi.fn(),
}));

import { computeComposites } from '../../src/sentiment/compute.js';

function makeSignal(overrides: Partial<MarketSignal> = {}): MarketSignal {
  return {
    question: 'Test market?',
    slug: 'test',
    yesPrice: 0.5,
    noPrice: 0.5,
    volume24hr: 200000,
    volume: 1000000,
    category: 'other',
    url: 'https://polymarket.com/event/test',
    ...overrides,
  };
}

describe('computeComposites', () => {
  it('returns default values for empty input', () => {
    const result = computeComposites([]);
    expect(result.geopoliticalRisk).toBeGreaterThanOrEqual(0);
    expect(result.geopoliticalRisk).toBeLessThanOrEqual(1);
    expect(result.monetaryPolicyDovish).toBeGreaterThanOrEqual(0);
    expect(result.monetaryPolicyDovish).toBeLessThanOrEqual(1);
    expect(result.riskAppetite).toBeGreaterThanOrEqual(0);
    expect(result.riskAppetite).toBeLessThanOrEqual(1);
  });

  it('calculates geopoliticalRisk from ceasefire/escalation markets', () => {
    const signals = [
      makeSignal({ question: 'Ceasefire in Ukraine?', category: 'geopolitical', yesPrice: 0.3 }),
      makeSignal({ question: 'Military invasion?', category: 'geopolitical', yesPrice: 0.7 }),
    ];
    const result = computeComposites(signals);
    // geoRisk = 1 - 0.3 (ceasefire avg) + 0.7 (escalation avg) = 1.4 → clamped to 1
    expect(result.geopoliticalRisk).toBeGreaterThan(0);
    expect(result.geopoliticalRisk).toBeLessThanOrEqual(1);
  });

  it('clamps geopoliticalRisk to [0,1]', () => {
    const signals = [
      makeSignal({ question: 'Ceasefire deal?', category: 'geopolitical', yesPrice: 0.9 }),
    ];
    const result = computeComposites(signals);
    expect(result.geopoliticalRisk).toBeGreaterThanOrEqual(0);
    expect(result.geopoliticalRisk).toBeLessThanOrEqual(1);
  });

  it('calculates monetaryPolicyDovish from rate cut markets', () => {
    const signals = [
      makeSignal({ question: 'Fed rate cut in June?', category: 'monetary_policy', yesPrice: 0.7, volume24hr: 500000 }),
    ];
    const result = computeComposites(signals);
    expect(result.monetaryPolicyDovish).toBeCloseTo(0.7, 1);
  });

  it('volume-weights monetary policy signals', () => {
    const signals = [
      makeSignal({ question: 'Fed rate cut June?', category: 'monetary_policy', yesPrice: 0.8, volume24hr: 800000 }),
      makeSignal({ question: 'Fed rate cut July?', category: 'monetary_policy', yesPrice: 0.4, volume24hr: 200000 }),
    ];
    const result = computeComposites(signals);
    // Weighted: (0.8*800000 + 0.4*200000) / (800000+200000) = 720000/1000000 = 0.72
    expect(result.monetaryPolicyDovish).toBeCloseTo(0.72, 1);
  });

  it('calculates riskAppetite as average of three signals', () => {
    const signals = [
      makeSignal({ question: 'Bitcoin moon?', category: 'crypto', yesPrice: 0.8 }),
      makeSignal({ question: 'Ceasefire deal?', category: 'geopolitical', yesPrice: 0.6 }),
      makeSignal({ question: 'Fed rate cut?', category: 'monetary_policy', yesPrice: 0.5, volume24hr: 300000 }),
    ];
    const result = computeComposites(signals);
    expect(result.riskAppetite).toBeGreaterThan(0);
    expect(result.riskAppetite).toBeLessThanOrEqual(1);
  });

  it('handles single category present', () => {
    const signals = [
      makeSignal({ question: 'Bitcoin to $200k?', category: 'crypto', yesPrice: 0.3 }),
    ];
    const result = computeComposites(signals);
    expect(result.geopoliticalRisk).toBeDefined();
    expect(result.monetaryPolicyDovish).toBeDefined();
    expect(result.riskAppetite).toBeDefined();
  });

  it('all values between 0 and 1', () => {
    const signals = [
      makeSignal({ question: 'War escalation?', category: 'geopolitical', yesPrice: 0.95 }),
      makeSignal({ question: 'Bitcoin crash?', category: 'crypto', yesPrice: 0.05 }),
      makeSignal({ question: 'Rate hike?', category: 'monetary_policy', yesPrice: 0.1, volume24hr: 100000 }),
    ];
    const result = computeComposites(signals);
    expect(result.geopoliticalRisk).toBeGreaterThanOrEqual(0);
    expect(result.geopoliticalRisk).toBeLessThanOrEqual(1);
    expect(result.monetaryPolicyDovish).toBeGreaterThanOrEqual(0);
    expect(result.monetaryPolicyDovish).toBeLessThanOrEqual(1);
    expect(result.riskAppetite).toBeGreaterThanOrEqual(0);
    expect(result.riskAppetite).toBeLessThanOrEqual(1);
  });
});

describe('computeSentiment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid SentimentSnapshot shape', async () => {
    const { computeSentiment } = await import('../../src/sentiment/compute.js');
    const snapshot = await computeSentiment({ noCache: true });
    expect(snapshot).toHaveProperty('timestamp');
    expect(snapshot).toHaveProperty('markets');
    expect(snapshot).toHaveProperty('signals');
    expect(snapshot).toHaveProperty('composites');
    expect(snapshot).toHaveProperty('marketCount');
    expect(snapshot).toHaveProperty('avgVolume24h');
  });

  it('includes timestamp in ISO format', async () => {
    const { computeSentiment } = await import('../../src/sentiment/compute.js');
    const snapshot = await computeSentiment({ noCache: true });
    expect(snapshot.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
