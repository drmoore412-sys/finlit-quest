# FinLit Quest — 27 Challenging Quiz Expansion Proposal

**Date:** 2026-10-17  
**Status:** PENDING OWNER REVIEW — IMPLEMENTATION NOT AUTHORIZED

**Governing standard:** `docs/FINLIT_QUEST_NEW_QUIZ_QUALITY_STANDARD.md`, confirmed by the owner on 2026-10-17. Confirmation of the standard does not approve the individual proposals.

This research proposal expands the design target from 27 to 54 quizzes without editing or replacing the active 27-quiz slate. Proposal IDs are temporary review identifiers. No puzzle, reward, save, mastery, or player-progress data is activated by this document.

## Quality-gate result

| Check | Result |
|---|---:|
| New proposals | 27 |
| Strict solver and all mandatory validation rules | 27 PASS / 0 FAIL |
| Duplicate active compositions | 0 |
| Duplicate proposal compositions | 0 |
| Five-word puzzles | 14 |
| Four-word puzzles | 11 |
| Three-word exceptions | 2 |
| Puzzles with at least three financial terms | 27 |
| Puzzles with 2–3 valid layouts available | 27 |
| Cross-world anchors retaining original identities | 10 |
| Previously unencountered financial terms introduced | 11 |

Previously unencountered terms: **ATM, BID, CONFIRMED, DEBIT, DEPOSIT, EARN, MANDATE, MINER, NODE, ORDER, PEER**.

## Governance findings

- The proposal satisfies exact letter multisets, crossing-letter agreement, separation and boundary rules, distinct-slot/contained-word rules, financial-majority rules, reward protection, and strict engine acceptance.
- Twenty-five of 27 proposals use four or five required words. The two three-word exceptions are **MB-05 (MANDATE / NET / ATM)** and **CR-06 (CREDITOR / CREDIT / ORDER)**; both are all-financial and avoid filler.
- Ten proposals use a governed cross-world anchor. Every such anchor retains its original permanent ID, exact definition, mastery identity, and owning world.
- Crypto remains **Approved with Qualification**. CAL-0006 requires a dedicated controlling governance record before substantial Crypto implementation.
- Approved but currently incompatible anchor candidates are not forced into puzzles. ADDRESS, CUSTODY, SCAM, REPORT, BUREAU, FREEZE, HISTORY, WIRE, PHISHING, and LIQUIDITY did not produce an eligible composition from the current approved pools.
- No new supporting word is proposed. Every ordinary word below already belongs to the approved V3 supporting-word set.
- Financial vocabulary and educational value drove candidate selection. Letter compatibility was treated only as a required feasibility and validation constraint.

## Owner decisions requested

1. Approve, revise, or reject each proposed composition and comprehension question.
2. Confirm the two documented three-word exceptions.
3. Confirm the expanded use of the existing cross-world-anchor rule for the ten identified proposals.
4. Complete or explicitly defer the Crypto controlling governance record required by CAL-0006.
5. If the proposal is approved, separately authorize implementation. Approval of this report alone must not activate content.

## Money Basics

### EXPANSION-2026-10-17-MB-01 — REPAYMENT

