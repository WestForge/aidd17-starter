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
const templateRoot = path.join(path.resolve(__dirname, '..'), 'templates', 'starter');
const rawArgs = process.argv.slice(2);
const flags = new Set(rawArgs.filter((arg) => arg.startsWith('--')));
const positional = rawArgs.filter((arg) => !arg.startsWith('--'));
const yes = flags.has('--yes') || flags.has('-y');
const noInstall = flags.has('--no-install');
const force = flags.has('--force');
const rl = readline.createInterface({ input, output });

try {
  console.log('\nCreate AIDD');
  console.log('Plain Markdown delivery workspace for AI-assisted software work.\n');
  const targetName = positional[0] || (yes ? 'docs' : await ask('Target directory', 'docs'));
  const projectName = yes ? titleFromSlug(targetName) : await ask('Project name', titleFromSlug(targetName));
  const description = yes ? 'Plain Markdown delivery workspace for AI-assisted software work.' : await ask('Project description', 'Plain Markdown delivery workspace for AI-assisted software work.');
  const installDependencies = flags.has('--install') ? true : noInstall ? false : yes ? false : await askYesNo('Run npm install? This is optional because AIDD has no dependencies.', false);
  const targetDir = path.resolve(process.cwd(), targetName);
  await ensureTarget(targetDir, force);
  await copyDir(templateRoot, targetDir);
  await replacePlaceholders(targetDir, {
    '__PROJECT_NAME__': projectName,
    '__PROJECT_DESCRIPTION__': description,
    '__PACKAGE_NAME__': packageNameFromFolder(path.basename(targetDir))
  });
  if (installDependencies) {
    console.log('\nInstalling dependencies...');
    await runCommand('npm', ['install'], targetDir);
  }
  console.log('\nAIDD workspace created.\n');
  console.log('Next steps:');
  console.log(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`);
  console.log('  npm run aidd:check');
  console.log('  npm run aidd:module:create -- ai --title "AI"');
  console.log('  npm run aidd:capability:create -- companion-behaviour --title "Companion Behaviour" --modules ai');
  if (!installDependencies) console.log('\nOptional: run npm install if you want a package-lock.json in the AIDD folder.');
  console.log('');
} finally { rl.close(); }

async function ask(message, defaultValue) { const answer = await rl.question(`${message} (${defaultValue}): `); return answer.trim() || defaultValue; }
async function askYesNo(message, defaultValue) { const suffix = defaultValue ? 'Y/n' : 'y/N'; const answer = (await rl.question(`${message} (${suffix}): `)).trim().toLowerCase(); return answer ? ['y','yes'].includes(answer) : defaultValue; }
async function ensureTarget(targetDir, allowForce) { try { const entries = await fs.readdir(targetDir); if (entries.length > 0 && !allowForce) { console.error(`Target directory already exists and is not empty: ${targetDir}`); console.error('Use --force to overwrite files in that folder.'); process.exit(1); } } catch (error) { if (error.code !== 'ENOENT') throw error; } await fs.mkdir(targetDir, { recursive: true }); }
async function copyDir(from, to) { await fs.mkdir(to, { recursive: true }); for (const entry of await fs.readdir(from, { withFileTypes: true })) { const source = path.join(from, entry.name); const target = path.join(to, entry.name); if (entry.isDirectory()) await copyDir(source, target); else await fs.copyFile(source, target); } }
async function replacePlaceholders(root, replacements) { for (const entry of await fs.readdir(root, { withFileTypes: true })) { const fullPath = path.join(root, entry.name); if (entry.isDirectory()) { await replacePlaceholders(fullPath, replacements); continue; } if (!/\.(md|json|mjs|txt)$/i.test(entry.name)) continue; let content = await fs.readFile(fullPath, 'utf8'); for (const [from, to] of Object.entries(replacements)) content = content.split(from).join(to); await fs.writeFile(fullPath, content); } }
function runCommand(command, args, cwd) { return new Promise((resolve, reject) => { const isWindows = process.platform === 'win32'; const executable = isWindows ? 'cmd.exe' : command; const executableArgs = isWindows ? ['/d','/s','/c',command,...args] : args; const child = spawn(executable, executableArgs, { cwd, stdio: 'inherit' }); child.on('error', reject); child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${[command,...args].join(' ')} failed with exit code ${code}`))); }); }
function packageNameFromFolder(folderName) { return folderName.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'aidd-workspace'; }
function titleFromSlug(slug) { return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()); }
