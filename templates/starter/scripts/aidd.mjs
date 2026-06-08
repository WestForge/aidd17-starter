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
    case 'slice':
      await createSlice(args);
      break;
    case 'slice:ready':
      await markSliceReady(args);
      break;
    case 'bundle':
      await bundleSlice(args);
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
  slice <capability> --id SLICE-001 --title "Slice title"
  slice:ready <slice-id>
  bundle <slice-id>
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
    'delivery/_template/delivery-slice.md',
    'bundles/index.md'
  ];

  for (const file of required) {
    await assertExists(file);
  }

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
    if (!(await exists(p(CONFIG.modulesDir, moduleSlug)))) {
      throw new Error(`Referenced module does not exist: ${moduleSlug}`);
    }
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

async function createSlice(args) {
  const capabilitySlug = positional(args)[0];
  if (!capabilitySlug) throw new Error('Capability slug is required.');

  const id = flag(args, 'id');
  if (!id) throw new Error('--id is required.');

  const title = flag(args, 'title') ?? titleFromSlug(id);
  const capabilityDir = p(CONFIG.capabilitiesDir, capabilitySlug);
  if (!(await exists(capabilityDir))) throw new Error(`Capability not found: ${capabilitySlug}`);

  const capability = await readJson(path.join(capabilityDir, 'capability.json'));
  const date = new Date().toISOString().slice(0, 10);
  const sliceDir = p(CONFIG.deliveryDir, capabilitySlug, `${id}-${date}`);

  if (await exists(sliceDir)) throw new Error(`Slice already exists: ${path.relative(ROOT, sliceDir)}`);

  await fs.mkdir(sliceDir, { recursive: true });

  const referencedModules = (capability.modules ?? [])
    .map((moduleSlug) => `- ${titleFromSlug(moduleSlug)} — \`modules/${moduleSlug}/02-boundaries.md\``)
    .join('\n') || 'No modules referenced.';

  let slice = await fs.readFile(p(CONFIG.deliveryTemplateDir, 'delivery-slice.md'), 'utf8');
  slice = slice
    .replaceAll('__SLICE_ID__', id)
    .replaceAll('__SLICE_TITLE__', title)
    .replaceAll('__CAPABILITY_SLUG__', capabilitySlug)
    .replaceAll('__CAPABILITY_TITLE__', capability.title)
    .replaceAll('__REFERENCED_MODULES__', referencedModules);

  await fs.writeFile(path.join(sliceDir, `${id}.md`), slice);
  await fs.writeFile(path.join(sliceDir, 'index.md'), `# ${id}\n\n- [Delivery slice](./${id}.md)\n- [Manifest](./manifest.json)\n`);

  await writeJson(path.join(sliceDir, 'manifest.json'), {
    id,
    title,
    capability: capabilitySlug,
    status: 'draft',
    readyForImplementation: false,
    createdAt: new Date().toISOString(),
    modules: capability.modules ?? []
  });

  console.log(`Created draft slice: ${id}`);
}

async function markSliceReady(args) {
  const id = positional(args)[0];
  if (!id) throw new Error('Slice ID is required.');

  const found = await findSlice(id);
  if (!found) throw new Error(`Slice not found: ${id}`);

  const sliceFile = path.join(found.dir, `${id}.md`);
  const content = await fs.readFile(sliceFile, 'utf8');

  const requiredSections = [
    '## Delivery Scope',
    '## Allowed Files',
    '## Forbidden Files',
    '## Tasks',
    '## Acceptance Criteria',
    '## AI Execution Contract',
    '## Stop Conditions'
  ];

  const missing = requiredSections.filter((section) => !content.includes(section));
  if (missing.length) {
    throw new Error(`Slice cannot be marked ready. Missing sections:\n${missing.map((item) => `- ${item}`).join('\n')}`);
  }

  if (content.includes('TODO')) {
    throw new Error('Slice cannot be marked ready while TODO markers remain.');
  }

  const manifestPath = path.join(found.dir, 'manifest.json');
  const manifest = await readJson(manifestPath);
  manifest.status = 'ready';
  manifest.readyForImplementation = true;
  manifest.readyAt = new Date().toISOString();
  await writeJson(manifestPath, manifest);

  console.log(`Marked slice ready: ${id}`);
}

