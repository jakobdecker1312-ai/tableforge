export type RuleSection = {
  id: string;
  title: string;
  rows: { label: string; text: string }[];
};

/** Schnellreferenz nach SRD 5.1 (CC BY 4.0), sinngemäß ins Deutsche übertragen. */
export const RULES: RuleSection[] = [
  {
    id: "dc",
    title: "Schwierigkeitsgrade (SG)",
    rows: [
      { label: "Sehr leicht", text: "SG 5" },
      { label: "Leicht", text: "SG 10" },
      { label: "Mittel", text: "SG 15" },
      { label: "Schwer", text: "SG 20" },
      { label: "Sehr schwer", text: "SG 25" },
      { label: "Beinahe unmöglich", text: "SG 30" },
    ],
  },
  {
    id: "adv",
    title: "Vorteil und Nachteil",
    rows: [
      { label: "Vorteil", text: "Zwei W20 werfen, den höheren Wert nehmen." },
      { label: "Nachteil", text: "Zwei W20 werfen, den niedrigeren Wert nehmen." },
      { label: "Beides", text: "Vorteil und Nachteil heben sich auf, egal wie viele Quellen es gibt." },
    ],
  },
  {
    id: "cover",
    title: "Deckung",
    rows: [
      { label: "Halbe Deckung", text: "+2 auf Rüstungsklasse und Geschicklichkeits-Rettungswürfe." },
      { label: "Dreiviertel-Deckung", text: "+5 auf Rüstungsklasse und Geschicklichkeits-Rettungswürfe." },
      { label: "Volle Deckung", text: "Das Ziel kann nicht direkt angegriffen oder anvisiert werden." },
    ],
  },
  {
    id: "actions",
    title: "Aktionen im Kampf",
    rows: [
      { label: "Angreifen", text: "Ein Nah- oder Fernkampfangriff (mit Mehrfachangriff entsprechend mehr)." },
      { label: "Zauber wirken", text: "Einen Zauber mit der Zauberzeit „1 Aktion“ wirken." },
      { label: "Spurt", text: "Die Bewegungsrate gilt für diesen Zug zusätzlich noch einmal." },
      { label: "Rückzug", text: "Die Bewegung in diesem Zug löst keine Gelegenheitsangriffe aus." },
      { label: "Ausweichen", text: "Angriffe gegen dich haben Nachteil, du hast Vorteil auf Geschicklichkeits-Rettungswürfe (bis zu deinem nächsten Zug)." },
      { label: "Helfen", text: "Ein Verbündeter bekommt Vorteil auf seine nächste Probe oder seinen nächsten Angriff gegen eine Kreatur in deiner Nähe." },
      { label: "Verstecken", text: "Eine Geschicklichkeitsprobe (Heimlichkeit), um unbemerkt zu bleiben." },
      { label: "Bereithalten", text: "Eine Reaktion vorbereiten, die bei einem festgelegten Auslöser eintritt." },
      { label: "Suchen", text: "Eine Wahrnehmungs- oder Nachforschungsprobe, um etwas zu finden." },
      { label: "Gegenstand benutzen", text: "Mit einem Gegenstand interagieren, wenn die freie Interaktion nicht reicht." },
    ],
  },
  {
    id: "death",
    title: "Sterben und Stabilisieren",
    rows: [
      { label: "0 Trefferpunkte", text: "Die Kreatur ist bewusstlos und beginnt mit Todesrettungswürfen." },
      { label: "Todesrettungswurf", text: "W20 zu Beginn des eigenen Zuges: 10 oder mehr ist ein Erfolg, sonst ein Fehlschlag." },
      { label: "Natürliche 20", text: "Die Kreatur kommt mit 1 Trefferpunkt zurück." },
      { label: "Natürliche 1", text: "Zählt als zwei Fehlschläge." },
      { label: "Ergebnis", text: "Drei Erfolge: stabil. Drei Fehlschläge: tot. Schaden bei 0 TP bringt einen Fehlschlag (kritisch: zwei)." },
    ],
  },
  {
    id: "rest",
    title: "Rasten",
    rows: [
      { label: "Kurze Rast", text: "Mindestens 1 Stunde. Trefferwürfel ausgeben, um Trefferpunkte zurückzugewinnen." },
      { label: "Lange Rast", text: "Mindestens 8 Stunden (davon mindestens 6 Schlaf). Alle Trefferpunkte zurück und die Hälfte der Trefferwürfel; maximal einmal pro 24 Stunden." },
    ],
  },
  {
    id: "damage",
    title: "Schadensarten",
    rows: [
      { label: "Körperlich", text: "Hieb, Stich, Wucht" },
      { label: "Elementar", text: "Feuer, Kälte, Blitz, Säure, Schall" },
      { label: "Übrige", text: "Gift, Psychisch, Nekrotisch, Strahlend, Energie (Force)" },
    ],
  },
];
