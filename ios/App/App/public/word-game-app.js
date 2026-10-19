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
    bankSize: 15,
    requiredPuzzles: 5,
    vocabulary: () => WORLD.terms.map(t => ({ word: t.word, definition: t.definition, termId: t.id })),
  },
  credit: {
    key: "wg-credit",
    icon: "🏦",
    name: "CREDIT FOUNDATIONS",
    bankSize: 15,
    requiredPuzzles: 5,
    vocabulary: () => window.CREDIT_GAME_TERMS.map(t => ({ word: t.word, definition: t.definition, termId: window.FINLIT_CREDIT_TERM_IDENTITIES.idForWord(t.word) })),
  },
  moneybasics: {
    key: "wg-moneybasics",
    icon: "💵",
    name: "MONEY BASICS",
    bankSize: 15,
    requiredPuzzles: 5,
    staticBank: () => window.MONEY_BASICS_PUZZLES,
    vocabulary: () => window.MONEY_BASICS_TERMS.map(t => ({ word: t.word, definition: t.definition, termId: t.id })),
  },
  banking: {
    key: "wg-banking",
    icon: "🏛️",
    name: "BANKING BASICS",
    bankSize: 15,
    requiredPuzzles: 5,
    staticBank: () => window.BANKING_BASICS_PUZZLES,
    vocabulary: () => window.BANKING_BASICS_TERMS.map(t => ({ word: t.word, definition: t.definition, termId: t.id })),
  },
  investing: {
    key: "wg-investing",
    icon: "📈",
    name: "INVESTING BASICS",
    bankSize: 15,
    requiredPuzzles: 5,
    staticBank: () => window.INVESTING_BASICS_PUZZLES,
    vocabulary: () => window.INVESTING_BASICS_TERMS.map(t => ({ word: t.word, definition: t.definition, termId: t.id })),
  },
  coins: {
    key: "wg-coins", icon: "🪙", name: "COINS & CURRENCY", bankSize: 15, requiredPuzzles: 5,
    approvedV3Bank: () => window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS.banks.coins,
    vocabulary: () => wgNewWorldVocabulary("coins"),
  },
  ai_technology: {
    key: "wg-ai-technology", icon: "🤖", name: "AI & TECHNOLOGY", bankSize: 15, requiredPuzzles: 5,
    approvedV3Bank: () => window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS.banks.ai_technology,
    vocabulary: () => wgNewWorldVocabulary("ai_technology"),
  },
  real_estate: {
    key: "wg-real-estate", icon: "🏠", name: "REAL ESTATE", bankSize: 15, requiredPuzzles: 5,
    approvedV3Bank: () => window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS.banks.real_estate,
    vocabulary: () => wgNewWorldVocabulary("real_estate"),
  },
  taxes: {
    key: "wg-taxes", icon: "🧾", name: "TAXES", bankSize: 15, requiredPuzzles: 5,
    approvedV3Bank: () => window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS.banks.taxes,
    vocabulary: () => wgNewWorldVocabulary("taxes"),
  },
  insurance: {
    key: "wg-insurance", icon: "🛡️", name: "INSURANCE & PROTECTION", bankSize: 15, requiredPuzzles: 5,
    approvedV3Bank: () => window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS.banks.insurance,
    vocabulary: () => wgNewWorldVocabulary("insurance"),
  },
  business: {
    key: "wg-business", icon: "💼", name: "BUSINESS & ENTREPRENEURSHIP", bankSize: 15, requiredPuzzles: 5,
    approvedV3Bank: () => window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS.banks.business,
    vocabulary: () => wgNewWorldVocabulary("business"),
  },
  social_media: {
    key: "wg-social-media", icon: "📱", name: "SOCIAL MEDIA & DIGITAL INCOME", bankSize: 15, requiredPuzzles: 5,
    approvedV3Bank: () => window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS.banks.social_media,
    vocabulary: () => wgNewWorldVocabulary("social_media"),
  },
  retirement: {
    key: "wg-retirement", icon: "🌅", name: "RETIREMENT & WEALTH PLANNING", bankSize: 15, requiredPuzzles: 5,
    approvedV3Bank: () => window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS.banks.retirement,
    vocabulary: () => wgNewWorldVocabulary("retirement"),
  },
};
// Fallback only — every world above defines its own requiredPuzzles. The engine
// never assumes 5; this is just what's used if a world config omits the field.
const WG_DEFAULT_REQUIRED_PUZZLES = 5;
const WG_GAMES_PER_LEVEL = 5;
const WG_LEVEL_COUNT = 3;
const WG_DEFAULT_BANK_SIZE = 10;
const WG_DAILY_PUZZLE_GOAL = WG_DEFAULT_REQUIRED_PUZZLES;
const WG_RUNTIME_VERSION = "schema-v4-three-levels-2026-10-19.2";
// The owner-approved 3-5 answer banks are the normal game. The anchor-only V2
// adapter remains available solely for migration/debugging with ?puzzles=legacy;
// it is never selected by an ordinary app or website launch.
const WG_LEGACY_DIAGNOSTIC_ENABLED = new URLSearchParams(window.location.search).get("puzzles") === "legacy";
const WG_V3_ENABLED = !WG_LEGACY_DIAGNOSTIC_ENABLED;
const wgV3Banks = new Map();
let wgCanonicalLibrary = null;
document.documentElement.dataset.finlitPuzzleMode = WG_V3_ENABLED ? "v3" : "legacy";

const wgState = { worldId: "crypto", levelNumber: null, playthrough: [], playthroughIndex: 0, puzzle: null, puzzleModel: null, placements: [], words: [], byWord: {}, found: new Set(), hints: new Set(), revealed: new Set(), selected: [], wheelTiles: [], tries: {} };
// Gameplay audio (src/game-audio.js): synthesized, one sound preference shared with the victory celebration, silent until the player's first gesture.
const wgAudio = FinLitAudio.create({
  window,
  isEnabled: () => FinLitVictory.loadSoundEnabled(localStorage),
  getVolume: () => FinLitVictory.loadSoundVolume(localStorage) / 100,
});
["pointerdown", "keydown", "touchend"].forEach(type => document.addEventListener(type, () => wgAudio.unlock(), { capture: true, passive: true }));
const WG_LETTER_HINT_COST = 100;
// Sourced from learning-engine.js's economy config, not a separate literal —
// this is also what a new player's starting coin balance is derived from
// (playerDefaults()'s coins = DEFAULT_ECONOMY_CONFIG.startingCoins), so the
// two values can never drift apart.
const WG_FULL_REVEAL_COST = FinLitLearning.DEFAULT_ECONOMY_CONFIG.fullRevealCost;
let wgPointerDown = false, wgPointerId = null, wgRetapLast = false, wgGestureLetters = 0, wgPointerPoint = null, wgFeedbackTimer = null, wgTileSequence = 0;

function wgGovernedHintCost(isTutorialLevel, governedCost) {
  return typeof FinLitPuzzleBank.hintCost === "function"
    ? FinLitPuzzleBank.hintCost(isTutorialLevel, governedCost)
    : isTutorialLevel ? 0 : governedCost;
}
function wgCanAffordHint(balance, cost) {
  return typeof FinLitPuzzleBank.canAffordHint === "function"
    ? FinLitPuzzleBank.canAffordHint(balance, cost)
    : cost === 0 || (Number.isFinite(balance) && balance >= cost);
}

