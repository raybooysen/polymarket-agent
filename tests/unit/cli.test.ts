import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all API modules before importing anything
vi.mock('../../src/api/gamma.js', () => ({
  getMarkets: vi.fn().mockResolvedValue([
    {
      id: '1',
      question: 'Will the Fed cut rates?',
      slug: 'fed-rate-cut',
      conditionId: '0x1',
      outcomePrices: '["0.60","0.40"]',
      volume: 5000000,
      volume24hr: 300000,
      active: true,
      closed: false,
      endDate: '2025-12-31T00:00:00Z',
      description: 'Test',
      tags: [],
    },
    {
      id: '2',
      question: 'Bitcoin to 100k?',
      slug: 'btc-100k',
      conditionId: '0x2',
      outcomePrices: '["0.70","0.30"]',
      volume: 8000000,
      volume24hr: 500000,
      active: true,
      closed: false,
      endDate: '2025-12-31T00:00:00Z',
      description: 'Crypto test',
      tags: [],
    },
  ]),
  getEvents: vi.fn().mockResolvedValue([
    { id: 'e1', title: 'Fed Rate Decision', slug: 'fed-rate', markets: [], volume: 15000000, active: true },
  ]),
  searchMarkets: vi.fn().mockResolvedValue([
    {
      id: '1',
      question: 'Fed rate cut?',
      slug: 'fed-rate-cut',
      conditionId: '0x1',
      outcomePrices: '["0.60","0.40"]',
      volume: 5000000,
      volume24hr: 300000,
      active: true,
      closed: false,
      endDate: '2025-12-31T00:00:00Z',
      description: 'Test',
      tags: [],
    },
  ]),
  getMarketBySlug: vi.fn().mockResolvedValue({
    id: '1',
    question: 'Fed rate cut?',
    slug: 'fed-rate-cut',
    conditionId: '0x1',
    outcomePrices: '["0.60","0.40"]',
    volume: 5000000,
    volume24hr: 300000,
    active: true,
    closed: false,
    endDate: '2025-12-31T00:00:00Z',
    description: 'Test',
    tags: [],
  }),
}));

vi.mock('../../src/sentiment/cache.js', () => ({
  getCachedOrCompute: vi.fn().mockImplementation(async (opts: { computeFn?: () => Promise<unknown> }) => {
    if (opts?.computeFn) return opts.computeFn();
    throw new Error('no fn');
  }),
  writeCache: vi.fn(),
  readCache: vi.fn().mockReturnValue(null),
  isCacheFresh: vi.fn().mockReturnValue(false),
  _setCacheDir: vi.fn(),
  _getCacheDir: vi.fn().mockReturnValue('/tmp'),
}));

import { execSync } from 'node:child_process';
import path from 'node:path';

const CLI_PATH = path.resolve('src/index.ts');
const TSX = path.resolve('node_modules/.bin/tsx');

function runCli(args: string): string {
  try {
    return execSync(`${TSX} ${CLI_PATH} ${args}`, {
      encoding: 'utf-8',
      timeout: 30000,
      cwd: path.resolve('.'),
    });
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string };
    return error.stdout || error.stderr || '';
  }
}

describe('CLI', () => {
  it('--version returns version string', () => {
    const output = runCli('--version');
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('--help returns usage text', () => {
    const output = runCli('--help');
    expect(output).toContain('polymarket');
    expect(output).toContain('sentiment');
  });

  it('markets returns valid JSON', () => {
    const output = runCli('markets');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('sentiment returns valid JSON with composites', () => {
    const output = runCli('sentiment --no-cache');
    const data = JSON.parse(output);
    expect(data).toHaveProperty('composites');
    expect(data).toHaveProperty('timestamp');
  });

  it('search requires a query argument', () => {
    const output = runCli('search');
    expect(output).toContain("missing required argument");
  });

  it('search "test" returns valid JSON', () => {
    const output = runCli('search "test"');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('events returns valid JSON', () => {
    const output = runCli('events');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('output is valid JSON (parseable)', () => {
    const output = runCli('markets');
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed) || typeof parsed === 'object').toBe(true);
  });
});
