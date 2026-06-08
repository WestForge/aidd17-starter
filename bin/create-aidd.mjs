#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const templateRoot = path.join(packageRoot, 'templates', 'starter');

const rawArgs = process.argv.slice(2);
const flags = new Set(rawArgs.filter((arg) => arg.startsWith('--')));
const positional = rawArgs.filter((arg) => !arg.startsWith('--'));
const yes = flags.has('--yes') || flags.has('-y');
const noInstall = flags.has('--no-install');
const force = flags.has('--force');

const rl = readline.createInterface({ input, output });

try {
  const mode = positional[0] === 'update' ? 'update' : 'create';
  if (mode === 'update') await updateFlow();
  else await createFlow();
} finally {
  rl.close();
}

async function createFlow() {
  console.log('');
  console.log('Create AIDD');
  console.log('Plain Markdown delivery workspace for AI-assisted software work.');
  console.log('');

  const targetName = positional[0] || (yes ? 'docs' : await ask('Target directory', 'docs'));
  const projectName = yes ? titleFromSlug(targetName) : await ask('Project name', titleFromSlug(targetName));
  const description = yes
    ? 'Plain Markdown delivery workspace for AI-assisted software work.'
    : await ask('Project description', 'Plain Markdown delivery workspace for AI-assisted software work.');
  const installDependencies = flags.has('--install')
    ? true
    : noInstall
      ? false
      : yes
        ? false
        : await askYesNo('Run npm install? This is optional because AIDD has no dependencies.', false);

  const targetDir = path.resolve(process.cwd(), targetName);
  await ensureTarget(targetDir, force);
  await copyDir(templateRoot, targetDir, { overwrite: true });

  await replacePlaceholders(targetDir, {
    '__PROJECT_NAME__': projectName,
    '__PROJECT_DESCRIPTION__': description,
    '__PACKAGE_NAME__': packageNameFromFolder(path.basename(targetDir))
  });

  if (installDependencies) {
    console.log('');
    console.log('Installing dependencies...');
    await runCommand('npm', ['install'], targetDir);
  }

  console.log('');
  console.log('AIDD workspace created.');
  console.log('');
  console.log('Next steps:');
  console.log(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`);
  console.log('  npm run aidd:check');
  console.log('  npm run aidd:module:create -- ai --title "AI"');
  console.log('  npm run aidd:capability:create -- companion-behaviour --title "Companion Behaviour" --modules ai');
  console.log('  npm run aidd:bundle:create -- COMP-BEH-001 --title "Companion Behaviour Phase 1" --capability companion-behaviour');

  if (!installDependencies) {
    console.log('');
    console.log('Optional: run npm install if you want a package-lock.json in the AIDD folder.');
  }

  console.log('');
}

async function updateFlow() {
  console.log('');
  console.log('Update AIDD');
  console.log('Refreshing tooling and templates for an existing AIDD workspace.');
  console.log('');

  const targetName = positional[1] || '.';
  const targetDir = path.resolve(process.cwd(), targetName);

  await assertWorkspace(targetDir);

  const result = { copied: [], merged: [] };

  await copyDir(path.join(templateRoot, 'scripts'), path.join(targetDir, 'scripts'), {
    overwrite: true,
    result,
    label: 'scripts'
  });

  await copyFrameworkOwnedTemplates(targetDir, result);
  await ensureMissingWorkspaceDirs(targetDir, result);
  await mergeAiddConfig(targetDir, result);
  await mergePackageScripts(targetDir, result);
  await ensureCapabilityModuleArrays(targetDir, result);
  await migrateLegacyTopLevelBundles(targetDir, result);

  console.log('');
  console.log('AIDD workspace updated.');
  console.log('');
  console.log('Updated:');
  for (const item of result.copied) console.log(`  - ${item}`);
  for (const item of result.merged) console.log(`  - ${item}`);
  if (!result.copied.length && !result.merged.length) console.log('  - No changes required.');
  console.log('');
  console.log('Next steps:');
  console.log(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`);
  console.log('  npm run aidd:check');
  console.log('  npm run aidd:delivery:roadmap');
  console.log('');
}

