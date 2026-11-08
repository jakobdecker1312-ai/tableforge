"use client";

import { useEffect, useRef, useState } from "react";
import { useSelf, useStorage } from "@/liveblocks.config";
import { useAmbience } from "@/lib/useAmbience";

/** Licht/Ton der gewählten Stimmung plus Banner beim Zugwechsel. */
export default function MoodLayer() {
  const me = useSelf();
  const mood = useStorage((root) => root.settings.mood ?? "none");
  const combatActive = useStorage((root) => root.combat.active);
  const currentId = useStorage((root) => root.combat.currentId);
  const initiative = useStorage((root) => root.initiative);

  const [sound, setSound] = useState(false);
  useAmbience(mood, sound);

  // Zugwechsel-Banner
  const [banner, setBanner] = useState<{ key: string; text: string; mine: boolean } | null>(null);
  const prev = useRef<string | null>(null);
  const turnName = combatActive && currentId ? initiative.get(currentId)?.name ?? null : null;
  const entryHidden =
    combatActive && currentId ? Boolean(initiative.get(currentId)?.hidden) : false;
  const isDM = me.presence.role === "dm";

  useEffect(() => {
    const key = combatActive && currentId ? currentId : null;
    if (key === prev.current) return;
    prev.current = key;
    if (!key || !turnName || (entryHidden && !isDM)) return;
    const mine = turnName === me.presence.name;
    setBanner({ key: `${key}-${Date.now()}`, text: mine ? "Du bist dran!" : `${turnName} ist am Zug`, mine });
    const t = window.setTimeout(() => setBanner(null), 3000);
    return () => window.clearTimeout(t);
  }, [combatActive, currentId, turnName, entryHidden, isDM, me.presence.name]);

  return (
    <>
      {mood !== "none" && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-3xl" aria-hidden>
          <div className={`mood-layer mood-${mood}`} />
          {mood === "storm" && <div className="mood-layer mood-storm-flash" />}
        </div>
      )}

      {mood !== "none" && (
        <button
          onClick={() => setSound((s) => !s)}
          className="btn btn-sm absolute right-2 top-2 z-30"
          title="Umgebungsgeräusche an/aus"
        >
          {sound ? "🔊 Ton an" : "🔇 Ton aus"}
        </button>
      )}

      {banner && (
        <div
          key={banner.key}
          className={`turn-banner pointer-events-none absolute left-1/2 top-6 z-40 rounded-xl border-2 px-8 py-3 text-center font-decor text-2xl font-bold shadow-2xl ${
            banner.mine
              ? "border-emerald-300 bg-emerald-950/95 text-emerald-200"
              : "border-amber-400 bg-stone-950/95 text-amber-200"
          }`}
        >
          {banner.text}
        </div>
      )}
    </>
  );
}
