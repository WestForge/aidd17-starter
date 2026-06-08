import fs from 'node:fs/promises';
import { loadConfig, resolvePath } from '../core/config.mjs';
import { ensureDir } from '../core/fs.mjs';

export async function clean() {
  const config = await loadConfig();
  const bundlesDir = resolvePath(config, config.bundlesDir);
  await fs.rm(bundlesDir, { recursive: true, force: true });
  await ensureDir(bundlesDir);
  console.log('Removed generated bundles.');
}