- Difficulty: **Advanced**
- Wheel: **REPAYMENT**
- Required words (5): **REPAYMENT, PAYMENT, EARN, RATE, NET**
- Financial terms (5): REPAYMENT `credit.repayment` (Credit Foundations); PAYMENT `moneybasics.payment`; EARN `moneybasics.earn`; RATE `moneybasics.rate`; NET `moneybasics.net`
- Ordinary support: None
- Previously unencountered terms: EARN
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· P · · · · · · ·
· A · · · · R · ·
· Y · · · E A R N
· M · · · · T · E
R E P A Y M E N T
· N · · · · · · ·
· T · · · · · · ·
```

**Proposed question:** You earn $800 and $150 is removed for deductions. Which term describes the $650 remaining?

1. NET **(correct)**
2. RATE
3. PAYMENT

**Explanation:** NET is an amount remaining after deductions or costs are subtracted.

### EXPANSION-2026-10-17-MB-02 — PAYMENT

- Difficulty: **Advanced**
- Wheel: **PAYMENT**
- Required words (5): **PAYMENT, APY, PAY, NET, ATM**
- Financial terms (5): PAYMENT `moneybasics.payment`; APY `credit.apy` (Credit Foundations); PAY `moneybasics.pay`; NET `moneybasics.net`; ATM `banking.atm` (Banking Basics)
- Ordinary support: None
- Previously unencountered terms: ATM
- Layout alternatives found: 2
- Validation: **PASS**; no active or proposed duplicate composition

```text
· P A Y M E N T
· · P · · · E ·
P A Y · · A T M
```

**Proposed question:** Which tool could you use to withdraw cash or deposit money without working directly with a teller?

1. ATM **(correct)**
2. APY
3. NET

**Explanation:** An ATM lets bank customers complete basic transactions such as deposits and withdrawals.

### EXPANSION-2026-10-17-MB-03 — PAYCHECK

- Difficulty: **Advanced**
- Wheel: **PAYCHECK**
- Required words (5): **PAYCHECK, APY, PAY, ACH, CHECK**
- Financial terms (4): PAYCHECK `moneybasics.paycheck`; APY `credit.apy` (Credit Foundations); PAY `moneybasics.pay`; ACH `banking.ach` (Banking Basics)
- Ordinary support: CHECK
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· P A Y · C · ·
· · P · · H · ·
P A Y C H E C K
· C · · · C · ·
· H · · · K · ·
```

**Proposed question:** Which network is commonly used for direct deposits and recurring bill payments?

1. ACH **(correct)**
2. APY
3. PAYCHECK

**Explanation:** ACH is an electronic network used to move money between bank and credit union accounts.

### EXPANSION-2026-10-17-MB-04 — DEPOSITOR

- Difficulty: **Advanced**
- Wheel: **DEPOSITOR**
- Required words (5): **DEPOSITOR, DEPOSIT, POSTED, REST, POST**
- Financial terms (3): DEPOSITOR `banking.depositor` (Banking Basics); DEPOSIT `moneybasics.deposit`; POSTED `banking.posted` (Banking Basics)
- Ordinary support: REST, POST
- Previously unencountered terms: DEPOSIT
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · · P · · · · ·
D E P O S I T O R
· · · S · · · · E
· · · T · P · · S
· · D E P O S I T
· · · D · S · · ·
· · · · · T · · ·
```

**Proposed question:** A card transaction is no longer pending and now appears in the account record. Which term applies?

1. POSTED **(correct)**
2. DEPOSIT
3. DEPOSITOR

**Explanation:** POSTED describes a transaction entered into the account record rather than remaining pending.

### EXPANSION-2026-10-17-MB-05 — MANDATE

- Difficulty: **Intermediate**
- Wheel: **MANDATE**
- Required words (3): **MANDATE, NET, ATM**
- Financial terms (3): MANDATE `banking.mandate` (Banking Basics); NET `moneybasics.net`; ATM `banking.atm` (Banking Basics)
- Ordinary support: None
- Previously unencountered terms: MANDATE, ATM
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
A · · · · N ·
T · · · · E ·
M A N D A T E
```

**Proposed question:** Which term means authorization that permits recurring electronic payments from an account?

1. MANDATE **(correct)**
2. ATM
3. NET

**Explanation:** A MANDATE authorizes recurring electronic payments to be taken from an account.

## Credit Foundations

### EXPANSION-2026-10-17-CR-01 — REPAYMENT

