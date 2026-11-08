"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { LiveObject } from "@liveblocks/client";
import { useMutation, useSelf, useStorage, type CharacterSheet } from "@/liveblocks.config";
import { createBlankSheet, normalizeSheet } from "@/data/sheet";
import { PlusIcon, UploadIcon } from "@/components/ui/Icons";

function SheetCard({
  sheet,
  mine,
  onOpen,
}: {
  sheet: CharacterSheet;
  mine: boolean;
  onOpen: (id: string) => void;
}) {
  const ratio = sheet.hpMax > 0 ? Math.max(0, Math.min(1, sheet.hpCurrent / sheet.hpMax)) : 0;
  const barColor = ratio > 0.5 ? "bg-emerald-500" : ratio > 0.25 ? "bg-amber-500" : "bg-red-500";
  const subtitle = [
    sheet.className && `${sheet.className} ${sheet.level}`,
    sheet.race,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <button
        onClick={() => onOpen(sheet.id)}
        className="w-full rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-left transition hover:border-amber-500/50 hover:bg-stone-900/80"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-amber-200/80 font-bold text-white"
            style={{ backgroundColor: sheet.color }}
          >
            {sheet.name.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{sheet.name || "Unbenannt"}</span>
            <span className="block truncate text-xs text-stone-500">
              {subtitle || `Stufe ${sheet.level}`}
              {!mine && ` · ${sheet.ownerName}`}
            </span>
          </span>
          <span className="text-right text-xs text-stone-400">
            <span className="block font-semibold tabular-nums text-stone-200">
              {sheet.hpCurrent}/{sheet.hpMax}
            </span>
            RK {sheet.ac}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-800">
          <div className={`h-full ${barColor}`} style={{ width: `${ratio * 100}%` }} />
        </div>
      </button>
    </li>
  );
}

export default function SheetsTab({
  ownerKey,
  onOpen,
}: {
  ownerKey: string;
  onOpen: (id: string) => void;
}) {
  const me = useSelf();
  const sheets = useStorage((root) => Array.from(root.sheets?.values() ?? []));
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createSheet = useMutation(({ storage }, sheet: CharacterSheet) => {
    storage.get("sheets").set(sheet.id, new LiveObject(sheet));
  }, []);

  const blank = () =>
    createBlankSheet({
      ownerKey,
      ownerName: me.presence.name || "Unbekannt",
      color: me.presence.color,
    });

  function newSheet() {
    setError(null);
    const sheet = blank();
    createSheet(sheet);
    onOpen(sheet.id);
  }

  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (file.size > 1_000_000) {
      setError("Die Datei ist zu groß (maximal 1 MB).");
      return;
    }

    try {
      const parsed: unknown = JSON.parse(await file.text());
      const raw =
        parsed && typeof parsed === "object" && "sheet" in parsed
          ? (parsed as { sheet: unknown }).sheet
          : parsed;
      const sheet = normalizeSheet(raw, blank());
      if (!sheet) throw new Error("Ungültiges Format");
      createSheet(sheet);
      onOpen(sheet.id);
    } catch {
      setError("Die Datei konnte nicht gelesen werden. Erwartet wird eine Tableforge-JSON-Datei.");
    }
  }

  const mine = sheets.filter((s) => s.ownerKey === ownerKey);
  const others = sheets.filter((s) => s.ownerKey !== ownerKey);

  return (
    <div className="space-y-5">
      <section>
        <h2 className="section-title">Charakterbögen</h2>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={newSheet} className="btn btn-gold">
            <PlusIcon /> Neu erstellen
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn">
            <UploadIcon /> Hochladen
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={importFile}
          className="hidden"
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <p className="mt-2 text-xs text-stone-500">
          Hochladen funktioniert mit Tableforge-Dateien (JSON), die du in einem Bogen über
          „Exportieren“ gespeichert hast. So nimmst du Helden zwischen Tischen mit.
        </p>
      </section>

      <section>
        <h3 className="section-title">Meine Helden ({mine.length})</h3>
        {mine.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-700 p-4 text-center text-sm text-stone-500">
            Du hast noch keinen Helden. Erstelle einen neuen Bogen.
          </p>
        ) : (
          <ul className="space-y-2">
            {mine.map((sheet) => (
              <SheetCard key={sheet.id} sheet={sheet} mine onOpen={onOpen} />
            ))}
          </ul>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h3 className="section-title">Gruppe ({others.length})</h3>
          <ul className="space-y-2">
            {others.map((sheet) => (
              <SheetCard key={sheet.id} sheet={sheet} mine={false} onOpen={onOpen} />
            ))}
          </ul>
          <p className="mt-2 text-xs text-stone-500">
            Bögen anderer kannst du ansehen und würfeln, bearbeiten kann sie nur die Besitzerin
            oder der Besitzer und die DM.
          </p>
        </section>
      )}
    </div>
  );
}