function wgWorld() { return WG_WORLDS[wgState.worldId]; }
function wgIsFinancialCategory(category) { return FinLitPuzzleBank.isFinancialCategory ? FinLitPuzzleBank.isFinancialCategory(category) : category === "financial"; }
function wgNewWorldVocabulary(worldId) {
  return (window.FINLIT_2027_NEW_WORLD_TERMS?.terms || []).filter(term => term.worldId === worldId).map(term => ({word:term.word,definition:term.definition,termId:term.id}));
}
function wgAuthoritativeTermRegistry() {
  const vocabularies = Object.fromEntries(Object.entries(WG_WORLDS).map(([worldId, world]) => [worldId, world.vocabulary()]));
  const governed = window.FinLitV3Supplement ? FinLitV3Supplement.merge(vocabularies) : vocabularies;
  const registry = new Map();
  Object.entries(governed).forEach(([worldId, terms]) => terms.forEach(term => {
    const termId = term.termId || term.id;
    if (!termId) return;
    const existing = registry.get(termId);
    if (existing && (existing.word !== term.word || existing.definition !== term.definition)) throw new Error(`Conflicting governed term record: ${termId}`);
    registry.set(termId, { termId, word: term.word, definition: term.definition, worldId });
  }));
  (window.FINLIT_2027_NEW_WORLD_TERMS?.terms || []).forEach(term => {
    const existing=registry.get(term.id);
    if(existing&&(existing.word!==term.word||existing.definition!==term.definition))throw new Error(`Conflicting governed term record: ${term.id}`);
    registry.set(term.id,{termId:term.id,word:term.word,definition:term.definition,worldId:term.worldId});
  });
  return registry;
}
function wgWorldDisplayName(worldId) {
  return WG_WORLDS[worldId]?.name.replace(/\s+FOUNDATIONS$|\s+BASICS$/i, "") || worldId;
}
function wgProgress() {
  const key = wgWorld().key;
  if (!learning.save.worlds[key]) learning.save.worlds[key] = { solvedWords: [] };
  if (!learning.save.worlds[key].solvedWords) learning.save.worlds[key].solvedWords = [];
  if (!learning.save.worlds[key].rewardedSupportWords) learning.save.worlds[key].rewardedSupportWords = [];
  if (!learning.save.worlds[key].rewardedOrdinaryWords) learning.save.worlds[key].rewardedOrdinaryWords = [];
  if (!learning.save.worlds[key].rewardedFinancialTermIds) learning.save.worlds[key].rewardedFinancialTermIds = [];
  return learning.save.worlds[key];
}

// First-discovery rewards for financial terms are global: a term owned by another world
// can appear in this world's puzzle, so what the other worlds already paid counts too.
function wgRewardHistory(progress) {
  const worldProgress = Object.entries(learning.save.worlds || {}).filter(([key]) => key.startsWith("wg-")).map(([, value]) => value);
  return FinLitPuzzleBank.globalRewardHistory(progress, worldProgress);
}

function wgBuildCanonicalLibrary() {
  if (wgCanonicalLibrary) return wgCanonicalLibrary;
  const allVocabularies = Object.fromEntries(Object.keys(WG_WORLDS).map(id => [id, WG_WORLDS[id].vocabulary()]));
  const original = FinLitV3PuzzleSlate.createSlate(allVocabularies, FinLitGameEngine);
  const newer = Object.values(window.FINLIT_2027_NEW_WORLD_PUZZLE_BANKS?.banks || {}).flat();
  const puzzles = [...original, ...newer], library = new Map();
  puzzles.forEach(puzzle => {
    if (library.has(puzzle.id)) throw new Error(`Duplicate canonical puzzle id: ${puzzle.id}`);
    library.set(puzzle.id, puzzle);
  });
  const manifest = window.FINLIT_SHARED_PUZZLE_LIBRARY_2027;
  if (!manifest || manifest.uniquePuzzleCount !== library.size) throw new Error(`Shared puzzle manifest mismatch: expected ${manifest?.uniquePuzzleCount}, built ${library.size}`);
  const keyToWorld = Object.fromEntries(Object.entries(WG_WORLDS).map(([id, world]) => [world.key, id]));
  learning.save.canonicalPuzzleProgress = FinLitPuzzleBank.migrateCanonicalPuzzleProgress(learning.save.canonicalPuzzleProgress, puzzles, learning.save.worlds, keyToWorld);
  learning.registerTerms(FinLitV3PuzzleSlate.financialLearningTerms(puzzles));
  learning.persist();
  wgCanonicalLibrary = library;
  return library;
}

function wgCanonicalRecord(puzzle = wgState.puzzle) {
  if (!puzzle) return FinLitPuzzleBank.canonicalPuzzleRecord();
  const records = learning.save.canonicalPuzzleProgress || (learning.save.canonicalPuzzleProgress = {});
  records[puzzle.id] = FinLitPuzzleBank.canonicalPuzzleRecord(records[puzzle.id]);
  return records[puzzle.id];
}

