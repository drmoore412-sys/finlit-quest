/* FinLit Quest TEST BUILD shim (generated for /flq-test/ only; not part of the source tree).
   1. Isolates localStorage under the "flqtest:" prefix so production saves on finlitquest.com are never read, migrated or written.
   2. Turns DeFi in Real Life ON for this test location only. Source files keep the flag OFF.
   3. Shows a small "TEST BUILD" marker. If isolation cannot be installed the page stops rather than touching real saves. */
(function () {
  var P = "flqtest:", mem = {}, real = null;
  try { real = window.localStorage; real.getItem("flqtest:probe"); } catch (e) { real = null; }
  function names() { var out = [], i, k; if (real) { for (i = 0; i < real.length; i++) { k = real.key(i); if (k && k.indexOf(P) === 0) out.push(k.slice(P.length)); } } else { for (k in mem) out.push(k); } return out; }
  var proxy = {
    getItem: function (k) { k = String(k); if (real) return real.getItem(P + k); return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { k = String(k); v = String(v); if (real) real.setItem(P + k, v); else mem[k] = v; },
    removeItem: function (k) { k = String(k); if (real) real.removeItem(P + k); else delete mem[k]; },
    clear: function () { names().forEach(function (k) { proxy.removeItem(k); }); },
    key: function (i) { var n = names(); return i < n.length ? n[i] : null; }
  };
  Object.defineProperty(proxy, "length", { get: function () { return names().length; } });
  var ok = false;
  try { Object.defineProperty(window, "localStorage", { configurable: true, get: function () { return proxy; } }); ok = (window.localStorage === proxy); } catch (e) { ok = false; }
  if (!ok) {
    try { window.stop(); } catch (e) {}
    document.documentElement.innerHTML = "<body style=\"font:16px system-ui;padding:24px\"><h1>Test build stopped</h1><p>This browser would not let the test build isolate its saved data from the live FinLit Quest save, so it has not run. Nothing was read or changed.</p></body>";
    throw new Error("flq-test: storage isolation failed");
  }
  window.FLQ_DEFI_RL_ENABLED = true;
  window.FLQ_TEST_BUILD = true;
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.createElement("div");
    b.setAttribute("role", "note");
    b.textContent = "TEST BUILD · separate save data";
    b.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:2147483000;font:600 10px/1 system-ui,sans-serif;letter-spacing:.04em;color:#fff;background:rgba(120,30,30,.82);padding:4px 7px;border-radius:6px;pointer-events:none";
    document.body.appendChild(b);
  });
})();
