# FinLit Quest — Inventory of the 147 Approved Financial Terms (145 original + 2 V3 supplement)

**Generated:** 2026-10-17 (read-only; produced from the game's own governed files)
**Slate column refreshed:** 2026-10-16 (Phase 5) from the current 27 puzzle specifications (all 27 compliant).
**Sources:** `content/money-basics-terms.js`, `content/credit-game-terms.js` (identities from `content/credit-term-identities.js`), `worlds/crypto.js` (identities and definitions), `content/banking-basics-terms.js`, `content/investing-basics-terms.js`.
**V3 supplement (owner-approved 2026-10-16, Phase 5):** ACH (`banking.ach`) and WORTH (`investing.worth`) were added, recorded in `content/v3-supplemental-terms.json` with sources and verification notes. They are marked **(V3 supplement)** below. The 145 original terms, IDs and definitions are unchanged, and the frozen Banking v1.1 (26 terms, 13 clusters) and Investing v1.1 legacy records are untouched.
**Nothing else was invented or edited:** every other identity is the term's existing permanent ID, and every definition is the governed text exactly as stored.

## Integrity checks
- 147 terms: Money Basics 36, Credit 38, Crypto 20, Banking Basics 27 (26 + ACH), Investing Basics 26 (25 + WORTH).
- 147 unique permanent IDs and 147 unique words (no word belongs to two worlds).
- Every ID starts with its owning world (`moneybasics.`, `credit.`, `crypto.`, `banking.`, `investing.`).
- No term is missing an identity or a definition.
- Term lengths range from 3 to 16 letters; only terms of 5 to 9 letters can be V3 anchors (the wheel holds at most 9 tiles).

## Existing reward and mastery behavior (applies to every term)
- **First-solve reward:** 7 coins per letter and 1.5 XP per letter (rounded), paid once. The "First solve" column shows the exact amounts.
- **Discovery is global.** Reward histories are saved per world, but the game now checks every world's history before paying, so a term earns its first-solve reward once in total, wherever it is first solved. (Owner decision 2026-10-17; reads existing histories only, no save change.)
- **Mastery:** one record per permanent ID, shared across worlds. Solving the term again in another world's puzzle adds to the same record; it never creates a second one.
- **When mastery is recorded:** Crypto terms in every mode; the other four worlds' terms in V3 puzzles (the legacy anchor-only mode never recorded mastery for them).
- **Non-financial (ordinary) words:** not part of this inventory; they pay 1 coin and 0 XP once per world and create no mastery record.

"Letters" lists each letter once with a count after it when it repeats (for example `A2 C1`).
"In V3 slate" shows where the term appears now: `anchor` or `secondary` in the named puzzle (cross-world appearances included).

## Money Basics (36 terms)

| Term | Permanent ID | Letters | First solve | In V3 slate | Governed definition |
|---|---|---|---|---|---|
| MONEY | `moneybasics.money` | E M N O Y | 35 coins / 8 XP | not yet | Something accepted to pay for goods, services, or debts. |
| PAYMENT | `moneybasics.payment` | A E M N P T Y | 49 coins / 11 XP | PAYMENT:anchor | Money given to pay a bill, amount owed, or purchase. |
| CASH | `moneybasics.cash` | A C H S | 28 coins / 6 XP | not yet | Money in the form of bills or coins that can be used directly. |
| COST | `moneybasics.cost` | C O S T | 28 coins / 6 XP | STOCK:secondary | The amount of money needed to buy or do something. |
| WANT | `moneybasics.want` | A N T W | 28 coins / 6 XP | not yet | Something a person would like but does not require for basic living. |
| INCOME | `moneybasics.income` | C E I M N O | 42 coins / 9 XP | INCOME:anchor | Money received from work, benefits, investments, or other sources. |
| EARN | `moneybasics.earn` | A E N R | 28 coins / 6 XP | not yet | To receive money in return for work or another activity. |
| RATE | `moneybasics.rate` | A E R T | 28 coins / 6 XP | TRADE:secondary; MARKET:secondary | An amount or percentage used to calculate a payment, cost, or return. |
| SPEND | `moneybasics.spend` | D E N P S | 35 coins / 8 XP | not yet | To use money to buy goods or services. |
| NEEDS | `moneybasics.needs` | D E2 N S | 35 coins / 8 XP | not yet | Things required for basic living, such as food and shelter. |
| WAGE | `moneybasics.wage` | A E G W | 28 coins / 6 XP | not yet | Money paid to a worker, often based on hours worked. |
| SALARY | `moneybasics.salary` | A2 L R S Y | 42 coins / 9 XP | not yet | A set amount of pay received for doing a job, often stated yearly. |
| BUDGET | `moneybasics.budget` | B D E G T U | 42 coins / 9 XP | BUDGET:anchor | A plan showing how money will be received, spent, and saved. |
| SAVING | `moneybasics.saving` | A G I N S V | 42 coins / 9 XP | SAVING:anchor | Keeping money for future use instead of spending it now. |
| GOAL | `moneybasics.goal` | A G L O | 28 coins / 6 XP | not yet | A result a person plans and works toward. |
| PRICE | `moneybasics.price` | C E I P R | 35 coins / 8 XP | RECEIPT:secondary | The amount a seller asks for a good or service. |
| RECEIPT | `moneybasics.receipt` | C E2 I P R T | 49 coins / 11 XP | RECEIPT:anchor | A record showing that a purchase or payment was made. |
| VALUE | `moneybasics.value` | A E L U V | 35 coins / 8 XP | not yet | The usefulness or worth of something compared with its cost. |
| SALE | `moneybasics.sale` | A E L S | 28 coins / 6 XP | not yet | An exchange in which a good or service is provided for money. |
| WEALTH | `moneybasics.wealth` | A E H L T W | 42 coins / 9 XP | not yet | Money, property, and other valuable assets a person or household owns. |
| BILL | `moneybasics.bill` | B I L2 | 28 coins / 6 XP | not yet | A notice showing money that must be paid. |
| DEPOSIT | `moneybasics.deposit` | D E I O P S T | 49 coins / 11 XP | not yet | Money placed into an account. |
| DEBIT | `moneybasics.debit` | B D E I T | 35 coins / 8 XP | not yet | Money taken from an account to complete a payment or withdrawal. |
| FUND | `moneybasics.fund` | D F N U | 28 coins / 6 XP | REFUND:secondary | Money collected or set aside for a particular purpose. |
| REFUND | `moneybasics.refund` | D E F N R U | 42 coins / 9 XP | REFUND:anchor | Money returned after an overpayment, return, or cancellation. |
| PAY | `moneybasics.pay` | A P Y | 21 coins / 5 XP | PAYMENT:secondary; PAYCHECK:secondary; PASSKEY:secondary | To give money for work, a purchase, or an amount owed. |
| PAYCHECK | `moneybasics.paycheck` | A C2 E H K P Y | 56 coins / 12 XP | PAYCHECK:anchor | A payment an employee receives for completed work. |
| CHANGE | `moneybasics.change` | A C E G H N | 42 coins / 9 XP | not yet | Money returned when someone pays more than a purchase costs. |
| CHARGE | `moneybasics.charge` | A C E G H R | 42 coins / 9 XP | not yet | An amount added to a bill or account for a purchase or service. |
| PROFIT | `moneybasics.profit` | F I O P R T | 42 coins / 9 XP | not yet | Money left after the costs of earning revenue are subtracted. |
| FEE | `moneybasics.fee` | E2 F | 21 coins / 5 XP | not yet | Money charged for a service, action, or account feature. |
| LOSS | `moneybasics.loss` | L O S2 | 28 coins / 6 XP | not yet | Money or value no longer available because costs exceeded gains or value fell. |
| GROSS | `moneybasics.gross` | G O R S2 | 35 coins / 8 XP | not yet | A total amount before taxes or other deductions are removed. |
| NET | `moneybasics.net` | E N T | 21 coins / 5 XP | TOKEN:secondary; PAYMENT:secondary; CONVERT:secondary; RETURN:secondary | An amount remaining after deductions or costs are subtracted. |
| EXPENSE | `moneybasics.expense` | E3 N P S X | 49 coins / 11 XP | not yet | Money spent or owed for a good, service, or other cost. |
| INFLATION | `moneybasics.inflation` | A F I2 L N2 O T | 63 coins / 14 XP | not yet | A broad rise in prices that reduces how much money can buy over time. |

## Credit (38 terms)

| Term | Permanent ID | Letters | First solve | In V3 slate | Governed definition |
|---|---|---|---|---|---|
| CREDIT | `credit.credit` | C D E I R T | 42 coins / 9 XP | CREDITOR:secondary | An arrangement that provides value now in exchange for repayment later. |
| TERMS | `credit.terms` | E M R S T | 35 coins / 8 XP | TERMS:anchor | The rules governing repayment, cost, timing, and responsibilities. |
| ACCOUNT | `credit.account` | A C2 N O T U | 49 coins / 11 XP | not yet | The record used to track a credit relationship. |
| OBLIGATION | `credit.obligation` | A B G I2 L N O2 T | 70 coins / 15 XP | not yet | A duty to repay or perform under an agreement. |
| BORROWER | `credit.borrower` | B E O2 R3 W | 56 coins / 12 XP | not yet | The party receiving credit and agreeing to repay. |
| APPLICANT | `credit.applicant` | A2 C I L N P2 T | 63 coins / 14 XP | not yet | A person requesting credit before approval. |
| COSIGNER | `credit.cosigner` | C E G I N O R S | 56 coins / 12 XP | not yet | A person who agrees to repay if the primary borrower does not. |
| AFFORDABILITY | `credit.affordability` | A2 B D F2 I2 L O R T Y | 91 coins / 20 XP | not yet | Whether payments fit within available income and obligations. |
| CREDITOR | `credit.creditor` | C D E I O R2 T | 56 coins / 12 XP | CREDITOR:anchor | A party to whom money is owed. |
| LENDER | `credit.lender` | D E2 L N R | 42 coins / 9 XP | not yet | A party that provides funds or credit. |
| UNDERWRITING | `credit.underwriting` | D E G I2 N2 R2 T U W | 84 coins / 18 XP | not yet | The process used to evaluate an application and risk. |
| RISK | `credit.risk` | I K R S | 28 coins / 6 XP | not yet | The possibility that repayment will not occur as agreed. |
| SERVICER | `credit.servicer` | C E2 I R2 S V | 56 coins / 12 XP | not yet | The company that manages billing and payment administration. |
| DEBT | `credit.debt` | B D E T | 28 coins / 6 XP | BUDGET:secondary | An amount or obligation owed. |
| BALANCE | `credit.balance` | A2 B C E L N | 49 coins / 11 XP | not yet | The amount currently owed on an account. |
| LOAN | `credit.loan` | A L N O | 28 coins / 6 XP | not yet | Money provided with an obligation to repay. |
| TERM | `credit.term` | E M R T | 28 coins / 6 XP | TERMS:secondary; REPAYMENT:secondary; MARKET:secondary | The period allowed for repayment. |
| DISBURSEMENT | `credit.disbursement` | B D E2 I M N R S2 T U | 84 coins / 18 XP | not yet | Release of loan funds. |
| PRINCIPAL | `credit.principal` | A C I2 L N P2 R | 63 coins / 14 XP | PRINCIPAL:anchor | The amount borrowed or remaining loan amount. |
| CAPITALIZATION | `credit.capitalization` | A3 C I3 L N O P T2 Z | 98 coins / 21 XP | not yet | Adding certain unpaid interest or charges to principal. |
| AMORTIZATION | `credit.amortization` | A2 I2 M N O2 R T2 Z | 84 coins / 18 XP | not yet | Repayment through scheduled payments over time. |
| INTEREST | `credit.interest` | E2 I N R S T2 | 56 coins / 12 XP | not yet | The cost charged for borrowing money. |
| APR | `credit.apr` | A P R | 21 coins / 5 XP | PRINCIPAL:secondary; REPAYMENT:secondary | Annual Percentage Rate, an annual borrowing-cost measure. |
| APY | `credit.apy` | A P Y | 21 coins / 5 XP | REPAYMENT:secondary; AUTOPAY:secondary; CAPACITY:secondary; PASSKEY:secondary | Annual Percentage Yield, an annual deposit-yield measure reflecting compounding. |
| REPAYMENT | `credit.repayment` | A E2 M N P R T Y | 63 coins / 14 XP | REPAYMENT:anchor | The process of paying a debt. |
| AUTOPAY | `credit.autopay` | A2 O P T U Y | 49 coins / 11 XP | AUTOPAY:anchor | Automatic scheduled electronic payment. |
| DISCLOSURE | `credit.disclosure` | C D E I L O R S2 U | 70 coins / 15 XP | not yet | Required or provided information about terms and cost. |
| PREPAYMENT | `credit.prepayment` | A E2 M N P2 R T Y | 70 coins / 15 XP | not yet | Paying part or all of a loan early. |
| COLLATERAL | `credit.collateral` | A2 C E L3 O R T | 70 coins / 15 XP | not yet | Property pledged to support repayment. |
| REPOSSESSION | `credit.repossession` | E2 I N O2 P R S4 | 84 coins / 18 XP | not yet | Taking secured property after default under applicable rules. |
| FORECLOSURE | `credit.foreclosure` | C E2 F L O2 R2 S U | 77 coins / 17 XP | not yet | A legal process involving property securing a mortgage debt. |
| CREDITWORTHINESS | `credit.creditworthiness` | C D E2 H I2 N O R2 S2 T2 W | 112 coins / 24 XP | not yet | Assessment of ability and likelihood to repay. |
| CAPACITY | `credit.capacity` | A2 C2 I P T Y | 56 coins / 12 XP | CAPACITY:anchor | Ability to make payments from available resources. |
| DELINQUENCY | `credit.delinquency` | C D E2 I L N2 Q U Y | 77 coins / 17 XP | not yet | Past-due payment status. |
| DEFAULT | `credit.default` | A D E F L T U | 49 coins / 11 XP | not yet | Serious failure to meet agreement obligations. |
| ACCELERATION | `credit.acceleration` | A2 C2 E2 I L N O R T | 84 coins / 18 XP | not yet | Requiring the full outstanding amount to become due. |
| COLLECTION | `credit.collection` | C2 E I L2 N O2 T | 70 coins / 15 XP | not yet | Efforts to recover an unpaid obligation. |
| REMEDY | `credit.remedy` | D E2 M R Y | 42 coins / 9 XP | not yet | An action available under contract or law after breach. |

## Crypto (20 terms)

| Term | Permanent ID | Letters | First solve | In V3 slate | Governed definition |
|---|---|---|---|---|---|
| TOKEN | `crypto.token` | E K N O T | 35 coins / 8 XP | TOKEN:anchor | A digital unit that represents value, access, ownership, or voting rights in a blockchain project. |
| NODE | `crypto.node` | D E N O | 28 coins / 6 XP | not yet | A computer connected to a blockchain network that stores, checks, or shares network data. |
| COIN | `crypto.coin` | C I N O | 28 coins / 6 XP | INCOME:secondary | A digital asset native to its own blockchain, often used to pay network fees or transfer value. |
| MINT | `crypto.mint` | I M N T | 28 coins / 6 XP | not yet | To create new coins or tokens according to a blockchain or smart contract's rules. |
| POOL | `crypto.pool` | L O2 P | 28 coins / 6 XP | not yet | A shared collection of tokens that a DeFi protocol uses for trading, lending, or other services. |
| LOCK | `crypto.lock` | C K L O | 28 coins / 6 XP | BLOCK:secondary | To restrict tokens from being transferred or withdrawn for a set time or until conditions are met. |
| BLOCK | `crypto.block` | B C K L O | 35 coins / 8 XP | BLOCK:anchor | A verified batch of transactions added as one new record in a blockchain's history. |
| FORK | `crypto.fork` | F K O R | 28 coins / 6 XP | not yet | A change in blockchain rules that creates a new path for the network's software or transaction history. |
| HASH | `crypto.hash` | A H2 S | 28 coins / 6 XP | not yet | A fixed-length digital fingerprint produced from data, used to detect changes and link blockchain records. |
| GAS | `crypto.gas` | A G S | 21 coins / 5 XP | SAVING:secondary | The fee paid to process a transaction or run an application action on certain blockchains. |
| CHAIN | `crypto.chain` | A C H I N | 35 coins / 8 XP | CHAIN:anchor | The ordered, linked history of transaction blocks maintained by a blockchain network. |
| YIELD | `crypto.yield` | D E I L Y | 35 coins / 8 XP | not yet | The return earned by putting digital assets into a DeFi strategy, usually expressed as a percentage. |
| LEDGER | `crypto.ledger` | D E2 G L R | 42 coins / 9 XP | not yet | A record of transactions and balances that a blockchain network keeps synchronized across participants. |
| PEER | `crypto.peer` | E2 P R | 28 coins / 6 XP | not yet | Another network participant that communicates directly with your node rather than through one central server. |
| STAKE | `crypto.stake` | A E K S T | 35 coins / 8 XP | STAKE:anchor | To commit tokens to help secure a proof-of-stake network or participate in a protocol, often for rewards. |
| SWAP | `crypto.swap` | A P S W | 28 coins / 6 XP | PASSWORD:secondary | To exchange one digital asset for another, often through a decentralized exchange or liquidity pool. |
| BURN | `crypto.burn` | B N R U | 28 coins / 6 XP | not yet | To permanently remove tokens from usable circulation, usually by sending them to an inaccessible address. |
| VAULT | `crypto.vault` | A L T U V | 35 coins / 8 XP | not yet | A smart-contract strategy that manages deposited assets according to predefined rules to pursue a return. |
| WALLET | `crypto.wallet` | A E L2 T W | 42 coins / 9 XP | not yet | Software or hardware that manages the private keys used to control blockchain assets and sign transactions. |
| MINER | `crypto.miner` | E I M N R | 35 coins / 8 XP | not yet | A participant that uses computing work to compete to add blocks on a proof-of-work blockchain. |

## Banking Basics (27 terms)

| Term | Permanent ID | Letters | First solve | In V3 slate | Governed definition |
|---|---|---|---|---|---|
| ACCESS | `banking.access` | A C2 E S2 | 42 coins / 9 XP | not yet | A way or means of entering, reaching, or using a banking account or payment service. |
| PASSKEY | `banking.passkey` | A E K P S2 Y | 49 coins / 11 XP | PASSKEY:anchor | A secure sign-in credential that uses a device, PIN, fingerprint, or face scan instead of a traditional password. |
| ALERT | `banking.alert` | A E L R T | 35 coins / 8 XP | not yet | A notice that warns a customer about account activity, security, or a possible problem. |
| MANDATE | `banking.mandate` | A2 D E M N T | 49 coins / 11 XP | not yet | Authorization that permits recurring electronic payments to be taken from an account. |
| CLEAR | `banking.clear` | A C E L R | 35 coins / 8 XP | not yet | To complete the information-processing stage required before a payment can be settled. |
| MOBILE | `banking.mobile` | B E I L M O | 42 coins / 9 XP | not yet | Describes banking services accessed through a phone, tablet, or other mobile device. |
| CONVERT | `banking.convert` | C E N O R T V | 49 coins / 11 XP | CONVERT:anchor | To change money from one currency into another currency. |
| NETWORK | `banking.network` | E K N O R T W | 49 coins / 11 XP | NETWORK:anchor | A connected system that carries payment instructions between participating institutions or service providers. |
| DEPOSITOR | `banking.depositor` | D E I O2 P R S T | 63 coins / 14 XP | DEPOSITOR:anchor | A person or organization that keeps money on deposit at a bank or other depository institution. |
| POSTED | `banking.posted` | D E O P S T | 42 coins / 9 XP | DEPOSITOR:secondary | Describes a transaction that has been entered into the account record rather than remaining pending. |
| DISPUTE | `banking.dispute` | D E I P S T U | 49 coins / 11 XP | not yet | To report and challenge a transaction or account error that a customer believes is incorrect or unauthorized. |
| INSURED | `banking.insured` | D E I N R S U | 49 coins / 11 XP | not yet | Protected by deposit insurance up to the applicable limits and under the applicable coverage rules. |
| HOLD | `banking.hold` | D H L O | 28 coins / 6 XP | not yet | A temporary delay that prevents deposited funds or part of an account balance from being available for use. |
| LIQUID | `banking.liquid` | D I2 L Q U | 42 coins / 9 XP | not yet | Describes money or an asset that can be accessed or converted into cash quickly. |
| LOGIN | `banking.login` | G I L N O | 35 coins / 8 XP | not yet | The process of securely signing into an online or mobile banking account. |
| ROUTING | `banking.routing` | G I N O R T U | 49 coins / 11 XP | not yet | The process of directing a payment instruction through a network toward the correct financial institution or destination. |
| MATURITY | `banking.maturity` | A I M R T2 U Y | 56 coins / 12 XP | not yet | The date when a time deposit reaches the end of its stated term and becomes due for repayment or renewal. |
| REMIT | `banking.remit` | E I M R T | 35 coins / 8 XP | not yet | To send money to another person or place, often through a domestic or international transfer service. |
| ONLINE | `banking.online` | E I L N2 O | 42 coins / 9 XP | not yet | Describes banking services accessed through an internet website or internet-connected service. |
| PENDING | `banking.pending` | D E G I N2 P | 49 coins / 11 XP | not yet | Describes a transaction that has been authorized or received but has not yet posted to the account. |
| PASSWORD | `banking.password` | A D O P R S2 W | 56 coins / 12 XP | PASSWORD:anchor | A secret sequence of characters used to help verify a person’s identity when signing into a banking service. |
| SPREAD | `banking.spread` | A D E P R S | 42 coins / 9 XP | not yet | The difference between the exchange rate used to buy a currency and the rate used to sell it. |
| RESERVE | `banking.reserve` | E3 R2 S V | 49 coins / 11 XP | not yet | Funds kept available to meet withdrawals, payments, losses, or other expected financial obligations. |
| SECURE | `banking.secure` | C E2 R S U | 42 coins / 9 XP | not yet | Protected against unauthorized access, use, alteration, or disclosure. |
| TIERED | `banking.tiered` | D E2 I R T | 42 coins / 9 XP | not yet | Describes an account that applies different interest rates to specified balance levels. |
| VERIFY | `banking.verify` | E F I R V Y | 42 coins / 9 XP | not yet | To confirm that a person, instruction, transaction, or piece of account information is authentic or correct. |
| ACH (V3 supplement) | `banking.ach` | A C H | 21 coins / 5 XP | CHAIN:secondary | An electronic network that moves money between bank and credit union accounts, used for direct deposits and recurring bill payments. |

## Investing Basics (26 terms)

| Term | Permanent ID | Letters | First solve | In V3 slate | Governed definition |
|---|---|---|---|---|---|
| STOCK | `investing.stock` | C K O S T | 35 coins / 8 XP | STOCK:anchor | An investment that represents an ownership interest in a company. |
| SELL | `investing.sell` | E L2 S | 28 coins / 6 XP | not yet | To transfer an investment to a buyer in exchange for money. |
| ASK | `investing.ask` | A K S | 21 coins / 5 XP | STAKE:secondary | The lowest price at which a seller is currently willing to sell an investment. |
| SHARE | `investing.share` | A E H R S | 35 coins / 8 XP | not yet | One unit of ownership in a company, fund, or other investment. |
| ASSET | `investing.asset` | A E S2 T | 35 coins / 8 XP | not yet | Something with financial value that can be owned or held as an investment. |
| ISSUER | `investing.issuer` | E I R S2 U | 42 coins / 9 XP | not yet | A company, government, or other organization that creates and offers a security. |
| BOND | `investing.bond` | B D N O | 28 coins / 6 XP | not yet | A debt investment in which an investor lends money to a government, company, or other issuer. |
| GAIN | `investing.gain` | A G I N | 28 coins / 6 XP | SAVING:secondary | An increase in an investment’s price or the amount received above its purchase cost. |
| LONG | `investing.long` | G L N O | 28 coins / 6 XP | not yet | Describes owning an investment with the expectation that its price may increase. |
| BROKER | `investing.broker` | B E K O R2 | 42 coins / 9 XP | not yet | A person or firm that carries out securities transactions for customers. |
| MARKET | `investing.market` | A E K M R T | 42 coins / 9 XP | MARKET:anchor | A system or place where buyers and sellers trade investments. |
| BEAR | `investing.bear` | A B E R | 28 coins / 6 XP | not yet | Describes an investor or market outlook that expects prices to decline. |
| RETURN | `investing.return` | E N R2 T U | 42 coins / 9 XP | RETURN:anchor | The money gained or lost from an investment, including price changes and payments such as interest or dividends. |
| TRADE | `investing.trade` | A D E R T | 35 coins / 8 XP | TRADE:anchor | A completed purchase or sale of an investment. |
| ORDER | `investing.order` | D E O R2 | 35 coins / 8 XP | not yet | An instruction to buy or sell an investment under stated conditions. |
| EQUITY | `investing.equity` | E I Q T U Y | 42 coins / 9 XP | not yet | Ownership in a company or other asset after accounting for claims against it. |
| BUY | `investing.buy` | B U Y | 21 coins / 5 XP | not yet | To acquire an investment by paying its purchase price. |
| BULL | `investing.bull` | B L2 U | 28 coins / 6 XP | not yet | Describes an investor or market outlook that expects prices to rise. |
| GROWTH | `investing.growth` | G H O R T W | 42 coins / 9 XP | GROWTH:anchor | An increase over time in a company, investment, or investment portfolio. |
| OWNER | `investing.owner` | E N O R W | 35 coins / 8 XP | NETWORK:secondary | A person or organization that legally holds an investment or ownership interest. |
| VOTE | `investing.vote` | E O T V | 28 coins / 6 XP | CONVERT:secondary | To formally express a shareholder’s choice on a company matter. |
| DIVIDEND | `investing.dividend` | D3 E I2 N V | 56 coins / 12 XP | not yet | A payment a company may make to shareholders from its earnings or other available resources. |
| INDEX | `investing.index` | D E I N X | 35 coins / 8 XP | not yet | A measure that tracks the performance of a selected group of investments. |
| CAPITAL | `investing.capital` | A2 C I L P T | 49 coins / 11 XP | not yet | Money or other financial resources committed to an investment or business. |
| BID | `investing.bid` | B D I | 21 coins / 5 XP | not yet | The highest price a buyer is currently willing to pay for an investment. |
| WORTH (V3 supplement) | `investing.worth` | H O R T W | 35 coins / 8 XP | GROWTH:secondary | The amount of money something is valued at, or the amount by which what a person owns is greater than what they owe, as in net worth. |

