"use client";

import { useState } from "react";
import { crValue, MONSTERS, type Monster } from "@/data/monsters";
import { NAME_SETS, TAVERNS } from "@/data/names";
import { useRolls } from "@/lib/useRolls";
import { useTokenActions } from "@/lib/useTokenActions";
import { CopyIcon, DiceIcon, EyeOffIcon } from "@/components/ui/Icons";

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function makeNames(race: string, count: number): string[] {
  const set = NAME_SETS[race] ?? NAME_SETS.human;
  const result = new Set<string>();
  while (result.size < count) result.add(`${pick(set.first)} ${pick(set.last)}`);
  return Array.from(result);
}

const CR_OPTIONS = ["0", "1/8", "1/4", "1/2", "1", "2", "3", "5", "6", "10"];

export default function DmTools() {
  const { rollDice } = useRolls();
  const { spawnMonster } = useTokenActions();

  const [race, setRace] = useState("human");
  const [names, setNames] = useState<string[]>(() => makeNames("human", 6));
  const [taverns, setTaverns] = useState<string[]>(() => [pick(TAVERNS), pick(TAVERNS), pick(TAVERNS)]);
  const [maxCr, setMaxCr] = useState("1");
  const [encounter, setEncounter] = useState<Monster | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      // Clipboard nicht verfügbar – ignorieren
    }
  }

  function rollEncounter() {
    const pool = MONSTERS.filter((m) => crValue(m.cr) <= crValue(maxCr));
    if (pool.length > 0) setEncounter(pick(pool));
  }

  return (
    <div className="space-y-5">
      {/* Verdeckte Würfe */}
      <section>
        <h3 className="section-title">Verdeckte Würfe</h3>
        <div className="grid grid-cols-4 gap-2">
          {[20, 100, 6, 4].map((sides) => (
            <button
              key={sides}
              onClick={() => rollDice({ sides, secret: true, label: "Verdeckter Wurf" })}
              className="btn border-purple-500/40 py-2.5 font-display font-bold text-purple-200 hover:border-purple-400"
            >
              d{sides}
            </button>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
          <EyeOffIcon className="h-3.5 w-3.5" /> Das Ergebnis steht im Würfel-Tab, nur du siehst es.
        </p>
      </section>

      {/* Namen */}
      <section>
        <h3 className="section-title">Namen</h3>
        <div className="flex gap-2">
          <select
            value={race}
            onChange={(e) => {
              setRace(e.target.value);
              setNames(makeNames(e.target.value, 6));
            }}
            aria-label="Volk"
            className="field"
          >
            {Object.entries(NAME_SETS).map(([id, set]) => (
              <option key={id} value={id}>
                {set.label}
              </option>
            ))}
          </select>
          <button onClick={() => setNames(makeNames(race, 6))} className="btn shrink-0">
            <DiceIcon /> Neu
          </button>
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {names.map((name) => (
            <li key={name}>
              <button
                onClick={() => copy(name)}
                title="Kopieren"
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-stone-950/60 px-2.5 py-1.5 text-left text-sm transition hover:bg-stone-800/60"
              >
                <span className="truncate">{name}</span>
                <CopyIcon
                  className={`h-3.5 w-3.5 shrink-0 ${copied === name ? "text-emerald-400" : "text-stone-600"}`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Tavernen */}
      <section>
        <h3 className="section-title">Tavernennamen</h3>
        <ul className="space-y-1">
          {taverns.map((tavern, index) => (
            <li key={`${tavern}-${index}`}>
              <button
                onClick={() => copy(tavern)}
                title="Kopieren"
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-stone-950/60 px-2.5 py-1.5 text-left text-sm transition hover:bg-stone-800/60"
              >
                <span className="truncate">{tavern}</span>
                <CopyIcon
                  className={`h-3.5 w-3.5 shrink-0 ${copied === tavern ? "text-emerald-400" : "text-stone-600"}`}
                />
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => setTaverns([pick(TAVERNS), pick(TAVERNS), pick(TAVERNS)])}
          className="btn btn-sm mt-2"
        >
          <DiceIcon /> Neu würfeln
        </button>
      </section>

      {/* Zufallsbegegnung */}
      <section>
        <h3 className="section-title">Zufallsbegegnung</h3>
        <div className="flex items-center gap-2">
          <label className="flex flex-1 items-center gap-2 text-sm text-stone-400">
            Max. HG
            <select
              value={maxCr}
              onChange={(e) => setMaxCr(e.target.value)}
              className="field"
              aria-label="Maximale Herausforderung"
            >
              {CR_OPTIONS.map((cr) => (
                <option key={cr} value={cr}>
                  {cr}
                </option>
              ))}
            </select>
          </label>
          <button onClick={rollEncounter} className="btn btn-gold shrink-0">
            <DiceIcon /> Würfeln
          </button>
        </div>

        {encounter && (
          <div className="mt-3 rounded-xl border border-stone-700 bg-stone-950/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{encounter.name}</span>
              <span className="chip bg-amber-500/15 text-amber-300">HG {encounter.cr}</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              RK {encounter.ac} · TP {encounter.hp} · {encounter.type}
            </p>
            <button
              onClick={() => spawnMonster(encounter, 1)}
              className="btn btn-sm mt-2 w-full"
            >
              Auf die Karte setzen
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
