import path from 'node:path';
import { readJson } from './fs.mjs';

export async function loadConfig() {
  const root = process.cwd();
  const config = await readJson(path.join(root, 'aidd.config.json'));
  return { root, ...config };
}

export function resolvePath(config, relativePath) {
  return path.resolve(config.root, relativePath);
}
