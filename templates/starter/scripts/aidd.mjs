#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONFIG = JSON.parse(await fs.readFile(path.join(ROOT, 'aidd.config.json'), 'utf8'));

const command = process.argv[2];
const args = process.argv.slice(3);

try {
  switch (command) {
    case 'check':
      await check();
      break;
    case 'list':
      await listAll();
      break;
    case 'module:create':
      await createModule(args);
      break;
    case 'module:list':
      await listModules();
      break;
    case 'capability:create':
      await createCapability(args);
      break;
    case 'capability:list':
      await listCapabilities();
      break;
    case 'bundle:create':
      await createBundle(args);
      break;
    case 'bundle:ready':
      await markBundleReady(args);
      break;
    case 'bundle:export':
      await exportBundle(args);
      break;
    case 'bundle:list':
      await listBundles();
      break;
    case 'delivery:roadmap':
      await refreshRoadmap();
      break;
    case 'capability':
      await capabilityPack(args);
      break;
    case 'clean':
      await clean();
      break;
    default:
      help();
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function help() {
  console.log(`AIDD commands:
  check
  list
  module:create <slug> --title "Title"
  module:list
  capability:create <slug> --title "Title" --modules ai,characters
  capability:list
  bundle:create <id> --title "Title" --capability <slug>
  bundle:ready <id>
  bundle:export <id>
  bundle:list
  delivery:roadmap
  capability <capability>
  clean`);
}

async function check() {
  const required = [
    'common/index.md',
    'common/standards/index.md',
    'modules/index.md',
    'modules/_template/index.md',
    'modules/_template/02-boundaries.md',
    'capabilities/index.md',
    'capabilities/_template/index.md',
    'delivery/index.md',
    'delivery/roadmap.md',
    'delivery/bundles/index.md',
    'delivery/bundles/_template/index.md',
    'delivery/bundles/_template/bundle.json'
  ];

  for (const file of required) await assertExists(file);
  console.log('AIDD check passed.');
}

async function assertExists(relativePath) {
  try {
    await fs.access(path.join(ROOT, relativePath));
  } catch {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

async function createModule(args) {
  const slug = positional(args)[0];
  if (!slug) throw new Error('Module slug is required.');

  const title = flag(args, 'title') ?? titleFromSlug(slug);
  const target = p(CONFIG.modulesDir, slug);
  if (await exists(target)) throw new Error(`Module already exists: ${slug}`);

  await copyDir(p(CONFIG.moduleTemplateDir), target);
  await replacePlaceholders(target, {
    '__MODULE_SLUG__': slug,
    '__MODULE_TITLE__': title
  });

  await writeJson(path.join(target, 'module.json'), {
    slug,
    title,
    status: 'active',
    createdAt: new Date().toISOString(),
    deprecatedAt: null,
    archivedAt: null,
    reason: null,
    owns: [],
    dependsOn: [],
    exposes: []
  });

  await refreshModulesIndex();
  console.log(`Created module: ${slug}`);
}

async function createCapability(args) {
  const slug = positional(args)[0];
  if (!slug) throw new Error('Capability slug is required.');

  const title = flag(args, 'title') ?? titleFromSlug(slug);
  const modules = parseCsv(flag(args, 'modules'));
  const target = p(CONFIG.capabilitiesDir, slug);
  if (await exists(target)) throw new Error(`Capability already exists: ${slug}`);

  for (const moduleSlug of modules) {
    if (!(await exists(p(CONFIG.modulesDir, moduleSlug)))) throw new Error(`Referenced module does not exist: ${moduleSlug}`);
  }

  await copyDir(p(CONFIG.capabilityTemplateDir), target);
  await replacePlaceholders(target, {
    '__CAPABILITY_SLUG__': slug,
    '__CAPABILITY_TITLE__': title
  });

  await writeJson(path.join(target, 'capability.json'), {
    slug,
    title,
    status: 'active',
    modules,
    createdAt: new Date().toISOString(),
    deprecatedAt: null,
    archivedAt: null,
    reason: null
  });

  await refreshCapabilitiesIndex();
  await refreshModulesIndex();
  console.log(`Created capability: ${slug}`);
}

async function createBundle(args) {
  const id = positional(args)[0];
  if (!id) throw new Error('Bundle ID is required.');

  const title = flag(args, 'title') ?? titleFromSlug(id);
  const capabilitySlug = flag(args, 'capability');
  if (!capabilitySlug) throw new Error('--capability is required.');

  const capabilityDir = p(CONFIG.capabilitiesDir, capabilitySlug);
  if (!(await exists(capabilityDir))) throw new Error(`Capability not found: ${capabilitySlug}`);

  const capability = await readJson(path.join(capabilityDir, 'capability.json'));
  const bundleDir = p(CONFIG.deliveryBundlesDir, id);
  if (await exists(bundleDir)) throw new Error(`Bundle already exists: ${id}`);

  await copyDir(p(CONFIG.bundleTemplateDir), bundleDir);
  await replacePlaceholders(bundleDir, {
    '__BUNDLE_ID__': id,
    '__BUNDLE_TITLE__': title,
    '__CAPABILITY_SLUG__': capabilitySlug,
    '__CAPABILITY_TITLE__': capability.title
  });

  await writeJson(path.join(bundleDir, 'bundle.json'), {
    id,
    title,
    status: 'draft',
    capability: capabilitySlug,
    modules: capability.modules ?? [],
    priority: Number(flag(args, 'priority') ?? 100),
    createdAt: new Date().toISOString(),
    readyAt: null,
    startedAt: null,
    completedAt: null,
    archivedAt: null
  });

  await fs.mkdir(path.join(bundleDir, 'exports'), { recursive: true });
  await refreshBundlesIndex();
  await refreshRoadmap();
  console.log(`Created delivery bundle: ${id}`);
}

async function markBundleReady(args) {
  const id = positional(args)[0];
  if (!id) throw new Error('Bundle ID is required.');

  const found = await findBundle(id);
  if (!found) throw new Error(`Bundle not found: ${id}`);

  const requiredFiles = [
    '01-context.md',
    '02-scope.md',
    '03-design.md',
    '04-implementation-plan.md',
    '05-tasks.md',
    '06-acceptance.md',
    '07-review.md',
    '08-validation.md',
    '09-handoff.md'
  ];

  const filesWithTodo = [];

  for (const file of requiredFiles) {
    const filePath = path.join(found.dir, file);
    if (!(await exists(filePath))) throw new Error(`Bundle cannot be marked ready. Missing file: ${file}`);
    const content = await fs.readFile(filePath, 'utf8');
    if (content.includes('TODO')) filesWithTodo.push(file);
  }

  if (filesWithTodo.length) {
    throw new Error(`Bundle cannot be marked ready while TODO markers remain:\n${filesWithTodo.map((file) => `- ${file}`).join('\n')}`);
  }

  const manifestPath = path.join(found.dir, 'bundle.json');
  const manifest = await readJson(manifestPath);
  manifest.status = 'ready';
  manifest.readyAt = new Date().toISOString();
  await writeJson(manifestPath, manifest);

  await refreshBundlesIndex();
  await refreshRoadmap();
  console.log(`Marked bundle ready: ${id}`);
}

async function exportBundle(args) {
  const id = positional(args)[0];
  if (!id) throw new Error('Bundle ID is required.');

  const found = await findBundle(id);
  if (!found) throw new Error(`Bundle not found: ${id}`);

  const manifest = await readJson(path.join(found.dir, 'bundle.json'));
  if (manifest.status !== 'ready') {
    throw new Error(`Cannot export ${id}. Current status is ${manifest.status}. Run: npm run aidd:bundle:ready -- ${id}`);
  }

  const capability = await readJson(p(CONFIG.capabilitiesDir, manifest.capability, 'capability.json'));
  const exportsDir = path.join(found.dir, 'exports');
  await fs.mkdir(exportsDir, { recursive: true });

  const moduleBoundaryLinks = (manifest.modules ?? [])
    .map((moduleSlug) => `- modules/${moduleSlug}/02-boundaries.md`)
    .join('\n') || '- No module boundaries referenced.';

  let content = `# ${id} Agent Export

## Bundle Metadata

- Bundle ID: ${id}
- Title: ${manifest.title}
- Capability: ${capability.title}
- Status at export: ${manifest.status}
- Generated: ${new Date().toISOString()}

## Context Loading Order

1. This export.
2. Capability: capabilities/${manifest.capability}/index.md
3. Referenced module boundaries.
4. Common delivery rules and standards.

## Module Boundary Rules

${moduleBoundaryLinks}
`;

  for (const file of [
    '01-context.md',
    '02-scope.md',
    '03-design.md',
    '04-implementation-plan.md',
    '05-tasks.md',
    '06-acceptance.md',
    '07-review.md',
    '08-validation.md',
    '09-handoff.md'
  ]) {
    content += `\n---\n\n`;
    content += await fs.readFile(path.join(found.dir, file), 'utf8');
    content += '\n';
  }

  await fs.writeFile(path.join(exportsDir, `${id}.agent.md`), content);
  console.log(`Generated agent export: ${path.relative(ROOT, path.join(exportsDir, `${id}.agent.md`))}`);
}

async function capabilityPack(args) {
  const slug = positional(args)[0];
  if (!slug) throw new Error('Capability slug is required.');

  const dir = p(CONFIG.capabilitiesDir, slug);
  if (!(await exists(dir))) throw new Error(`Capability not found: ${slug}`);

  const manifest = await readJson(path.join(dir, 'capability.json'));
  const outDir = p(CONFIG.deliveryBundlesDir, '_capability-packs');
  await fs.mkdir(outDir, { recursive: true });

  let content = `# ${manifest.title} Capability Pack\n\n`;
  content += `## Referenced Modules\n\n`;
  content += (manifest.modules ?? []).map((m) => `- ${m}`).join('\n') || 'No modules referenced.';
  content += '\n\n';

  for (const file of ['index.md', ...CONFIG.capabilityFiles]) {
    const filePath = path.join(dir, file);
    if (await exists(filePath)) {
      content += `\n---\n\n`;
      content += await fs.readFile(filePath, 'utf8');
      content += '\n';
    }
  }

  await fs.writeFile(path.join(outDir, `${slug}.capability.md`), content);
  console.log(`Generated capability pack: ${path.join(CONFIG.deliveryBundlesDir, '_capability-packs', `${slug}.capability.md`)}`);
}

async function listAll() {
  await listModules();
  await listCapabilities();
  await listBundles();
}

async function listModules() {
  const modules = await readEntities(CONFIG.modulesDir, 'module.json');
  console.log('Modules:');
  if (!modules.length) console.log('  none');
  for (const module of modules) console.log(`  ${module.slug} — ${module.title} (${module.status})`);
}

async function listCapabilities() {
  const capabilities = await readEntities(CONFIG.capabilitiesDir, 'capability.json');
  console.log('Capabilities:');
  if (!capabilities.length) console.log('  none');
  for (const capability of capabilities) {
    const modules = (capability.modules ?? []).join(', ') || 'none';
    console.log(`  ${capability.slug} — ${capability.title} (${capability.status}; modules: ${modules})`);
  }
}

async function listBundles() {
  const bundles = await readEntities(CONFIG.deliveryBundlesDir, 'bundle.json');
  console.log('Delivery bundles:');
  if (!bundles.length) console.log('  none');
  for (const bundle of bundles) console.log(`  ${bundle.id} — ${bundle.title} (${bundle.status}; capability: ${bundle.capability})`);
}

async function clean() {
  const dirs = await readDirs(p(CONFIG.deliveryBundlesDir));
  for (const dir of dirs) {
    if (dir.startsWith('_')) continue;
    const exportsDir = p(CONFIG.deliveryBundlesDir, dir, 'exports');
    await fs.rm(exportsDir, { recursive: true, force: true });
    await fs.mkdir(exportsDir, { recursive: true });
  }
  console.log('Cleaned generated bundle exports.');
}

async function refreshModulesIndex() {
  const modules = await readEntities(CONFIG.modulesDir, 'module.json');
  const capabilities = await readEntities(CONFIG.capabilitiesDir, 'capability.json');

  const active = modules.filter((m) => status(m) === 'active');
  const deprecated = modules.filter((m) => status(m) === 'deprecated');
  const archived = modules.filter((m) => status(m) === 'archived');

  const section = [
    '## Active modules',
    '',
    renderModuleList(active, capabilities, 'No active modules yet.'),
    '',
    '## Deprecated modules',
    '',
    renderModuleList(deprecated, capabilities, 'No deprecated modules.'),
    '',
    '## Archived modules',
    '',
    renderModuleList(archived, capabilities, 'No archived modules.'),
    ''
  ].join('\n');

  await replaceManagedSection(p(CONFIG.modulesDir, 'index.md'), '## Active modules', section);
}

async function refreshCapabilitiesIndex() {
  const capabilities = await readEntities(CONFIG.capabilitiesDir, 'capability.json');
  const active = capabilities.filter((c) => status(c) === 'active');
  const deprecated = capabilities.filter((c) => status(c) === 'deprecated');
  const archived = capabilities.filter((c) => status(c) === 'archived');

  const section = [
    '## Active capabilities',
    '',
    renderCapabilityList(active, 'No active capabilities yet.'),
    '',
    '## Deprecated capabilities',
    '',
    renderCapabilityList(deprecated, 'No deprecated capabilities.'),
    '',
    '## Archived capabilities',
    '',
    renderCapabilityList(archived, 'No archived capabilities.'),
    ''
  ].join('\n');

  await replaceManagedSection(p(CONFIG.capabilitiesDir, 'index.md'), '## Active capabilities', section);
}

async function refreshBundlesIndex() {
  const bundles = await readEntities(CONFIG.deliveryBundlesDir, 'bundle.json');
  const section = [
    '## Bundles',
    '',
    bundles.length ? bundles.map((bundle) => `- [${bundle.title}](./${bundle.id}/index.md) — ${bundle.status}`).join('\n') : 'No delivery bundles yet.',
    ''
  ].join('\n');

  await replaceManagedSection(p(CONFIG.deliveryBundlesDir, 'index.md'), '## Bundles', section);
}

async function refreshRoadmap() {
  const bundles = await readEntities(CONFIG.deliveryBundlesDir, 'bundle.json');
  const statuses = ['draft', 'planned', 'ready', 'in-progress', 'completed', 'archived'];
  const lines = ['# Delivery Roadmap', '', 'Generated from delivery bundle metadata.', ''];

  for (const currentStatus of statuses) {
    lines.push(`## ${titleFromSlug(currentStatus)}`);
    lines.push('');

    const group = bundles
      .filter((bundle) => (bundle.status ?? 'draft') === currentStatus)
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

    lines.push(group.length
      ? group.map((bundle) => `- [${bundle.title}](./bundles/${bundle.id}/index.md) — ${bundle.id}`).join('\n')
      : `No ${currentStatus} bundles.`);
    lines.push('');
  }

  await fs.writeFile(p(CONFIG.deliveryDir, 'roadmap.md'), `${lines.join('\n').trimEnd()}\n`);
  await writeJson(p(CONFIG.deliveryDir, 'roadmap.json'), {
    bundles: bundles.map((bundle) => ({
      id: bundle.id,
      title: bundle.title,
      status: bundle.status,
      capability: bundle.capability,
      modules: bundle.modules ?? [],
      priority: bundle.priority ?? 100
    }))
  });

  console.log('Updated delivery roadmap.');
}

function renderModuleList(modules, capabilities, emptyText) {
  if (!modules.length) return emptyText;
  return modules.map((module) => {
    const related = capabilities.filter((c) => (c.modules ?? []).includes(module.slug));
    const relatedText = related.length
      ? ` — capabilities: ${related.map((c) => `[${c.title}](../capabilities/${c.slug}/index.md)`).join(', ')}`
      : '';
    return `- [${module.title}](./${module.slug}/index.md)${relatedText}`;
  }).join('\n');
}

function renderCapabilityList(capabilities, emptyText) {
  if (!capabilities.length) return emptyText;
  return capabilities.map((capability) => {
    const modules = (capability.modules ?? []).length ? ` — modules: ${(capability.modules ?? []).join(', ')}` : '';
    return `- [${capability.title}](./${capability.slug}/index.md)${modules}`;
  }).join('\n');
}

async function replaceManagedSection(filePath, heading, replacement) {
  const current = await fs.readFile(filePath, 'utf8');
  const next = current.includes(heading)
    ? current.replace(new RegExp(`${escapeRegExp(heading)}[\\s\\S]*$`, 'm'), replacement)
    : `${current.trimEnd()}\n\n${replacement}`;
  await fs.writeFile(filePath, `${next.trimEnd()}\n`);
}

async function readEntities(dirName, manifestName) {
  const dir = p(dirName);
  if (!(await exists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const entities = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const manifestPath = path.join(dir, entry.name, manifestName);
    if (!(await exists(manifestPath))) continue;
    entities.push(await readJson(manifestPath));
  }

  return entities.sort((a, b) => (a.title ?? a.id).localeCompare(b.title ?? b.id));
}

async function findBundle(id) {
  const dir = p(CONFIG.deliveryBundlesDir, id);
  if (await exists(dir)) return { dir };
  return null;
}

async function readDirs(dir) {
  if (!(await exists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(source, target);
    else await fs.copyFile(source, target);
  }
}

async function replacePlaceholders(root, replacements) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await replacePlaceholders(full, replacements);
      continue;
    }
    if (!/\.(md|json)$/i.test(entry.name)) continue;

    let content = await fs.readFile(full, 'utf8');
    for (const [from, to] of Object.entries(replacements)) content = content.split(from).join(to);
    await fs.writeFile(full, content);
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function p(...parts) {
  return path.join(ROOT, ...parts);
}

function positional(args) {
  return args.filter((arg) => !arg.startsWith('--'));
}

function flag(args, name) {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1];
  return null;
}

function parseCsv(value) {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function titleFromSlug(slug) {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function status(entity) {
  return ['active', 'deprecated', 'archived'].includes(entity.status) ? entity.status : 'active';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
