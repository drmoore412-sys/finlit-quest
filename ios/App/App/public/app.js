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
function celebrate(){const colors=["#34d399","#f6c453","#7ca7ff","#f472b6"];for(let i=0;i<28;i++){const bit=document.createElement("i");bit.className="confetti";bit.style.left=`${10+Math.random()*80}%`;bit.style.top="-20px";bit.style.background=colors[i%colors.length];bit.style.setProperty("--x",`${(Math.random()-.5)*180}px`);bit.style.animationDelay=`${Math.random()*.3}s`;document.body.append(bit);setTimeout(()=>bit.remove(),1900)}}

// Single source of truth for which of the app's top-level screens is
// visible — every screen-switch function hides all five, then reveals
// exactly one, instead of each maintaining its own (previously
// inconsistent — one even referenced a #creditGameScreen that no longer
// exists) hide-list.
const FQ_SCREEN_IDS=["welcomeScreen","worldSelectScreen","dashboardScreen","workbookScreen","worldGameScreen"];
function hideAllScreens(){FQ_SCREEN_IDS.forEach(id=>{const el=document.getElementById(id);if(el)el.classList.add("hidden")})}

function showWelcome(){hideAllScreens();$("#app").classList.remove("journey-mode");$("#welcomeScreen").classList.remove("hidden");window.scrollTo(0,0)}
function showWorldSelect(){hideAllScreens();$("#app").classList.remove("journey-mode");$("#worldSelectScreen").classList.remove("hidden");window.scrollTo(0,0)}
function showDashboard(){hideAllScreens();$("#dashboardScreen").classList.remove("hidden");$("#app").classList.add("journey-mode");updateDashboard();window.scrollTo(0,0)}
function updateJourneyNodes(activeIndex){
  $$(".journey-node").forEach((node,index)=>{
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
  const stats=learning.worldStats("credit"),player=learning.save.player,now=Date.now(),recentDays=player.activityDates.filter(date=>now-new Date(`${date}T00:00:00`).getTime()<7*86400000).length,remaining=Math.max(0,player.weeklyGoal-recentDays),latest=player.achievements.at(-1),achievementCopy={first_application:["Applied Thinker","Answered your first applied challenge.","+25 XP"],three_day_streak:["On a Roll","Learned on three consecutive days.","+50 XP"]};
  // Only the first journey section (Credit Foundations) is unlocked in
  // v1.0 — there's no live gameplay path that advances past it.
  const playerLevel=FinLitLearning.levelForXp(player.xp),xpIntoLevel=FinLitLearning.xpIntoLevel(player.xp),activeIndex=0,journey=JOURNEY_SECTIONS[activeIndex];
  $("#dashboardXp").textContent=player.xp;$("#journeyCoins").textContent=player.coins;$("#journeyGems").textContent=0;$("#journeyLevel").textContent=playerLevel;$("#journeyLevelProgress").style.width=`${(xpIntoLevel/FinLitLearning.XP_PER_LEVEL)*100}%`;
  $("#wordsLearned").textContent=stats.wordsLearned;$("#streakValue").textContent=player.streak;$("#streakLabel").textContent=player.streak?`${player.streak} day streak`:"No streak yet";$("#footerStreak").textContent=`${player.streak} day${player.streak===1?"":"s"}`;
  $("#dashboardProgress").style.width=`${stats.completionPercent}%`;$("#dashboardProgressText").textContent=`${stats.completionPercent}%`;$("#masteryValue").textContent=`${stats.masteryPercent}%`;$("#masteryRing").style.setProperty("--mastery",`${stats.masteryPercent}%`);
  $("#currentJourneyWorld").textContent=journey.name;$("#worldEvolutionCopy").textContent=journey.evolution;$("#regionState").textContent=activeIndex?"Region growing":"Region awakening";$("#continueKicker").textContent=`QUEST ${activeIndex+1} OF ${JOURNEY_SECTIONS.length}`;updateJourneyNodes(activeIndex);
  $("#dailyReviewStatus").textContent=stats.reviewsDue?`${stats.reviewsDue} term${stats.reviewsDue===1?"":"s"} ready now`:"No reviews due";$("#reviewDueBadge").textContent=`${stats.reviewsDue} due`;
  $("#weeklyGoalValue").textContent=recentDays;$("#weeklyGoalLabel").textContent=` / ${player.weeklyGoal} learning days`;$("#weeklyGoalMessage").textContent=remaining?`${remaining} more learning day${remaining===1?"":"s"} to reach your goal.`:"Weekly goal complete.";
  $("#badgeCount").textContent=`${player.achievements.length} / 2`;$("#xpToNext").textContent=`${xpIntoLevel} / ${FinLitLearning.XP_PER_LEVEL}`;$("#footerProgressFill").style.width=`${(xpIntoLevel/FinLitLearning.XP_PER_LEVEL)*100}%`;
  const copy=achievementCopy[latest];$("#achievementTitle").textContent=copy?copy[0]:"No achievements unlocked";$("#achievementDescription").textContent=copy?copy[1]:"Complete your first applied challenge.";$("#achievementReward").textContent=copy?copy[2]:"";
}
function toggleTheme(){const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;learning.save.settings.theme=next;learning.persist();localStorage.removeItem("fq_theme");$("#themeToggle").textContent=next==="dark"?"☀":"☾"}

$("#continueLearning").onclick=()=>wgOpenWorld("credit");$("#themeToggle").onclick=toggleTheme;$("#viewLevels").onclick=()=>wgOpenWorld("credit");$("#dashboardReview").onclick=()=>wgOpenWorld("credit");
$("#journeyBrandLogo").onclick=showWorldSelect;
$("#welcomeStartButton").onclick=()=>{localStorage.setItem("finlitQuest.onboarded","true");showWorldSelect()};
$("#selectCryptoWorld").onclick=()=>wgOpenWorld("crypto");
$("#selectCreditWorld").onclick=showDashboard;
$("#continentPreview").onclick=()=>toast("More financial regions unlock after their curriculum is approved");

document.documentElement.dataset.theme=learning.save.settings.theme||localStorage.getItem("fq_theme")||"light";learning.save.settings.theme=document.documentElement.dataset.theme;learning.persist();$("#themeToggle").textContent=document.documentElement.dataset.theme==="dark"?"☀":"☾";
