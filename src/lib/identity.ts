import type { Presence } from "@/liveblocks.config";

export const PALETTE = [
  "#ef4444", // rot
  "#f97316", // orange
  "#eab308", // gelb
  "#22c55e", // grün
  "#06b6d4", // cyan
  "#3b82f6", // blau
  "#8b5cf6", // violett
  "#ec4899", // pink
] as const;

const NAMES = [
  "Abenteurer",
  "Waldläufer",
  "Magier",
  "Barde",
  "Schurke",
  "Paladin",
  "Druide",
  "Kleriker",
];

const STORAGE_KEY = "tableforge:identity";

type Identity = Pick<Presence, "name" | "color" | "role">;

function randomFrom<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Liest die zuletzt genutzte Identität aus dem Browser oder erzeugt eine neue. */
export function getInitialPresence(): Presence {
  const fallback: Presence = {
    name: `${randomFrom(NAMES)} ${Math.floor(Math.random() * 90) + 10}`,
    color: randomFrom(PALETTE),
    role: "player",
    cursor: null,
    seat: null,
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Identity>;
    return {
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : fallback.name,
      color: typeof parsed.color === "string" ? parsed.color : fallback.color,
      role: parsed.role === "dm" ? "dm" : "player",
      cursor: null,
      seat: null,
    };
  } catch {
    return fallback;
  }
}

export function saveIdentity(identity: Identity): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // localStorage nicht verfügbar – ignorieren
  }
}
