import { check } from './commands/check.mjs';
import { list } from './commands/list.mjs';
import { createCapability } from './commands/capability-create.mjs';
import { createSlice } from './commands/slice.mjs';
import { sliceReady } from './commands/slice-ready.mjs';
import { bundle } from './commands/bundle.mjs';
import { capabilityPack } from './commands/capability-pack.mjs';
import { clean } from './commands/clean.mjs';

export async function run(args) {
  const [command, ...rest] = args;
  switch (command) {
    case 'check': return check(rest);
    case 'list': return list(rest);
    case 'capability:create': return createCapability(rest);
    case 'slice': return createSlice(rest);
    case 'slice:ready': return sliceReady(rest);
    case 'bundle': return bundle(rest);
    case 'capability': return capabilityPack(rest);
    case 'clean': return clean(rest);
    case undefined:
    case 'help':
    case '--help':
      return help();
    default:
      throw new Error(`Unknown AIDD command: ${command}\nRun npm run aidd -- help`);
  }
}

function help() {
  console.log(`AIDD commands

  check                         Validate workspace structure
  list                          List capabilities and delivery slices
  capability:create <slug>       Create a capability
  slice <capability>             Create a scope-locked delivery slice
  slice:ready <slice-id>         Mark a delivery slice ready after validation
  bundle <slice-id>              Export an implementation bundle for a ready slice
  capability <slug>              Export a capability pack
  clean                          Remove generated bundles

Examples

  npm run aidd:capability:create -- payments --title "Payments"
  npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"
  npm run aidd:slice:ready -- PAY-SLICE-001
  npm run aidd:bundle -- PAY-SLICE-001
`);
}
