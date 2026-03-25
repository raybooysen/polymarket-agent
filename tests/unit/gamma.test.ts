import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMarkets, getEvents, searchMarkets, getMarketBySlug } from '../../src/api/gamma.js';
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

describe('getMarkets', () => {
  it('calls correct URL with params', async () => {
    mockFetch.mockResolvedValue(mockResponse([]));
    await getMarkets({ limit: 10, active: true, order: 'volume24hr', ascending: false });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('gamma-api.polymarket.com/markets');
    expect(url).toContain('limit=10');
    expect(url).toContain('active=true');
    expect(url).toContain('order=volume24hr');
    expect(url).toContain('ascending=false');
  });

  it('returns parsed market array', async () => {
    const markets = [{ id: '1', question: 'Test?' }];
    mockFetch.mockResolvedValue(mockResponse(markets));
    const result = await getMarkets();
    expect(result).toEqual(markets);
  });

  it('returns empty array on error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await getMarkets();
    expect(result).toEqual([]);
  });
});

describe('getEvents', () => {
  it('calls correct URL', async () => {
    mockFetch.mockResolvedValue(mockResponse([]));
    await getEvents({ limit: 5, active: true });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('gamma-api.polymarket.com/events');
    expect(url).toContain('limit=5');
  });
});

describe('searchMarkets', () => {
  it('encodes query parameter', async () => {
    mockFetch.mockResolvedValue(mockResponse([]));
    await searchMarkets('fed rate cut', 5);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('_q=fed+rate+cut');
    expect(url).toContain('limit=5');
  });
});

describe('getMarketBySlug', () => {
  it('returns null for 404', async () => {
    mockFetch.mockResolvedValue(mockResponse([], 200));
    const result = await getMarketBySlug('nonexistent');
    expect(result).toBeNull();
  });
});
