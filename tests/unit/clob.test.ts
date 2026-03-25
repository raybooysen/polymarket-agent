import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMidpoint, getOrderbook } from '../../src/api/clob.js';
import { _resetRateLimit } from '../../src/api/client.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  _resetRateLimit();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as Response;
}

describe('getMidpoint', () => {
  it('parses midpoint from response', async () => {
    mockFetch.mockResolvedValue(mockResponse({ mid: '0.4567' }));
    const result = await getMidpoint('token123');
    expect(result).toBeCloseTo(0.4567);
  });

  it('returns 0 on error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await getMidpoint('token123');
    expect(result).toBe(0);
  });
});

describe('getOrderbook', () => {
  it('returns bids and asks arrays', async () => {
    const book = {
      bids: [{ price: '0.45', size: '100' }],
      asks: [{ price: '0.46', size: '150' }],
    };
    mockFetch.mockResolvedValue(mockResponse(book));
    const result = await getOrderbook('token123');
    expect(result.bids).toHaveLength(1);
    expect(result.asks).toHaveLength(1);
    expect(result.bids[0].price).toBe('0.45');
  });

  it('handles empty orderbook', async () => {
    mockFetch.mockResolvedValue(mockResponse({ bids: [], asks: [] }));
    const result = await getOrderbook('token123');
    expect(result.bids).toEqual([]);
    expect(result.asks).toEqual([]);
  });
});
