// Unified, data-driven word-game engine. One rendering/interaction implementation
// shared by every world — a world is just an id + vocabulary list. No puzzle code
// here should know whether it's running Crypto or Credit content.
//
// Scope note: this pass unifies the puzzle mechanic (crossword, wheel, puzzle
// generation, rewards) and the new visual design. Crypto's existing per-word
// lesson modal + SM-2 mastery review (app.js's showLearn/learning.review flow) is
// NOT wired into this engine yet — that is a richer per-world content type the
// Credit vocabulary doesn't have authored yet, and bolting it on partially here
// would be riskier than leaving it as a clearly separate follow-up.

const WG_WORLDS = {
  crypto: {
    key: "wg-crypto",
    icon: "🪙",
    name: "CRYPTO FOUNDATIONS",
    bankSize: 10,
    requiredPuzzles: 5,
    vocabulary: () => WORLD.terms.map(t => ({ word: t.word, definition: t.definition, termId: t.id })),
  },
  credit: {
    key: "wg-credit",
    icon: "🏦",
    name: "CREDIT FOUNDATIONS",
    bankSize: 10,
    requiredPuzzles: 5,
    vocabulary: () => window.CREDIT_GAME_TERMS.map(t => ({ word: t.word, definition: t.definition, termId: null })),
  },
};
// Fallback only — every world above defines its own requiredPuzzles. The engine
// never assumes 5; this is just what's used if a world config omits the field.
const WG_DEFAULT_REQUIRED_PUZZLES = 5;
const WG_DEFAULT_BANK_SIZE = 10;

const wgState = { worldId: "crypto", playthrough: [], playthroughIndex: 0, words: [], byWord: {}, found: new Set(), hints: new Set(), revealed: new Set(), selected: [], tries: {} };
const WG_LETTER_HINT_COST = 100;
// Sourced from learning-engine.js's economy config, not a separate literal —
// this is also what a new player's starting coin balance is derived from
// (playerDefaults()'s coins = DEFAULT_ECONOMY_CONFIG.startingCoins), so the
// two values can never drift apart.
const WG_FULL_REVEAL_COST = FinLitLearning.DEFAULT_ECONOMY_CONFIG.fullRevealCost;
let wgPointerDown = false, wgGestureLetters = 0;

function wgWorld() { return WG_WORLDS[wgState.worldId]; }
function wgProgress() {
  const key = wgWorld().key;
  if (!learning.save.worlds[key]) learning.save.worlds[key] = { solvedWords: [] };
  if (!learning.save.worlds[key].solvedWords) learning.save.worlds[key].solvedWords = [];
  return learning.save.worlds[key];
}

// Puzzle Bank: each world keeps a persisted bank of candidate puzzles (word
// combinations + wheel), sized per-world (WG_WORLDS[x].bankSize — not hardcoded
// to any one number). Each playthrough draws WG_WORLDS[x].requiredPuzzles unique
// puzzles from that bank using anti-repetition rules (src/puzzle-bank-engine.js),
// instead of generating one fully-random puzzle every time. Both numbers are
// per-world config — the engine never assumes any fixed bank size or playthrough
// length (10/5, 20/8, 50/10, 150/15 all work with zero code changes).
function wgBankState() {
  const state = wgProgress();
  if (!state.puzzleBank) state.puzzleBank = [];
  if (!state.puzzleHistory) state.puzzleHistory = {};
  if (!state.lastPlaythrough) state.lastPlaythrough = [];
  return state;
}
function wgEnsureBank() {
  const bankState = wgBankState();
  const size = wgWorld().bankSize || WG_DEFAULT_BANK_SIZE;
  if (bankState.puzzleBank.length < size) {
    const words = wgWorld().vocabulary().map(t => t.word);
    bankState.puzzleBank = FinLitPuzzleBank.buildBank(words, size, shuffled, FinLitGameEngine.wheelFor, bankState.puzzleBank);
    learning.persist();
  }
  return bankState.puzzleBank;
}

function wgOpenWorld(worldId) {
  wgState.worldId = worldId;
  const world = wgWorld();
  $("#dashboardScreen").classList.add("hidden");
  $("#playScreen").classList.add("hidden");
  $("#workbookScreen").classList.add("hidden");
  const creditScreen = $("#creditGameScreen"); if (creditScreen) creditScreen.classList.add("hidden");
  $("#worldGameScreen").classList.remove("hidden");
  $("#wgWorldIcon").textContent = world.icon;
  $("#wgWorldName").textContent = world.name;
  $("#wgWordsTotal").textContent = world.vocabulary().length;
  window.scrollTo(0, 0);
  wgStartPlaythrough();
  wgUpdateHeader();
}

