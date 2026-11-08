"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { v4 as uuid } from "uuid";
import { useMutation, useSelf, useStorage, type InitiativeEntry } from "@/liveblocks.config";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DiceIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  XIcon,
} from "@/components/ui/Icons";

const MIN_INIT = -20;
const MAX_INIT = 99;

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/** Höchste Initiative zuerst, bei Gleichstand gilt die Reihenfolge des Eintragens. */
function sortEntries<T extends { initiative: number; createdAt: number }>(
  entries: readonly T[]
): T[] {
  return [...entries].sort(
    (a, b) => b.initiative - a.initiative || a.createdAt - b.createdAt
  );
}

function InitiativeValue({
  value,
  editable,
  onCommit,
}: {
  value: number;
  editable: boolean;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  if (!editable) {
    return <span className="w-12 text-center text-lg font-bold tabular-nums">{value}</span>;
  }

  function commit() {
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = Math.min(MAX_INIT, Math.max(MIN_INIT, parsed));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  return (
    <input
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      aria-label="Initiative"
      className="field w-12 px-1 py-1 text-center text-base font-bold tabular-nums"
    />
  );
}

export default function InitiativeTracker() {
  const me = useSelf();
  const isDM = me.presence.role === "dm";

  const entries = useStorage((root) => Array.from(root.initiative.values()));
  const combat = useStorage((root) => root.combat);

  const [name, setName] = useState("");
  const [initInput, setInitInput] = useState("");

  // ---------- Mutationen ----------

  const addEntry = useMutation(({ storage }, entry: InitiativeEntry) => {
    storage.get("initiative").set(entry.id, entry);
  }, []);

  /** Übernimmt alle Tokens der Map, die noch nicht in der Liste sind (würfelt d20). */
  const addTokenEntries = useMutation(({ storage }) => {
    const initiative = storage.get("initiative");
    const linked = new Set<string>();
    for (const entry of initiative.values()) {
      if (entry.tokenId) linked.add(entry.tokenId);
    }

    const now = Date.now();
    let offset = 0;
    for (const liveToken of storage.get("tokens").values()) {
      const token = liveToken.toImmutable();
      if (linked.has(token.id)) continue;
      const id = uuid();
      initiative.set(id, {
        id,
        name: token.name,
        color: token.color,
        initiative: rollD20(),
        createdAt: now + offset++,
        tokenId: token.id,
        ...(token.isMonster ? { isMonster: true } : {}),
      });
    }
  }, []);

  const setInitiative = useMutation(({ storage }, id: string, value: number) => {
    const initiative = storage.get("initiative");
    const entry = initiative.get(id);
    if (entry) initiative.set(id, { ...entry, initiative: value });
  }, []);

  const toggleHidden = useMutation(({ storage }, id: string) => {
    const initiative = storage.get("initiative");
    const entry = initiative.get(id);
    if (entry) initiative.set(id, { ...entry, hidden: !entry.hidden });
  }, []);

  const removeEntry = useMutation(({ storage }, id: string) => {
    storage.get("initiative").delete(id);
  }, []);

  const clearEntries = useMutation(({ storage }) => {
    const map = storage.get("initiative");
    for (const key of Array.from(map.keys())) map.delete(key);
    storage.get("combat").update({ active: false, round: 1, currentId: null });
  }, []);

  const startCombat = useMutation(({ storage }) => {
    const sorted = sortEntries(Array.from(storage.get("initiative").values()));
    if (sorted.length === 0) return;
    storage.get("combat").update({ active: true, round: 1, currentId: sorted[0].id });
  }, []);

  const changeTurn = useMutation(({ storage }, direction: 1 | -1) => {
    const combat = storage.get("combat");
    const sorted = sortEntries(Array.from(storage.get("initiative").values()));
    if (sorted.length === 0) return;

    const index = sorted.findIndex((e) => e.id === combat.get("currentId"));
    let round = combat.get("round");
    let next: number;

    if (index === -1) {
      // Aktueller Eintrag wurde entfernt -> von vorn beginnen.
      next = 0;
    } else {
      next = index + direction;
      if (next >= sorted.length) {
        next = 0;
        round += 1;
      } else if (next < 0) {
        if (round <= 1) return;
        next = sorted.length - 1;
        round -= 1;
      }
    }
    combat.update({ currentId: sorted[next].id, round });
  }, []);

  const endCombat = useMutation(({ storage }) => {
    storage.get("combat").update({ active: false, round: 1, currentId: null });
  }, []);

  // ---------- Ableitungen ----------

  const sorted = sortEntries(entries);
  const visible = isDM ? sorted : sorted.filter((e) => !e.hidden);
  const canEdit = (entry: InitiativeEntry) => isDM || !entry.isMonster;

  function submitForm(e: FormEvent) {
    e.preventDefault();
    const parsed = parseInt(initInput, 10);
    const value = Number.isNaN(parsed)
      ? rollD20()
      : Math.min(MAX_INIT, Math.max(MIN_INIT, parsed));
    addEntry({
      id: uuid(),
      name: name.trim() || me.presence.name || "Unbekannt",
      color: me.presence.color,
      initiative: value,
      createdAt: Date.now(),
    });
    setName("");
    setInitInput("");
  }

  return (
    <div className="space-y-4">
      {/* Kopf: Status und Steuerung */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title mb-0">Kampf</h2>
          {combat.active && (
            <span className="chip bg-emerald-500/15 text-emerald-300">Runde {combat.round}</span>
          )}
        </div>

        {isDM &&
          (!combat.active ? (
            <button
              onClick={() => startCombat()}
              disabled={entries.length === 0}
              className="btn btn-gold w-full"
            >
              Kampf starten
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => changeTurn(-1)}
                aria-label="Voriger Zug"
                title="Voriger Zug"
                className="btn"
              >
                <ChevronLeftIcon />
              </button>
              <button onClick={() => changeTurn(1)} className="btn btn-gold flex-1">
                Nächster Zug <ChevronRightIcon />
              </button>
              <button onClick={() => endCombat()} className="btn btn-danger">
                Ende
              </button>
            </div>
          ))}
      </section>

      {/* Liste */}
      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-700 p-4 text-center text-sm text-stone-500">
          Noch niemand in der Reihenfolge.
          {isDM
            ? " Übernimm die Tokens der Karte oder trage Einträge unten ein."
            : " Trage dich unten selbst ein."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((entry) => {
            const isCurrent = combat.active && combat.currentId === entry.id;
            const editable = canEdit(entry);
            return (
              <li
                key={entry.id}
                aria-current={isCurrent ? "true" : undefined}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${
                  isCurrent
                    ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                    : "border-stone-800 bg-stone-950/60"
                } ${entry.hidden ? "opacity-60" : ""}`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-white/40"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate">{entry.name}</span>
                  {(entry.isMonster || entry.hidden) && (
                    <span className="mt-0.5 flex gap-1">
                      {entry.isMonster && (
                        <span className="chip bg-red-500/15 text-red-300">Monster</span>
                      )}
                      {entry.hidden && (
                        <span className="chip bg-purple-500/15 text-purple-300">versteckt</span>
                      )}
                    </span>
                  )}
                </span>

                <InitiativeValue
                  value={entry.initiative}
                  editable={editable}
                  onCommit={(value) => setInitiative(entry.id, value)}
                />

                <div className="flex items-center">
                  {editable && (
                    <button
                      onClick={() => setInitiative(entry.id, rollD20())}
                      title="Neu würfeln (d20)"
                      aria-label="Neu würfeln"
                      className="rounded p-1.5 text-stone-400 transition hover:bg-stone-800 hover:text-amber-300"
                    >
                      <DiceIcon />
                    </button>
                  )}
                  {isDM && (
                    <button
                      onClick={() => toggleHidden(entry.id)}
                      title={entry.hidden ? "Für Spieler sichtbar machen" : "Vor Spielern verbergen"}
                      aria-label="Sichtbarkeit umschalten"
                      className="rounded p-1.5 text-stone-400 transition hover:bg-stone-800 hover:text-purple-300"
                    >
                      {entry.hidden ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  )}
                  {editable && (
                    <button
                      onClick={() => removeEntry(entry.id)}
                      title="Entfernen"
                      aria-label="Eintrag entfernen"
                      className="rounded p-1.5 text-stone-400 transition hover:bg-stone-800 hover:text-red-300"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Eintragen */}
      <section>
        <h2 className="section-title">Eintragen</h2>
        <form onSubmit={submitForm} className="space-y-2">
          <input
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder={me.presence.name || "Name"}
            className="field"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={initInput}
              onChange={(e) => setInitInput(e.target.value)}
              placeholder="Initiative (leer = d20)"
              className="field"
            />
            <button type="submit" className="btn btn-gold shrink-0">
              <PlusIcon /> Hinzu
            </button>
          </div>
        </form>

        {isDM && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => addTokenEntries()} className="btn btn-sm">
              Tokens der Karte übernehmen
            </button>
            <button
              onClick={() => {
                if (entries.length > 0 && window.confirm("Initiative-Liste leeren?")) {
                  clearEntries();
                }
              }}
              disabled={entries.length === 0}
              className="btn btn-danger btn-sm"
            >
              Liste leeren
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
