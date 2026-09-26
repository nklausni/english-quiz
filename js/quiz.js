import { ALL, WORDS, LETTERS } from "./data.js";

export function shuffle(items, rng = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeAnswer(value) {
  return String(value ?? "").normalize("NFC").trim().replace(/\s+/gu, " ")
    .replace(/[\u2018\u2019\u02bc]/gu, "\u0027").replace(/[.!?]+$/u, "").trim().toLocaleLowerCase("en");
}

export function evaluate(question, answer) {
  if (question.type === "choice") return answer === question.answer;
  const typed = question.group === "abc" ? normalizeAnswer(answer).replace(/\s+/gu, "") : normalizeAnswer(answer);
  const expected = question.group === "abc" ? normalizeAnswer(question.answer).replace(/\s+/gu, "") : normalizeAnswer(question.answer);
  return typed.length > 0 && typed === expected;
}

export function makeQuestion(entry, { mode = "choice", direction = "en-de", rng = Math.random, variant = "identify" } = {}) {
  if (entry.group === "abc") {
    const index = LETTERS.findIndex((l) => l.id === entry.id);
    if (index < 0) throw new Error("Unknown letter");
    if (mode === "spelling") {
      const start = Math.min(index, 22);
      return { id: entry.id, group: "abc", type: "spelling", prompt: `Welche drei Buchstaben kommen nach ${LETTERS[start].en}?`, answer: LETTERS.slice(start + 1, start + 4).map((l) => l.en).join(" "), hint: "Schreibe die drei Buchstaben in der richtigen Reihenfolge." };
    }
    const identify = variant === "identify";
    const source = identify ? entry : (index === 25 ? LETTERS[25] : entry);
    const correct = identify ? source : (index === 25 ? LETTERS[24] : LETTERS[index + 1]);
    const prompt = identify ? `Welcher Großbuchstabe passt zu „${source.en.toLowerCase()}“?` : (index === 25 ? "Welcher Buchstabe kommt vor Z?" : `Welcher Buchstabe kommt nach ${source.en}?`);
    const nearby = shuffle(LETTERS.filter((l) => l.id !== correct.id).sort((a, b) => Math.abs(LETTERS.indexOf(a) - LETTERS.indexOf(correct)) - Math.abs(LETTERS.indexOf(b) - LETTERS.indexOf(correct))).slice(0, 8), rng);
    return { id: entry.id, group: "abc", type: "choice", prompt, answer: correct.en, options: shuffle([correct.en, ...nearby.slice(0, 3).map((l) => l.en)], rng) };
  }
  if (!WORDS.includes(entry)) throw new Error("Unknown word");
  if (mode === "spelling") return { id: entry.id, group: entry.group, type: "spelling", prompt: `Schreibe auf Englisch: ${entry.de}`, answer: entry.en, hint: "Groß-/Kleinschreibung und Leerzeichen sind egal. Achte auf die Buchstaben." };
  const key = direction === "de-en" ? "en" : "de";
  const clue = direction === "de-en" ? entry.de : entry.en;
  const answer = entry[key];
  const candidates = WORDS.filter((item) => item.group === entry.group && item.id !== entry.id && normalizeAnswer(item[key]) !== normalizeAnswer(answer))
    .sort((a, b) => Math.abs(a[key].length - answer.length) - Math.abs(b[key].length - answer.length));
  // Draw from similarly sized words, never from duplicate meanings or another theme.
  const distractors = shuffle(candidates.slice(0, 12), rng).slice(0, 3).map((item) => item[key]);
  return { id: entry.id, group: entry.group, type: "choice", prompt: direction === "de-en" ? `Was heißt „${clue}“ auf Englisch?` : `Was heißt „${clue}“ auf Deutsch?`, answer, options: shuffle([answer, ...distractors], rng), direction };
}

export function createRound({ group = "all", mode = "choice", missed = [], rng = Math.random, size = 8 } = {}) {
  const pool = group === "all" ? ALL : ALL.filter((item) => item.group === group);
  if (!pool.length || !["all", "abc", "classroom", "family", "animals"].includes(group)) throw new Error("Unknown group");
  const selected = missed.length ? pool.filter((item) => missed.includes(item.id)) : pool;
  const entries = shuffle(selected, rng).slice(0, Math.min(size, selected.length));
  return entries.map((entry, i) => {
    const kind = mode === "mixed" ? (i % 3 === 2 ? "spelling" : "choice") : mode;
    const direction = i % 2 ? "de-en" : "en-de";
    return makeQuestion(entry, { mode: kind, direction, rng, variant: i % 2 ? "order" : "identify" });
  });
}
