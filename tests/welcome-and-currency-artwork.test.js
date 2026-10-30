// Welcome page + Currency Wheel artwork. Static checks that pin the approved welcome content, that every welcome
// option goes only to an EXISTING destination, that the artwork is installed behind (not instead of) the live game,
// that the assets ship in the iOS bundle, and that production stays separate from /flq-test/.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");

const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const html=read("index.html"),app=read("app.js"),wgCss=read("word-game.css"),crCss=read("currency-rush.css");
const welcome=html.slice(html.indexOf('id="welcomeScreen"'),html.indexOf("</section>",html.indexOf('id="welcomeScreen"')));

test("the welcome screen shows the approved logo, title, tagline, main button and the four options",()=>{
  assert.match(welcome,/<img src="assets\/brand\/web\/wg-logo-96\.png[^"]*" alt="FinLit Quest">/);
  assert.match(welcome,/<h1 id="welcomeTitle">FINLIT QUEST<\/h1>/);
  assert.match(welcome,/Your Money\. Your Choices\. Your Adventure\./);
  assert.match(welcome,/<button class="welcome-cta" id="welcomeStartButton" type="button">Enter the Quest<\/button>/);
  [["welcomeExploreWorlds","Explore Worlds","Discover financial destinations"],["welcomePlayChallenges","Play Challenges","Solve currency puzzles and earn knowledge points."],["welcomeLearningAcademy","Learning Academy","Build real-world money skills"],["welcomeMyProgress","My Progress","Achievements and rewards"]].forEach(([id,title,subtitle])=>{
    assert.match(welcome,new RegExp(`id="${id}" type="button">[\\s\\S]*?<b>${title}</b><em>${subtitle}</em>`),id);
  });
  assert.equal((welcome.match(/class="welcome-option"/g)||[]).length,4);
});

test("the old Play / Learn / Grow presentation is gone",()=>{
  assert.ok(!/welcome-path|welcome-step|<b>PLAY<\/b>|<b>LEARN<\/b>|<b>GROW<\/b>|Your Financial Journey Starts Here|Begin Your Quest/.test(html));
  assert.ok(!/\.welcome-path|\.welcome-step/.test(wgCss),"the old styles were removed too");
});

test("a music-control location is reserved but no placeholder control or feature was added",()=>{
  assert.match(welcome,/<div class="welcome-utility" id="welcomeUtilitySlot" data-reserved="music" aria-hidden="true"><\/div>/);
  assert.ok(!/music/i.test(welcome.replace(/data-reserved="music"/,"")),"no music button or label on the welcome screen");
});

test("the privacy and terms links required for submission are kept",()=>{
  assert.match(welcome,/href="privacy\.html"/);assert.match(welcome,/href="terms\.html"/);
});

test("every welcome button goes only to an existing destination and marks the player as onboarded",()=>{
  assert.match(app,/function leaveWelcome\(destination\)\{localStorage\.setItem\("finlitQuest\.onboarded","true"\);destination\(\)\}/);
  assert.match(app,/\$\("#welcomeStartButton"\)\.onclick=\(\)=>leaveWelcome\(showWorldSelect\)/);
  assert.match(app,/\$\("#welcomeExploreWorlds"\)\.onclick=\(\)=>leaveWelcome\(showWorldSelect\)/);
  assert.match(app,/\$\("#welcomePlayChallenges"\)\.onclick=\(\)=>leaveWelcome\(\(\)=>\{showWorldSelect\(\);window\.openCurrencyRush\?\.\(\{source:"bonus-games",stage:1\}\)\}\)/,"Currency Wheel, the same call the Bonus Games hub already makes");
  assert.match(app,/\$\("#welcomeLearningAcademy"\)\.onclick=\(\)=>leaveWelcome\(\(\)=>\{showWorldSelect\(\);renderWorldJourneyMap\("learning"\)\}\)/);
  assert.match(app,/\$\("#welcomeMyProgress"\)\.onclick=\(\)=>leaveWelcome\(showDashboard\)/);
  ["function showWorldSelect","function renderWorldJourneyMap","function showDashboard"].forEach(fn=>assert.ok(app.includes(fn),`${fn} already exists`));
  assert.match(read("src/currency-rush.js"),/win\.openCurrencyRush=/,"the Currency Wheel entry point already exists");
  assert.match(app,/\$\("#journeyCurrencyRush"\)\.onclick=\(\)=>window\.openCurrencyRush\?\.\(\{source:"bonus-games",stage:1\}\)/,"identical to the existing Bonus Games entry");
});

