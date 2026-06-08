#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(projectRoot, 'src', 'content', 'docs');
const slicesRoot = path.join(docsRoot, 'aidd-17', '16-implementation-plan', 'slices');
const bundlesRoot = path.join(projectRoot, 'dist', 'aidd-bundles');

const requiredProjectFiles = [
  'src/content/docs/index.mdx',
  'src/content/docs/delivery-loop.mdx',
  'src/content/docs/guides/using-with-ai.mdx',
  'src/content/docs/implementation-slice-template.mdx',
  'src/content/docs/aidd-17/16-implementation-plan/slices/IMP-000-template.mdx',
];

const requiredTemplateHeadings = [
  'Purpose',
  'Scope',
  'Out of Scope',
  'Expected Files or Areas to Change',
  'Files or Areas Not to Change',
  'Verification',
  'Acceptance Criteria',
  'AI Execution Contract',
  'Context Loading Order',
  'Stop Conditions',
  'Codex Prompt',
  'Review Prompt',
];

const requiredSliceHeadings = [
  'Purpose',
  'Scope',
  'Out of Scope',
  'Expected Files or Areas to Change',
  'Files or Areas Not to Change',
  'Verification',
  'Acceptance Criteria',
  'AI Execution Contract',
  'Context Loading Order',
  'Stop Conditions',
];

const bundleMap = [
  {
    filename: 'brief.md',
    title: 'Execution Brief',
    headings: ['Name', 'Status', 'Purpose', 'Linked Intent', 'Linked Shape', 'Applicable Rules'],
  },
  {
    filename: 'scope.md',
    title: 'Scope',
    headings: ['Scope', 'Out of Scope'],
  },
  {
    filename: 'files.md',
    title: 'Files',
    headings: ['Expected Files or Areas to Change', 'Files or Areas Not to Change'],
  },
  {
    filename: 'acceptance.md',
    title: 'Acceptance',
    headings: ['Verification', 'Acceptance Criteria', 'Definition of Done'],
  },
  {
    filename: 'constraints.md',
    title: 'Constraints',
    headings: ['AI Execution Contract', 'Stop Conditions'],
  },
  {
    filename: 'context.md',
    title: 'Context Loading Order',
    headings: ['Context Loading Order'],
  },
  {
    filename: 'prompt.md',
    title: 'Codex Prompt',
    headings: ['Codex Prompt'],
  },
  {
    filename: 'review-prompt.md',
    title: 'Review Prompt',
    headings: ['Review Prompt'],
  },
  {
    filename: 'handoff.md',
    title: 'Handoff',
    headings: ['Review Notes', 'Handoff'],
  },
];

function usage() {
  console.log(`AIDD bundle tool\n\nUsage:\n  npm run aidd:check\n  npm run aidd:bundle -- IMP-001\n  npm run aidd:bundle -- --all\n  npm run aidd:bundle -- IMP-001 --strict\n\nOutput:\n  dist/aidd-bundles/<IMP-ID>/\n`);
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exitCode = 1;
}

function info(message) {
  console.log(message);
}

function exists(relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
}

function stripFrontmatter(content) {
  if (!content.startsWith('---')) return content;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return content;
  return content.slice(end + 5).replace(/^\s+/, '');
}

function stripImports(content) {
  return content
    .split('\n')
    .filter((line) => !line.trim().startsWith('import '))
    .join('\n')
    .replace(/^\s+/, '');
}

function md(content) {
  return stripImports(stripFrontmatter(content));
}

function getHeadings(content) {
  const headings = [];
  const lines = md(content).split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[i]);
    if (!match) continue;
    headings.push({ level: match[1].length, title: cleanHeading(match[2]), line: i });
  }
  return headings;
}

