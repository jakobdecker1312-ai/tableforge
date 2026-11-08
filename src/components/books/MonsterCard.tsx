"use client";

import { useState } from "react";
import { ABILITIES, abilityMod, formatBonus } from "@/data/sheet";
import type { Monster } from "@/data/monsters";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";

export default function MonsterCard({
  monster,
  canSpawn,
  onSpawn,
}: {
  monster: Monster;
  canSpawn: boolean;
  onSpawn: (count: number) => void;
}) {
  const [count, setCount] = useState(1);

  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs italic text-stone-400">
          {monster.size}e Kreatur · {monster.type}, {monster.alignment}
        </div>
        <div className="mt-0.5 text-[11px] text-stone-500">
          {monster.en} · EP {monster.xp.toLocaleString("de-DE")}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-stone-800 bg-stone-950/60 py-1.5">
          <dt className="text-[10px] uppercase tracking-wider text-stone-500">RK</dt>
          <dd className="font-semibold">
            {monster.ac}
            {monster.acNote && (
              <span className="block text-[10px] font-normal text-stone-500">{monster.acNote}</span>
            )}
          </dd>
        </div>
        <div className="rounded-lg border border-stone-800 bg-stone-950/60 py-1.5">
          <dt className="text-[10px] uppercase tracking-wider text-stone-500">TP</dt>
          <dd className="font-semibold">
            {monster.hp}
            <span className="block text-[10px] font-normal text-stone-500">{monster.hpDice}</span>
          </dd>
        </div>
        <div className="rounded-lg border border-stone-800 bg-stone-950/60 py-1.5">
          <dt className="text-[10px] uppercase tracking-wider text-stone-500">Bewegung</dt>
          <dd className="px-1 text-xs font-semibold leading-tight">{monster.speed}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-6 gap-1 text-center">
        {ABILITIES.map((ability, index) => {
          const score = monster.abilities[index];
          return (
            <div key={ability.id} className="rounded-md bg-stone-950/60 py-1">
              <div className="text-[10px] font-semibold text-amber-300">{ability.short}</div>
              <div className="text-sm font-semibold">{score}</div>
              <div className="text-[10px] text-stone-500">{formatBonus(abilityMod(score))}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1 text-xs text-stone-400">
        {monster.extras.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>
          <span className="text-stone-300">Sinne:</span> {monster.senses}
        </p>
        <p>
          <span className="text-stone-300">Sprachen:</span> {monster.languages}
        </p>
        <p>
          <span className="text-stone-300">Herausforderung:</span> {monster.cr}
        </p>
      </div>

      {monster.traits.length > 0 && (
        <div className="space-y-2">
          {monster.traits.map((trait) => (
            <p key={trait.name} className="text-xs leading-relaxed text-stone-300">
              <span className="font-semibold italic text-stone-100">{trait.name}.</span>{" "}
              {trait.text}
            </p>
          ))}
        </div>
      )}

      <div>
        <h4 className="mb-1 border-b border-amber-500/30 pb-0.5 font-display text-xs font-bold uppercase tracking-widest text-amber-300">
          Aktionen
        </h4>
        <div className="space-y-2">
          {monster.actions.map((action) => (
            <p key={action.name} className="text-xs leading-relaxed text-stone-300">
              <span className="font-semibold italic text-stone-100">{action.name}.</span>{" "}
              {action.text}
            </p>
          ))}
        </div>
      </div>

      {canSpawn && (
        <div className="flex items-center gap-2 border-t border-stone-800 pt-3">
          <div className="flex items-center overflow-hidden rounded-lg border border-stone-700">
            <button
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
              aria-label="Anzahl verringern"
              className="flex h-8 w-8 items-center justify-center bg-stone-900 text-stone-300 transition hover:bg-stone-800 disabled:opacity-30"
            >
              <MinusIcon />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">{count}</span>
            <button
              onClick={() => setCount((c) => Math.min(8, c + 1))}
              disabled={count >= 8}
              aria-label="Anzahl erhöhen"
              className="flex h-8 w-8 items-center justify-center bg-stone-900 text-stone-300 transition hover:bg-stone-800 disabled:opacity-30"
            >
              <PlusIcon />
            </button>
          </div>
          <button onClick={() => onSpawn(count)} className="btn btn-gold flex-1">
            Auf die Karte setzen
          </button>
        </div>
      )}
    </div>
  );
}
