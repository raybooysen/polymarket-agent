import type { MarketSignal, CompositeSignals, SentimentSnapshot } from '../types.js';
import { getMarkets } from '../api/gamma.js';
import { filterRelevantMarkets } from './filter.js';
import { getCachedOrCompute, writeCache } from './cache.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function weightedAvg(values: Array<{ value: number; weight: number }>): number {
  if (values.length === 0) return 0;
  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return 0;
  return values.reduce((sum, v) => sum + v.value * v.weight, 0) / totalWeight;
}

export function computeComposites(signals: MarketSignal[]): CompositeSignals {
  // Geopolitical risk
  const geoSignals = signals.filter(s => s.category === 'geopolitical');
  const ceasefireMarkets = geoSignals.filter(s =>
    s.question.toLowerCase().includes('ceasefire')
  );
  const escalationMarkets = geoSignals.filter(s =>
    !s.question.toLowerCase().includes('ceasefire')
  );

  const ceasefireAvg = avg(ceasefireMarkets.map(s => s.yesPrice));
  const escalationAvg = avg(escalationMarkets.map(s => s.yesPrice));
  const geopoliticalRisk = clamp(1 - ceasefireAvg + escalationAvg, 0, 1);

  // Monetary policy dovish
  const monetarySignals = signals.filter(s => s.category === 'monetary_policy');
  const rateCutMarkets = monetarySignals.filter(s =>
    s.question.toLowerCase().includes('rate cut') ||
    s.question.toLowerCase().includes('cut') ||
    s.question.toLowerCase().includes('dovish') ||
    s.question.toLowerCase().includes('lower')
  );

  const monetaryPolicyDovish = rateCutMarkets.length > 0
    ? weightedAvg(rateCutMarkets.map(s => ({ value: s.yesPrice, weight: s.volume24hr })))
    : (monetarySignals.length > 0
        ? weightedAvg(monetarySignals.map(s => ({ value: s.yesPrice, weight: s.volume24hr })))
        : 0.5);

  // Risk appetite
  const cryptoSignals = signals.filter(s => s.category === 'crypto');
  const btcBullish = avg(cryptoSignals.map(s => s.yesPrice)) || 0.5;

  const riskAppetite = clamp(
    (btcBullish + (1 - geopoliticalRisk) + monetaryPolicyDovish) / 3,
    0,
    1
  );

  return {
    geopoliticalRisk: Math.round(geopoliticalRisk * 1000) / 1000,
    monetaryPolicyDovish: Math.round(monetaryPolicyDovish * 1000) / 1000,
    riskAppetite: Math.round(riskAppetite * 1000) / 1000,
  };
}

export async function computeSentiment(options?: {
  minVolume?: number;
  noCache?: boolean;
  cacheTtl?: number;
}): Promise<SentimentSnapshot> {
  if (!options?.noCache) {
    return getCachedOrCompute({
      ttlSeconds: options?.cacheTtl,
      noCache: false,
      computeFn: () => computeFresh(options?.minVolume),
    });
  }

  return computeFresh(options?.minVolume);
}

async function computeFresh(minVolume?: number): Promise<SentimentSnapshot> {
  const rawMarkets = await getMarkets({ active: true, limit: 500 });
  const signals = filterRelevantMarkets(rawMarkets, minVolume);
  const composites = computeComposites(signals);

  const marketsMap: Record<string, number> = {};
  for (const signal of signals) {
    marketsMap[signal.slug] = signal.yesPrice;
  }

  const totalVolume = signals.reduce((sum, s) => sum + s.volume24hr, 0);

  const snapshot: SentimentSnapshot = {
    timestamp: new Date().toISOString(),
    markets: marketsMap,
    signals,
    composites,
    marketCount: signals.length,
    avgVolume24h: signals.length > 0 ? Math.round(totalVolume / signals.length) : 0,
  };

  writeCache(snapshot);
  return snapshot;
}
