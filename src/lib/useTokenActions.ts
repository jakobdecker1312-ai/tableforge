"use client";

import { LiveObject } from "@liveblocks/client";
import { v4 as uuid } from "uuid";
import {
  useMutation,
  useStorage,
  type CharacterSheet,
  type RoomStorage,
  type Token,
} from "@/liveblocks.config";
import type { Monster } from "@/data/monsters";
import { exploreAround, spawnPosition, uniqueName } from "@/lib/map";

/** Überträgt TP/RK eines Tokens auf verknüpfte Charakterbögen. */
function syncSheets(
  storage: LiveObject<RoomStorage>,
  tokenId: string,
  patch: { hp?: number; maxHp?: number; ac?: number }
): void {
  const sheets = storage.get("sheets");
  if (!sheets) return;
  for (const sheet of sheets.values()) {
    if (sheet.get("tokenId") !== tokenId) continue;
    const next: Partial<CharacterSheet> = {};
    if (patch.hp !== undefined) next.hpCurrent = patch.hp;
    if (patch.maxHp !== undefined) next.hpMax = patch.maxHp;
    if (patch.ac !== undefined) next.ac = patch.ac;
    sheet.update(next);
  }
}

/** Gemeinsame Token-Aktionen für Karte, DM-Schirm, Bücher und Charakterbögen. */
export function useTokenActions() {
  const names = useStorage((root) => Array.from(root.tokens.values(), (t) => t.name));

  const addToken = useMutation(({ storage }, token: Token) => {
    storage.get("tokens").set(token.id, new LiveObject(token));
    if (!token.isMonster) {
      exploreAround(storage.get("settings"), storage.get("fog"), token.x, token.y);
    }
  }, []);

  /** Ändert die Trefferpunkte um einen Wert (negativ = Schaden). */
  const changeHp = useMutation(({ storage }, id: string, delta: number) => {
    const token = storage.get("tokens").get(id);
    if (!token) return;
    const max = token.get("maxHp");
    const current = token.get("hp") ?? max ?? 0;
    const raw = current + delta;
    const next = Math.max(0, max === undefined ? raw : Math.min(max, raw));
    token.update({ hp: next });
    syncSheets(storage, id, { hp: next });
  }, []);

  const setStats = useMutation(
    (
      { storage },
      id: string,
      stats: { hp?: number; maxHp?: number; ac?: number }
    ) => {
      const token = storage.get("tokens").get(id);
      if (!token) return;
      const patch: Partial<Token> = {};
      if (stats.maxHp !== undefined) {
        patch.maxHp = Math.max(0, Math.round(stats.maxHp));
        if (token.get("hp") === undefined) patch.hp = patch.maxHp;
        else if ((token.get("hp") ?? 0) > patch.maxHp) patch.hp = patch.maxHp;
      }
      if (stats.hp !== undefined) {
        const cap = patch.maxHp ?? token.get("maxHp");
        patch.hp = Math.max(0, cap === undefined ? stats.hp : Math.min(cap, stats.hp));
      }
      if (stats.ac !== undefined) patch.ac = Math.max(0, Math.round(stats.ac));
      token.update(patch);
      syncSheets(storage, id, { hp: patch.hp, maxHp: patch.maxHp, ac: patch.ac });
    },
    []
  );

  const toggleCondition = useMutation(({ storage }, id: string, condition: string) => {
    const token = storage.get("tokens").get(id);
    if (!token) return;
    const list = token.get("conditions") ?? [];
    token.set(
      "conditions",
      list.includes(condition) ? list.filter((c) => c !== condition) : [...list, condition]
    );
  }, []);

  const removeToken = useMutation(({ storage }, id: string) => {
    storage.get("tokens").delete(id);
    // Verknüpfte Initiative-Einträge entfernen und Charakterbögen entkoppeln.
    const initiative = storage.get("initiative");
    for (const entry of Array.from(initiative.values())) {
      if (entry.tokenId === id) initiative.delete(entry.id);
    }
    const sheets = storage.get("sheets");
    if (sheets) {
      for (const sheet of sheets.values()) {
        if (sheet.get("tokenId") === id) sheet.delete("tokenId");
      }
    }
  }, []);

  /** Setzt ein Monster aus dem Monsterbuch mit Werten auf die Karte. */
  function spawnMonster(monster: Monster, count = 1) {
    const used = [...names];
    for (let i = 0; i < count; i++) {
      const name = uniqueName(used, monster.name);
      used.push(name);
      addToken({
        id: uuid(),
        name,
        color: monster.color,
        size: monster.tokenSize,
        isMonster: true,
        hp: monster.hp,
        maxHp: monster.hp,
        ac: monster.ac,
        ...spawnPosition(),
      });
    }
  }

  return { names, addToken, changeHp, setStats, toggleCondition, removeToken, spawnMonster };
}