- Difficulty: **Advanced**
- Wheel: **REPAYMENT**
- Required words (5): **REPAYMENT, TERM, APR, APY, PAYMENT**
- Financial terms (5): REPAYMENT `credit.repayment`; TERM `credit.term`; APR `credit.apr`; APY `credit.apy`; PAYMENT `moneybasics.payment` (Money Basics)
- Ordinary support: None
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· P · · · · · · ·
· A · · · · · · ·
· Y · · A · · · ·
· M · · P · · · ·
R E P A Y M E N T
· N · P · · · · ·
· T E R M · · · ·
```

**Proposed question:** Which term is the annual borrowing-cost measure?

1. APR **(correct)**
2. APY
3. TERM

**Explanation:** APR is an annual borrowing-cost measure; APY measures annual deposit yield.

### EXPANSION-2026-10-17-CR-02 — REPAYMENT

- Difficulty: **Advanced**
- Wheel: **REPAYMENT**
- Required words (5): **REPAYMENT, TERM, EARN, ATM, PEER**
- Financial terms (5): REPAYMENT `credit.repayment`; TERM `credit.term`; EARN `moneybasics.earn` (Money Basics); ATM `banking.atm` (Banking Basics); PEER `crypto.peer` (Crypto Foundations)
- Ordinary support: None
- Previously unencountered terms: EARN, ATM, PEER
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· T · E · · P · A
R E P A Y M E N T
· R · R · · E · M
· M · N · · R · ·
```

**Proposed question:** Which term describes the period allowed for repayment?

1. TERM **(correct)**
2. EARN
3. PEER

**Explanation:** A loan TERM is the period allowed for repayment.

### EXPANSION-2026-10-17-CR-03 — REPAYMENT

- Difficulty: **Advanced**
- Wheel: **REPAYMENT**
- Required words (5): **REPAYMENT, TERM, EARN, NET, ATM**
- Financial terms (5): REPAYMENT `credit.repayment`; TERM `credit.term`; EARN `moneybasics.earn` (Money Basics); NET `moneybasics.net` (Money Basics); ATM `banking.atm` (Banking Basics)
- Ordinary support: None
- Previously unencountered terms: EARN, ATM
- Layout alternatives found: 2
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · · · · T · · ·
· · · · · E A R N
· · · · · R · · E
R E P A Y M E N T
· · · T · · · · ·
· · · M · · · · ·
```

**Proposed question:** After deductions and costs are subtracted from earnings, which term describes the amount remaining?

1. NET **(correct)**
2. TERM
3. ATM

**Explanation:** NET is the amount remaining after deductions or costs are subtracted.

### EXPANSION-2026-10-17-CR-04 — AUTOPAY

- Difficulty: **Intermediate**
- Wheel: **AUTOPAY**
- Required words (4): **AUTOPAY, APY, PAY, AUTO**
- Financial terms (3): AUTOPAY `credit.autopay`; APY `credit.apy`; PAY `moneybasics.pay` (Money Basics)
- Ordinary support: AUTO
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · A · · · A
P · U · · · P
A U T O P A Y
Y · O · · · ·
```

**Proposed question:** Which feature schedules an electronic payment automatically?

1. AUTOPAY **(correct)**
2. APY
3. PAY

**Explanation:** AUTOPAY is an automatic scheduled electronic payment.

### EXPANSION-2026-10-17-CR-05 — CAPACITY

- Difficulty: **Intermediate**
- Wheel: **CAPACITY**
- Required words (4): **CAPACITY, APY, PAY, CITY**
- Financial terms (3): CAPACITY `credit.capacity`; APY `credit.apy`; PAY `moneybasics.pay` (Money Basics)
- Ordinary support: CITY
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · A · · C · ·
C A P A C I T Y
· · Y · · T · ·
· · · P A Y · ·
```

**Proposed question:** Which term describes a borrower’s ability to make payments from available resources?

1. CAPACITY **(correct)**
2. APY
3. PAY

**Explanation:** CAPACITY is the ability to make payments from available resources.

### EXPANSION-2026-10-17-CR-06 — CREDITOR

- Difficulty: **Intermediate**
- Wheel: **CREDITOR**
- Required words (3): **CREDITOR, CREDIT, ORDER**
- Financial terms (3): CREDITOR `credit.creditor`; CREDIT `credit.credit`; ORDER `investing.order` (Investing Basics)
- Ordinary support: None
- Previously unencountered terms: ORDER
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· O · · · · · ·
C R E D I T · ·
· D · · · · · ·
· E · · · · · ·
C R E D I T O R
```

**Proposed question:** Which party is owed money in a credit arrangement?

1. CREDITOR **(correct)**
2. ORDER
3. CREDIT

**Explanation:** A CREDITOR is a party to whom money is owed.

## Crypto Foundations

### EXPANSION-2026-10-17-CX-01 — CONFIRMED

