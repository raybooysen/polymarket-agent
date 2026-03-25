import { describe, it, expect } from 'vitest';
import { getMarkets } from '../../src/api/gamma.js';
import { getMidpoint, getOrderbook } from '../../src/api/clob.js';

describe('CLOB API Integration', () => {
  it('fetches midpoint for an active market', { timeout: 30000 }, async () => {
    const markets = await getMarkets({ limit: 5, active: true });
    expect(markets.length).toBeGreaterThan(0);

    const market = markets[0];
    const mid = await getMidpoint(market.conditionId);
    expect(typeof mid).toBe('number');
    expect(mid).toBeGreaterThanOrEqual(0);
    expect(mid).toBeLessThanOrEqual(1);
  });

  it('fetches orderbook shape', { timeout: 30000 }, async () => {
    const markets = await getMarkets({ limit: 5, active: true });
    expect(markets.length).toBeGreaterThan(0);

    const market = markets[0];
    const book = await getOrderbook(market.conditionId);
    expect(book).toHaveProperty('bids');
    expect(book).toHaveProperty('asks');
    expect(Array.isArray(book.bids)).toBe(true);
    expect(Array.isArray(book.asks)).toBe(true);
  });
});
