# Money Basics Cluster Governance Gap

Date: 2026-07-23 (updated same day — see "PAYCHECK" below)
Status: Open
Runtime bank: Money Basics v2

## Quality gate result

The approved Money Basics vocabulary contains 36 terms. Under the governed
nine-tile wheel and the prohibition on one-answer puzzles, 34 terms can be
assigned to compliant active puzzles:

- 10 standard puzzles containing three or four required answers
- 1 documented two-answer long-word exception
- 0 one-answer puzzles

## Unresolved terms

| Stable ID | Term | Wheel size alone | Compatible approved partners | Runtime status |
|---|---|---:|---:|---|
| `moneybasics.inflation` | INFLATION | 9 | 0 | Approved vocabulary; not active in the v2 puzzle bank |
| `moneybasics.paycheck` | PAYCHECK | 8 | 0 | Approved vocabulary; not active in the v2 puzzle bank |

`INFLATION` requires all nine wheel tiles because its repeated `I` and `N`
letters must be represented exactly. No other approved Money Basics answer can
be added without exceeding the wheel budget. It therefore cannot form either a
standard three-answer puzzle or a permitted two-answer exception.

`PAYCHECK` uses eight of nine wheel tiles alone, leaving no room for any
approved partner term (checked against all 35 other approved Money Basics
terms — zero fit within the remaining one-tile budget). It was originally
grouped with `CASH` and `PAY` in a three-answer cluster (`MB-V2-C01`), but
`PAY` is a literal prefix of `PAYCHECK` — the shared word-game engine submits
a word the moment a player's letter selection spells any known answer in the
puzzle (confirmed during V1.0 Blocker 6's tap-input fix), so selecting
P-A-Y always auto-submits "PAY" before C-H-E-C-K can be added, regardless of
input method. That made `PAYCHECK` structurally unsolvable in that grouping —
this was live-reproduced during the tutorial-hints fix (2026-07-23) before
being corrected, not merely inferred. `PAY` was moved to `NET` in `MB-V2-C01`
(no conflict, same nine-tile budget); `PAYCHECK` has no other valid home and
was removed from the active bank rather than left in an unsolvable puzzle.

## Required governance decision

One of the following must be approved before `INFLATION` or `PAYCHECK` can
become active:

1. Approve additional compatible Money Basics vocabulary.
2. Approve an expanded wheel for these puzzles.
3. Approve a specifically governed one-answer tutorial or long-word mode.
4. For `PAYCHECK` specifically: approve a change to the shared word-game
   engine so a prefix match no longer auto-submits when a longer valid word
   in the same puzzle could still be completed. This is a cross-world engine
   change (affects Credit, Crypto, and Banking Basics too), not a
   Money-Basics-only fix, and was out of scope for this pass.

No filler answer, reserve term, or cross-world term has been activated.
