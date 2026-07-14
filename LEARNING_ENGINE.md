# FinLit Quest learning engine

## Separation of concerns

The content repository owns immutable educational content. The save owns only player-specific state keyed by stable term IDs. `learningObject(id)` composes both layers at read time, so the application receives the complete object without duplicating definitions, examples, quizzes, or other content in the profile.

Example stable ID: `crypto.token`.

## Composed learning object

Every object returned by `learningObject(id)` combines immutable content with mutable progress and contains:

- `id`, `world`, `category`, `difficulty`, `word`, `definition`
- `pronunciation`, `realLifeExample`, `didYouKnow`, `commonMistake`
- `relatedTermIds`, `quickChallenge`, `xpValue`, `reviewWeight`
- `puzzle`, `challenge`, and `review` metric groups
- `masteryLevel`, `masteryPercent`, `dateUnlocked`, and `dateMastered`
- `dateUnlocked`, `dateMastered`

## Version 3 save

```json
{
  "saveVersion": 3,
  "player": {
    "xp": 10,
    "level": 1,
    "streak": 1,
    "lastPlayed": "2026-07-12T12:00:00.000Z"
  },
  "termProgress": {
    "crypto.token": {
      "masteryLevel": 1,
      "masteryPercent": 38,
      "puzzle": {
        "timesSeen": 1,
        "timesSolved": 1,
        "lettersRevealed": 0,
        "hintsUsed": 0,
        "validAttempts": 1,
        "invalidAttempts": 0,
        "totalSolveTimeMs": 12000,
        "lastSolveDate": "2026-07-12T11:58:00.000Z"
      },
      "challenge": {
        "challengesSeen": 1,
        "challengesCorrect": 1,
        "challengesIncorrect": 0,
        "lastChallengeDate": "2026-07-12T12:00:00.000Z",
        "lastChallengeResult": true,
        "consecutiveCorrect": 1,
        "misconceptionFlags": []
      },
      "review": {
        "againCount": 0,
        "hardCount": 0,
        "goodCount": 1,
        "easyCount": 0,
        "currentEaseFactor": 2.5,
        "currentInterval": 1,
        "lastReviewed": "2026-07-12T12:00:00.000Z",
        "nextReviewDate": "2026-07-13T12:00:00.000Z"
      },
      "dateUnlocked": "2026-07-12T12:00:00.000Z",
      "dateMastered": null
    }
  },
  "objectiveProgress": {},
  "scenarioProgress": {},
  "libraryChallengeProgress": {},
  "worlds": {},
  "settings": {"theme": "light"},
  "updatedAt": "2026-07-12T12:00:00.000Z"
}
```

The storage adapter is injected into `LearningEngine`, so replacing local storage with an IndexedDB or cloud-sync adapter does not change scheduling or content code.

Version 2 saves migrate automatically to version 3. Existing XP, settings, term progress, and unknown future fields are preserved. The three new progress collections begin empty until approved objective, scenario, or library-challenge records are used.

## Learning-objective ownership

Approved objective statements, metadata, term relationships, and prerequisites remain immutable curriculum content. Scenario and challenge IDs become curriculum fields only after their authoritative libraries and mappings are approved. The player save stores only objective IDs and derived progress fields: status, completion percentage, component percentages, activity date, and completion date.

Objective completion is calculated by `ObjectiveEngine` using configurable weights. By default, linked term mastery contributes 60%, Scenario Library completion 20%, and Challenge Library completion 20%. Until approved scenario or challenge mappings exist, those components are absent and the active components are normalized rather than penalizing the learner. Linked terms reach full objective term credit at the configurable mastery threshold of 75%.

## Review outcomes

- **Again:** schedules about 10 minutes, records an error, lowers ease, and returns the term to learning.
- **Hard:** schedules at least one day and slightly lowers ease.
- **Good:** schedules 1 day initially, then 3 days, then grows by the ease factor.
- **Easy:** schedules 4 days initially and grows faster while increasing ease.

Ease is bounded between 1.3 and 3.0. Review intervals are capped at a configurable 3,650 days to prevent invalid dates. `reviewWeight` adjusts interval growth for more demanding concepts.

## Metric ownership

Puzzle metrics and conceptual understanding are intentionally separate.

- **Puzzle:** times seen/solved, letters revealed, hints, valid/invalid attempts, total solve time, last solve, solve accuracy, and average speed.
- **Challenge:** seen/correct/incorrect, accuracy, last date/result, consecutive correct answers, and misconception flags.
- **Review:** Again/Hard/Good/Easy counts, current ease factor, interval, last review, and next review date.

Solving a crossword records puzzle progress only. Answering the applied question records challenge progress. Choosing a confidence rating records review progress and schedules the next review.

## Configurable mastery formula

The default mastery configuration is exported as `DEFAULT_MASTERY_CONFIG`:

- Puzzle completion: **20%**
- Applied challenge performance: **45%**
- Confidence review performance: **35%**
- Two puzzle solves are required for full puzzle credit.
- Three challenge attempts are required for full challenge-confidence credit.
- Three confidence reviews are required for full review-confidence credit.

```text
puzzle = min(1, timesSolved / 2)
challenge = challengeAccuracy × min(1, challengesSeen / 3)
review = weightedConfidence × min(1, reviewCount / 3)
mastery = 20% × puzzle + 45% × challenge + 35% × review
```

Confidence weights are Again `0`, Hard `.45`, Good `.75`, and Easy `1`. Mastery thresholds default to New `0`, Learning `25`, Familiar `50`, Proficient `75`, and Mastered `90`. All weights, repetition requirements, thresholds, and the maximum interval are injected configuration rather than scattered constants.

Crossword completion alone therefore caps at 20% and can never produce mastery. `dateMastered` is set only when combined mastery reaches the configured Mastered threshold and is cleared if mastery later drops below it.

## Scale characteristics

- Term lookup: `Map`, average O(1).
- Player save: sparse; records exist only for encountered term IDs.
- Due review selection: O(n) within the selected world, then capped.
- World metrics: O(n) within the selected world and calculated on demand.
- Content is never copied into player progress.

This model supports tens of thousands of terms. A later content-delivery milestone can lazy-load world packages without changing the repository, scheduler, or save schema.

## Data ownership and cloud readiness

Content files own definitions, examples, insights, mistakes, challenges, relationships, XP, and review weight. The player save owns only profile settings and term progress keyed by stable IDs. Storage is injected into `LearningEngine`; replacing local storage with IndexedDB or a cloud adapter does not alter game rules, content, analytics, or scheduling.
