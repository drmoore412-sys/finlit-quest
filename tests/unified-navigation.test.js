const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const app=read("word-game-app.js"),index=read("index.html"),build=read("scripts/build-www.sh"),appJs=read("app.js");
function flag(env){
  const src=app.match(/function fqUnifiedDevEnabled\(\) \{[\s\S]*?\n\}\n/)[0];
  const store=Object.assign({},env.session||{});
  const ctx={location:{hostname:env.host,protocol:env.protocol||"http:",search:env.search||""},window:env.capacitor?{Capacitor:{}}:{},URLSearchParams,sessionStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}}};
  vm.runInNewContext(src+";this.r=fqUnifiedDevEnabled;",ctx);return {on:()=>ctx.r(),store};
}
test("feature flag is off by default and on production hosts, even with the query set",()=>{
  assert.equal(flag({host:"finlitquest.com"}).on(),false);
  assert.equal(flag({host:"finlitquest.com",search:"?unifiedLevels=dev"}).on(),false);
  assert.equal(flag({host:"drmoore412-sys.github.io",search:"?unifiedLevels=dev"}).on(),false);
  assert.equal(flag({host:"localhost"}).on(),false,"local host without the flag stays off");
});
test("feature flag turns on only for an explicit local development request and never in the native app",()=>{
  ["localhost","127.0.0.1","app.localhost"].forEach(host=>assert.equal(flag({host,search:"?unifiedLevels=dev"}).on(),true,host));
  assert.equal(flag({host:"localhost",search:"?unifiedLevels=dev",capacitor:true}).on(),false,"Capacitor serves from localhost");
  assert.equal(flag({host:"localhost",search:"?unifiedLevels=dev",protocol:"capacitor:"}).on(),false);
  const remembered=flag({host:"localhost",search:"?unifiedLevels=dev"});remembered.on();assert.equal(remembered.store["finlit.dev.unifiedLevels"],"1");
  assert.equal(flag({host:"localhost",session:{"finlit.dev.unifiedLevels":"1"}}).on(),true,"session memory");
  assert.equal(flag({host:"localhost",search:"?unifiedLevels=off",session:{"finlit.dev.unifiedLevels":"1"}}).on(),false);
  assert.equal(/premium|purchase|entitle|subscription/i.test(app.match(/function fqUnifiedDevEnabled[\s\S]*?\n\}\n/)[0]),false,"flag is independent of Premium");
});
test("development-only unified files are not referenced by index.html or shipped; the production level modules are",()=>{
  ["unified-sequence-dev","unified-sequence-v2-gated","unified-prototype-12","unified-filler-whitelist"].forEach(name=>{assert.equal(index.includes(name),false,name+" in index.html");assert.equal(build.includes(name),false,name+" in build-www.sh")});
  ["src/unified-progress.js","src/unified-sequence.js","src/composition-rules.js","src/sha256.js","src/unified-release.js","src/unified-prototype-loader.js","src/unified-levels-ui.js","content/unified-levels-v2.js"].forEach(name=>{assert.ok(index.includes(name),name+" missing from index.html");assert.ok(build.includes(name),name+" missing from build-www.sh");assert.ok(fs.readFileSync(path.join(ROOT,name)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",name))),name+" differs in the iOS bundle")});
});
test("every hook into the existing game is inert when the unified UI is not loaded",()=>{
  const hooks=app.match(/FinLitUnifiedUI[^\n]*/g)||[];assert.ok(hooks.length>=6);
  hooks.filter(l=>!/^FinLitUnifiedUI\.(mount|renderMap|decorateHeader|canLaunch)/.test(l)||true).forEach(line=>assert.ok(!/(^|[^?.\w])FinLitUnifiedUI\.(afterCompletion|restore)/.test(line)||/\?\./.test(line)||/window\.FinLitUnifiedUI/.test(line),line));
  assert.match(app,/wgState\.unified && window\.FinLitUnifiedUI/);
  assert.match(app,/if \(wgState\.unified\) return "crossword"/);
});
test("existing navigation, Continuing Education and Learning Quest entry points are untouched",()=>{
  ["welcomeStartButton","welcomeExploreWorlds","welcomePlayChallenges","welcomeLearningAcademy","welcomeMyProgress","worldSelectScreen","wgLevelSelect","wgLevelList"].forEach(id=>assert.ok(index.includes(`id="${id}"`),id));
  assert.match(appJs,/welcomeLearningAcademy"\)\.onclick=\(\)=>leaveWelcome\(\(\)=>\{showWorldSelect\(\);renderWorldJourneyMap\("learning"\)\}\)/);
  assert.equal((index.match(/data-world="/g)||[]).length>=13,true,"world selection nodes remain in the DOM for category navigation");
  assert.ok(/Learning Quests/.test(index));
  assert.equal(app.includes("wgRenderLevelSelect"),true,"classic level select remains for non-unified mode");
});
test("bonus games are isolated from the unified level path",()=>{
  ["currency-rush","financial-city","defi-tower","wheretomoney","openCurrencyRush"].forEach(key=>{
    ["src/unified-progress.js","src/unified-sequence.js","src/unified-levels-ui.js","content/unified-sequence-dev.json"].forEach(f=>assert.equal(read(f).toLowerCase().includes(key.toLowerCase()),false,`${f} mentions ${key}`));
  });
  const devBlock=app.slice(app.indexOf("// ---- Development-only unified levels"),app.indexOf("// Initial screen: a brand-new player"));
  assert.equal(/currency|rush|city|defi|bonus/i.test(devBlock),false,"dev bridge touches no bonus-game code");
  const manifest=JSON.parse(read("content/unified-sequence-dev.json"));
  assert.equal(manifest.entries.every(e=>e.puzzleId.startsWith("FQ-V3:")),true);
});
test("player-facing level-map text contains no internal terminology",()=>{
  const ui=require("../src/unified-levels-ui.js");
  const strings=[...Object.values(ui.INTRO),...Object.values(ui.LABELS),"Play","Continue your journey","Levels"].join(" ");
  assert.equal(/legacy|draft|development|sequence version|migration|compatib|candidate|internal/i.test(strings),false);
  const src=read("src/unified-levels-ui.js");
  const templates=(src.match(/`[^`]*`/g)||[]).join(" ");
  assert.equal(/legacy|draft|sequence version|migration|compatib|candidate/i.test(templates),false);
});

test("unified mode navigation: Exit/logo return to the level map from a puzzle, production behavior is otherwise untouched",()=>{
  assert.match(app,/function wgHome\(\) \{\s*if \(wgState\.unified && !\$\("#wgPuzzleExperience"\)\.classList\.contains\("hidden"\)\) return wgShowLevelSelect\(\);\s*wgReturnToWorldSelect\(\);\s*\}/);
  assert.match(app,/\$\("#wgBrandLogo"\)\.onclick = wgHome;/);assert.match(app,/\$\("#wgNavPause"\)\.onclick = wgHome;/);
  assert.match(app,/function wgReturnToWorldSelect\(\) \{\s*showWorldSelect\(\);\s*\}/,"classic return is byte-for-byte the original");
  assert.match(app,/function wgBackFromWorldGame\(\) \{\s*if \(!\$\("#wgPuzzleExperience"\)\.classList\.contains\("hidden"\)\) \{\s*wgShowLevelSelect\(\);\s*\} else \{\s*wgReturnToWorldSelect\(\);\s*\}\s*\}/);
  assert.match(app,/function wgOpenWorld\(worldId\) \{\s*\$\("#app"\)\.classList\.remove\("journey-mode"\);\s*wgState\.unified = false;/,"opening a world leaves unified mode");
});
test("reward record hook: identity without the dev UI, lineage union with it",()=>{
  assert.match(app,/function wgRewardRecord\(record\) \{\s*return window\.FinLitUnifiedUI\?\.rewardRecord \? FinLitUnifiedUI\.rewardRecord\(record, wgState\.puzzle && wgState\.puzzle\.id\) : record;\s*\}/);
  assert.equal((app.match(/wgRewardRecord\(/g)||[]).length,3,"definition plus the two reward call sites");
  assert.equal(/canonicalAnswerReward\([^)]*,\s*(canonical|wgCanonicalRecord\(\))\)/.test(app),false,"no reward call bypasses the hook");
  const ui=require("../src/unified-levels-ui.js"),P=require("../src/unified-progress.js");
  const manifest={sequenceId:"main-levels",sequenceVersion:2,devOnly:true,entries:[{position:1,puzzleId:"NEW",replaces:["OLD"],compatibility:"fresh",compositionRuleVersion:"v1",releaseStatus:"development",validation:{}}],retired:[{puzzleId:"OLD",replaces:[]}]};
  const save={saveVersion:5,canonicalPuzzleProgress:{OLD:{timesCompleted:1,rewardedAnswers:["ANCHOR"]}}};
  ui.mount({document:{getElementById:()=>null,querySelector:()=>null,documentElement:{dataset:{}}},progress:P,manifest,bridge:{save:()=>save,persist(){},now:()=>"2026-11-13T00:00:00.000Z"}});
  assert.deepEqual(ui.rewardRecord({},"NEW").rewardedAnswers,["ANCHOR"]);
  assert.equal(ui.rewardRecord("same",null),"same");
  assert.deepEqual(save.canonicalPuzzleProgress.OLD,{timesCompleted:1,rewardedAnswers:["ANCHOR"]},"historical record untouched");
});
