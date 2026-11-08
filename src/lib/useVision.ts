"use client";

import { useMemo } from "react";
import { useSelf, useStorage } from "@/liveblocks.config";
import { cellKeyFor, cellsInRadius } from "@/lib/map";

/**
 * Gemeinsame Sicht auf Tokens und Nebel.
 * - clearSet: alle Felder ohne Nebel (aufgedeckt, erkundet oder live gesehen)
 * - visibleTokens: Tokens, die diese Person sehen darf (Monster im Nebel sind für Spieler verborgen)
 */
export function useVision() {
  const me = useSelf();
  const isDM = me.presence.role === "dm";

  const tokens = useStorage((root) => Array.from(root.tokens.values()));
  const fogEnabled = useStorage((root) => root.settings.fogEnabled);
  const dynamicVision = useStorage((root) => root.settings.dynamicVision);
  const visionRadius = useStorage((root) => root.settings.visionRadius);
  const revealedKeys = useStorage((root) => Array.from(root.fog.keys()));

  const clearSet = useMemo(() => {
    const set = new Set<string>(revealedKeys);
    if (fogEnabled && dynamicVision) {
      for (const token of tokens) {
        if (token.isMonster) continue;
        for (const key of cellsInRadius(token.x, token.y, visionRadius)) set.add(key);
      }
    }
    return set;
  }, [revealedKeys, tokens, fogEnabled, dynamicVision, visionRadius]);

  const visibleTokens = useMemo(
    () =>
      tokens.filter(
        (t) => !(fogEnabled && !isDM && t.isMonster && !clearSet.has(cellKeyFor(t.x, t.y)))
      ),
    [tokens, fogEnabled, isDM, clearSet]
  );

  return { isDM, tokens, visibleTokens, clearSet, fogEnabled };
}
