import type { Mood } from "@/liveblocks.config";

export type TemplateMonster = { monsterId: string; count: number; x: number; y: number; spread?: number };

export type AdventureTemplate = {
  id: string;
  title: string;
  text: string;
  mood: Mood;
  fog: boolean;
  intro: string;
  tips: string[];
  monsters: TemplateMonster[];
  /** Position in Rasterfeldern (20 × 12) */
  map: () => string;
};

const W = 1000;
const H = 600;

function svgUrl(body: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const glow = (x: number, y: number, r: number, color: string) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#g-${color.replace("#", "")})"/>`;
const glowDef = (color: string) =>
  `<radialGradient id="g-${color.replace("#", "")}"><stop offset="0" stop-color="${color}" stop-opacity="0.7"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

function ruinMap(): string {
  const floor = "#3b3743";
  const wall = "#14121a";
  const rooms: [number, number, number, number][] = [
    [50, 50, 200, 200],
    [50, 350, 250, 200],
    [350, 150, 300, 300],
    [700, 50, 250, 200],
    [700, 350, 250, 200],
  ];
  const corridors: [number, number, number, number][] = [
    [250, 130, 100, 50],
    [150, 250, 50, 100],
    [300, 400, 50, 50],
    [650, 280, 50, 50],
    [800, 250, 50, 100],
    [450, 50, 50, 100],
    [450, 450, 50, 100],
  ];
  const r = rng(7);
  let body = `<defs>${glowDef("#f59e0b")}</defs><rect width="${W}" height="${H}" fill="#0e0c12"/>`;
  for (const [x, y, w, h] of [...rooms, ...corridors]) {
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${floor}" stroke="${wall}" stroke-width="10"/>`;
  }
  for (const [x, y, w, h] of corridors) body += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" fill="${floor}"/>`;
  // Steinplatten
  for (const [x, y, w, h] of rooms) {
    for (let i = 0; i < 18; i++) {
      const px = x + 10 + r() * (w - 30);
      const py = y + 10 + r() * (h - 30);
      body += `<rect x="${px}" y="${py}" width="${14 + r() * 24}" height="${10 + r() * 16}" fill="#463f4f" opacity="0.5"/>`;
    }
  }
  // Säulen in der Haupthalle
  for (const [px, py] of [[400, 200], [600, 200], [400, 400], [600, 400]]) {
    body += `<circle cx="${px}" cy="${py}" r="16" fill="#58506a" stroke="${wall}" stroke-width="4"/>`;
  }
  // Altar + Schatzkammer + Gruft
  body += `<rect x="470" y="270" width="60" height="60" fill="#5a2230" stroke="#14121a" stroke-width="4"/>`;
  for (let i = 0; i < 9; i++) body += `<circle cx="${760 + (i % 3) * 22 + r() * 8}" cy="${120 + Math.floor(i / 3) * 18}" r="9" fill="#e5b92f"/>`;
  for (let i = 0; i < 4; i++) body += `<rect x="${730 + i * 48}" y="${420}" width="34" height="62" fill="#2a2630" stroke="#14121a" stroke-width="3" rx="4"/>`;
  // Fackeln
  for (const [px, py] of [[60, 60], [240, 60], [60, 540], [290, 540], [360, 160], [640, 160], [710, 60], [940, 60], [710, 540], [940, 540]]) {
    body += glow(px, py, 38, "#f59e0b") + `<circle cx="${px}" cy="${py}" r="5" fill="#fbbf24"/>`;
  }
  return svgUrl(body);
}

function forestMap(): string {
  const r = rng(21);
  let body = `<defs>${glowDef("#9bb8ff")}<radialGradient id="bg"><stop offset="0" stop-color="#1f3a2a"/><stop offset="1" stop-color="#0b160f"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  // Bach
  body += `<path d="M-10 90 C 200 140, 250 40, 460 120 S 760 200, 1010 150" stroke="#2c5a78" stroke-width="34" fill="none" opacity="0.85"/>`;
  body += `<path d="M-10 90 C 200 140, 250 40, 460 120 S 760 200, 1010 150" stroke="#6fa5c7" stroke-width="6" fill="none" opacity="0.5"/>`;
  // Lichtung
  body += `<ellipse cx="520" cy="330" rx="230" ry="160" fill="#2f5a3a"/><ellipse cx="520" cy="330" rx="200" ry="135" fill="#376a42"/>`;
  body += glow(520, 330, 220, "#9bb8ff");
  // Pfad
  body += `<path d="M-10 560 C 150 470, 280 520, 380 420 S 440 360, 520 340" stroke="#6b5a40" stroke-width="42" fill="none" stroke-linecap="round" opacity="0.9"/>`;
  // Steinkreis
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    body += `<rect x="${520 + Math.cos(a) * 70 - 11}" y="${330 + Math.sin(a) * 50 - 14}" width="22" height="28" rx="5" fill="#8a8f98" stroke="#2b2e33" stroke-width="3"/>`;
  }
  body += `<circle cx="520" cy="330" r="18" fill="#4b2a5e" stroke="#9b7bd1" stroke-width="3"/>`;
  // Bäume
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = r() * H;
    if (((x - 520) / 260) ** 2 + ((y - 330) / 190) ** 2 < 1) continue;
    const rad = 22 + r() * 24;
    body += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${r() > 0.5 ? "#0f2a18" : "#143620"}" stroke="#08130b" stroke-width="3"/><circle cx="${x - rad * 0.2}" cy="${y - rad * 0.2}" r="${rad * 0.55}" fill="#1b4a2c" opacity="0.7"/>`;
  }
  // Mond-Glanz
  body += `<rect width="${W}" height="${H}" fill="#0a1830" opacity="0.18"/>`;
  return svgUrl(body);
}