function wgStartPlaythrough() {
  const bank = wgEnsureBank();
  const bankState = wgBankState();
  const requiredPuzzles = wgWorld().requiredPuzzles || WG_DEFAULT_REQUIRED_PUZZLES;
  wgState.playthrough = FinLitPuzzleBank.selectPlaythrough(bank, bankState.puzzleHistory, bankState.lastPlaythrough, requiredPuzzles, shuffled);
  wgState.playthroughIndex = 0;
  wgRenderPuzzle();
}

function wgRenderPuzzle() {
  const puzzle = wgState.playthrough[wgState.playthroughIndex];
  if (!puzzle) { toast("Couldn't build a puzzle — try again"); return; }
  wgState.words = puzzle.words;
  wgState.byWord = Object.fromEntries(wgWorld().vocabulary().map(t => [t.word, t]));
  wgState.found = new Set();
  wgState.hints = new Set();
  wgState.revealed = new Set();
  wgState.selected = [];
  wgState.tries = {};
  wgState.puzzleCoins = 0;
  wgState.puzzleXp = 0;
  wgRenderGrid();
  wgRenderWheel(shuffled(puzzle.letters));
  wgUpdateProgress();
  wgUpdateMission();
  wgClearSelection();
}

function wgHintPattern(word) { return [...word].map((letter, i) => wgIsLetterVisible(word, i) ? letter : "_").join(" "); }
function wgIsLetterVisible(word, index) {
  if (wgState.hints.has(`${word}:${index}`)) return true;
  const placements = FinLitGameEngine.layoutWords(wgState.words), target = placements.find(item => item.word === word);
  if (!target) return false;
  const row = target.r + (target.dir === "v" ? index : 0), column = target.c + (target.dir === "h" ? index : 0);
  return placements.some(item => wgState.found.has(item.word) && [...item.word].some((_, i) => item.r + (item.dir === "v" ? i : 0) === row && item.c + (item.dir === "h" ? i : 0) === column));
}

function wgRenderGrid() {
  const grid = $("#wgCrossword");
  grid.innerHTML = "";
  const placements = FinLitGameEngine.layoutWords(wgState.words);
  placements.forEach(p => p.word.split("").forEach((letter, i) => {
    const r = p.r + (p.dir === "v" ? i : 0), c = p.c + (p.dir === "h" ? i : 0), key = `${r}-${c}`;
    let cell = grid.querySelector(`[data-key="${key}"]`);
    if (!cell) { cell = document.createElement("div"); cell.className = "cell"; cell.dataset.key = key; cell.style.gridRow = r + 1; cell.style.gridColumn = c + 1; grid.append(cell); }
    cell.dataset.words = (cell.dataset.words || "") + ` ${p.word}`;
    cell.dataset.letter = letter;
    if (wgState.found.has(p.word)) { cell.textContent = letter; cell.classList.add("found"); }
    else if (wgState.hints.has(`${p.word}:${i}`)) { cell.textContent = letter; cell.classList.add("hinted"); }
  }));
  wgRenderDefinitionsList();
}

function wgRenderDefinitionsList() {
  const list = $("#wgDefinitionsList");
  list.innerHTML = "";
  wgState.words.forEach((word, i) => {
    const item = document.createElement("div");
    item.className = `clue ${wgState.found.has(word) ? "found" : ""}`;
    item.innerHTML = `<span class="clue-number">${wgState.found.has(word) ? "✓" : i + 1}</span><span>${wgState.byWord[word].definition}<span class="clue-answer">${wgState.found.has(word) ? word : wgHintPattern(word)}</span></span>`;
    list.append(item);
  });
}

