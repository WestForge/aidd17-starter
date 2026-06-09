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
const templateRoot = path.join(packageRoot, 'template');
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
} finally { rl.close(); }

async function createFlow() {
  console.log('\nCreate AIDD\nMarkdown delivery control workspace for AI-assisted software work.\n');
  const targetName = positional[0] || (yes ? 'AIDD' : await ask('Target directory', 'AIDD'));
  const projectName = yes ? titleFromSlug(targetName) : await ask('Project name', titleFromSlug(targetName));
  const description = yes ? 'Markdown delivery control workspace for AI-assisted software work.' : await ask('Project description', 'Markdown delivery control workspace for AI-assisted software work.');
  const installDependencies = flags.has('--install') ? true : noInstall ? false : yes ? false : await askYesNo('Run npm install? This is optional because AIDD has no dependencies.', false);
  const targetDir = path.resolve(process.cwd(), targetName);
  await ensureTarget(targetDir, force);
  await copyDir(templateRoot, targetDir, { overwrite: true });
  await replacePlaceholders(targetDir, { '__PROJECT_NAME__': projectName, '__PROJECT_DESCRIPTION__': description, '__PACKAGE_NAME__': packageNameFromFolder(path.basename(targetDir)) });
  if (installDependencies) { console.log('\nInstalling dependencies...'); await runCommand('npm', ['install'], targetDir); }
  console.log('\nAIDD workspace created.\n\nNext steps:');
  console.log(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`);
  console.log('  npm run aidd:check');
  console.log('  npm run aidd:standards:list');
  console.log('  npm run aidd:module:create -- runtime --title "Runtime"');
  if (!installDependencies) console.log('\nOptional: run npm install if you want a package-lock.json in the AIDD folder.');
  console.log('');
}

async function updateFlow() {
  console.log('\nUpdate AIDD\nRefreshing AIDD internals for an existing workspace.\n');
  const targetName = positional[1] || '.';
  const targetDir = path.resolve(process.cwd(), targetName);
  await assertWorkspace(targetDir);
  const result = { copied: [], removed: [], merged: [] };
  await copyDir(path.join(templateRoot, '.aidd'), path.join(targetDir, '.aidd'), { overwrite: true, result, label: '.aidd/' });
  await copyMissingWorkspaceFiles(targetDir, result);
  await mergeJson(path.join(templateRoot,'aidd.config.json'), path.join(targetDir,'aidd.config.json'), result, 'aidd.config.json');
  await mergePackageScripts(targetDir, result);
  await removeLegacyClutter(targetDir, result);
  await migrateLegacyTopLevelBundles(targetDir, result);
  console.log('\nAIDD workspace updated.\n\nUpdated:');
  for (const item of result.copied) console.log(`  - ${item}`);
  for (const item of result.merged) console.log(`  - ${item}`);
  for (const item of result.removed) console.log(`  - removed ${item}`);
  if (!result.copied.length && !result.merged.length && !result.removed.length) console.log('  - No changes required.');
  console.log('\nNext steps:');
  console.log(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`);
  console.log('  npm run aidd:check\n');
}

