import test from "node:test";
import assert from "node:assert/strict";
import { WORDS, GROUPS } from "../js/data.js";
import { createRound } from "../js/quiz.js";

// Transcribed from the three photographed school lists. "lineal" is the
// German cue for ruler; "rubber/eraser" means both English variants.
const photos = [
  ["dog", "fish", "guinea pig", "parrot", "rat", "cat", "budgie", "spider", "seagull", "snake", "rabbit"],
  ["pencil", "glue stick", "ruler", "stickers", "scissors", "notes", "lip balm", "green pencil", "whiteboard pen", "rubber", "eraser", "marker", "pen"],
  ["house", "care", "big city", "windows", "kids", "sky", "sea", "door", "water", "head", "T-shirt", "shoes", "girl", "boy", "beach", "dancing", "mom", "dad", "grandpa", "grandma"]
];

test("all photographed English words have one discoverable vocabulary entry", () => {
  const pictured = photos.flat();
  assert.equal(pictured.length, 44);
  assert.equal(new Set(pictured.map((word) => word.toLowerCase())).size, pictured.length);
  const entries = new Map(WORDS.map((word) => [word.en.toLowerCase(), word]));
  assert.deepEqual(pictured.filter((word) => !entries.has(word.toLowerCase())), []);
  assert.equal(WORDS.length, 103); // 69 original + 34 missing photo words
  assert.equal(entries.size, WORDS.length);
  assert.deepEqual(Object.keys(GROUPS), ["classroom", "family", "animals", "everyday"]);
  assert.deepEqual([entries.get("pencil").id, entries.get("mother").id, entries.get("butterfly").id], ["classroom-3", "family-1", "animals-23"]);
  for (const group of Object.keys(GROUPS)) assert.equal(createRound({ group }).length, 8);
});

test("photo words have clear German meanings and fit their theme", () => {
  const entries = new Map(WORDS.map((word) => [word.en.toLowerCase(), word]));
  for (const [en, de, group] of [
    ["guinea pig", "Meerschweinchen", "animals"], ["budgie", "Wellensittich", "animals"], ["seagull", "Möwe", "animals"],
    ["glue stick", "Klebestift", "classroom"], ["green pencil", "grüner Buntstift", "classroom"],
    ["rubber", "Radiergummi (britisches Englisch)", "classroom"], ["whiteboard pen", "Whiteboardstift", "classroom"],
    ["kids", "Kinder (umgangssprachlich)", "family"], ["mom", "Mama", "family"], ["grandpa", "Opa", "family"],
    ["care", "Fürsorge", "everyday"], ["big city", "Großstadt", "everyday"],
    ["windows", "Fenster (Mehrzahl)", "everyday"], ["T-shirt", "T-Shirt", "everyday"], ["dancing", "Tanzen", "everyday"]
  ]) assert.deepEqual([entries.get(en.toLowerCase())?.de, entries.get(en.toLowerCase())?.group], [de, group], en);
});
