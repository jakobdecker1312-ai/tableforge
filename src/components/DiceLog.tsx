"use client";

import { useState } from "react";
import { useMutation, useSelf, useStorage } from "@/liveblocks.config";
import { useRolls } from "@/lib/useRolls";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";

const DICE = [4, 6, 8, 10, 12, 20, 100] as const;

function formatFormula(count: number, sides: number | string, modifier: number): string {
  const mod = modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`;
  return `${count}d${sides}${mod}`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-stone-400">{label}</span>
      <div className="flex items-center overflow-hidden rounded-lg border border-stone-700">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`${label} verringern`}
          className="flex h-8 w-8 items-center justify-center bg-stone-900 text-stone-300 transition hover:bg-stone-800 disabled:opacity-30"
        >
          <MinusIcon />
        </button>
        <span className="w-10 text-center text-sm tabular-nums">{format(value)}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`${label} erhöhen`}
          className="flex h-8 w-8 items-center justify-center bg-stone-900 text-stone-300 transition hover:bg-stone-800 disabled:opacity-30"
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}

export default function DiceLog() {
  const me = useSelf();
  const rolls = useStorage((root) => root.rolls);
  const isDM = me.presence.role === "dm";
  const { rollDice } = useRolls();

  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [secret, setSecret] = useState(false);

  const revealRoll = useMutation(({ storage }, id: string) => {
    const list = storage.get("rolls");
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return;
    const current = list.get(index);
    if (current) list.set(index, { ...current, secret: false });
  }, []);

  const newestFirst = [...rolls].reverse();
  const secretMode = isDM && secret;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-title">Würfeln</h2>
        <div className="space-y-2">
          <Stepper label="Anzahl" value={count} min={1} max={10} onChange={setCount} />
          <Stepper
            label="Modifikator"
            value={modifier}
            min={-20}
            max={20}
            onChange={setModifier}
            format={(v) => (v > 0 ? `+${v}` : String(v))}
          />
        </div>

        {isDM && (
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-purple-300">
            <input
              type="checkbox"
              checked={secret}
              onChange={(e) => setSecret(e.target.checked)}
              className="h-4 w-4 accent-purple-500"
            />
            Verdeckt würfeln (nur DM sieht das Ergebnis)
          </label>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {DICE.map((sides) => (
            <button
              key={sides}
              onClick={() => rollDice({ sides, count, modifier, secret })}
              className={`btn py-3 font-display text-sm font-bold ${
                secretMode
                  ? "border-purple-500/50 text-purple-200 hover:border-purple-400"
                  : "hover:border-amber-500 hover:text-amber-300"
              }`}
            >
              d{sides}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Ein Klick würfelt sofort: {formatFormula(count, "X", modifier)}
        </p>
      </section>

      <section>
        <h2 className="section-title">Verlauf</h2>
        {newestFirst.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-700 p-4 text-center text-sm text-stone-500">
            Noch keine Würfe.
          </p>
        ) : (
          <ul aria-live="polite" className="space-y-1.5">
            {newestFirst.map((entry) => {
              // Verdeckte Würfe: Spieler sehen nur einen Platzhalter.
              if (entry.secret && !isDM) {
                return (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2 text-sm text-stone-500"
                  >
                    Die DM würfelt verdeckt · {formatTime(entry.createdAt)}
                  </li>
                );
              }

              const isSingleD20 = entry.sides === 20 && entry.count === 1;
              const natural = entry.results[0];
              const crit = isSingleD20 && natural === 20;
              const fumble = isSingleD20 && natural === 1;
              const formula = formatFormula(entry.count, entry.sides, entry.modifier);

              return (
                <li
                  key={entry.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                    entry.secret
                      ? "border-purple-500/30 bg-purple-500/5"
                      : crit
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : fumble
                          ? "border-red-500/40 bg-red-500/5"
                          : "border-stone-800 bg-stone-950/60"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      {entry.label ? (
                        <span className="font-medium">{entry.label}</span>
                      ) : (
                        <>
                          <span className="font-medium">{entry.playerName}</span>{" "}
                          <span className="text-stone-500">{formula}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-stone-500">
                      {entry.label && `${entry.playerName} · ${formula} · `}[
                      {entry.results.join(", ")}]
                      {entry.modifier !== 0 &&
                        ` ${entry.modifier > 0 ? "+" : "−"} ${Math.abs(entry.modifier)}`}
                      {" · "}
                      {formatTime(entry.createdAt)}
                    </div>
                    {entry.secret && (
                      <div className="mt-0.5 flex items-center gap-2 text-xs">
                        <span className="text-purple-300">verdeckt</span>
                        <button
                          onClick={() => revealRoll(entry.id)}
                          className="text-amber-300 hover:underline"
                        >
                          Aufdecken
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-display text-2xl font-bold tabular-nums ${
                        crit ? "text-emerald-400" : fumble ? "text-red-400" : "text-stone-100"
                      }`}
                    >
                      {entry.total}
                    </div>
                    {crit && <div className="text-[10px] font-semibold text-emerald-400">KRITISCH</div>}
                    {fumble && <div className="text-[10px] font-semibold text-red-400">PATZER</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
