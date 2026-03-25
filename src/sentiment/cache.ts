import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { SentimentSnapshot } from '../types.js';

let CACHE_DIR = path.join(os.homedir(), '.cache', 'polymarket');
const CACHE_FILE = 'sentiment.json';
const DEFAULT_TTL = 1800; // 30 minutes

/** Override cache directory (for testing) */
export function _setCacheDir(dir: string): void {
  CACHE_DIR = dir;
}

/** Get current cache directory */
export function _getCacheDir(): string {
  return CACHE_DIR;
}

function getCachePath(): string {
  return path.join(CACHE_DIR, CACHE_FILE);
}

export function readCache(): SentimentSnapshot | null {
  try {
    const data = fs.readFileSync(getCachePath(), 'utf-8');
    return JSON.parse(data) as SentimentSnapshot;
  } catch {
    return null;
  }
}

export function writeCache(snapshot: SentimentSnapshot): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const data = { ...snapshot, cachedAt: new Date().toISOString() };
    fs.writeFileSync(getCachePath(), JSON.stringify(data));
  } catch {
    // Silently fail — cache is best-effort
  }
}

export function isCacheFresh(ttlSeconds?: number): boolean {
  const cached = readCache();
  if (!cached?.cachedAt) return false;

  const ttl = ttlSeconds ?? DEFAULT_TTL;
  const cachedTime = new Date(cached.cachedAt).getTime();
  const now = Date.now();

  return (now - cachedTime) < ttl * 1000;
}

export async function getCachedOrCompute(options?: {
  ttlSeconds?: number;
  noCache?: boolean;
  computeFn?: () => Promise<SentimentSnapshot>;
}): Promise<SentimentSnapshot> {
  if (!options?.noCache && isCacheFresh(options?.ttlSeconds)) {
    const cached = readCache();
    if (cached) return cached;
  }

  if (!options?.computeFn) {
    throw new Error('No compute function provided and cache is stale');
  }

  return options.computeFn();
}
