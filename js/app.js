import { ALL, GROUPS, BY_ID } from "./data.js";
import { createRound, makeQuestion, evaluate } from "./quiz.js";
import { createStore } from "./store.js";

const app = document.querySelector("#app");
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const store = createStore(storage);
const escapeHTML = (value) => String(value).replace(/[&<>"\u0027]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\u0027": "&#39;" })[c]);
let group = "all";
let screen = "home";
let cardIndex = 0;
let round = null;
const groupItems = () => group === "all" ? ALL : ALL.filter((item) => item.group === group);
const title = (text, eyebrow = "DEIN LERNORT") => `<div class="section-heading"><span class="eyebrow">${eyebrow}</span><h1 tabindex="-1" id="screen-title">${text}</h1></div>`;
const labelGroup = (id) => id === "all" ? "Alle Themen" : GROUPS[id].title;

function frame(body) {
  app.innerHTML = `<div class="layout"><header class="site-header"><button type="button" class="brand" data-action="home" aria-label="Word Garden: zur Startseite"><span class="brand-mark" aria-hidden="true">✿</span><span>word<span class="brand-light">garden</span></span></button><span class="header-tag">ENGLISCH · GANZ IN RUHE</span></header><main id="main">${body}</main><footer class="site-footer">Kleine Schritte zählen. <span aria-hidden="true">✳</span> Alles bleibt auf diesem Gerät.</footer></div>`;
  if (screen !== "home") app.querySelector("#screen-title")?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function pickGroup() {
  return `<div class="group-picker" role="group" aria-label="Thema auswählen">${["all", ...Object.keys(GROUPS)].map((id) => `<button type="button" class="chip ${id === group ? "active" : ""}" data-action="group" data-value="${id}" aria-pressed="${id === group}">${id === "all" ? "✳" : GROUPS[id].icon} <span>${labelGroup(id)}</span></button>`).join("")}</div>`;
}

function home() {
  screen = "home";
  round = null;
  const known = Object.keys(store.state.stats).length;
  const missed = store.missedIds.length;
  frame(`<section class="hero"><span class="eyebrow">HELLO, LITTLE EXPLORER</span><div class="hero-art" aria-hidden="true"><span class="sun"></span><span class="stem"></span><span class="leaf one"></span><span class="leaf two"></span><span class="flower">✳</span></div><h1 id="screen-title">Wörter wachsen<br><em>mit dir.</em></h1><p>Ein Wort nach dem anderen. Such dir ein Thema aus und leg los!</p><div class="hero-progress"><span class="progress-icon" aria-hidden="true">✦</span><span><strong>${known} von ${ALL.length}</strong> Wörtern entdeckt</span></div></section>
    <section class="home-section"><div class="section-row"><h2>Was möchtest du üben?</h2><span class="section-count">03 THEMEN + ABC</span></div>${pickGroup()}
    <div class="mode-grid"><button class="mode-card learn" data-action="learn"><span class="mode-icon" aria-hidden="true">☼</span><span class="mode-text"><strong>Entdecken</strong><small>Wörter lesen & anhören</small></span><span class="arrow" aria-hidden="true">↗</span></button>
    <button class="mode-card choose" data-action="start" data-value="choice"><span class="mode-icon" aria-hidden="true">◎</span><span class="mode-text"><strong>Wörter-Quiz</strong><small>Aus 4 Antworten wählen</small></span><span class="arrow" aria-hidden="true">↗</span></button>
    <button class="mode-card spell" data-action="start" data-value="spelling"><span class="mode-icon" aria-hidden="true">✎</span><span class="mode-text"><strong>Schreiben</strong><small>Englische Wörter tippen</small></span><span class="arrow" aria-hidden="true">↗</span></button>
    <button class="mode-card mixed" data-action="start" data-value="mixed"><span class="mode-icon" aria-hidden="true">✳</span><span class="mode-text"><strong>Bunter Mix</strong><small>Auswahl & Schreiben</small></span><span class="arrow" aria-hidden="true">↗</span></button></div>
    ${missed ? `<button class="review" data-action="review"><span aria-hidden="true">↺</span><span><strong>Noch mal üben</strong><small>${missed} ${missed === 1 ? "Wort wartet" : "Wörter warten"} auf dich</small></span><span aria-hidden="true">→</span></button>` : ""}
    <p class="smallprint">Die Wortliste ist zum Üben zusammengestellt und stimmt nicht unbedingt mit deinem Schulbuch überein.</p>
    ${store.notice ? `<p class="notice" role="status">${escapeHTML(store.notice)}</p>` : ""}
    <button type="button" class="text-button reset" data-action="reset">Gespeicherten Fortschritt löschen</button></section>`);
}

function learn() {
  screen = "learn";
  const items = groupItems();
  cardIndex = Math.max(0, Math.min(cardIndex, items.length - 1));
  const item = items[cardIndex];
  const abc = item.group === "abc";
  const progress = store.state.stats[item.id];
  frame(`<div class="subnav"><button class="back" data-action="home">← Zur Übersicht</button><span class="pill">${labelGroup(item.group)}</span></div>
    ${title("Wörter entdecken", "LESEN · HÖREN · MERKEN")}
    <div class="learn-progress"><span>WORT ${cardIndex + 1} / ${items.length}</span><span>${progress ? "Schon geübt ✓" : "Neu zu entdecken"}</span></div>
    <div class="meter" aria-hidden="true"><span style="width:${((cardIndex + 1) / items.length) * 100}%"></span></div>
    <article class="flashcard"><div class="flashcard-top"><span class="pill light">${labelGroup(item.group)}</span><span class="flash-symbol" aria-hidden="true">${GROUPS[item.group].icon}</span></div><span class="lang-label">${abc ? "BUCHSTABE" : "ENGLISCH"}</span><h2 lang="en">${escapeHTML(item.en)}</h2>${abc ? `<p class="letter-note">Klein geschrieben: <strong lang="en">${item.en.toLowerCase()}</strong> · Danach kommt <strong>${item.en === "Z" ? "wieder A" : String.fromCharCode(item.en.charCodeAt(0) + 1)}</strong>.</p>` : `<div class="translation"><span class="lang-label">DEUTSCH</span><p lang="de">${escapeHTML(item.de)}</p></div>`}
    <div class="speech-row"><button class="listen" data-action="speak" data-lang="en" data-text="${escapeHTML(item.en)}">◖)) <span>Englisch anhören</span></button>${!abc ? `<button class="listen subtle" data-action="speak" data-lang="de" data-text="${escapeHTML(item.de)}">◖)) <span>Deutsch anhören</span></button>` : ""}</div><p class="speech-status" role="status" id="speech-status"></p></article>
    <div class="card-nav"><button data-action="prev" ${cardIndex === 0 ? "disabled" : ""}>← Zurück</button><button data-action="next" ${cardIndex === items.length - 1 ? "disabled" : ""}>Weiter →</button></div><p class="tip">Tipp: Lies das englische Wort laut vor, bevor du auf Anhören tippst.</p>`);
}

