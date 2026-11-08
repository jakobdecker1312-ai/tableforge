import { v4 as uuid } from "uuid";
import type { Ability, CharacterSheet } from "@/liveblocks.config";

export const ABILITIES: { id: Ability; short: string; name: string }[] = [
  { id: "str", short: "STR", name: "Stärke" },
  { id: "dex", short: "GES", name: "Geschicklichkeit" },
  { id: "con", short: "KON", name: "Konstitution" },
  { id: "int", short: "INT", name: "Intelligenz" },
  { id: "wis", short: "WEI", name: "Weisheit" },
  { id: "cha", short: "CHA", name: "Charisma" },
];

export const SKILLS: { id: string; name: string; ability: Ability }[] = [
  { id: "acrobatics", name: "Akrobatik", ability: "dex" },
  { id: "animal-handling", name: "Mit Tieren umgehen", ability: "wis" },
  { id: "arcana", name: "Arkane Kunde", ability: "int" },
  { id: "athletics", name: "Athletik", ability: "str" },
  { id: "deception", name: "Täuschen", ability: "cha" },
  { id: "history", name: "Geschichte", ability: "int" },
  { id: "insight", name: "Motiv erkennen", ability: "wis" },
  { id: "intimidation", name: "Einschüchtern", ability: "cha" },
  { id: "investigation", name: "Nachforschungen", ability: "int" },
  { id: "medicine", name: "Heilkunde", ability: "wis" },
  { id: "nature", name: "Naturkunde", ability: "int" },
  { id: "perception", name: "Wahrnehmung", ability: "wis" },
  { id: "performance", name: "Darbietung", ability: "cha" },
  { id: "persuasion", name: "Überzeugen", ability: "cha" },
  { id: "religion", name: "Religion", ability: "int" },
  { id: "sleight-of-hand", name: "Fingerfertigkeit", ability: "dex" },
  { id: "stealth", name: "Heimlichkeit", ability: "dex" },
  { id: "survival", name: "Überlebenskunst", ability: "wis" },
];

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}

export function formatBonus(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export function skillBonus(sheet: CharacterSheet, skillId: string): number {
  const skill = SKILLS.find((s) => s.id === skillId);
  if (!skill) return 0;
  const prof = sheet.skillProf[skillId] ?? 0;
  return abilityMod(sheet.abilities[skill.ability]) + prof * proficiencyBonus(sheet.level);
}

export function saveBonus(sheet: CharacterSheet, ability: Ability): number {
  const prof = sheet.saveProf.includes(ability) ? proficiencyBonus(sheet.level) : 0;
  return abilityMod(sheet.abilities[ability]) + prof;
}

export function createBlankSheet(init: {
  ownerKey: string;
  ownerName: string;
  color: string;
}): CharacterSheet {
  return {
    id: uuid(),
    ownerKey: init.ownerKey,
    ownerName: init.ownerName,
    createdAt: Date.now(),
    name: "Neuer Held",
    className: "",
    race: "",
    background: "",
    alignment: "",
    level: 1,
    xp: 0,
    color: init.color,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saveProf: [],
    skillProf: {},
    ac: 10,
    speed: 9,
    initiativeBonus: 0,
    hpMax: 10,
    hpCurrent: 10,
    hpTemp: 0,
    hitDice: "1W8",
    deathSuccesses: 0,
    deathFailures: 0,
    attacks: [],
    spellAbility: "",
    slotsMax: new Array<number>(9).fill(0),
    slotsUsed: new Array<number>(9).fill(0),
    equipment: "",
    features: "",
    traits: "",
    notes: "",
  };
}

/** Datei-Inhalt für den Export (ohne private Felder wie Besitzer und Token-Verknüpfung). */
export function sheetExportPayload(sheet: CharacterSheet) {
  const { id, ownerKey, ownerName, tokenId, ...rest } = sheet;
  void id;
  void ownerKey;
  void ownerName;
  void tokenId;
  return { app: "tableforge", type: "character-sheet", version: 1, sheet: rest };
}

/**
 * Prüft und bereinigt importierte Daten und legt sie über einen leeren Bogen.
 * Unbekannte oder fehlerhafte Felder werden verworfen.
 */
export function normalizeSheet(raw: unknown, base: CharacterSheet): CharacterSheet | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const str = (v: unknown, fallback: string, max = 4000) =>
    typeof v === "string" ? v.slice(0, max) : fallback;
  const num = (v: unknown, fallback: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(max, Math.max(min, Math.round(v)))
      : fallback;
  const obj = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

  const abilitiesRaw = obj(r.abilities);
  const abilities = { ...base.abilities };
  for (const a of ABILITIES) {
    abilities[a.id] = num(abilitiesRaw[a.id], base.abilities[a.id], 1, 30);
  }

  const saveProf = (Array.isArray(r.saveProf) ? r.saveProf : []).filter(
    (v): v is string => typeof v === "string" && ABILITIES.some((a) => a.id === v)
  );

  const skillRaw = obj(r.skillProf);
  const skillProf: { [skillId: string]: number } = {};
  for (const s of SKILLS) {
    const v = skillRaw[s.id];
    if (v === 1 || v === 2) skillProf[s.id] = v;
  }

  const attacks = (Array.isArray(r.attacks) ? r.attacks : []).slice(0, 20).flatMap((a) => {
    const o = obj(a);
    return [
      {
        id: uuid(),
        name: str(o.name, "Angriff", 60),
        bonus: num(o.bonus, 0, -20, 30),
        damage: str(o.damage, "1W6", 40),
      },
    ];
  });

  const slots = (v: unknown) =>
    Array.from({ length: 9 }, (_, i) => (Array.isArray(v) ? num(v[i], 0, 0, 9) : 0));
  const slotsMax = slots(r.slotsMax);
  const slotsUsed = slots(r.slotsUsed).map((u, i) => Math.min(u, slotsMax[i]));

  const spellAbility =
    typeof r.spellAbility === "string" && ABILITIES.some((a) => a.id === r.spellAbility)
      ? r.spellAbility
      : "";

  const hpMax = num(r.hpMax, base.hpMax, 1, 999);

  return {
    ...base,
    name: str(r.name, base.name, 80) || base.name,
    className: str(r.className, "", 60),
    race: str(r.race, "", 60),
    background: str(r.background, "", 60),
    alignment: str(r.alignment, "", 40),
    level: num(r.level, 1, 1, 20),
    xp: num(r.xp, 0, 0, 1_000_000),
    abilities,
    saveProf,
    skillProf,
    ac: num(r.ac, base.ac, 0, 40),
    speed: num(r.speed, base.speed, 0, 200),
    initiativeBonus: num(r.initiativeBonus, 0, -10, 20),
    hpMax,
    hpCurrent: Math.min(hpMax, num(r.hpCurrent, hpMax, 0, 999)),
    hpTemp: num(r.hpTemp, 0, 0, 999),
    hitDice: str(r.hitDice, base.hitDice, 30),
    deathSuccesses: num(r.deathSuccesses, 0, 0, 3),
    deathFailures: num(r.deathFailures, 0, 0, 3),
    attacks,
    spellAbility,
    slotsMax,
    slotsUsed,
    equipment: str(r.equipment, ""),
    features: str(r.features, ""),
    traits: str(r.traits, ""),
    notes: str(r.notes, ""),
  };
}
