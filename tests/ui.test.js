import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KEY } from "../js/store.js";
import { LETTERS, WORDS } from "../js/data.js";

test("home → theme → learn → quiz → feedback → result and reset", async () => {
  const handlers = new Map();
  const saved = new Map();
  saved.set(KEY, JSON.stringify({ schema: 1, stats: {
    [LETTERS[0].id]: { seen: 2, wrong: 2 }, [WORDS[0].id]: { seen: 1, wrong: 1 }
  } }));
  const choices = { hidden: false };
  const form = { hidden: false, querySelector: () => ({ disabled: false }) };
  const focusCalls = [];
  const feedback = { innerHTML: "", querySelector() { return { focus(options) { focusCalls.push(options); } }; } };
  const app = {
    get innerHTML() { return this.markup ?? ""; },
    set innerHTML(value) { this.markup = value; choices.hidden = false; form.hidden = false; },
    addEventListener(name, fn) { handlers.set(name, fn); },
    querySelector(selector) {
      if (selector === "#screen-title") return { focus() {} };
      if (selector === "#feedback") return feedback;
      if (selector === ".choices") return choices;
      if (selector === "#answer-form") return form;
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
  click("group", "abc");
  assert.match(app.innerHTML, /ABC.*nur.*Entdecken/s);
  assert.match(app.innerHTML, /data-action="learn"/);
  assert.doesNotMatch(app.innerHTML, /data-action="start"/);
  assert.doesNotMatch(app.innerHTML, /data-action="review"/);
  click("learn");
  assert.match(app.innerHTML, /BUCHSTABE/);
  assert.match(app.innerHTML, /Englisch anhören/);
  click("home");
  click("group", "all");
  assert.match(app.innerHTML, /1 Wort wartet/);
  click("review");
  assert.match(app.innerHTML, /FRAGE 1 VON 1/);
  click("home");
  click("group", "animals");
  assert.match(app.innerHTML, /aria-pressed="true">♣/);
  click("learn");
  assert.match(app.innerHTML, /Englisch anhören/);
  assert.match(app.innerHTML, /DEUTSCH/);
  click("home");
  click("start", "choice");
  assert.match(app.innerHTML, /class="layout quiz-layout"/);
  assert.match(app.innerHTML, /FRAGE 1 VON 8/);
  assert.match(app.innerHTML, /Antwortmöglichkeiten/);
  assert.equal(choices.hidden, false);
  click("answer", "0");
  assert.equal(choices.hidden, true);
  assert.deepEqual(focusCalls[0], { preventScroll: true });
  assert.match(app.innerHTML, /question-card/);
  assert.match(feedback.innerHTML, /continue/);
  assert.ok(saved.size > 0);
  for (let i=0; i<16 && !app.innerHTML.includes("Gut geübt!"); i++) {
    click("continue");
    if (app.innerHTML.includes("Antwortmöglichkeiten")) click("answer", "0");
  }
  assert.match(app.innerHTML, /Gut geübt!/);
  click("home");
  click("start", "spelling");
  assert.match(app.innerHTML, /id="spelling-input"/);
  assert.equal(form.hidden, false);
  handlers.get("submit")({ target: { id: "answer-form", elements: { answer: { value: "wrong" } } }, preventDefault() {} });
  assert.equal(form.hidden, true);
  assert.match(feedback.innerHTML, /continue/);
  assert.match(app.innerHTML, /question-card/);
  click("home");
  click("reset");
  assert.equal(saved.size, 0);
});

test("quiz viewport DOM/CSS contract: compact chrome, tappable options, collapsed answers and offline update", () => {
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../css/style.css", import.meta.url), "utf8");
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(app, /screen === "quiz" \? " quiz-layout"/);
  assert.match(app, /\.choices["\)]?[\s\S]*?\.hidden\s*=\s*true/);
  assert.match(app, /#answer-form[\s\S]*?\.hidden\s*=\s*true/);
  assert.match(css, /\.quiz-layout\s+\.choices\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.quiz-layout\s+\.choice\s*\{[^}]*min-height:\s*(?:48|[5-9]\d)px/);
  assert.match(css, /\.quiz-layout\s+\.question-card\s*\{[^}]*min-height:\s*(?:0|[1-9]\d)px/);
  assert.match(css, /\.quiz-layout\s+\.site-footer\s*\{[^}]*display:\s*none/);
  assert.match(sw, /const VERSION = "word-garden-v2"/);
});

test("legacy ABC-only misses remain stored but never offer review", async () => {
  const handlers = new Map();
  const saved = new Map([[KEY, JSON.stringify({ schema: 1, stats: { [LETTERS[1].id]: { seen: 1, wrong: 1 } } })]]);
  const app = { innerHTML: "", addEventListener(name, fn) { handlers.set(name, fn); }, querySelector() { return null; } };
  globalThis.document = { querySelector: () => app };
  globalThis.window = {
    localStorage: { getItem: (k) => saved.get(k) ?? null, setItem: (k,v) => saved.set(k,v), removeItem: (k) => saved.delete(k) },
    scrollTo() {}
  };
  Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
  globalThis.location = { protocol: "http:", hostname: "example.invalid" };
  await import("../js/app.js?abc-only");
  assert.doesNotMatch(app.innerHTML, /data-action="review"/);
  assert.equal(JSON.parse(saved.get(KEY)).stats[LETTERS[1].id].wrong, 1);
  const button = { dataset: { action: "review" }, disabled: false, closest() { return this; } };
  handlers.get("click")({ target: button });
  assert.match(app.innerHTML, /Wörter wachsen/);
  assert.doesNotMatch(app.innerHTML, /FRAGE/);
});