function cleanHeading(title) {
  return title.replace(/<[^>]+>/g, '').replace(/[`*_]/g, '').trim();
}

function hasHeading(content, heading) {
  return getHeadings(content).some((item) => normalize(item.title) === normalize(heading));
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractSection(content, heading) {
  const body = md(content);
  const lines = body.split('\n');
  const starts = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[i]);
    if (!match) continue;
    const title = cleanHeading(match[2]);
    if (normalize(title) === normalize(heading)) {
      starts.push({ index: i, level: match[1].length, title });
    }
  }

  if (!starts.length) return '';
  const start = starts[0];
  let end = lines.length;
  for (let i = start.index + 1; i < lines.length; i += 1) {
    const match = /^(#{1,6})\s+/.exec(lines[i]);
    if (match && match[1].length <= start.level) {
      end = i;
      break;
    }
  }

  return lines.slice(start.index, end).join('\n').trim();
}

function listSliceFiles() {
  if (!fs.existsSync(slicesRoot)) return [];
  return fs
    .readdirSync(slicesRoot)
    .filter((name) => /^IMP-[0-9A-Za-z_-]+.*\.mdx?$/.test(name))
    .filter((name) => !name.includes('000-template'))
    .map((name) => path.join(slicesRoot, name))
    .sort();
}

function findSlice(id) {
  const normalizedId = id.toUpperCase();
  const matches = listSliceFiles().filter((file) => path.basename(file).toUpperCase().startsWith(normalizedId));

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`Multiple slices matched ${id}:\n${matches.map((file) => `- ${path.relative(projectRoot, file)}`).join('\n')}`);
  }

  const direct = path.join(slicesRoot, `${id}.mdx`);
  if (fs.existsSync(direct)) return direct;
  throw new Error(`No implementation slice found for ${id} in ${path.relative(projectRoot, slicesRoot)}`);
}

function validateFileHeadings(relativePath, requiredHeadings) {
  const absolutePath = path.join(projectRoot, relativePath);
  const result = { file: relativePath, missing: [] };
  if (!fs.existsSync(absolutePath)) {
    result.missing.push('(file missing)');
    return result;
  }
  const content = readFile(absolutePath);
  for (const heading of requiredHeadings) {
    if (!hasHeading(content, heading)) result.missing.push(heading);
  }
  return result;
}

function check() {
  let ok = true;
  info('Checking AIDD-17 bundle readiness...');

  for (const file of requiredProjectFiles) {
    if (!exists(file)) {
      console.error(`✖ Missing required file: ${file}`);
      ok = false;
    }
  }

  const templateResults = [
    validateFileHeadings('src/content/docs/implementation-slice-template.mdx', requiredTemplateHeadings),
    validateFileHeadings('src/content/docs/aidd-17/16-implementation-plan/slices/IMP-000-template.mdx', requiredTemplateHeadings),
  ];

  for (const result of templateResults) {
    if (result.missing.length) {
      console.error(`✖ ${result.file} is missing: ${result.missing.join(', ')}`);
      ok = false;
    } else {
      console.log(`✓ ${result.file}`);
    }
  }

  const slices = listSliceFiles();
  if (!slices.length) {
    console.log('ℹ No concrete implementation slices found yet. Templates are ready.');
  }

  for (const slice of slices) {
    const content = readFile(slice);
    const missing = requiredSliceHeadings.filter((heading) => !hasHeading(content, heading));
    const relative = path.relative(projectRoot, slice);
    if (missing.length) {
      console.error(`✖ ${relative} is missing: ${missing.join(', ')}`);
      ok = false;
    } else {
      console.log(`✓ ${relative}`);
    }
  }

  if (!ok) {
    fail('AIDD bundle check failed. Add the missing files or headings before generating execution bundles.');
    return;
  }

  console.log('\n✓ AIDD bundle check passed.');
}

function createBundle(sliceFile, options = {}) {
  const source = path.relative(projectRoot, sliceFile);
  const sliceId = path.basename(sliceFile).replace(/\.mdx?$/i, '').split(/[\s_]+/)[0];
  const content = readFile(sliceFile);
  const missing = requiredSliceHeadings.filter((heading) => !hasHeading(content, heading));

  if (missing.length && options.strict) {
    throw new Error(`${source} is missing required headings: ${missing.join(', ')}`);
  }

  const outDir = path.join(bundlesRoot, sliceId);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const fullMarkdown = md(content);
  writeFile(path.join(outDir, 'source.md'), `# ${sliceId} Source\n\n_Source: ${source}_\n\n${fullMarkdown}`);

  for (const item of bundleMap) {
    const sections = item.headings
      .map((heading) => extractSection(content, heading))
      .filter(Boolean)
      .join('\n\n');
    const sectionBody = sections || `> No matching source sections found for: ${item.headings.join(', ')}.`;
    writeFile(path.join(outDir, item.filename), `# ${sliceId} ${item.title}\n\n_Source: ${source}_\n\n${sectionBody}`);
  }

  const manifest = {
    id: sliceId,
    type: 'implementation-slice-bundle',
    generatedAt: new Date().toISOString(),
    source,
    output: path.relative(projectRoot, outDir),
    requiredHeadings: requiredSliceHeadings,
    missingRequiredHeadings: missing,
    files: ['source.md', ...bundleMap.map((item) => item.filename)],
  };

  writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeFile(path.join(outDir, 'README.md'), `# ${sliceId} Execution Bundle\n\nThis folder is generated from \`${source}\`.\n\n## Read order\n\n1. \`brief.md\`\n2. \`scope.md\`\n3. \`files.md\`\n4. \`constraints.md\`\n5. \`acceptance.md\`\n6. \`prompt.md\`\n7. \`review-prompt.md\`\n8. \`handoff.md\`\n\n## Notes\n\n- The source documentation remains authoritative.\n- The bundle is an execution payload for implementation and review agents.\n- Regenerate this bundle after changing the source slice.\n`);

  console.log(`✓ Generated ${path.relative(projectRoot, outDir)}`);
  if (missing.length) {
    console.log(`  ℹ Missing recommended headings: ${missing.join(', ')}`);
  }
}

function bundle(args) {
  const strict = args.includes('--strict');
  const all = args.includes('--all');
  const ids = args.filter((arg) => !arg.startsWith('--'));

  if (all) {
    const slices = listSliceFiles();
    if (!slices.length) throw new Error('No concrete implementation slices found to bundle.');
    for (const slice of slices) createBundle(slice, { strict });
    return;
  }

  if (!ids.length) {
    usage();
    throw new Error('Provide an implementation slice ID, for example: IMP-001');
  }

  for (const id of ids) createBundle(findSlice(id), { strict });
}

try {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    usage();
  } else if (command === 'check') {
    check();
  } else if (command === 'bundle') {
    bundle(args);
  } else {
    usage();
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  fail(error.message);
}
