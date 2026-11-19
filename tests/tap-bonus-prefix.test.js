// Tap input with approved bonus words (owner-authorised fix, 2026-11-18). A required answer that is also the start of a longer,
// still-unfound bonus word (COIN/COINS, PAY/PAYOUT, NET/NETPAY) must not auto-submit on tap, so the longer word can be finished.
// The shorter required answer is still submitted by tapping its last letter again (the existing PAY/PAYMENT behaviour),
// by the Submit button, or by swipe release. Drives the real word-game-app.js functions for all 61 released puzzles.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const X=require("./universal-acceptance-helpers.js");
const {Wheel,session,activePuzzles,ROOT}=X;
const puzzles=activePuzzles();

const conflictsOf=s=>{const req=s.model.words,open=Wheel.openBonusWords(s.options());const out=[];
  req.forEach(r=>open.forEach(b=>{if(b!==r&&b.startsWith(r)&&!req.includes(b))out.push([r,b])}));return out};

test("audit of all 61 puzzles: exactly the four reported required-answer / bonus-word prefix pairs exist",()=>{
  const found=[];
  puzzles.forEach(p=>conflictsOf(session(p)).forEach(([r,b])=>found.push(`${p.anchorWord}:${r}->${b}`)));
  assert.equal(puzzles.length,61);
  assert.deepEqual(found.sort(),["AUTOPAY:PAY->PAYOUT","EXCLUSION:COIN->COINS","PAYMENT:NET->NETPAY","REPAYMENT:NET->NETPAY"]);
});

test("each pair: the short answer waits on tap, retap submits it with its normal reward, and the long bonus word can then be tapped",()=>{
  puzzles.forEach(p=>{
    const probe=session(p);
    conflictsOf(probe).forEach(([short,long])=>{
      // order 1: short answer first
      let s=session(p);
      assert.equal(s.canTap(short),false,`${p.anchorWord}: ${short} must not auto-submit while ${long} is open`);
      assert.equal(Wheel.isDeferredTarget(short,s.model.words,s.state.found,s.options()),true,"the retap hint is shown");
      assert.equal(Wheel.shouldSubmitOnRetap(true,short,s.model.words,s.state.found,s.options()),true,"tapping the last letter again submits it");
      assert.equal(s.submit(short).outcome,"required");assert.deepEqual(s.log.found,[short],"normal required-answer reward path");
      assert.equal(s.canTap(short),false,`after ${short} is found, tapping it still waits for ${long}`);
      assert.equal(s.canTap(long),true,`${long} submits on its last tap`);
      assert.equal(s.submit(long).outcome,"bonus");assert.deepEqual(s.log.found,[short],"the bonus word pays nothing");
      assert.equal(s.submit(long).outcome,"duplicate","recognised once");
      // order 2: long bonus word first
      s=session(p);
      assert.equal(s.canTap(long),true);assert.equal(s.submit(long).outcome,"bonus");
      assert.equal(s.canTap(short),true,`once ${long} is found, ${short} auto-submits on tap again`);
      assert.equal(s.submit(short).outcome,"required");
    });
  });
});

test("no other puzzle changes: every tap decision outside the four pairs is identical to the rule without bonus words",()=>{
  puzzles.forEach(p=>{
    const s=session(p),o=s.options(),req=s.model.words,pairs=new Set(conflictsOf(s).map(([r])=>r));
    req.forEach(w=>{if(pairs.has(w))return;
      const legacy=!req.some(c=>c!==w&&c.startsWith(w));
      assert.equal(Wheel.canSubmitTapWord(w,req,new Set(),o),legacy,`${p.anchorWord}: ${w}`);
    });
  });
  // the PAY/PAYMENT rule is unchanged
  assert.equal(Wheel.canSubmitTapWord("PAY",["PAY","PAYMENT"],new Set()),false);
  assert.equal(Wheel.isDeferredTarget("PAY",["PAY","PAYMENT"],new Set()),true);
  assert.equal(Wheel.shouldSubmitOnRetap(true,"PAY",["PAY","PAYMENT"],new Set()),true);
  assert.equal(Wheel.canSubmitTapWord("PAY",["PAY","PAYMENT"],new Set(["PAYMENT"])),true);
});

test("currency codes can be tapped and swiped",()=>{
  puzzles.forEach(p=>{const s=session(p),c=s.options().currency;if(!c)return;
    assert.equal(s.canTap(c.code)||Wheel.shouldSubmitOnRetap(true,c.code,s.state.words,s.state.found,s.options()),true,`${p.anchorWord} ${c.code}`);
    assert.equal(s.submit(c.code).outcome,"required","the code is a required answer (owner decision 2026-11-19)");});
  // swipe release submits whatever was traced through wgSubmitWord, without the tap rule
  const app=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.match(app,/const shouldSubmit = wgState\.selected\.length > 1 && wgGestureLetters > 1[^\n]*\n\s*wgResetPointer\(\);\n\s*if \(shouldSubmit\) wgSubmitWord\(\);/);
});
