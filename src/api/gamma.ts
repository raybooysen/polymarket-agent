import { apiFetch } from './client.js';
import type { GammaMarket, GammaEvent } from '../types.js';

const BASE_URL = 'https://gamma-api.polymarket.com';

export async function getMarkets(params?: {
  limit?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
}): Promise<GammaMarket[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params?.active !== undefined) searchParams.set('active', String(params.active));
  if (params?.closed !== undefined) searchParams.set('closed', String(params.closed));
  if (params?.order) searchParams.set('order', params.order);
  if (params?.ascending !== undefined) searchParams.set('ascending', String(params.ascending));

  const query = searchParams.toString();
  const url = `${BASE_URL}/markets${query ? `?${query}` : ''}`;

  try {
    return await apiFetch<GammaMarket[]>(url);
  } catch {
    return [];
  }
}

export async function getEvents(params?: {
  limit?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
}): Promise<GammaEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params?.active !== undefined) searchParams.set('active', String(params.active));
  if (params?.closed !== undefined) searchParams.set('closed', String(params.closed));
  if (params?.order) searchParams.set('order', params.order);
  if (params?.ascending !== undefined) searchParams.set('ascending', String(params.ascending));

  const query = searchParams.toString();
  const url = `${BASE_URL}/events${query ? `?${query}` : ''}`;

  try {
    return await apiFetch<GammaEvent[]>(url);
  } catch {
    return [];
  }
}

export async function searchMarkets(query: string, limit?: number, activeOnly: boolean = true): Promise<GammaMarket[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('_q', query);
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (activeOnly) {
    searchParams.set('active', 'true');
    searchParams.set('closed', 'false');
  }
  searchParams.set('order', 'volume24hr');
  searchParams.set('ascending', 'false');

  const url = `${BASE_URL}/markets?${searchParams.toString()}`;

  try {
    return await apiFetch<GammaMarket[]>(url);
  } catch {
    return [];
  }
}

export async function getMarketBySlug(slug: string): Promise<GammaMarket | null> {
  const url = `${BASE_URL}/markets?slug=${encodeURIComponent(slug)}`;

  try {
    const markets = await apiFetch<GammaMarket[]>(url);
    return markets.length > 0 ? markets[0] : null;
  } catch {
    return null;
  }
}
