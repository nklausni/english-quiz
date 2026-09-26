import { BY_ID } from "./data.js";

export const KEY = "word-garden-progress";
export const SCHEMA = 2;
const empty = () => ({ schema: SCHEMA, stats: {}, answers: 0 });
const count = (value) => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1000000) : 0;

// Keep recognized IDs only. Old v1 records used seen/right/wrong; v2 uses attempts/correct/missed.
export function migrate(raw) {
  const result = empty();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;
  if (raw.schema > SCHEMA) return null; // Never overwrite data from a newer version.
  const stats = raw.stats && typeof raw.stats === "object" && !Array.isArray(raw.stats) ? raw.stats : {};
  for (const [id, value] of Object.entries(stats)) {
    if (!BY_ID.has(id) || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const attempts = count(value.attempts ?? value.seen);
    const correct = Math.min(attempts, count(value.correct ?? value.right));
    const missed = Math.min(attempts - correct, count(value.missed ?? value.wrong));
    if (attempts) result.stats[id] = { attempts, correct, missed };
  }
  result.answers = count(raw.answers ?? Object.values(result.stats).reduce((sum, s) => sum + s.attempts, 0));
  return result;
}

export function createStore(storage) {
  let state = empty();
  let writable = true;
  let notice = "";
  if (!storage) notice = "Speichern ist hier nicht verfügbar. Du kannst trotzdem üben; nach dem Schließen ist der Fortschritt vielleicht weg.";
  try {
    const saved = storage?.getItem(KEY);
    if (saved !== null && saved !== undefined) {
      const parsed = JSON.parse(saved);
      const updated = migrate(parsed);
      if (updated === null) {
        writable = false;
        notice = "Dieser Spielstand stammt aus einer neueren Version. Üben geht, aber wir speichern hier nichts, um ihn zu schützen.";
      } else state = updated;
    }
  } catch {
    notice = "Speichern ist hier nicht verfügbar. Du kannst trotzdem üben; nach dem Schließen ist der Fortschritt vielleicht weg.";
  }
  const save = () => {
    if (!writable) return;
    try { storage?.setItem(KEY, JSON.stringify(state)); }
    catch { notice = "Speichern ist hier nicht verfügbar. Du kannst trotzdem üben; nach dem Schließen ist der Fortschritt vielleicht weg."; }
  };
  return {
    get state() { return state; },
    get notice() { return notice; },
    get missedIds() { return Object.entries(state.stats).filter(([, s]) => s.missed > 0).map(([id]) => id); },
    record(id, right) {
      if (!BY_ID.has(id)) return;
      const prior = state.stats[id] || { attempts: 0, correct: 0, missed: 0 };
      state.stats[id] = { attempts: prior.attempts + 1, correct: prior.correct + (right ? 1 : 0), missed: right ? Math.max(0, prior.missed - 1) : prior.missed + 1 };
      state.answers++;
      save();
    },
    reset() {
      try { storage?.removeItem(KEY); writable = true; notice = storage ? "" : "Speichern ist hier nicht verfügbar. Du kannst trotzdem üben; nach dem Schließen ist der Fortschritt vielleicht weg."; }
      catch { notice = "Der Fortschritt konnte hier nicht gelöscht werden."; return false; }
      state = empty();
      return true;
    }
  };
}
