import path from 'node:path';
import { loadConfig, resolvePath } from '../core/config.mjs';
import { listDirs, walk, readJson } from '../core/fs.mjs';

export async function list() {
  const config = await loadConfig();
  const capabilities = (await listDirs(resolvePath(config, config.capabilitiesDir))).filter((name) => !name.startsWith('_'));
  console.log('Capabilities');
  if (!capabilities.length) console.log('  None yet.');
  for (const capability of capabilities) console.log(`  ${capability}`);

  console.log('');
  console.log('Delivery slices');
  const deliveryRoot = resolvePath(config, config.deliveryDir);
  const files = await walk(deliveryRoot);
  const manifests = files.filter((file) => path.basename(file) === 'manifest.json' && !file.split(path.sep).includes('_template'));
  if (!manifests.length) console.log('  None yet.');
  for (const manifestPath of manifests) {
    const manifest = await readJson(manifestPath);
    const ready = manifest.readyForImplementation ? 'ready' : 'not ready';
    console.log(`  ${manifest.id}  ${manifest.title}  (${manifest.capability}, ${manifest.status}, ${ready})`);
  }
}