function dragonMap(): string {
  const r = rng(99);
  let body = `<defs>${glowDef("#ff6a1a")}<radialGradient id="bg"><stop offset="0" stop-color="#3a1d12"/><stop offset="1" stop-color="#150907"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  // Lavaflüsse
  const lava = ["M-10 220 C 150 260, 220 180, 380 260 S 560 380, 640 300", "M300 610 C 340 520, 460 540, 520 470", "M780 -10 C 760 80, 840 130, 800 230"];
  for (const d of lava) {
    body += `<path d="${d}" stroke="#7a1d05" stroke-width="56" fill="none"/><path d="${d}" stroke="#e2491a" stroke-width="34" fill="none"/><path d="${d}" stroke="#ffb347" stroke-width="10" fill="none" opacity="0.8"/>`;
    body += `<path d="${d}" stroke="#ff6a1a" stroke-width="90" fill="none" opacity="0.15"/>`;
  }
  // Felsplatten als begehbare Inseln
  const rocks: [number, number, number, number][] = [
    [60, 330, 300, 230],
    [420, 320, 160, 120],
    [640, 60, 120, 160],
    [650, 380, 300, 190],
    [60, 60, 240, 100],
  ];
  for (const [x, y, w, h] of rocks) {
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="#4a3a33" stroke="#1a0f0b" stroke-width="8"/>`;
    for (let i = 0; i < 10; i++)
      body += `<circle cx="${x + 14 + r() * (w - 28)}" cy="${y + 14 + r() * (h - 28)}" r="${3 + r() * 6}" fill="#5c4a41" opacity="0.7"/>`;
  }
  // Brücken
  body += `<rect x="360" y="400" width="60" height="30" fill="#6b4a2a" stroke="#2a1608" stroke-width="3"/><rect x="580" y="410" width="70" height="30" fill="#6b4a2a" stroke="#2a1608" stroke-width="3"/>`;
  // Drachenhort
  body += glow(820, 470, 120, "#ff6a1a");
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 80;
    body += `<circle cx="${820 + Math.cos(a) * d}" cy="${470 + Math.sin(a) * d * 0.7}" r="${6 + r() * 6}" fill="${r() > 0.3 ? "#f2c230" : "#e8ece9"}" stroke="#8a5a0a" stroke-width="1.5"/>`;
  }
  // Rauchschwaden
  body += `<rect width="${W}" height="${H}" fill="#300a05" opacity="0.15"/>`;
  return svgUrl(body);
}

function cityMap(): string {
  const r = rng(5);
  let body = `<defs>${glowDef("#7fd1ff")}</defs><rect width="${W}" height="${H}" fill="#47405a"/>`;
  // Pflaster
  for (let i = 0; i < 260; i++) {
    body += `<rect x="${r() * W}" y="${r() * H}" width="${16 + r() * 20}" height="${10 + r() * 10}" fill="#52496a" opacity="0.55"/>`;
  }
  // Gebäude
  const colors = ["#7a4a35", "#6b3f3a", "#5e5446", "#7e5a40"];
  const blocks: [number, number, number, number][] = [
    [30, 30, 200, 150],
    [260, 30, 140, 150],
    [600, 30, 170, 150],
    [800, 30, 170, 150],
    [30, 420, 200, 150],
    [260, 440, 160, 130],
    [600, 440, 180, 130],
    [810, 420, 160, 150],
    [30, 215, 130, 150],
    [840, 215, 130, 150],
  ];
  blocks.forEach(([x, y, w, h], i) => {
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${colors[i % 4]}" stroke="#1d1520" stroke-width="8"/>`;
    body += `<path d="M${x} ${y + h / 2}H${x + w}" stroke="#1d1520" stroke-width="3" opacity="0.5"/><path d="M${x + w / 2} ${y}V${y + h}" stroke="#1d1520" stroke-width="3" opacity="0.5"/>`;
  });
  // Marktplatz mit Brunnen
  body += `<circle cx="500" cy="300" r="62" fill="#3b6f8c" stroke="#1d1520" stroke-width="10"/><circle cx="500" cy="300" r="48" fill="#6fb8dc"/><circle cx="500" cy="300" r="12" fill="#a8d6ec" stroke="#1d1520" stroke-width="3"/>`;
  body += glow(500, 300, 100, "#7fd1ff");
  // Marktstände
  const stalls: [number, number][] = [[360, 240], [360, 330], [610, 240], [610, 340], [480, 160], [500, 440]];
  stalls.forEach(([x, y], i) => {
    body += `<rect x="${x}" y="${y}" width="56" height="34" rx="4" fill="${["#b43a3a", "#3a7ab4", "#c49a2a", "#3ab47a"][i % 4]}" stroke="#1d1520" stroke-width="3"/>`;
  });
  return svgUrl(body);
}