async function copyFrameworkOwnedTemplates(targetDir, result) {
  const templatePaths = [
    'modules/_template',
    'capabilities/_template',
    'delivery/bundles/_template'
  ];

  for (const relativePath of templatePaths) {
    await copyDir(path.join(templateRoot, relativePath), path.join(targetDir, relativePath), {
      overwrite: true,
      result,
      label: relativePath
    });
  }
}

async function ensureMissingWorkspaceDirs(targetDir, result) {
  const missingDirs = [
    'modules',
    'capabilities',
    'delivery',
    'delivery/bundles',
    'common/standards'
  ];

  for (const relativePath of missingDirs) {
    const dir = path.join(targetDir, relativePath);
    if (!(await exists(dir))) {
      await fs.mkdir(dir, { recursive: true });
      result.copied.push(relativePath);
    }
  }

  await copyFileIfMissing(path.join(templateRoot, 'modules/index.md'), path.join(targetDir, 'modules/index.md'), result, 'modules/index.md');
  await copyFileIfMissing(path.join(templateRoot, 'capabilities/index.md'), path.join(targetDir, 'capabilities/index.md'), result, 'capabilities/index.md');
  await copyFileIfMissing(path.join(templateRoot, 'delivery/index.md'), path.join(targetDir, 'delivery/index.md'), result, 'delivery/index.md');
  await copyFileIfMissing(path.join(templateRoot, 'delivery/roadmap.md'), path.join(targetDir, 'delivery/roadmap.md'), result, 'delivery/roadmap.md');
  await copyFileIfMissing(path.join(templateRoot, 'delivery/roadmap.json'), path.join(targetDir, 'delivery/roadmap.json'), result, 'delivery/roadmap.json');
  await copyFileIfMissing(path.join(templateRoot, 'delivery/bundles/index.md'), path.join(targetDir, 'delivery/bundles/index.md'), result, 'delivery/bundles/index.md');
  await copyDir(path.join(templateRoot, 'common/standards'), path.join(targetDir, 'common/standards'), {
    overwrite: false,
    result,
    label: 'common/standards'
  });
}

async function mergeAiddConfig(targetDir, result) {
  const sourcePath = path.join(templateRoot, 'aidd.config.json');
  const targetPath = path.join(targetDir, 'aidd.config.json');
  const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  const target = await exists(targetPath) ? JSON.parse(await fs.readFile(targetPath, 'utf8')) : {};
  const merged = deepMergeMissing(target, source);
  await fs.writeFile(targetPath, `${JSON.stringify(merged, null, 2)}\n`);
  result.merged.push('aidd.config.json');
}

async function mergePackageScripts(targetDir, result) {
  const sourcePath = path.join(templateRoot, 'package.json');
  const targetPath = path.join(targetDir, 'package.json');
  const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  const target = await exists(targetPath)
    ? JSON.parse(await fs.readFile(targetPath, 'utf8'))
    : { name: packageNameFromFolder(path.basename(targetDir)), version: '0.1.0', private: true, type: 'module', scripts: {} };

  target.type ??= 'module';
  target.private ??= true;
  target.scripts ??= {};
  for (const [name, value] of Object.entries(source.scripts ?? {})) target.scripts[name] = value;

  await fs.writeFile(targetPath, `${JSON.stringify(target, null, 2)}\n`);
  result.merged.push('package.json scripts');
}

async function ensureCapabilityModuleArrays(targetDir, result) {
  const capabilitiesDir = path.join(targetDir, 'capabilities');
  if (!(await exists(capabilitiesDir))) return;

  const entries = await fs.readdir(capabilitiesDir, { withFileTypes: true });
  let changed = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const manifestPath = path.join(capabilitiesDir, entry.name, 'capability.json');
    if (!(await exists(manifestPath))) continue;

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    if (!Array.isArray(manifest.modules)) {
      manifest.modules = [];
      await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      changed++;
    }
  }

  if (changed > 0) result.merged.push(`capability manifests (${changed})`);
}

