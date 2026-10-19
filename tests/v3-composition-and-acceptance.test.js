// V3 crossword composition rules and answer acceptance.
// The slate's 27 combinations are pinned by schema-v3.test.js; this file adds the
// executable form of the approved composition requirements and proves every
// required answer can actually be entered with taps alone.
const test=require("node:test");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {ROOT}=require("./helpers.js");
const slate=require("../src/v3-puzzle-slate.js"),game=require("../src/game-engine.js"),bank=require("../src/puzzle-bank-engine.js"),wheel=require("../src/wheel-interaction.js");

function loadWindow(file,key){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}
const VOCAB={
  credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS"),
  moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),
  banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),
  investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS"),
  crypto:loadWindow("content/crypto-terms.js","DEFI_TERMS"),
};
const PUZZLES=slate.createSlate(VOCAB,game);
const C=slate.CATEGORY;

// Synthetic puzzle builder for the rule table (no governed content is involved).
function synthetic({anchor,secondary=[],ordinary=[],bonus=[],wheel=null}){
  const answers=[{word:anchor,category:C.ANCHOR},...secondary.map(word=>({word,category:C.SECONDARY})),...ordinary.map(word=>({word,category:C.ORDINARY})),...bonus.map(word=>({word,category:C.BONUS}))];
  return {anchorWord:anchor,wheelLetters:wheel||[...anchor],answers};
}

test("financial-majority minimums: 3 words need 2, 4 words need 3, 5 words need 3",()=>{
  assert.deepEqual({...slate.FINANCIAL_MINIMUM_BY_REQUIRED_WORDS},{3:2,4:3,5:3});
  const wheelWord="ACCOUNTERS";
  const make=(fin,ord)=>synthetic({anchor:wheelWord,secondary:["COUNT","TONE","ACE","SEA","CAT"].slice(0,fin-1),ordinary:["ONE","TEN","RAT","ARC","CORE"].slice(0,ord)});
  const cases=[[2,1,true],[1,2,false],[3,1,true],[2,2,false],[3,2,true],[2,3,false],[4,1,true],[5,0,true]];
  cases.forEach(([fin,ord,expected])=>{
    const verdict=slate.validateComposition(make(fin,ord));
    assert.equal(verdict.valid,expected,`${fin} financial + ${ord} ordinary (${fin+ord} required): ${verdict.errors.join("; ")}`);
    assert.equal(verdict.counts.required,fin+ord);
  });
});

test("single-word, two-word, and six-word puzzles are never valid",()=>{
  const wheelWord="ACCOUNTERS";
  [synthetic({anchor:"ACCOUNT"}),synthetic({anchor:wheelWord,secondary:["COUNT"]}),synthetic({anchor:wheelWord,secondary:["COUNT","TONE","ACE"],ordinary:["ONE","TEN"]})].forEach(puzzle=>{
    const verdict=slate.validateComposition(puzzle);
    assert.equal(verdict.valid,false);
    assert.match(verdict.errors.join(" "),/3-5 required words/);
  });
});

