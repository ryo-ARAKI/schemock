# Schemock data format v2 (app 0.1.0)

The format and rendering rules are owned here, independently of any agent/skill.
Use `format: "schemock"`, `schema_version: 2`, and explicit `diagram_kind: "node-edge" | "spectrum"`.
Version 1 cannot identify a diagram family: use the explicit migration operation.
Unknown versions, fields, kinds, or malformed data are rejected entirely with a JSON path.
The JSON Schemas in `schemas/` define allowed properties and types; `validateDocument` additionally checks unique IDs, references, reset/current relationships, cubic chains and retained constraints.
No string is evaluated as HTML, JavaScript, CSS, or Typst.

## Common document

`figure_id` identifies the figure; `base_revision` is its structural revision, independently of the app version.
`selected_variant_id` references one of nonempty `variants[]`.
Each variant has unique nonempty `id`, `title`, `initial` (reset basis) and `current` (editable state).
The coordinate system is exactly `{origin:"top-left",x_axis:"right",y_axis:"down",width:731.125,height:463.5,unit:"draft-unit"}` with arbitrary positive frame dimensions.
All numbers must be finite with absolute value < 1e7; sizes, text sizes and line widths must be positive.
Coordinates are neither clamped nor fitted automatically.
The SVG viewBox follows this frame; PNG is the nearest integer pixel size to width×2 by height×2.
All labels permit up to 10,000 characters; all point lists have up to 1,000 points.
IDs and names are plain strings, including punctuation; IDs are unique across a scene's collections and constraints.

`snapshot`, when present, is `{id, exported_at, app_version}`: an output ID, ISO timestamp and emitting app version.
It proves neither final adoption nor delivery to an agent.
A differing emitting app version alone does not prevent a compatible format from opening.
History is tab-local, crosses all variants, and is not serialized.

## Node/edge

| Collection | Required properties | Optional color |
| --- | --- | --- |
| elements | id, group_id (null or flat group ID), x, y, width, height | fill, stroke |
| groups | id, x, y, width, height | fill, stroke |
| labels | id, owner_id (null or element/group ID), x, y, text, fontSize | fill |
| connections | id, from/to `{element_id,anchor}`, waypoints `[{x,y}]`, directed (boolean) | stroke |
| constraints | id, kind, ids (element IDs); group_id only for inside | none |

Anchors: north, south, east, west, center.
Constraints: align-x, align-y, equal-size, equal-gap, inside.
They declare intent and never snap/reflow direct edits.
Element x/y is relative to its group; an owned label is relative to its owner; free labels and waypoints use canvas coordinates.
Group offsets are applied once.
Resize about the group top-left scales child geometry and owned-label offsets, leaving fontSize, free labels, and waypoints unchanged.
Endpoints are recalculated from current element rectangles.

## Spectrum

`paths[]`: id, type (`polyline` or `cubic`), points, width, directed, dash (boolean); optional stroke.
Polyline needs at least two points; cubic needs one start plus groups of two controls and one endpoint.
`regions[]`: id, x, y, width, height; optional fill.
`labels[]`: id, x, y, text, fontSize; optional fill.
All coordinates are canvas coordinates.
Every control point participates in drag/input/export, not only endpoints.
Path type, point count, width, direction and dash remain fixed during local editing.

## Initial/current and colors

Current collections are subsets of initial collections; deletion is absence, never a hidden flag.
Retained ownership, group membership, endpoints, direction and path structure must equal initial.
Node deletion removes owned labels and incident connections; group deletion additionally removes children and group labels.
Independent free/connection labels remain.
Current constraints are exactly the initial declarations whose references survive.
Spectrum objects delete independently.
Empty current scenes remain valid and can reset, undo, switch variants and save.
Initial is immutable during local editing, deletion, restore and save.
A complete new document may have a different reset basis; restoration into an existing document may not.

Initial colors permit the 18 Typst names or #RRGGBB.
Current changes permit these names or the object's exact initial color; returning to an absent initial color omits the property.
Defaults (hex): elements fill e0f0ef/stroke 267b79; groups fill f2f7fa/stroke 8cabb9; connections stroke 23566b; paths stroke 203e50; regions fill edf2f5; node labels fill 192d40; spectrum labels fill 203e50.
The app and final Typst use this fixed RGB table (CSS names differ); explicit colors in older examples retain their RGB.

| Typst name | RGB |
| --- | --- |
| black | #000000 |
| gray | #aaaaaa |
| silver | #dddddd |
| white | #ffffff |
| navy | #001f3f |
| blue | #0074d9 |
| aqua | #7fdbff |
| teal | #39cccc |
| eastern | #239dad |
| purple | #b10dc9 |
| fuchsia | #f012be |
| maroon | #85144b |
| red | #ff4136 |
| orange | #ff851b |
| yellow | #ffdc00 |
| olive | #3d9970 |
| green | #2ecc40 |
| lime | #01ff70 |

The implementation is `src/colors.js`; the table above keeps the downloaded format archive sufficient for offline handoff.

## Open, restore, save

Open validates the entire arbitrary document before replacing it; successful open starts new history.
Restore compares format/kind, figure/revision, coordinates, variant set/titles and every initial before applying all current states and selected variant as one undoable operation.
Unsaved/unfinished work requires cancel-to-save or explicit discard.
Invalid input, cancel, failed reads and stale asynchronous responses preserve current work and raw field text.
One continuous field edit, drag, resize, deletion, variant switch, reset or restore is one chronological history entry.
Selection/noops/invalid input/save do not clear redo or add history.
Native input undo, caret, focus, line breaks and IME are retained.
Incomplete fields stay raw; only last valid values enter JSON, with a save notice.
Display rounds to at most two decimals; unchanged point components retain original Number precision.

JSON captures all variants; PNG captures the selected variant without handles, guides or selection styling.
Both capture at operation start, use the same renderer, and serialize saves.
Native write success is reported only after close; later edits remain unsaved.
Download fallback reports a request and leaves the unsaved guard active.
Cancel, permission, write, close or image failures preserve the work/history.
No persistence, automatic backup, automatic synchronization, network calls or OS overwrite atomicity is promised.
