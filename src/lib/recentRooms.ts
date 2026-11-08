const KEY = "tableforge:recent-rooms";
const MAX_RECENT = 6;

export type RecentRoom = { code: string; lastVisited: number };

export function getRecentRooms(): RecentRoom[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentRoom[];
    return Array.isArray(parsed)
      ? parsed.filter((r) => typeof r.code === "string" && typeof r.lastVisited === "number")
      : [];
  } catch {
    return [];
  }
}

function write(rooms: RecentRoom[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rooms));
  } catch {
    // localStorage nicht verfügbar – ignorieren
  }
}

export function saveRecentRoom(code: string): void {
  const others = getRecentRooms().filter((r) => r.code !== code);
  write([{ code, lastVisited: Date.now() }, ...others].slice(0, MAX_RECENT));
}

export function removeRecentRoom(code: string): void {
  write(getRecentRooms().filter((r) => r.code !== code));
}
