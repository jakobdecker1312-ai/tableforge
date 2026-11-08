"use client";

import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import { MAX_ROLLS, useMutation, useSelf, type Roll } from "@/liveblocks.config";

export type RollOptions = {
  sides: number;
  count?: number;
  modifier?: number;
  label?: string;
  /** Nur wirksam, wenn die Person die DM ist. */
  secret?: boolean;
};

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/** Liest Formeln wie "1d8+3", "2W6" oder "d20−1". */
export function parseFormula(
  formula: string
): { count: number; sides: number; modifier: number } | null {
  const cleaned = formula
    .replace(/\s+/g, "")
    .replace(/−/g, "-")
    .toLowerCase()
    .replace(/w/g, "d");
  const match = cleaned.match(/^(\d{1,2})?d(\d{1,3})([+-]\d{1,3})?$/);
  if (!match) return null;
  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  if (count < 1 || count > 20 || sides < 2 || sides > 100) return null;
  return { count, sides, modifier };
}

export function useRolls() {
  const me = useSelf();
  const isDM = me.presence.role === "dm";
  const { name, color } = me.presence;

  const addRoll = useMutation(({ storage }, roll: Roll) => {
    const list = storage.get("rolls");
    list.push(roll);
    while (list.length > MAX_ROLLS) list.delete(0);
  }, []);

  const rollDice = useCallback(
    (options: RollOptions): number => {
      const count = options.count ?? 1;
      const modifier = options.modifier ?? 0;
      const results = Array.from({ length: count }, () => rollDie(options.sides));
      const total = results.reduce((sum, n) => sum + n, 0) + modifier;
      addRoll({
        id: uuid(),
        playerName: name || "Unbekannt",
        color,
        sides: options.sides,
        count,
        modifier,
        results,
        total,
        createdAt: Date.now(),
        secret: isDM && Boolean(options.secret),
        ...(options.label ? { label: options.label } : {}),
      });
      return total;
    },
    [addRoll, name, color, isDM]
  );

  const rollFormula = useCallback(
    (formula: string, label?: string, secret?: boolean): number | null => {
      const parsed = parseFormula(formula);
      if (!parsed) return null;
      return rollDice({ ...parsed, label, secret });
    },
    [rollDice]
  );

  return { rollDice, rollFormula };
}
