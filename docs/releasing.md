# Release 0.1.0 preparation and verification

Runtime: self-contained HTML, schema v2, desktop Google Chrome only.
No installs are needed for users; development uses installed Node >=22 and Chrome, with no npm packages.
The source and data archive contain no dotfiles checkout dependency.

## Before publication

Run `npm test`, `npm run build`, `npm run verify:release` and inspect the generated wide/narrow UI, static PNGs and downstream Typst/receiving PDFs.
The verifier checks exact SHA-256 and previews arbitrary-ID/frame fixtures from isolated directories containing only HTML and JSON, with network disabled and zero remote request attempts.
Run source-only build/tests from a relocated copy to verify no absolute path or dotfiles dependency.
No required Chrome test may be skipped; command startup failure is not application failure/success.

Artifacts: `dist/schemock-v0.1.0.html`, `dist/schemock-v0.1.0-data.tar.gz`, `dist/SHA256SUMS`.
The archive includes format/agent/migration/release docs, schemas, all example stages, v1/independent/invalid fixtures and an internal checksum list.
Build bytes are deterministic for an unchanged tree; never hand-edit dist HTML.
Record candidate tree/file checksums, input fixtures, Node/Chrome/OS, test logs, rendered outputs and self-review findings in local evidence.

Manual desktop Chrome checks are required in addition to automation:

1. Open the HTML using file:// after copying only HTML and JSON to a separate directory; disable network.
2. Open both families, type Japanese using an actual IME, confirm conversion, save JSON and reopen it. Confirm all final text/newlines survive; compare native field undo and diagram undo.
3. Exercise actual native JSON and PNG Save dialogs: complete save, cancel, and retry. Verify the saved bytes/image; cancel must leave edits/unsaved state/history intact.
4. Edit while a native save is pending and verify new edits remain unsaved. Check fallback download requests separately from completed writes.

Our automated tests cover actual Chrome UI/download/reload, injected native write/close/cancel failures, IME events and save races; stubs and Input.insertText do not establish OS IME or native dialog success.
If a connected-browser policy blocks file:// or native dialogs, report that gap; do not replace it with a successful stub result.

## Publication authority and order

Prepare reviewable files/release notes before asking for authorization to commit/push/tag/publish.
No public operation, direct push, environment install or downstream live deployment is implied by a local test run.
After approval, publish the reviewed source and tag `v0.1.0`, then upload precisely the three assets to `ryo-ARAKI/schemock` GitHub Release `v0.1.0`.
Fetch the fixed release URLs into a fresh directory, compare SHA-256 against the reviewed bytes, and repeat the isolated offline checks on fetched bytes.
Do not call D2 complete before this public-download verification.

Only then apply the downstream skill candidate: pin app 0.1.0/format2 and the verified SHA, update all workflow references, remove the two old HTML resources and dedicated browser tests listed in the implementation plan, check manifest copying/references and Typst examples, and run the full dotfiles suite once.
Keep all original/user JSON, existing Typst examples and unrelated previews/worktrees unchanged.
Do not call D8/D9 complete based solely on an uninstalled temporary candidate.

Expected fixed HTML URL after publication:
https://github.com/ryo-ARAKI/schemock/releases/download/v0.1.0/schemock-v0.1.0.html
