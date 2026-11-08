"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { v4 as uuid } from "uuid";
import { useMutation, useSelf, useStorage, type CharacterSheet } from "@/liveblocks.config";
import {
  ABILITIES,
  SKILLS,
  abilityMod,
  formatBonus,
  proficiencyBonus,
  saveBonus,
  sheetExportPayload,
  skillBonus,
} from "@/data/sheet";
import { PALETTE } from "@/lib/identity";
import { spawnPosition } from "@/lib/map";
import { useRolls } from "@/lib/useRolls";
import { useTokenActions } from "@/lib/useTokenActions";
import { NumberInput, TextArea, TextInput } from "@/components/ui/Inputs";
import { DiceIcon, DownloadIcon, PlusIcon, TrashIcon, XIcon } from "@/components/ui/Icons";

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-stone-800 bg-stone-950/60 p-3 ${className}`}>
      <h3 className="section-title">{title}</h3>
      {children}
    </section>
  );
}

/** Reihe aus anklickbaren Punkten (Todesrettungswürfe, Zauberplätze). */
function Pips({
  total,
  filled,
  onChange,
  color,
  disabled,
  label,
}: {
  total: number;
  filled: number;
  onChange: (value: number) => void;
  color: string;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex gap-1.5" role="group" aria-label={label}>
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled;
        return (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onChange(on && i === filled - 1 ? i : i + 1)}
            aria-label={`${label} ${i + 1}`}
            aria-pressed={on}
            className={`h-5 w-5 rounded-full border-2 transition disabled:cursor-not-allowed ${color} ${
              on ? "" : "bg-transparent"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function CharacterSheetModal({
  sheetId,
  ownerKey,
  onClose,
  onSelectToken,
}: {
  sheetId: string;
  ownerKey: string;
  onClose: () => void;
  onSelectToken: (id: string) => void;
}) {
  const me = useSelf();
  const isDM = me.presence.role === "dm";

  const sheet = useStorage((root) => root.sheets?.get(sheetId));
  const tokenExists = useStorage((root) => {
    const tokenId = root.sheets?.get(sheetId)?.tokenId;
    return tokenId ? root.tokens.has(tokenId) : false;
  });

  const { rollDice, rollFormula } = useRolls();
  const { addToken } = useTokenActions();
  const [amount, setAmount] = useState("5");

  const updateSheet = useMutation(
    ({ storage }, id: string, patch: Partial<CharacterSheet>) => {
      const live = storage.get("sheets")?.get(id);
      if (!live) return;
      live.update(patch);
      const tokenId = live.get("tokenId");
      if (
        tokenId &&
        (patch.hpCurrent !== undefined || patch.hpMax !== undefined || patch.ac !== undefined)
      ) {
        storage.get("tokens").get(tokenId)?.update({
          hp: live.get("hpCurrent"),
          maxHp: live.get("hpMax"),
          ac: live.get("ac"),
        });
      }
    },
    []
  );

  const deleteSheet = useMutation(({ storage }, id: string) => {
    storage.get("sheets")?.delete(id);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!sheet) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="anim-backdrop absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="anim-pop panel relative rounded-2xl p-6 text-center">
          <p className="text-stone-300">Dieser Charakterbogen existiert nicht mehr.</p>
          <button onClick={onClose} className="btn mt-4">
            Schließen
          </button>
        </div>
      </div>
    );
  }

  const canEdit = isDM || sheet.ownerKey === ownerKey;
  const pb = proficiencyBonus(sheet.level);
  const set = (patch: Partial<CharacterSheet>) => updateSheet(sheet.id, patch);
  const who = sheet.name || "Held";

  const spellMod = sheet.spellAbility
    ? abilityMod(sheet.abilities[sheet.spellAbility as keyof CharacterSheet["abilities"]])
    : null;
  const initiative = abilityMod(sheet.abilities.dex) + sheet.initiativeBonus;
  const passivePerception = 10 + skillBonus(sheet, "perception");

  const hpRatio = sheet.hpMax > 0 ? Math.max(0, Math.min(1, sheet.hpCurrent / sheet.hpMax)) : 0;
  const hpColor = hpRatio > 0.5 ? "bg-emerald-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";

  function applyDamage() {
    const amt = Math.max(0, parseInt(amount, 10) || 0);
    if (amt === 0) return;
    const absorbed = Math.min(sheet!.hpTemp, amt);
    const rest = amt - absorbed;
    set({
      hpTemp: sheet!.hpTemp - absorbed,
      hpCurrent: Math.max(0, sheet!.hpCurrent - rest),
    });
  }

  function applyHeal() {
    const amt = Math.max(0, parseInt(amount, 10) || 0);
    if (amt === 0) return;
    set({ hpCurrent: Math.min(sheet!.hpMax, sheet!.hpCurrent + amt) });
  }

  function cycleSkill(skillId: string) {
    const current = sheet!.skillProf[skillId] ?? 0;
    const next = (current + 1) % 3;
    const profs = { ...sheet!.skillProf };
    if (next === 0) delete profs[skillId];
    else profs[skillId] = next;
    set({ skillProf: profs });
  }

  function toggleSave(abilityId: string) {
    const has = sheet!.saveProf.includes(abilityId);
    set({
      saveProf: has
        ? sheet!.saveProf.filter((a) => a !== abilityId)
        : [...sheet!.saveProf, abilityId],
    });
  }

  function patchAttack(id: string, patch: Partial<CharacterSheet["attacks"][number]>) {
    set({ attacks: sheet!.attacks.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  }

  function setSlots(key: "slotsMax" | "slotsUsed", index: number, value: number) {
    const next = [...sheet![key]];
    next[index] = value;
    set(key === "slotsMax" ? { slotsMax: next } : { slotsUsed: next });
  }

  function placeToken() {
    const id = uuid();
    addToken({
      id,
      name: sheet!.name || "Held",
      color: sheet!.color,
      size: 1,
      hp: sheet!.hpCurrent,
      maxHp: sheet!.hpMax,
      ac: sheet!.ac,
      ...spawnPosition(),
    });
    set({ tokenId: id });
  }

  function exportSheet() {
    const payload = sheetExportPayload(sheet as CharacterSheet);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safe = (sheet!.name || "held").replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, "_");
    link.href = url;
    link.download = `${safe}.tableforge.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-2 pt-14 sm:p-4 sm:pt-16">
      <div className="anim-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="anim-pop panel relative mb-6 w-full max-w-6xl rounded-2xl">
        {/* Kopf */}
        <header className="flex flex-wrap items-start gap-3 border-b border-stone-800 p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <TextInput
              value={sheet.name}
              onCommit={(name) => set({ name })}
              disabled={!canEdit}
              ariaLabel="Name des Charakters"
              placeholder="Name"
              className="font-display text-2xl font-bold"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <TextInput
                value={sheet.className}
                onCommit={(className) => set({ className })}
                disabled={!canEdit}
                ariaLabel="Klasse"
                placeholder="Klasse"
              />
              <TextInput
                value={sheet.race}
                onCommit={(race) => set({ race })}
                disabled={!canEdit}
                ariaLabel="Volk"
                placeholder="Volk"
              />
              <TextInput
                value={sheet.background}
                onCommit={(background) => set({ background })}
                disabled={!canEdit}
                ariaLabel="Hintergrund"
                placeholder="Hintergrund"
              />
              <TextInput
                value={sheet.alignment}
                onCommit={(alignment) => set({ alignment })}
                disabled={!canEdit}
                ariaLabel="Gesinnung"
                placeholder="Gesinnung"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-400">
              <label className="flex items-center gap-2">
                Stufe
                <NumberInput
                  value={sheet.level}
                  min={1}
                  max={20}
                  onCommit={(level) => set({ level })}
                  disabled={!canEdit}
                  className="w-16 px-2 py-1 text-center"
                  ariaLabel="Stufe"
                />
              </label>
              <label className="flex items-center gap-2">
                EP
                <NumberInput
                  value={sheet.xp}
                  min={0}
                  max={1000000}
                  onCommit={(xp) => set({ xp })}
                  disabled={!canEdit}
                  className="w-24 px-2 py-1 text-center"
                  ariaLabel="Erfahrungspunkte"
                />
              </label>
              <div className="flex items-center gap-1.5" role="group" aria-label="Farbe">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    disabled={!canEdit}
                    onClick={() => set({ color: c })}
                    aria-label={`Farbe ${c}`}
                    className={`h-5 w-5 rounded-full border-2 transition disabled:cursor-not-allowed ${
                      sheet.color === c ? "scale-110 border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && !tokenExists && (
              <button onClick={placeToken} className="btn btn-gold btn-sm">
                <PlusIcon className="h-3.5 w-3.5" /> Token auf die Karte
              </button>
            )}
            {tokenExists && sheet.tokenId && (
              <button
                onClick={() => {
                  onSelectToken(sheet.tokenId as string);
                  onClose();
                }}
                className="btn btn-sm"
              >
                Token zeigen
              </button>
            )}
            <button onClick={exportSheet} className="btn btn-sm" title="Als Datei speichern">
              <DownloadIcon className="h-3.5 w-3.5" /> Exportieren
            </button>
            {canEdit && (
              <button
                onClick={() => {
                  if (window.confirm(`„${who}“ endgültig löschen?`)) {
                    deleteSheet(sheet.id);
                    onClose();
                  }
                }}
                className="btn btn-danger btn-sm"
                title="Bogen löschen"
                aria-label="Bogen löschen"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Schließen"
              title="Schließen (Esc)"
              className="rounded-lg border border-stone-700 p-2 text-stone-400 transition hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {!canEdit && (
          <p className="border-b border-stone-800 bg-stone-950/60 px-4 py-2 text-xs text-stone-400">
            Du siehst diesen Bogen von {sheet.ownerName}. Würfeln kannst du, ändern nicht.
          </p>
        )}

        {/* Körper */}
        <div className="grid gap-3 p-4 lg:grid-cols-[1fr_1.15fr_1fr]">
          {/* Spalte 1: Attribute, Rettungswürfe, Fertigkeiten */}
          <div className="space-y-3">
            <Card title="Attribute">
              <div className="grid grid-cols-3 gap-2">
                {ABILITIES.map((ability) => {
                  const score = sheet.abilities[ability.id];
                  const mod = abilityMod(score);
                  return (
                    <div
                      key={ability.id}
                      className="rounded-lg border border-stone-800 bg-stone-900/60 p-2 text-center"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                        {ability.short}
                      </div>
                      <button
                        onClick={() =>
                          rollDice({
                            sides: 20,
                            modifier: mod,
                            label: `${who}: ${ability.name}`,
                          })
                        }
                        title={`${ability.name}: Probe würfeln`}
                        className="my-1 font-display text-2xl font-bold transition hover:text-amber-300"
                      >
                        {formatBonus(mod)}
                      </button>
                      <NumberInput
                        value={score}
                        min={1}
                        max={30}
                        onCommit={(n) => set({ abilities: { ...sheet.abilities, [ability.id]: n } })}
                        disabled={!canEdit}
                        className="w-full px-1 py-0.5 text-center text-sm"
                        ariaLabel={ability.name}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Rettungswürfe">
              <ul className="space-y-1">
                {ABILITIES.map((ability) => {
                  const proficient = sheet.saveProf.includes(ability.id);
                  const bonus = saveBonus(sheet, ability.id);
                  return (
                    <li key={ability.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={proficient}
                        disabled={!canEdit}
                        onChange={() => toggleSave(ability.id)}
                        aria-label={`${ability.name} geübt`}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <span className="flex-1">{ability.name}</span>
                      <button
                        onClick={() =>
                          rollDice({
                            sides: 20,
                            modifier: bonus,
                            label: `${who}: ${ability.name}-Rettungswurf`,
                          })
                        }
                        className="w-12 rounded-md bg-stone-900 py-0.5 text-center font-semibold tabular-nums transition hover:text-amber-300"
                      >
                        {formatBonus(bonus)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card title="Fertigkeiten">
              <ul className="space-y-0.5">
                {SKILLS.map((skill) => {
                  const level = sheet.skillProf[skill.id] ?? 0;
                  const bonus = skillBonus(sheet, skill.id);
                  return (
                    <li key={skill.id} className="flex items-center gap-2 text-sm">
                      <button
                        disabled={!canEdit}
                        onClick={() => cycleSkill(skill.id)}
                        title={
                          level === 0 ? "Nicht geübt" : level === 1 ? "Geübt" : "Expertise"
                        }
                        aria-label={`${skill.name}: ${
                          level === 0 ? "nicht geübt" : level === 1 ? "geübt" : "Expertise"
                        }`}
                        className={`h-4 w-4 shrink-0 rounded-full border-2 transition disabled:cursor-not-allowed ${
                          level === 0
                            ? "border-stone-600"
                            : level === 1
                              ? "border-amber-400 bg-amber-400"
                              : "border-amber-400 bg-amber-400 ring-2 ring-amber-400/40 ring-offset-1 ring-offset-stone-950"
                        }`}
                      />
                      <span className="flex-1 truncate">
                        {skill.name}{" "}
                        <span className="text-[10px] text-stone-500">
                          {ABILITIES.find((a) => a.id === skill.ability)?.short}
                        </span>
                      </span>
                      <button
                        onClick={() =>
                          rollDice({
                            sides: 20,
                            modifier: bonus,
                            label: `${who}: ${skill.name}`,
                          })
                        }
                        className="w-12 rounded-md bg-stone-900 py-0.5 text-center font-semibold tabular-nums transition hover:text-amber-300"
                      >
                        {formatBonus(bonus)}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-stone-500">
                Kreis antippen: geübt, noch einmal: Expertise.
              </p>
            </Card>
          </div>

          {/* Spalte 2: Kampf, TP, Angriffe, Zauber */}
          <div className="space-y-3">
            <Card title="Kampfwerte">
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
                <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">RK</div>
                  <NumberInput
                    value={sheet.ac}
                    min={0}
                    max={40}
                    onCommit={(ac) => set({ ac })}
                    disabled={!canEdit}
                    className="mt-1 px-1 py-0.5 text-center text-lg font-bold"
                    ariaLabel="Rüstungsklasse"
                  />
                </div>
                <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">
                    Initiative
                  </div>
                  <button
                    onClick={() =>
                      rollDice({ sides: 20, modifier: initiative, label: `${who}: Initiative` })
                    }
                    className="mt-1 font-display text-xl font-bold transition hover:text-amber-300"
                  >
                    {formatBonus(initiative)}
                  </button>
                </div>
                <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">
                    Bewegung (m)
                  </div>
                  <NumberInput
                    value={sheet.speed}
                    min={0}
                    max={200}
                    onCommit={(speed) => set({ speed })}
                    disabled={!canEdit}
                    className="mt-1 px-1 py-0.5 text-center text-lg font-bold"
                    ariaLabel="Bewegungsrate in Metern"
                  />
                </div>
                <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">
                    Übungsbonus
                  </div>
                  <div className="mt-1 font-display text-xl font-bold">{formatBonus(pb)}</div>
                </div>
                <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">
                    Pass. Wahrn.
                  </div>
                  <div className="mt-1 font-display text-xl font-bold">{passivePerception}</div>
                </div>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-stone-400">
                Initiative-Bonus
                <NumberInput
                  value={sheet.initiativeBonus}
                  min={-10}
                  max={20}
                  onCommit={(initiativeBonus) => set({ initiativeBonus })}
                  disabled={!canEdit}
                  className="w-16 px-2 py-0.5 text-center"
                  ariaLabel="Initiative-Bonus"
                />
              </label>
            </Card>

            <Card title="Trefferpunkte">
              <div className="flex items-end justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold tabular-nums">
                    {sheet.hpCurrent}
                  </span>
                  <span className="text-lg text-stone-500">/ {sheet.hpMax}</span>
                  {sheet.hpTemp > 0 && (
                    <span className="chip bg-sky-500/15 text-sky-300">+{sheet.hpTemp} temp.</span>
                  )}
                </div>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-800">
                <div
                  className={`h-full transition-all ${hpColor}`}
                  style={{ width: `${hpRatio * 100}%` }}
                />
              </div>

              {canEdit && (
                <>
                  <div className="mt-3 flex gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      aria-label="Menge"
                      className="field w-16 px-2 py-1 text-center"
                    />
                    <button onClick={applyDamage} className="btn btn-danger flex-1 py-1">
                      Schaden
                    </button>
                    <button
                      onClick={applyHeal}
                      className="btn flex-1 border-emerald-500/40 py-1 text-emerald-300 hover:border-emerald-400"
                    >
                      Heilen
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wide text-stone-500">
                    <label className="block">
                      Aktuell
                      <NumberInput
                        value={sheet.hpCurrent}
                        min={0}
                        max={sheet.hpMax}
                        onCommit={(hpCurrent) => set({ hpCurrent })}
                        className="mt-0.5 px-1.5 py-1 text-center text-sm normal-case"
                        ariaLabel="Aktuelle Trefferpunkte"
                      />
                    </label>
                    <label className="block">
                      Maximum
                      <NumberInput
                        value={sheet.hpMax}
                        min={1}
                        max={999}
                        onCommit={(hpMax) =>
                          set({ hpMax, hpCurrent: Math.min(sheet.hpCurrent, hpMax) })
                        }
                        className="mt-0.5 px-1.5 py-1 text-center text-sm normal-case"
                        ariaLabel="Maximale Trefferpunkte"
                      />
                    </label>
                    <label className="block">
                      Temporär
                      <NumberInput
                        value={sheet.hpTemp}
                        min={0}
                        max={999}
                        onCommit={(hpTemp) => set({ hpTemp })}
                        className="mt-0.5 px-1.5 py-1 text-center text-sm normal-case"
                        ariaLabel="Temporäre Trefferpunkte"
                      />
                    </label>
                  </div>
                </>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
                Trefferwürfel
                <TextInput
                  value={sheet.hitDice}
                  onCommit={(hitDice) => set({ hitDice })}
                  disabled={!canEdit}
                  maxLength={30}
                  className="w-28 px-2 py-0.5 text-center"
                  ariaLabel="Trefferwürfel"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="mb-1 text-emerald-300">Erfolge</div>
                  <Pips
                    total={3}
                    filled={sheet.deathSuccesses}
                    onChange={(deathSuccesses) => set({ deathSuccesses })}
                    color="border-emerald-400 bg-emerald-400"
                    disabled={!canEdit}
                    label="Todesrettungswurf Erfolg"
                  />
                </div>
                <div>
                  <div className="mb-1 text-red-300">Fehlschläge</div>
                  <Pips
                    total={3}
                    filled={sheet.deathFailures}
                    onChange={(deathFailures) => set({ deathFailures })}
                    color="border-red-400 bg-red-400"
                    disabled={!canEdit}
                    label="Todesrettungswurf Fehlschlag"
                  />
                </div>
              </div>
              <button
                onClick={() => rollDice({ sides: 20, label: `${who}: Todesrettungswurf` })}
                className="btn btn-sm mt-3"
              >
                <DiceIcon className="h-3.5 w-3.5" /> Todesrettungswurf
              </button>
            </Card>

            <Card title="Angriffe">
              {sheet.attacks.length === 0 && (
                <p className="mb-2 text-xs text-stone-500">Noch keine Angriffe eingetragen.</p>
              )}
              <ul className="space-y-2">
                {sheet.attacks.map((attack) => (
                  <li
                    key={attack.id}
                    className="space-y-1.5 rounded-lg border border-stone-800 bg-stone-900/60 p-2"
                  >
                    <div className="flex gap-1.5">
                      <TextInput
                        value={attack.name}
                        onCommit={(name) => patchAttack(attack.id, { name })}
                        disabled={!canEdit}
                        maxLength={60}
                        placeholder="Name"
                        ariaLabel="Angriffsname"
                        className="py-1"
                      />
                      {canEdit && (
                        <button
                          onClick={() =>
                            set({ attacks: sheet.attacks.filter((a) => a.id !== attack.id) })
                          }
                          aria-label="Angriff entfernen"
                          className="rounded p-1 text-stone-500 transition hover:bg-stone-800 hover:text-red-300"
                        >
                          <XIcon />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <NumberInput
                        value={attack.bonus}
                        min={-20}
                        max={30}
                        onCommit={(bonus) => patchAttack(attack.id, { bonus })}
                        disabled={!canEdit}
                        className="w-16 px-1 py-1 text-center"
                        ariaLabel="Trefferbonus"
                      />
                      <TextInput
                        value={attack.damage}
                        onCommit={(damage) => patchAttack(attack.id, { damage })}
                        disabled={!canEdit}
                        maxLength={40}
                        placeholder="1W8+3"
                        ariaLabel="Schaden"
                        className="py-1"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          rollDice({
                            sides: 20,
                            modifier: attack.bonus,
                            label: `${who}: ${attack.name || "Angriff"} (Treffer)`,
                          })
                        }
                        className="btn btn-sm flex-1"
                      >
                        <DiceIcon className="h-3.5 w-3.5" /> Treffer {formatBonus(attack.bonus)}
                      </button>
                      <button
                        onClick={() =>
                          rollFormula(
                            attack.damage,
                            `${who}: ${attack.name || "Angriff"} (Schaden)`
                          )
                        }
                        className="btn btn-sm flex-1"
                      >
                        <DiceIcon className="h-3.5 w-3.5" /> Schaden
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {canEdit && sheet.attacks.length < 20 && (
                <button
                  onClick={() =>
                    set({
                      attacks: [
                        ...sheet.attacks,
                        { id: uuid(), name: "Waffe", bonus: pb, damage: "1W8" },
                      ],
                    })
                  }
                  className="btn btn-sm mt-2 w-full"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> Angriff hinzufügen
                </button>
              )}
            </Card>

            <Card title="Zauber">
              <div className="flex flex-wrap items-center gap-3 text-sm text-stone-400">
                <label className="flex items-center gap-2">
                  Attribut
                  <select
                    value={sheet.spellAbility}
                    disabled={!canEdit}
                    onChange={(e) => set({ spellAbility: e.target.value })}
                    aria-label="Zauberattribut"
                    className="field w-auto py-1"
                  >
                    <option value="">–</option>
                    {ABILITIES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                {spellMod !== null && (
                  <>
                    <span>
                      SG <b className="text-stone-100">{8 + pb + spellMod}</b>
                    </span>
                    <button
                      onClick={() =>
                        rollDice({
                          sides: 20,
                          modifier: pb + spellMod,
                          label: `${who}: Zauberangriff`,
                        })
                      }
                      className="btn btn-sm"
                    >
                      <DiceIcon className="h-3.5 w-3.5" /> Angriff {formatBonus(pb + spellMod)}
                    </button>
                  </>
                )}
              </div>

              <div className="mt-3 space-y-1.5">
                {sheet.slotsMax.map((max, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="w-14 text-xs text-stone-500">Grad {index + 1}</span>
                    <NumberInput
                      value={max}
                      min={0}
                      max={9}
                      onCommit={(n) => {
                        setSlots("slotsMax", index, n);
                        if (sheet.slotsUsed[index] > n) setSlots("slotsUsed", index, n);
                      }}
                      disabled={!canEdit}
                      className="w-12 px-1 py-0.5 text-center"
                      ariaLabel={`Zauberplätze Grad ${index + 1}`}
                    />
                    <Pips
                      total={max}
                      filled={sheet.slotsUsed[index] ?? 0}
                      onChange={(n) => setSlots("slotsUsed", index, n)}
                      color="border-sky-400 bg-sky-400"
                      disabled={!canEdit}
                      label={`Zauberplatz Grad ${index + 1} verbraucht`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-stone-500">
                Zahl = Plätze pro Rast, gefüllte Punkte = verbraucht.
              </p>
            </Card>
          </div>

          {/* Spalte 3: Texte */}
          <div className="space-y-3">
            <Card title="Ausrüstung">
              <TextArea
                value={sheet.equipment}
                onCommit={(equipment) => set({ equipment })}
                disabled={!canEdit}
                rows={8}
                placeholder="Rüstung, Waffen, Gold, Gegenstände …"
                ariaLabel="Ausrüstung"
              />
            </Card>
            <Card title="Merkmale und Fähigkeiten">
              <TextArea
                value={sheet.features}
                onCommit={(features) => set({ features })}
                disabled={!canEdit}
                rows={8}
                placeholder="Klassenmerkmale, Volksmerkmale, Talente …"
                ariaLabel="Merkmale und Fähigkeiten"
              />
            </Card>
            <Card title="Persönlichkeit">
              <TextArea
                value={sheet.traits}
                onCommit={(traits) => set({ traits })}
                disabled={!canEdit}
                rows={5}
                placeholder="Eigenschaften, Ideale, Bindungen, Makel …"
                ariaLabel="Persönlichkeit"
              />
            </Card>
            <Card title="Notizen">
              <TextArea
                value={sheet.notes}
                onCommit={(notes) => set({ notes })}
                disabled={!canEdit}
                rows={6}
                placeholder="Hintergrundgeschichte, Ziele, Sitzungsnotizen …"
                ariaLabel="Notizen"
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
