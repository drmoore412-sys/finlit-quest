const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");

const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");

test("Choose Your World presents the four approved cards in release order",()=>{
  const section=html.split('id="worldSelectScreen"')[1].split("</section>")[0];
  const ids=[...section.matchAll(/id="(select[A-Za-z]+World)"/g)].map(match=>match[1]);
  assert.deepEqual(ids,[
    "selectMoneyBasicsWorld",
    "selectCreditWorld",
    "selectCryptoWorld",
    "selectBankingBasicsWorld",
  ]);
});

test("Money Basics and Banking Basics runtime files load before the shared word-game engine",()=>{
  const moneyTerms=html.indexOf('src="content/money-basics-terms.js');
  const moneyBank=html.indexOf('src="content/money-basics-puzzle-bank.js');
  const bankingTerms=html.indexOf('src="content/banking-basics-terms.js');
  const bankingBank=html.indexOf('src="content/banking-basics-puzzle-bank.js');
  const engine=html.indexOf('src="word-game-app.js');
  [moneyTerms,moneyBank,bankingTerms,bankingBank,engine].forEach(position=>assert.ok(position>=0));
  assert.ok(moneyTerms<engine);
  assert.ok(moneyBank<engine);
  assert.ok(bankingTerms<engine);
  assert.ok(bankingBank<engine);
});
