# Curriculum assets

Every world uses the same approved-content pipeline:

Draft → Review → Approve & Lock → Place workbook in `approved/workbooks/` → Run import → Validate → Generate JSON → Load in game.

The game reads generated JSON only. It never reads, edits, or depends on workbook files.

World folders must use this exact structure:

```text
curriculum/<world>/approved/
  import-map.json
  workbooks/  immutable approved editorial sources
  runtime/    generated JSON; never edited manually
  reports/    generated import and validation reports
```

The import pipeline is shared across all worlds. World-specific importer code is prohibited.
