"use client";

import { useCallback } from "react";
import type { Monster } from "@/data/monsters";
import { useLocalState } from "@/lib/useLocalState";

export type CustomRule = { id: string; title: string; text: string };

/** Eigene Monster, privat im Browser gespeichert. */
export function useCustomMonsters() {
  const [monsters, setMonsters] = useLocalState<Monster[]>("tableforge:custom-monsters", []);
  const add = useCallback((m: Monster) => setMonsters((cur) => [...cur, m]), [setMonsters]);
  const remove = useCallback(
    (id: string) => setMonsters((cur) => cur.filter((m) => m.id !== id)),
    [setMonsters]
  );
  return { monsters, add, remove };
}

/** Eigene Hausregeln, privat im Browser gespeichert. */
export function useCustomRules() {
  const [rules, setRules] = useLocalState<CustomRule[]>("tableforge:custom-rules", []);
  const add = useCallback((r: CustomRule) => setRules((cur) => [...cur, r]), [setRules]);
  const remove = useCallback(
    (id: string) => setRules((cur) => cur.filter((r) => r.id !== id)),
    [setRules]
  );
  return { rules, add, remove };
}

/** Zeilen im Format "Name: Text" in Einträge umwandeln. */
export function parseEntries(raw: string): { name: string; text: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(":");
      return i > 0
        ? { name: line.slice(0, i).trim(), text: line.slice(i + 1).trim() }
        : { name: line, text: "" };
    });
}

const XP_BY_CR: Record<string, number> = {
  "0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200, "2": 450, "3": 700, "4": 1100,
  "5": 1800, "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900, "11": 7200,
  "12": 8400, "13": 10000, "14": 11500, "15": 13000, "16": 15000, "17": 18000,
  "18": 20000, "19": 22000, "20": 25000,
};
export const CR_OPTIONS = Object.keys(XP_BY_CR);
export const xpForCr = (cr: string) => XP_BY_CR[cr] ?? 0;
