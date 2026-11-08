"use client";

import Link from "next/link";
import { useState } from "react";
import { useOthers, useSelf } from "@/liveblocks.config";
import Avatar from "@/components/ui/Avatar";
import { CheckIcon, CopyIcon } from "@/components/ui/Icons";

export default function TableTab({ roomId }: { roomId: string }) {
  const me = useSelf();
  const others = useOthers();
  const [copied, setCopied] = useState(false);

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
    <div className="space-y-6">
      <section>
        <h2 className="section-title">Einladen</h2>
        <div className="rounded-xl border border-stone-700 bg-stone-950/60 p-4 text-center">
          <div className="text-[11px] uppercase tracking-widest text-stone-500">Tisch-Code</div>
          <div className="mt-1 font-mono text-2xl tracking-wider text-amber-300">{roomId}</div>
          <button onClick={copyInviteLink} className="btn btn-gold mt-3 w-full">
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Link kopiert" : "Einladungslink kopieren"}
          </button>
          <p className="mt-2 text-xs text-stone-500">
            Wer den Link öffnet, sitzt sofort mit am Tisch.
          </p>
        </div>
      </section>

      <section>
        <h2 className="section-title">Am Tisch ({others.length + 1})</h2>
        <ul className="space-y-1">
          <li className="flex items-center gap-3 rounded-lg bg-stone-800/50 px-3 py-2">
            <Avatar name={me.presence.name} color={me.presence.color} role={me.presence.role} />
            <span className="min-w-0 flex-1 truncate text-sm">
              {me.presence.name || "Unbekannt"} <span className="text-stone-500">(Du)</span>
            </span>
            <span
              className={`chip ${
                me.presence.role === "dm"
                  ? "bg-amber-400/15 text-amber-300"
                  : "bg-sky-400/15 text-sky-300"
              }`}
            >
              {me.presence.role === "dm" ? "DM" : "Spieler"}
            </span>
          </li>
          {others.map((other) => (
            <li key={other.connectionId} className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Avatar
                name={other.presence.name}
                color={other.presence.color}
                role={other.presence.role}
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {other.presence.name || "Unbekannt"}
              </span>
              <span
                className={`chip ${
                  other.presence.role === "dm"
                    ? "bg-amber-400/15 text-amber-300"
                    : "bg-sky-400/15 text-sky-300"
                }`}
              >
                {other.presence.role === "dm" ? "DM" : "Spieler"}
              </span>
            </li>
          ))}
        </ul>
        {others.length === 0 && (
          <p className="mt-3 text-xs text-stone-500">
            Noch niemand sonst hier. Teile den Einladungslink mit deiner Gruppe.
          </p>
        )}
      </section>

      <section>
        <h2 className="section-title">Rollen</h2>
        <div className="space-y-2 text-sm text-stone-400">
          <p>
            <span className="chip bg-amber-400/15 text-amber-300">DM</span>{" "}
            bewegt Monster, steuert Karte und Nebel, leitet den Kampf und würfelt verdeckt.
          </p>
          <p>
            <span className="chip bg-sky-400/15 text-sky-300">Spieler</span>{" "}
            bewegen ihre Tokens, würfeln und tragen sich in die Initiative ein.
          </p>
        </div>
      </section>

      <Link href="/dashboard" className="btn w-full">
        Tisch verlassen
      </Link>
    </div>
  );
}
