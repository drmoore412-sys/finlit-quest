const WORLD = FinLitWorldLoader.loadWorld(window.FINLIT_WORLD,window.DEFI_TERMS);
const learning=new FinLitLearning.LearningEngine({terms:WORLD.terms,storage:localStorage});
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const JOURNEY_SECTIONS=[
  {name:"Credit Foundations",evolution:"Restore the bank and build a foundation for your financial future."},
  {name:"Credit Cards",evolution:"Turn a quiet block into a confident, informed shopping district."},
  {name:"Interest & Borrowing",evolution:"Build the observatory and make borrowing costs easier to see."},
  {name:"Credit Reports",evolution:"Open the records center and understand the story behind a score."},
  {name:"Building Credit",evolution:"Grow one small home into a healthy, connected neighborhood."},
  {name:"Debt Management",evolution:"Develop a practical budget office into a center for steady progress."},
  {name:"Identity Protection",evolution:"Strengthen the digital fortress that protects personal information."},
  {name:"Loans & Comparing Offers",evolution:"Connect the dealership, mortgage office, and home with smarter choices."}
];

// Shared across word-game-app.js/workbook-app.js: Fisher-Yates shuffle,
// query helpers ($/$$ above), toast, celebrate.
function shuffled(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(t.timer);t.timer=setTimeout(()=>t.classList.remove("show"),1500)}
// Kept as a compatibility hook for existing win paths. Confetti was intentionally removed;
// puzzle completion still uses the separate coin, dollar and audio celebration.
function celebrate(){}

// Single source of truth for which of the app's top-level screens is
// visible — every screen-switch function hides all five, then reveals
// exactly one, instead of each maintaining its own (previously
// inconsistent — one even referenced a #creditGameScreen that no longer
// exists) hide-list.
const FQ_SCREEN_IDS=["welcomeScreen","worldSelectScreen","dashboardScreen","workbookScreen","worldGameScreen"];
function hideAllScreens(){FQ_SCREEN_IDS.forEach(id=>{const el=document.getElementById(id);if(el)el.classList.add("hidden")})}

