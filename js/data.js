// Curated starter list, not a match to any particular school textbook.
// One unambiguous classroom meaning per entry; add new stable IDs when editing.
export const GROUPS = Object.freeze({ abc: { title: "ABC", icon: "Aa", subtitle: "Buchstaben & Reihenfolge" }, classroom: { title: "Im Klassenzimmer", icon: "✏", subtitle: "Dinge & kleine Sätze" }, family: { title: "Familie", icon: "♡", subtitle: "Menschen um dich herum" }, animals: { title: "Tiere", icon: "♣", subtitle: "Groß, klein, wild & zahm" } });

const rows = {
  classroom: [
    ["book", "Buch"], ["notebook", "Heft"], ["pencil", "Bleistift"],
    ["pen", "Kugelschreiber"], ["eraser", "Radiergummi"], ["ruler", "Lineal"],
    ["desk", "Schreibtisch"], ["chair", "Stuhl"], ["board", "Tafel"],
    ["teacher", "Lehrkraft"], ["school", "Schule"], ["schoolbag", "Schultasche"],
    ["scissors", "Schere"], ["glue", "Kleber"], ["paper", "Papier"],
    ["sharpener", "Anspitzer"], ["homework", "Hausaufgaben"], ["question", "Frage"],
    ["answer", "Antwort"], ["window", "Fenster"], ["door", "Tür"],
    ["I don\u0027t know.", "Ich weiß es nicht."],
    ["What\u0027s this?", "Was ist das?"],
    ["Can you help me?", "Kannst du mir helfen?"],
    ["Please speak slowly.", "Bitte sprich langsam."],
    ["May I come in?", "Darf ich reinkommen?"],
    ["I am ready.", "Ich bin bereit."]
  ],
  family: [
    ["mother", "Mutter"], ["father", "Vater"], ["sister", "Schwester"],
    ["brother", "Bruder"], ["grandmother", "Großmutter"], ["grandfather", "Großvater"],
    ["aunt", "Tante"], ["uncle", "Onkel"], ["daughter", "Tochter"],
    ["son", "Sohn"], ["parents", "Eltern"], ["baby", "Baby"],
    ["family", "Familie"], ["child", "Kind"], ["children", "Kinder"],
    ["wife", "Ehefrau"], ["husband", "Ehemann"], ["niece", "Nichte"], ["nephew", "Neffe"]
  ],
  animals: [
    ["dog", "Hund"], ["cat", "Katze"], ["rabbit", "Kaninchen"],
    ["hamster", "Hamster"], ["horse", "Pferd"], ["cow", "Kuh"],
    ["sheep", "Schaf"], ["goat", "Ziege"], ["pig", "Schwein"],
    ["chicken", "Huhn"], ["duck", "Ente"], ["frog", "Frosch"],
    ["mouse", "Maus"], ["bird", "Vogel"], ["fish", "Fisch"],
    ["lion", "Löwe"], ["tiger", "Tiger"], ["elephant", "Elefant"],
    ["monkey", "Affe"], ["bear", "Bär"], ["fox", "Fuchs"],
    ["bee", "Biene"], ["butterfly", "Schmetterling"]
  ]
};
export const WORDS = Object.freeze(Object.entries(rows).flatMap(([group, pairs]) => pairs.map(([en, de], index) => Object.freeze({ id: `${group}-${index + 1}`, group, en, de }))));
export const LETTERS = Object.freeze(Array.from({ length: 26 }, (_, index) => Object.freeze({ id: `abc-${String.fromCharCode(97 + index)}`, group: "abc", en: String.fromCharCode(65 + index), de: String.fromCharCode(65 + index) })));
export const ALL = Object.freeze([...LETTERS, ...WORDS]);
export const BY_ID = new Map(ALL.map((item) => [item.id, item]));
