# Schemock

One offline editor, separate diagram JSON. Adjust scientific composition drafts in desktop Google Chrome, then manually exchange the JSON with your agent and produce editable Typst from the adopted result.
The first release supports node/edge diagrams and qualitative spectra/profiles. Scientific meaning, structural changes and final typesetting belong to the person and agent.

## Candidate 0.1.0 / format 2

This checkout contains an unpublished release candidate. Publication and the downstream skill switch are separate checkpoints.
`dist/schemock-v0.1.0.html` is the self-contained app; `dist/schemock-v0.1.0-data.tar.gz` holds the format, examples and migration fixtures; `dist/SHA256SUMS` records their exact bytes.
After downloading the release, verify its checksums, open the HTML with Chrome (`file://`), and choose a separate JSON with **新しい図を開く**.
No server, network, runtime dependency installation, login, agent, local storage or dotfiles checkout is needed to edit.
Only desktop Chrome is supported in 0.1.0.

Direct edits include position/size/group scaling, labels/newlines/size/colors, route points and every cubic control point, dependency deletion, history and per-variant reset.
**保存状態を復元** checks the same figure/revision/reset basis; use **新しい図を開く** for a different figure or structural revision.
JSON saves all variants; PNG saves only the selected composition at twice its frame dimensions, without handles or editor decorations.
A native save is complete only after close. Download fallback reports a request: check the resulting file yourself; Chrome may limit repeated download requests.
Cancel/failure preserves work; edits made while saving remain unsaved. Incomplete fields export the last valid values with a notice; confirm IME before saving.
Use the explicit legacy migration section for either old v1 format, select its family, retain the original and save a separate v2 JSON.
The app never sends files to an agent. An intermediate export does not mean final adoption.

## Development (Node >=22, installed Chrome)

There are no npm dependencies and no install step.

```fish
npm test
npm run preview -- --input examples/node-edge.json --output-dir /tmp/schemock-previews
npm run verify:release
```

`npm test` checks pure logic and the built single HTML in network-disabled real headless Chrome with actual JSON/PNG downloads, public UI, failure injection and handoff exercises.
Chrome absence or required test failure is fatal; native save-dialog and actual OS IME verification are separate manual checks documented in [releasing](docs/releasing.md).
Generated `dist/` and `artifacts/` are ignored. Source modules are bundled locally; runtime imports/CDNs/data fetches are absent.

Read [data format v2](docs/data-format-v2.md), [agent workflow and both exercises](docs/agent-workflow.md), [legacy migration](docs/migration-v1.md), and [release checks](docs/releasing.md).
Schemas supplement runtime reference/structure checks; they are not a substitute for them.
Sources/fixtures adapted from dotfiles-public PR #36 head `570535453ec3335cf76b310b8ae604aa4ab3c2ff`; all app development and browser validation now run independently here.
