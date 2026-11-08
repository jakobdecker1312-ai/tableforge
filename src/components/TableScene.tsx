"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  useOthers,
  useSelf,
  useStorage,
  useUpdateMyPresence,
  type Role,
  type Roll,
} from "@/liveblocks.config";
import Avatar from "@/components/ui/Avatar";
import RollDice3D from "@/components/Dice3D";
import { conditionById } from "@/data/conditions";

/** Sitzplätze als Prozent der Szene. Platz 0 = DM am Kopfende (oben). */
const LAYOUTS: Record<4 | 8, { x: number; y: number }[]> = {
  4: [
    { x: 50, y: 10 },
    { x: 94.5, y: 50 },
    { x: 50, y: 90 },
    { x: 5.5, y: 50 },
  ],
  8: [
    { x: 50, y: 10 },
    { x: 75, y: 10 },
    { x: 94.5, y: 50 },
    { x: 75, y: 90 },
    { x: 50, y: 90 },
    { x: 25, y: 90 },
    { x: 5.5, y: 50 },
    { x: 25, y: 10 },
  ],
};

type Sitter = {
  connectionId: number;
  name: string;
  color: string;
  role: Role;
  seat: number;
  charTokenId: string | null;
};

type ActiveRoll = { roll: Roll; leaving: boolean };