function wgRenderWheel(letters) {
  const wheel = $("#wgWheel");
  wheel.innerHTML = "";
  letters.forEach((letter, i) => {
    const a = (Math.PI * 2 * i / letters.length) - Math.PI / 2, b = document.createElement("button");
    b.className = "letter"; b.textContent = letter; b.dataset.index = i;
    b.style.left = `${50 + 39 * Math.cos(a)}%`; b.style.top = `${50 + 39 * Math.sin(a)}%`;
    b.addEventListener("pointerdown", e => { e.preventDefault(); wgPointerDown = true; wgGestureLetters = 0; wgAddLetter(b); });
    b.addEventListener("pointerenter", () => { if (wgPointerDown) wgAddLetter(b); });
    wheel.append(b);
  });
}
document.addEventListener("pointerup", () => { if (wgPointerDown) { wgPointerDown = false; if (wgGestureLetters > 1) wgSubmitWord(); } });

function wgAddLetter(btn) {
  const idx = Number(btn.dataset.index);
  if (wgState.selected.includes(idx)) return;
  wgState.selected.push(idx);
  wgGestureLetters++;
  btn.classList.add("selected");
  wgUpdateSelection();
}
function wgUpdateSelection() {
  const letters = $$("#wgWheel .letter");
  $("#wgTraceLine").setAttribute("points", wgState.selected.map(i => { const b = letters[i]; return `${b.offsetLeft + 15},${b.offsetTop + 15}`; }).join(" "));
}
function wgClearSelection() {
  wgState.selected = [];
  $$("#wgWheel .letter").forEach(b => b.classList.remove("selected"));
  $("#wgTraceLine").setAttribute("points", "");
}
function wgSubmitWord() {
  const letters = $$("#wgWheel .letter"), word = wgState.selected.map(i => letters[i].textContent).join("");
  wgClearSelection();
  if (!word) return;
  wgState.tries[word] = (wgState.tries[word] || 0) + 1;
  if (wgState.found.has(word)) return toast("Already found");
  if (wgState.words.includes(word)) return wgFoundWord(word);
  toast("Not in this puzzle");
}

function wgRewardFor(word) { return { coins: word.length * 7, xp: Math.round(word.length * 1.5) }; }

function wgFoundWord(word) {
  wgState.found.add(word);
  const reward = wgRewardFor(word);
  wgState.puzzleCoins += reward.coins;
  wgState.puzzleXp += reward.xp;
  learning.save.player.coins = (learning.save.player.coins || 0) + reward.coins;
  learning.save.player.xp += reward.xp;
  learning.save.player.level = Math.floor(learning.save.player.xp / 250) + 1;
  const progress = wgProgress();
  if (!progress.solvedWords.includes(word)) progress.solvedWords.push(word);
  learning.touchActivity();
  learning.persist();
  const term = wgState.byWord[word];
  if (wgState.worldId === "crypto" && term.termId) learning.recordPuzzleSolved(term.termId, { solveTimeMs: 0 });
  wgRenderGrid();
  wgUpdateProgress();
  wgUpdateHeader();
  wgUpdateMission();
  celebrate();
  if (wgState.found.size === wgState.words.length) {
    const bankState = wgBankState();
    const currentPuzzleId = wgState.playthrough[wgState.playthroughIndex].id;
    bankState.puzzleHistory = FinLitPuzzleBank.recordPlaythrough(bankState.puzzleHistory, [currentPuzzleId], Date.now());
    learning.persist();
    wgShowPuzzleComplete();
  }
}

function wgShowPuzzleComplete() {
  $("#wgCompleteCoins").textContent = `+${wgState.puzzleCoins}`;
  $("#wgCompleteXp").textContent = `+${wgState.puzzleXp}`;
  $("#wgCompletePanel").classList.remove("hidden");
}
function wgContinueAfterComplete() {
  $("#wgCompletePanel").classList.add("hidden");
  wgState.playthroughIndex++;
  if (wgState.playthroughIndex < wgState.playthrough.length) {
    wgRenderPuzzle();
  } else {
    const bankState = wgBankState();
    bankState.lastPlaythrough = wgState.playthrough.map(p => p.id);
    learning.persist();
    wgStartPlaythrough();
  }
}

function wgUpdateProgress() {
  const total = wgWorld().vocabulary().length;
  const solved = wgProgress().solvedWords.length;
  $("#wgWordsSolved").textContent = solved;
  $("#wgWordsTotal").textContent = total;
  $("#wgWordsBar").style.width = `${Math.min(100, (solved / total) * 100)}%`;
}

