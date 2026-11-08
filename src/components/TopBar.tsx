"use client";

import Link from "next/link";
import { useState } from "react";
import { useOthers, useSelf, useUpdateMyPresence } from "@/liveblocks.config";
import Avatar from "@/components/ui/Avatar";
import { CheckIcon, CopyIcon, ScreenIcon } from "@/components/ui/Icons";

const MAX_AVATARS = 6;

export default function TopBar({
  roomId,
  onOpenDmScreen,
}: {
  roomId: string;
  onOpenDmScreen: () => void;
}) {
  const me = useSelf();
  const others = useOthers();
  const updatePresence = useUpdateMyPresence();
  const [copied, setCopied] = useState(false);

  const { name, color, role } = me.presence;
  const shown = others.slice(0, MAX_AVATARS - 1);
  const extra = others.length - shown.length;

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard nicht verfügbar – ignorieren
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-900/50 bg-stone-950/85 shadow-[0_1px_0_rgba(251,191,36,0.12)] px-3 py-2 backdrop-blur sm:px-4">
      <Link
        href="/dashboard"
        className="font-decor text-lg font-bold tracking-wide text-stone-100"
      >
        ⚔️ Tavern <span className="text-gold">Roll</span>
      </Link>

      <button
        onClick={copyInviteLink}
        className="btn btn-sm"
        title="Einladungslink kopieren"
      >
        <span className="font-mono text-stone-300">{roomId}</span>
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" />
        )}
        <span className="hidden text-stone-500 sm:inline">
          {copied ? "Kopiert" : "Einladen"}
        </span>
      </button>

      {/* Wer ist am Tisch? */}
      <div className="flex items-center -space-x-2" aria-label="Am Tisch">
        <Avatar name={name} color={color} role={role} />
        {shown.map((other) => (
          <Avatar
            key={other.connectionId}
            name={other.presence.name}
            color={other.presence.color}
            role={other.presence.role}
          />
        ))}
        {extra > 0 && (
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-stone-900 bg-stone-700 text-xs font-bold text-stone-100">
            +{extra}
          </span>
        )}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {role === "dm" && (
          <button
            onClick={onOpenDmScreen}
            className="btn btn-gold btn-sm"
            title="DM-Schirm öffnen"
          >
            <ScreenIcon className="h-4 w-4" />
            <span className="hidden sm:inline">DM-Schirm</span>
          </button>
        )}
        <input
          value={name}
          maxLength={24}
          onChange={(e) => updatePresence({ name: e.target.value })}
          onBlur={() => {
            if (!name.trim()) updatePresence({ name: "Unbekannt" });
          }}
          aria-label="Dein Name"
          className="field w-36"
        />

        <div
          role="group"
          aria-label="Rolle"
          className="flex overflow-hidden rounded-lg border border-stone-700 text-sm"
        >
          {(["player", "dm"] as const).map((r) => (
            <button
              key={r}
              onClick={() => updatePresence({ role: r })}
              className={`px-3 py-1.5 transition ${
                role === r
                  ? r === "dm"
                    ? "bg-amber-500 font-semibold text-stone-900"
                    : "bg-sky-500 font-semibold text-stone-900"
                  : "bg-stone-900 text-stone-400 hover:text-stone-100"
              }`}
            >
              {r === "dm" ? "DM" : "Spieler"}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
