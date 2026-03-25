import { describe, it, expect } from 'vitest';
import { categoriseMarket, extractPrice, filterRelevantMarkets } from '../../src/sentiment/filter.js';
import type { GammaMarket } from '../../src/types.js';

function makeMarket(overrides: Partial<GammaMarket> = {}): GammaMarket {
  return {
    id: '1',
    question: 'Test market?',
    slug: 'test-market',
    conditionId: '0x123',
    outcomePrices: '["0.50","0.50"]',
    volume: 1000000,
    volume24hr: 200000,
    active: true,
    closed: false,
    endDate: '2025-12-31T00:00:00Z',
    description: 'A test market',
    tags: [],
    ...overrides,
  };
}

describe('categoriseMarket', () => {
  it('matches monetary_policy keywords', () => {
    expect(categoriseMarket('Will the Fed cut rates?')).toBe('monetary_policy');
    expect(categoriseMarket('FOMC meeting outcome')).toBe('monetary_policy');
    expect(categoriseMarket('Powell interest rate decision')).toBe('monetary_policy');
  });

  it('matches geopolitical keywords', () => {
    expect(categoriseMarket('Will there be a ceasefire in Ukraine?')).toBe('geopolitical');
    expect(categoriseMarket('Iran military action')).toBe('geopolitical');
    expect(categoriseMarket('New sanctions imposed')).toBe('geopolitical');
  });

  it('matches economic keywords', () => {
    expect(categoriseMarket('Will there be a recession?')).toBe('economic');
    expect(categoriseMarket('GDP growth above 3%')).toBe('economic');
    expect(categoriseMarket('CPI inflation reading')).toBe('economic');
  });

  it('matches crypto keywords', () => {
    expect(categoriseMarket('Bitcoin to $100k?')).toBe('crypto');
    expect(categoriseMarket('Will ETH reach $5000?')).toBe('crypto');
    expect(categoriseMarket('ETF approval for crypto')).toBe('crypto');
  });

  it('matches trade_policy keywords', () => {
    expect(categoriseMarket('New tariff on China?')).toBe('trade_policy');
    expect(categoriseMarket('Trade war escalation')).toBe('trade_policy');
    expect(categoriseMarket('Export ban on chips')).toBe('trade_policy');
  });

  it('returns other for unmatched', () => {
    expect(categoriseMarket('Who will win the Super Bowl?')).toBe('other');
    expect(categoriseMarket('Next president of France?')).toBe('other');
  });

  it('is case insensitive', () => {
    expect(categoriseMarket('WILL THE FED CUT RATES?')).toBe('monetary_policy');
    expect(categoriseMarket('BITCOIN price prediction')).toBe('crypto');
    expect(categoriseMarket('Ukraine CEASEFIRE')).toBe('geopolitical');
  });
});

describe('extractPrice', () => {
  it('parses valid outcomePrices string', () => {
    const result = extractPrice('["0.185","0.815"]');
    expect(result.yes).toBeCloseTo(0.185);
    expect(result.no).toBeCloseTo(0.815);
  });

  it('handles malformed input', () => {
    expect(extractPrice('invalid')).toEqual({ yes: 0, no: 0 });
    expect(extractPrice('')).toEqual({ yes: 0, no: 0 });
    expect(extractPrice('[]')).toEqual({ yes: 0, no: 0 });
  });
});

describe('filterRelevantMarkets', () => {
  it('filters by volume threshold', () => {
    const markets = [
      makeMarket({ question: 'Fed rate cut?', volume24hr: 200000 }),
      makeMarket({ question: 'Fed rate hike?', volume24hr: 50000 }),
    ];
    const signals = filterRelevantMarkets(markets, 100000);
    expect(signals).toHaveLength(1);
    expect(signals[0].question).toBe('Fed rate cut?');
  });

  it('only includes active, non-closed markets', () => {
    const markets = [
      makeMarket({ question: 'Bitcoin price?', active: true, closed: false, volume24hr: 200000 }),
      makeMarket({ question: 'Bitcoin crash?', active: false, closed: false, volume24hr: 200000 }),
      makeMarket({ question: 'Bitcoin moon?', active: true, closed: true, volume24hr: 200000 }),
    ];
    const signals = filterRelevantMarkets(markets, 100000);
    expect(signals).toHaveLength(1);
    expect(signals[0].question).toBe('Bitcoin price?');
  });

  it('returns empty for no matches', () => {
    const markets = [
      makeMarket({ question: 'Who wins Survivor?', volume24hr: 200000 }),
    ];
    const signals = filterRelevantMarkets(markets, 100000);
    expect(signals).toHaveLength(0);
  });
});
