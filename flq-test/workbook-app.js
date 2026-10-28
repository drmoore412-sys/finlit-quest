const WB_WORLD_ID = "credit-foundations";
const WB_WORKBOOKS = [...window.CREDIT_FOUNDATIONS_RUNTIME.workbooks].sort((a, b) => a.sequence - b.sequence);
const WB_BY_ID = Object.fromEntries(WB_WORKBOOKS.map(w => [w.id, w]));
const wbState = { current: null, lessonSteps: [], lessonStep: 0, flashcards: [], flashcardIndex: 0, matching: null, matched: new Set(), selectedLeft: null, quizQuestions: [], quizIndex: 0, mcAnswers: [], tfAnswers: [], answeredThisQuestion: false, lastView: "workbookMapView" };

function wbCompletedIds() {
  return WB_WORKBOOKS.filter(w => learning.workbookProgress(WB_WORLD_ID, w.id).status === "completed").map(w => w.id);
}

function wbShowView(id) {
  ["workbookMapView", "workbookLessonView", "workbookFlashcardView", "workbookMatchingView", "workbookQuizView", "workbookResultsView"].forEach(viewId => $(`#${viewId}`).classList.toggle("hidden", viewId !== id));
  wbState.lastView = id;
}

function openWorkbookWorld() {
  hideAllScreens();
  $("#workbookScreen").classList.remove("hidden");
  window.scrollTo(0, 0);
  wbRenderMap();
}

function wbBackHome() {
  if (wbState.lastView === "workbookMapView") {
    $("#workbookScreen").classList.add("hidden");
    showDashboard();
  } else {
    wbRenderMap();
  }
}

function wbRenderMap() {
  wbShowView("workbookMapView");
  $("#workbookHeaderXp").textContent = learning.save.player.xp;
  const completedIds = wbCompletedIds();
  const percent = FinLitWorkbookEngine.worldCompletionPercent(WB_WORKBOOKS, Object.fromEntries(WB_WORKBOOKS.map(w => [w.id, learning.workbookProgress(WB_WORLD_ID, w.id)])));
  $("#workbookWorldProgressText").textContent = `${percent}%`;
  $("#workbookWorldProgressBar").style.width = `${percent}%`;

  const list = $("#workbookList");
  list.innerHTML = "";
  WB_WORKBOOKS.forEach(workbook => {
    const progress = learning.workbookProgress(WB_WORLD_ID, workbook.id);
    const status = FinLitWorkbookEngine.workbookStatus(workbook, progress, completedIds);
    const button = document.createElement("button");
    button.className = `wb-item ${status}`;
    button.disabled = status === "locked";
    const statusLabel = { locked: `Locked · complete ${workbook.prerequisiteWorkbookId} first`, available: "Start", in_progress: `Best score ${progress.bestScorePercent}%`, completed: "Completed" }[status];
    button.innerHTML = `<span class="wb-item-index">${status === "completed" ? "✓" : workbook.sequence}</span><span class="wb-item-body"><strong>${workbook.title}</strong><span>${workbook.estimatedMinutes.min}-${workbook.estimatedMinutes.max} min · ${workbook.xp} XP</span></span><span class="wb-item-status">${statusLabel}</span>`;
    if (status !== "locked") button.onclick = () => wbOpenLesson(workbook);
    list.append(button);
  });
}

function wbOpenLesson(workbook) {
  wbState.current = workbook;
  wbState.lessonSteps = [
    { label: "Objective", heading: workbook.title, body: `<span class="wb-label">Learning objective</span><p>${workbook.learningObjective}</p>` },
    ...workbook.lesson.coreLesson.map((paragraph, i, all) => ({ label: "Core lesson", heading: workbook.title, body: `<span class="wb-label">Core lesson ${all.length > 1 ? `(${i + 1}/${all.length})` : ""}</span><p>${paragraph}</p>` })),
    { label: "Example", heading: workbook.title, body: `<span class="wb-label">Example</span><p>${workbook.lesson.example}</p><span class="wb-label">Non-example</span><p>${workbook.lesson.nonExample}</p>` },
    { label: "Watch out", heading: workbook.title, body: `<span class="wb-label">Common misconception</span><p>${workbook.lesson.commonMisconception}</p>` },
    { label: "Key takeaway", heading: workbook.title, body: `<span class="wb-label">Key takeaway</span><p>${workbook.lesson.keyTakeaway}</p>` },
  ];
  wbState.lessonStep = 0;
  wbShowView("workbookLessonView");
  $("#workbookLessonEyebrow").textContent = workbook.id;
  wbRenderLessonStep();
}

