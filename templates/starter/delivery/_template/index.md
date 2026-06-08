# Delivery Slice Template

This folder describes the generic shape of a scope-locked delivery slice.

Do not implement this template. Create a real slice from a real capability:

```powershell
npm run aidd:slice -- <capability> --id <SLICE-ID> --title "<Slice Title>"
```

## Files

- [Delivery slice](./delivery-slice.md)
- [Manifest](./manifest.json)

## Readiness rule

A delivery slice starts as `draft`. It must be marked `ready` before an implementation bundle can be generated.
