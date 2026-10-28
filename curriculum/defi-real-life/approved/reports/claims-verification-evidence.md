# DeFi in Real Life: claims verification evidence (DRAFT, updated 2026-10-28, release-blocker cleanup)

Status counts (40 entries): VERIFIED 19 · REWORD 0 · SIMULATION ASSUMPTION 20 · UNVERIFIED 1. SIMULATION ASSUMPTION means the player-facing text itself says the item is fictional or simplified (basis recorded per entry); it is not VERIFIED and not a waiver of any real-world claim. No claim was waived. The release gate treats a SIMULATION ASSUMPTION with a recorded basis as not requiring verification.

Text versions: Zoe 0.3.4, Maya 0.2, Jules 0.3.2, Marcus 0.2.2, Elena 0.1.2, Dana 0.6.1-w5. Logic versions unchanged. Do not cite the $8 card late-fee cap (vacated April 2025).

## Proposed fictional name replacements (approval required; display names only, IDs and mechanics unchanged)
Search finding (web search, not a trademark search, 2026-10-28): all four current names overlap real DeFi names: Apex Yield (ApexYield on Solana; ApeX protocol), Surge (Surge protocol; SURGE tokens), Keystone (Keystone Finance, a DeFi entity), Harbor (Harbor Protocol). Common-word alternatives also collide (Lantern Finance and Granite are real crypto lenders; Cobalt Finance and Pebble exist), so invented words are proposed.
| Current | Proposed | Search result for the exact proposed phrase |
|---|---|---|
| Harbor Vault | Ostrel Vault | no match found |
| Keystone Loans | Varnwick Loans | no match found |
| Apex Yield | Kelvane Yield | no match found |
| Surge Pool | Mirrowl Pool | no match found |
Run a trademark search before adoption; replacement touches text only (names appear in many strings and the manifest), so it needs a text-version bump and a re-export.

## Mac/cloud equivalence note
Runtime trees, manifest and workbooks are generated deterministically and the exporter is the only writer. After each sync the SHA-256 of every runtime JSON and workbook on the Mac was compared with the cloud copy and matched, and the Mac suite pins the manifest hash and the Tower files. The cloud export (which runs the engines, the regression hashes and 15,309-path parity) therefore covers identical inputs and outputs. The Mac re-export did not complete (the background process stopped before writing output), so it adds no independent evidence beyond a hash match.

### dana.v1: VERIFIED
- Earlier verification (CFPB, Dana v0.4 research); unchanged.

### dana.v2: VERIFIED
- Earlier verification (CFPB, Dana v0.4 research); unchanged.

### dana.v3: VERIFIED
- Earlier verification (CFPB, Dana v0.4 research); unchanged.

### dana.v4: VERIFIED
- Earlier verification (CFPB, Dana v0.4 research); unchanged.

