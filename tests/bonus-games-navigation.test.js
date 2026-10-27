"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.join(__dirname,"..");const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const html=read("index.html"),city=read("financial-city.html"),css=read("journey.css"),wg=read("word-game-app.js");
const hub=html.slice(html.indexOf('id="bonusGamesHub"'),html.indexOf('id="journeyWorldMap"'));
test("Bonus Games hub keeps Currency Rush and has separate Financial City and DeFi Tower cards",()=>{
  assert.match(hub,/id="journeyCurrencyRush"/);
  assert.match(hub,/id="journeyFinancialCityLink"[^>]*href="financial-city\.html"/);
  assert.match(hub,/id="journeyDefiTowerLink"[^>]*href="financial-city\.html\?open=tower"/);
  assert.match(hub,/FINANCIAL CITY[^<]*<\/small><strong>Where Should My Money Go\?<\/strong>/);assert.match(hub,/<strong>DeFi Tower<\/strong>/);
  assert.equal((hub.match(/class="bonus-game-card /g)||[]).length,4,"currency, city, tower, coming-soon");
});
test("DeFi Tower card uses the same card structure and does not claim guaranteed returns",()=>{
  const card=hub.slice(hub.indexOf('id="journeyDefiTowerLink"'),hub.indexOf("</a>",hub.indexOf('id="journeyDefiTowerLink"')));
  assert.match(card,/bonus-game-art/);assert.match(card,/bonus-game-copy/);assert.match(card,/EDUCATIONAL DRAFT/);
  assert.match(card,/not insured like a bank deposit/);
  assert.match(css,/\.bonus-game-card\.tower\{/);
});
test("Financial City deep-links into the existing DeFi Tower and returns to Bonus Games",()=>{
  assert.match(city,/get\("open"\) === "tower"[\s\S]{0,80}actions\.tower\(\)/);
  assert.match(city,/href="index\.html#bonus-games"[^>]*>&larr; Back to Bonus Games/);
  assert.equal((city.match(/<script src="defi-tower\.js">/g)||[]).length,1,"one DeFi Tower implementation");
  assert.match(wg,/location\.hash === "#bonus-games"\) renderWorldJourneyMap\("games"\)/);
});
