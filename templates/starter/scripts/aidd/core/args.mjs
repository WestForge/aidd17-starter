export function getFlag(args, name, fallback = undefined) {
  const prefix = `--${name}=`;
  const direct = args.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? fallback;
  return fallback;
}

export function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

export function positional(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (!arg.includes('=') && args[i + 1] && !args[i + 1].startsWith('--')) i++;
      continue;
    }
    out.push(arg);
  }
  return out;
}

export function titleFromSlug(slug) {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
