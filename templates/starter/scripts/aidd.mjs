#!/usr/bin/env node
import { run } from './aidd/cli.mjs';

run(process.argv.slice(2)).catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