function showWelcome(){hideAllScreens();$("#app").classList.remove("journey-mode");$("#welcomeScreen").classList.remove("hidden");window.scrollTo(0,0)}
function showWorldSelect(){hideAllScreens();$("#app").classList.add("journey-mode");$("#worldSelectScreen").classList.remove("hidden");renderWorldJourneyMap("quest");renderDailyReward();window.scrollTo(0,0)}
// Word Quests route into gameplay only when the governed world registry says
// an approved runtime puzzle bank exists. Approved world identities without an
// approved bank stay visible as Coming Soon and never initialize progress.
// Learning Quests currently route only Credit into authored workbook content.
// Daily login reward card. All rules (one claim per local day, the 7-day coin
// schedule, clock safeguards) live in learning-engine.js; this only renders the
// engine's read-only status and forwards the claim tap. Coins only: no XP.
const DAILY_REWARD_MESSAGES={
  "clock-behind-last-claim":"Your device date is earlier than your last claim. If it was set ahead by mistake, set Date & Time back to automatic. Your coins and reward history are safe, and rewards resume on their own once the real date catches up.",
  "clock-rolled-back":"Your device clock looks earlier than your recent activity. If it was set ahead by mistake, set Date & Time back to automatic. Your coins and reward history are safe, and rewards resume on their own once the real time catches up.",
  "recent-timezone-change":"Your time zone changed recently. The next reward unlocks 24 hours after your last claim.",
};
function renderDailyReward(announce){
  const status=learning.dailyRewardStatus(),button=$("#dailyRewardClaim"),summary=$("#dailyRewardSummary"),list=$("#dailyRewardDays"),note=$("#dailyRewardStatus");
  list.innerHTML="";
  status.schedule.forEach(day=>{
    const item=document.createElement("li"),label={claimed:"Claimed",current:"Today",upcoming:""}[day.state];
    item.className=day.state;item.setAttribute("aria-label",`Day ${day.day}: ${day.coins} coins${label?`, ${label.toLowerCase()}`:""}`);
    if(day.state==="current")item.setAttribute("aria-current","step");
    item.innerHTML=`<span class="dr-day" aria-hidden="true">Day ${day.day}</span><span class="dr-coins" aria-hidden="true">${day.coins}</span><span class="dr-state" aria-hidden="true">${day.state==="claimed"?'<span class="dr-check">✓</span><span class="dr-word"> Claimed</span>':label}</span>`;
    list.append(item);
  });
  if(status.claimable){
    button.disabled=false;button.textContent=`Claim ${status.coins} coins`;
    summary.textContent=`Day ${status.cycleDay} of ${status.cycleLength}: ${status.coins} coins ready.`;
    if(!announce)note.textContent=status.restarted?"Your reward cycle restarted at Day 1.":"";
  } else {
    button.disabled=true;button.textContent=status.claimedToday?"Claimed today":"Unavailable";
    summary.textContent=status.claimedToday?`Day ${status.cycleDay} of ${status.cycleLength} claimed.`:"Daily reward is paused.";
    if(!announce)note.textContent=status.claimedToday?`Come back tomorrow for Day ${status.nextCycleDay}: ${status.nextCoins} coins.`:(DAILY_REWARD_MESSAGES[status.reason]||"");
  }
  return status;
}
function claimDailyRewardFromUi(){
  const result=learning.claimDailyReward(),note=$("#dailyRewardStatus");
  const status=renderDailyReward(true);
  if(result.claimed){
    $("#worldMapCoins").textContent=learning.save.player.coins;
    note.textContent=`You claimed ${result.coins} coins for Day ${result.cycleDay}. Come back tomorrow for Day ${status.nextCycleDay}: ${status.nextCoins} coins.`;
  } else note.textContent=result.reason==="already-claimed"?`Already claimed today. Come back tomorrow for Day ${status.nextCycleDay}: ${status.nextCoins} coins.`:(DAILY_REWARD_MESSAGES[result.reason]||"Daily reward unavailable right now.");
  note.focus({preventScroll:true});
}
const WORLD_DEFINITIONS_2027=window.FINLIT_WORLD_DEFINITIONS_2027?.worlds||[
  {id:"moneybasics",name:"Money Basics",currentRuntimeStatus:"playable"},{id:"credit",name:"Credit Foundations",currentRuntimeStatus:"playable"},
  {id:"crypto",name:"Crypto Foundations",currentRuntimeStatus:"playable"},{id:"banking",name:"Banking Basics",currentRuntimeStatus:"playable"},
  {id:"investing",name:"Investing Basics",currentRuntimeStatus:"playable"},
];
const WORLD_JOURNEY_ORDER=WORLD_DEFINITIONS_2027.map(world=>world.id);
const WORLD_DEFINITION_BY_ID=new Map(WORLD_DEFINITIONS_2027.map(world=>[world.id,world]));
const WORLD_PLAYABLE_IDS=new Set(WORLD_DEFINITIONS_2027.filter(world=>world.currentRuntimeStatus==="playable").map(world=>world.id));
function renderWorldJourneyMap(mode){
  $("#journeyTabQuest").classList.toggle("active",mode==="quest");$("#journeyTabQuest").setAttribute("aria-selected",mode==="quest");
  $("#journeyTabLearning").classList.toggle("active",mode==="learning");$("#journeyTabLearning").setAttribute("aria-selected",mode==="learning");
  $("#worldMapKicker").textContent=mode==="quest"?"WORD QUESTS":"LEARNING QUESTS";
  $("#worldMapTitle").textContent=mode==="quest"?"Your Word Quest Journey":"Your Learning Quest Journey";
  $("#journeyLearningBanner").classList.toggle("hidden",mode==="learning");
  const player=learning.save.player;
  $("#worldMapCoins").textContent=player.coins;$("#worldMapXp").textContent=player.xp;$("#worldMapGems").textContent=0;
  WORLD_JOURNEY_ORDER.forEach(worldId=>{
    const node=$(`.journey-node[data-world="${worldId}"]`);
    if(!node)return;
    node.classList.remove("active","completed","learning-soon","coming-soon");
    const stateEl=node.querySelector(".node-state"),kickerEl=node.querySelector(".node-kicker"),progressEl=node.querySelector(".node-progress");
    const definition=WORLD_DEFINITION_BY_ID.get(worldId),isPlayable=WORLD_PLAYABLE_IDS.has(worldId);
    kickerEl.textContent=worldId==="moneybasics"?"START HERE":isPlayable?"":"NEW WORLD";
    if(mode==="quest"){
      if(!isPlayable){
        progressEl.textContent="PUZZLE BANK IN REVIEW";stateEl.textContent="Coming soon";node.classList.add("coming-soon");
        node.setAttribute("aria-label",`${definition?.name||worldId}, Coming Soon`);
        node.onclick=()=>toast(`${definition?.name||node.querySelector("strong").textContent} is coming soon. Its world is approved; its playable puzzle bank still needs owner approval.`);
      }else{
        const {completed,total,confirmed}=wgWorldProgress(worldId);
        node.setAttribute("aria-label",definition?.name||node.querySelector("strong").textContent);
        if(!confirmed){progressEl.textContent="NOT STARTED YET";stateEl.textContent="Start"}
        else{
          progressEl.textContent=`${completed} / ${total} PUZZLES`;
          if(completed>0&&completed<total){node.classList.add("active");stateEl.textContent="Current"}
          else if(completed&&completed===total){node.classList.add("completed");stateEl.textContent="Complete"}
          else{stateEl.textContent="Start"}
        }
        node.onclick=()=>wgOpenWorld(worldId);
      }
    } else {
      progressEl.textContent="";
      if(worldId==="credit"){
        const stats=learning.worldStats("credit");
        stateEl.textContent=stats.wordsLearned>0?"In progress":"Start here";
        if(stats.wordsLearned>0)node.classList.add("active");
        node.onclick=showDashboard;
      } else {
        stateEl.textContent="Coming soon";
        node.classList.add("learning-soon");
        node.onclick=()=>toast(isPlayable?`${node.querySelector("strong").textContent} lessons are coming soon — the word-puzzle game is available now.`:`${node.querySelector("strong").textContent} lessons and word puzzles are coming soon.`);
      }
    }
  });
}
function showDashboard(){hideAllScreens();$("#dashboardScreen").classList.remove("hidden");$("#app").classList.add("journey-mode");updateDashboard();window.scrollTo(0,0)}
function updateJourneyNodes(activeIndex){
  $$("#dashboardScreen .journey-node").forEach((node,index)=>{
    const status=index<activeIndex?"completed":index===activeIndex?"active":"locked";
    node.classList.remove("completed","active","locked");node.classList.add(status);
    node.disabled=index>activeIndex;
    node.setAttribute("aria-label",`${JOURNEY_SECTIONS[index].name}, ${status} destination`);
    const stateLabel=node.querySelector(".node-state");if(stateLabel)stateLabel.textContent=status==="completed"?"Thriving":status==="active"?"Current":"Locked";
  });
}
function updateDashboard(){
  // #dashboardScreen is Credit World's continent map (wired via
  // showDashboard from #selectCreditWorld) — stats must reflect Credit, not
  // the module-level WORLD constant, which is Crypto (this file's terms
  // were originally Crypto-only; #dashboardScreen was repurposed for
  // Credit in the onboarding redesign without this call site being updated).
  const stats=learning.worldStats("credit"),player=learning.save.player,now=Date.now(),recentDays=player.activityDates.filter(date=>now-new Date(`${date}T00:00:00`).getTime()<7*86400000).length,remaining=Math.max(0,player.weeklyGoal-recentDays),latest=player.achievements.at(-1),achievementStatus=latest?learning.achievementStatus(latest):null;
  // Only the first journey section (Credit Foundations) is unlocked in
  // v1.0 — there's no live gameplay path that advances past it.
  const playerLevel=FinLitLearning.levelForXp(player.xp),xpIntoLevel=FinLitLearning.xpIntoLevel(player.xp),activeIndex=0,journey=JOURNEY_SECTIONS[activeIndex];
  $("#dashboardXp").textContent=player.xp;$("#journeyCoins").textContent=player.coins;$("#journeyGems").textContent=0;$("#journeyLevel").textContent=playerLevel;$("#journeyLevelProgress").style.width=`${(xpIntoLevel/FinLitLearning.XP_PER_LEVEL)*100}%`;
  $("#wordsLearned").textContent=stats.wordsLearned;$("#streakValue").textContent=player.streak;$("#streakLabel").textContent=player.streak?`${player.streak} day streak`:"No streak yet";$("#footerStreak").textContent=`${player.streak} day${player.streak===1?"":"s"}`;
  $("#dashboardProgress").style.width=`${stats.completionPercent}%`;$("#dashboardProgressText").textContent=`${stats.completionPercent}%`;$("#masteryValue").textContent=`${stats.masteryPercent}%`;$("#masteryRing").style.setProperty("--mastery",`${stats.masteryPercent}%`);
  $("#currentJourneyWorld").textContent=journey.name;$("#worldEvolutionCopy").textContent=journey.evolution;$("#regionState").textContent=activeIndex?"Region growing":"Region awakening";$("#continueKicker").textContent=`QUEST ${activeIndex+1} OF ${JOURNEY_SECTIONS.length}`;updateJourneyNodes(activeIndex);
  $("#dailyReviewStatus").textContent=stats.reviewsDue?`${stats.reviewsDue} term${stats.reviewsDue===1?"":"s"} ready now`:"No reviews due";$("#reviewDueBadge").textContent=`${stats.reviewsDue} due`;
  $("#weeklyGoalValue").textContent=recentDays;$("#weeklyGoalLabel").textContent=` / ${player.weeklyGoal} learning days`;$("#weeklyGoalMessage").textContent=remaining?`${remaining} more learning day${remaining===1?"":"s"} to reach your goal.`:"Weekly goal complete.";
  $("#badgeCount").textContent=`${player.achievements.length} / ${Object.keys(FinLitLearning.ACHIEVEMENTS).length}`;$("#xpToNext").textContent=`${xpIntoLevel} / ${FinLitLearning.XP_PER_LEVEL}`;$("#footerProgressFill").style.width=`${(xpIntoLevel/FinLitLearning.XP_PER_LEVEL)*100}%`;
  // The XP badge is shown only when a reward was actually recorded for this
  // achievement, so the displayed reward always matches what was awarded.
  $("#achievementTitle").textContent=achievementStatus?achievementStatus.title:"No achievements unlocked";$("#achievementDescription").textContent=achievementStatus?achievementStatus.description:"Complete your first applied challenge.";$("#achievementReward").textContent=achievementStatus&&achievementStatus.rewardRecorded?`+${achievementStatus.xpAwarded} XP`:"";
}
function toggleTheme(){const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;learning.save.settings.theme=next;learning.persist();localStorage.removeItem("fq_theme");$$(".theme-toggle").forEach(btn=>btn.textContent=next==="dark"?"☀":"☾")}

