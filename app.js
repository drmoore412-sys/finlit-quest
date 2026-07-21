const WORLD = FinLitWorldLoader.loadWorld(window.FINLIT_WORLD,window.DEFI_TERMS);
const TERMS = Object.fromEntries(WORLD.terms.map(term=>[term.word,term]));
const LEVELS = [...WORLD.levels];
const BONUS = WORLD.bonusWords;
const {layoutWords,canForm,wheelFor}=FinLitGameEngine;
const learning=new FinLitLearning.LearningEngine({terms:WORLD.terms,storage:localStorage});
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={level:0,found:new Set(),hints:new Set(),selected:[],yield:Number(localStorage.getItem("yw_yield")||0),tries:{},started:Date.now(),skip:false,review:false,custom:false,level1GamesPlayed:0};
const LEVEL1_GAMES_REQUIRED=5;
let pointerDown=false, gestureLetters=0, rating=0, pendingAdvance=false, activeTermId=null, activeLesson=null, lessonStep=0, quizAnswered=false;
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

function shuffled(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function renderLevel(){
  const level=LEVELS[state.level]; state.found=new Set(); state.hints=new Set(); state.selected=[]; state.tries={}; state.started=Date.now(); state.skip=Boolean(learning.save.settings.skipLessons); state.clueOrder=shuffled(level.words); pendingAdvance=false;
  $("#gameScreen").classList.remove("hidden"); $("#feedbackPanel").classList.add("hidden"); $("#levelPanel").classList.add("hidden");
  $("#levelLabel").textContent=state.review?"Daily review":state.custom?"New game":state.level===0&&state.level1GamesPlayed<LEVEL1_GAMES_REQUIRED?`Game ${state.level1GamesPlayed+1} of ${LEVEL1_GAMES_REQUIRED}`:`Level ${state.level+1}`; $("#levelTitle").textContent=level.title; renderGrid(); renderWheel(shuffled(level.letters.split(""))); updateProgress(); renderLevelList(); clearSelection();
}
function renderGrid(){
  const grid=$("#crossword"), clues=$("#clueList"); grid.innerHTML=""; clues.innerHTML="";
  const words=LEVELS[state.level].words;
  const clueCard=$("#clueCard");
  if(state.level===0&&!state.review){
    grid.classList.remove("hidden"); clueCard.classList.remove("hidden");
    (state.clueOrder||words).forEach((word,i)=>{const item=document.createElement("div");item.className=`clue ${state.found.has(word)?"found":""}`;item.innerHTML=`<span class="clue-number">${state.found.has(word)?"✓":i+1}</span><span>${TERMS[word].definition}<span class="clue-answer">${state.found.has(word)?word:hintPattern(word)}</span></span>`;clues.append(item)});
  } else {
    grid.classList.remove("hidden"); clueCard.classList.add("hidden");
  }
  const placements=layoutWords(words);
  placements.forEach(p=>p.word.split("").forEach((letter,i)=>{const r=p.r+(p.dir==="v"?i:0),c=p.c+(p.dir==="h"?i:0),key=`${r}-${c}`;let cell=grid.querySelector(`[data-key="${key}"]`);if(!cell){cell=document.createElement("div");cell.className="cell";cell.dataset.key=key;cell.style.gridRow=r+1;cell.style.gridColumn=c+1;grid.append(cell)}cell.dataset.words=(cell.dataset.words||"")+` ${p.word}`;cell.dataset.letter=letter;if(state.found.has(p.word)){cell.textContent=letter;cell.classList.add("found")}else if(state.hints.has(`${p.word}:${i}`)){cell.textContent=letter;cell.classList.add("hinted")}}));
}
function hintPattern(word){return [...word].map((letter,i)=>isLetterVisible(word,i)?letter:"_").join(" ")}
function hintCount(word){return [...word].filter((_,i)=>isLetterVisible(word,i)).length}
function isLetterVisible(word,index){
  if(state.hints.has(`${word}:${index}`))return true;
  const placements=layoutWords(LEVELS[state.level].words),target=placements.find(item=>item.word===word);
  if(!target)return false;
  const row=target.r+(target.dir==="v"?index:0),column=target.c+(target.dir==="h"?index:0);
  return placements.some(item=>state.found.has(item.word)&&[...item.word].some((_,i)=>item.r+(item.dir==="v"?i:0)===row&&item.c+(item.dir==="h"?i:0)===column));
}
function revealHint(){const unfinished=LEVELS[state.level].words.filter(word=>!state.found.has(word)&&hintCount(word)<word.length);if(!unfinished.length)return toast("Every available letter is already revealed");unfinished.sort((a,b)=>hintCount(a)-hintCount(b));const word=unfinished[0],index=[...word].findIndex((_,i)=>!isLetterVisible(word,i));if(index<0)return toast("Every available letter is already revealed");state.hints.add(`${word}:${index}`);learning.recordHint(`${WORLD.id}.${word.toLowerCase()}`);renderGrid();updateDashboard();toast(`Hint: ${word[index]} is letter ${index+1} of a ${word.length}-letter word`)}
function renderWheel(letters){const wheel=$("#wheel");wheel.innerHTML="";letters.forEach((letter,i)=>{const a=(Math.PI*2*i/letters.length)-Math.PI/2,b=document.createElement("button");b.className="letter";b.textContent=letter;b.dataset.index=i;b.style.left=`${50+39*Math.cos(a)}%`;b.style.top=`${50+39*Math.sin(a)}%`;b.addEventListener("pointerdown",e=>{e.preventDefault();pointerDown=true;gestureLetters=0;addLetter(b)});b.addEventListener("pointerenter",()=>{if(pointerDown)addLetter(b)});wheel.append(b)});}
document.addEventListener("pointerup",()=>{if(pointerDown){pointerDown=false;if(gestureLetters>1)submitWord()}});
function addLetter(btn){const idx=Number(btn.dataset.index);if(state.selected.includes(idx))return;state.selected.push(idx);gestureLetters++;btn.classList.add("selected");updateSelection()}
function updateSelection(){const letters=$$(".letter"), word=state.selected.map(i=>letters[i].textContent).join("");$("#wordReadout").textContent=word||"Swipe or tap letters";$("#traceLine").setAttribute("points",state.selected.map(i=>{const b=letters[i];return `${b.offsetLeft+15},${b.offsetTop+15}`}).join(" "))}
function clearSelection(){state.selected=[];$$(".letter").forEach(b=>b.classList.remove("selected"));$("#traceLine").setAttribute("points","");$("#wordReadout").textContent="Swipe or tap letters"}
function submitWord(){const word=state.selected.map(i=>$$('.letter')[i].textContent).join("");clearSelection();const level=LEVELS[state.level],result=FinLitGameEngine.evaluateWord(word,level,state.found,BONUS);if(result.status==="empty")return;state.tries[word]=(state.tries[word]||0)+1;if(result.status==="duplicate")return toast("Already found");if(result.status==="target")return foundWord(word);if(result.status==="bonus"){addYield(WORLD.reward.bonus);return toast(`Bonus word · +${WORLD.reward.bonus.toFixed(1)} ${WORLD.reward.label}`)}toast("Not in this puzzle")}
function foundWord(word){state.found.add(word);const termId=`${WORLD.id}.${word.toLowerCase()}`,gain=Number((word.length*WORLD.reward.multiplier).toFixed(1));learning.recordPuzzleSolved(termId,{solveTimeMs:Date.now()-state.started});addYield(gain);renderGrid();updateProgress();updateDashboard();pendingAdvance=state.found.size===LEVELS[state.level].words.length;if(!state.skip)showLearn(word,gain);else if(pendingAdvance)setTimeout(advance,500)}
function addYield(n){state.yield=Number((state.yield+n).toFixed(1));localStorage.setItem("yw_yield",state.yield);$("#yieldValue").textContent=state.yield.toFixed(1);const gain=$("#yieldGain");gain.textContent=`+${n.toFixed(1)}`;gain.classList.remove("pop");void gain.offsetWidth;gain.classList.add("pop")}
function updateProgress(){const total=LEVELS[state.level].words.length,n=state.found.size;$("#progressLabel").textContent=`${n} / ${total}`;$("#progressBar").style.width=`${n/total*100}%`}
function showLearn(word,gain){activeTermId=`${WORLD.id}.${word.toLowerCase()}`;activeLesson={...learning.learningObject(activeTermId),rewardGain:gain};lessonStep=0;quizAnswered=false;$("#lessonFlow").classList.remove("hidden");$("#lessonComplete").classList.add("hidden");$("#learnModal").classList.remove("hidden");renderLesson()}
function closeLearn(){$("#learnModal").classList.add("hidden");if(pendingAdvance)setTimeout(advance,250)}
function lessonRelatedWords(){return activeLesson.relatedTermIds.map(id=>learning.repository.get(id)?.word||id).filter(Boolean)}
function renderLesson(){
  const steps=[
    {label:"Term unlocked",icon:"◎",title:"What it means",content:`<strong>${activeLesson.pronunciation}</strong><br>${activeLesson.definition}`},
    {label:"In real life",icon:"◫",title:"See it in action",content:activeLesson.realLifeExample},
    {label:"Did you know?",icon:"✦",title:"One useful insight",content:activeLesson.didYouKnow},
    {label:"Watch out",icon:"!",title:"Common mistake",content:activeLesson.commonMistake},
    {label:"Quick challenge",icon:"?",title:"Apply what you learned",content:activeLesson.quickChallenge.prompt,quiz:true},
    {label:"Build connections",icon:"↗",title:"Related words",content:`These ideas connect to ${activeLesson.word}:<div class="related-chips">${lessonRelatedWords().map(word=>`<span>${word}</span>`).join("")}</div>`},
    {label:"Lesson complete",icon:"★",title:"Claim your reward",content:`You completed the ${activeLesson.word} micro-lesson.<br><strong>+${activeLesson.rewardGain.toFixed(1)} ${WORLD.reward.label} · +${activeLesson.xpValue} XP</strong>`,review:true}
  ],step=steps[lessonStep];
  $("#learnWord").textContent=activeLesson.word;$("#lessonLabel").textContent=step.label;$("#lessonIcon").textContent=step.icon;$("#lessonTitle").textContent=step.title;$("#lessonContent").innerHTML=step.content;$("#lessonCount").textContent=`${lessonStep+1} / ${steps.length}`;$("#lessonProgress").style.width=`${(lessonStep+1)/steps.length*100}%`;$("#quizOptions").classList.toggle("hidden",!step.quiz);$("#reviewStep").classList.toggle("hidden",!step.review);$("#lessonNext").classList.toggle("hidden",Boolean(step.quiz||step.review));$("#lessonFeedback").classList.add("hidden");
  if(step.quiz)renderQuiz();
}
function renderQuiz(){const options=$("#quizOptions");options.innerHTML="";activeLesson.quickChallenge.options.forEach((choice,index)=>{const button=document.createElement("button");button.textContent=choice;button.onclick=()=>answerQuiz(index,button);options.append(button)})}
function answerQuiz(index,button){if(quizAnswered)return;quizAnswered=true;const challenge=activeLesson.quickChallenge,correct=index===challenge.correctAnswer;button.classList.add(correct?"correct":"incorrect");if(!correct){const buttons=$$("#quizOptions button");buttons[challenge.correctAnswer].classList.add("correct")}learning.recordChallenge(activeTermId,{correct,misconceptionFlag:correct?null:challenge.id});activeLesson={...learning.learningObject(activeTermId),rewardGain:activeLesson.rewardGain};const feedback=$("#lessonFeedback");feedback.textContent=`${correct?"Correct.":"Not quite."} ${challenge.explanation}`;feedback.classList.remove("hidden");updateDashboard();$("#lessonNext").classList.remove("hidden")}
function nextLessonStep(){if(lessonStep<6){lessonStep++;renderLesson()}}
function rateLearning(rating){if(!activeTermId)return;const result=learning.review(activeTermId,rating),interval=result.review.currentInterval,days=interval<1?"10 minutes":`${Math.round(interval)} day${Math.round(interval)===1?"":"s"}`,mastery=result.masteryPercent;$("#lessonFlow").classList.add("hidden");$("#lessonComplete").classList.remove("hidden");$("#lessonXp").textContent=activeLesson.xpValue;$("#reviewSchedule").textContent=`Next review scheduled in ${days}.`;$("#lessonMastery").textContent=`${mastery}%`;$("#lessonMasteryRing").style.setProperty("--term-mastery",`${mastery}%`);$("#masteryMessage").textContent=["Keep exploring","Learning started","Becoming familiar","Proficient","Mastered"][result.masteryLevel];celebrate();activeTermId=null;updateDashboard()}
function advance(){
  celebrate();
  if(state.review||state.custom)return showFeedback();
  if(state.level===0){
    state.level1GamesPlayed++;
    if(state.level1GamesPlayed<LEVEL1_GAMES_REQUIRED){
      const puzzle=buildRandomPuzzle();
      if(puzzle)LEVELS[0]={...LEVELS[0],words:puzzle.words,letters:puzzle.letters.join("")};
      return renderLevel();
    }
  }
  if(state.level===LEVELS.length-1)return showFeedback();
  state.level++;renderLevel();
}
function showFeedback(){$("#gameScreen").classList.add("hidden");$("#feedbackPanel").classList.remove("hidden");window.scrollTo(0,0)}
function startReview(){const due=learning.due(WORLD.id,20),allProgress=Object.entries(learning.save.termProgress).filter(([id])=>id.startsWith(`${WORLD.id}.`)).sort(([,a],[,b])=>a.masteryPercent-b.masteryPercent||a.challenge.challengesCorrect-b.challenge.challengesCorrect).map(([id])=>learning.repository.get(id)).filter(Boolean),ranked=[...due,...allProgress].filter((term,index,list)=>term.word.length<=6&&list.findIndex(item=>item.id===term.id)===index),chosen=ranked.slice(0,3).map(term=>term.word);if(!chosen.length)return toast("Complete your first lesson to unlock review");const letters=wheelFor(chosen);if(letters.length>9)return toast("More learned words will unlock a compatible review");LEVELS.push({id:`${WORLD.id}-review-${Date.now()}`,difficulty:"review",title:"Words worth another look",letters:letters.join(""),words:chosen});state.level=LEVELS.length-1;state.review=true;state.custom=false;renderLevel()}
function buildRandomPuzzle(){
  const pool=shuffled(WORLD.terms.map(term=>term.word));
  const words=[];let letters=[];
  for(const word of pool){
    if(words.length>=5)break;
    const candidateLetters=wheelFor([...words,word]);
    if(candidateLetters.length<=9){words.push(word);letters=candidateLetters}
  }
  return words.length>=2?{words,letters}:null;
}
function newGame(){
  const puzzle=buildRandomPuzzle();
  if(!puzzle)return toast("Couldn't build a new puzzle — try again");
  const {words,letters}=puzzle;
  LEVELS.push({id:`${WORLD.id}-new-${Date.now()}`,difficulty:"custom",title:"New game",letters:letters.join(""),words});
  state.level=LEVELS.length-1;state.review=false;state.custom=true;renderLevel();
  toast("New puzzle ready");
}
function shuffle(){const letters=shuffled($$(".letter").map(b=>b.textContent));renderWheel(letters);clearSelection()}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(t.timer);t.timer=setTimeout(()=>t.classList.remove("show"),1500)}
// Single source of truth for which of the app's top-level screens is
// visible — every screen-switch function hides all six, then reveals
// exactly one, instead of each maintaining its own (previously
// inconsistent — one even referenced a #creditGameScreen that no longer
// exists) hide-list.
const FQ_SCREEN_IDS=["welcomeScreen","worldSelectScreen","dashboardScreen","playScreen","workbookScreen","worldGameScreen"];
function hideAllScreens(){FQ_SCREEN_IDS.forEach(id=>{const el=document.getElementById(id);if(el)el.classList.add("hidden")})}