test("a puzzle needs an approved primary financial anchor and the wheel must be exactly the anchor's letters",()=>{
  const noAnchor={anchorWord:"TOKEN",wheelLetters:[..."TOKEN"],answers:[{word:"NOTE",category:C.SECONDARY},{word:"TONE",category:C.SECONDARY},{word:"TOKEN",category:C.ORDINARY}]};
  assert.match(slate.validateComposition(noAnchor).errors.join(" "),/primary financial term/);
  assert.match(slate.validateComposition(synthetic({anchor:"TOKEN",secondary:["NOTE"],ordinary:["TONE"],wheel:[..."TOKENS"]})).errors.join(" "),/exactly the anchor's letters/);
  assert.match(slate.validateComposition(synthetic({anchor:"ACCOUNT",secondary:["COUNT"],ordinary:["AUNT"],wheel:[..."ACOUNT"]})).errors.join(" "),/repeated-letter counts/);
  assert.match(slate.validateComposition(synthetic({anchor:"TOKEN",secondary:["NOTE"],ordinary:["TOOK"]})).errors.join(" "),/TOOK cannot be spelled from the wheel/);
});

test("bonus answers are neither required words nor financial words for the majority",()=>{
  const verdict=slate.validateComposition(synthetic({anchor:"ACCOUNTERS",secondary:["COUNT"],ordinary:["ONE","TEN"],bonus:["TONE","ACE","SEA","CAT"]}));
  assert.deepEqual([verdict.counts.required,verdict.counts.financial],[4,2]);
  assert.equal(verdict.valid,false);
});

test("the 27-puzzle slate is unchanged until the owner approves further composition revisions",()=>{
  assert.equal(slate.SPECS.length,27);
  const fingerprint=crypto.createHash("sha256").update(JSON.stringify(slate.SPECS)).digest("hex").slice(0,16);
  // cb3e6394540f0207 before the owner-authorized cross-world repair of 2026-10-17 (seven puzzles recomposed, revision 2).
  // a8de9ede25b5ba9c after the cross-world repair; 8c810ab1ba4afec9 after the Phase 3 replacement of eight anchors; f44d39b44363c248 after Phase 4 (owner-approved COB -> LOB in BLOCK, revision 3); 718154a858036bba after the owner-approved Phase 5 compositions (CHAIN/ACH, INCOME, SAVING, GROWTH/WORTH).
  assert.equal(fingerprint,"718154a858036bba","SPECS changed; composition revisions require owner approval and a new pinned fingerprint");
});

test("all 27 puzzles have exact anchor wheels, spellable answers, and legal connected crosswords; only the financial-majority rule is open",()=>{
  assert.equal(PUZZLES.length,27);
  PUZZLES.forEach(puzzle=>{
    const verdict=slate.validateComposition(puzzle,game);
    const nonMajority=verdict.errors.filter(error=>!/financial majority/.test(error));
    assert.deepEqual(nonMajority,[],`${puzzle.anchorWord}: ${nonMajority.join("; ")}`);
    assert.ok(puzzle.requiredWords.length>=3&&puzzle.requiredWords.length<=5);
    assert.equal(puzzle.wheelLetters.join(""),puzzle.anchorWord,"wheel is exactly the anchor, repeated letters included");
  });
});

// 8 compliant originally; 15 after the cross-world repair; 23 after Phase 3 (PASSKEY, CONVERT, MARKET, PRINCIPAL, BLOCK, STOCK, TRADE, RETURN replaced eight pending anchors).
const COMPLIANT=["TERMS","REPAYMENT","AUTOPAY","CAPACITY","PAYMENT","REFUND","PAYCHECK","DEPOSITOR","TOKEN","STAKE","CREDITOR","RECEIPT","BUDGET","NETWORK","PASSWORD","PASSKEY","CONVERT","MARKET","PRINCIPAL","BLOCK","STOCK","TRADE","RETURN","CHAIN","INCOME","SAVING","GROWTH"];
// 27 after the owner-approved Phase 5 compositions: nothing is pending any more.
const PENDING_APPROVAL=[];

test("all 27 puzzles meet the approved composition rules and none await owner approval",()=>{
  const verdicts=PUZZLES.map(puzzle=>({anchor:puzzle.anchorWord,...slate.validateComposition(puzzle,game)}));
  assert.deepEqual(verdicts.filter(v=>v.valid).map(v=>v.anchor).sort(),[...COMPLIANT].sort());
  assert.deepEqual(verdicts.filter(v=>!v.valid).map(v=>v.anchor).sort(),[...PENDING_APPROVAL].sort());
  assert.equal(verdicts.filter(v=>v.valid).length+verdicts.filter(v=>!v.valid).length,27);
  verdicts.filter(v=>v.valid).forEach(v=>assert.ok(v.counts.required>=3&&v.counts.financial>=v.counts.minimumFinancial));
});

test("every required answer in all 27 puzzles can be entered with taps alone, in any order",()=>{
  PUZZLES.forEach(puzzle=>{
    const tiles=puzzle.wheelLetters.map((letter,index)=>({id:`t${index}`,letter}));
    const orders=[puzzle.requiredWords,[...puzzle.requiredWords].sort((a,b)=>a.length-b.length),[...puzzle.requiredWords].reverse()];
    orders.forEach(order=>{
      const found=new Set();
      order.forEach(word=>{
        // Assign distinct physical tiles (repeated letters use separate tiles).
        const used=new Set(),ids=[...word].map(letter=>{const tile=tiles.find(candidate=>candidate.letter===letter&&!used.has(candidate.id));assert.ok(tile,`${puzzle.anchorWord}: no tile for ${letter} in ${word}`);used.add(tile.id);return tile.id});
        let selected=[],autoSubmitted=false;
        ids.forEach(id=>{
          selected=wheel.transitionSelection(selected,id).selected;
          const current=wheel.wordFor(selected,tiles);
          if(wheel.canSubmitTapWord(current,puzzle.requiredWords,found)&&current===word)autoSubmitted=true;
        });
        assert.equal(wheel.wordFor(selected,tiles),word);
        assert.equal(wheel.classifyWord(word,puzzle.requiredWords,found).status,"target");
        if(!autoSubmitted){
          // A pending word (e.g. PAY while PAYMENT is unfound) must be confirmable by re-tapping the last tile.
          assert.ok(wheel.isDeferredTarget(word,puzzle.requiredWords,found),`${puzzle.anchorWord}/${word} neither auto-submits nor is flagged pending`);
          assert.ok(wheel.shouldSubmitOnRetap(true,word,puzzle.requiredWords,found),`${puzzle.anchorWord}/${word} cannot be confirmed by taps`);
          assert.equal(wheel.transitionSelection(selected,ids.at(-1)).action,"ignored","the confirm tap never alters the selection");
        }
        found.add(word);
      });
      assert.equal(found.size,puzzle.requiredWords.length,"completion needs every required word");
    });
  });
});

test("short words that are the start of a longer answer are exactly the ones needing the confirm tap",()=>{
  const pending=[];
  PUZZLES.forEach(puzzle=>puzzle.requiredWords.forEach(word=>{if(wheel.isDeferredTarget(word,puzzle.requiredWords,new Set()))pending.push(`${puzzle.anchorWord}:${word}`)}));
  // BROKER:BROKE, DIVIDEND:DIVIDE, and MINER:MINE left with their replaced anchors in Phase 3; WALLET:WALL left with WALLET in Phase 5.
  assert.deepEqual(pending.sort(),["AUTOPAY:AUTO","CREDITOR:CREDIT","DEPOSITOR:POST","PASSWORD:PASS","PAYCHECK:PAY","PAYMENT:PAY","TERMS:TERM"].sort());
  assert.equal(wheel.shouldSubmitOnRetap(false,"PAY",["PAYMENT","PAY"],new Set()),false,"a first tap never confirms");
  assert.equal(wheel.shouldSubmitOnRetap(true,"PAYMENT",["PAYMENT","PAY"],new Set()),false,"a word that is not pending is not submitted by a re-tap");
  assert.equal(wheel.shouldSubmitOnRetap(true,"PAY",["PAYMENT","PAY"],new Set(["PAYMENT"])),false,"once the longer word is found, PAY auto-submits normally");
});

test("incorrect words never complete crossword slots",()=>{
  const payment=PUZZLES.find(puzzle=>puzzle.anchorWord==="PAYMENT");
  ["MEN","MAY","TEAM","XYZ","PAYMENTS",""].forEach(word=>{
    const status=wheel.classifyWord(word,payment.requiredWords,new Set()).status;
    assert.ok(["invalid","empty"].includes(status),`${word} -> ${status}`);
  });
  assert.equal(payment.bonusWords.length,0,"no bonus/outside-the-grid reward policy exists in the current governed slate");
  assert.deepEqual(payment.rewardPolicy.bonus,{coins:0,xp:0});
});

test("already-completed words are never rewarded twice, for every answer in all 27 puzzles",()=>{
  PUZZLES.forEach(puzzle=>{
    const progress={solvedWords:[],rewardedSupportWords:[],rewardedOrdinaryWords:[],rewardedFinancialTermIds:[]};
    puzzle.requiredWords.forEach(word=>{
      const first=bank.answerReward(puzzle,word,progress);
      assert.equal(first.isNewSolve,true,`${puzzle.anchorWord}/${word} pays on first solve`);
      progress[first.historyKey].push(word);
      if(first.termId&&!progress.rewardedFinancialTermIds.includes(first.termId))progress.rewardedFinancialTermIds.push(first.termId);
      const repeat=bank.answerReward(puzzle,word,progress);
      assert.deepEqual([repeat.isNewSolve,repeat.coins,repeat.xp],[false,0,0],`${puzzle.anchorWord}/${word} must not pay twice`);
    });
  });
});

test("the runtime wires the confirm tap, the pending hint, the mode marker, and the composition status",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.match(source,/wgRetapLast = Boolean\(wgState\.selected\.length\) && button\.dataset\.tileId === wgState\.selected\.at\(-1\)/);
  assert.match(source,/FinLitWheelInteraction\.shouldSubmitOnRetap\(retappedLast, word, wgState\.words, wgState\.found, wgWordOptions\(\)\)/);   // wgWordOptions (the wheel and found bonus words) was added with the global DUE bonus word
  assert.match(source,/tap the last letter again to submit/);
  assert.match(source,/document\.documentElement\.dataset\.finlitPuzzleMode = WG_V3_ENABLED \? "v3" : "legacy";/);
  assert.match(source,/validateComposition\(puzzle, FinLitGameEngine\)/);
  assert.match(source,/finlitComposition/);
  assert.match(source,/const shouldSubmit = wgGestureLetters > 1/,"a one-letter wobble still never submits");
});

test("V3 is the default game and legacy anchor-only routing requires an explicit diagnostic flag",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8"),css=fs.readFileSync(path.join(ROOT,"word-game.css"),"utf8");
  assert.match(source,/get\("puzzles"\) === "legacy"/);
  assert.match(source,/const WG_V3_ENABLED = !WG_LEGACY_DIAGNOSTIC_ENABLED/);
  assert.doesNotMatch(css,/V3 PREVIEW|NOT LIVE/);
  assert.match(css,/html\[data-finlit-puzzle-mode="legacy"\] body::before\{content:"LEGACY DIAGNOSTIC MODE"/);
});