$("#continueLearning").onclick=()=>wgOpenWorld("credit");$("#themeToggle").onclick=toggleTheme;$("#viewLevels").onclick=()=>wgOpenWorld("credit");$("#dashboardReview").onclick=()=>wgOpenWorld("credit");
$("#journeyBrandLogo").onclick=showWorldSelect;
$("#welcomeStartButton").onclick=()=>{localStorage.setItem("finlitQuest.onboarded","true");showWorldSelect()};
$("#continentPreview").onclick=()=>toast("More financial regions unlock after their curriculum is approved");
$("#dailyRewardClaim").onclick=claimDailyRewardFromUi;
// Re-evaluate when the app returns to the foreground (e.g. after local midnight) so the card never shows a stale day.
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!$("#worldSelectScreen").classList.contains("hidden"))renderDailyReward()});
$("#journeyTabQuest").onclick=()=>renderWorldJourneyMap("quest");
$("#journeyTabLearning").onclick=()=>renderWorldJourneyMap("learning");
$("#journeyLearningBanner").onclick=()=>renderWorldJourneyMap("learning");
$("#worldMapThemeToggle").onclick=toggleTheme;

document.documentElement.dataset.theme=learning.save.settings.theme||localStorage.getItem("fq_theme")||"light";learning.save.settings.theme=document.documentElement.dataset.theme;learning.persist();$$(".theme-toggle").forEach(btn=>btn.textContent=document.documentElement.dataset.theme==="dark"?"☀":"☾");
