# Schemock

One offline editor, separate diagram JSON. The editor supports node/edge
diagrams and qualitative spectra/profiles in desktop Google Chrome.
Scientific meaning, structural changes and final typesetting belong to the
person and agent.

## Run locally

Build `dist/schemock-v0.1.0.html`, open it with Chrome using file://, and choose
`examples/node-edge.json` or `examples/spectrum.json` with **新しい図を開く**.
No server, network, runtime dependency installation or login is needed.
JSON saves all variants; PNG saves the selected composition without editing aids.
Native save completion, cancellation, OS IME and download requests require
separate attention when verifying real desktop behavior.

## Development

Use installed Node >=22. There are no npm dependencies or install step.

```fish
npm test
```

The test command checks pure logic, builds the self-contained HTML and runs
network-disabled real Chrome tests with actual JSON/PNG downloads.
Chrome is required and tests may not be skipped.
Read [data format v2](docs/data-format-v2.md) and
[legacy migration](docs/migration-v1.md).

Read [agent workflow and both exercises](docs/agent-workflow.md) for repeated
human and agent edits, structural revisions and adopted JSON to Typst.
Create static previews with the same renderer:

```fish
npm run preview -- --input examples/roundtrip/node-edge/00-proposals.json --output-dir /tmp/schemock-previews
```