- Difficulty: **Advanced**
- Wheel: **CONFIRMED**
- Required words (5): **CONFIRMED, INCOME, NODE, COIN, MINER**
- Financial terms (5): CONFIRMED `crypto.confirmed`; INCOME `moneybasics.income` (Money Basics); NODE `crypto.node`; COIN `crypto.coin`; MINER `crypto.miner`
- Ordinary support: None
- Previously unencountered terms: CONFIRMED, NODE, MINER
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · · · · M · · · ·
· · C · · I · N · ·
· · O · I N C O M E
· · I · · E · D · ·
C O N F I R M E D ·
```

**Proposed question:** A blockchain transaction has been accepted through network consensus. What is its status?

1. CONFIRMED **(correct)**
2. INCOME
3. MINER

**Explanation:** CONFIRMED describes a transaction or block whose inclusion has been accepted through network consensus.

### EXPANSION-2026-10-17-CX-02 — PASSWORD

- Difficulty: **Intermediate**
- Wheel: **PASSWORD**
- Required words (4): **PASSWORD, APR, SWAP, PASS**
- Financial terms (3): PASSWORD `banking.password` (Banking Basics); APR `credit.apr` (Credit Foundations); SWAP `crypto.swap`
- Ordinary support: PASS
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
S · P · · · · ·
W · A · · · A ·
A · S · · · P ·
P A S S W O R D
```

**Proposed question:** Which action exchanges one digital asset for another?

1. SWAP **(correct)**
2. APR
3. PASSWORD

**Explanation:** A SWAP exchanges one digital asset for another.

### EXPANSION-2026-10-17-CX-03 — NETWORK

- Difficulty: **Advanced**
- Wheel: **NETWORK**
- Required words (5): **NETWORK, NET, OWNER, TOKEN, NOTE**
- Financial terms (4): NETWORK `banking.network` (Banking Basics); NET `moneybasics.net` (Money Basics); OWNER `investing.owner` (Investing Basics); TOKEN `crypto.token`
- Ordinary support: NOTE
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · N · · · ·
· · E · · · ·
N E T W O R K
O · · · W · ·
T O K E N · ·
E · · · E · ·
· · · · R · ·
```

**Proposed question:** Which digital unit can represent value, access, ownership, or voting rights in a blockchain project?

1. TOKEN **(correct)**
2. NETWORK
3. OWNER

**Explanation:** A TOKEN is a digital unit that can represent value, access, ownership, or voting rights.

### EXPANSION-2026-10-17-CX-04 — RECEIPT

- Difficulty: **Intermediate**
- Wheel: **RECEIPT**
- Required words (4): **RECEIPT, PRICE, PEER, PIECE**
- Financial terms (3): RECEIPT `moneybasics.receipt` (Money Basics); PRICE `moneybasics.price` (Money Basics); PEER `crypto.peer`
- Ordinary support: PIECE
- Previously unencountered terms: PEER
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· P E E R · ·
· R · · · · ·
P I E C E · ·
· C · · · · ·
R E C E I P T
```

**Proposed question:** Which term describes another network participant communicating directly with your node?

1. PEER **(correct)**
2. PRICE
3. RECEIPT

**Explanation:** A PEER is another network participant that communicates directly with a node.

### EXPANSION-2026-10-17-CX-05 — CONFIRMED

- Difficulty: **Advanced**
- Wheel: **CONFIRMED**
- Required words (5): **CONFIRMED, NODE, COIN, MINER, COME**
- Financial terms (4): CONFIRMED `crypto.confirmed`; NODE `crypto.node`; COIN `crypto.coin`; MINER `crypto.miner`
- Ordinary support: COME
- Previously unencountered terms: CONFIRMED, NODE, MINER
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · · · · · C · ·
· C · · M · O · ·
C O N F I R M E D
· I · · N · E · ·
· N O D E · · · ·
· · · · R · · · ·
```

**Proposed question:** Which participant uses computing work to compete to add blocks on a proof-of-work blockchain?

1. MINER **(correct)**
2. NODE
3. COIN

**Explanation:** A MINER uses computing work to compete to add blocks on a proof-of-work blockchain.

## Banking Basics

### EXPANSION-2026-10-17-BK-01 — DEPOSITOR

- Difficulty: **Intermediate**
- Wheel: **DEPOSITOR**
- Required words (4): **DEPOSITOR, DEPOSIT, POSTED, POST**
- Financial terms (3): DEPOSITOR `banking.depositor`; DEPOSIT `moneybasics.deposit` (Money Basics); POSTED `banking.posted`
- Ordinary support: POST
- Previously unencountered terms: DEPOSIT
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· D · P · · · · ·
D E P O S I T O R
· P · S · · · · ·
P O S T E D · · ·
· S · · · · · · ·
· I · · · · · · ·
· T · · · · · · ·
```