function wgV3Bank(worldId) {
  if (!WG_V3_ENABLED || !window.FinLitV3PuzzleSlate) return null;
  if (!wgV3Banks.has(worldId)) {
    const manifest = window.FINLIT_SHARED_PUZZLE_LIBRARY_2027, library = wgBuildCanonicalLibrary();
    const references = manifest.worldPlacements[worldId] || [];
    const bank = references.map(reference => {
      const puzzle = library.get(reference.puzzleId);
      if (!puzzle) throw new Error(`Missing canonical puzzle definition: ${reference.puzzleId}`);
      return puzzle;
    });
    if (bank.length !== new Set(bank.map(puzzle => puzzle.id)).size) throw new Error(`Duplicate puzzle reference in ${worldId}`);
    wgV3Banks.set(worldId, bank);
  }
  return wgV3Banks.get(worldId);
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
function wgCloneBankPuzzle(puzzle) {
  if (FinLitPuzzleBank.isV3Puzzle?.(puzzle)) return {
    ...puzzle,wheelLetters:[...puzzle.wheelLetters],requiredWords:[...puzzle.requiredWords],bonusWords:[...puzzle.bonusWords],
    answers:puzzle.answers.map(answer=>({...answer})),layout:puzzle.layout.map(item=>({...item})),rewardPolicy:{financial:{...puzzle.rewardPolicy.financial},ordinary:{...puzzle.rewardPolicy.ordinary},bonus:{...puzzle.rewardPolicy.bonus}},
  };
  if (!FinLitPuzzleBank.isExpandedPuzzle(puzzle)) return {...puzzle, words:[...puzzle.words], letters:[...puzzle.letters]};
  return {
    ...puzzle,
    supportWords:[...puzzle.supportWords], bonusWords:[...(puzzle.bonusWords || [])], wheelLetters:[...puzzle.wheelLetters],
    wordCategories:{...(puzzle.wordCategories || {})},
    rewardPolicy:puzzle.rewardPolicy ? {financial:puzzle.rewardPolicy.financial, support:{...puzzle.rewardPolicy.support}, bonus:{...puzzle.rewardPolicy.bonus}} : puzzle.rewardPolicy,
  };
}
function wgPlayableBank(rawBank, worldId = wgState.worldId) {
  const v3 = wgV3Bank(worldId);
  if (v3) return v3.map(wgCloneBankPuzzle);
  const world = WG_WORLDS[worldId];
  return FinLitPuzzleBank.toAnchorPuzzles(rawBank, world.vocabulary(), worldId);
}
function wgEffectiveHistory(bank, worldId = wgState.worldId) {
  const saved = learning.save.worlds[WG_WORLDS[worldId].key] || {};
  return FinLitPuzzleBank.effectivePuzzleHistory(bank, saved.puzzleHistory, saved.solvedWords);
}
function wgEnsureBank() {
  const v3 = wgV3Bank(wgState.worldId);
  if (v3) return v3.map(wgCloneBankPuzzle);
  const bankState = wgBankState();
  const governedBank = wgWorld().staticBank && wgWorld().staticBank();
  if (governedBank && governedBank.length) {
    const governedIds = new Set(governedBank.map(p => p.id));
    if (bankState.puzzleBank.length !== governedBank.length || bankState.puzzleBank.some(p => !governedIds.has(p.id))) {
      bankState.puzzleBank = governedBank.map(wgCloneBankPuzzle);
      learning.persist();
    }
    return wgPlayableBank(bankState.puzzleBank);
  }
  const size = wgWorld().bankSize || WG_DEFAULT_BANK_SIZE;
  if (bankState.puzzleBank.length < size) {
    const words = wgWorld().vocabulary().map(t => t.word);
    bankState.puzzleBank = FinLitPuzzleBank.buildBank(words, size, shuffled, FinLitGameEngine.wheelFor, bankState.puzzleBank);
    learning.persist();
  }
  return wgPlayableBank(bankState.puzzleBank);
}

// Read-only per-world progress summary for the world-map screen. Unlike
// wgBankState/wgEnsureBank, this never mutates save state or depends on
// wgState.worldId — it needs to report on all five worlds at once, including
// ones the player has never opened. Governed-content worlds (static or approved V3 banks)
// always report a real, exact total. Dynamic-bank worlds (crypto/credit)
// only get a real total once they've actually been opened and their bank
// persisted — buildBank's word-coverage guarantee can legitimately grow the
// real bank well past its configured bankSize (confirmed live: Credit's
// bankSize is 10, its real built bank came out to 31), so reporting
// bankSize as a puzzle count before that bank exists would be a number this
// function can't stand behind — confirmed:false tells the caller not to
// display it as a real total.
function wgWorldProgress(worldId) {
  const world = WG_WORLDS[worldId];
  const saved = learning.save.worlds[world.key];
  const governedBank = world.staticBank && world.staticBank();
  const rawBank = governedBank && governedBank.length ? governedBank : (saved && saved.puzzleBank) || [];
  const bank = wgPlayableBank(rawBank, worldId);
  const confirmed = bank.length > 0;
  const total = bank.length || world.bankSize || WG_DEFAULT_BANK_SIZE;
  const history = FinLitPuzzleBank.effectivePuzzleHistory(bank, saved && saved.puzzleHistory, saved && saved.solvedWords);
  const completed = bank.length ? FinLitPuzzleBank.puzzleProgress(bank, history).completed : 0;
  return { completed, total, confirmed };
}

function wgOpenWorld(worldId) {
  $("#app").classList.remove("journey-mode");
  wgState.worldId = worldId;
  const world = wgWorld();
  hideAllScreens();
  $("#worldGameScreen").classList.remove("hidden");
  $("#wgWorldIcon").textContent = world.icon;
  $("#wgWorldName").textContent = world.name;
  window.scrollTo(0, 0);
  wgShowLevelSelect();
  wgUpdateHeader();
}

function wgShowLevelSelect() {
  wgSkipVictory?.();
  $("#wgCompletePanel").classList.add("hidden");
  $("#wgDefinitionsPanel").classList.add("hidden");
  $("#wgPuzzleExperience").classList.add("hidden");
  $("#wgLevelSelect").classList.remove("hidden");
  $("#wgPuzzleTitle").textContent = "Choose a Level";
  wgState.levelNumber = null;
  wgUpdateProgress();
  wgRenderLevelSelect();
  window.scrollTo(0, 0);
}

function wgRenderLevelSelect() {
  const bank = wgEnsureBank();
  const history = wgEffectiveHistory(bank);
  const levels = FinLitPuzzleBank.puzzleLevels(bank, WG_GAMES_PER_LEVEL), list = $("#wgLevelList");
  list.innerHTML = "";
  levels.slice(0, WG_LEVEL_COUNT).forEach((puzzles, levelIndex) => {
    const levelNumber = levelIndex + 1, completed = puzzles.filter(puzzle => history[puzzle.id]?.timesPlayed > 0).length;
    const card = document.createElement("article");
    card.className = "wg-level-card";
    card.innerHTML = `<div class="wg-level-card-header"><span class="wg-level-badge">${levelNumber}</span><div class="wg-level-card-copy"><h3>Level ${levelNumber}</h3><p>${levelNumber === 1 ? "Tutorial · unlimited free hints" : levelNumber === 2 ? "Build confidence · normal hint pricing" : "Apply your knowledge · normal hint pricing"}</p></div><span class="wg-level-card-status">${completed} / ${puzzles.length}</span></div>`;
    const games = document.createElement("div");
    games.className = "wg-game-list";
    games.setAttribute("aria-label", `Level ${levelNumber} games`);
    puzzles.forEach((puzzle, gameIndex) => {
      const done = Boolean(history[puzzle.id]?.timesPlayed), button = document.createElement("button");
      button.type = "button";
      button.className = `wg-game-button${done ? " is-complete" : ""}${!done && gameIndex === puzzles.findIndex(item => !history[item.id]?.timesPlayed) ? " is-current" : ""}`;
      button.setAttribute("aria-label", `Level ${levelNumber}, Game ${gameIndex + 1}${done ? ", completed" : ""}`);
      button.innerHTML = `<span>${done ? "✓" : gameIndex + 1}</span><small>GAME ${gameIndex + 1}</small>`;
      button.onclick = () => wgStartLevel(levelNumber, gameIndex);
      games.append(button);
    });
    card.append(games);
    list.append(card);
  });
}

function wgStartLevel(levelNumber, gameIndex = 0) {
  const bank = wgEnsureBank(), levels = FinLitPuzzleBank.puzzleLevels(bank, WG_GAMES_PER_LEVEL), level = levels[levelNumber - 1];
  if (!level || !level[gameIndex]) return toast("That puzzle is not available");
  wgState.levelNumber = levelNumber;
  wgState.playthrough = level;
  wgState.playthroughIndex = gameIndex;
  $("#wgLevelSelect").classList.add("hidden");
  $("#wgPuzzleExperience").classList.remove("hidden");
  wgRenderPuzzle();
  window.scrollTo(0, 0);
}

// Compatibility entry point retained for callers that still request the old
// five-game session. It now opens a deterministic visible level, never a
// random subset of the 15-puzzle bank.
function wgStartPlaythrough(levelNumber = 1, gameIndex = 0) {
  return wgStartLevel(levelNumber, gameIndex);
}

function wgBackFromWorldGame() {
  if (!$("#wgPuzzleExperience").classList.contains("hidden")) {
    wgShowLevelSelect();
  } else {
    showWorldSelect();
  }
}

function wgIsTutorialLevel() {
  return wgState.levelNumber === 1;
}

function wgRenderPuzzle() {
  const puzzle = wgState.playthrough[wgState.playthroughIndex];
  if (!puzzle) { toast("Couldn't build a puzzle — try again"); return; }
  const model = FinLitPuzzleBank.puzzleModel(puzzle);
  const isV3 = Boolean(FinLitPuzzleBank.isV3Puzzle?.(puzzle));
  const strictLayout = model.expanded ? FinLitGameEngine.solveCrossword(model.words) : null;
  if (model.expanded && !strictLayout.ok) {
    console.error("Expanded crossword rejected", puzzle.id, strictLayout.reason);
    toast("This crossword could not be laid out safely");
    return;
  }
  const selectedLayout = isV3 ? puzzle.layout?.map(item=>({...item})) : model.expanded ? strictLayout.placements : FinLitGameEngine.layoutWords(model.words);
  const renderedWords = new Set((selectedLayout || []).map(item=>item.word));
  const storedLayoutValidation = isV3 ? FinLitGameEngine.validateCrosswordLayout(model.words, selectedLayout || []) : {valid:true,errors:[]};
  if (isV3 && (model.words.length < 3 || model.words.length > 5 || renderedWords.size !== model.words.length || model.words.some(word=>!renderedWords.has(word)) || !storedLayoutValidation.valid)) {
    console.error("V3 crossword rejected before rendering", puzzle.id, storedLayoutValidation.errors);
    toast("This V3 crossword is incomplete and cannot be displayed");
    return;
  }
  const composition = isV3 && window.FinLitV3PuzzleSlate?.validateComposition ? FinLitV3PuzzleSlate.validateComposition(puzzle, FinLitGameEngine) : null;
  document.documentElement.dataset.finlitComposition = composition ? (composition.valid ? "compliant" : "pending-approval") : "legacy";
  if (composition && !composition.valid) console.warn("V3 puzzle does not yet meet the approved composition rules (pending owner approval)", puzzle.id, composition.errors);
  wgState.composition = composition;
  wgState.puzzle = puzzle;
  wgState.puzzleModel = model;
  wgState.words = model.words;
  wgState.placements = selectedLayout;
  wgState.byWord = Object.fromEntries(wgWorld().vocabulary().map(t => [t.word, t]));
  (model.answers || []).forEach(answer => { wgState.byWord[answer.word] = {...wgState.byWord[answer.word], ...answer}; });
  wgState.found = new Set();
  wgState.foundBonus = new Set();
  wgState.hints = new Set();
  wgState.revealed = new Set();
  wgState.selected = [];
  wgState.tries = {};
  wgState.puzzleCoins = 0;
  wgState.puzzleXp = 0;
  // Canonical replay detection follows the permanent puzzle id across worlds.
  // World-specific puzzleHistory still controls curriculum progress, but cannot
  // turn the same puzzle into a second first-completion celebration or payout.
  wgState.completedBefore = wgCanonicalRecord(puzzle).timesCompleted > 0;
  wgState.victoryShown = false;
  $("#wgPuzzleTitle").textContent = `Level ${wgState.levelNumber} · Game ${wgState.playthroughIndex + 1}`;
  wgRenderGrid();
  wgRenderWheel(shuffled(model.letters));
  wgUpdateProgress();
  wgUpdateMission();
  wgUpdateAssistUi();
  wgClearSelection();
  document.documentElement.dataset.finlitRuntime = WG_RUNTIME_VERSION;
  document.documentElement.dataset.finlitPuzzleMode = WG_V3_ENABLED ? "v3" : "legacy";
  console.info("FinLit Quest puzzle loaded", wgPuzzleDiagnostic());
}

function wgPuzzleDiagnostic() {
  const model = wgState.puzzleModel, puzzle = wgState.puzzle;
  const boundaryCheck = model ? FinLitGameEngine.validateCrosswordLayout(model.words, wgState.placements) : null;
  return {
    runtimeVersion:WG_RUNTIME_VERSION,puzzleMode:WG_V3_ENABLED?"v3":"legacy",
    scriptUrl:document.querySelector('script[src*="word-game-app.js"]')?.src || null,
    worldId:wgState.worldId,puzzleId:puzzle?.id || null,sourcePuzzleIds:puzzle?.sourcePuzzleIds || [],
    anchor:model?.anchorWord || null,requiredAnswers:model?.words || [],wheelLetters:model?.letters || [],
    contentRevision:puzzle?.contentRevision||null,answerCategories:model?.answers?.map(answer=>({word:answer.word,category:answer.category,termId:answer.termId}))||[],
    contentReviewRequired:Boolean(puzzle?.contentReviewRequired),contentStatus:puzzle?.contentStatus || "approved",
    composition:wgState.composition?{valid:wgState.composition.valid,errors:wgState.composition.errors,counts:wgState.composition.counts}:null,
    renderedAnswerCount:new Set((wgState.placements||[]).map(item=>item.word)).size,
    renderedAnswers:[...new Set((wgState.placements||[]).map(item=>item.word))],
    boundaryValid:boundaryCheck?.valid ?? null,boundaryErrors:boundaryCheck?.errors || [],
  };
}
function wgPuzzleBankDiagnostic(worldId = wgState.worldId) {
  const world = WG_WORLDS[worldId], saved = learning.save.worlds[world.key];
  const governedBank = world.staticBank && world.staticBank();
  const rawBank = governedBank && governedBank.length ? governedBank : (saved?.puzzleBank || []);
  return wgPlayableBank(rawBank, worldId).map(puzzle => {
    const model = FinLitPuzzleBank.puzzleModel(puzzle), layout = FinLitGameEngine.solveCrossword(model.words);
    return {
      puzzleId:puzzle.id,sourcePuzzleIds:puzzle.sourcePuzzleIds || [],anchor:model.anchorWord,
      requiredAnswers:model.words,wheelLetters:model.letters,
      boundaryValid:layout.ok && FinLitGameEngine.validateCrosswordLayout(model.words, layout.placements).valid,
      contentRevision:puzzle.contentRevision||null,answerCategories:model.answers?.map(answer=>({word:answer.word,category:answer.category,termId:answer.termId}))||[],
      contentReviewRequired:Boolean(puzzle.contentReviewRequired),contentStatus:puzzle.contentStatus || "approved",
    };
  });
}
window.finLitPuzzleDiagnostic = wgPuzzleDiagnostic;
window.finLitPuzzleBankDiagnostic = wgPuzzleBankDiagnostic;

function wgLayout() { return wgState.placements || []; }

function wgHintPattern(word) { return [...word].map((letter, i) => wgIsLetterVisible(word, i) ? letter : "_").join(" "); }
function wgIsLetterVisible(word, index) {
  if (wgState.hints.has(`${word}:${index}`)) return true;
  const placements = wgLayout(), target = placements.find(item => item.word === word);
  if (!target) return false;
  const row = target.r + (target.dir === "v" ? index : 0), column = target.c + (target.dir === "h" ? index : 0);
  return placements.some(item => wgState.found.has(item.word) && [...item.word].some((_, i) => item.r + (item.dir === "v" ? i : 0) === row && item.c + (item.dir === "h" ? i : 0) === column));
}

function wgRenderGrid() {
  const grid = $("#wgCrossword");
  grid.innerHTML = "";
  const placements = wgLayout();
  let maxRow = 0, maxColumn = 0;
  placements.forEach(p => p.word.split("").forEach((letter, i) => {
    const r = p.r + (p.dir === "v" ? i : 0), c = p.c + (p.dir === "h" ? i : 0), key = `${r}-${c}`;
    maxRow = Math.max(maxRow, r); maxColumn = Math.max(maxColumn, c);
    let cell = grid.querySelector(`[data-key="${key}"]`);
    if (!cell) { cell = document.createElement("div"); cell.className = "cell"; cell.setAttribute("role", "gridcell"); cell.dataset.key = key; cell.style.gridRow = r + 1; cell.style.gridColumn = c + 1; grid.append(cell); }
    cell.dataset.words = (cell.dataset.words || "") + ` ${p.word}`;
    cell.dataset.letter = letter;
    if (wgState.found.has(p.word)) {
      cell.textContent = letter; cell.classList.add("found"); cell.setAttribute("aria-label", letter);
      if (wgState.lastFoundWord === p.word) { cell.classList.add("just-found"); cell.style.animationDelay = `${i * 38}ms`; }
    }
    else if (wgState.hints.has(`${p.word}:${i}`)) { cell.textContent = letter; cell.classList.add("hinted"); }
  }));
  grid.style.setProperty("--wg-grid-cols", maxColumn + 1);
  grid.style.setProperty("--wg-grid-rows", maxRow + 1);
  grid.style.setProperty("--wg-grid-max-width", `${(maxColumn + 1) * 42 + maxColumn * 4}px`);
  grid.setAttribute("aria-colcount", maxColumn + 1); grid.setAttribute("aria-rowcount", maxRow + 1);
  wgState.lastFoundWord = null;
  wgRenderDefinitionsList();
}

function wgRenderDefinitionsList() {
  const list = $("#wgDefinitionsList");
  list.innerHTML = "";
  wgState.words.forEach((word, i) => {
    const item = document.createElement("div");
    item.className = `clue ${wgState.found.has(word) ? "found" : ""}`;
    const answer = wgState.puzzleModel.answers?.find(item=>item.word===word),financial=answer?wgIsFinancialCategory(answer.category):(!wgState.puzzleModel.expanded||word===wgState.puzzleModel.anchorWord),presentation=FinLitPuzzleBank.answerPresentation?.(answer||(!financial?{word,category:"support"}:null));
    const label = financial
      ? (answer?.definition || wgState.byWord[word]?.definition || wgState.puzzleModel.definition)
      : `<strong class="wg-non-financial-heading">${presentation.heading}</strong><span class="wg-non-financial-instruction">${presentation.instruction}</span><span class="wg-non-financial-reward">${presentation.reward}</span>`;
    item.innerHTML = `<span class="clue-number">${wgState.found.has(word) ? "✓" : i + 1}</span><span>${label}<span class="clue-answer">${wgState.found.has(word) ? word : wgHintPattern(word)}</span></span>`;
    if(presentation)item.setAttribute("aria-label",`${wgState.found.has(word)?"Found. ":""}${presentation.accessibilityLabel}`);
    list.append(item);
  });
}

function wgRenderWheel(letters) {
  const wheel = $("#wgWheel");
  wheel.innerHTML = "";
  const totals = letters.reduce((counts, letter) => ({...counts, [letter]:(counts[letter] || 0) + 1}), {});
  const seen = {};
  wgState.wheelTiles = letters.map(letter => ({id:`wg-tile-${++wgTileSequence}`, letter}));
  wgState.wheelTiles.forEach(tile => {
    seen[tile.letter] = (seen[tile.letter] || 0) + 1;
    const b = document.createElement("button");
    b.type = "button"; b.className = "letter"; b.textContent = tile.letter; b.dataset.tileId = tile.id;
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", totals[tile.letter] > 1 ? `${tile.letter}, ${seen[tile.letter]} of ${totals[tile.letter]}` : tile.letter);
    wheel.append(b);
  });
  wgPositionWheelTiles(false);
  wgClearSelection();
}

function wgPositionWheelTiles(animate = true) {
  const positions = FinLitWheelInteraction.positionsFor(wgState.wheelTiles.length);
  wgState.wheelTiles.forEach((tile, i) => {
    const button = document.querySelector(`#wgWheel .letter[data-tile-id="${tile.id}"]`);
    if (!button) return;
    button.style.left = `${positions[i].x * 100}%`;
    button.style.top = `${positions[i].y * 100}%`;
    button.style.setProperty("--wg-shuffle-delay", `${i * 18}ms`);
    button.classList.toggle("repositioning", animate);
  });
  if (animate) setTimeout(() => $$("#wgWheel .letter").forEach(button => button.classList.remove("repositioning")), 520);
  requestAnimationFrame(() => wgUpdateSelection());
}

function wgTileForButton(button) { return wgState.wheelTiles.find(tile => tile.id === button?.dataset.tileId); }
function wgSelectedWord() { return FinLitWheelInteraction.wordFor(wgState.selected, wgState.wheelTiles); }
// Shared word-validation context: the current wheel (for global bonus words such as DUE) and the bonus words already found.
function wgWordOptions() { return { wheelLetters: wgState.puzzleModel ? wgState.puzzleModel.letters : [], foundBonus: wgState.foundBonus }; }
function wgCanSubmitTapWord(word) {
  return FinLitWheelInteraction.canSubmitTapWord(word, wgState.words, wgState.found, wgWordOptions());
}
function wgHitTestLetter(clientX, clientY) {
  let closest = null, closestDistance = Infinity;
  $$("#wgWheel .letter").forEach(button => {
    const rect = button.getBoundingClientRect(), x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - x, clientY - y);
    if (distance <= Math.max(rect.width, rect.height) * .6 && distance < closestDistance) { closest = button; closestDistance = distance; }
  });
  return closest;
}

