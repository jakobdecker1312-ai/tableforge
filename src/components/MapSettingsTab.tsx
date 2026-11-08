"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useSelf, useStorage, type MapSettings } from "@/liveblocks.config";
import { GRID_COLS, GRID_ROWS, type FogTool } from "@/lib/map";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";

const MIN_VISION = 1;
const MAX_VISION = 10;

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-amber-500"
      />
      {children}
    </label>
  );
}

export default function MapSettingsTab({
  fogTool,
  onFogToolChange,
  brush,
  onBrushChange,
}: {
  fogTool: FogTool;
  onFogToolChange: (tool: FogTool) => void;
  brush: 1 | 3;
  onBrushChange: (brush: 1 | 3) => void;
}) {
  const me = useSelf();
  const isDM = me.presence.role === "dm";

  const backgroundUrl = useStorage((root) => root.settings.backgroundUrl);
  const showGrid = useStorage((root) => root.settings.showGrid);
  const fineGrid = useStorage((root) => root.settings.fineGrid ?? false);
  const tableSeats = useStorage((root) => root.settings.tableSeats ?? 8);
  const mood = useStorage((root) => root.settings.mood ?? "none");
  const fogEnabled = useStorage((root) => root.settings.fogEnabled);
  const dynamicVision = useStorage((root) => root.settings.dynamicVision);
  const rememberExplored = useStorage((root) => root.settings.rememberExplored);
  const visionRadius = useStorage((root) => root.settings.visionRadius);

  const [bgInput, setBgInput] = useState("");
  const [bgError, setBgError] = useState<string | null>(null);

  const setSetting = useMutation(({ storage }, patch: Partial<MapSettings>) => {
    storage.get("settings").update(patch);
  }, []);

  const revealAllFog = useMutation(({ storage }) => {
    const fog = storage.get("fog");
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const key = `${c},${r}`;
        if (!fog.has(key)) fog.set(key, true);
      }
    }
  }, []);

  const hideAllFog = useMutation(({ storage }) => {
    const map = storage.get("fog");
    for (const key of Array.from(map.keys())) map.delete(key);
  }, []);

  function applyBackground() {
    const url = bgInput.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setBgError("Bitte eine gültige http(s)-URL zu einem Bild eingeben.");
      return;
    }
    setBgError(null);
    setSetting({ backgroundUrl: url });
  }

  function removeBackground() {
    setBgInput("");
    setBgError(null);
    setSetting({ backgroundUrl: "" });
  }

  if (!isDM) {
    return (
      <div className="space-y-4">
        <h2 className="section-title">Karte</h2>
        <p className="rounded-lg border border-stone-800 bg-stone-950/60 p-3 text-sm text-stone-400">
          Hintergrund, Raster und Nebel steuert die DM. Wechsle oben auf{" "}
          <span className="text-amber-300">DM</span>, wenn du diesen Tisch leitest.
        </p>
        <ul className="space-y-2 text-sm text-stone-400">
          <li>
            <span className="text-stone-200">Zoom:</span> Mausrad oder +/− auf der Karte
          </li>
          <li>
            <span className="text-stone-200">Verschieben:</span> Hintergrund ziehen
          </li>
          <li>
            <span className="text-stone-200">Token bewegen:</span> Token anklicken und ziehen
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hintergrund */}
      <section>
        <h2 className="section-title">Hintergrundbild</h2>
        <input
          value={bgInput}
          onChange={(e) => {
            setBgInput(e.target.value);
            setBgError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && applyBackground()}
          placeholder="https://… (direkter Bildlink)"
          className="field"
        />
        {bgError && <p className="mt-2 text-xs text-red-400">{bgError}</p>}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={applyBackground} className="btn btn-gold">
            Setzen
          </button>
          <button onClick={removeBackground} disabled={backgroundUrl === ""} className="btn">
            Entfernen
          </button>
        </div>
        <div className="mt-3">
          <Toggle checked={showGrid} onChange={(value) => setSetting({ showGrid: value })}>
            Raster anzeigen
          </Toggle>
        </div>
        <div className="mt-2">
          <Toggle checked={fineGrid} onChange={(value) => setSetting({ fineGrid: value })}>
            Feines Raster beim Hineinzoomen (Halbfelder)
          </Toggle>
        </div>
      </section>

      {/* Stimmung */}
      <section>
        <h2 className="section-title">Stimmung</h2>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["none", "Neutral"],
              ["tavern", "🍺 Taverne"],
              ["dungeon", "🕯️ Dungeon"],
              ["storm", "⛈️ Sturm"],
              ["battle", "⚔️ Kampf"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSetting({ mood: id })}
              className={`btn btn-sm ${mood === id ? "btn-gold" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-stone-500">
          Ändert Licht und Effekte für alle. Den Ton schaltet jede Person selbst über den Knopf
          oben rechts an.
        </p>
      </section>

      {/* Tisch */}
      <section>
        <h2 className="section-title">Tisch</h2>
        <div className="flex gap-2">
          {([4, 8] as const).map((n) => (
            <button
              key={n}
              onClick={() => setSetting({ tableSeats: n })}
              className={`btn flex-1 ${tableSeats === n ? "btn-gold" : ""}`}
            >
              {n} Plätze
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-stone-500">
          Gilt für die Tischansicht. Wer auf einem wegfallenden Platz sitzt, steht auf.
        </p>
      </section>

      {/* Nebel */}
      <section>
        <h2 className="section-title">Nebel des Krieges</h2>
        <Toggle
          checked={fogEnabled}
          onChange={(value) => {
            setSetting({ fogEnabled: value });
            if (!value) onFogToolChange("off");
          }}
        >
          Nebel aktivieren
        </Toggle>

        {fogEnabled && (
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1.5 text-xs text-stone-500">Werkzeug auf der Karte</div>
              <div
                role="group"
                aria-label="Nebel-Werkzeug"
                className="grid grid-cols-3 overflow-hidden rounded-lg border border-stone-700 text-xs"
              >
                {(
                  [
                    ["off", "Aus"],
                    ["reveal", "Aufdecken"],
                    ["hide", "Verdecken"],
                  ] as const
                ).map(([tool, label]) => (
                  <button
                    key={tool}
                    onClick={() => onFogToolChange(tool)}
                    className={`px-2 py-2 transition ${
                      fogTool === tool
                        ? "bg-amber-500 font-semibold text-stone-900"
                        : "bg-stone-900 text-stone-400 hover:text-stone-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-sm text-stone-400">
              Pinselgröße
              <div className="flex overflow-hidden rounded-lg border border-stone-700">
                {([1, 3] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => onBrushChange(b)}
                    className={`px-3 py-1.5 text-xs transition ${
                      brush === b
                        ? "bg-stone-700 text-white"
                        : "bg-stone-900 hover:text-stone-100"
                    }`}
                  >
                    {b}×{b}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => revealAllFog()} className="btn btn-sm">
                Alles aufdecken
              </button>
              <button onClick={() => hideAllFog()} className="btn btn-sm">
                Alles verdecken
              </button>
            </div>

            {/* Dynamische Sicht */}
            <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-950/60 p-3">
              <Toggle
                checked={dynamicVision}
                onChange={(value) => setSetting({ dynamicVision: value })}
              >
                Dynamische Sicht
              </Toggle>

              {dynamicVision && (
                <>
                  <div className="flex items-center justify-between gap-2 text-sm text-stone-400">
                    Sichtweite (Felder)
                    <div className="flex items-center overflow-hidden rounded-lg border border-stone-700">
                      <button
                        onClick={() =>
                          setSetting({ visionRadius: Math.max(MIN_VISION, visionRadius - 1) })
                        }
                        disabled={visionRadius <= MIN_VISION}
                        aria-label="Sichtweite verringern"
                        className="flex h-8 w-8 items-center justify-center bg-stone-900 text-stone-300 transition hover:bg-stone-800 disabled:opacity-30"
                      >
                        <MinusIcon />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums text-stone-100">
                        {visionRadius}
                      </span>
                      <button
                        onClick={() =>
                          setSetting({ visionRadius: Math.min(MAX_VISION, visionRadius + 1) })
                        }
                        disabled={visionRadius >= MAX_VISION}
                        aria-label="Sichtweite erhöhen"
                        className="flex h-8 w-8 items-center justify-center bg-stone-900 text-stone-300 transition hover:bg-stone-800 disabled:opacity-30"
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>

                  <Toggle
                    checked={rememberExplored}
                    onChange={(value) => setSetting({ rememberExplored: value })}
                  >
                    Erkundetes bleibt aufgedeckt
                  </Toggle>
                </>
              )}

              <p className="text-xs text-stone-500">
                Spieler-Tokens decken den Nebel im Umkreis auf. Wände blockieren die Sicht nicht.
              </p>
            </div>

            <p className="text-xs text-stone-500">
              Du siehst den Nebel halbtransparent, Spieler sehen ihn komplett schwarz. Monster
              in verdeckten Feldern sind für Spieler unsichtbar.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
