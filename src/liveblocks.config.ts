import type { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

export type Role = "dm" | "player";

/** Was jede verbundene Person live über sich teilt. */
export type Presence = {
  name: string;
  color: string;
  role: Role;
  /** Cursor-Position in Map-Koordinaten (0–1). null = Cursor nicht über der Map. */
  cursor: { x: number; y: number } | null;
  /** Sitzplatz am Tisch (0 = DM-Platz, 1–7 = Spieler), null = steht. */
  seat: number | null;
};

/** Ein Token auf der Map. x/y sind relative Werte (0–1). */
export type Token = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  isMonster?: boolean;
  /** Größe in Rasterfeldern (0.5, 1, 2, 3, 4). Standard: 1. */
  size?: number;
  /** Trefferpunkte (aktuell/maximal) und Rüstungsklasse, optional. */
  hp?: number;
  maxHp?: number;
  ac?: number;
  /** IDs aktiver Zustände, z. B. "poisoned". */
  conditions?: string[];
};

/** Einstellungen der Map. */
export type MapSettings = {
  /** Leer = kein Hintergrundbild. */
  backgroundUrl: string;
  showGrid: boolean;
  fogEnabled: boolean;
  /** Spieler-Tokens decken Nebel in ihrer Nähe auf. */
  dynamicVision: boolean;
  /** Von Spieler-Tokens erkundete Felder bleiben aufgedeckt. */
  rememberExplored: boolean;
  /** Sichtweite in Rasterfeldern. */
  visionRadius: number;
  /** Halbfelder-Raster, sichtbar sobald man hineinzoomt (ältere Räume: undefined). */
  fineGrid?: boolean;
  /** Anzahl Sitzplätze am Tisch (4 oder 8), älter: undefined = 8. */
  tableSeats?: 4 | 8;
  /** Stimmung der Szene (Licht und Ton), älter: undefined = none. */
  mood?: Mood;
};

export type Mood = "none" | "tavern" | "dungeon" | "storm" | "battle";

/** Ein Eintrag im Würfellog. */
export type Roll = {
  id: string;
  playerName: string;
  color: string;
  sides: number;
  count: number;
  modifier: number;
  results: number[];
  total: number;
  createdAt: number;
  /** Verdeckter Wurf: Ergebnis wird nur der DM angezeigt. */
  secret?: boolean;
  /** Beschriftung, z. B. "Aria: Wahrnehmung". */
  label?: string;
};

/** Ein Eintrag in der Initiative-Reihenfolge. */
export type InitiativeEntry = {
  id: string;
  name: string;
  color: string;
  initiative: number;
  /** Für stabile Sortierung bei Gleichstand. */
  createdAt: number;
  isMonster?: boolean;
  /** Verborgen vor Spielern (nur die DM sieht den Eintrag). */
  hidden?: boolean;
  /** Verknüpfter Token auf der Map (hebt den Token im eigenen Zug hervor). */
  tokenId?: string;
};

/** Zustand des Kampfes. */
export type Combat = {
  active: boolean;
  round: number;
  currentId: string | null;
};

export type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";

/** Ein Charakterbogen (D&D 5e). Bewegungsrate in Metern. */
export type CharacterSheet = {
  id: string;
  /** Zufälliger Schlüssel aus dem Browser des Besitzers (nur die Besitzer/DM dürfen bearbeiten). */
  ownerKey: string;
  ownerName: string;
  createdAt: number;
  name: string;
  className: string;
  race: string;
  background: string;
  alignment: string;
  level: number;
  xp: number;
  color: string;
  abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  /** IDs der Attribute mit Rettungswurf-Übung. */
  saveProf: string[];
  /** Fertigkeit -> 1 = geübt, 2 = Expertise. */
  skillProf: { [skillId: string]: number };
  ac: number;
  speed: number;
  initiativeBonus: number;
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  hitDice: string;
  deathSuccesses: number;
  deathFailures: number;
  attacks: { id: string; name: string; bonus: number; damage: string }[];
  /** Zauberattribut oder leer. */
  spellAbility: string;
  slotsMax: number[];
  slotsUsed: number[];
  equipment: string;
  features: string;
  traits: string;
  notes: string;
  /** Verknüpfter Token auf der Karte. */
  tokenId?: string;
};

/** Maximale Anzahl gespeicherter Würfe pro Tisch. */
export const MAX_ROLLS = 50;

/** Persistenter, geteilter Zustand des Tisches. */
export type RoomStorage = {
  tokens: LiveMap<string, LiveObject<Token>>;
  settings: LiveObject<MapSettings>;
  rolls: LiveList<Roll>;
  /** Aufgedeckte Rasterfelder, Schlüssel = "spalte,zeile". */
  fog: LiveMap<string, boolean>;
  initiative: LiveMap<string, InitiativeEntry>;
  combat: LiveObject<Combat>;
  /** Charakterbögen, Schlüssel = Bogen-ID. */
  sheets: LiveMap<string, LiveObject<CharacterSheet>>;
};

// Registriert die Typen global für alle Liveblocks-Hooks.
declare global {
  interface Liveblocks {
    Presence: Presence;
    Storage: RoomStorage;
  }
}

/** Der Public Key aus der Datei .env.local. */
export const liveblocksPublicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? "";

/** Wird in der Room-Page genutzt, um einen Hinweis zu zeigen, falls der Key fehlt. */
export const hasLiveblocksKey = liveblocksPublicKey !== "";

// Die Hooks kommen direkt aus Liveblocks und werden hier gebündelt re-exportiert,
// damit alle Komponenten weiterhin aus "@/liveblocks.config" importieren können.
export {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useSelf,
  useOthers,
  useStorage,
  useMutation,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