**Proposed question:** What do you call a person or organization that keeps money on deposit at a bank?

1. DEPOSITOR **(correct)**
2. DEPOSIT
3. POSTED

**Explanation:** A DEPOSITOR is a person or organization that keeps money on deposit.

### EXPANSION-2026-10-17-BK-02 — NETWORK

- Difficulty: **Advanced**
- Wheel: **NETWORK**
- Required words (5): **NETWORK, NET, OWNER, TOKEN, WORK**
- Financial terms (4): NETWORK `banking.network`; NET `moneybasics.net` (Money Basics); OWNER `investing.owner` (Investing Basics); TOKEN `crypto.token` (Crypto Foundations)
- Ordinary support: WORK
- Previously unencountered terms: None
- Layout alternatives found: 2
- Validation: **PASS**; no active or proposed duplicate composition

```text
N E T W O R K
E · · · W · ·
T O K E N · ·
· · · · E · ·
· · W O R K ·
```

**Proposed question:** Which term describes a connected system that carries payment instructions between participating institutions?

1. NETWORK **(correct)**
2. TOKEN
3. OWNER

**Explanation:** A payment NETWORK carries payment instructions between participating institutions or service providers.

### EXPANSION-2026-10-17-BK-03 — PASSKEY

- Difficulty: **Advanced**
- Wheel: **PASSKEY**
- Required words (5): **PASSKEY, APY, PAY, ASK, PASS**
- Financial terms (4): PASSKEY `banking.passkey`; APY `credit.apy` (Credit Foundations); PAY `moneybasics.pay` (Money Basics); ASK `investing.ask` (Investing Basics)
- Ordinary support: PASS
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · P · A · P
A · A · S · A
P A S S K E Y
Y · S · · · ·
```

**Proposed question:** Which secure sign-in credential can use a device, PIN, fingerprint, or face scan instead of a traditional password?

1. PASSKEY **(correct)**
2. ASK
3. APY

**Explanation:** A PASSKEY uses a device or device authentication instead of a traditional password.

### EXPANSION-2026-10-17-BK-04 — PASSWORD

- Difficulty: **Advanced**
- Wheel: **PASSWORD**
- Required words (5): **PASSWORD, APR, SWAP, PASS, ROW**
- Financial terms (3): PASSWORD `banking.password`; APR `credit.apr` (Credit Foundations); SWAP `crypto.swap` (Crypto Foundations)
- Ordinary support: PASS, ROW
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
S · P · · · · ·
W · A P R · · ·
A · S · O · · ·
P A S S W O R D
```

**Proposed question:** Which term means a secret sequence of characters used to help verify identity during sign-in?

1. PASSWORD **(correct)**
2. SWAP
3. APR

**Explanation:** A PASSWORD is a secret sequence of characters used to help verify identity.

### EXPANSION-2026-10-17-BK-05 — CONVERT

- Difficulty: **Intermediate**
- Wheel: **CONVERT**
- Required words (4): **CONVERT, NET, VOTE, NOTE**
- Financial terms (3): CONVERT `banking.convert`; NET `moneybasics.net` (Money Basics); VOTE `investing.vote` (Investing Basics)
- Ordinary support: NOTE
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · · · · · V
· N · · N · O
C O N V E R T
· T · · T · E
· E · · · · ·
```

**Proposed question:** Which term means changing money from one currency into another currency?

1. CONVERT **(correct)**
2. VOTE
3. NET

**Explanation:** CONVERT means to change money from one currency into another.

## Investing Basics

### EXPANSION-2026-10-17-IV-01 — DEBIT

- Difficulty: **Intermediate**
- Wheel: **DEBIT**
- Required words (4): **DEBIT, DEBT, BID, BED**
- Financial terms (3): DEBIT `moneybasics.debit` (Money Basics); DEBT `credit.debt` (Credit Foundations); BID `investing.bid`
- Ordinary support: BED
- Previously unencountered terms: DEBIT, BID
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
B I D · ·
E · E · ·
D E B I T
· · T · ·
```