export const TEMPLATES: AdventureTemplate[] = [
  {
    id: "ruine",
    title: "Die Burgruine",
    text: "Verfluchte Mauern, Untote und ein vergessener Schatz.",
    mood: "dungeon",
    fog: true,
    intro:
      "Unter den Trümmern der alten Burg liegt eine Gruft. Ein Kult weckt dort die Toten, um den verborgenen Schatz zu hüten. Die Gruppe steigt durch den Eingang unten links hinab.",
    tips: [
      "Nebel und dynamische Sicht sind schon an, die Helden decken den Weg beim Erkunden auf.",
      "Skelette lauern in der Haupthalle, der Altar in der Mitte ist das Herz des Kults.",
      "Die Schatzkammer liegt oben rechts, die Gruft mit Ghul unten rechts.",
    ],
    monsters: [
      { monsterId: "skeleton", count: 3, x: 10, y: 5.5, spread: 1.2 },
      { monsterId: "zombie", count: 1, x: 8, y: 7.5 },
      { monsterId: "cultist", count: 2, x: 10, y: 5.2, spread: 0.8 },
      { monsterId: "ghoul", count: 1, x: 16, y: 9.5 },
    ],
    map: ruinMap,
  },
  {
    id: "wald",
    title: "Der Mondwald",
    text: "Uralte Bäume, Wölfe und ein Hexenzirkel im Nebel.",
    mood: "storm",
    fog: false,
    intro:
      "In der Nacht verschwinden Dorfbewohner im Mondwald. Auf einer Lichtung steht ein Steinkreis, an dem ein Zirkel dunkle Rituale hält. Wölfe und Riesenspinnen bewachen die Pfade.",
    tips: [
      "Die Gruppe startet unten links auf dem Pfad.",
      "Der Eulenbär streift am Waldrand oben rechts.",
      "Sturm-Stimmung ist an, im Tab Karte kannst du sie ändern.",
    ],
    monsters: [
      { monsterId: "wolf", count: 3, x: 6, y: 6, spread: 1.5 },
      { monsterId: "giant-spider", count: 2, x: 15, y: 9, spread: 1.5 },
      { monsterId: "cultist", count: 2, x: 10.4, y: 6.6, spread: 1.2 },
      { monsterId: "owlbear", count: 1, x: 17, y: 3 },
    ],
    map: forestMap,
  },
  {
    id: "drache",
    title: "Der Drachenberg",
    text: "Glutroter Himmel und ein Hort voller Gold.",
    mood: "battle",
    fog: false,
    intro:
      "Ein junger Roter Drache hat die Höhle im Berg bezogen. Kobolde und Orks dienen ihm. Lavaflüsse trennen die Felsplatten, und der Hort glänzt unten rechts.",
    tips: [
      "Kobolde greifen im Rudel an, der Drache wartet am Hort.",
      "Die Lava ist Gelände: wer hineinfällt, erleidet schweren Feuerschaden (Hausregel nach Absprache).",
    ],
    monsters: [
      { monsterId: "kobold", count: 4, x: 5, y: 8.5, spread: 1.5 },
      { monsterId: "orc", count: 2, x: 15, y: 9, spread: 1.2 },
      { monsterId: "young-red-dragon", count: 1, x: 16.5, y: 9.2 },
    ],
    map: dragonMap,
  },
  {
    id: "stadt",
    title: "Die Königsstadt",
    text: "Intrigen, Märkte und Abenteuer hinter weißen Mauern.",
    mood: "tavern",
    fog: false,
    intro:
      "Auf dem Marktplatz der Königsstadt wird ein Adliger bestohlen. Die Wache ist überfordert, Banditen mischen sich unters Volk, und ein Magier beobachtet das Treiben vom Rand.",
    tips: [
      "Ein ruhiger Einstieg für Rollenspiel: Gespräche, Gerüchte und Verfolgungsjagden.",
      "Wache und Händler sind schon als Tokens da, die Banditen verstecken sich unter dem Volk.",
    ],
    monsters: [
      { monsterId: "guard", count: 2, x: 7, y: 6, spread: 1 },
      { monsterId: "bandit", count: 3, x: 12.5, y: 6, spread: 1.5 },
      { monsterId: "noble", count: 1, x: 10, y: 3.5 },
      { monsterId: "commoner", count: 2, x: 9, y: 8, spread: 1.5 },
      { monsterId: "mage", count: 1, x: 17, y: 5 },
    ],
    map: cityMap,
  },
];

export function getTemplate(id: string | null | undefined): AdventureTemplate | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}