async function bundleSlice(args) {
  const id = positional(args)[0];
  if (!id) throw new Error('Slice ID is required.');

  const found = await findSlice(id);
  if (!found) throw new Error(`Slice not found: ${id}`);

  const manifest = await readJson(path.join(found.dir, 'manifest.json'));
  if (manifest.status !== 'ready' || !manifest.readyForImplementation) {
    throw new Error(`Cannot bundle ${id}. Current status is ${manifest.status}. Run: npm run aidd:slice:ready -- ${id}`);
  }

  const capability = await readJson(p(CONFIG.capabilitiesDir, manifest.capability, 'capability.json'));
  const sliceContent = await fs.readFile(path.join(found.dir, `${id}.md`), 'utf8');
  const outDir = p(CONFIG.bundlesDir, id);
  await fs.mkdir(outDir, { recursive: true });

  const moduleBoundaryLinks = (manifest.modules ?? [])
    .map((moduleSlug) => `- modules/${moduleSlug}/02-boundaries.md`)
    .join('\n') || '- No module boundaries referenced.';

  const plan = `# ${id} Implementation Plan

## Work Sequence

1. Read this bundle fully.
2. Confirm the readiness gate.
3. Review capability scope.
4. Review referenced module boundaries.
5. Complete tasks in order.
6. Run the smallest relevant checks.
7. Report files changed, tasks completed, checks run, and remaining risks.

## Module Boundary Rules

${moduleBoundaryLinks}
`;

  const bundle = `# ${id} Implementation Bundle

## Bundle Metadata

- Slice ID: ${id}
- Capability: ${capability.title}
- Status at bundle creation: ${manifest.status}
- Generated: ${new Date().toISOString()}

## Context Loading Order

1. This bundle.
2. Capability: capabilities/${manifest.capability}/index.md
3. Referenced module boundaries.
4. Common delivery rules and standards.

${plan}

---

${sliceContent}
`;

  await fs.writeFile(path.join(outDir, `${id}.bundle.md`), bundle);
  await fs.writeFile(path.join(outDir, 'implementation-plan.md'), plan);
  await writeJson(path.join(outDir, 'manifest.json'), {
    id,
    capability: manifest.capability,
    modules: manifest.modules ?? [],
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT, found.dir)
  });

  console.log(`Generated bundle: ${path.relative(ROOT, outDir)}`);
}

async function capabilityPack(args) {
  const slug = positional(args)[0];
  if (!slug) throw new Error('Capability slug is required.');

  const dir = p(CONFIG.capabilitiesDir, slug);
  if (!(await exists(dir))) throw new Error(`Capability not found: ${slug}`);

  const manifest = await readJson(path.join(dir, 'capability.json'));
  const outDir = p(CONFIG.bundlesDir, 'capabilities');
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
  console.log(`Generated capability pack: ${path.join('bundles', 'capabilities', `${slug}.capability.md`)}`);
}

async function listAll() {
  await listModules();
  await listCapabilities();
}

async function listModules() {
  const modules = await readEntities(CONFIG.modulesDir, 'module.json');
  console.log('Modules:');
  if (!modules.length) console.log('  none');
  for (const module of modules) {
    console.log(`  ${module.slug} — ${module.title} (${module.status})`);
  }
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

async function clean() {
  const dir = p(CONFIG.bundlesDir);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.md'), '# Bundles\n\nGenerated implementation bundles are written here.\n');
  console.log('Cleaned generated bundles.');
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
    const modules = (capability.modules ?? []).length
      ? ` — modules: ${(capability.modules ?? []).join(', ')}`
      : '';
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

  return entities.sort((a, b) => a.title.localeCompare(b.title));
}

async function findSlice(id) {
  const deliveryDir = p(CONFIG.deliveryDir);
  if (!(await exists(deliveryDir))) return null;

  const capabilityDirs = await fs.readdir(deliveryDir, { withFileTypes: true });

  for (const capabilityDir of capabilityDirs) {
    if (!capabilityDir.isDirectory() || capabilityDir.name.startsWith('_')) continue;
    const parent = path.join(deliveryDir, capabilityDir.name);
    const sliceDirs = await fs.readdir(parent, { withFileTypes: true });

    for (const sliceDir of sliceDirs) {
      if (!sliceDir.isDirectory()) continue;
      if (sliceDir.name.startsWith(`${id}-`) || sliceDir.name === id) {
        return { capability: capabilityDir.name, dir: path.join(parent, sliceDir.name) };
      }
    }
  }

  return null;
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
    for (const [from, to] of Object.entries(replacements)) {
      content = content.split(from).join(to);
    }
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