function wgBeginPointer(e) {
  if (e.button !== undefined && e.button !== 0) return;
  const button = e.target.closest?.(".letter") || wgHitTestLetter(e.clientX, e.clientY);
  if (!button) return;
  e.preventDefault();
  wgPointerDown = true; wgPointerId = e.pointerId; wgGestureLetters = 0; wgPointerPoint = {x:e.clientX, y:e.clientY};
  // Pressing the tile that is already the last selection is a "confirm" tap (see FinLitWheelInteraction.shouldSubmitOnRetap).
  wgRetapLast = Boolean(wgState.selected.length) && button.dataset.tileId === wgState.selected.at(-1);
  $("#wgWheel").setPointerCapture?.(e.pointerId);
  wgAddLetter(button);
}
function wgMovePointer(e) {
  if (!wgPointerDown || e.pointerId !== wgPointerId) return;
  e.preventDefault();
  wgPointerPoint = {x:e.clientX, y:e.clientY};
  const button = wgHitTestLetter(e.clientX, e.clientY);
  if (button) wgAddLetter(button); else wgUpdateSelection();
}
function wgEndPointer(e) {
  if (!wgPointerDown || e.pointerId !== wgPointerId) return;
  const shouldSubmit = wgGestureLetters > 1, retappedLast = wgRetapLast;
  wgResetPointer();
  if (shouldSubmit) wgSubmitWord();
  else {
    const word = wgSelectedWord();
    if (wgCanSubmitTapWord(word) || FinLitWheelInteraction.shouldSubmitOnRetap(retappedLast, word, wgState.words, wgState.found, wgWordOptions())) wgSubmitWord(); else wgUpdateSelection();
  }
}
function wgCancelPointer() {
  if (!wgPointerDown) return;
  wgResetPointer();
  wgClearSelection();
  wgShowWordFeedback("Selection cancelled", "cancelled");
}
function wgResetPointer() {
  const pointerId = wgPointerId;
  wgPointerDown = false; wgPointerId = null; wgRetapLast = false; wgGestureLetters = 0; wgPointerPoint = null;
  if (pointerId !== null) { try { $("#wgWheel").releasePointerCapture?.(pointerId); } catch (_) {} }
  wgUpdateSelection();
}

