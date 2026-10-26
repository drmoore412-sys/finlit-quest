const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");

const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const worldMapStart=html.indexOf('id="journeyWorldMap"');
const worldMapEnd=html.indexOf('<section class="wg-screen"',worldMapStart);
const worldMapSection=html.slice(worldMapStart,worldMapEnd);

test("Choose Your World presents all 13 owner-approved worlds in order",()=>{
  const ids=[...worldMapSection.matchAll(/id="(select[A-Za-z]+World)"/g)].map(match=>match[1]);
  assert.deepEqual(ids,[
    "selectMoneyBasicsWorld",
    "selectCreditWorld",
    "selectCryptoWorld",
    "selectBankingBasicsWorld",
    "selectInvestingBasicsWorld",
    "selectCoinsWorld",
    "selectAiTechnologyWorld",
    "selectRealEstateWorld",
    "selectTaxesWorld",
    "selectInsuranceWorld",
    "selectBusinessWorld",
    "selectSocialMediaWorld",
    "selectRetirementWorld",
  ]);
});

test("the eight new world cards are playable and no longer marked Coming Soon",()=>{
  const newWorldIds=["coins","ai_technology","real_estate","taxes","insurance","business","social_media","retirement"];
  for(const worldId of newWorldIds){
    const node=worldMapSection.match(new RegExp(`<button[^>]+data-world="${worldId}"[\\s\\S]*?<\\/button>`));
    assert.ok(node,worldId);
    assert.doesNotMatch(node[0],/coming-soon/);
    assert.doesNotMatch(node[0],/Coming soon/i);
    assert.doesNotMatch(node[0],/PUZZLE BANK IN REVIEW/);
  }
});

test("runtime world definitions expose all 13 worlds as playable",()=>{
  const registry=require(path.join(ROOT,"content/world-definitions-2027.js"));
  assert.equal(registry.worlds.length,13);
  assert.equal(registry.worlds.filter(world=>world.currentRuntimeStatus==="playable").length,13);
  assert.equal(registry.worlds.filter(world=>world.currentRuntimeStatus!=="playable").length,0);
});

test("selection routing opens every playable world in the shared game engine",()=>{
  const app=fs.readFileSync(path.join(ROOT,"app.js"),"utf8");
  assert.match(app,/if\(!isPlayable\)/);
  assert.match(app,/node\.onclick=\(\)=>toast/);
  assert.match(app,/else\{[\s\S]*node\.onclick=\(\)=>wgOpenWorld\(worldId\)/);
  assert.equal((require(path.join(ROOT,"content/world-definitions-2027.js")).worlds.filter(world=>world.currentRuntimeStatus==="playable").length),13);
});

test("all governed runtime files load before the shared word-game engine",()=>{
  const moneyTerms=html.indexOf('src="content/money-basics-terms.js');
  const moneyBank=html.indexOf('src="content/money-basics-puzzle-bank.js');
  const bankingTerms=html.indexOf('src="content/banking-basics-terms.js');
  const bankingBank=html.indexOf('src="content/banking-basics-puzzle-bank.js');
  const investingTerms=html.indexOf('src="content/investing-basics-terms.js');
  const investingBank=html.indexOf('src="content/investing-basics-puzzle-bank.js');
  const newTerms=html.indexOf('src="content/2027-new-world-terms.js');
  const newBanks=html.indexOf('src="content/2027-new-world-puzzle-banks.js');
  const engine=html.indexOf('src="word-game-app.js');
  [moneyTerms,moneyBank,bankingTerms,bankingBank,investingTerms,investingBank,newTerms,newBanks,engine].forEach(position=>assert.ok(position>=0));
  assert.ok(moneyTerms<engine);
  assert.ok(moneyBank<engine);
  assert.ok(bankingTerms<engine);
  assert.ok(bankingBank<engine);
  assert.ok(investingTerms<engine);
  assert.ok(investingBank<engine);
  assert.ok(newTerms<engine);
  assert.ok(newBanks<engine);
});

test("the World Quest Journey uses the owner-approved local Golden Castle PNG across the complete route",()=>{
  const css=fs.readFileSync(path.join(ROOT,"journey.css"),"utf8");
  const asset=path.join(ROOT,"assets/images/golden-castle-journey.png");
  assert.ok(fs.existsSync(asset));
  assert.ok(fs.statSync(asset).size>2_000_000,"the approved full-resolution PNG must not be replaced by a lightweight placeholder");
  assert.match(css,/#worldSelectScreen \.journey-map[^{]*\{[^}]*url\("assets\/images\/golden-castle-journey\.png"\)/);
  assert.match(css,/#worldSelectScreen \.journey-map[^}]*background-size:100% 100%/,"the approved composition reaches the bottom of the complete route as one continuous background");
  assert.match(css,/#worldSelectScreen \.journey-node[^}]*backdrop-filter/,"world controls remain readable over the artwork");
});
