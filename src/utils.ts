import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
    );
    return pkg.version as string;
  } catch {
    return '0.0.0';
  }
}

export function formatOutput(data: unknown, pretty: boolean): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}
