import test from "node:test";
import assert from "node:assert/strict";
import { ALL, WORDS, GROUPS } from "../js/data.js";
import { createRound, makeQuestion, evaluate, normalizeAnswer } from "../js/quiz.js";
import { createStore, migrate, KEY, SCHEMA } from "../js/store.js";

test("curated content: coverage, unique IDs and translations", () => {
  assert.deepEqual(Object.keys(GROUPS), ["classroom", "family", "animals"]);
  assert.equal(ALL.length, WORDS.length);
  assert.ok(ALL.every((word) => word.group !== "abc"));
  assert.equal(new Set(ALL.map((w) => w.id)).size, ALL.length);
  for (const key of ["classroom", "family", "animals"]) assert.ok(WORDS.filter((w) => w.group === key).length >= 15);
  assert.deepEqual(new Set(ALL.map((w) => w.group)), new Set(Object.keys(GROUPS)));
  for (const word of ALL) {
    assert.ok(word.en.trim() && word.de.trim());
    assert.equal(word.en, word.en.trim());
    assert.equal(word.de, word.de.trim());
  }
  for (const key of ["en", "de"]) assert.equal(new Set(WORDS.map((w) => normalizeAnswer(w[key]))).size, WORDS.length, `${key} meanings must be unambiguous`);
});

test("all word questions offer four distinct answers and both directions", () => {
  for (const entry of WORDS) for (const direction of ["en-de", "de-en"]) {
    const q = makeQuestion(entry, { direction, rng: () => 0.42 });
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(normalizeAnswer)).size, 4);
    assert.ok(q.options.includes(q.answer));
    assert.equal(q.answer, direction === "de-en" ? entry.en : entry.de);
    assert.ok(evaluate(q, q.answer));
    for (const other of q.options.filter((v) => v !== q.answer)) assert.ok(!evaluate(q, other));
  }
});

test("removed alphabet is absent from all rounds, even with legacy misses", () => {
  for (const mode of ["choice", "spelling", "mixed"]) {
    assert.throws(() => createRound({ group: "abc", mode }), /Unknown group/);
    const all = createRound({ group: "all", mode, size: ALL.length });
    assert.equal(all.length, WORDS.length);
    assert.ok(all.every((q) => q.group !== "abc"));
    const review = createRound({ group: "all", mode, missed: ["abc-a", WORDS[0].id] });
    assert.deepEqual(review.map((q) => q.id), [WORDS[0].id]);
  }
  assert.throws(() => makeQuestion({ id: "abc-a", group: "abc", en: "A", de: "A" }), /Unknown word/);
});

test("spelling accepts casing, whitespace, curly apostrophe and terminal punctuation; not misspellings", () => {
  const q = makeQuestion(WORDS.find((w) => w.en.includes("know.")), { mode: "spelling" });
  assert.ok(evaluate(q, "  I   DON’T  KNOW  "));
  assert.ok(evaluate(q, "i don’t know."));
  assert.ok(!evaluate(q, "i dont know"));
  assert.ok(!evaluate(q, "i don t know"));
  const other = makeQuestion(WORDS.find((w) => w.en === "butterfly"), { mode: "spelling" });
  assert.ok(!evaluate(other, "buterfly"));
  assert.ok(!evaluate(other, ""));
});

test("rounds use selected theme, mix modes and do not repeat initial items", () => {
  for (const group of ["classroom", "family", "animals"]) for (const mode of ["choice", "spelling", "mixed"]) {
    const round = createRound({ group, mode });
    assert.equal(round.length, 8);
    assert.equal(new Set(round.map((q) => q.id)).size, 8);
    assert.ok(round.every((q) => q.group === group));
    if (mode === "mixed") assert.deepEqual(new Set(round.map((q) => q.type)), new Set(["choice", "spelling"]));
  }
  assert.equal(createRound({ group: "all" }).length, 8);
  assert.throws(() => createRound({ group: "unknown" }));
});

test("migration preserves known counts, drops unknown IDs and protects newer schemas", () => {
  const id = WORDS[0].id;
  const old = migrate({ schema: 1, stats: { [id]: { seen: 4, right: 2, wrong: 1 }, madeup: { seen: 8 } } });
  assert.equal(old.schema, SCHEMA);
  assert.deepEqual(old.stats[id], { attempts: 4, correct: 2, missed: 1 });
  assert.ok(!("madeup" in old.stats));
  assert.equal(migrate({ schema: SCHEMA + 1 }), null);
  assert.deepEqual(migrate({ stats: { [id]: { attempts: -5, correct: 7 } } }).stats, {});
  assert.deepEqual(migrate({ schema: 2, stats: { "abc-a": { attempts: 3, correct: 1, missed: 2 }, [id]: { attempts: 1, correct: 1, missed: 0 } }, answers: 4 }).stats, { [id]: { attempts: 1, correct: 1, missed: 0 } });
});

test("discovery progress saves each word once without counting it as an answer", () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
  const id = WORDS[0].id;
  let store = createStore(storage);
  store.discover(id);
  store.discover(id);
  store.discover("abc-a");
  assert.deepEqual(store.state.discovered, [id]);
  assert.equal(store.state.answers, 0);
  store = createStore(storage);
  assert.deepEqual(store.state.discovered, [id]);
  store.record(id, true);
  assert.deepEqual(store.state.discovered, [id]);
  assert.equal(store.state.answers, 1);
  assert.ok(store.reset());
  assert.deepEqual(store.state.discovered, []);
});

test("persistence records, repeats missed words, resets, and survives corrupt or blocked storage", () => {
  const data = new Map();
  const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
  const id = WORDS[0].id;
  let store = createStore(storage);
  store.record(id, false);
  assert.deepEqual(store.missedIds, [id]);
  store = createStore(storage);
  assert.equal(store.state.answers, 1);
  store.record(id, true);
  assert.deepEqual(store.missedIds, []);
  assert.equal(store.state.stats[id].attempts, 2);
  assert.ok(store.reset());
  assert.equal(data.has(KEY), false);
  data.set(KEY, "{broken");
  assert.ok(createStore(storage).notice);
  data.set(KEY, JSON.stringify({ schema: 99, stats: {} }));
  store = createStore(storage);
  store.record(id, true);
  assert.equal(JSON.parse(data.get(KEY)).schema, 99);
  assert.ok(store.notice);
  const blocked = createStore({ getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("blocked"); } });
  blocked.record(id, false);
  assert.equal(blocked.state.stats[id].missed, 1);
  assert.ok(blocked.notice);
});
