import test from "node:test";
import assert from "node:assert/strict";

test("home → theme → learn → quiz → feedback → result and reset", async () => {
  const handlers = new Map();
  const saved = new Map();
  const feedback = { innerHTML: "", querySelector() { return { focus() {} }; } };
  const app = {
    innerHTML: "",
    addEventListener(name, fn) { handlers.set(name, fn); },
    querySelector(selector) {
      if (selector === "#screen-title") return { focus() {} };
      if (selector === "#feedback") return feedback;
      return null;
    },
    querySelectorAll() { return []; }
  };
  globalThis.document = { querySelector: () => app };
  globalThis.window = {
    localStorage: { getItem: (k) => saved.get(k) ?? null, setItem: (k,v) => saved.set(k,v), removeItem: (k) => saved.delete(k) },
    scrollTo() {}, confirm: () => true
  };
  Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
  globalThis.location = { protocol: "http:", hostname: "example.invalid" };
  await import("../js/app.js");
  function click(action, value) {
    const button = { dataset: { action, value }, disabled: false, closest() { return this; } };
    handlers.get("click")({ target: button });
  }
  assert.match(app.innerHTML, /Wörter wachsen/);
  assert.match(app.innerHTML, /Schulbuch/);
  click("group", "animals");
  assert.match(app.innerHTML, /aria-pressed="true">♣/);
  click("learn");
  assert.match(app.innerHTML, /Englisch anhören/);
  assert.match(app.innerHTML, /DEUTSCH/);
  click("home");
  click("start", "choice");
  assert.match(app.innerHTML, /FRAGE 1 VON 8/);
  assert.match(app.innerHTML, /Antwortmöglichkeiten/);
  click("answer", "0");
  assert.match(feedback.innerHTML, /continue/);
  assert.ok(saved.size > 0);
  for (let i=0; i<16 && !app.innerHTML.includes("Gut geübt!"); i++) {
    click("continue");
    if (app.innerHTML.includes("Antwortmöglichkeiten")) click("answer", "0");
  }
  assert.match(app.innerHTML, /Gut geübt!/);
  click("home");
  click("reset");
  assert.equal(saved.size, 0);
});
