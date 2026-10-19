# FinLit Quest Crossword Candidate Pipeline

This command-line pipeline collects candidate words, generates strict crossword candidates, validates them, ranks only valid results, and produces owner-review reports. It does not modify approved curriculum or live puzzle banks.

## Governing quality standard

All new quiz research and candidate generation must follow `docs/FINLIT_QUEST_NEW_QUIZ_QUALITY_STANDARD.md`.

- A candidate is ineligible with fewer than 3 required words or fewer than 3 approved financial terms.
- Four or five required words are preferred.
- Educational value and previously unencountered approved financial concepts take priority over convenient letter combinations.
- Every candidate needs a concept-focused comprehension question before owner review.
- Duplicate answer compositions are rejected.
- The active 27-quiz slate is a protected baseline and cannot be modified by this pipeline.

## Trust boundaries

- Governed financial terms are loaded from the five current world vocabularies and retain their permanent ID, definition, owning world and mastery ID when reused across worlds.
- ACH and WORTH are loaded through the approved V3 supplement.
- Ordinary words already approved in the V3 compositions are available as supporting words.
- Scraped or newly collected words begin as `unreviewed`. They cannot pass the ordinary-vocabulary gate until the owner changes their status to `approved-support` in a review copy.
- Output paths inside `content/`, `curriculum/`, `src/`, and `worlds/` are refused.

## Source manifest

```json
{
  "world": "credit",
  "sources": [
    {"id": "local-notes", "path": "/absolute/path/to/source.txt"},
    {"id": "official-page", "url": "https://example.gov/education/page"}
  ]
}
```

Only collect from sources the owner is authorized to use. Collection records provenance and frequency; it does not make an educational approval decision.

## Commands

```sh
node scripts/crossword-candidate-cli.mjs collect \
  --sources=staging/source-manifest.json \
  --out=staging/credit-keywords.json

node scripts/crossword-candidate-cli.mjs generate \
  --world=credit \
  --anchor=credit.repayment \
  --keywords=staging/credit-keywords.json \
  --out=staging/repayment-review

node scripts/crossword-candidate-cli.mjs benchmark \
  --world=credit \
  --keywords=staging/credit-keywords.json \
  --out=staging/credit-benchmark.json
```

Each generated candidate receives JSON and Markdown review files containing its world, anchor, permanent financial identities, ordinary supporting words, ASCII crossword preview, validation results, ranking factors and approval status.

Invalid candidates receive no ranking score. Export refuses candidates unless their approval status is exactly `owner-approved`, then reruns the entire validation suite against the authoritative term registry before writing anything.

## Approval workflow

1. Collect candidate words into staging.
2. Review ordinary words and explicitly mark acceptable records `approved-support`.
3. Generate candidates that satisfy the minimum word and financial-term gates.
4. Review educational value, the comprehension question, validation output, uniqueness, and ranking explanation.
5. The owner records approval by changing the selected candidate's `approvalStatus` to `owner-approved`.
6. Export to another staging file.
7. Integrate the exported record only after separate implementation authorization and a reviewed game-content change.

The export command never edits the live V3 slate or permanent term identities.