function wgUpdateMission() {
  const nextWord = wgState.words.find(w => !wgState.found.has(w));
  if (!nextWord) return;
  const term = wgState.byWord[nextWord];
  const reward = wgRewardFor(nextWord);
  const revealed = wgState.revealed.has(nextWord);
  $("#wgMissionWord").textContent = revealed ? (nextWord.charAt(0) + nextWord.slice(1).toLowerCase()) : wgHintPattern(nextWord);
  $("#wgMissionDefinition").textContent = revealed ? term.definition : "Solve it on the wheel, or tap Hint below to reveal the word and definition.";
  $("#wgMissionCoins").textContent = `+${reward.coins}`;
  $("#wgMissionXp").textContent = `+${reward.xp}`;
  const remaining = wgState.words.length - wgState.found.size;
  $("#wgMissionCount").textContent = `${remaining} left`;
}

function wgUpdateHeader() {
  const player = learning.save.player;
  $("#wgCoins").textContent = player.coins || 0;
  $("#wgXp").textContent = player.xp;
  $("#wgGems").textContent = player.gems || 0;
  $("#wgLevelLabel").textContent = `LEVEL ${player.level}`;
  const xpIntoLevel = player.xp % 250;
  $("#wgLevelBar").style.width = `${(xpIntoLevel / 250) * 100}%`;
  $("#wgLevelXpText").textContent = `${xpIntoLevel} / 250 XP`;
  $("#wgStreak").textContent = player.streak;
  const todayCount = player.activityDates.includes(new Date().toISOString().slice(0, 10)) ? 1 : 0;
  const dailyGoal = 4;
  $("#wgDailyProgress").textContent = `${Math.min(todayCount, dailyGoal)} / ${dailyGoal}`;
  const dots = $("#wgDailyDots");
  dots.innerHTML = "";
  for (let i = 0; i < dailyGoal; i++) { const dot = document.createElement("span"); dot.className = i < todayCount ? "done" : ""; dots.append(dot); }
}

function wgShuffle() {
  const letters = shuffled($$("#wgWheel .letter").map(b => b.textContent));
  wgRenderWheel(letters);
  wgClearSelection();
}

function wgHint() {
  const cost = WG_LETTER_HINT_COST;
  const unfinished = wgState.words.filter(word => !wgState.found.has(word) && wgHintPattern(word).replace(/\s/g, "").includes("_"));
  if (!unfinished.length) return toast("Every available letter is already revealed");
  const word = unfinished[0];
  const index = [...word].findIndex((_, i) => !wgIsLetterVisible(word, i));
  if (index < 0) return toast("Every available letter is already revealed");
  if (!learning.spendCoins(cost)) return toast("Not enough coins for a hint");
  wgState.hints.add(`${word}:${index}`);
  wgRenderGrid();
  wgUpdateHeader();
  wgUpdateMission();
  toast(`Hint: ${word[index]} is letter ${index + 1} of a ${word.length}-letter word`);
}

function wgRevealFull() {
  const cost = WG_FULL_REVEAL_COST;
  const nextWord = wgState.words.find(w => !wgState.found.has(w));
  if (!nextWord) return;
  if (wgState.revealed.has(nextWord)) return toast("Already revealed");
  if (!learning.spendCoins(cost)) return toast(`Not enough coins — full reveal costs ${cost}`);
  wgState.revealed.add(nextWord);
  wgUpdateHeader();
  wgUpdateMission();
  toast("Word and definition revealed");
}

function wgShowDefinitions() { wgRenderDefinitionsList(); $("#wgDefinitionsPanel").classList.remove("hidden"); }
function wgHideDefinitions() { $("#wgDefinitionsPanel").classList.add("hidden"); }

$("#wgBack").onclick = showDashboard;
$("#wgBrandLogo").onclick = showDashboard;
$("#wgSettingsButton").onclick = toggleTheme;
$("#wgNavShuffle").onclick = wgShuffle;
$("#wgHintButton").onclick = wgHint;
$("#wgNavHint").onclick = wgRevealFull;
$("#wgDefinitionsButton").onclick = wgShowDefinitions;
$("#wgNavKnowledge").onclick = wgShowDefinitions;
$("#wgDefinitionsClose").onclick = wgHideDefinitions;
$("#wgCompleteContinue").onclick = wgContinueAfterComplete;
$("#wgNavJourney").onclick = showDashboard;
$("#wgNavPause").onclick = showDashboard;

$("#wgHintCost").textContent = WG_LETTER_HINT_COST;
$("#wgRevealCost").textContent = WG_FULL_REVEAL_COST;
wgOpenWorld("crypto");