async function migrateLegacyTopLevelBundles(targetDir, result) {
  const legacy = path.join(targetDir, 'bundles');
  const next = path.join(targetDir, 'delivery', 'bundles');

  if (!(await exists(legacy))) return;

  const entries = await fs.readdir(legacy, { withFileTypes: true });
  const userEntries = entries.filter((entry) => entry.name !== 'index.md');

  if (!userEntries.length) return;

  await fs.mkdir(next, { recursive: true });

  for (const entry of userEntries) {
    const source = path.join(legacy, entry.name);
    const target = path.join(next, entry.name);
    if (await exists(target)) continue;
    await fs.rename(source, target);
  }

  result.merged.push('legacy bundles moved to delivery/bundles');
}

async function assertWorkspace(targetDir) {
  if (!(await exists(targetDir))) throw new Error(`Workspace not found: ${targetDir}`);

  const hasAiddConfig = await exists(path.join(targetDir, 'aidd.config.json'));
  const hasCommon = await exists(path.join(targetDir, 'common'));
  const hasCapabilities = await exists(path.join(targetDir, 'capabilities'));

  if (!hasAiddConfig && !hasCommon && !hasCapabilities) {
    throw new Error(`Target does not look like an AIDD workspace: ${targetDir}`);
  }
}

async function ask(message, defaultValue) {
  const answer = await rl.question(`${message} (${defaultValue}): `);
  return answer.trim() || defaultValue;
}

async function askYesNo(message, defaultValue) {
  const suffix = defaultValue ? 'Y/n' : 'y/N';
  const answer = (await rl.question(`${message} (${suffix}): `)).trim().toLowerCase();
  if (!answer) return defaultValue;
  return ['y', 'yes'].includes(answer);
}

async function ensureTarget(targetDir, allowForce) {
  try {
    const entries = await fs.readdir(targetDir);
    if (entries.length > 0 && !allowForce) {
      console.error(`Target directory already exists and is not empty: ${targetDir}`);
      console.error('Use --force to overwrite files in that folder.');
      process.exit(1);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await fs.mkdir(targetDir, { recursive: true });
}

async function copyDir(from, to, options = {}) {
  const overwrite = options.overwrite ?? false;
  const result = options.result;
  const label = options.label;
  if (!(await exists(from))) return;

  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });

  for (const entry of entries) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(source, target, options);
    else if (overwrite || !(await exists(target))) await fs.copyFile(source, target);
  }

  if (result && label && !result.copied.includes(label)) result.copied.push(label);
}

async function copyFileIfMissing(source, target, result, label) {
  if (!(await exists(target))) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
    result.copied.push(label);
  }
}

async function replacePlaceholders(root, replacements) {
  const entries = await fs.readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await replacePlaceholders(fullPath, replacements);
      continue;
    }
    if (!/\.(md|json|mjs|txt)$/i.test(entry.name)) continue;

    let content = await fs.readFile(fullPath, 'utf8');
    for (const [from, to] of Object.entries(replacements)) content = content.split(from).join(to);
    await fs.writeFile(fullPath, content);
  }
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const executable = isWindows ? 'cmd.exe' : command;
    const executableArgs = isWindows ? ['/d', '/s', '/c', command, ...args] : args;

    const child = spawn(executable, executableArgs, { cwd, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      const displayCommand = [command, ...args].join(' ');
      if (code === 0) resolve();
      else reject(new Error(`${displayCommand} failed with exit code ${code}`));
    });
  });
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function deepMergeMissing(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (target[key] === undefined) {
      target[key] = value;
    } else if (value && typeof value === 'object' && !Array.isArray(value) && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      deepMergeMissing(target[key], value);
    }
  }
  return target;
}

function packageNameFromFolder(folderName) {
  return folderName.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'aidd-workspace';
}

function titleFromSlug(slug) {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
