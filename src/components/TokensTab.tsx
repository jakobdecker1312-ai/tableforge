"use client";

import { useState } from "react";
import { LiveObject } from "@liveblocks/client";
import { v4 as uuid } from "uuid";
import { useMutation, useSelf, type Token } from "@/liveblocks.config";
import { PALETTE } from "@/lib/identity";
import { spawnPosition, TOKEN_SIZES, exploreAround } from "@/lib/map";
import { useVision } from "@/lib/useVision";
import { PlusIcon, SkullIcon, TrashIcon } from "@/components/ui/Icons";

const MONSTER_PRESETS = [
  { name: "Goblin", color: "#16a34a", size: 1 },
  { name: "Ork", color: "#65a30d", size: 1 },
  { name: "Skelett", color: "#a8a29e", size: 1 },
  { name: "Troll", color: "#0d9488", size: 2 },
  { name: "Drache", color: "#dc2626", size: 3 },
] as const;

function sizeLabel(size: number): string {
  return TOKEN_SIZES.find((s) => s.value === size)?.label ?? "Mittel";
}

export default function TokensTab({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const me = useSelf();
  const { isDM, tokens, visibleTokens } = useVision();
  const { name, color } = me.presence;

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(color);

  const addToken = useMutation(({ storage }, token: Token) => {
    storage.get("tokens").set(token.id, new LiveObject(token));
    if (!token.isMonster) {
      exploreAround(storage.get("settings"), storage.get("fog"), token.x, token.y);
    }
  }, []);

  const clearTokens = useMutation(({ storage }) => {
    const map = storage.get("tokens");
    for (const key of Array.from(map.keys())) map.delete(key);
    const initiative = storage.get("initiative");
    for (const entry of Array.from(initiative.values())) {
      if (entry.tokenId) initiative.delete(entry.id);
    }
  }, []);

  function uniqueName(base: string): string {
    const same = tokens.filter(
      (t) => t.name === base || t.name.startsWith(`${base} `)
    ).length;
    return same === 0 ? base : `${base} ${same + 1}`;
  }

  function addPlayerToken() {
    const base = newName.trim() || name || "Spieler";
    addToken({
      id: uuid(),
      name: uniqueName(base),
      color: newColor,
      size: 1,
      ...spawnPosition(),
    });
    setNewName("");
  }

  function addMonsterToken(preset: (typeof MONSTER_PRESETS)[number]) {
    addToken({
      id: uuid(),
      name: uniqueName(preset.name),
      color: preset.color,
      size: preset.size,
      isMonster: true,
      ...spawnPosition(),
    });
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-title">Held hinzufügen</h2>
        <input
          value={newName}
          maxLength={24}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPlayerToken()}
          placeholder={name || "Name des Tokens"}
          className="field"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              aria-label={`Farbe ${c}`}
              className={`h-7 w-7 rounded-full border-2 transition ${
                newColor === c ? "scale-110 border-white" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button onClick={addPlayerToken} className="btn btn-gold mt-3 w-full">
          <PlusIcon /> Token hinzufügen
        </button>
      </section>

      {isDM ? (
        <section>
          <h2 className="section-title">Monster</h2>
          <div className="grid grid-cols-2 gap-2">
            {MONSTER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => addMonsterToken(preset)}
                className="btn justify-start"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: preset.color }}
                />
                <span className="flex flex-col items-start leading-tight">
                  {preset.name}
                  <span className="text-[10px] text-stone-500">{sizeLabel(preset.size)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-stone-800 bg-stone-950/60 p-3 text-xs text-stone-500">
          Wechsle oben auf <span className="text-amber-300">DM</span>, um Monster hinzuzufügen
          und die Karte zu steuern.
        </p>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title mb-0">Auf der Karte ({visibleTokens.length})</h2>
          {isDM && tokens.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Alle Tokens entfernen?")) {
                  clearTokens();
                  onSelect(null);
                }
              }}
              className="btn btn-danger btn-sm"
            >
              <TrashIcon className="h-3.5 w-3.5" /> Alle
            </button>
          )}
        </div>

        {visibleTokens.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-700 p-4 text-center text-sm text-stone-500">
            Noch keine Tokens auf der Karte.
          </p>
        ) : (
          <ul className="space-y-1">
            {visibleTokens.map((token) => (
              <li key={token.id}>
                <button
                  onClick={() => onSelect(token.id === selectedId ? null : token.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition ${
                    token.id === selectedId
                      ? "border-amber-500/60 bg-amber-500/10"
                      : "border-transparent hover:bg-stone-800/60"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/40"
                    style={{ backgroundColor: token.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{token.name}</span>
                  {token.isMonster && (
                    <SkullIcon className="h-3.5 w-3.5 shrink-0 text-red-300" />
                  )}
                  <span className="text-[11px] text-stone-500">{sizeLabel(token.size ?? 1)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
