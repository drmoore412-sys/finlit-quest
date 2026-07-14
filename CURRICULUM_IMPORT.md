# Curriculum Import Pipeline

The approved workbooks are the editorial source. Generated, validated JSON is the only curriculum format consumed by the game.

## Pipeline

1. Place immutable authoritative workbooks in `curriculum/<world>/approved/workbooks/`.
2. Store `import-map.json` in `curriculum/<world>/approved/`. It names exact workbook files, worksheets, header rows, and column headings for four datasets: `sections`, `objectives`, `approvalLog`, and `controlledValues`.
3. Run `scripts/import-curriculum.mjs --map curriculum/<world>/approved/import-map.json`.
4. The importer hashes every source workbook plus the approval-log and controlled-values records, validates all relationships and approval states, and writes Markdown and JSON import/validation reports after every attempted import.
5. Runtime JSON is written only to `approved/runtime/` when the report passes. Failed validation never replaces usable runtime curriculum.
6. `CurriculumLoader` validates the generated JSON again before exposing indexed sections and objectives to the game engine.

The import map is implementation metadata, not curriculum. It must be derived from the actual approved workbook headings. The importer rejects workbook paths outside `approved/workbooks/` and derives runtime/report destinations itself, preventing source/output mixing.

## Import map contract

The root fields are `world`, `curriculumVersion`, optional `termIds`, and `datasets`. Each dataset identifies `workbook`, `sheet`, `headerRow`, `fields`, and optional `listFields`. Field keys are generated JSON paths; values are exact workbook column headings. Nested paths such as `metadata.order` are supported. List fields specify a heading and delimiter.

Scenario and challenge datasets or mappings are intentionally absent. They will be added only when those libraries are approved.

## Quality gate outputs

Every import produces `<world>-world-import-report.md`, `<world>-world-import-report.json`, and `<world>-world-validation-report.json`. Reports include section and objective totals, supporting-term reference counts, duplicate IDs, missing references, invalid prerequisites, approval-state totals, warnings, runtime-output status, and a final PASS or FAIL result.

## Pipeline freeze

`curriculum/pipeline-policy.json` records the shared pipeline version. After the first successful Credit import and runtime verification, change its status to `frozen`. Banking, College Funding, Investing, Insurance, Taxes, Real Estate, Business, Crypto, and later worlds must use the same pipeline and directory contract. Changes after freeze require a versioned pipeline migration, not world-specific handling.

## Runtime and compatibility

Generated files use curriculum `schemaVersion: 1`, independently of player-save versions. Player saves remain migrated by the existing learning engine, so Milestone 3 saves continue to load without embedding or duplicating curriculum content.
