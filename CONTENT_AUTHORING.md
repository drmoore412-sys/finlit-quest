# FinLit Quest content-authoring guide

## Source files

- World manifest: `worlds/<world>.json`
- Educational terms: `content/<world>-terms.json`
- Formal schemas: `schemas/world.schema.json` and `schemas/term.schema.json`
- Direct-file adapter: generated with `node scripts/sync-content.js`

Never edit the generated JavaScript adapter by hand. Run `./scripts/test.sh` after changing content.

## Stable identity

Use lowercase IDs in the form `<world>.<concept>`, such as `crypto.token`. IDs are permanent save references. Do not rename or reuse an ID after release. `normalizedWord` is the lowercase form of `word` and must be unique within a world.

## Writing terms

- **Definition:** one concise, beginner-friendly distinction. Avoid unexplained jargon.
- **Pronunciation:** ordinary readable syllables, not IPA.
- **Real-life example:** show where a normal user encounters the concept or makes a decision.
- **Did you know?:** add context, consequences, or a useful distinction; do not repeat the definition.
- **Common mistake:** describe a realistic misunderstanding, risk, scam pattern, or misuse.
- **Related terms:** reference stable IDs only. Choose concepts that genuinely help build a mental model.
- **XP and review weight:** increase modestly with conceptual difficulty; both must be positive.

## Writing challenges

Every term needs at least one applied challenge with one defensible best answer. Supported types are multiple choice, scenario choice, true/false, best example, common mistake, and comparison. Avoid trivia, trick wording, double negatives, and choices that depend on missing assumptions. The explanation must teach why the best answer is correct and remain useful after an incorrect response.

## Building levels

- Reference existing uppercase term words.
- Ensure every target can be formed from the wheel, including repeated letters.
- Begin with fewer, shorter, concrete concepts.
- Increase conceptual difficulty, word count, board complexity, and application frequency gradually.
- Do not use crossword completion as proof of conceptual mastery; challenges and review provide most mastery credit.

## Validation workflow

1. Edit canonical JSON.
2. Generate the direct-file adapter: `node scripts/sync-content.js`.
3. Run `./scripts/test.sh`.
4. Fix every actionable validation error before previewing the world.
5. Play the complete level and read every lesson as a learner would.
