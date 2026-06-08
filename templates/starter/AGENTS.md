# AGENTS

AI agents should load context in this order:

1. The delivery slice or generated bundle.
2. The capability referenced by the slice.
3. The modules referenced by the capability.
4. Common delivery rules, standards, and decision ledger.

Respect module boundaries. Do not expand implementation scope beyond the delivery slice.