test("a first-launch player still sees the welcome screen and a returning player skips it",()=>{
  assert.match(read("word-game-app.js"),/if \(!localStorage\.getItem\("finlitQuest\.onboarded"\)\) \{\s*showWelcome\(\);/);
});

test("the welcome screen is a full-viewport, always-dark layer with its own skyline and a mobile-first grid",()=>{
  assert.match(wgCss,/\.welcome-screen\{position:fixed;inset:0;/);
  assert.match(wgCss,/\.welcome-sky\{[^}]*url\(assets\/welcome\/defi-city-night\.webp\)/);
  assert.match(wgCss,/\.welcome-options\{[^}]*grid-template-columns:1fr 1fr/);
  assert.match(wgCss,/@media\(min-width:760px\)\{\.welcome-card\{max-width:640px\}\.welcome-options\{grid-template-columns:repeat\(4,1fr\)/);
  assert.match(wgCss,/\.welcome-cta:focus-visible,\.welcome-option:focus-visible\{outline:/,"keyboard focus is visible");
  assert.match(wgCss,/\.welcome-option\{[^}]*min-height:132px/,"large touch targets");
});

test("the command-center image is installed unchanged behind the Currency Wheel and the live wheel is untouched",()=>{
  const webp=fs.readFileSync(path.join(ROOT,"assets/currency/command-center.webp"));
  assert.equal(webp.subarray(0,4).toString(),"RIFF");assert.equal(webp.subarray(8,12).toString(),"WEBP");
  assert.ok(webp.length<250*1024,`optimized (${Math.round(webp.length/1024)} KB)`);
  assert.match(crCss,/\.currency-rush-screen\{[^}]*url\(assets\/currency\/command-center\.webp\) center top\/cover no-repeat/,"landscape: covers the screen");
  assert.match(crCss,/@media\(max-aspect-ratio:1\/1\)\{\.currency-rush-screen\{[^}]*center top\/100% auto no-repeat/,"portrait: whole image, aspect preserved, so the codes stay visible");
  ["crWheel","crTime","crScore","crFoundCount","crReferencePanel","crClear","crExit","crMusicToggle"].forEach(id=>assert.ok(html.includes(`id="${id}"`),`${id} is still in the live game`));
  assert.ok(!/<img[^>]*command-center/.test(html),"the image is a CSS background, not a static replacement for the wheel");
});

test("no currency-code labels are drawn on top of the artwork",()=>{
  const added=crCss.slice(crCss.indexOf("/* Command-center artwork"));
  assert.ok(!/content:\s*["'][A-Z]{3}["']/.test(added));
  assert.ok(!/\b(USD|EUR|GBP|JPY|CHF|CAD|AUD|CNY|INR|KRW)\b/.test(added.replace(/\/\*[\s\S]*?\*\//g,"")),"the CSS adds no code text");
});

test("the existing decorative globe is kept in portrait and only hidden where it would clash with the map",()=>{
  assert.match(crCss,/@media\(min-aspect-ratio:1\/1\)\{\.currency-rush-screen \.cr-stars,\.currency-rush-screen \.cr-globe\{display:none\}\}/);
});

test("both assets ship in the web bundle and the iOS bundle byte for byte, and the build script copies them",()=>{
  assert.match(read("scripts/build-www.sh"),/assets\/welcome\/defi-city-night\.webp assets\/currency\/command-center\.webp/);
  ["assets/welcome/defi-city-night.webp","assets/currency/command-center.webp"].forEach(file=>{
    assert.ok(fs.readFileSync(path.join(ROOT,file)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",file))),`${file} matches the iOS bundle`);
  });
  assert.ok(fs.statSync(path.join(ROOT,"assets/welcome/defi-city-night.webp")).size<500*1024,"the night-city background is optimized");
});

test("production stays separate from /flq-test/: no test-only wiring in the production files",()=>{
  [html,app,wgCss,crCss].forEach(source=>assert.ok(!/flq-test/.test(source)));
  const testIndex=read("flq-test/index.html");
  assert.ok(!/welcomeExploreWorlds|welcomePlayChallenges/.test(testIndex),"the /flq-test/ build was not touched by this change");
});

test("the Currency Wheel fits the narrowest phone: the wheel is sized to the space inside the card padding, not to the raw viewport",()=>{
  assert.match(crCss,/\.cr-wheel-shell\{margin-top:150px;width:min\(350px,calc\(100vw - 48px\)\)\}/);
  assert.ok(!/width:min\(350px,94vw\)/.test(crCss));
});

test("on narrow phones the layout column and stat tiles may shrink, so nothing scrolls sideways at 320 px",()=>{
  assert.match(crCss,/@media\(max-width:520px\)\{\.cr-layout,\.currency-rush-screen\.is-memory-round \.cr-layout\{grid-template-columns:minmax\(0,1fr\)\}\.cr-stats\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
});
