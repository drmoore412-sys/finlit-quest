// Governed Money Basics runtime bank v2.
// 34 approved terms are active across 10 standard clusters and one documented
// two-answer exception. INFLATION and PAYCHECK remain approved vocabulary but
// are not active — see docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md.
window.MONEY_BASICS_PUZZLES = [
  {
    // Originally CASH+PAY+PAYCHECK: PAY is a literal prefix of PAYCHECK, so
    // selecting P-A-Y auto-submits "PAY" (the shared word-game engine submits
    // as soon as any selection spells a known answer, live-tested during
    // V1.0 Blocker 6) before C-H-E-C-K can ever be added — PAYCHECK could
    // never be solved in that grouping, on any input method. Swapped PAY for
    // NET (no conflict, same 9-tile budget); PAYCHECK moved to the
    // governance gap since no approved term can pair with it at all.
    id: "MB-V2-C01",
    words: ["CASH", "PAY", "NET"],
    letters: ["A", "C", "E", "H", "N", "P", "S", "T", "Y"],
  },
  {
    id: "MB-V2-C02",
    words: ["SPEND", "NEEDS", "EXPENSE"],
    letters: ["D", "E", "E", "E", "N", "P", "S", "X"],
  },
  {
    id: "MB-V2-C03",
    words: ["COST", "PRICE", "DEPOSIT"],
    letters: ["C", "D", "E", "I", "O", "P", "R", "S", "T"],
  },
  {
    id: "MB-V2-C04",
    words: ["RECEIPT", "PROFIT", "FEE"],
    letters: ["C", "E", "E", "F", "I", "O", "P", "R", "T"],
  },
  {
    id: "MB-V2-C05",
    words: ["INCOME", "CHANGE"],
    letters: ["A", "C", "E", "G", "H", "I", "M", "N", "O"],
    longWordException: true,
    longWordExceptionReason: "INCOME and CHANGE require all nine wheel tiles; no approved third Money Basics answer fits the remaining letter budget.",
  },
  {
    id: "MB-V2-C06",
    words: ["BUDGET", "BILL", "DEBIT"],
    letters: ["B", "D", "E", "G", "I", "L", "L", "T", "U"],
  },
  {
    id: "MB-V2-C07",
    words: ["WAGE", "SAVING", "SALE"],
    letters: ["A", "E", "G", "I", "L", "N", "S", "V", "W"],
  },
  {
    id: "MB-V2-C08",
    words: ["SALARY", "GOAL", "LOSS", "GROSS"],
    letters: ["A", "A", "G", "L", "O", "R", "S", "S", "Y"],
  },
  {
    id: "MB-V2-C09",
    words: ["RATE", "WEALTH", "CHARGE"],
    letters: ["A", "C", "E", "G", "H", "L", "R", "T", "W"],
  },
  {
    id: "MB-V2-C10",
    words: ["MONEY", "PAYMENT", "WANT"],
    letters: ["A", "E", "M", "N", "O", "P", "T", "W", "Y"],
  },
  {
    id: "MB-V2-C11",
    words: ["EARN", "VALUE", "FUND", "REFUND"],
    letters: ["A", "D", "E", "F", "L", "N", "R", "U", "V"],
  },
];
