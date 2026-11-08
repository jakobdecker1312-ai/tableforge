export type ConditionInfo = {
  id: string;
  name: string;
  en: string;
  /** Kürzel für Token-Abzeichen. */
  short: string;
  color: string;
  rules: string[];
};

/** Zustände nach SRD 5.1 (CC BY 4.0), sinngemäß ins Deutsche übertragen. */
export const CONDITIONS: ConditionInfo[] = [
  {
    id: "blinded",
    name: "Blind",
    en: "Blinded",
    short: "Bl",
    color: "#94a3b8",
    rules: [
      "Die Kreatur kann nicht sehen und scheitert automatisch bei Proben, die Sicht erfordern.",
      "Angriffswürfe gegen sie haben Vorteil, ihre eigenen Angriffswürfe haben Nachteil.",
    ],
  },
  {
    id: "charmed",
    name: "Bezaubert",
    en: "Charmed",
    short: "Bz",
    color: "#f472b6",
    rules: [
      "Sie kann den Bezauberer nicht angreifen und nicht mit schädlichen Fähigkeiten oder magischen Effekten anvisieren.",
      "Der Bezauberer hat Vorteil bei allen Charisma-Proben, um mit ihr sozial zu interagieren.",
    ],
  },
  {
    id: "deafened",
    name: "Taub",
    en: "Deafened",
    short: "Ta",
    color: "#a8a29e",
    rules: ["Die Kreatur kann nicht hören und scheitert automatisch bei Proben, die Gehör erfordern."],
  },
  {
    id: "exhaustion",
    name: "Erschöpfung",
    en: "Exhaustion",
    short: "Er",
    color: "#fb923c",
    rules: [
      "Erschöpfung gibt es in sechs Stufen, die sich summieren (siehe Tabelle).",
      "Eine lange Rast mit Nahrung und Wasser senkt die Erschöpfung um eine Stufe.",
    ],
  },
  {
    id: "frightened",
    name: "Verängstigt",
    en: "Frightened",
    short: "Vä",
    color: "#a78bfa",
    rules: [
      "Nachteil auf Attributs- und Angriffswürfe, solange die Furchtquelle in Sichtlinie ist.",
      "Die Kreatur kann sich nicht freiwillig näher an die Furchtquelle heranbewegen.",
    ],
  },
  {
    id: "grappled",
    name: "Festgehalten",
    en: "Grappled",
    short: "Fh",
    color: "#facc15",
    rules: [
      "Die Bewegungsrate sinkt auf 0 und kann nicht erhöht werden.",
      "Der Zustand endet, wenn der Greifende kampfunfähig wird oder ein Effekt die Kreatur aus seiner Reichweite entfernt.",
    ],
  },
  {
    id: "incapacitated",
    name: "Kampfunfähig",
    en: "Incapacitated",
    short: "Ku",
    color: "#f87171",
    rules: ["Die Kreatur kann keine Aktionen und keine Reaktionen ausführen."],
  },
  {
    id: "invisible",
    name: "Unsichtbar",
    en: "Invisible",
    short: "Un",
    color: "#67e8f9",
    rules: [
      "Ohne Magie oder besondere Sinne ist die Kreatur nicht zu sehen. Fürs Verstecken zählt sie als stark verdeckt, ihre Position verrät sich aber durch Geräusche oder Spuren.",
      "Angriffswürfe gegen sie haben Nachteil, ihre eigenen Angriffswürfe haben Vorteil.",
    ],
  },
  {
    id: "paralyzed",
    name: "Gelähmt",
    en: "Paralyzed",
    short: "Gl",
    color: "#fcd34d",
    rules: [
      "Die Kreatur ist kampfunfähig und kann sich weder bewegen noch sprechen.",
      "Sie scheitert automatisch bei Stärke- und Geschicklichkeits-Rettungswürfen.",
      "Angriffswürfe gegen sie haben Vorteil. Jeder Treffer aus höchstens 1,5 m Entfernung ist ein kritischer Treffer.",
    ],
  },
  {
    id: "petrified",
    name: "Versteinert",
    en: "Petrified",
    short: "Vs",
    color: "#78716c",
    rules: [
      "Die Kreatur wird samt getragener Ausrüstung in eine feste, leblose Substanz verwandelt. Ihr Gewicht verzehnfacht sich, sie altert nicht.",
      "Sie ist kampfunfähig, kann sich nicht bewegen oder sprechen und nimmt ihre Umgebung nicht wahr.",
      "Angriffswürfe gegen sie haben Vorteil. Sie scheitert bei Stärke- und Geschicklichkeits-Rettungswürfen.",
      "Sie hat Resistenz gegen allen Schaden und ist immun gegen Gift und Krankheiten.",
    ],
  },
  {
    id: "poisoned",
    name: "Vergiftet",
    en: "Poisoned",
    short: "Vg",
    color: "#4ade80",
    rules: ["Die Kreatur hat Nachteil auf Angriffswürfe und Attributswürfe."],
  },
  {
    id: "prone",
    name: "Liegend",
    en: "Prone",
    short: "Li",
    color: "#d6a15f",
    rules: [
      "Die Kreatur kann sich nur kriechend bewegen, es sei denn, sie steht auf (kostet die Hälfte ihrer Bewegungsrate).",
      "Sie hat Nachteil auf eigene Angriffswürfe.",
      "Angriffe gegen sie haben Vorteil, wenn der Angreifer höchstens 1,5 m entfernt ist, sonst Nachteil.",
    ],
  },
  {
    id: "restrained",
    name: "Festgesetzt",
    en: "Restrained",
    short: "Fg",
    color: "#fb7185",
    rules: [
      "Die Bewegungsrate sinkt auf 0 und kann nicht erhöht werden.",
      "Angriffswürfe gegen sie haben Vorteil, ihre eigenen haben Nachteil.",
      "Nachteil bei Geschicklichkeits-Rettungswürfen.",
    ],
  },
  {
    id: "stunned",
    name: "Betäubt",
    en: "Stunned",
    short: "Bt",
    color: "#fde047",
    rules: [
      "Die Kreatur ist kampfunfähig, kann sich nicht bewegen und spricht nur stockend.",
      "Sie scheitert automatisch bei Stärke- und Geschicklichkeits-Rettungswürfen.",
      "Angriffswürfe gegen sie haben Vorteil.",
    ],
  },
  {
    id: "unconscious",
    name: "Bewusstlos",
    en: "Unconscious",
    short: "Bw",
    color: "#60a5fa",
    rules: [
      "Die Kreatur ist kampfunfähig, kann sich nicht bewegen oder sprechen und bekommt nichts mit. Sie lässt alles fallen und fällt um.",
      "Sie scheitert automatisch bei Stärke- und Geschicklichkeits-Rettungswürfen.",
      "Angriffswürfe gegen sie haben Vorteil. Jeder Treffer aus höchstens 1,5 m Entfernung ist ein kritischer Treffer.",
    ],
  },
];

export function conditionById(id: string): ConditionInfo | undefined {
  return CONDITIONS.find((c) => c.id === id);
}

export const EXHAUSTION_LEVELS: { level: number; effect: string }[] = [
  { level: 1, effect: "Nachteil auf Attributswürfe" },
  { level: 2, effect: "Bewegungsrate halbiert" },
  { level: 3, effect: "Nachteil auf Angriffs- und Rettungswürfe" },
  { level: 4, effect: "Maximale Trefferpunkte halbiert" },
  { level: 5, effect: "Bewegungsrate sinkt auf 0" },
  { level: 6, effect: "Tod" },
];
