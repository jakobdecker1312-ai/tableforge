"use client";

import Link from "next/link";
import SiteNav from "@/components/ui/SiteNav";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { v4 as uuid } from "uuid";
import { getRecentRooms, removeRecentRoom, type RecentRoom } from "@/lib/recentRooms";
import { PlusIcon, UsersIcon, XIcon } from "@/components/ui/Icons";

const CODE_PATTERN = /^[a-z0-9-]{3,40}$/;

/** Akzeptiert sowohl einen Code als auch einen kompletten Einladungslink. */
function extractRoomCode(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const match = trimmed.match(/\/room\/([a-z0-9-]+)/);
  return match ? match[1] : trimmed;
}

function formatVisited(timestamp: number): string {
  return new Date(timestamp).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [joinInput, setJoinInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentRoom[]>([]);

  useEffect(() => {
    setRecent(getRecentRooms());
  }, []);

  function createRoom() {
    const code = uuid().slice(0, 8);
    router.push(`/room/${code}`);
  }

  function joinRoom(e: FormEvent) {
    e.preventDefault();
    const code = extractRoomCode(joinInput);
    if (!CODE_PATTERN.test(code)) {
      setError("Bitte gib einen gültigen Tisch-Code oder Einladungslink ein.");
      return;
    }
    setError(null);
    router.push(`/room/${code}`);
  }

  function forget(code: string) {
    removeRecentRoom(code);
    setRecent(getRecentRooms());
  }

  return (
    <div className="min-h-screen">
    <SiteNav active="/dashboard" />
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif-hero text-4xl font-medium sm:text-5xl">
        Willkommen am Tisch
      </h1>
      <p className="mt-2 font-fell text-lg text-stone-300">
        Starte einen neuen Tisch oder tritt einem bestehenden bei.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="panel ornate flex flex-col rounded-2xl p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <PlusIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold tracking-wide">
            Neuen Tisch erstellen
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-400">
            Du bekommst einen eigenen Tisch mit Code. Teile den Link mit deiner Gruppe und
            wechsle im Tisch oben rechts auf die DM-Rolle.
          </p>
          <button onClick={createRoom} className="btn btn-gold mt-6 py-3 text-base">
            Tisch erstellen
          </button>
        </section>

        <section className="panel ornate rounded-2xl p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300">
            <UsersIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold tracking-wide">Tisch beitreten</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Gib den Tisch-Code oder den kompletten Einladungslink ein.
          </p>
          <form onSubmit={joinRoom} className="mt-6 flex flex-col gap-3">
            <input
              value={joinInput}
              onChange={(e) => {
                setJoinInput(e.target.value);
                setError(null);
              }}
              placeholder="z. B. 3f9a1c2d"
              className="field py-3"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn py-3 text-base">
              Beitreten
            </button>
          </form>
        </section>
      </div>

      {recent.length > 0 && (
        <section id="zuletzt" className="mt-10 scroll-mt-20">
          <h2 className="section-title">Zuletzt besucht</h2>
          <ul className="space-y-2">
            {recent.map((room) => (
              <li
                key={room.code}
                className="panel flex items-center gap-3 rounded-xl px-4 py-3"
              >
                <Link
                  href={`/room/${room.code}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 transition hover:text-amber-300"
                >
                  <span className="font-mono text-base">{room.code}</span>
                  <span className="text-xs text-stone-500">{formatVisited(room.lastVisited)}</span>
                </Link>
                <button
                  onClick={() => forget(room.code)}
                  aria-label="Aus der Liste entfernen"
                  title="Aus der Liste entfernen"
                  className="rounded p-1.5 text-stone-500 transition hover:bg-stone-800 hover:text-red-300"
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
    </div>
  );
}