function wgAddLetter(btn) {
  const tile = wgTileForButton(btn);
  if (!tile) return;
  const transition = FinLitWheelInteraction.transitionSelection(wgState.selected, tile.id);
  if (transition.action === "ignored") return;
  wgState.selected = transition.selected;
  if (transition.action === "added") { wgGestureLetters++; wgAudio.letter(wgState.selected.length); }
  wgUpdateSelection();
}
function wgUpdateSelection() {
  const buttons = $$("#wgWheel .letter"), selected = new Set(wgState.selected);
  buttons.forEach(button => { const active = selected.has(button.dataset.tileId); button.classList.toggle("selected", active); button.setAttribute("aria-pressed", String(active)); });
  const word = wgSelectedWord();
  if (word) {
    clearTimeout(wgFeedbackTimer);
    // While a finger is down (dragging) lifting off the last letter submits, so the retap hint only applies to tapped words.
    const deferred = !wgPointerDown && FinLitWheelInteraction.isDeferredTarget(word, wgState.words, wgState.found);
    $("#wgWordReadout").textContent = deferred ? `${word} — tap the last letter again to submit` : word;
    $("#wgWordReadout").className = deferred ? "wg-word-readout building pending" : "wg-word-readout building";
  }
  $("#wgClearSelection").classList.toggle("is-visible", !!word);
  const svg = $("#wgTrace"), svgRect = svg.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${svgRect.width || 1} ${svgRect.height || 1}`);
  const points = wgState.selected.map(id => {
    const button = buttons.find(item => item.dataset.tileId === id), rect = button?.getBoundingClientRect();
    return rect ? `${rect.left + rect.width / 2 - svgRect.left},${rect.top + rect.height / 2 - svgRect.top}` : "";
  }).filter(Boolean);
  if (wgPointerDown && wgPointerPoint) points.push(`${wgPointerPoint.x - svgRect.left},${wgPointerPoint.y - svgRect.top}`);
  const value = points.join(" ");
  $("#wgTraceLine").setAttribute("points", value); $("#wgTraceShadow").setAttribute("points", value);
}
function wgClearSelection({preserveReadout = false} = {}) {
  wgState.selected = [];
  $$("#wgWheel .letter").forEach(b => { b.classList.remove("selected"); b.setAttribute("aria-pressed", "false"); });
  $("#wgTraceLine").setAttribute("points", ""); $("#wgTraceShadow").setAttribute("points", "");
  $("#wgClearSelection").classList.remove("is-visible");
  if (!preserveReadout) { $("#wgWordReadout").textContent = "Swipe to make a word"; $("#wgWordReadout").className = "wg-word-readout"; }
}
function wgShowWordFeedback(message, status) {
  clearTimeout(wgFeedbackTimer);
  const readout = $("#wgWordReadout");
  readout.textContent = message; readout.className = `wg-word-readout ${status}`;
  wgFeedbackTimer = setTimeout(() => { if (!wgState.selected.length) { readout.textContent = "Swipe to make a word"; readout.className = "wg-word-readout"; } }, 950);
}
function wgSubmitWord() {
  const word = wgSelectedWord(), result = FinLitWheelInteraction.classifyWord(word, wgState.words, wgState.found, wgWordOptions());
  wgClearSelection({preserveReadout:true});
  if (result.status === "empty") return wgClearSelection();
  wgState.tries[word] = (wgState.tries[word] || 0) + 1;
  if (result.status === "duplicate") { wgShowWordFeedback(word, "duplicate"); wgAudio.duplicate(); return toast("Already found"); }
  if (result.status === "target") { wgShowWordFeedback(word, "correct"); return wgFoundWord(word); }
  if (result.status === "bonus") {
    // Optional bonus word (e.g. DUE): zero coins, zero XP, not saved, not part of completion (wgState.found is untouched).
    wgState.foundBonus.add(word);
    wgShowWordFeedback(word, "duplicate");
    wgAudio.duplicate();
    return toast("Bonus word — no coins or XP");
  }
  wgShowWordFeedback(word, "invalid");
  wgAudio.wrong();
  toast("Not in this puzzle");
}

function wgFoundWord(word) {
  wgState.found.add(word);
  wgState.lastFoundWord = word;
  const progress = wgProgress();
  const canonical = wgCanonicalRecord();
  const reward = FinLitPuzzleBank.canonicalAnswerReward(wgState.puzzle, word, wgRewardHistory(progress), canonical);
  if (reward.isNewSolve) {
    wgState.puzzleCoins += reward.coins;
    wgState.puzzleXp += reward.xp;
    learning.save.player.coins = (learning.save.player.coins || 0) + reward.coins;
    learning.save.player.xp += reward.xp;
    learning.save.player.level = FinLitLearning.levelForXp(learning.save.player.xp);
    progress[reward.historyKey].push(word);
    if (reward.termId && !progress.rewardedFinancialTermIds.includes(reward.termId)) progress.rewardedFinancialTermIds.push(reward.termId);
  }
  learning.save.canonicalPuzzleProgress[wgState.puzzle.id] = FinLitPuzzleBank.recordCanonicalAnswer(canonical, word);
  const newAchievements = learning.touchActivity();
  learning.persist();
  newAchievements.forEach(a => toast(`${a.title} unlocked: +${a.xp} XP`));
  const term = wgState.byWord[word],termId=reward.termId||term?.termId||term?.id;
  if (wgIsFinancialCategory(reward.category) && termId && (FinLitPuzzleBank.isV3Puzzle?.(wgState.puzzle) || wgState.worldId === "crypto")) learning.recordPuzzleSolved(termId, { solveTimeMs: 0 });
  wgRenderGrid();
  wgUpdateProgress();
  wgUpdateHeader();
  wgUpdateMission();
  wgPlayFoundSound(word, reward);
  wgCelebrateFinancialTerm(reward);
  if (wgState.found.size < wgState.words.length) celebrate();
  if (wgState.found.size === wgState.words.length) {
    const bankState = wgBankState();
    const currentPuzzleId = wgState.playthrough[wgState.playthroughIndex].id;
    const completedAt = Date.now();
    bankState.puzzleHistory = FinLitPuzzleBank.recordPlaythrough(bankState.puzzleHistory, [currentPuzzleId], completedAt);
    learning.save.canonicalPuzzleProgress[currentPuzzleId] = FinLitPuzzleBank.recordCanonicalCompletion(learning.save.canonicalPuzzleProgress[currentPuzzleId], wgState.worldId, completedAt);
    learning.persist();
    wgUpdateHeader();
    wgUpdateProgress();
    wgUpdateAssistUi();
    wgShowPuzzleComplete();
  }
}

// Sound tier for a correct word (presentation only; it never changes a reward). A jackpot only plays in a puzzle that is not a replay:
//   last word of a new completion -> the grand jackpot, started once by wgStartVictory (so the key term as the last word never plays a mini first)
//   key financial term            -> mini jackpot
//   other financial word          -> financial chime;  ordinary word -> confirmation
function wgPlayFoundSound(word, reward) {
  const complete = wgState.found.size === wgState.words.length, fresh = !wgState.completedBefore;
  if (complete && fresh) return;
  if (fresh && word === wgState.puzzleModel.anchorWord) {
    wgAudio.miniJackpot();
    toast(`Key term found: ${word}${reward.coins ? ` · +${reward.coins} coins` : ""}`);
    return;
  }
  wgAudio.correct(wgIsFinancialCategory(reward.category) ? "financial" : "ordinary");
}

// A small coin flight marks a newly rewarded financial concept. The final word
// is excluded because the full puzzle jackpot immediately supplies the larger
// coin celebration. This function only reads the reward already granted above.
function wgCelebrateFinancialTerm(reward) {
  const completesPuzzle = wgState.found.size === wgState.words.length;
  if (completesPuzzle || !reward.isNewSolve || !wgIsFinancialCategory(reward.category) || reward.coins <= 0) return;
  wgTermVictory.start({
    kind: "term", newlySolved: true, coins: reward.coins,
    from: $("#wgCrossword"), to: document.querySelector(".wg-currency"),
  });
}

function wgShowPuzzleComplete() {
  const registry = wgAuthoritativeTermRegistry();
  const learningSummary = FinLitPuzzleBank.completionLearningSummary(wgState.puzzle, termId => registry.get(termId));
  const list = $("#wgCompleteTerms"), issueList = $("#wgCompleteReferenceIssues");
  list.innerHTML = "";
  issueList.innerHTML = "";
  learningSummary.terms.forEach(term => {
    const item = document.createElement("div");
    item.className = "wg-complete-term";
    const heading = document.createElement("h4"), definition = document.createElement("p"), origin = document.createElement("small");
    heading.textContent = term.word;
    definition.textContent = term.definition;
    if (term.worldId && term.worldId !== wgState.worldId) {
      origin.textContent = `From ${wgWorldDisplayName(term.worldId)}`;
      item.append(heading, origin, definition);
    } else item.append(heading, definition);
    list.append(item);
  });
  learningSummary.unresolved.forEach(reference => {
    const item = document.createElement("li");
    item.textContent = `${reference.word || "Unknown term"} (${reference.termId || "no permanent ID"}): ${reference.reason}`;
    issueList.append(item);
  });
  $("#wgCompleteReferenceWarning").classList.toggle("hidden", learningSummary.unresolved.length === 0);
  if (learningSummary.unresolved.length) console.error("Completion review has unresolved curriculum references", learningSummary.unresolved);
  $("#wgCompleteCoins").textContent = `+${wgState.puzzleCoins}`;
  $("#wgCompleteXp").textContent = `+${wgState.puzzleXp}`;
  $("#wgCompletePanel").classList.remove("hidden");
  requestAnimationFrame(() => $("#wgCompleteContinue").focus());
  wgStartVictory();
}

// Victory celebration (presentation only): it is handed the coins/XP already granted by
// wgFoundWord and never touches the save. It fires once per puzzle render, and only for a
// puzzle that was not completed before; a replay keeps the ordinary per-word feedback.
const wgVictory = FinLitVictory.createController({
  document, window, storage: localStorage,
  audio: { play: ({ pings } = {}) => wgAudio.grandJackpot({ coins: pings }), stop: () => wgAudio.stopJackpots(), reset: () => {} },
});
const wgTermVictory = FinLitVictory.createController({
  document, window, storage: localStorage,
  audio: { play: () => false, stop: () => {}, reset: () => {} },
});
let wgVictoryPulseTimer = null;
function wgSyncSoundToggle() {
  const on = FinLitVictory.loadSoundEnabled(localStorage), button = $("#wgSoundToggle"), header = $("#wgSoundButton");
  const volume = FinLitVictory.loadSoundVolume(localStorage);
  button.setAttribute("aria-pressed", String(on));
  button.textContent = on ? "🔊 Sound on" : "🔇 Sound off";
  header.setAttribute("aria-pressed", String(on));
  header.setAttribute("aria-label", on ? `Sound on, volume ${volume}%` : "Sound off");
  header.textContent = on ? "🔊" : "🔇";
  [$("#wgVolumeSlider"), $("#wgCompleteVolumeSlider")].forEach(slider => { slider.value = String(volume); slider.disabled = !on; });
  [$("#wgVolumeValue"), $("#wgCompleteVolumeValue")].forEach(value => { value.textContent = `${volume}%`; });
}
function wgToggleSound() {
  const next = !FinLitVictory.loadSoundEnabled(localStorage);
  FinLitVictory.saveSoundEnabled(localStorage, next);
  if (!next) { wgVictory.stopSound(); wgAudio.stop(); } else { wgAudio.unlock(); wgAudio.correct("ordinary"); }
  wgSyncSoundToggle();
}
function wgSetSoundVolume(event) {
  const volume = FinLitVictory.clampVolume(event.currentTarget.value);
  FinLitVictory.saveSoundVolume(localStorage, volume);
  wgAudio.setVolume(volume / 100);
  wgSyncSoundToggle();
}
function wgEndVictoryUi() {
  $("#wgCelebrateSkip").hidden = true;
  clearTimeout(wgVictoryPulseTimer);
  document.querySelector(".wg-currency")?.classList.remove("vc-pulse");
}
function wgSkipVictory() { wgVictory.skip(); wgEndVictoryUi(); }
function wgStartVictory() {
  if (wgState.victoryShown) return;
  wgState.victoryShown = true;
  const newlyCompleted = !wgState.completedBefore;
  wgSyncSoundToggle();
  const result = wgVictory.start({
    coins: wgState.puzzleCoins, xp: wgState.puzzleXp, newlyCompleted,
    from: $("#wgCompleteCoins"), to: document.querySelector(".wg-currency"),
    onDone: wgEndVictoryUi,
  });
  const note = $("#wgCompleteAnnouncement");
  note.textContent = "";
  setTimeout(() => { note.textContent = result.announcement; }, 60);
  if (!newlyCompleted) celebrate();
  if (result.running) {
    $("#wgCelebrateSkip").hidden = false;
    wgVictoryPulseTimer = setTimeout(() => {
      const currency = document.querySelector(".wg-currency");
      if (wgVictory.isRunning() && currency) { currency.classList.add("vc-pulse"); setTimeout(() => currency.classList.remove("vc-pulse"), 700); }
    }, 1300);
  }
}
function wgContinueAfterComplete() {
  wgSkipVictory();
  $("#wgCompletePanel").classList.add("hidden");
  wgState.playthroughIndex++;
  if (wgState.playthroughIndex < wgState.playthrough.length) {
    wgRenderPuzzle();
  } else {
    const bankState = wgBankState();
    bankState.lastPlaythrough = wgState.playthrough.map(p => p.id);
    learning.persist();
    wgShowLevelSelect();
  }
}

function wgUpdateProgress() {
  const bank = wgEnsureBank();
  const history = wgEffectiveHistory(bank);
  const progress = typeof FinLitPuzzleBank.puzzleProgress === "function"
    ? FinLitPuzzleBank.puzzleProgress(bank, history)
    : { completed: bank.filter(puzzle => history[puzzle.id] && history[puzzle.id].timesPlayed > 0).length, total: bank.length };
  const total = progress.total;
  const solved = progress.completed;
  $("#wgWordsSolved").textContent = solved;
  $("#wgWordsTotal").textContent = total;
  $("#wgWordsBar").style.width = `${Math.min(100, (solved / total) * 100)}%`;
}

function wgUpdateMission() {
  const anchor = wgState.puzzleModel.anchorWord;
  const nextWord = !wgState.found.has(anchor) ? anchor : wgState.words.find(w => !wgState.found.has(w));
  if (!nextWord) return;
  const term = wgState.byWord[nextWord];
  const reward = FinLitPuzzleBank.canonicalAnswerReward(wgState.puzzle, nextWord, wgRewardHistory(wgProgress()), wgCanonicalRecord());
  const revealed = wgState.revealed.has(nextWord);
  const answer = wgState.puzzleModel.answers?.find(item=>item.word===nextWord),isAnchor=nextWord===anchor,isFinancial=answer?wgIsFinancialCategory(answer.category):(!wgState.puzzleModel.expanded||isAnchor),presentation=FinLitPuzzleBank.answerPresentation?.(answer||(!isFinancial?{word:nextWord,category:"support"}:null));
  $("#wgMissionWord").textContent = presentation?.heading || (revealed ? (nextWord.charAt(0) + nextWord.slice(1).toLowerCase()) : wgHintPattern(nextWord));
  $("#wgMissionDefinition").textContent = presentation?.instruction || (isAnchor
    ? (revealed ? (answer?.definition || term?.definition || wgState.puzzleModel.definition) : "Solve the financial term on the wheel, or tap Hint below to reveal it and its definition.")
    : isFinancial
      ? (revealed ? (answer?.definition || term?.definition || "Financial term") : "Solve this secondary financial term to reveal its definition.")
      : "Solve this word to help complete the crossword.");
  const missionCard=$("#wgMissionCard"),missionReward=$("#wgMissionReward");
  missionCard.classList.toggle("non-financial",Boolean(presentation));
  missionReward.classList.toggle("non-financial",Boolean(presentation));
  $("#wgMissionRewardLabel").textContent=presentation?.reward||"REWARD";
  if(presentation)missionCard.setAttribute("aria-label",presentation.accessibilityLabel);else missionCard.removeAttribute("aria-label");
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
  $("#wgLevelLabel").textContent = `PLAYER LEVEL ${FinLitLearning.levelForXp(player.xp)}`;
  const xpIntoLevel = FinLitLearning.xpIntoLevel(player.xp);
  $("#wgLevelBar").style.width = `${(xpIntoLevel / FinLitLearning.XP_PER_LEVEL) * 100}%`;
  $("#wgLevelXpText").textContent = `${xpIntoLevel} / ${FinLitLearning.XP_PER_LEVEL} XP`;
  $("#wgStreak").textContent = player.streak;
  // Daily progress = puzzles COMPLETED today (player's local day), counted from the
  // completion history the game already records. The goal is one full playthrough
  // (the 5 puzzles every world draws per playthrough), not a made-up unit count.
  const todayCount = learning.dailyPuzzleProgress().count;
  const dailyGoal = WG_DAILY_PUZZLE_GOAL;
  $("#wgDailyProgress").textContent = `${Math.min(todayCount, dailyGoal)} / ${dailyGoal}`;
  const dots = $("#wgDailyDots");
  dots.innerHTML = "";
  for (let i = 0; i < dailyGoal; i++) { const dot = document.createElement("span"); dot.className = i < todayCount ? "done" : ""; dots.append(dot); }
  wgUpdateAssistUi();
}

function wgShuffle() {
  const focusedTileId = document.activeElement?.dataset?.tileId;
  wgResetPointer();
  wgClearSelection();
  wgState.wheelTiles = FinLitWheelInteraction.shuffledOrder(wgState.wheelTiles, shuffled);
  $("#wgWheel").classList.add("is-shuffling");
  wgPositionWheelTiles(true);
  setTimeout(() => $("#wgWheel").classList.remove("is-shuffling"), 520);
  if (focusedTileId) document.querySelector(`#wgWheel .letter[data-tile-id="${focusedTileId}"]`)?.focus({preventScroll:true});
}