export default function TableScene({ children }: { children: ReactNode }) {
  const me = useSelf();
  const others = useOthers();
  const updatePresence = useUpdateMyPresence();

  const currentId = useStorage((root) => root.combat.currentId);
  const combatActive = useStorage((root) => root.combat.active);
  const initiative = useStorage((root) => root.initiative);
  const rolls = useStorage((root) => root.rolls);
  const tokens = useStorage((root) => root.tokens);
  const heroTokens = useMemo(
    () => Array.from(tokens.values()).filter((t) => !t.isMonster),
    [tokens]
  );

  const isDM = me.presence.role === "dm";
  const seatSetting = useStorage((root) => root.settings.tableSeats ?? 8);
  const SEATS = LAYOUTS[seatSetting === 4 ? 4 : 8];
  const SEAT_COUNT = SEATS.length;

  // Wer sitzt wo? Bei doppelter Belegung gewinnt die kleinere Verbindungs-ID.
  const sitters = useMemo(() => {
    const all: Sitter[] = [
      {
        connectionId: me.connectionId,
        name: me.presence.name,
        color: me.presence.color,
        role: me.presence.role,
        seat: me.presence.seat ?? -1,
        charTokenId: me.presence.charTokenId ?? null,
      },
      ...others.map((o) => ({
        connectionId: o.connectionId,
        name: o.presence.name,
        color: o.presence.color,
        role: o.presence.role,
        seat: o.presence.seat ?? -1,
        charTokenId: o.presence.charTokenId ?? null,
      })),
    ].filter((s) => s.seat >= 0 && s.seat < SEAT_COUNT);
    const bySeat = new Map<number, Sitter>();
    for (const s of all) {
      const cur = bySeat.get(s.seat);
      if (!cur || s.connectionId < cur.connectionId) bySeat.set(s.seat, s);
    }
    return bySeat;
  }, [me, others, SEAT_COUNT]);

  // Verlorene Plätze freigeben (Konflikt, oder DM-Platz ohne DM-Rolle).
  const mySeat = me.presence.seat;
  useEffect(() => {
    if (mySeat == null) return;
    const owner = sitters.get(mySeat);
    const invalid = (mySeat === 0 && !isDM) || mySeat >= SEAT_COUNT;
    if (invalid || (owner && owner.connectionId !== me.connectionId)) {
      updatePresence({ seat: null });
    }
  }, [mySeat, sitters, isDM, me.connectionId, updatePresence, SEAT_COUNT]);

  function toggleSeat(index: number) {
    if (mySeat === index) {
      updatePresence({ seat: null });
      return;
    }
    if (sitters.has(index)) return;
    if (index === 0 && !isDM) return;
    updatePresence({ seat: index });
  }

  // Wer ist am Zug? Zuordnung über den Namen (Spieler-Name = Initiative-Eintrag).
  const turnName = useMemo(() => {
    if (!combatActive || !currentId) return null;
    return initiative.get(currentId)?.name ?? null;
  }, [combatActive, currentId, initiative]);

  // Würfelanimation: neue, nicht verdeckte Würfe kurz auf den Tisch legen.
  const [active, setActive] = useState<ActiveRoll[]>([]);
  const lastSeen = useRef<string | null>(null);
  const firstRun = useRef(true);
  useEffect(() => {
    const last = rolls[rolls.length - 1];
    if (!last) return;
    if (firstRun.current) {
      firstRun.current = false;
      lastSeen.current = last.id;
      return;
    }
    if (last.id === lastSeen.current) return;
    lastSeen.current = last.id;
    if (last.secret && !isDM) return;
    setActive((cur) => [...cur.slice(-5), { roll: last, leaving: false }]);
    const fade = window.setTimeout(
      () => setActive((cur) => cur.map((a) => (a.roll.id === last.id ? { ...a, leaving: true } : a))),
      6000
    );
    const gone = window.setTimeout(
      () => setActive((cur) => cur.filter((a) => a.roll.id !== last.id)),
      6600
    );
    return () => {
      // Timer laufen bewusst weiter, auch wenn ein weiterer Wurf folgt.
      void fade;
      void gone;
    };
  }, [rolls, isDM]);

  function seatOfRoller(name: string): { x: number; y: number } {
    for (const [index, s] of sitters) {
      if (s.name === name) return SEATS[index];
    }
    return { x: 50, y: 50 };
  }

  return (
    <div
      className="tavern-floor relative aspect-[100/78] w-full rounded-3xl border border-amber-900/50"
      style={{ maxWidth: "min(100%, calc((100dvh - 6.5rem) * 100 / 78))" }}
    >
      {/* Rechteckiger Holztisch: die Karte füllt die ganze Tischfläche */}
      <div
        className="table-wood absolute left-[11%] top-1/2 w-[78%] -translate-y-1/2 rounded-xl p-[0.9%]"
      >
        {children}
      </div>

      {/* Sitzplätze */}
      {Array.from({ length: SEAT_COUNT }, (_, index) => {
        const pos = SEATS[index];
        const sitter = sitters.get(index);
        const isMine = sitter?.connectionId === me.connectionId;
        const yourTurn = Boolean(sitter && turnName && sitter.name === turnName);
        const claimable = !sitter && (index !== 0 || isDM);
        return (
          <div
            key={index}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            {sitter ? (
              (() => {
                const hero =
                  index === 0
                    ? undefined
                    : (sitter.charTokenId ? tokens.get(sitter.charTokenId) : undefined) ??
                      heroTokens.find((t) => t.name === sitter.name);
                const hasHp = hero?.maxHp !== undefined && hero.maxHp > 0;
                const hp = hero?.hp ?? hero?.maxHp ?? 0;
                const pct = hasHp ? Math.max(0, Math.min(1, hp / (hero?.maxHp ?? 1))) : 0;
                const conds = hero?.conditions ?? [];
                return (
                  <div
                    className={`relative flex w-[6.5rem] flex-col items-center gap-0.5 rounded-xl border bg-stone-950/90 px-2 pb-1.5 pt-2 backdrop-blur sm:w-28 ${
                      yourTurn ? "seat-turn border-emerald-400" : "border-amber-900/60"
                    } ${isMine ? "ring-1 ring-amber-400/60" : ""}`}
                  >
                    {isMine && (
                      <button
                        onClick={() => toggleSeat(index)}
                        title="Aufstehen"
                        aria-label="Aufstehen"
                        className="absolute right-1 top-1 rounded px-1 text-[10px] text-stone-500 hover:text-red-300"
                      >
                        ✕
                      </button>
                    )}
                    {hero?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hero.imageUrl}
                        alt=""
                        className="h-11 w-11 rounded-full border-2 border-amber-200/80 object-cover shadow"
                        style={{ backgroundColor: hero.color }}
                      />
                    ) : (
                      <Avatar name={hero?.name ?? sitter.name} color={hero?.color ?? sitter.color} role={sitter.role} size={44} />
                    )}
                    <span className="w-full truncate text-center text-[11px] font-medium text-stone-100">
                      {hero?.name ?? (sitter.name || "Unbekannt")}
                    </span>
                    {hero && hero.name !== sitter.name && (
                      <span className="-mt-0.5 w-full truncate text-center text-[9px] text-stone-500">
                        {sitter.name}
                      </span>
                    )}
                    {hasHp ? (
                      <div className="w-full">
                        <div className="h-1.5 overflow-hidden rounded-full border border-black/40 bg-black/60">
                          <div
                            className={`h-full ${pct > 0.5 ? "bg-emerald-500" : pct > 0.25 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                        <div className="mt-0.5 flex justify-between text-[9px] tabular-nums text-stone-400">
                          <span>
                            {hp}/{hero?.maxHp}
                          </span>
                          {hero?.ac !== undefined && <span>RK {hero.ac}</span>}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider text-stone-500">
                        {index === 0 ? "Spielleitung" : yourTurn ? "am Zug" : isMine ? "Du" : "Spieler"}
                      </span>
                    )}
                    {conds.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5">
                        {conds.slice(0, 4).map((id) => {
                          const info = conditionById(id);
                          return info ? (
                            <span
                              key={id}
                              title={info.name}
                              className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[7px] font-bold text-stone-900"
                              style={{ backgroundColor: info.color }}
                            >
                              {info.short}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    {yourTurn && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                        am Zug
                      </span>
                    )}
                    {isMine && index !== 0 && (
                      <select
                        value={sitter.charTokenId ?? ""}
                        onChange={(e) => updatePresence({ charTokenId: e.target.value || null })}
                        aria-label="Mein Held"
                        className="mt-0.5 w-full truncate rounded border border-stone-700 bg-stone-900 px-1 py-0.5 text-[9px] text-stone-300"
                      >
                        <option value="">Held wählen …</option>
                        {heroTokens.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })()
            ) : (
              <button
                onClick={() => toggleSeat(index)}
                disabled={!claimable}
                title={claimable ? "Hier hinsetzen" : "Nur für die DM"}
                className={`flex h-14 w-[5.5rem] flex-col items-center justify-center rounded-xl border border-dashed text-[10px] transition sm:w-24 ${
                  claimable
                    ? "border-amber-700/60 bg-stone-950/40 text-amber-200/80 hover:bg-amber-500/10"
                    : "border-stone-700/60 bg-stone-950/30 text-stone-600"
                }`}
              >
                <span className="text-lg leading-none">🪑</span>
                {index === 0 ? "DM-Platz" : "Frei"}
              </button>
            )}
          </div>
        );
      })}

      {/* Gewürfelte Würfel auf dem Tisch */}
      {active.map(({ roll, leaving }) => {
        const from = seatOfRoller(roll.playerName);
        // Würfel landet am Kartenrand vor dem Platz.
        const x = from.x + (50 - from.x) * 0.3;
        const y = from.y + (50 - from.y) * 0.3;
        return (
          <div
            key={roll.id}
            className={`die-roll ${leaving ? "leaving" : ""} pointer-events-none absolute z-20`}
            style={
              {
                left: `${x}%`,
                top: `${y}%`,
                "--from-x": `${(from.x - x) * 4}px`,
                "--from-y": `${(from.y - y) * 3}px`,
              } as CSSProperties
            }
          >
            <RollDice3D roll={roll} />
          </div>
        );
      })}
    </div>
  );
}
