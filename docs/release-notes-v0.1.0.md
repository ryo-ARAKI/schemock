# Schemock v0.1.0 — release candidate

A common offline editor reads separate node/edge and qualitative-spectrum JSON. Human edits and agent updates can alternate without patching a diagram's HTML.
Format v2 distinguishes diagram family, figure identity, structural revision, immutable reset states and editable current states. Both legacy v1 families have an explicit, original-preserving migration path.
The single HTML has no runtime network/server/install/login requirement; initial support is desktop Google Chrome only.
JSON saves all variants; PNG uses the same renderer and omits editing aids. Save cancellation/failure and stale loads preserve current work.
The data archive provides schemas, format/migration guidance, proposals and repeated-edit fixtures. Technical fixtures do not imply final user adoption.

Checksums are in SHA256SUMS; verify the HTML and data archive before use.
Read docs/releasing.md for validation and known boundaries, including separate native Save dialog and OS IME checks.
Candidate status: not published; public retrieval and downstream ownership switch remain pending.
