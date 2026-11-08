"use client";

import { useMemo, useState } from "react";
import { CONDITIONS, EXHAUSTION_LEVELS } from "@/data/conditions";
import { crValue, MONSTERS } from "@/data/monsters";
import { RULES } from "@/data/rules";
import { useSelf } from "@/liveblocks.config";
import { useTokenActions } from "@/lib/useTokenActions";
import MonsterCard from "@/components/books/MonsterCard";
import NpcBook from "@/components/books/NpcBook";
import CustomMonsterForm from "@/components/books/CustomMonsterForm";
import CustomRules from "@/components/books/CustomRules";
import RulebookLinks from "@/components/books/RulebookLinks";
import { useCustomMonsters } from "@/lib/customContent";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/Icons";

type Category = "monsters" | "conditions" | "rules" | "npcs";

const ALL_CATEGORIES: { id: Category; label: string; dmOnly: boolean }[] = [
  { id: "monsters", label: "Monster", dmOnly: true },
  { id: "conditions", label: "Zustände", dmOnly: false },
  { id: "rules", label: "Regeln", dmOnly: false },
  { id: "npcs", label: "NPCs", dmOnly: true },
];

export default function Compendium({ roomId }: { roomId: string }) {
  const me = useSelf();
  const isDM = me.presence.role === "dm";
  const { spawnMonster } = useTokenActions();

  const categories = ALL_CATEGORIES.filter((c) => isDM || !c.dmOnly);
  const [chosen, setChosen] = useState<Category>(isDM ? "monsters" : "conditions");
  const category = categories.some((c) => c.id === chosen) ? chosen : categories[0].id;

  const custom = useCustomMonsters();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  const monsters = useMemo(
    () =>
      [...custom.monsters, ...MONSTERS].filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.en.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q)
      ).sort((a, b) => crValue(a.cr) - crValue(b.cr) || a.name.localeCompare(b.name, "de")),
    [q, custom.monsters]
  );

  const conditions = useMemo(
    () =>
      CONDITIONS.filter(
        (c) => !q || c.name.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)
      ),
    [q]
  );

  const rules = useMemo(
    () =>
      RULES.filter(
        (s) =>
          !q ||
          s.title.toLowerCase().includes(q) ||
          s.rows.some(
            (r) => r.label.toLowerCase().includes(q) || r.text.toLowerCase().includes(q)
          )
      ),
    [q]
  );

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      {/* Kategorien */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setChosen(c.id);
              setOpenId(null);
            }}
            className={`chip border px-3 py-1 text-xs transition ${
              category === c.id
                ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                : "border-stone-700 text-stone-400 hover:text-stone-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {category !== "npcs" && (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen …"
            aria-label="Suchen"
            className="field pl-9"
          />
        </div>
      )}

      {/* Monster */}
      {category === "monsters" && isDM && (
        creating ? (
          <CustomMonsterForm
            onCancel={() => setCreating(false)}
            onSave={(m) => {
              custom.add(m);
              setCreating(false);
              setOpenId(m.id);
            }}
          />
        ) : (
          <button onClick={() => setCreating(true)} className="btn btn-gold btn-sm">
            + Eigenes Monster erschaffen
          </button>
        )
      )}
      {category === "monsters" && (
        <ul className="space-y-1.5">
          {monsters.length === 0 && (
            <li className="p-3 text-center text-sm text-stone-500">Nichts gefunden.</li>
          )}
          {monsters.map((monster) => {
            const open = openId === monster.id;
            return (
              <li
                key={monster.id}
                className="overflow-hidden rounded-xl border border-stone-800 bg-stone-950/60"
              >
                <button
                  onClick={() => toggle(monster.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-stone-800/40"
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/40"
                    style={{ backgroundColor: monster.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{monster.name}</span>
                    <span className="block truncate text-[11px] text-stone-500">
                      {monster.size} · {monster.type}
                    </span>
                  </span>
                  <span className="chip bg-amber-500/15 text-amber-300">HG {monster.cr}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-stone-500 transition ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="border-t border-stone-800 p-3">
                    <MonsterCard
                      monster={monster}
                      canSpawn={isDM}
                      onSpawn={(count) => spawnMonster(monster, count)}
                    />
                    {monster.custom && (
                      <button
                        onClick={() => custom.remove(monster.id)}
                        className="btn btn-danger btn-sm mt-3"
                      >
                        Eigenes Monster löschen
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Zustände */}
      {category === "conditions" && (
        <div className="space-y-1.5">
          {conditions.length === 0 && (
            <p className="p-3 text-center text-sm text-stone-500">Nichts gefunden.</p>
          )}
          {conditions.map((condition) => {
            const open = openId === condition.id;
            return (
              <div
                key={condition.id}
                className="overflow-hidden rounded-xl border border-stone-800 bg-stone-950/60"
              >
                <button
                  onClick={() => toggle(condition.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-stone-800/40"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-stone-900"
                    style={{ backgroundColor: condition.color }}
                  >
                    {condition.short}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {condition.name}
                    <span className="ml-2 text-[11px] font-normal text-stone-500">
                      {condition.en}
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-stone-500 transition ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="space-y-2 border-t border-stone-800 p-3 text-xs leading-relaxed text-stone-300">
                    <ul className="list-disc space-y-1.5 pl-4">
                      {condition.rules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                    {condition.id === "exhaustion" && (
                      <table className="mt-2 w-full border-collapse text-left">
                        <tbody>
                          {EXHAUSTION_LEVELS.map((row) => (
                            <tr key={row.level} className="border-t border-stone-800">
                              <td className="w-12 py-1 pr-2 font-semibold text-amber-300">
                                Stufe {row.level}
                              </td>
                              <td className="py-1">{row.effect}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Regeln */}
      {category === "rules" && (
        <div className="space-y-1.5">
          {rules.length === 0 && (
            <p className="p-3 text-center text-sm text-stone-500">Nichts gefunden.</p>
          )}
          {rules.map((section) => {
            const open = openId === section.id || q !== "";
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-xl border border-stone-800 bg-stone-950/60"
              >
                <button
                  onClick={() => toggle(section.id)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-stone-800/40"
                >
                  {section.title}
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-stone-500 transition ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <dl className="space-y-2 border-t border-stone-800 p-3 text-xs">
                    {section.rows.map((row) => (
                      <div key={row.label}>
                        <dt className="font-semibold text-amber-300">{row.label}</dt>
                        <dd className="leading-relaxed text-stone-300">{row.text}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      )}

      {category === "rules" && (
        <>
          <CustomRules />
          <RulebookLinks />
        </>
      )}

      {/* NPCs */}
      {category === "npcs" && isDM && <NpcBook roomId={roomId} />}

      <p className="mt-2 text-[10px] leading-relaxed text-stone-600">
        Dieses Werk enthält Material aus dem System Reference Document 5.1 („SRD 5.1“) von
        Wizards of the Coast LLC, lizenziert unter CC BY 4.0
        (creativecommons.org/licenses/by/4.0). Sinngemäß ins Deutsche übertragen, ohne Gewähr.
      </p>
    </div>
  );
}