**Proposed question:** Which term is the highest price a buyer is currently willing to pay for an investment?

1. BID **(correct)**
2. DEBT
3. DEBIT

**Explanation:** The BID is the highest price a buyer is currently willing to pay.

### EXPANSION-2026-10-17-IV-02 — PASSKEY

- Difficulty: **Intermediate**
- Wheel: **PASSKEY**
- Required words (4): **PASSKEY, APY, PAY, ASK**
- Financial terms (4): PASSKEY `banking.passkey` (Banking Basics); APY `credit.apy` (Credit Foundations); PAY `moneybasics.pay` (Money Basics); ASK `investing.ask`
- Ordinary support: None
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · · · A · A · ·
· · · · S · P A Y
P A S S K E Y · ·
```

**Proposed question:** Which term is the lowest price at which a seller is currently willing to sell an investment?

1. ASK **(correct)**
2. APY
3. PAY

**Explanation:** The ASK is the lowest price at which a seller is currently willing to sell.

### EXPANSION-2026-10-17-IV-03 — MARKET

- Difficulty: **Intermediate**
- Wheel: **MARKET**
- Required words (4): **MARKET, TERM, RATE, ATM**
- Financial terms (4): MARKET `investing.market`; TERM `credit.term` (Credit Foundations); RATE `moneybasics.rate` (Money Basics); ATM `banking.atm` (Banking Basics)
- Ordinary support: None
- Previously unencountered terms: ATM
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
A · T · · R
T · E · · A
M A R K E T
· · M · · E
```

**Proposed question:** Which term describes a system or place where buyers and sellers trade investments?

1. MARKET **(correct)**
2. RATE
3. TERM

**Explanation:** A MARKET is a system or place where buyers and sellers trade investments.

### EXPANSION-2026-10-17-IV-04 — NETWORK

- Difficulty: **Intermediate**
- Wheel: **NETWORK**
- Required words (4): **NETWORK, NET, OWNER, TOKEN**
- Financial terms (4): NETWORK `banking.network` (Banking Basics); NET `moneybasics.net` (Money Basics); OWNER `investing.owner`; TOKEN `crypto.token` (Crypto Foundations)
- Ordinary support: None
- Previously unencountered terms: None
- Layout alternatives found: 3
- Validation: **PASS**; no active or proposed duplicate composition

```text
· · · O · · ·
N E T W O R K
E · · N · · ·
T O K E N · ·
· · · R · · ·
```

**Proposed question:** Which term describes a person or organization that legally holds an investment or ownership interest?

1. OWNER **(correct)**
2. TOKEN
3. NETWORK

**Explanation:** An OWNER legally holds an investment or ownership interest.

### EXPANSION-2026-10-17-IV-05 — MARKET

- Difficulty: **Advanced**
- Wheel: **MARKET**
- Required words (5): **MARKET, TERM, RATE, ATM, TAKE**
- Financial terms (4): MARKET `investing.market`; TERM `credit.term` (Credit Foundations); RATE `moneybasics.rate` (Money Basics); ATM `banking.atm` (Banking Basics)
- Ordinary support: TAKE
- Previously unencountered terms: ATM
- Layout alternatives found: 2
- Validation: **PASS**; no active or proposed duplicate composition

```text
A · · T E R M
T · · A · A ·
M A R K E T ·
· · · E · E ·
```

**Proposed question:** Which term is an amount or percentage used to calculate a payment, cost, or return?

1. RATE **(correct)**
2. TERM
3. MARKET

**Explanation:** A RATE is an amount or percentage used to calculate a payment, cost, or return.

