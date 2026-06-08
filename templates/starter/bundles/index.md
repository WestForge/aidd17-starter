# Bundles

Bundles are generated agent-ready outputs.

Do not edit generated bundles by hand. Edit the source capability or delivery slice, then regenerate the bundle.

## Commands

```powershell
npm run aidd:bundle -- <SLICE-ID>
npm run aidd:capability -- <capability-slug>
```

Implementation bundles are only generated for delivery slices marked `ready`.