function wgUpdateAssistUi() {
  const freePractice = wgIsTutorialLevel();
  const hintCost = wgGovernedHintCost(freePractice, WG_LETTER_HINT_COST);
  const revealCost = wgGovernedHintCost(freePractice, WG_FULL_REVEAL_COST);
  $("#wgHintCost").textContent = freePractice ? "∞ HINTS" : hintCost;
  $("#wgRevealCost").textContent = freePractice ? "FREE" : revealCost;
  $("#wgHintButton").disabled = !wgCanAffordHint(learning.save.player.coins, hintCost);
  $("#wgNavHint").disabled = !wgCanAffordHint(learning.save.player.coins, revealCost);
  const notice = $("#wgPracticeNotice");
  if (notice) notice.classList.toggle("hidden", !freePractice);
}

function wgHint() {
  const freePractice = wgIsTutorialLevel();
  const cost = wgGovernedHintCost(freePractice, WG_LETTER_HINT_COST);
  const unfinished = wgState.words.filter(word => !wgState.found.has(word) && wgHintPattern(word).replace(/\s/g, "").includes("_"));
  if (!unfinished.length) return toast("Every available letter is already revealed");
  const word = unfinished[0];
  const index = [...word].findIndex((_, i) => !wgIsLetterVisible(word, i));
  if (index < 0) return toast("Every available letter is already revealed");
  if (cost && !learning.spendCoins(cost)) return toast("Not enough coins for a hint");
  wgState.hints.add(`${word}:${index}`);
  wgRenderGrid();
  wgUpdateHeader();
  wgUpdateMission();
  const answer=wgState.puzzleModel.answers?.find(item=>item.word===word),presentation=FinLitPuzzleBank.answerPresentation?.(answer||{word,category:word===wgState.puzzleModel.anchorWord?"financial":"support"});
  toast(`${presentation?presentation.hintPrefix:"Hint"}: ${word[index]} is letter ${index + 1} of a ${word.length}-letter word`);
}

