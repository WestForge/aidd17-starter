# Capabilities

Capabilities are evolving definitions of product or technical areas.

No real capabilities are created during setup. Create one explicitly when the project is ready:

```powershell
npm run aidd:capability:create -- payments --title "Payments"
```

## Generic capability template

Use the template as a reference for the sections every capability should complete:

- [Capability template](./_template/index.md)

## Capability lifecycle

1. Create the capability workspace.
2. Complete the numbered capability files in order.
3. Create a delivery slice when there is a bounded piece of work.
4. Mark the slice ready after review.
5. Generate an implementation bundle.
