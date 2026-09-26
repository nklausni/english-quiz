# Word Garden – Englisch üben

Eine mobile, offlinefähige Vokabel-PWA für Kinder. Kein Konto, kein Tracking, keine Server-API und keine externen Assets. Oberfläche und Anleitungen sind auf Deutsch; die englischen Wörter werden mit Übersetzung gelernt. Der Inhalt ist eine redaktionell zusammengestellte Übungsliste und **wird nicht als exakte Liste eines bestimmten Schulbuchs ausgegeben**.

## Lokal starten

Im Repository:

    python3 -m http.server 8742

Dann http://localhost:8742/ im Browser öffnen. JavaScript-Module und Service Worker funktionieren nicht zuverlässig über file://. Keine Installation und kein Build nötig. Tests mit `node --test` oder `npm test` (nur Node, kein npm install nötig).

## Lernen

- Thema wählen: Klassenzimmer, Familie, Tiere oder Alltag; alternativ alle Themen. Die drei handschriftlichen Schulwortlisten sind abgeglichen: 10 von 44 englischen Einträgen waren bereits vorhanden, 34 wurden ergänzt. Bestehende Einträge behalten ihre IDs und den gespeicherten Fortschritt. Auf dem dritten Foto wurde „care“ wörtlich als „Fürsorge“ verstanden (nicht „car“); „big city“ ist ein Eintrag. „lineal“ auf dem zweiten Foto wurde als deutsche Angabe zum bereits vorhandenen „ruler“ eingeordnet.
- Entdecken: Karte für Karte lesen, deutsche Bedeutung sehen und auf Wunsch Englisch oder Deutsch vorlesen lassen. Die letzte Karte hat einen „Fertig“-Knopf mit Abschlussansicht und Einstieg ins Wörter-Quiz. Angesehene Wörter zählen zum lokal gespeicherten Entdeckungsfortschritt, ohne als richtige Quizantworten zu gelten. Vorlesen verwendet die Systemstimmen des Browsers; ohne passende Stimme wird die Standardsprache des Geräts versucht. Ohne Web Speech geht es ohne Ton weiter.
- Wörter-Quiz: Vier eindeutige Antworten, abwechselnd Englisch → Deutsch und Deutsch → Englisch.
- Schreiben: Aus einer deutschen Vorgabe das englische Wort selbst schreiben. Groß-/Kleinschreibung, extra Leerzeichen, typografische Apostrophe und abschließende Satzzeichen werden toleriert; fehlende Buchstaben oder Apostrophe nicht.
- Bunter Mix: Auswahl und Schreiben in einer Runde. Falsche Fragen werden innerhalb derselben Runde einmal wiederholt und bleiben unter „Noch mal üben“ verfügbar, bis sie richtig beantwortet werden. Kein Zeitlimit und kein Punktabzug.

Beim Umstieg auf die Version ohne Alphabet werden frühere Buchstabenstände aus dem Spielstand entfernt; Vokabelantworten bleiben erhalten.

Bei manchen Wörtern gibt es mehrere mögliche Übersetzungen: Diese Liste verwendet bewusst genau eine einfache Schulbedeutung pro Eintrag. Beispielsweise ist „pen“ hier „Kugelschreiber“. Das Kind sollte andere richtige Bedeutungen nicht als falsch im allgemeinen Sprachgebrauch verstehen; die Schreibübung fragt immer die in der Liste angezeigte englische Form ab. Bei neuen Einträgen mehrdeutige Antwortpaare vermeiden.

## Wortliste ändern

`js/data.js` enthält Paare `["English", "Deutsch"]` in `rows.classroom`, `rows.family`, `rows.animals`, `rows.everyday`. Neue Einträge am Ende einer Themenliste anhängen (die IDs basieren auf der Listenposition; Umordnen oder Einfügen mitten in die Liste würde gespeicherten Fortschritt falschen Wörtern zuordnen). Beide Übersetzungen müssen eindeutig bleiben, auch über Themen hinweg. Tests nach Änderungen ausführen. Beim Veröffentlichen von Änderungen an Offline-Dateien die Cache-Version in `sw.js` erhöhen, damit bereits installierte Geräte aktualisiert werden.

## GitHub Pages

Das Repository unter `nklausni/english-quiz` veröffentlichen und in Settings → Pages die Bereitstellung aus dem Hauptzweig, Verzeichnis `/ (root)`, aktivieren. Danach ist die App unter https://nklausni.github.io/english-quiz/ erreichbar. Alle Assetpfade und der Service-Worker-Scope sind relativ zu `/english-quiz/`. Auf iOS Safari: Teilen → Zum Home-Bildschirm. Bei einer Erstinstallation ist eine Verbindung nötig; danach sind vorgecachete App-Dateien offline verfügbar. Safari unterstützt Web-Push/Installationshinweise je nach Version anders; Vorlesen ist optional.

## Datenschutz & Dateien

Fortschritt liegt ausschließlich unter `word-garden-progress` im lokalen Speicher des Browsers; es werden keine Namen abgefragt oder übertragen. Der Löschknopf fragt vorher nach Bestätigung. Browserdaten löschen oder privaten Modus nutzen kann den Fortschritt entfernen. Bei neueren unbekannten Spielstand-Schemas wird absichtlich nicht überschrieben; defekte Daten bzw. deaktivierter Speicher führen nicht zum Absturz. Die App lädt keine fremden Schriften/Bilder und verwendet nur selbst gezeichnete Formen und ein eigenes SVG-Icon.

- `index.html`, `css/style.css`: Oberfläche, responsive Gestaltung und Barrierefreiheit
- `js/data.js`: bearbeitbare Wortpaare
- `js/quiz.js`: Fragen, Ablenkungsantworten, Bewertung
- `js/store.js`: lokale Speicherung und Migration
- `js/app.js`: Screens, Interaktionen und optionale Sprachausgabe
- `sw.js`, `manifest.webmanifest`, `icons/`: Installation und Offline-Dateien; PNG-App-Icons mit `node tools/make-icons.mjs` aus eigenen Formen erzeugen
- `tests/quiz.test.js`, `tests/ui.test.js`, `tests/offline.test.js`: Node-Tests ohne Browserpakete