function start(mode, review = false) {
  const ids = review ? store.missedIds : [];
  const items = review ? ids.map((id) => BY_ID.get(id)).filter(Boolean) : [];
  if (review && !items.length) return home();
  // Review pulls from all themes and can include ABC letters.
  const questions = review ? items.slice(0, 8).map((item, index) => makeQuestion(item, { mode: "choice", direction: index % 2 ? "de-en" : "en-de", variant: index % 2 ? "order" : "identify" })) : createRound({ group, mode });
  round = { questions, index: 0, firstCount: questions.length, firstRight: 0, answered: false, retried: new Set(), mode: review ? "review" : mode };
  showQuestion();
}

function showQuestion() {
  if (!round || round.index >= round.questions.length) return result();
  screen = "quiz";
  round.answered = false;
  const q = round.questions[round.index];
  const n = round.index + 1;
  const spelling = q.type === "spelling";
  frame(`<div class="subnav"><button class="back" data-action="home">← Beenden</button><span class="pill">${round.mode === "review" ? "Nochmal üben" : round.mode === "mixed" ? "Bunter Mix" : spelling ? "Schreiben" : "Wörter-Quiz"}</span></div>
    <div class="quiz-head"><span class="eyebrow">FRAGE ${n} VON ${round.questions.length}</span><span class="pill light">${labelGroup(q.group)}</span></div><div class="meter" role="progressbar" aria-label="Fortschritt in dieser Runde" aria-valuemin="0" aria-valuemax="${round.questions.length}" aria-valuenow="${round.index}"><span style="width:${(round.index / round.questions.length) * 100}%"></span></div>
    ${title(spelling ? "Wie schreibt man das?" : "Wähle die Antwort", "DU SCHAFFST DAS")}
    <div class="question-card"><span class="question-deco" aria-hidden="true">${GROUPS[q.group].icon}</span><p>${escapeHTML(q.prompt)}</p></div>
    ${spelling ? `<form id="answer-form" autocomplete="off"><label for="spelling-input" class="field-label">Deine Antwort</label><input id="spelling-input" name="answer" type="text" maxlength="70" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" required placeholder="Hier schreiben …"><p class="hint">${escapeHTML(q.hint)}</p><button class="primary" type="submit">Antwort prüfen →</button></form>` : `<div class="choices" role="group" aria-label="Antwortmöglichkeiten">${q.options.map((option, index) => `<button data-action="answer" data-value="${index}" class="choice"><span class="choice-num" aria-hidden="true">${index + 1}</span><span>${escapeHTML(option)}</span></button>`).join("")}</div>`}
    <div id="feedback" role="status" aria-live="polite"></div>`);
}

function answer(value) {
  if (!round || round.answered) return;
  const q = round.questions[round.index];
  if (q.type === "spelling" && !String(value).trim()) return;
  if (q.type === "choice" && !q.options.includes(value)) return;
  const right = evaluate(q, value);
  round.answered = true;
  if (right && round.index < round.firstCount) round.firstRight++;
  store.record(q.id, right);
  if (!right && !round.retried.has(q.id)) {
    round.retried.add(q.id);
    round.questions.push(makeQuestion(BY_ID.get(q.id), { mode: q.type, direction: q.direction === "en-de" ? "de-en" : "en-de", variant: q.group === "abc" ? "order" : "identify" }));
  }
  app.querySelectorAll(".choice").forEach((button) => {
    button.disabled = true;
    const text = q.options[Number(button.dataset.value)];
    if (text === q.answer) button.classList.add("is-right");
    else if (text === value) button.classList.add("is-wrong");
  });
  const form = app.querySelector("#answer-form");
  if (form) {
    form.querySelector("input").disabled = true;
    form.querySelector("button").disabled = true;
  }
  const feedback = app.querySelector("#feedback");
  feedback.innerHTML = `<div class="feedback ${right ? "good" : "try"}" tabindex="-1"><span class="feedback-icon" aria-hidden="true">${right ? "✓" : "↺"}</span><div><h2>${right ? "Genau richtig!" : "Gut versucht!"}</h2><p>${right ? `Das war ${escapeHTML(q.answer)}.` : `Die Antwort ist <strong>${escapeHTML(q.answer)}</strong>. ${round.index < round.firstCount ? "Du siehst die Frage gleich noch einmal." : "Du kannst das später noch einmal üben."}`}</p></div></div><button class="primary continue" data-action="continue">${round.index === round.questions.length - 1 ? "Zum Ergebnis" : "Weiter"} →</button>`;
  feedback.querySelector(".feedback").focus();
}

function result() {
  screen = "result";
  const { firstRight, firstCount } = round;
  const missed = store.missedIds.length;
  frame(`<div class="subnav"><button class="back" data-action="home">← Zur Übersicht</button></div><section class="result-card"><div class="result-art" aria-hidden="true">✿</div>${title("Gut geübt!", "RUNDE GESCHAFFT")}<p>Du hast ${firstRight} von ${firstCount} Fragen beim ersten Mal gewusst. Jedes geübte Wort zählt – auch wenn du es noch mal probiert hast.</p><div class="result-count"><strong>${Object.keys(store.state.stats).length}</strong><span>Wörter schon entdeckt</span></div>${missed ? `<button class="primary" data-action="review">${missed} ${missed === 1 ? "Wort" : "Wörter"} noch mal üben →</button>` : `<p class="all-clear">Für den Moment ist nichts mehr offen. ✨</p>`}<button class="secondary" data-action="home">Zur Übersicht</button></section>`);
}

function speak(text, lang) {
  const status = app.querySelector("#speech-status");
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    status.textContent = "Vorlesen ist auf diesem Gerät nicht verfügbar. Du kannst das Wort selbst laut lesen.";
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "de" ? "de-DE" : "en-GB";
    utterance.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (voice) utterance.voice = voice;
    status.textContent = voice ? "Ich lese vor …" : "Ich versuche es mit der Stimme dieses Geräts. Wenn du nichts hörst, lies das Wort selbst laut.";
    utterance.onerror = () => { status.textContent = "Vorlesen hat nicht geklappt. Lies das Wort selbst laut."; };
    window.speechSynthesis.speak(utterance);
  } catch { status.textContent = "Vorlesen hat nicht geklappt. Lies das Wort selbst laut."; }
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === "home") { window.speechSynthesis?.cancel(); home(); }
  else if (action === "group") { group = button.dataset.value; home(); }
  else if (action === "learn") { cardIndex = 0; learn(); }
  else if (action === "prev") { cardIndex--; learn(); }
  else if (action === "next") { cardIndex++; learn(); }
  else if (action === "start") start(button.dataset.value);
  else if (action === "review") start("choice", true);
  else if (action === "answer") answer(round.questions[round.index].options[Number(button.dataset.value)]);
  else if (action === "continue" && round?.answered) { round.index++; showQuestion(); }
  else if (action === "speak") speak(button.dataset.text, button.dataset.lang);
  else if (action === "reset" && window.confirm("Wirklich den gesamten Fortschritt auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.")) { store.reset(); home(); }
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "answer-form") return;
  event.preventDefault();
  answer(event.target.elements.answer.value);
});
home();
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) navigator.serviceWorker.register("./sw.js").catch(() => {});