function wbRenderLessonStep() {
  const steps = wbState.lessonSteps, step = steps[wbState.lessonStep];
  $("#workbookLessonStepLabel").textContent = `${wbState.lessonStep + 1} / ${steps.length}`;
  $("#workbookLessonProgressBar").style.width = `${((wbState.lessonStep + 1) / steps.length) * 100}%`;
  $("#workbookLessonHeading").textContent = step.heading;
  $("#workbookLessonBody").innerHTML = step.body;
  $("#workbookLessonPrev").classList.toggle("hidden", wbState.lessonStep === 0);
  $("#workbookLessonNext").textContent = wbState.lessonStep === steps.length - 1 ? "Start flashcards →" : "Continue →";
}

function wbLessonNext() {
  if (wbState.lessonStep < wbState.lessonSteps.length - 1) { wbState.lessonStep++; wbRenderLessonStep(); }
  else wbOpenFlashcards();
}
function wbLessonPrev() { if (wbState.lessonStep > 0) { wbState.lessonStep--; wbRenderLessonStep(); } }

function wbOpenFlashcards() {
  wbState.flashcards = wbState.current.flashcards;
  wbState.flashcardIndex = 0;
  wbShowView("workbookFlashcardView");
  wbRenderFlashcard();
}
function wbRenderFlashcard() {
  const card = wbState.flashcards[wbState.flashcardIndex];
  $("#workbookFlashcardCount").textContent = `${wbState.flashcardIndex + 1} / ${wbState.flashcards.length}`;
  $("#workbookFlashcardProgressBar").style.width = `${((wbState.flashcardIndex + 1) / wbState.flashcards.length) * 100}%`;
  $("#workbookFlashcardFront").textContent = card.term;
  $("#workbookFlashcardBack").textContent = card.definition;
  $("#workbookFlashcardInner").classList.remove("flipped");
  $("#workbookFlashcardPrev").classList.toggle("hidden", wbState.flashcardIndex === 0);
  $("#workbookFlashcardNext").textContent = wbState.flashcardIndex === wbState.flashcards.length - 1 ? "Continue to practice →" : "Next →";
}
function wbFlipFlashcard() { $("#workbookFlashcardInner").classList.toggle("flipped"); }
function wbFlashcardNext() {
  if (wbState.flashcardIndex < wbState.flashcards.length - 1) { wbState.flashcardIndex++; wbRenderFlashcard(); }
  else wbOpenMatching();
}
function wbFlashcardPrev() { if (wbState.flashcardIndex > 0) { wbState.flashcardIndex--; wbRenderFlashcard(); } }

