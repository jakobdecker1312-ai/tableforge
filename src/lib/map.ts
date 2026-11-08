import type { LiveMap, LiveObject } from "@liveblocks/client";
import type { MapSettings } from "@/liveblocks.config";

export const GRID_COLS = 20;
export const GRID_ROWS = 12;
export const EDGE = 0.02;
export const MIN_SCALE = 1;
export const MAX_SCALE = 10;

export type FogTool = "off" | "reveal" | "hide";

/** Ansicht (Zoom + Verschiebung in Pixeln), nur lokal. */
export type View = { scale: number; x: number; y: number };

export const TOKEN_SIZES = [
  { label: "Winzig", short: "½", value: 0.5 },
  { label: "Mittel", short: "1", value: 1 },
  { label: "Groß", short: "2", value: 2 },
  { label: "Riesig", short: "3", value: 3 },
  { label: "Gigantisch", short: "4", value: 4 },
] as const;

export function clamp(value: number, min = EDGE, max = 1 - EDGE): number {
  return Math.min(max, Math.max(min, value));
}

export function clampView(view: View, width: number, height: number): View {
  const scale = clamp(view.scale, MIN_SCALE, MAX_SCALE);
  return {
    scale,
    x: Math.min(0, Math.max(width - width * scale, view.x)),
    y: Math.min(0, Math.max(height - height * scale, view.y)),
  };
}

/** Zoomt so, dass der Punkt (px, py) unter dem Cursor stehen bleibt. */
export function zoomAt(
  view: View,
  factor: number,
  px: number,
  py: number,
  width: number,
  height: number
): View {
  const scale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
  const ratio = scale / view.scale;
  return clampView(
    { scale, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio },
    width,
    height
  );
}

export function cellKeyFor(x: number, y: number): string {
  const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor(x * GRID_COLS)));
  const row = Math.min(GRID_ROWS - 1, Math.max(0, Math.floor(y * GRID_ROWS)));
  return `${col},${row}`;
}

/** Alle Rasterfelder, deren Mittelpunkt höchstens `radius` Felder vom Punkt entfernt ist. */
export function cellsInRadius(x: number, y: number, radius: number): string[] {
  const cx = x * GRID_COLS;
  const cy = y * GRID_ROWS;
  const reach = Math.ceil(radius);
  const cells: string[] = [];
  const rowMin = Math.max(0, Math.floor(cy) - reach);
  const rowMax = Math.min(GRID_ROWS - 1, Math.floor(cy) + reach);
  const colMin = Math.max(0, Math.floor(cx) - reach);
  const colMax = Math.min(GRID_COLS - 1, Math.floor(cx) + reach);
  for (let row = rowMin; row <= rowMax; row++) {
    for (let col = colMin; col <= colMax; col++) {
      const dx = col + 0.5 - cx;
      const dy = row + 0.5 - cy;
      if (dx * dx + dy * dy <= radius * radius) cells.push(`${col},${row}`);
    }
  }
  return cells;
}

/** Schreibt erkundete Felder dauerhaft in den Nebel (falls aktiviert). */
export function exploreAround(
  settings: LiveObject<MapSettings>,
  fog: LiveMap<string, boolean>,
  x: number,
  y: number
): void {
  if (
    !settings.get("fogEnabled") ||
    !settings.get("dynamicVision") ||
    !settings.get("rememberExplored")
  ) {
    return;
  }
  for (const key of cellsInRadius(x, y, settings.get("visionRadius"))) {
    if (!fog.has(key)) fog.set(key, true);
  }
}

export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "?";
}

export function spawnPosition() {
  return {
    x: clamp(0.5 + (Math.random() - 0.5) * 0.2),
    y: clamp(0.5 + (Math.random() - 0.5) * 0.2),
  };
}

/** Hängt bei Namensgleichheit eine Zahl an: "Goblin", "Goblin 2", "Goblin 3" … */
export function uniqueName(names: readonly string[], base: string): string {
  const same = names.filter((n) => n === base || n.startsWith(`${base} `)).length;
  return same === 0 ? base : `${base} ${same + 1}`;
}