function wgRevealFull() {
  const freePractice = wgIsTutorialLevel();
  const cost = wgGovernedHintCost(freePractice, WG_FULL_REVEAL_COST);
  const nextWord = wgState.words.find(w => !wgState.found.has(w));
  if (!nextWord) return;
  if (wgState.revealed.has(nextWord)) return toast("Already revealed");
  if (cost && !learning.spendCoins(cost)) return toast(`Not enough coins — full reveal costs ${cost}`);
  wgState.revealed.add(nextWord);
  wgUpdateHeader();
  wgUpdateMission();
  const answer = wgState.puzzleModel.answers?.find(item=>item.word===nextWord),presentation=FinLitPuzzleBank.answerPresentation?.(answer||{word:nextWord,category:nextWord===wgState.puzzleModel.anchorWord?"financial":"support"});
  toast((answer&&wgIsFinancialCategory(answer.category))||nextWord===wgState.puzzleModel.anchorWord ? "Financial term and definition revealed" : presentation?.revealMessage||"Word revealed");
}

function wgShowDefinitions() { wgRenderDefinitionsList(); $("#wgDefinitionsPanel").classList.remove("hidden"); }
function wgHideDefinitions() { $("#wgDefinitionsPanel").classList.add("hidden"); }

const wgWheelElement = $("#wgWheel");
wgWheelElement.addEventListener("pointerdown", wgBeginPointer);
wgWheelElement.addEventListener("pointermove", wgMovePointer);
wgWheelElement.addEventListener("pointerup", wgEndPointer);
wgWheelElement.addEventListener("pointercancel", wgCancelPointer);
wgWheelElement.addEventListener("lostpointercapture", () => { if (wgPointerDown) wgCancelPointer(); });
wgWheelElement.addEventListener("click", event => {
  const button = event.target.closest(".letter");
  if (!button || event.detail !== 0) return;
  wgAddLetter(button);
  const word = wgSelectedWord();
  if (wgCanSubmitTapWord(word)) wgSubmitWord();
});
wgWheelElement.addEventListener("keydown", event => {
  const button = event.target.closest(".letter"), buttons = $$("#wgWheel .letter");
  if (event.key === "Escape") { event.preventDefault(); wgClearSelection(); return; }
  if (event.key === "Backspace" && wgState.selected.length) { event.preventDefault(); wgState.selected.pop(); wgUpdateSelection(); return; }
  if (button && (event.key === "Enter" || event.key === " ") && wgState.selected.at(-1) === button.dataset.tileId && wgState.words.includes(wgSelectedWord())) { event.preventDefault(); wgSubmitWord(); return; }
  if (!button || !["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const current = wgState.wheelTiles.findIndex(tile => tile.id === button.dataset.tileId);
  const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
  const nextTile = wgState.wheelTiles[(current + delta + wgState.wheelTiles.length) % wgState.wheelTiles.length];
  buttons.find(item => item.dataset.tileId === nextTile.id)?.focus();
});
window.addEventListener("blur", wgCancelPointer);
if (typeof ResizeObserver === "function") new ResizeObserver(() => wgUpdateSelection()).observe($("#wgWheel"));
else window.addEventListener("resize", wgUpdateSelection);

$("#wgBack").onclick = wgBackFromWorldGame;
$("#wgBrandLogo").onclick = showWorldSelect;
$("#wgSettingsButton").onclick = toggleTheme;
$("#wgNavShuffle").onclick = wgShuffle;
$("#wgHintButton").onclick = wgHint;
$("#wgNavHint").onclick = wgRevealFull;
$("#wgDefinitionsButton").onclick = wgShowDefinitions;
$("#wgClearSelection").onclick = () => wgClearSelection();
$("#wgDefinitionsClose").onclick = wgHideDefinitions;
$("#wgCompleteContinue").onclick = wgContinueAfterComplete;
$("#wgCelebrateSkip").onclick = wgSkipVictory;
$("#wgSoundToggle").onclick = wgToggleSound;
$("#wgSoundButton").onclick = wgToggleSound;
$("#wgVolumeSlider").oninput = wgSetSoundVolume;
$("#wgCompleteVolumeSlider").oninput = wgSetSoundVolume;
document.addEventListener("keydown", event => { if (event.key === "Escape" && wgVictory.isRunning()) { event.preventDefault(); wgSkipVictory(); } });
wgSyncSoundToggle();
$("#wgNavJourney").onclick = wgShowLevelSelect;
$("#wgNavPause").onclick = showWorldSelect;

$("#wgHintCost").textContent = WG_LETTER_HINT_COST;
$("#wgRevealCost").textContent = WG_FULL_REVEAL_COST;

// Initial screen: a brand-new player (never tapped past Welcome before)
// sees it once; everyone else lands on World Selection, which is now the
// permanent "choose/switch a world" hub, not a one-time-only screen.
if (!localStorage.getItem("finlitQuest.onboarded")) {
  showWelcome();
} else {
  showWorldSelect();
}
