"use client";

import { useState } from "react";
import { CONDITIONS } from "@/data/conditions";
import type { Token } from "@/liveblocks.config";
import { useTokenActions } from "@/lib/useTokenActions";
import { useVision } from "@/lib/useVision";
import { NumberInput } from "@/components/ui/Inputs";
import { SkullIcon, TrashIcon } from "@/components/ui/Icons";

type Filter = "all" | "monster" | "player";
type Actions = ReturnType<typeof useTokenActions>;

function barColor(ratio: number): string {
  if (ratio > 0.5) return "bg-emerald-500";
  if (ratio > 0.25) return "bg-amber-500";
  return "bg-red-500";
}

function TokenRow({
  token,
  selected,
  onSelect,
  actions,
}: {
  token: Token;
  selected: boolean;
  onSelect: (id: string) => void;
  actions: Actions;
}) {
  const [amount, setAmount] = useState("5");
  const amt = Math.max(0, parseInt(amount, 10) || 0);

  const hasHp = token.maxHp !== undefined && token.maxHp > 0;
  const hp = token.hp ?? token.maxHp ?? 0;
  const ratio = hasHp ? Math.max(0, Math.min(1, hp / (token.maxHp ?? 1))) : 0;
  const downed = hasHp && hp <= 0;
  const active = token.conditions ?? [];

  return (
    <li
      className={`rounded-xl border p-2.5 transition ${
        selected ? "border-amber-500/60 bg-amber-500/5" : "border-stone-800 bg-stone-950/60"
      } ${downed ? "opacity-70" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/40"
          style={{ backgroundColor: token.color }}
        />
        <button
          onClick={() => onSelect(token.id)}
          title="Auf der Karte auswählen"
          className="min-w-0 flex-1 truncate text-left text-sm font-medium transition hover:text-amber-300"
        >
          {token.name}
        </button>
        {token.isMonster && <SkullIcon className="h-3.5 w-3.5 shrink-0 text-red-300" />}
        {downed && <span className="chip bg-red-500/15 text-red-300">0 TP</span>}
        <button
          onClick={() => actions.removeToken(token.id)}
          aria-label="Token entfernen"
          title="Token entfernen"
          className="rounded p-1 text-stone-500 transition hover:bg-stone-800 hover:text-red-300"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {hasHp ? (
        <>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-800">
            <div
              className={`h-full transition-all ${barColor(ratio)}`}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wide text-stone-500">
            <label className="block">
              TP
              <NumberInput
                value={hp}
                min={0}
                max={token.maxHp}
                onCommit={(n) => actions.setStats(token.id, { hp: n })}
                className="mt-0.5 px-1.5 py-1 text-center text-sm normal-case"
                ariaLabel="Aktuelle Trefferpunkte"
              />
            </label>
            <label className="block">
              Max
              <NumberInput
                value={token.maxHp}
                min={1}
                max={999}
                onCommit={(n) => actions.setStats(token.id, { maxHp: n })}
                className="mt-0.5 px-1.5 py-1 text-center text-sm normal-case"
                ariaLabel="Maximale Trefferpunkte"
              />
            </label>
            <label className="block">
              RK
              <NumberInput
                value={token.ac}
                min={0}
                max={40}
                onCommit={(n) => actions.setStats(token.id, { ac: n })}
                className="mt-0.5 px-1.5 py-1 text-center text-sm normal-case"
                ariaLabel="Rüstungsklasse"
              />
            </label>
          </div>

          <div className="mt-2 flex gap-1.5">
            <input
              type="number"
              value={amount}
              min={0}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Menge"
              className="field w-16 px-2 py-1 text-center"
            />
            <button
              onClick={() => actions.changeHp(token.id, -amt)}
              disabled={amt === 0}
              className="btn btn-danger flex-1 py-1"
            >
              Schaden
            </button>
            <button
              onClick={() => actions.changeHp(token.id, amt)}
              disabled={amt === 0}
              className="btn flex-1 border-emerald-500/40 py-1 text-emerald-300 hover:border-emerald-400"
            >
              Heilen
            </button>
          </div>
        </>
      ) : (
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
          <span>TP festlegen:</span>
          <NumberInput
            value={undefined}
            min={1}
            max={999}
            placeholder="Max"
            onCommit={(n) => actions.setStats(token.id, { maxHp: n })}
            className="w-20 px-2 py-1 text-center"
            ariaLabel="Maximale Trefferpunkte festlegen"
          />
          <span>RK:</span>
          <NumberInput
            value={token.ac}
            min={0}
            max={40}
            onCommit={(n) => actions.setStats(token.id, { ac: n })}
            className="w-16 px-2 py-1 text-center"
            ariaLabel="Rüstungsklasse"
          />
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-stone-400 transition hover:text-stone-200">
          Zustände{active.length > 0 ? ` (${active.length})` : ""}
        </summary>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CONDITIONS.map((condition) => {
            const on = active.includes(condition.id);
            return (
              <button
                key={condition.id}
                onClick={() => actions.toggleCondition(token.id, condition.id)}
                title={condition.en}
                aria-pressed={on}
                className={`chip border px-2 py-0.5 transition ${
                  on
                    ? "border-transparent text-stone-900"
                    : "border-stone-700 text-stone-400 hover:text-stone-200"
                }`}
                style={on ? { backgroundColor: condition.color } : undefined}
              >
                {condition.name}
              </button>
            );
          })}
        </div>
      </details>
    </li>
  );
}

export default function EncounterPanel({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { tokens } = useVision();
  const actions = useTokenActions();
  const [filter, setFilter] = useState<Filter>("all");

  const list = tokens.filter((t) =>
    filter === "all" ? true : filter === "monster" ? Boolean(t.isMonster) : !t.isMonster
  );
  const monsterCount = tokens.filter((t) => t.isMonster).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(
            [
              ["all", `Alle (${tokens.length})`],
              ["monster", `Monster (${monsterCount})`],
              ["player", `Helden (${tokens.length - monsterCount})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`chip border px-2.5 py-1 text-xs transition ${
                filter === id
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                  : "border-stone-700 text-stone-400 hover:text-stone-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-700 p-4 text-center text-sm text-stone-500">
          Keine Tokens in dieser Ansicht. Setze Monster aus dem Buch auf die Karte.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((token) => (
            <TokenRow
              key={token.id}
              token={token}
              selected={token.id === selectedId}
              onSelect={onSelect}
              actions={actions}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
