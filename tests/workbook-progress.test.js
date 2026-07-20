const test=require("node:test"),assert=require("node:assert/strict");
const learning=require("../learning-engine.js"),{loadContent,memoryStorage}=require("./helpers.js");
const {terms}=loadContent();
function engine(storage=memoryStorage(),clock={value:new Date("2026-01-01T12:00:00Z")}){return {instance:new learning.LearningEngine({terms,storage,now:()=>new Date(clock.value)}),storage,clock}}

test("workbookProgress initializes sane defaults on first access",()=>{
  const {instance}=engine();
  const p=instance.workbookProgress("credit-foundations","CRF-001");
  assert.equal(p.status,"available");
  assert.equal(p.attempts,0);
  assert.equal(p.bestScorePercent,0);
  assert.equal(p.dateCompleted,null);
  assert.equal(p.practiceCompleted,false);
});

test("recordWorkbookAttempt awards XP only the first time a workbook is passed",()=>{
  const {instance}=engine();
  const startingXp=instance.save.player.xp;
  const first=instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  assert.equal(first.xpGained,100);
  assert.equal(instance.save.player.xp,startingXp+100);
  assert.equal(instance.workbookProgress("credit-foundations","CRF-001").status,"completed");

  const second=instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  assert.equal(second.xpGained,0,"replaying a completed workbook must not re-award XP");
  assert.equal(instance.save.player.xp,startingXp+100);
  assert.equal(instance.workbookProgress("credit-foundations","CRF-001").attempts,2);
});

test("recordWorkbookAttempt does not mark completed or award XP on a failed attempt",()=>{
  const {instance}=engine();
  const result=instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:50,passed:false,xpValue:100});
  assert.equal(result.xpGained,0);
  assert.equal(instance.save.player.xp,0);
  assert.equal(instance.workbookProgress("credit-foundations","CRF-001").status,"available");
  assert.equal(instance.workbookProgress("credit-foundations","CRF-001").attempts,1);
});

test("bestScorePercent tracks the maximum across attempts",()=>{
  const {instance}=engine();
  instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:60,passed:false,xpValue:100});
  instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:40,passed:false,xpValue:100});
  instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:90,passed:true,xpValue:100});
  assert.equal(instance.workbookProgress("credit-foundations","CRF-001").bestScorePercent,90);
});

test("workbookWorldStats aggregates completion and XP across a world",()=>{
  const {instance}=engine();
  instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  instance.recordWorkbookAttempt("credit-foundations","CRF-002",{percent:100,passed:true,xpValue:100});
  instance.recordWorkbookAttempt("credit-foundations","CRF-003",{percent:50,passed:false,xpValue:100});
  const ids=Array.from({length:15},(_,i)=>`CRF-${String(i+1).padStart(3,"0")}`);
  const stats=instance.workbookWorldStats("credit-foundations",ids);
  assert.equal(stats.completed,2);
  assert.equal(stats.totalWorkbooks,15);
  assert.equal(stats.completionPercent,Math.round((2/15)*100));
  assert.equal(stats.xpEarned,200);
});

test("workbook progress persists across a reload from the same storage",()=>{
  const storage=memoryStorage();
  const {instance:first}=engine(storage);
  first.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  const {instance:reloaded}=engine(storage);
  assert.equal(reloaded.workbookProgress("credit-foundations","CRF-001").status,"completed");
  assert.equal(reloaded.save.player.xp,100);
});

test("recordWorkbookPractice marks practice completed without affecting quiz state",()=>{
  const {instance}=engine();
  instance.recordWorkbookPractice("credit-foundations","CRF-001");
  const p=instance.workbookProgress("credit-foundations","CRF-001");
  assert.equal(p.practiceCompleted,true);
  assert.equal(p.status,"available");
});
