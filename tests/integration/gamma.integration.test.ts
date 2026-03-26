import { describe, it, expect } from 'vitest';
import { getMarkets, getEvents, searchMarkets } from '../../src/api/gamma.js';

describe('Gamma API Integration', () => {
  it('fetches markets and returns array with >0 results', { timeout: 30000 }, async () => {
    const markets = await getMarkets({ limit: 10, active: true });
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBeGreaterThan(0);
  });

  it('each market has required fields', { timeout: 30000 }, async () => {
    const markets = await getMarkets({ limit: 5, active: true });
    for (const market of markets) {
      expect(market).toHaveProperty('question');
      expect(market).toHaveProperty('outcomePrices');
      expect(typeof market.volume24hr).toBe('number');
    }
  });

  it('events endpoint returns array with >0 results', { timeout: 30000 }, async () => {
    const events = await getEvents({ limit: 5, active: true });
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it('search for "bitcoin" returns relevant results', { timeout: 30000 }, async () => {
    const results = await searchMarkets('bitcoin', 5);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('closed=false excludes resolved markets', { timeout: 30000 }, async () => {
    const markets = await getMarkets({ limit: 20, active: true, closed: false });
    for (const market of markets) {
      expect(market.closed).toBe(false);
    }
  });

  it('volume sort returns highest-volume markets first', { timeout: 30000 }, async () => {
    const markets = await getMarkets({ limit: 10, active: true, closed: false, order: 'volume24hr', ascending: false });
    expect(markets.length).toBeGreaterThan(0);
    for (let i = 1; i < markets.length; i++) {
      expect(markets[i - 1].volume24hr).toBeGreaterThanOrEqual(markets[i].volume24hr);
    }
  });
});
