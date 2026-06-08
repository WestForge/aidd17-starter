# Delivery

Delivery contains scope-locked slices created from capability snapshots.

Delivery slices are not created during setup. Create a capability first, then create a slice:

```powershell
npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"
```

## Generic delivery slice template

Use the template as a reference for what a delivery slice must contain:

- [Delivery slice template](./_template/index.md)

## Delivery lifecycle

1. Create a delivery slice from a capability.
2. Edit the slice until scope, files, tasks, and acceptance criteria are clear.
3. Mark the slice ready.
4. Generate an implementation bundle.
5. Hand the bundle to an implementation agent or developer.