async function copyMissingWorkspaceFiles(targetDir,result){
  const files=['README.md','AGENTS.md','common/index.md','modules/index.md','capabilities/index.md','delivery/index.md','delivery/roadmap.md','delivery/roadmap.json','delivery/bundles/index.md'];
  for(const f of files) await copyFileIfMissing(path.join(templateRoot,f),path.join(targetDir,f),result,f);
  await copyDir(path.join(templateRoot,'common/standards'),path.join(targetDir,'common/standards'),{overwrite:false,result,label:'common/standards'});
}
async function removeLegacyClutter(targetDir,result){
  for(const rel of ['scripts','templates','_template','modules/_template','capabilities/_template','delivery/_template','delivery/bundles/_template']){
    const full=path.join(targetDir,rel); if(await exists(full)){ await fs.rm(full,{recursive:true,force:true}); result.removed.push(rel); }
  }
}
async function migrateLegacyTopLevelBundles(targetDir,result){
  const legacy=path.join(targetDir,'bundles'), next=path.join(targetDir,'delivery','bundles');
  if(!(await exists(legacy))) return;
  await fs.mkdir(next,{recursive:true});
  const entries=await fs.readdir(legacy,{withFileTypes:true});
  for(const e of entries){ if(e.name==='index.md') continue; const s=path.join(legacy,e.name), t=path.join(next,e.name); if(!(await exists(t))) await fs.rename(s,t); }
  await fs.rm(legacy,{recursive:true,force:true}); result.merged.push('legacy bundles moved to delivery/bundles');
}
async function assertWorkspace(targetDir){
  if(!(await exists(targetDir))) throw new Error(`Workspace not found: ${targetDir}`);
  if(!(await exists(path.join(targetDir,'aidd.config.json'))) && !(await exists(path.join(targetDir,'common'))) && !(await exists(path.join(targetDir,'delivery')))) throw new Error(`Target does not look like an AIDD workspace: ${targetDir}`);
}
async function ask(message,defaultValue){ const answer=await rl.question(`${message} (${defaultValue}): `); return answer.trim()||defaultValue; }
async function askYesNo(message,defaultValue){ const suffix=defaultValue?'Y/n':'y/N'; const answer=(await rl.question(`${message} (${suffix}): `)).trim().toLowerCase(); if(!answer) return defaultValue; return ['y','yes'].includes(answer); }
async function ensureTarget(targetDir,allowForce){ try{ const entries=await fs.readdir(targetDir); if(entries.length>0&&!allowForce){ console.error(`Target directory already exists and is not empty: ${targetDir}`); console.error('Use --force to overwrite files in that folder.'); process.exit(1); }}catch(e){ if(e.code!=='ENOENT') throw e;} await fs.mkdir(targetDir,{recursive:true}); }
async function copyDir(from,to,options={}){ const overwrite=options.overwrite??false; if(!(await exists(from))) return; await fs.mkdir(to,{recursive:true}); for(const entry of await fs.readdir(from,{withFileTypes:true})){ const source=path.join(from,entry.name), target=path.join(to,entry.name); if(entry.isDirectory()) await copyDir(source,target,options); else if(overwrite||!(await exists(target))) await fs.copyFile(source,target); } if(options.result&&options.label&&!options.result.copied.includes(options.label)) options.result.copied.push(options.label); }
async function copyFileIfMissing(source,target,result,label){ if(!(await exists(target))){ await fs.mkdir(path.dirname(target),{recursive:true}); await fs.copyFile(source,target); result.copied.push(label); }}
async function replacePlaceholders(root,replacements){ for(const entry of await fs.readdir(root,{withFileTypes:true})){ const full=path.join(root,entry.name); if(entry.isDirectory()){ await replacePlaceholders(full,replacements); continue; } if(!/\.(md|json|mjs|txt)$/i.test(entry.name)) continue; let content=await fs.readFile(full,'utf8'); for(const [from,to] of Object.entries(replacements)) content=content.split(from).join(to); await fs.writeFile(full,content); }}
async function mergeJson(sourcePath,targetPath,result,label){ const source=JSON.parse(await fs.readFile(sourcePath,'utf8')); const target=await exists(targetPath)?JSON.parse(await fs.readFile(targetPath,'utf8')):{}; await fs.writeFile(targetPath,JSON.stringify(deepMergeMissing(target,source),null,2)+'\n'); result.merged.push(label); }
async function mergePackageScripts(targetDir,result){ const source=JSON.parse(await fs.readFile(path.join(templateRoot,'package.json'),'utf8')); const targetPath=path.join(targetDir,'package.json'); const target=await exists(targetPath)?JSON.parse(await fs.readFile(targetPath,'utf8')):{name:packageNameFromFolder(path.basename(targetDir)),version:'0.1.0',private:true,type:'module',scripts:{}}; target.type??='module'; target.private??=true; target.scripts??={}; Object.assign(target.scripts,source.scripts||{}); await fs.writeFile(targetPath,JSON.stringify(target,null,2)+'\n'); result.merged.push('package.json scripts'); }
function runCommand(command,args,cwd){ return new Promise((resolve,reject)=>{ const isWindows=process.platform==='win32'; const executable=isWindows?'cmd.exe':command; const executableArgs=isWindows?['/d','/s','/c',command,...args]:args; const child=spawn(executable,executableArgs,{cwd,stdio:'inherit'}); child.on('error',reject); child.on('close',(code)=> code===0?resolve():reject(new Error(`${[command,...args].join(' ')} failed with exit code ${code}`))); }); }
async function exists(filePath){ try{ await fs.access(filePath); return true;}catch{return false;} }
function deepMergeMissing(target,source){ for(const [key,value] of Object.entries(source)){ if(target[key]===undefined) target[key]=value; else if(value&&typeof value==='object'&&!Array.isArray(value)&&typeof target[key]==='object'&&!Array.isArray(target[key])) deepMergeMissing(target[key],value);} return target; }
function packageNameFromFolder(folderName){ return folderName.trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'aidd-workspace'; }
function titleFromSlug(slug){ return slug.replace(/[-_]+/g,' ').replace(/\b\w/g,(char)=>char.toUpperCase()); }
