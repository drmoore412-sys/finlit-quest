/* FinLit Quest dense-grid zoom and pan.
   Only active when the fitted crossword cell is smaller than MIN_CELL px (puzzles with many answers on
   small phones). Two-finger pinch zooms the crossword, one finger pans the board, double-tap resets.
   The letter wheel and the gameplay controls are outside the board and are never touched. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FinLitDenseGridZoom = api;
  if (typeof document !== "undefined" && root.document) api.install(root.document);
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";
  const MIN_CELL = 24;          // below this fitted cell size zoom is offered
  const TARGET_CELL = 30;       // largest cell size zoom will produce
  const MAX_SCALE = 3;
  const HINT_KEY = "finlit.denseGridZoomHintSeen.v1";
  const HINT_TEXT = "Pinch to zoom, drag to pan";
  const HINT_MS = 5000;
  const DOUBLE_TAP_MS = 280;

  function maxScaleFor(cell) { return cell > 0 ? Math.max(1, Math.min(MAX_SCALE, TARGET_CELL / cell)) : 1; }
  function zoomNeeded(cell) { return cell > 0 && cell < MIN_CELL; }
  function clampScale(scale, max) { return Math.max(1, Math.min(max, scale)); }

  function readHintSeen() { try { return root.localStorage.getItem(HINT_KEY) === "1"; } catch (e) { return false; } }
  function writeHintSeen() { try { root.localStorage.setItem(HINT_KEY, "1"); } catch (e) { /* storage may be unavailable */ } }

  function install(doc) {
    const grid = doc.getElementById("wgCrossword");
    const board = grid && grid.closest(".wg-board");
    if (!grid || !board || board.dataset.denseZoom === "installed") return null;
    board.dataset.denseZoom = "installed";
    const state = { enabled: false, fit: 0, cell0: 0, scale: 1, max: 1, hint: null, hintTimer: 0, key: "", playing: false };

    function hideHint(persist) {
      if (state.hintTimer) { root.clearTimeout(state.hintTimer); state.hintTimer = 0; }
      if (state.hint) { state.hint.remove(); state.hint = null; }
      if (persist) writeHintSeen();
    }
    function showHint() {
      if (readHintSeen() || state.hint) return;
      const hint = doc.createElement("div");
      hint.className = "wg-zoom-hint"; hint.setAttribute("role", "status"); hint.textContent = HINT_TEXT;
      board.append(hint); state.hint = hint;
      state.hintTimer = root.setTimeout(() => hideHint(true), HINT_MS);
    }
    function applyScale(scale) {
      state.scale = scale;
      if (scale <= 1.001) { grid.style.removeProperty("width"); grid.style.removeProperty("max-width"); board.classList.remove("wg-zoomed"); }
      else { grid.style.width = `${state.fit * scale}px`; grid.style.maxWidth = "none"; board.classList.add("wg-zoomed"); }
    }
    function reset() { applyScale(1); board.scrollLeft = 0; board.scrollTop = 0; }
    function puzzleKey() {
      const words = new Set();
      grid.querySelectorAll(".cell").forEach(c => (c.dataset.words || "").split(" ").forEach(w => { if (w) words.add(w); }));
      return `${grid.style.getPropertyValue("--wg-grid-cols")}x${grid.style.getPropertyValue("--wg-grid-rows")}:${[...words].sort().join(",")}`;
    }
    function evaluate() {
      const key = puzzleKey(), keep = key === state.key ? { scale: state.scale, x: board.scrollLeft, y: board.scrollTop } : null;
      state.key = key;
      grid.style.removeProperty("width"); grid.style.removeProperty("max-width"); board.classList.remove("wg-zoomed"); state.scale = 1;
      const cell = grid.querySelector(".cell");
      const screen = doc.getElementById("worldGameScreen");
      const playing = !screen || screen.classList.contains("wg-playing");
      state.playing = playing;
      if (!cell || !playing) { state.enabled = false; board.classList.remove("wg-zoomable"); hideHint(false); return; }
      state.fit = grid.getBoundingClientRect().width;
      state.cell0 = cell.getBoundingClientRect().width;
      state.max = maxScaleFor(state.cell0);
      state.enabled = zoomNeeded(state.cell0) && state.max > 1.05;
      board.classList.toggle("wg-zoomable", state.enabled);
      board.dataset.zoomCell = String(Math.round(state.cell0 * 10) / 10);
      if (!state.enabled) { hideHint(false); return; }
      if (keep && keep.scale > 1.001) { applyScale(clampScale(keep.scale, state.max)); board.scrollLeft = keep.x; board.scrollTop = keep.y; }
      else { board.scrollLeft = 0; board.scrollTop = 0; }
      showHint();
    }
    let pending = 0;
    function schedule() {
      if (pending) return;
      pending = (root.requestAnimationFrame || root.setTimeout)(() => { pending = 0; evaluate(); });
    }

    // gestures
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    let mode = 0, d0 = 0, s0 = 1, lx = 0, ly = 0, moved = false, lastTap = 0;
    board.addEventListener("touchstart", e => {
      if (!state.enabled) return;
      if (e.touches.length === 2) { mode = 2; d0 = dist(e.touches) || 1; s0 = state.scale; moved = true; hideHint(true); }
      else if (e.touches.length === 1) { mode = 1; lx = e.touches[0].clientX; ly = e.touches[0].clientY; moved = false; }
    }, { passive: true });
    board.addEventListener("touchmove", e => {
      if (!state.enabled) return;
      if (e.cancelable) e.preventDefault();
      moved = true;
      if (e.touches.length === 2 && mode === 2) {
        const before = { x: board.scrollLeft, y: board.scrollTop, w: grid.getBoundingClientRect().width };
        applyScale(clampScale(s0 * dist(e.touches) / d0, state.max));
        const after = grid.getBoundingClientRect().width;
        if (before.w > 0 && after > 0) { // keep the viewport centred on the same part of the grid
          const k = after / before.w, cx = board.clientWidth / 2, cy = board.clientHeight / 2;
          board.scrollLeft = (before.x + cx) * k - cx; board.scrollTop = (before.y + cy) * k - cy;
        }
      } else if (e.touches.length === 1 && mode === 1) {
        board.scrollLeft -= e.touches[0].clientX - lx; board.scrollTop -= e.touches[0].clientY - ly;
        lx = e.touches[0].clientX; ly = e.touches[0].clientY;
      }
    }, { passive: false });
    board.addEventListener("touchend", e => {
      if (!state.enabled) return;
      if (e.touches.length === 0) {
        if (!moved) {
          const now = Date.now();
          if (now - lastTap < DOUBLE_TAP_MS) { reset(); lastTap = 0; } else lastTap = now;
        }
        mode = 0;
      } else if (e.touches.length === 1) { mode = 1; lx = e.touches[0].clientX; ly = e.touches[0].clientY; }
    }, { passive: true });

    if (root.MutationObserver) new root.MutationObserver(schedule).observe(grid, { childList: true });
    const screen = doc.getElementById("worldGameScreen");
    if (screen && root.MutationObserver) new root.MutationObserver(() => {
      if (screen.classList.contains("wg-playing") !== Boolean(state.playing)) schedule();
    }).observe(screen, { attributes: true, attributeFilter: ["class"] });
    root.addEventListener && root.addEventListener("resize", schedule);
    schedule();
    return { state, evaluate, reset, applyScale };
  }

  return { MIN_CELL, TARGET_CELL, MAX_SCALE, HINT_KEY, HINT_TEXT, maxScaleFor, zoomNeeded, clampScale, install };
});