### EXPANSION-2026-10-17-IV-06 — CREDITOR

- Difficulty: **Intermediate**
- Wheel: **CREDITOR**
- Required words (4): **CREDITOR, CREDIT, ORDER, DIRECT**
- Financial terms (3): CREDITOR `credit.creditor` (Credit Foundations); CREDIT `credit.credit` (Credit Foundations); ORDER `investing.order`
- Ordinary support: DIRECT
- Previously unencountered terms: ORDER
- Layout alternatives found: 2
- Validation: **PASS**; no active or proposed duplicate composition

```text
· O · · C · · ·
· R · · R · · ·
· D I R E C T ·
· E · · D · · ·
C R E D I T O R
· · · · T · · ·
```

**Proposed question:** Which term means an instruction to buy or sell an investment under stated conditions?

1. ORDER **(correct)**
2. CREDIT
3. CREDITOR

**Explanation:** An ORDER is an instruction to buy or sell an investment under stated conditions.

## Exact governed term register used

Definitions below are copied from the governed runtime registries and CAL-0008 without paraphrasing.

| Word | Permanent ID | Owning world | Exact definition |
|---|---|---|---|
| ACH | `banking.ach` | Banking Basics | An electronic network that moves money between bank and credit union accounts, used for direct deposits and recurring bill payments. |
| APR | `credit.apr` | Credit Foundations | Annual Percentage Rate, an annual borrowing-cost measure. |
| APY | `credit.apy` | Credit Foundations | Annual Percentage Yield, an annual deposit-yield measure reflecting compounding. |
| ASK | `investing.ask` | Investing Basics | The lowest price at which a seller is currently willing to sell an investment. |
| ATM | `banking.atm` | Banking Basics | An automated teller machine that lets bank customers complete basic transactions such as deposits and withdrawals. |
| AUTOPAY | `credit.autopay` | Credit Foundations | Automatic scheduled electronic payment. |
| BID | `investing.bid` | Investing Basics | The highest price a buyer is currently willing to pay for an investment. |
| CAPACITY | `credit.capacity` | Credit Foundations | Ability to make payments from available resources. |
| COIN | `crypto.coin` | Crypto Foundations | A digital asset native to its own blockchain, often used to pay network fees or transfer value. |
| CONFIRMED | `crypto.confirmed` | Crypto Foundations | Describes a blockchain transaction or block whose inclusion has been accepted through network consensus. |
| CONVERT | `banking.convert` | Banking Basics | To change money from one currency into another currency. |
| CREDIT | `credit.credit` | Credit Foundations | An arrangement that provides value now in exchange for repayment later. |
| CREDITOR | `credit.creditor` | Credit Foundations | A party to whom money is owed. |
| DEBIT | `moneybasics.debit` | Money Basics | Money taken from an account to complete a payment or withdrawal. |
| DEBT | `credit.debt` | Credit Foundations | An amount or obligation owed. |
| DEPOSIT | `moneybasics.deposit` | Money Basics | Money placed into an account. |
| DEPOSITOR | `banking.depositor` | Banking Basics | A person or organization that keeps money on deposit at a bank or other depository institution. |
| EARN | `moneybasics.earn` | Money Basics | To receive money in return for work or another activity. |
| INCOME | `moneybasics.income` | Money Basics | Money received from work, benefits, investments, or other sources. |
| MANDATE | `banking.mandate` | Banking Basics | Authorization that permits recurring electronic payments to be taken from an account. |
| MARKET | `investing.market` | Investing Basics | A system or place where buyers and sellers trade investments. |
| MINER | `crypto.miner` | Crypto Foundations | A participant that uses computing work to compete to add blocks on a proof-of-work blockchain. |
| NET | `moneybasics.net` | Money Basics | An amount remaining after deductions or costs are subtracted. |
| NETWORK | `banking.network` | Banking Basics | A connected system that carries payment instructions between participating institutions or service providers. |
| NODE | `crypto.node` | Crypto Foundations | A computer connected to a blockchain network that stores, checks, or shares network data. |
| ORDER | `investing.order` | Investing Basics | An instruction to buy or sell an investment under stated conditions. |
| OWNER | `investing.owner` | Investing Basics | A person or organization that legally holds an investment or ownership interest. |
| PASSKEY | `banking.passkey` | Banking Basics | A secure sign-in credential that uses a device, PIN, fingerprint, or face scan instead of a traditional password. |
| PASSWORD | `banking.password` | Banking Basics | A secret sequence of characters used to help verify a person’s identity when signing into a banking service. |
| PAY | `moneybasics.pay` | Money Basics | To give money for work, a purchase, or an amount owed. |
| PAYCHECK | `moneybasics.paycheck` | Money Basics | A payment an employee receives for completed work. |
| PAYMENT | `moneybasics.payment` | Money Basics | Money given to pay a bill, amount owed, or purchase. |
| PEER | `crypto.peer` | Crypto Foundations | Another network participant that communicates directly with your node rather than through one central server. |
| POSTED | `banking.posted` | Banking Basics | Describes a transaction that has been entered into the account record rather than remaining pending. |
| PRICE | `moneybasics.price` | Money Basics | The amount a seller asks for a good or service. |
| RATE | `moneybasics.rate` | Money Basics | An amount or percentage used to calculate a payment, cost, or return. |
| RECEIPT | `moneybasics.receipt` | Money Basics | A record showing that a purchase or payment was made. |
| REPAYMENT | `credit.repayment` | Credit Foundations | The process of paying a debt. |
| SWAP | `crypto.swap` | Crypto Foundations | To exchange one digital asset for another, often through a decentralized exchange or liquidity pool. |
| TERM | `credit.term` | Credit Foundations | The period allowed for repayment. |
| TOKEN | `crypto.token` | Crypto Foundations | A digital unit that represents value, access, ownership, or voting rights in a blockchain project. |
| VOTE | `investing.vote` | Investing Basics | To formally express a shareholder’s choice on a company matter. |