function wbOpenMatching() {
  wbState.matching = FinLitWorkbookEngine.buildMatchingRound(wbState.current);
  wbState.matched = new Set();
  wbState.selectedLeft = null;
  wbShowView("workbookMatchingView");
  $("#workbookMatchingContinue").classList.add("hidden");
  wbRenderMatching();
}
function wbRenderMatching() {
  const { lefts, rights } = wbState.matching;
  $("#workbookMatchingCount").textContent = `${wbState.matched.size} / ${lefts.length} matched`;
  const leftCol = $("#workbookMatchingLeft"), rightCol = $("#workbookMatchingRight");
  leftCol.innerHTML = ""; rightCol.innerHTML = "";
  lefts.forEach(item => {
    const button = document.createElement("button");
    const isMatched = wbState.matched.has(item.pairIndex);
    button.className = `wb-match-tile ${isMatched ? "matched" : ""} ${wbState.selectedLeft === item.id ? "selected" : ""}`;
    button.textContent = item.text;
    button.disabled = isMatched;
    button.onclick = () => { wbState.selectedLeft = item.id; wbRenderMatching(); };
    leftCol.append(button);
  });
  rights.forEach(item => {
    const button = document.createElement("button");
    const isMatched = wbState.matched.has(item.pairIndex);
    button.className = `wb-match-tile ${isMatched ? "matched" : ""}`;
    button.textContent = item.text;
    button.disabled = isMatched || !wbState.selectedLeft;
    button.onclick = () => wbMatchAttempt(item, button);
    rightCol.append(button);
  });
}
function wbMatchAttempt(rightItem, button) {
  const leftItem = wbState.matching.lefts.find(l => l.id === wbState.selectedLeft);
  if (!leftItem) return;
  if (leftItem.pairIndex === rightItem.pairIndex) {
    wbState.matched.add(rightItem.pairIndex);
    wbState.selectedLeft = null;
    wbRenderMatching();
    if (FinLitWorkbookEngine.isMatchingComplete(wbState.matching.lefts.length, wbState.matched.size)) {
      learning.recordWorkbookPractice(WB_WORLD_ID, wbState.current.id);
      $("#workbookMatchingContinue").classList.remove("hidden");
      toast("Practice complete");
    }
  } else {
    button.classList.add("wrong");
    setTimeout(() => button.classList.remove("wrong"), 300);
    wbState.selectedLeft = null;
    setTimeout(wbRenderMatching, 150);
  }
}

function wbOpenQuiz() {
  const workbook = wbState.current;
  wbState.quizQuestions = [
    ...workbook.assessment.multipleChoice.map(q => ({ type: "mc", question: q })),
    ...workbook.assessment.trueFalse.map(q => ({ type: "tf", question: q })),
  ];
  wbState.quizIndex = 0;
  wbState.mcAnswers = new Array(workbook.assessment.multipleChoice.length).fill(-1);
  wbState.tfAnswers = new Array(workbook.assessment.trueFalse.length).fill(null);
  wbShowView("workbookQuizView");
  $("#workbookQuizTotal").textContent = wbState.quizQuestions.length;
  wbRenderQuizQuestion();
}
function wbRenderQuizQuestion() {
  const item = wbState.quizQuestions[wbState.quizIndex];
  wbState.answeredThisQuestion = false;
  $("#workbookQuizIndex").textContent = wbState.quizIndex + 1;
  $("#workbookQuizProgressBar").style.width = `${((wbState.quizIndex + 1) / wbState.quizQuestions.length) * 100}%`;
  $("#workbookQuizPrompt").textContent = item.type === "mc" ? item.question.prompt : item.question.statement;
  $("#workbookQuizFeedback").classList.add("hidden");
  $("#workbookQuizNext").classList.add("hidden");
  const options = $("#workbookQuizOptions");
  options.innerHTML = "";
  if (item.type === "mc") {
    item.question.options.forEach((text, index) => {
      const button = document.createElement("button");
      button.textContent = text;
      button.onclick = () => wbAnswerMc(index, button);
      options.append(button);
    });
  } else {
    [["True", true], ["False", false]].forEach(([label, value]) => {
      const button = document.createElement("button");
      button.textContent = label;
      button.onclick = () => wbAnswerTf(value, button);
      options.append(button);
    });
  }
}
function wbAnswerMc(index, button) {
  if (wbState.answeredThisQuestion) return;
  wbState.answeredThisQuestion = true;
  const item = wbState.quizQuestions[wbState.quizIndex], correct = index === item.question.correctIndex;
  wbState.mcAnswers[FinLitWorkbookEngine.answerPositionForType(wbState.quizQuestions, wbState.quizIndex, "mc")] = index;
  wbShowQuizFeedback(correct, item.question.explanation, button, correct ? null : $$("#workbookQuizOptions button")[item.question.correctIndex]);
}
function wbAnswerTf(value, button) {
  if (wbState.answeredThisQuestion) return;
  wbState.answeredThisQuestion = true;
  const item = wbState.quizQuestions[wbState.quizIndex], correct = value === item.question.answer;
  const tfPosition = FinLitWorkbookEngine.answerPositionForType(wbState.quizQuestions, wbState.quizIndex, "tf");
  wbState.tfAnswers[tfPosition] = value;
  const correctButton = $$("#workbookQuizOptions button")[item.question.answer ? 0 : 1];
  wbShowQuizFeedback(correct, item.question.explanation, button, correct ? null : correctButton);
}
function wbShowQuizFeedback(correct, explanation, selectedButton, correctButton) {
  selectedButton.classList.add(correct ? "correct" : "incorrect");
  if (correctButton) correctButton.classList.add("correct");
  $$("#workbookQuizOptions button").forEach(b => b.disabled = true);
  const feedback = $("#workbookQuizFeedback");
  feedback.textContent = `${correct ? "Correct." : "Not quite."} ${explanation}`;
  feedback.classList.remove("hidden", "wrong");
  if (!correct) feedback.classList.add("wrong");
  $("#workbookQuizNext").textContent = wbState.quizIndex === wbState.quizQuestions.length - 1 ? "See results →" : "Next →";
  $("#workbookQuizNext").classList.remove("hidden");
}
function wbQuizNext() {
  if (wbState.quizIndex < wbState.quizQuestions.length - 1) { wbState.quizIndex++; wbRenderQuizQuestion(); }
  else wbFinishQuiz();
}

