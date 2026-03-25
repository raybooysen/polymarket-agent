import { apiFetch } from './client.js';
import type { GammaMarket, GammaEvent } from '../types.js';

const BASE_URL = 'https://gamma-api.polymarket.com';

export async function getMarkets(params?: {
  limit?: number;
  active?: boolean;
  order?: string;
  ascending?: boolean;
}): Promise<GammaMarket[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params?.active !== undefined) searchParams.set('active', String(params.active));
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
  order?: string;
}): Promise<GammaEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params?.active !== undefined) searchParams.set('active', String(params.active));
  if (params?.order) searchParams.set('order', params.order);

  const query = searchParams.toString();
  const url = `${BASE_URL}/events${query ? `?${query}` : ''}`;

  try {
    return await apiFetch<GammaEvent[]>(url);
  } catch {
    return [];
  }
}

export async function searchMarkets(query: string, limit?: number): Promise<GammaMarket[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('_q', query);
  if (limit !== undefined) searchParams.set('limit', String(limit));

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
