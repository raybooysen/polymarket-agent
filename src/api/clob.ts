import { apiFetch } from './client.js';

const BASE_URL = 'https://clob.polymarket.com';

interface MidpointResponse {
  mid: string;
}

interface OrderbookResponse {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

export async function getMidpoint(tokenId: string): Promise<number> {
  try {
    const url = `${BASE_URL}/midpoint?token_id=${encodeURIComponent(tokenId)}`;
    const data = await apiFetch<MidpointResponse>(url);
    const mid = parseFloat(data.mid);
    return isNaN(mid) ? 0 : mid;
  } catch {
    return 0;
  }
}

export async function getOrderbook(tokenId: string): Promise<{
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}> {
  try {
    const url = `${BASE_URL}/book?token_id=${encodeURIComponent(tokenId)}`;
    const data = await apiFetch<OrderbookResponse>(url);
    return {
      bids: data.bids ?? [],
      asks: data.asks ?? [],
    };
  } catch {
    return { bids: [], asks: [] };
  }
}
