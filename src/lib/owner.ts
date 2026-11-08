import { v4 as uuid } from "uuid";

const KEY = "tableforge:owner-key";

/**
 * Zufälliger Schlüssel pro Browser. Damit erkennt Tavern Roll, welche Charakterbögen dir gehören.
 * Das ist keine Anmeldung: Wer den Schlüssel kennt, gilt als Besitzer.
 */
export function getOwnerKey(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const created = uuid();
    window.localStorage.setItem(KEY, created);
    return created;
  } catch {
    return uuid();
  }
}
