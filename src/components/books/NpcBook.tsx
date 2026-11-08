"use client";

import { v4 as uuid } from "uuid";
import { useLocalState } from "@/lib/useLocalState";
import { spawnPosition, uniqueName } from "@/lib/map";
import { useTokenActions } from "@/lib/useTokenActions";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";

type Attitude = "friendly" | "neutral" | "hostile";

type Npc = {
  id: string;
  name: string;
  role: string;
  attitude: Attitude;
  notes: string;
};

const ATTITUDES: { id: Attitude; label: string; color: string; chip: string }[] = [
  { id: "friendly", label: "Freundlich", color: "#22c55e", chip: "bg-emerald-500/15 text-emerald-300" },
  { id: "neutral", label: "Neutral", color: "#a8a29e", chip: "bg-stone-500/20 text-stone-300" },
  { id: "hostile", label: "Feindlich", color: "#ef4444", chip: "bg-red-500/15 text-red-300" },
];

/** Privates NPC-Verzeichnis der DM. Wird nur im Browser der DM gespeichert. */
export default function NpcBook({ roomId }: { roomId: string }) {
  const [npcs, setNpcs] = useLocalState<Npc[]>(`tableforge:npcs:${roomId}`, []);
  const { names, addToken } = useTokenActions();

  function addNpc() {
    setNpcs((list) => [
      { id: uuid(), name: "Neuer NPC", role: "", attitude: "neutral", notes: "" },
      ...list,
    ]);
  }

  function patchNpc(id: string, patch: Partial<Npc>) {
    setNpcs((list) => list.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function placeToken(npc: Npc) {
    const attitude = ATTITUDES.find((a) => a.id === npc.attitude) ?? ATTITUDES[1];
    addToken({
      id: uuid(),
      name: uniqueName(names, npc.name || "NPC"),
      color: attitude.color,
      size: 1,
      isMonster: true,
      ...spawnPosition(),
    });
  }

  return (
    <div className="space-y-3">
      <button onClick={addNpc} className="btn btn-gold w-full">
        <PlusIcon /> Neuer NPC
      </button>
      <p className="text-xs text-stone-500">
        Nur auf diesem Gerät gespeichert, deine Spieler sehen das Verzeichnis nicht.
      </p>

      {npcs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-700 p-4 text-center text-sm text-stone-500">
          Noch keine NPCs. Lege Wirte, Händler und Schurken an.
        </p>
      ) : (
        <ul className="space-y-2">
          {npcs.map((npc) => {
            const attitude = ATTITUDES.find((a) => a.id === npc.attitude) ?? ATTITUDES[1];
            return (
              <li
                key={npc.id}
                className="space-y-2 rounded-xl border border-stone-800 bg-stone-950/60 p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    value={npc.name}
                    maxLength={40}
                    onChange={(e) => patchNpc(npc.id, { name: e.target.value })}
                    aria-label="Name"
                    className="field font-semibold"
                  />
                  <button
                    onClick={() => setNpcs((list) => list.filter((n) => n.id !== npc.id))}
                    aria-label="NPC löschen"
                    title="NPC löschen"
                    className="rounded p-1.5 text-stone-500 transition hover:bg-stone-800 hover:text-red-300"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <input
                  value={npc.role}
                  maxLength={60}
                  onChange={(e) => patchNpc(npc.id, { role: e.target.value })}
                  placeholder="Rolle, z. B. Wirtin, Hehler, Bürgermeister"
                  className="field"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  {ATTITUDES.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => patchNpc(npc.id, { attitude: a.id })}
                      className={`chip border transition ${
                        npc.attitude === a.id
                          ? `${a.chip} border-current`
                          : "border-stone-700 text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={npc.notes}
                  rows={3}
                  maxLength={2000}
                  onChange={(e) => patchNpc(npc.id, { notes: e.target.value })}
                  placeholder="Aussehen, Geheimnisse, Motivation …"
                  className="field resize-y"
                />
                <button onClick={() => placeToken(npc)} className="btn btn-sm w-full">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: attitude.color }}
                  />
                  Als Token auf die Karte
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
