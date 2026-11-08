"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CrownIcon, XIcon } from "@/components/ui/Icons";
import DmNotes from "@/components/dm/DmNotes";
import DmTools from "@/components/dm/DmTools";
import EncounterPanel from "@/components/dm/EncounterPanel";
import Compendium from "@/components/books/Compendium";

type LeftTab = "notes" | "tools";

function PanelHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-stone-800 bg-stone-950/60 px-3 py-2">
      {children}
    </div>
  );
}

export default function DmScreen({
  roomId,
  selectedId,
  onSelect,
  onClose,
}: {
  roomId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("notes");
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, 260);
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const panelClass =
    "flex min-h-[22rem] flex-col overflow-hidden rounded-xl border border-stone-700/80 bg-stone-950/90 shadow-lg lg:min-h-0";

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-start justify-center p-2 pt-14 sm:p-4 sm:pt-16 ${
        closing ? "dm-closing" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="DM-Schirm"
    >
      <div className="dm-backdrop absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={close} />

      <div className="dm-screen flex max-h-[calc(100dvh-4.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl lg:h-[min(46rem,calc(100dvh-5.5rem))]">
        {/* Kopf */}
        <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300">
              <CrownIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-wide text-amber-100">
                DM-Schirm
              </h2>
              <p className="text-xs text-amber-200/60">Notizen, Begegnung und Nachschlagewerke</p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="DM-Schirm schließen"
            title="Schließen (Esc)"
            className="rounded-lg border border-amber-900/60 bg-stone-950/40 p-2 text-amber-100/80 transition hover:bg-stone-950/70 hover:text-white"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        {/* Drei Schirm-Flügel */}
        <div className="relative z-10 grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 pt-0 lg:grid-cols-[1fr_1.2fr_1fr] lg:overflow-hidden">
          {/* Links: Notizen und Werkzeuge */}
          <section className={`dm-panel-left ${panelClass}`}>
            <PanelHeader>
              <div className="flex gap-1.5">
                {(
                  [
                    ["notes", "Notizen"],
                    ["tools", "Werkzeuge"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setLeftTab(id)}
                    className={`chip border px-3 py-1 text-xs transition ${
                      leftTab === id
                        ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                        : "border-stone-700 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </PanelHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {leftTab === "notes" ? <DmNotes roomId={roomId} /> : <DmTools />}
            </div>
          </section>

          {/* Mitte: Begegnung */}
          <section className={`dm-panel-center ${panelClass}`}>
            <PanelHeader>
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-amber-300">
                Begegnung
              </h3>
            </PanelHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <EncounterPanel selectedId={selectedId} onSelect={onSelect} />
            </div>
          </section>

          {/* Rechts: Bücher */}
          <section className={`dm-panel-right ${panelClass}`}>
            <PanelHeader>
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-amber-300">
                Bücher
              </h3>
            </PanelHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <Compendium roomId={roomId} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
