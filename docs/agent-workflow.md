# Agent and person editing loop

This app is independent of agents; no API, automatic send, synchronization or merge exists.
Use desktop Chrome and the same versioned app for proposals and direct edits.
Meaning and receiving conditions come first: required entities/relations/directions, qualitative versus measured quantities, containment, labels, assets and provenance, receiving width/height, language and output formats.
Use 20 draft-unit default outer padding unless the receiving composition requires otherwise.
Prepare 2–3 meaningful reading paths/groupings as variants in v2 JSON; do not merely recolor one arrangement.
The initial app supports node/edge rectangles with flat groups and qualitative spectrum paths/regions/labels only.
Unsupported images, set shapes or specialized primitives need an explicit separate solution; never silently replace them with boxes or generate a patched editor.
Use `npm run preview -- --input examples/roundtrip/node-edge/00-proposals.json --output-dir /tmp/node-proposals` for the identical validated renderer used in the app.
The command fails if installed Chrome is unavailable; it has no package dependency.

## Exchange during adjustment

1. The person opens a JSON, directly adjusts geometry, text/newlines, color, route/control points, or deletes dependencies, then saves an intermediate JSON.
2. They manually supply the latest saved JSON and requested delta to the agent.
3. Keep those original bytes unchanged. Validate the complete input; compare identity, revision, variant set, initial basis, retained ownership/connections/path structure, deletions and precise coordinates against the last supplied version. Browser acceptance is not an agent-side comparison.
4. Produce a separately named JSON and static PNG(s), plus a changed-ID/property table. Preserve unrelated current text/colors/geometry/precision/deletion in every variant. Do not infer missing edits from screenshots, remembered positions, or old source.
5. The person loads the returned JSON in the same app and continues direct edits. Repeat as often as needed.

A local adjustment preserves figure ID, structural revision and every initial state. Use **保存状態を復元** to apply it as one undoable operation.
A structural change preserves figure ID and retained IDs, updates base_revision, and reconciles initial/current structures deliberately. Add new objects to both; preserve unchanged initial entries and deletion absences; never copy edits to a different replacement implicitly.
Use **新しい図を開く** for this new revision; previous document history does not cross the boundary.
Old-revision restoration must fail; do not loosen the validator to merge it.
If human edits continued after the handoff, obtain the latest JSON and reconcile the requested delta before replacement. The app's explicit discard/cancel guard is not an automatic merge or conflict resolver.
Unfinished fields and IME provisional text are not in the saved JSON and cannot be transferred to an agent.

## Reproducible technical exercises

Each `examples/roundtrip/{node-edge,spectrum}/` contains a complete 6-step exercise:

| File | Operation | Identity/reset contract |
| --- | --- | --- |
| 00-proposals.json | Two meaning-equivalent compositions; process reading path or qualitative region emphasis | r1, full initial/current |
| 01-human.json | Direct local geometry/text/color edits, deletion and another variant's independent text | Same r1 and initial |
| 02-agent-local.json | Change only input-text.x or profile-text.x | Same r1 and initial; restore/undo |
| 03-human.json | Continue group position or band width editing | Preserve agent delta and all other variants |
| 04-agent-structure.json | Add refine node/label/relation or a distinct transfer cubic/label | r2, new objects in initial/current; previous deletions stay absent |
| 05-resumed.json | Direct label or transfer control-point edit in the new revision | r2, no restoration of removed objects |

`tests/browser/roundtrip.test.mjs` replays real UI edits, actual downloaded intermediate JSON, restore/undo/redo, cancel after additional edits and new-revision open using unchanged HTML.
`tests/unit/roundtrip.test.mjs` compares every unaffected field and initial state between steps.
Fixtures represent technical verification, never the user's final adoption or delivery acknowledgment.

## Adopted JSON to Typst

Before real final production, identify the JSON the person explicitly adopts: figure/revision, selected variant and snapshot ID/hash. Intermediate requests, downloads and tests do not satisfy this checkpoint.
Use only the selected current state; deleted elements stay absent.
Carry literal labels/line breaks safely into Typst content, named colors via Typst's fixed RGB mapping, all geometry and every cubic control point.
Write readable, self-contained Typst with local settings, semantic placements and small repeated-shape helpers; do not build an automatic JSON converter.
For CeTZ use y_up = frame_height - y_down, applying group offsets once and converting both rectangle corners.
Record physical unit, canvas aspect, any cleanup displacement and intentional font/math differences; preserving exact coordinates with zero cleanup is valid.
Show visible layout changes before adoption; never conceal them as coordinate cleanup.
Compile the final source in a directory containing no app/JSON, then in receiving contexts while preserving host page/text/numbering/bibliography/slide settings.
Inspect PDF size/page count, extracted labels and rendered output at receiving size.

The integration skill owns final sources and receiving examples. Schemock's JSON is provenance, never an ordinary compilation dependency.
