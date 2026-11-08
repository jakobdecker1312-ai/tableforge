"use client";

import { v4 as uuid } from "uuid";
import { useState } from "react";
import { useLocalState } from "@/lib/useLocalState";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";

type NotePage = { id: string; title: string; body: string };

function defaultPages(): NotePage[] {
  return [{ id: uuid(), title: "Sitzung", body: "" }];
}

/** Private Notizen der DM, nur im Browser dieses Geräts gespeichert. */
export default function DmNotes({ roomId }: { roomId: string }) {
  const [pages, setPages] = useLocalState<NotePage[]>(
    `tableforge:dm-notes:${roomId}`,
    defaultPages()
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = pages.find((p) => p.id === activeId) ?? pages[0];

  function patch(id: string, update: Partial<NotePage>) {
    setPages((list) => list.map((p) => (p.id === id ? { ...p, ...update } : p)));
  }

  function addPage() {
    const page: NotePage = { id: uuid(), title: `Notiz ${pages.length + 1}`, body: "" };
    setPages((list) => [...list, page]);
    setActiveId(page.id);
  }

  function removePage(id: string) {
    if (pages.length <= 1) return;
    if (!window.confirm("Diese Seite löschen?")) return;
    setPages((list) => list.filter((p) => p.id !== id));
    setActiveId(null);
  }

  if (!active) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActiveId(page.id)}
            className={`chip shrink-0 border px-3 py-1 text-xs transition ${
              page.id === active.id
                ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                : "border-stone-700 text-stone-400 hover:text-stone-200"
            }`}
          >
            {page.title || "Ohne Titel"}
          </button>
        ))}
        <button
          onClick={addPage}
          aria-label="Neue Seite"
          title="Neue Seite"
          className="shrink-0 rounded-full border border-stone-700 p-1 text-stone-400 transition hover:text-amber-300"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={active.title}
          maxLength={40}
          onChange={(e) => patch(active.id, { title: e.target.value })}
          aria-label="Titel der Seite"
          className="field font-display font-bold"
        />
        {pages.length > 1 && (
          <button
            onClick={() => removePage(active.id)}
            aria-label="Seite löschen"
            title="Seite löschen"
            className="rounded p-1.5 text-stone-500 transition hover:bg-stone-800 hover:text-red-300"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      <textarea
        value={active.body}
        onChange={(e) => patch(active.id, { body: e.target.value })}
        placeholder="Handlung, Orte, Geheimnisse, Hinweise für die nächste Szene …"
        aria-label="Notizen"
        className="field min-h-[12rem] flex-1 resize-none leading-relaxed"
      />

      <p className="text-[11px] text-stone-500">
        Wird automatisch gespeichert, nur auf diesem Gerät. Deine Spieler sehen das nicht.
      </p>
    </div>
  );
}
