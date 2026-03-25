#!/usr/bin/env node
import { Command } from 'commander';
import { getVersion, formatOutput } from './utils.js';
import { getMarkets, getEvents, searchMarkets, getMarketBySlug } from './api/gamma.js';
import { filterRelevantMarkets } from './sentiment/filter.js';
import { computeSentiment } from './sentiment/compute.js';

const program = new Command();

program
  .name('polymarket')
  .description('Polymarket prediction market sentiment for AI trading agents')
  .version(getVersion())
  .option('--pretty', 'Pretty-print JSON output');

program
  .command('markets')
  .description('Fetch and filter relevant prediction markets')
  .option('--min-volume <number>', 'Minimum 24h volume', '100000')
  .option('--limit <number>', 'Max markets to fetch', '200')
  .action(async (opts) => {
    try {
      const pretty = program.opts().pretty as boolean;
      const raw = await getMarkets({
        active: true,
        limit: parseInt(opts.limit as string, 10),
      });
      const signals = filterRelevantMarkets(raw, parseInt(opts.minVolume as string, 10));
      process.stdout.write(formatOutput(signals, pretty) + '\n');
    } catch (err) {
      process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
  });

program
  .command('sentiment')
  .description('Compute full sentiment snapshot')
  .option('--min-volume <number>', 'Minimum 24h volume', '100000')
  .option('--no-cache', 'Skip cache, fetch fresh data')
  .option('--cache-ttl <seconds>', 'Cache TTL in seconds', '1800')
  .action(async (opts) => {
    try {
      const pretty = program.opts().pretty as boolean;
      const snapshot = await computeSentiment({
        minVolume: parseInt(opts.minVolume as string, 10),
        noCache: opts.cache === false,
        cacheTtl: parseInt(opts.cacheTtl as string, 10),
      });
      process.stdout.write(formatOutput(snapshot, pretty) + '\n');
    } catch (err) {
      process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Search markets by query')
  .option('--limit <number>', 'Max results', '10')
  .action(async (query: string, opts) => {
    try {
      const pretty = program.opts().pretty as boolean;
      const results = await searchMarkets(query, parseInt(opts.limit as string, 10));
      process.stdout.write(formatOutput(results, pretty) + '\n');
    } catch (err) {
      process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
  });

program
  .command('events')
  .description('List top events by volume')
  .option('--limit <number>', 'Max events', '10')
  .action(async (opts) => {
    try {
      const pretty = program.opts().pretty as boolean;
      const events = await getEvents({
        active: true,
        limit: parseInt(opts.limit as string, 10),
      });
      process.stdout.write(formatOutput(events, pretty) + '\n');
    } catch (err) {
      process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
  });

program
  .command('market <slug>')
  .description('Get details for a single market')
  .action(async (slug: string) => {
    try {
      const pretty = program.opts().pretty as boolean;
      const market = await getMarketBySlug(slug);
      if (!market) {
        process.stderr.write(`Market not found: ${slug}\n`);
        process.exit(1);
      }
      process.stdout.write(formatOutput(market, pretty) + '\n');
    } catch (err) {
      process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
  });

program.parse();
