# Explicit legacy migration

Source baseline: dotfiles-public PR #36 head `570535453ec3335cf76b310b8ae604aa4ab3c2ff` (unchanged target files at primary `ded68fdb8f9982cafd59fd454ef97775b253a97b`).
The two old formats both say schema_version 1 and must never be guessed from that number.
Use **旧JSONを移行**, explicitly choose node/edge or spectrum, select the old JSON, and save a separate `-v2.json`.
Migration does not open or modify the editing document; open the resulting file separately.
Keep the original bytes as provenance.
The save target must have a different name from both the legacy input and any supplemental original JSON/HTML.
Names are compared after Unicode NFC normalization and without case differences, protecting case-insensitive desktop filesystems before any writer is opened.
If initial states are absent, additionally select the matching complete original JSON or known old HTML containing `const INITIAL = { ...JSON... }`.
Only that JSON literal is decoded; no HTML/JavaScript is executed.
The original figure/revision/coordinates/variant set and any supplied initial states must match.
Missing current states, unknown extensions, reset mismatch and unsupported structure are refused rather than inferred.

Identity, all variants/current states, deletion absences, initial states, color presence/absence, text, full Number precision and all curve points are preserved.
Only format identifiers and emitting app information for a legacy snapshot are added.
Fixtures cover complete, edited, deleted, empty and missing-initial inputs for each family.
The 6 previous browser cases protected editing/drag, relative groups/anchors, cross-variant history/reset, native form/IME input, exact precision, all color roles/RGB, deletion dependencies/constraints/empty states, JSON/PNG and failure atomicity.
Their responsibility now belongs to Schemock's public-UI and pure-logic tests, independent of their historical count or internal globals.