## Research sources

- **GOVERNED_REGISTRY:** Exact permanent IDs and owner-approved definitions from the local governed vocabularies and CAL-0008.
- **CFPB_AUTOMATIC_PAYMENTS:** [CFPB — How do automatic payments from a bank account work?](https://www.consumerfinance.gov/ask-cfpb/how-do-automatic-payments-from-a-bank-account-work-en-2021/)
- **CFPB_TILA:** [CFPB — What is a Truth-in-Lending disclosure for an auto loan?](https://www.consumerfinance.gov/ask-cfpb/what-is-a-truth-in-lending-disclosure-for-an-auto-loan-en-787/)
- **FDIC_DEPOSIT_ACCOUNTS:** [FDIC — Deposit Accounts](https://www.fdic.gov/consumer-resource-center/deposit-accounts)
- **FDIC_ACH:** [FDIC Money Smart — Module 4 Banking Services](https://www.fdic.gov/consumer-resource-center/mssb-m4-ig.pdf)
- **FTC_ACCOUNT_SECURITY:** [FTC — Use Two-Factor Authentication To Protect Your Accounts](https://consumer.ftc.gov/articles/use-two-factor-authentication-protect-your-accounts)
- **FTC_PASSWORDS:** [FTC — Creating Strong Passwords and Other Ways To Protect Your Accounts](https://consumer.ftc.gov/articles/creating-strong-passwords-and-other-ways-protect-your-accounts)
- **INVESTOR_BID_ASK:** [Investor.gov — Bid Price/Ask Price](https://www.investor.gov/introduction-investing/investing-basics/glossary/ask-price)
- **INVESTOR_ORDERS:** [Investor.gov — Types of Orders](https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders)
- **INVESTOR_STOCKS:** [Investor.gov — Stocks](https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks)
- **INVESTOR_FOREX:** [Investor.gov — Foreign Currency Exchange Trading](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/foreign)
- **NIST_BLOCKCHAIN:** [NIST — Blockchain Technology Overview](https://www.nist.gov/publications/blockchain-technology-overview)

## Implementation boundary

This proposal is review-only. The active `src/v3-puzzle-slate.js`, all content registries, runtime bundles, save schema, rewards, and player-progress behavior remain unchanged. Owner approval and a separately authorized implementation milestone are required before export or activation.