### dana.open01: VERIFIED
- Statement and location: Dana Q7: "Her lender sends a revised Loan Estimate. Estimated closing costs rose from $11,500 to $13,100 (updated property-tax and insurance deposits and prepaid items), so Cash to Close is now $43,100 ($30,000 down + $13,100)." / "The Closing Disclosure will arrive at least three business days before closing and can still differ."
- Jurisdiction: United States (federal)
- Finding: Player text no longer says a revised Loan Estimate was issued ("Her lender updates its cost estimates"). The retained claim, that the Closing Disclosure arrives at least three business days before closing and can still differ, matches 12 CFR 1026.19(f)(1)(ii)(A) and (f)(2)(i). Reg Z also limits revised Loan Estimates to listed reasons and bars one on or after the Closing Disclosure date, which is why the revised-estimate claim was removed. Regulation text read via Cornell LII; eCFR/CFPB pages were not retrievable. (confidence: high)
- Source: [12 CFR 1026.19 (Cornell LII copy of the CFR)](https://www.law.cornell.edu/cfr/text/12/1026.19) · dated current version, date not shown · Closing Disclosure no later than three business days before consummation; minor changes corrected at or before consummation; new waiting period only for APR, loan product or prepayment penalty changes; revised Loan Estimates only for listed reasons.
- Source: [CFPB TRID FAQs](https://www.consumerfinance.gov/compliance/compliance-resources/mortgage-resources/tila-respa-integrated-disclosures/tila-respa-integrated-disclosure-faqs/) · dated 2024-03-15 · Same three triggers for a new waiting period.
- Applied: Dana text 0.6.1-w5

### dana.open02: VERIFIED
- Statement and location: Dana D6/Q6: "The underwriter wants large deposits explained and the source of her funds documented." / "Start moving all DeFi holdings into her bank accounts now (repaying any crypto loan first), and save the statements and transaction history."
- Jurisdiction: United States, Fannie Mae conventional loans (other loan programs differ)
- Finding: Supported for conventional loans. The player text does not state a seasoning period. Selling Guide revisions are frequent; re-check at release. (confidence: medium)
- Source: [Fannie Mae Selling Guide B3-4.2-02](https://selling-guide.fanniemae.com/sel/b3-4.2-02/depository-accounts) · dated 2022-12-14 (SEL-2022-10) · Large deposits used for down payment or closing costs must be documented from an acceptable source; undocumented amounts are excluded.
- Source: [Fannie Mae Selling Guide B3-4.1-04](https://selling-guide.fanniemae.com/sel/b3-4.1-04/virtual-currency) · dated 2022-05-04 (SEL-2022-04) · Virtual currency counts only if exchanged into U.S. dollars, documented, and verified in USD before closing.

### dana.open03: VERIFIED
- Statement and location: Dana: "She needs $45,000 total purchase cash: a $30,000 down payment, about $11,500 in closing costs and about $3,500 to move."
- Jurisdiction: United States (federal)
- Finding: The text separates moving cost from closing costs and Cash to Close. Earnest money is not mentioned. (confidence: medium)
- Source: [CFPB (with dana.v2)](https://www.consumerfinance.gov/archive/blog/know-before-you-owe-youll-get-3-days-to-review-your-mortgage-closing-documents/) · dated 2015-06-03 · Cash to Close is a Closing Disclosure figure covering down payment and closing costs, so moving costs fall outside it.

### dana.open04: VERIFIED
- Statement and location: "It is not a bank and its balances are not FDIC-insured." / "Dana puts her whole purchase fund outside deposit insurance, and the rate is variable." / Jules: "a vault deposit is not an insured bank balance." / Marcus: "USDC is a dollar stablecoin, not an insured deposit." (Dana D1; Jules Q-vault; Marcus Q-USDC; Maya, Zoe disclaimers)
- Jurisdiction: United States (federal)
- Finding: Statements say only that these balances are not insured; they do not state the $250,000 figure, so no number needs checking. The player text is consistent with FDIC. (confidence: high)
- Source: [FDIC](https://www.fdic.gov/resources/deposit-insurance/understanding-deposit-insurance) · dated page updated 2024-04-01 · Standard maximum $250,000 per depositor, per insured bank, per ownership category; crypto assets and non-deposit investments are not covered.
- Source: [FDIC (FIL-22-035)](https://www.fdic.gov/news/financial-institution-letters/2022/fil22035b.pdf) · dated 2022 (date not shown in fetch) · Crypto assets are not FDIC-insured products; insurance does not cover insolvency of non-bank custodians, exchanges or wallet providers.

### dana.open05: VERIFIED
- Statement and location: Dana: "Dana receives a $2,000 after-tax bonus in checking." (D5). No other player-facing statement about tax on ETH sales, loss deductibility, stablecoin yield or loan interest was found in the Dana workbook.
- Jurisdiction: United States (federal)
- Finding: Text scan found no tax assertion beyond "after-tax bonus", so there is nothing inaccurate to correct. Any future tax sentence needs its own check. (confidence: medium)
- Source: [IRS](https://www.irs.gov/filing/digital-assets) · dated 2026-09-02 · If a tax statement is added later, sales and exchanges are reportable; staking and similar rewards are ordinary income.

### dana.open06: VERIFIED
- Statement and location: Dana: "student loan $12,000 at 6.00% APR." / "Use it to prepay the 6% student loan."
- Jurisdiction: United States (federal)
- Finding: No-prepayment-penalty: CFPB says "Generally, there are no penalties involved in paying off your student loans early" (reviewed 2024-04-15). Daily accrual: loan servicer page gives daily simple interest (principal x rate / 365). Dana models monthly interest; the plan line now says so (0.6.1-w5). (confidence: medium)
- Source: [CFPB](https://www.consumerfinance.gov/ask-cfpb/can-i-pay-off-my-student-loan-in-full-at-any-time-en-609/) · dated last reviewed 2024-04-15 · Generally no prepayment penalties on student loans.
- Source: [Aidvantage (federal loan servicer, studentaid.gov)](https://aidvantage.studentaid.gov/components/interest-and-taxes.html) · dated undated · Daily simple interest: unpaid principal x interest rate / 365.
- Applied: Dana text 0.6.1-w5

### dana.open07: VERIFIED
- Statement and location: Dana D2: "A recovery phrase is the master key." / "Verify through channels you open yourself, and never share a recovery phrase." / "Signing a message or transaction authorizes what it says." / "Connecting a wallet shares your public address and balances." / "Control of a wallet is control of the money."
- Jurisdiction: United States (federal)
- Finding: Hedged wording in 0.6.1-w5. Supported by wallet-maker primary documentation (MetaMask Support: the recovery phrase is the "master key"; "Never share your SRP or private keys with anyone"; support "will never ask"; "Always check what a dapp is actually requesting before clicking approve"; verify support through the official channels you open yourself) and by FBI IC3 guidance (verify through independently found contacts; do not click unverified links; never give a two-factor code). No regulator publishes wallet-specific guidance on recovery phrases, so this is vendor documentation for one wallet maker plus general government guidance. Statements about connecting and allowances were hedged ("usually", "can") because no fetched source states them directly. (confidence: medium)
- Source: [MetaMask Support (Consensys)](https://support.metamask.io/start/user-guide-secret-recovery-phrase-password-and-private-keys/) · dated page undated; site copyright 2026 · Recovery phrase is the master key; anyone with it controls the funds; never share it.
- Source: [MetaMask Support](https://support.metamask.io/stay-safe/safety-in-web3/what-are-metamasks-official-support-channels/) · dated undated · Support never asks for the recovery phrase; verify through official channels you open.
- Source: [MetaMask Support](https://support.metamask.io/stay-safe/safety-in-web3/basic-safety-and-security-tips-for-metamask/) · dated undated (copyright 2026) · Check what a dapp is requesting before approving.
- Source: [FBI IC3 PSA I-051525](https://www.ic3.gov/PSA/2025/PSA250515) · dated 2025-05-15 · Verify via independent contact; do not click unverified links; never share two-factor codes.
- Applied: Dana text 0.6.1-w5

### dana.open08: VERIFIED
- Statement and location: Dana: "a $30,000 down payment, about $11,500 in closing costs and about $3,500 to move."
- Jurisdiction: United States (federal)
- Finding: Down payment and closing figures sit inside the CFPB ranges for the implied price. The $3,500 moving cost has no official source. (confidence: medium)
- Source: [CFPB](https://www.consumerfinance.gov/owning-a-home/prepare/determine-your-down-payment/) · dated last modified 2026-02-18 · Conventional loans can need as little as 3% down; closing costs typically run 2% to 5% of the purchase price.
- Applied: Moving figure labeled "(an assumption in this story)" in Dana text 0.6.1-w4; down payment and closing ranges verified against CFPB.

### dana.open09: VERIFIED
- Statement and location: No player-facing re-underwriting statement was found. Related Dana text: "Dana's lender is moving toward closing." and "Check your own lender's terms."
- Jurisdiction: United States (federal)
- Finding: There is no assertion to correct; the general principle that new debt before closing can trigger a re-check is supported. (confidence: medium)
- Source: [Fannie Mae Desktop Underwriter](https://singlefamily.fanniemae.com/applications-technology/desktop-underwriter-desktop-originator/undisclosed-liabilities) · dated effective 2025-11-15 · New debt found during origination: lender recalculates DTI and resubmits to DU; new subordinate financing on the property requires re-underwriting.
- Source: [CFPB](https://consumerfinance.gov/ask-cfpb/when-will-my-lender-run-or-obtain-a-copy-of-my-credit-report-en-322) · dated last modified 2025-01-14 · A lender may check credit just before closing.

### dana.open10: SIMULATION ASSUMPTION
- Statement and location: Dana: "emergency savings $8,700 (3 months of essentials)" / "above the 1-month line"
- Jurisdiction: United States (federal)
- Finding: Three months of expenses is common guidance, but no official source was retrieved in this pass. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Dana plan line: "The three-month emergency target is this scenario's choice; official guidance varies and some suggests six months." (0.6.1-w5). FDIC (2025-01-03) recommends at least six months.

### dana.f1: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: names and rates (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Player text: "Harbor Vault, Keystone Loans, Apex Yield and Surge Pool are fictional. Their terms are story rules, not market data." (Dana plan)

### dana.f2: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: Keystone terms (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Player text: "Keystone's rules (fictional): Lending limit 50% ..." (Dana D5 and plan)

### dana.f3: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: vault cap and exploit (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Covered by the Dana plan line that product terms are story rules, and "In this story the pool returns -4.0%".

### dana.f4: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: fictional fees (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Player text: "$450 records-reconstruction cost (fictional, her own expense)"; rate-lock fee and delay cap "are scenario assumptions, not market data. Real fees and lock terms vary by lender."

### dana.f5: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: ETH index events (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. Not reclassified: ETH falls of 40% and 30% are stated without "in this story". Proposed: "In this scenario, ETH has fallen 40%." (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Dana plan line: "ETH price moves are scenario events"; D5 "In this scenario, ETH has fallen..." (0.6.1-w5).

### dana.m1: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: 0% insured savings (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. Not reclassified: No player text says insured savings earn 0% in the model. Proposed: "Insured savings are modeled at 0% interest." (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Dana plan line: "insured savings are modeled at 0% interest, which is lower than a real account would pay" (0.6.1-w5).

### dana.m2: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: $250 floor (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. Not reclassified: $250 floor is stated as Dana's budget, not labeled as a model choice. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Dana intro: "$250 floor plus $450 discretionary, set for this scenario" (0.6.1-w5).

### dana.m3: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: closing date convention (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. Not reclassified: Closing on the last day of month 24 is stated without a model label. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Dana situation: "this scenario assumes closing on that day, after the transfer" (0.6.1-w5).

### dana.m4: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: vault transfer time (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Derived from the labeled fictional $2,000-a-week vault cap (dana.f3); no separate real-world claim in the text.

### dana.m5: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: ETH baseline (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. Not reclassified: ETH baseline $2,400 is stated as Dana's holding, not labeled. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Dana intro: "Opening (scenario assumptions): ... ETH $2,400 ..." (0.6.1-w5).

### dana.m6: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: 50% line (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Player text: the 50% line "is a simplification for scoring, not a safe level in real life".

### dana.m7: UNVERIFIED
- Statement and location: Fictional names: Harbor Vault, Keystone Loans, Apex Yield, Surge Pool
- Jurisdiction: n/a
- Finding: Web name search run 2026-10-28 (not a trademark search). Possible collisions: "ApexYield"/Apex Yield (existing Solana yield project and ApeX protocol); Keystone Finance (a DeFi entity; "Keystone Loans" not found exactly); Surge (existing "Surge" DeFi protocol and SURGE tokens; "Surge Pool" generic); Harbor Protocol (exists; "Harbor Vault" not found exactly). Collision risk is not cleared. (confidence: medium)
- Source: web search only
- Proposed: Owner decision: rename Apex Yield and Surge Pool (highest overlap) or accept the risk after a trademark search; display names only, IDs unaffected.

### b1.claim01: SIMULATION ASSUMPTION
- Statement and location: Zoe: sale of crypto and on-chain transfer timing (no explicit minutes or hours found in the text).
- Jurisdiction: United States (federal)
- Finding: No authoritative public source for settlement times; vendor and network dependent. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Zoe plan line: "In this story, a sale settles within the month." (Zoe 0.3.4).

### b1.claim02: VERIFIED
- Statement and location: Zoe: "Selling costs money, and tax effects are not modeled here."
- Jurisdiction: United States (federal)
- Finding: The sentence does not claim sales are tax-free; it says tax is not modeled. Accurate as worded. (confidence: high)
- Source: [IRS](https://www.irs.gov/filing/digital-assets) · dated last reviewed 2026-09-02 (tax year 2025 forms) · Sales and exchanges of digital assets must be reported; gain or loss is reported on Form 8949.

### b1.claim03: SIMULATION ASSUMPTION
- Statement and location: Zoe: "Buying or selling costs 0.5%; sales of crypto also cost a $19 on-chain fee per holding." / "Fees can swamp small transfers: moving $25 on-chain can cost $19."
- Jurisdiction: United States (federal)
- Finding: Fees vary by platform and network; no official source applies. The principle (small transfers can be dominated by fixed fees) is accurate. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: After v0.3.3 (Zoe): "In this story, buying or selling costs 0.5%; ..." and "in this story, moving $25 on-chain can cost $19."

### b1.claim04: SIMULATION ASSUMPTION
- Statement and location: Zoe: "Landlord (this story's rule, not a general rule)" / "This is this landlord's rule, not a promise from every landlord."
- Jurisdiction: United States (federal)
- Finding: Already labeled as the story's rule; no outside fact to verify. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Zoe: "Landlord (this story's rule, not a general rule)" / "This is this landlord's rule, not a promise from every landlord."

### b1.claim05: VERIFIED
- Statement and location: Zoe: "This is a card advance, not a bank payment." / "A card advance is borrowing, not cash." / "Card: $800 limit, about 2% a month." / "If a bill is bigger than the room left on the card, the whole bill goes unpaid and a $35 late fee is added."
- Jurisdiction: United States (federal)
- Finding: Borrowing nature and immediate interest are accurate. The story prices a card advance at the same 2% a month with no fee, which understates real cost. (confidence: medium)
- Source: [CFPB](https://www.consumerfinance.gov/ask-cfpb/can-i-withdraw-money-from-my-credit-card-at-an-atm-en-34/) · dated last reviewed 2026-09-02 · Cash advances usually carry a fee and a higher APR, and interest starts the day of the advance with no grace period.
- Applied: Applied in Zoe text 0.3.3.

### b1.claim06: VERIFIED
- Statement and location: Marcus: "Your tax adviser asks, as in Marcus's own plan, for a record of every crypto receipt and every conversion." / "...a log is the foundation for every later tax conversation."
- Jurisdiction: United States (federal)
- Finding: Supported. (confidence: high)
- Source: [IRS](https://www.irs.gov/filing/digital-assets) · dated 2026-09-02 · Taxpayers must keep records supporting their positions: date, time, units and U.S. dollar fair market value of each transaction.

### b1.claim07: VERIFIED
- Statement and location: Jules: "Borrowing against crypto adds interest and a forced-sale risk, and selling adds fees and, in real life, possible tax."
- Jurisdiction: United States (federal)
- Finding: "Possible tax" on selling is accurate. The IRS page does not address borrowing against digital assets, and the sentence makes no tax claim about borrowing. (confidence: high)
- Source: [IRS](https://www.irs.gov/filing/digital-assets) · dated 2026-09-02 · Disposing of a digital asset (sale, exchange, spending) is reportable; gain or loss depends on basis.

### b1.claim08: SIMULATION ASSUMPTION
- Statement and location: Fictional or model item: Keystone terms (see register claim text).
- Jurisdiction: n/a
- Finding: Not a real-world fact; no outside source applies. It stays UNVERIFIED until the owner records a WAIVED decision. Not silently waived. Not reclassified: Jules text names "Keystone's 50% opening limit" with no fictional label (Elena says "in this story"). Proposed label: "Keystone (a fictional lender)". (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Jules text: "Keystone (a fictional lender)" (Jules 0.3.2); Elena: "in this story it requires at least $2,000".

### b1.claim09: VERIFIED
- Statement and location: All journeys: "Card: $800 limit, about 2% a month." / "A credit card (limit $3,000, 2% a month)." / Zoe: "a $35 late fee is added."
- Jurisdiction: United States (federal)
- Finding: 2% a month is about 26.8% APR, above but near the 22.36% average, so it is a realistic story assumption; the text says "about". The $35 late fee is a story amount inside the usual range. Do not cite an $8 cap; it was vacated. (confidence: medium)
- Source: [Federal Reserve G.19 via FRED](https://fred.stlouisfed.org/series/TERMCBCCINTNS) · dated Aug 2026, updated 2026-10-07 · Average credit card interest rate on accounts assessed interest: 22.36% APR (about 1.9% a month).
- Source: [Consumer Finance Monitor (law-firm report of the court order)](https://www.consumerfinancemonitor.com/2025/04/16/federal-judge-voids-cfpb-credit-card-late-fee-rule/) · dated 2025-04-16 · CFPB $8 late-fee rule vacated; the old safe-harbor amounts ($30/$41, inflation-adjusted $32/$43) continue to frame typical fees. Secondary source only.

### b1.claim10: SIMULATION ASSUMPTION
- Statement and location: Zoe: "first tuition payment of $1,500 (plus a $45 plan fee)"; Elena: "a 0% payment plan of $225 a month (an assumption in this story)."
- Jurisdiction: United States (federal)
- Finding: School payment-plan fees vary; no official source. Elena's plan is labeled an assumption; Zoe's fee is not labeled. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Zoe intro: "The $45 plan fee and all other amounts are assumptions in this story." (0.3.4); Elena: "a 0% payment plan ... (an assumption in this story)".

### b1.claim11: SIMULATION ASSUMPTION
- Statement and location: Maya: "Under this fictional plan the company matches 100% of her contribution, up to 4% of her pay before tax ($3,800 a month)." / "Real employer plans vary: match formulas, eligibility waits and vesting schedules differ, so check the actual plan."
- Jurisdiction: United States (federal)
- Finding: Labeled fictional with a real-world caveat; pay and reserve figures are assumptions. No outside fact to verify. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Maya: "Under this fictional plan ..." and "Real employer plans vary ... check the actual plan."

### b1.claim12: SIMULATION ASSUMPTION
- Statement and location: Jules: illustrative base growth and vault premium (about 5% a year advertised).
- Jurisdiction: United States (federal)
- Finding: Illustrative figures; no outside fact asserted. (confidence: medium)
- Source: none (no outside fact asserted)
- Fictional basis in player text: Jules: "Harbor Vault (a fictional vault)" and intro "All figures in this scenario are assumptions for the exercise." (0.3.2).

### b1.claim13: VERIFIED
- Statement and location: Marcus: "Another estimated tax payment ($3,100) is due this month, paid from the tax reserve." / "(the month-4 payment of $2,460 is due next month)" / tax set-aside of $820 a month; "Tax money is not optional capital."
- Jurisdiction: United States (federal)
- Finding: The principle (set tax aside; estimated tax is quarterly) is correct. The story pays estimated tax on a monthly-style schedule (months 4, 5, 6) and states a flat set-aside, which is not the real schedule (four uneven dates). The 20% reserve rate is a story assumption. The USDC taxation and deductibility parts of the original claim are not asserted in the player text. (confidence: medium)
- Source: [IRS Form 1040-ES (2026)](https://www.irs.gov/pub/irs-pdf/f1040es.pdf) · dated tax year 2026 · Estimated payments are due April 15, June 15, September 15 and January 15 for calendar-year filers; required when you expect to owe at least $1,000.
- Source: [IRS](https://www.irs.gov/filing/digital-assets) · dated 2026-09-02 · Payments to independent contractors are reported on Schedule C; keep records of date, units and U.S. dollar value.
- Applied: Applied in Marcus text 0.2.1.

### b1.claim14: SIMULATION ASSUMPTION
- Statement and location: Elena: "Take-home pay is $5,100 a month ($3,825 in months 2 and 3 on parental leave)." / "A small gift can be held or sold." / "The childcare centre needs a $1,800 deposit now."
- Jurisdiction: United States (federal)
- Finding: Gift handling in the text is consistent with the IRS. Leave pay, medical plan and childcare costs are story assumptions that vary by employer and state. (confidence: medium)
- Source: [IRS](https://www.irs.gov/businesses/small-businesses-self-employed/frequently-asked-questions-on-gift-taxes) · dated 2026-07-23 · 2026 annual gift-tax exclusion is $19,000 per recipient; the donor is generally responsible for any gift tax, and the recipient generally takes the donor's basis.
- Fictional basis in player text: Elena intro: "Pay, leave pay and costs are assumptions in this story." (0.1.2); gift handling consistent with IRS 2026 gift-tax FAQ.
