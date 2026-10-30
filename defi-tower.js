/* DeFi Tower — a modular Financial City feature.
   EDUCATIONAL DRAFT: scenarios, scoring and wording have not been through FinLit Quest curriculum review or approval.
   All people, apps, coins and numbers are fictional teaching examples. Nothing here is financial advice.
   Works in the browser (window.FLQ_TOWER) and in Node (module.exports) so the logic can be tested without a DOM.
   Its saved state lives under its own storage key and never touches the Financial City allocation game, profiles,
   prototype wallet, lessons or best scores. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FLQ_TOWER = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var STORAGE_KEY = "flq-defi-tower-v1";
  var POINTS = 100;
  var DRAFT_NOTE = "Educational draft. These scenarios, answers and scores have not been reviewed or approved by FinLit Quest curriculum review. Every person, app and coin is fictional, and every number is a made-up teaching assumption.";
  var RISK_NOTE = "Crypto assets, stablecoins and DeFi apps generally do not have the standard insured-deposit protection that covers eligible bank accounts (for example FDIC insurance in the US, up to limits). Advertised returns are variable and never guaranteed, and you can lose some or all of what you put in. This is not financial advice.";
  var TIER_LABEL = { best: "Best fit", ok: "Also defensible", weak: "Not the best fit" };

  /* tier: best and ok both earn the points; weak earns none. defi marks choices that put money into DeFi,
     so tests can prove a perfect score never requires it. */
  var FLOORS = [
    { id: "tower-f1", n: 1, title: "High-Yield Temptation", theme: "Emergency fund vs. DeFi yield",
      setup: "Maya has a $6,000 emergency fund in a high-yield savings account at an insured bank. Her rent is due in three weeks and her car is old. A friend shows her a DeFi app advertising “up to 12% APY” on a stablecoin deposit, compared with 4% at her bank.",
      assumptions: ["Maya and the app are fictional. The 12% is an advertised, variable rate, not a promise.", "The example assumes a US bank with standard deposit insurance up to its limit. Rules differ by country and account type, so check official sources.", "The 4% savings rate is illustrative and changes over time."],
      question: "What should Maya do with her emergency fund?",
      choices: [
        { id: "a", tier: "weak", defi: true, text: "Move all $6,000 into the DeFi app to earn the higher rate.",
          fb: "An emergency fund has one job: to be there, at full value, on short notice. The advertised rate can change at any time and is not guaranteed. Money in a DeFi app is generally not covered by deposit insurance, and software bugs, hacks or withdrawal limits could delay or reduce what she gets back. A few extra percentage points are small next to the cost of being locked out when the car breaks down." },
        { id: "b", tier: "best", defi: false, text: "Keep the emergency fund in the insured savings account and skip the DeFi app for now.",
          fb: "Safety, quick access and insurance matter most for money you may need soon. Maya keeps full, predictable access and gives up only a modest amount of extra interest. If she wants to learn about DeFi later, she can do that with money that is not her safety net." },
        { id: "c", tier: "ok", defi: true, text: "Keep the emergency fund where it is, and set aside a small amount she could afford to lose entirely to learn how the app works.",
          fb: "Defensible, because the emergency fund stays safe and the learning money is separate and small. The risk stays real: that small amount can still be lost. It works only if she treats it as the cost of learning, not as an investment she is counting on." }
      ],
      takeaway: "Money you may need soon belongs where it is safe and reachable. A high advertised yield is a reason to ask “who pays this and what could go wrong?”, not a reason to move your safety net." },

    { id: "tower-f2", n: 2, title: "Stablecoin or Bank", theme: "Protecting money needed for bills",
      setup: "Sam has $2,400 in checking. Rent ($1,500) and an insurance bill ($300) are due in two weeks. An exchange app says its “dollar stablecoin is always worth $1” and offers a small reward for holding it.",
      assumptions: ["A stablecoin is a digital token that aims to hold a steady value, often $1. Aiming to hold a value is not the same as guaranteeing it.", "The app and the reward rate are fictional and illustrative."],
      question: "Where should the $1,800 Sam needs for bills sit until the bills are paid?",
      choices: [
        { id: "a", tier: "best", defi: false, text: "Keep the $1,800 in the insured bank account until the bills are paid. If Sam wants to try stablecoins later, use money that is not needed for bills.",
          fb: "Money with a due date should sit where its value and availability are the most predictable. Eligible bank deposits are generally insured up to limits, and paying a bill from a bank account is simple. Sam can still explore stablecoins later with money that is not earmarked for bills." },
        { id: "b", tier: "weak", defi: true, text: "Convert the $1,800 to the stablecoin because it is “always worth $1.”",
          fb: "A stablecoin aims to stay near $1 but can slip below it, sometimes sharply, if people doubt its reserves or sellers rush for the exit. Stablecoin holdings are generally not covered by deposit insurance, and turning them back into dollars can involve fees, delays or limits. For money with a deadline, a small reward is not worth those risks." },
        { id: "c", tier: "weak", defi: true, text: "Read the issuer’s reserve report first, and if it looks fine, move the whole $1,800.",
          fb: "Reading reserve reports is a good habit, but it does not create insurance and it does not remove the risk of a de-peg, a platform problem or a delay. Research can reduce uncertainty. It cannot make money you need by a deadline safe to put at risk." }
      ],
      takeaway: "“Stable” describes a goal, not a protection. Bills, rent and other near-term needs belong in places with strong protections and easy access." },

    { id: "tower-f3", n: 3, title: "Crypto-Backed Borrowing", theme: "Collateral and liquidation risk",
      setup: "Priya holds 2 units of a fictional coin, “Aurum,” priced at $2,500 each ($5,000 total). She needs $2,000 for a one-time expense next month. A lending protocol will let her borrow stablecoins using her Aurum as collateral. If the collateral’s value falls too far, the protocol automatically sells it to repay the loan. That is called liquidation, and it usually comes with a penalty.",
      assumptions: ["Educational assumption: the loan is liquidated when it reaches 80% of the collateral’s value. Real protocols use different rules, fees and interest.", "Borrowing $2,000 against $5,000 is 40% of the collateral’s value. Borrowing the offered maximum of $3,500 is 70%.", "Aurum is fictional. Crypto prices can move sharply in a single day."],
      question: "How should Priya cover the $2,000?",
      choices: [
        { id: "a", tier: "ok", defi: true, text: "Borrow only the $2,000 she needs, know the price at which liquidation would start, and have a plan to add collateral or repay quickly if the price falls.",
          fb: "Defensible with conditions. In this example liquidation would start if Aurum fell about 50% (to roughly $1,250 each). That is a real cushion, but not a guarantee: prices can drop faster than anyone can react, and the sale is automatic. Interest and smart-contract risk also apply. This works only if she can truly add collateral or repay on short notice." },
        { id: "b", tier: "weak", defi: true, text: "Borrow the maximum $3,500 offered so she has extra cash on hand.",
          fb: "At 70% of her collateral’s value, liquidation could begin after a drop of only about 12.5% (Aurum near $2,190). A move that size can happen in a day. If it does, her Aurum is sold automatically at a price she did not choose, usually with a penalty. Borrowing more than you need makes the cushion thinner for no benefit." },
        { id: "c", tier: "best", defi: false, text: "Cover the $2,000 without borrowing against crypto, from savings or by selling just enough Aurum, and accept any taxes or lost future upside.",
          fb: "Paying with savings or selling a portion is certain and simple: no loan interest, no liquidation trigger and no lending-protocol risk. The trade-offs are real too. Selling may create a tax bill (rules vary, so check official sources) and she gives up any future gains on what she sells." }
      ],
      takeaway: "Borrowing against volatile assets adds a second risk: you can be forced to sell at the worst moment. The thinner the cushion, the faster that can happen." },

    { id: "tower-f4", n: 4, title: "Liquidity Pool", theme: "Rewards vs. smart-contract and impermanent-loss risk",
      setup: "Leo has $1,000 left after covering bills and savings goals. A liquidity pool pairs two fictional coins, Aurum and Beryl, and advertises “40% APR,” paid partly in a reward token called GLOW. Liquidity providers deposit both coins and earn a share of trading fees plus rewards.",
      assumptions: ["The advertised rate is not a promise. It can change constantly and may be mostly paid in a reward token whose price can fall.", "Impermanent loss: if the two coins’ prices move apart, the pool’s mix can leave a provider with less value than simply holding the coins.", "Smart-contract risk: bugs, hacks or developers pulling funds (a “rug pull”) can wipe out deposits. All names and numbers are fictional."],
      question: "What should Leo do?",
      choices: [
        { id: "a", tier: "best", defi: false, text: "Pass for now. He wants to be able to explain where the yield comes from and how he could lose money before using any of his own.",
          fb: "If you cannot explain where a return comes from, you cannot judge whether it is worth the risk. A very high advertised rate is a prompt to ask who is paying it. Here, much of it is newly issued reward tokens, which can lose value. Leo’s $1,000 can stay in simple, diversified options while he learns." },
        { id: "b", tier: "ok", defi: true, text: "Deposit a small amount, such as $50 he could afford to lose entirely, after reading about the project’s audits and how impermanent loss works.",
          fb: "Defensible as a learning step because the amount is small and chosen so that a total loss would not hurt. Audits can reduce risk but do not remove it. He should expect the rate to change and treat any gain as a bonus, not income he depends on." },
        { id: "c", tier: "weak", defi: true, text: "Deposit the full $1,000 into the pool with the most money in it, because a big pool must be safe.",
          fb: "Size is not safety. A large pool shows popularity, not protection. Large projects have also been hacked, impermanent loss is built into how pools work, and reward tokens can drop in value. Putting the entire $1,000 in one place concentrates every one of those risks." }
      ],
      takeaway: "High advertised yield usually means someone is bearing risk. Understand the source of a return before you use money you cannot afford to lose." },

    { id: "tower-f5", n: 5, title: "Wallet Security", theme: "Phishing and malicious approvals",
      setup: "Dana gets a direct message from an account that looks like “Official Support” for her wallet app: “Your wallet is at risk. Verify within ten minutes.” The link opens a page asking her to connect her wallet and sign a transaction that gives the site permission to spend her tokens. A second box asks for her 12-word recovery phrase to “restore access.”",
      assumptions: ["The app, account and page are fictional.", "Real wallet apps and support teams do not message you first asking you to verify, sign or share a recovery phrase.", "Blockchain transactions are generally irreversible, and there is usually no bank-style fraud team that can undo them."],
      question: "What should Dana do?",
      choices: [
        { id: "a", tier: "weak", defi: true, text: "Connect and sign right away, because the message says time is running out.",
          fb: "Urgency is a classic scam tactic. Signing an approval can let a malicious contract move tokens out of her wallet, and a completed transaction usually cannot be reversed. Slowing down is the protection." },
        { id: "b", tier: "best", defi: false, text: "Not click or sign anything. Check the wallet app’s official site by typing the address or using a saved bookmark, never share the recovery phrase, and report the message.",
          fb: "Correct. Anyone with the recovery phrase controls the wallet, and a legitimate team never needs it. Before signing any transaction, read what it permits and refuse broad approvals you do not understand. Good habits also include keeping most funds in a separate wallet, using a hardware wallet for larger amounts, and reviewing and revoking old approvals." },
        { id: "c", tier: "weak", defi: false, text: "Type her recovery phrase into the page so “support” can restore her access.",
          fb: "The recovery phrase is the master key. Typing it into a page hands the wallet to whoever runs that page, and the funds can be emptied within minutes. No real support process requires it." }
      ],
      takeaway: "Never share a recovery phrase, never sign what you do not understand, and be most suspicious when a message makes you hurry." },

    { id: "tower-f6", n: 6, title: "International Payments", theme: "Total cost, speed, access and protections",
      setup: "Ana wants to send $500 to her sister, who receives it in local currency in another country. Option 1: a bank wire with a $35 fee, about a 3% exchange-rate margin, 3 to 5 days. Option 2: a licensed money-transfer app with a $4 fee, about a 1.5% margin, usually within a day, with bank deposit or cash pickup. Option 3: a stablecoin transfer with a network fee under $1, but each side must convert and cash out, and her sister has no exchange account yet.",
      assumptions: ["All fees and margins are made-up teaching numbers. Real prices vary by country, provider and day.", "Total cost = fees + the gap between the exchange rate you get and the market rate. In this example the wire costs about $50 and the transfer app about $11.50.", "Illustrative estimate: the stablecoin route would cost roughly $15 to $20 once buying, selling and cash-out fees are counted."],
      question: "How should Ana decide?",
      choices: [
        { id: "a", tier: "ok", defi: true, text: "Use the stablecoin route only if her sister already uses a reputable exchange or wallet and can cash out locally. First compare the total cost including conversion, and send a small test amount.",
          fb: "Defensible when those conditions are met. A tiny network fee is not the whole price, because buying, selling and cashing out all cost money. Sending to a wrong address is usually irreversible, and the protections are different from a regulated provider. The test transfer and the cost comparison are what make this reasonable." },
        { id: "b", tier: "weak", defi: false, text: "Pick whichever option shows the lowest headline fee and send it right away.",
          fb: "A headline fee is not the total cost. In this example the bank’s 3% margin on $500 adds $15 on top of its $35 fee, and the exchange-rate margin is often the larger cost. Speed, how the recipient collects the money, and what happens if something goes wrong matter too." },
        { id: "c", tier: "best", defi: false, text: "Compare how much her sister will actually receive, how long it takes, how she can collect it and what protections each option offers, then choose a regulated provider that fits.",
          fb: "Comparing the delivered amount, speed, recipient access and protections is the habit that works for any transfer. In this example the licensed transfer app costs about $11.50 against about $50 for the wire, arrives sooner and fits her sister’s situation. Her situation could be different in another country or at another amount." }
      ],
      takeaway: "Judge a payment by what arrives, how fast, how easily the recipient can use it, and what protections apply, not by one headline fee." },

    { id: "tower-f7", n: 7, title: "Market Crash", theme: "Risk management and potential losses",
      setup: "Eli put $1,500 into a volatile crypto coin as a small “learning” position, about 3% of his savings and investments. His written plan says: only invest what I can afford to lose, never borrow to invest, and review if it falls 50%. Today the coin is down 55% in a week and social media is in a panic. Prices could fall further or recover; nobody knows.",
      assumptions: ["Eli and the coin are fictional.", "Position size is what makes a crash survivable: a 55% loss on 3% of his money is a 1.65% hit to his total.", "Crypto assets can lose most or all of their value, and there is no deposit insurance to make up the loss."],
      question: "What should Eli do?",
      choices: [
        { id: "a", tier: "weak", defi: true, text: "Borrow money to buy more now so he can recover faster.",
          fb: "Borrowing to invest magnifies losses. If the price keeps falling he still owes the loan, and his own plan said never to borrow to invest. “Averaging down” with borrowed money turns a contained loss into a potentially much larger one." },
        { id: "b", tier: "ok", defi: false, text: "Sell the position, accept the loss, and stop, because he no longer wants to carry this level of risk.",
          fb: "Defensible. Selling locks in the loss, but if the drop showed Eli that he is uncomfortable with this much volatility, reducing or exiting is a legitimate choice. The loss is bounded because he sized the position small. What matters is that the decision is deliberate, not a reaction to headlines." },
        { id: "c", tier: "best", defi: false, text: "Pause before acting, confirm the loss is within what he planned to risk, follow his written review step, and decide to hold, reduce or exit based on his goals and not the news cycle.",
          fb: "A plan made calmly beats a decision made in a panic. Because he sized the position small, the damage is limited and he has room to think. Holding, reducing or exiting can each be reasonable after the review. What is not reasonable is adding money or borrowing out of fear or hope." }
      ],
      takeaway: "You manage crash risk before the crash: size positions so a total loss is survivable, never borrow to speculate, and write down your rules while you are calm." },

    { id: "tower-f8", n: 8, title: "Financial Future", theme: "Diversified allocation, with optional DeFi",
      setup: "Jordan, 28, has a steady job, a three-month emergency fund in an insured savings account and $600 a month to invest for retirement more than 30 years away. The employer’s retirement plan matches contributions up to $200 a month. Jordan is curious about DeFi.",
      assumptions: ["Jordan is fictional, and these splits are teaching examples, not personal advice or a recommended allocation.", "Employer-match rules, contribution limits and taxes vary and change. Check your plan and official sources.", "Any DeFi money is optional, high-risk money Jordan could afford to lose entirely."],
      question: "How could Jordan reasonably use the $600 a month?",
      choices: [
        { id: "a", tier: "ok", defi: true, text: "$200 to capture the full employer match, $370 into diversified low-cost index funds, and $30 (5%) into a crypto/DeFi “satellite” he could afford to lose.",
          fb: "Defensible. The basics come first (match, diversified core), and the small DeFi slice is capped at an amount that cannot derail Jordan’s goals. It stays optional and should be treated as high risk with no guarantees." },
        { id: "b", tier: "best", defi: false, text: "$200 to capture the full employer match and the other $400 into diversified low-cost funds, with nothing in DeFi.",
          fb: "A strong fit for a long horizon: capture the match (an immediate boost on the money Jordan contributes), then spread the rest widely at low cost. No DeFi is required for a sound plan or for a perfect score here." },
        { id: "c", tier: "weak", defi: true, text: "Put the full $600 each month into the highest advertised DeFi yield to grow faster.",
          fb: "This ignores the employer match, concentrates everything in one high-risk place and relies on advertised rates that are never guaranteed. Without diversification or deposit-style protection, one hack, de-peg or rate drop could erase years of contributions." }
      ],
      takeaway: "A strong plan starts with protection, free money like an employer match, and broad diversification. Any DeFi is an optional, small extra, never the foundation." }
  ];

  /* ---------- pure logic (no DOM) ---------- */
  function floorById(id) { for (var i = 0; i < FLOORS.length; i++) if (FLOORS[i].id === id) return FLOORS[i]; return null; }
  function choiceById(floor, id) { for (var i = 0; i < floor.choices.length; i++) if (floor.choices[i].id === id) return floor.choices[i]; return null; }
  function maxScore() { return FLOORS.length * POINTS; }
  function pointsFor(floor, choiceId) { var c = choiceById(floor, choiceId); return c && c.tier !== "weak" ? POINTS : 0; }
  function emptySaved() { return { v: 1, banked: {}, seen: {}, best: 0, runs: 0, run: null }; }
  function newRun() { return { answers: {}, idx: 0, done: false }; }
  function answeredCount(run) { var n = 0; FLOORS.forEach(function (f) { if (run.answers[f.id]) n++; }); return n; }
  function allAnswered(run) { return answeredCount(run) === FLOORS.length; }
  function runScore(run) { var s = 0; FLOORS.forEach(function (f) { if (run.answers[f.id]) s += pointsFor(f, run.answers[f.id]); }); return s; }
  function bankedTotal(saved) { var s = 0; FLOORS.forEach(function (f) { if (saved.banked[f.id] === POINTS) s += POINTS; }); return s; }
  function seenCount(saved) { var n = 0; FLOORS.forEach(function (f) { if (saved.seen[f.id] || saved.banked[f.id]) n++; }); return n; }
  function firstOpenIndex(run) { for (var i = 0; i < FLOORS.length; i++) if (!run.answers[FLOORS[i].id]) return i; return FLOORS.length - 1; }

  function sanitizeRun(raw) {
    if (!raw || typeof raw !== "object") return null;
    var run = newRun();
    if (raw.answers && typeof raw.answers === "object") {
      FLOORS.forEach(function (f) { var a = raw.answers[f.id]; if (typeof a === "string" && choiceById(f, a)) run.answers[f.id] = a; });
    }
    var i = parseInt(raw.idx, 10); run.idx = isFinite(i) ? Math.max(0, Math.min(FLOORS.length - 1, i)) : 0;
    run.done = raw.done === true && allAnswered(run);
    return run;
  }
  /* Never trusts stored points: scores are always recomputed from the data above. */
  function sanitizeSaved(raw) {
    var s = emptySaved();
    if (!raw || typeof raw !== "object") return s;
    FLOORS.forEach(function (f) {
      if (raw.banked && raw.banked[f.id] === POINTS) { s.banked[f.id] = POINTS; s.seen[f.id] = true; }
      if (raw.seen && raw.seen[f.id] === true) s.seen[f.id] = true;
    });
    var b = parseInt(raw.best, 10); if (isFinite(b) && b >= 0 && b <= maxScore()) s.best = Math.floor(b / POINTS) * POINTS;
    var r = parseInt(raw.runs, 10); if (isFinite(r) && r >= 0 && r < 100000) s.runs = r;
    s.run = sanitizeRun(raw.run);
    return s;
  }
  function loadSaved(storage) {
    try { var raw = storage && storage.getItem(STORAGE_KEY); return sanitizeSaved(raw ? JSON.parse(raw) : null); } catch (e) { return emptySaved(); }
  }
  function saveSaved(storage, saved) { try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(saved)); return true; } catch (e) { return false; } }

  /* Answer a floor in the current climb. The first answer on a floor is final for that climb. Permanent (banked) points
     are added at most once per floor, ever, so replaying can never raise the saved total above 800. */
  function answer(saved, run, floorIndex, choiceId) {
    var f = FLOORS[floorIndex];
    if (!f) return { ok: false, reason: "no-floor" };
    var c = choiceById(f, choiceId);
    if (!c) return { ok: false, reason: "no-choice" };
    if (run.answers[f.id]) return { ok: false, reason: "locked", choiceId: run.answers[f.id] };
    run.answers[f.id] = c.id;
    saved.seen[f.id] = true;
    var pts = pointsFor(f, c.id), banked = false;
    if (pts > 0 && saved.banked[f.id] !== POINTS) { saved.banked[f.id] = POINTS; banked = true; }
    return { ok: true, correct: pts > 0, points: pts, tier: c.tier, banked: banked, alreadyBanked: pts > 0 && !banked };
  }
  function finishRun(saved, run) {
    if (run.done || !allAnswered(run)) return { counted: false, score: runScore(run) };
    run.done = true; saved.runs += 1;
    var s = runScore(run); if (s > saved.best) saved.best = s;
    return { counted: true, score: s };
  }
  function startRun(saved) { saved.run = newRun(); return saved.run; }

  /* ---------- artwork ----------
     The owner-approved DeFi Tower illustration (assets/defi-tower/). The original is never regenerated or redrawn here:
     the intro shows the complete image (no crop), and the city map shows a crop of the same image around the skyscraper. */
  var ART = { hero: "assets/defi-tower/defi-tower-hero.jpg", map: "assets/defi-tower/defi-tower-map.jpg", thumb: "assets/defi-tower/defi-tower-thumb.jpg", w: 1672, h: 941, mapW: 350, mapH: 800 };
  var ART_ALT = "DeFi Tower at night: a glowing gold-and-glass skyscraper rising over a futuristic city, with five floating panels that introduce stablecoins, Ethereum, Bitcoin, governance tokens and other cryptocurrencies.";
  /* The five education panels in the illustration, repeated as real text so they stay readable on small screens and for screen readers. */
  var PANELS = [
    { title: "Stablecoins", examples: "USDC · USDT · DAI", text: "Digital dollars used for deposits, lending, borrowing and payments.", note: "They aim to hold a steady value but are generally not insured like bank deposits, and they can lose their peg." },
    { title: "Ethereum", examples: "ETH", text: "Used for transactions, collateral and paying network fees.", note: "Its price can swing widely, so collateral can be sold automatically if its value falls." },
    { title: "Bitcoin", examples: "BTC · WBTC", text: "Bitcoin can be used through tokenized versions such as Wrapped Bitcoin (WBTC).", note: "A wrapped version adds extra risks, such as depending on the company or code that issues it." },
    { title: "Governance tokens", examples: "UNI · AAVE", text: "Allow holders to participate in decisions about certain DeFi protocols.", note: "Holding one does not guarantee a return, and its price can fall." },
    { title: "Other cryptocurrencies", examples: "SOL · AVAX", text: "Used within decentralized financial ecosystems on their respective blockchains.", note: "Each blockchain and app carries its own technical and market risks." }
  ];
  /* Map building: a crop of the approved image in a gold frame, with a row of eight dots showing visited floors. */
  function sceneBuilding(litCount) {
    var w = 112, h = Math.round(w * ART.mapH / ART.mapW), x = -w / 2, y = -h - 12, dots = "";
    for (var i = 0; i < 8; i++) dots += "<circle cx='" + (-35 + i * 10) + "' cy='-4' r='3.2' fill='" + (i < (litCount || 0) ? "#7fe6ff" : "#2a2f66") + "' stroke='#e9b949' stroke-width='.8'/>";
    return "<defs><clipPath id='twClip'><rect x='" + x + "' y='" + y + "' width='" + w + "' height='" + h + "' rx='9'/></clipPath>" +
      "<linearGradient id='twFrame' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fbe7a0'/><stop offset='.5' stop-color='#e2b24a'/><stop offset='1' stop-color='#8f7bff'/></linearGradient></defs>" +
      "<ellipse cx='0' cy='2' rx='80' ry='12' fill='#8f7bff' opacity='.28'/>" +
      "<image href='" + ART.map + "' x='" + x + "' y='" + y + "' width='" + w + "' height='" + h + "' preserveAspectRatio='xMidYMid slice' clip-path='url(#twClip)'/>" +
      "<rect x='" + x + "' y='" + y + "' width='" + w + "' height='" + h + "' rx='9' fill='none' stroke='url(#twFrame)' stroke-width='3'/>" + dots;
  }

  /* ---------- screens ---------- */
  var ctx = null;
  var T = { saved: null, view: "intro", idx: 0, last: {} };

  function esc(s) { return (ctx && ctx.esc) ? ctx.esc(s) : String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function persist() { if (ctx) saveSaved(ctx.storage, T.saved); }
  function sfx(n) { try { if (ctx && ctx.sfx) ctx.sfx(n); } catch (e) {} }

  function header() {
    return "<div class='top'><div class='brand'><b>FinLit Quest</b><span>DeFi Tower · educational draft</span></div>" +
      "<div class='stats tw-stats' aria-label='Your tower progress'>" +
      "<span class='chip'>Floors visited <b>" + seenCount(T.saved) + " / " + FLOORS.length + "</b></span>" +
      "<span class='chip'>Tower points saved <b>" + bankedTotal(T.saved) + " / " + maxScore() + "</b></span></div></div>";
  }
  function draftBanner() { return "<p class='tw-draft' role='note'><b>Educational draft.</b> " + esc(DRAFT_NOTE.replace(/^Educational draft\.\s*/, "")) + "</p>"; }
  function footer(skipRisk) {
    return "<div class='foot'>" + (skipRisk ? "" : "<p>" + esc(RISK_NOTE) + "</p>") +
      "<p>Examples assume US-style rules where it matters. Insurance limits, tax rules and protocol behavior differ by place and change over time, so verify current details with official sources.</p>" +
      "<p>Tower points are knowledge points only. They are stored separately in this browser and never change the Financial City challenge scores, the prototype wallet, or the main FinLit Quest coins, XP or progress.</p></div>";
  }
  function progress() {
    var run = T.saved.run, items = "";
    FLOORS.forEach(function (f, i) {
      var a = run && run.answers[f.id], cls = "tw-step", state = "not answered yet";
      if (a) { var ok = pointsFor(f, a) > 0; cls += ok ? " good" : " learn"; state = ok ? "answered, earned points" : "answered, no points"; }
      if (T.view === "floor" && i === T.idx) cls += " now";
      items += "<li class='" + cls + "'" + (T.view === "floor" && i === T.idx ? " aria-current='step'" : "") + "><span class='tw-dot' aria-hidden='true'>" + f.n + "</span><span class='sr'>Floor " + f.n + ": " + esc(f.title) + ", " + state + "</span></li>";
    });
    return "<ol class='tw-prog' aria-label='Floor progress, floor " + (T.idx + 1) + " of " + FLOORS.length + "'>" + items + "</ol>";
  }

  function panelsHtml() {
    return "<section class='panel tw-panels' aria-labelledby='tw-panels-h'><h2 id='tw-panels-h'>The five panels in the picture</h2>" +
      "<p class='muted small'>The same lessons as the illustration, in plain text. These are examples of well-known assets, not recommendations, and none of them is a guaranteed return.</p>" +
      "<ul class='tw-panel-list'>" + PANELS.map(function (p) {
        return "<li><b>" + esc(p.title) + "</b> <span class='tag gold'>" + esc(p.examples) + "</span><p>" + esc(p.text) + "</p><p class='muted small'>" + esc(p.note) + "</p></li>";
      }).join("") + "</ul></section>";
  }
  function viewIntro() {
    var s = T.saved, run = s.run, started = run && answeredCount(run) > 0, complete = run && run.done;
    var cta;
    if (complete) cta = "<button class='btn primary' data-action='tresults'>See my results</button><button class='btn' data-action='treplay'>Climb again</button>";
    else if (started) cta = "<button class='btn primary' data-action='tcontinue'>Continue on floor " + (firstOpenIndex(run) + 1) + "</button><button class='btn' data-action='treplay'>Start over</button>";
    else cta = "<button class='btn primary' data-action='tstart'>Start climbing</button>";
    return header() +
      "<div class='row'><button class='btn ghost' data-action='home'>← City</button></div>" + draftBanner() +
      "<figure class='tw-banner'><img src='" + ART.hero + "' width='" + ART.w + "' height='" + ART.h + "' alt='" + ART_ALT + "' decoding='async'><figcaption class='small muted'>Illustration for the educational draft. Token names and logos shown are examples of well-known assets, not recommendations or endorsements.</figcaption></figure>" +
      "<section class='panel tw-hero'><div class='tw-hero-text'><span class='eyebrow'>Financial City · New destination</span>" +
      "<h1 tabindex='-1' id='focus'>The DeFi Tower</h1>" +
      "<p class='lede'>Eight floors. One real-life money decision on each. Climb the crystal tower, make the call, and find out why a choice fits or doesn’t. Decentralized finance (DeFi) can be useful to understand, but it comes with risks that are easy to miss.</p>" +
      "<div class='row'>" + cta + "</div>" +
      "<ul class='clean tw-facts' style='--c:var(--violet)'><li>Three choices per floor, with feedback the moment you choose.</li>" +
      "<li>100 knowledge points for each correct first answer, 800 at most.</li>" +
      "<li>Some floors have more than one defensible answer. A perfect score never requires using DeFi.</li>" +
      "<li>Replaying is practice. Saved tower points can be earned once per floor, so replays can’t inflate them.</li></ul>" +
      "<p class='small muted'>Your best climb: <b>" + (s.best ? s.best + " / " + maxScore() : "not finished yet") + "</b> · Saved tower points: <b>" + bankedTotal(s) + " / " + maxScore() + "</b></p></div>" +
      "</div></section>" + panelsHtml() +
      "<section class='panel tw-notice'><h3>Read this first</h3><p class='muted'>" + esc(RISK_NOTE) + "</p></section>" + footer(true);
  }

  function optionButton(f, c, i, run, answeredId) {
    var cls = "opt tw-opt", mark = "";
    if (answeredId) {
      if (c.id === answeredId) { cls += pointsFor(f, c.id) ? " best" : " picked-wrong"; mark = " <small class='tw-pick'>Your choice</small>"; }
      else if (c.tier === "best") cls += " tw-bestmark";
    }
    return "<button type='button' class='" + cls + "' data-action='tpick' data-id='" + c.id + "'" + (answeredId ? " disabled" : "") + " aria-keyshortcuts='" + (i + 1) + "'>" +
      "<span class='tw-letter' aria-hidden='true'>" + "ABC".charAt(i) + "</span><span class='tw-ctext'>" + esc(c.text) + mark + "</span><span class='k' aria-hidden='true'>" + (i + 1) + "</span></button>";
  }
  function feedback(f, run, answeredId) {
    var c = choiceById(f, answeredId), pts = pointsFor(f, answeredId), last = T.last[f.id], note = "";
    if (pts > 0) {
      if (last && last.banked) note = "These " + POINTS + " points are now saved to your tower total.";
      else if (last && last.alreadyBanked) note = "You already saved this floor’s " + POINTS + " points on an earlier climb. Replays are practice and don’t add to the saved total.";
      else if (T.saved.banked[f.id]) note = "This floor’s " + POINTS + " points are saved to your tower total (each floor counts once).";
    } else note = "No points this time. Read why below, then continue. Saved tower points can still be earned on a later climb.";
    var others = f.choices.filter(function (o) { return o.id !== answeredId; }).map(function (o) {
      return "<div><b>" + TIER_LABEL[o.tier] + ":</b> " + esc(o.text) + "<p class='muted small' style='margin-top:6px'>" + esc(o.fb) + "</p></div>";
    }).join("");
    return "<div class='tw-fb' role='region' aria-label='Feedback'><div class='verdict'><span class='pts " + (pts ? "good-t" : "learn-t") + "'>+" + pts + "</span>" +
      "<div><b id='tw-fb' tabindex='-1' class='" + (pts ? "good-t" : "learn-t") + "'>" + TIER_LABEL[c.tier] + "</b><div class='muted small'>" + esc(note) + "</div></div></div>" +
      "<p style='margin-top:12px;max-width:70ch'>" + esc(c.fb) + "</p>" +
      "<details style='margin-top:12px'><summary>How the other choices compare</summary><div class='others' style='margin-top:10px'>" + others + "</div></details>" +
      "<p class='box' style='margin-top:14px'><b>Takeaway.</b> " + esc(f.takeaway) + "</p></div>";
  }
  function viewFloor() {
    var run = T.saved.run, f = FLOORS[T.idx], answeredId = run.answers[f.id], last = T.idx === FLOORS.length - 1;
    var opts = f.choices.map(function (c, i) { return optionButton(f, c, i, run, answeredId); }).join("");
    var next = last
      ? "<button class='btn primary' data-action='tfinish'" + (allAnswered(run) ? "" : " disabled") + ">See my results</button>"
      : "<button class='btn primary' data-action='tnext'" + (answeredId ? "" : " disabled") + ">Next floor →</button>";
    return header() +
      "<div class='row'><button class='btn ghost' data-action='tintro'>← Tower</button><button class='btn ghost' data-action='home'>City</button></div>" + draftBanner() + progress() +
      "<article class='panel tw-floor-card'><div class='tw-floor-head'><span class='tw-badge' aria-hidden='true'>" + f.n + "</span><div><span class='eyebrow'>Floor " + f.n + " of " + FLOORS.length + " · " + esc(f.theme) + "</span>" +
      "<h1 tabindex='-1' id='focus' style='font-size:clamp(1.5rem,4.2vw,2.2rem)'>" + esc(f.title) + "</h1></div></div>" +
      "<p class='tw-setup'>" + esc(f.setup) + "</p>" +
      "<div class='tw-assume'><b>Fictional example · educational assumptions</b><ul>" + f.assumptions.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul></div>" +
      "<h2 class='tw-q'>" + esc(f.question) + "</h2><div class='opts tw-opts' role='group' aria-label='Choose one answer. Keys 1 to 3 also work.'>" + opts + "</div>" +
      (answeredId ? feedback(f, run, answeredId) : "<p class='muted small' style='margin-top:12px'>Pick one answer to see feedback right away. Tip: keys 1, 2 and 3 work too.</p>") +
      "<div class='row tw-nav'><button class='btn' data-action='tprev'" + (T.idx === 0 ? " disabled" : "") + ">← Previous floor</button>" + next + "</div>" +
      "</article>" + footer();
  }
  function viewResults() {
    var s = T.saved, run = s.run, score = runScore(run), rows = FLOORS.map(function (f) {
      var a = run.answers[f.id], c = a && choiceById(f, a), pts = a ? pointsFor(f, a) : 0;
      return "<li><span>Floor " + f.n + " · " + esc(f.title) + "</span><b class='" + (pts ? "good-t" : "learn-t") + "'>" + (c ? TIER_LABEL[c.tier] : "Not answered") + " · +" + pts + "</b></li>";
    }).join("");
    return header() + "<div class='row'><button class='btn ghost' data-action='tintro'>← Tower</button><button class='btn ghost' data-action='home'>City</button></div>" + draftBanner() +
      "<section class='panel celebrate tw-result'><span class='eyebrow'>Climb complete</span><h1 tabindex='-1' id='focus'>You reached the top</h1>" +
      "<div class='score' aria-label='Score this climb: " + score + " out of " + maxScore() + "'>" + score + "<span class='muted' style='font-size:.4em'> / " + maxScore() + "</span></div>" +
      "<p class='muted'>Knowledge points this climb" + (score === s.best && s.runs > 1 ? " · your best so far" : "") + "</p>" +
      "<p style='margin-top:10px'>Saved tower points: <b>" + bankedTotal(s) + " / " + maxScore() + "</b>. Each floor can add its " + POINTS + " points to the saved total only once, so replaying is for practice and learning.</p>" +
      (score === maxScore() ? "<p class='box' style='margin-top:12px'><b>A perfect score never needs DeFi.</b> Every floor has a best-fit answer that avoids it, and a few floors also accept a small, carefully limited DeFi step.</p>" : "") +
      "<div class='row' style='margin-top:16px'><button class='btn primary' data-action='treplay'>Climb again</button><button class='btn' data-action='treview'>Review the floors</button><button class='btn ghost' data-action='home'>Back to the city</button></div></section>" +
      "<section class='panel'><h2>Floor by floor</h2><ul class='tw-review'>" + rows + "</ul></section>" + footer();
  }
  function view() {
    if (!T.saved) return "";
    if (T.view === "floor" && T.saved.run) return viewFloor();
    if (T.view === "results" && T.saved.run && T.saved.run.done) return viewResults();
    return viewIntro();
  }

  /* ---------- actions (called by Financial City's click dispatcher) ---------- */
  function rerender(focus) { if (ctx && ctx.rerender) ctx.rerender(focus); }
  function focusFeedback() {
    if (typeof document === "undefined") return;
    var el = document.getElementById("tw-fb"); if (el) { try { el.focus(); } catch (e) {} }
  }
  function top() { if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0); }
  function showFloor(i) { T.idx = Math.max(0, Math.min(FLOORS.length - 1, i)); T.saved.run.idx = T.idx; T.view = "floor"; persist(); rerender(); top(); }
  var actions = {
    tintro: function () { T.view = "intro"; rerender(); top(); },
    tstart: function () { startRun(T.saved); T.last = {}; showFloor(0); },
    treplay: function () { startRun(T.saved); T.last = {}; showFloor(0); },
    tcontinue: function () { if (!T.saved.run) startRun(T.saved); showFloor(firstOpenIndex(T.saved.run)); },
    tpick: function (el) {
      if (T.view !== "floor" || !T.saved.run) return;
      var res = answer(T.saved, T.saved.run, T.idx, el.dataset.id);
      if (!res.ok) return;
      T.last[FLOORS[T.idx].id] = res; persist(); sfx("confirm");
      setTimeout(function () { sfx(res.correct ? "correct" : "learn"); }, 450);
      rerender(false); focusFeedback();
    },
    tnext: function () { var run = T.saved.run; if (!run.answers[FLOORS[T.idx].id]) return; if (T.idx < FLOORS.length - 1) showFloor(T.idx + 1); },
    tprev: function () { if (T.idx > 0) showFloor(T.idx - 1); },
    tfinish: function () {
      var run = T.saved.run; if (!allAnswered(run)) return;
      finishRun(T.saved, run); persist(); T.view = "results"; sfx("correct"); rerender(); top();
    },
    tresults: function () { var run = T.saved.run; if (run && run.done) { T.view = "results"; rerender(); top(); } },
    treview: function () { showFloor(0); }
  };
  /* Keyboard: 1-3 choose an answer, Left/Right arrows move between floors. Returns true when the key was used. */
  function onKey(e) {
    if (!T.saved || T.view !== "floor" || e.metaKey || e.ctrlKey || e.altKey) return false;
    var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || "")) return false;
    var run = T.saved.run, f = FLOORS[T.idx];
    if (/^[1-3]$/.test(e.key)) { if (run.answers[f.id]) return false; var c = f.choices[+e.key - 1]; if (!c) return false; actions.tpick({ dataset: { id: c.id } }); return true; }
    if (e.key === "ArrowRight") { if (!run.answers[f.id]) return false; if (T.idx < FLOORS.length - 1) { actions.tnext(); return true; } return false; }
    if (e.key === "ArrowLeft") { if (T.idx > 0) { actions.tprev(); return true; } return false; }
    return false;
  }

  function mount(c) {
    ctx = c; T.saved = loadSaved(c.storage); T.view = "intro"; T.idx = T.saved.run ? Math.min(T.saved.run.idx, FLOORS.length - 1) : 0; T.last = {};
    return api;
  }
  function enter() { T.view = "intro"; }
  function litCount() { return T.saved ? seenCount(T.saved) : 0; }
  function state() { return T; }
  function unmountForTest() { ctx = null; T = { saved: null, view: "intro", idx: 0, last: {} }; }

  var api = {
    STORAGE_KEY: STORAGE_KEY, POINTS: POINTS, FLOORS: FLOORS, DRAFT_NOTE: DRAFT_NOTE, RISK_NOTE: RISK_NOTE, TIER_LABEL: TIER_LABEL,
    emptySaved: emptySaved, newRun: newRun, sanitizeSaved: sanitizeSaved, loadSaved: loadSaved, saveSaved: saveSaved,
    answer: answer, finishRun: finishRun, startRun: startRun, runScore: runScore, bankedTotal: bankedTotal, seenCount: seenCount,
    answeredCount: answeredCount, allAnswered: allAnswered, maxScore: maxScore, pointsFor: pointsFor, firstOpenIndex: firstOpenIndex,
    sceneBuilding: sceneBuilding, ART: ART, PANELS: PANELS, litCount: litCount,
    mount: mount, enter: enter, view: view, actions: actions, onKey: onKey, state: state, unmountForTest: unmountForTest
  };
  return api;
});