function showWelcome(){hideAllScreens();$("#app").classList.remove("journey-mode");$("#welcomeScreen").classList.remove("hidden");window.scrollTo(0,0)}
function showWorldSelect(){hideAllScreens();$("#app").classList.remove("journey-mode");$("#worldSelectScreen").classList.remove("hidden");window.scrollTo(0,0)}
function showPlay(){updateDashboard();hideAllScreens();$("#app").classList.remove("journey-mode");$("#playScreen").classList.remove("hidden");window.scrollTo(0,0)}
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
  // the module-level WORLD constant, which is Crypto (this file's terms/
  // levels were originally Crypto-only; #dashboardScreen was repurposed for
  // Credit in the onboarding redesign without this call site being updated).
  const stats=learning.worldStats("credit"),player=learning.save.player,now=Date.now(),recentDays=player.activityDates.filter(date=>now-new Date(`${date}T00:00:00`).getTime()<7*86400000).length,remaining=Math.max(0,player.weeklyGoal-recentDays),latest=player.achievements.at(-1),achievementCopy={first_application:["Applied Thinker","Answered your first applied challenge.","+25 XP"],three_day_streak:["On a Roll","Learned on three consecutive days.","+50 XP"]};
  const playerLevel=FinLitLearning.levelForXp(player.xp),xpIntoLevel=FinLitLearning.xpIntoLevel(player.xp),activeIndex=Math.min(state.review?Math.max(0,state.level-1):state.level,JOURNEY_SECTIONS.length-1),journey=JOURNEY_SECTIONS[activeIndex];
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
window.updateSkipLessonsButton=function updateSkipLessonsButton(){const on=Boolean(learning.save.settings.skipLessons);const button=$("#skipLessonsToggle");button.classList.toggle("active",on);button.setAttribute("aria-pressed",String(on));button.title=on?"Lessons skipped — tap to turn them back on":"Skip flashcards and quizzes — just play"};
window.toggleSkipLessons=function toggleSkipLessons(){const next=!learning.save.settings.skipLessons;learning.save.settings.skipLessons=next;learning.persist();state.skip=next;updateSkipLessonsButton();toast(next?"Lessons skipped — just playing":"Lessons back on");if(next&&!$("#learnModal").classList.contains("hidden")){pendingAdvance=state.found.size===LEVELS[state.level].words.length;closeLearn()}};
function celebrate(){const colors=["#34d399","#f6c453","#7ca7ff","#f472b6"];for(let i=0;i<28;i++){const bit=document.createElement("i");bit.className="confetti";bit.style.left=`${10+Math.random()*80}%`;bit.style.top="-20px";bit.style.background=colors[i%colors.length];bit.style.setProperty("--x",`${(Math.random()-.5)*180}px`);bit.style.animationDelay=`${Math.random()*.3}s`;document.body.append(bit);setTimeout(()=>bit.remove(),1900)}}
function renderLevelList(){const list=$("#levelList");list.innerHTML="";LEVELS.slice(0,5).forEach((l,i)=>{const b=document.createElement("button");b.className=`level-choice ${i===state.level&&!state.review?"active":""}`;b.innerHTML=`<div><strong>Level ${i+1}</strong><span>${l.title}</span></div><b>${l.words.length} terms</b>`;b.onclick=()=>{state.level=i;state.review=false;state.custom=false;renderLevel()};list.append(b)})}
$("#worldEyebrow").textContent=WORLD.eyebrow;$("#rewardName").textContent=WORLD.reward.name;$("#rewardLabel").textContent=WORLD.reward.label;$("#yieldValue").textContent=state.yield.toFixed(1);$("#checkButton").onclick=submitWord;$("#hintButton").onclick=revealHint;$("#shuffleButton").onclick=shuffle;$("#skipLessons").onclick=()=>{activeTermId=null;state.skip=true;updateDashboard();closeLearn()};$("#levelsButton").onclick=()=>$("#levelPanel").classList.remove("hidden");$("#closeLevels").onclick=()=>$("#levelPanel").classList.add("hidden");$("#dailyReview").onclick=startReview;
$$('#reviewActions button').forEach(button=>button.onclick=()=>rateLearning(button.dataset.rating));
$("#continueLearning").onclick=()=>wgOpenWorld("credit");$("#backHome").onclick=showWorldSelect;$("#themeToggle").onclick=toggleTheme;$("#viewLevels").onclick=()=>wgOpenWorld("credit");$("#dashboardReview").onclick=()=>wgOpenWorld("credit");
$("#journeyBrandLogo").onclick=showWorldSelect;
$("#welcomeStartButton").onclick=()=>{localStorage.setItem("finlitQuest.onboarded","true");showWorldSelect()};
$("#selectCryptoWorld").onclick=()=>wgOpenWorld("crypto");
$("#selectCreditWorld").onclick=showDashboard;
$("#skipLessonsToggle").onclick=toggleSkipLessons;
$$(".journey-node").forEach((node,index)=>node.onclick=()=>{if(node.disabled)return;state.level=Math.min(index,LEVELS.length-1);state.review=false;state.custom=false;renderLevel();showPlay()});
$("#newGameButton").onclick=newGame;
$("#continentPreview").onclick=()=>toast("More financial regions unlock after their curriculum is approved");
$("#lessonNext").onclick=nextLessonStep;$("#finishLesson").onclick=closeLearn;
for(let i=1;i<=5;i++){const b=document.createElement("button");b.textContent=i;b.onclick=()=>{rating=i;$$("#rating button").forEach((x,j)=>x.classList.toggle("selected",j<i))};$("#rating").append(b)}
$("#saveFeedback").onclick=()=>{if(!rating)return toast("Tap a rating first");const result={rating,comment:$("#feedbackText").value.trim(),yield:state.yield,savedAt:new Date().toLocaleString()};localStorage.setItem("yw_feedback",JSON.stringify(result));const receipt=$("#feedbackReceipt");receipt.textContent=`Saved locally\nRating: ${result.rating}/5\nComment: ${result.comment||"—"}\nSession yield: ${result.yield.toFixed(1)} YLD\n${result.savedAt}`;receipt.classList.remove("hidden")};
document.documentElement.dataset.theme=learning.save.settings.theme||localStorage.getItem("fq_theme")||"light";learning.save.settings.theme=document.documentElement.dataset.theme;learning.persist();$("#themeToggle").textContent=document.documentElement.dataset.theme==="dark"?"☀":"☾";updateSkipLessonsButton();
{const firstPuzzle=buildRandomPuzzle();if(firstPuzzle)LEVELS[0]={...LEVELS[0],words:firstPuzzle.words,letters:firstPuzzle.letters.join("")}}
renderLevel();
$("#continuedEducation").onclick=showDashboard;