function wbFinishQuiz() {
  const workbook = wbState.current;
  const result = FinLitWorkbookEngine.scoreQuiz(workbook, wbState.mcAnswers, wbState.tfAnswers);
  const { xpGained } = learning.recordWorkbookAttempt(WB_WORLD_ID, workbook.id, { percent: result.percent, passed: result.passed, xpValue: workbook.xp });
  wbShowView("workbookResultsView");
  $("#workbookResultsHeadline").textContent = result.passed ? "Workbook complete" : "Not quite — review and retry";
  $("#workbookResultsScore").textContent = `You scored ${result.correct} / ${result.total} (${result.percent}%). Passing score is ${Math.round(workbook.masteryRule.passingScore * 100)}%.`;
  const burst = $("#workbookResultsXpBurst");
  burst.classList.toggle("hidden", xpGained <= 0);
  $("#workbookResultsXp").textContent = xpGained;
  const breakdown = $("#workbookResultsBreakdown");
  breakdown.innerHTML = "";
  [...result.mcResults, ...result.tfResults].filter(r => !r.correct).forEach(r => {
    const row = document.createElement("div");
    row.className = "wb-result-row miss";
    row.textContent = `${r.prompt || r.statement} — ${r.explanation}`;
    breakdown.append(row);
  });
  $("#workbookResultsRetry").classList.toggle("hidden", result.passed);
  $("#workbookResultsContinue").textContent = result.passed ? "Continue" : "Back to workbook map";
  if (result.passed) celebrate();
  $("#workbookHeaderXp").textContent = learning.save.player.xp;
}

$("#workbookBackHome").onclick = wbBackHome;
$("#workbookLessonNext").onclick = wbLessonNext;
$("#workbookLessonPrev").onclick = wbLessonPrev;
$("#workbookFlashcard").onclick = wbFlipFlashcard;
$("#workbookFlashcardNext").onclick = wbFlashcardNext;
$("#workbookFlashcardPrev").onclick = wbFlashcardPrev;
$("#workbookMatchingContinue").onclick = wbOpenQuiz;
$("#workbookQuizNext").onclick = wbQuizNext;
$("#workbookResultsRetry").onclick = wbOpenQuiz;
$("#workbookResultsContinue").onclick = wbRenderMap;

const wbJourneyNode = $$("#dashboardScreen .journey-node")[0];
if (wbJourneyNode) wbJourneyNode.onclick = () => openWorkbookWorld();
$("#workbookPlayGameButton").onclick = () => wgOpenWorld("credit");
