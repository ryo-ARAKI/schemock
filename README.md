# Schemock

Document contracts for an offline scientific composition editor.
Format v2 distinguishes diagram family, figure identity, structural revision,
immutable reset states and editable current states for node/edge diagrams and
qualitative spectra/profiles.

Read [data format v2](docs/data-format-v2.md), the schemas in `schemas/`,
and the independent, valid and invalid examples and fixtures.
Runtime validation checks identity, references and retained structure in
addition to the JSON schemas.

## Development

Use installed Node >=22. There are no npm dependencies or install step.

```fish
npm test
```
