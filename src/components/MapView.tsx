"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  useMutation,
  useOthers,
  useStorage,
  useUpdateMyPresence,
  type Token,
} from "@/liveblocks.config";
import {
  clamp,
  clampView,
  exploreAround,
  GRID_COLS,
  GRID_ROWS,
  initials,
  MAX_SCALE,
  MIN_SCALE,
  TOKEN_SIZES,
  zoomAt,
  type FogTool,
  type View,
} from "@/lib/map";
import { useVision } from "@/lib/useVision";
import { useTokenActions } from "@/lib/useTokenActions";
import { conditionById } from "@/data/conditions";
import { MinusIcon, PlusIcon, ShieldIcon, TrashIcon, XIcon } from "@/components/ui/Icons";

function RemoteCursor({
  left,
  top,
  name,
  color,
}: {
  left: string;
  top: string;
  name: string;
  color: string;
}) {
  return (
    <div
      className="pointer-events-none absolute z-40 transition-[left,top] duration-75 ease-linear"
      style={{ left, top }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="drop-shadow"
      >
        <path d="M5.5 3.2 L5.5 19 L9.7 15.2 L12.4 21 L14.6 20 L11.9 14.3 L17.5 14.3 Z" />
      </svg>
      <span
        className="absolute left-4 top-4 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-white shadow"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

export default function MapView({
  selectedId,
  onSelect,
  fogTool,
  brush,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  fogTool: FogTool;
  brush: 1 | 3;
}) {
  const others = useOthers();
  const updatePresence = useUpdateMyPresence();
  const { isDM, visibleTokens, clearSet, fogEnabled } = useVision();

  const backgroundUrl = useStorage((root) => root.settings.backgroundUrl);
  const showGrid = useStorage((root) => root.settings.showGrid);
  const fineGrid = useStorage((root) => root.settings.fineGrid ?? false);
  const turn = useStorage((root) => {
    const combat = root.combat;
    if (!combat.active) return null;
    const entry = combat.currentId ? root.initiative.get(combat.currentId) : undefined;
    return {
      round: combat.round,
      name: entry?.name ?? null,
      hidden: entry?.hidden ?? false,
      tokenId: entry?.tokenId ?? null,
    };
  });

  const hideTurnDetail = Boolean(turn?.hidden) && !isDM;
  const activeTokenId = hideTurnDetail ? null : (turn?.tokenId ?? null);

  const mapRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null
  );
  const paintingRef = useRef(false);
  const lastCellRef = useRef<string | null>(null);

  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const fogPaintActive = isDM && fogEnabled && fogTool !== "off";
  const imageVisible = backgroundUrl !== "" && failedUrl !== backgroundUrl;
  const imageFailed = backgroundUrl !== "" && failedUrl === backgroundUrl;
  const gridAlpha = imageVisible ? 0.2 : 0.08;

  // Zoom per Mausrad (nativer Listener, damit die Seite nicht mitscrollt).
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);
      setView((v) => zoomAt(v, factor, px, py, rect.width, rect.height));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /** Ein einziger Pfad aus allen verdeckten Feldern (keine Nähte zwischen Feldern). */
  const fogPath = useMemo(() => {
    let d = "";
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!clearSet.has(`${c},${r}`)) d += `M${c} ${r}h1v1h-1z`;
      }
    }
    return d;
  }, [clearSet]);

  // ---------- Storage-Mutationen ----------

  const moveToken = useMutation(({ storage }, id: string, x: number, y: number) => {
    const token = storage.get("tokens").get(id);
    if (!token) return;
    token.update({ x, y });
    if (!token.get("isMonster")) {
      exploreAround(storage.get("settings"), storage.get("fog"), x, y);
    }
  }, []);

  const resizeToken = useMutation(({ storage }, id: string, size: number) => {
    storage.get("tokens").get(id)?.set("size", size);
  }, []);

  const { removeToken, changeHp } = useTokenActions();

  const paintFog = useMutation(({ storage }, cells: string[], reveal: boolean) => {
    const fog = storage.get("fog");
    for (const key of cells) {
      if (reveal) {
        if (!fog.has(key)) fog.set(key, true);
      } else {
        fog.delete(key);
      }
    }
  }, []);

  // ---------- Hilfsfunktionen ----------

  const canMove = (token: Token) => isDM || !token.isMonster;

  /** Bildschirmposition -> Map-Koordinaten (0–1), unabhängig von Zoom/Verschiebung. */
  function toWorld(clientX: number, clientY: number) {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: (clientX - rect.left - view.x) / (rect.width * view.scale),
      y: (clientY - rect.top - view.y) / (rect.height * view.scale),
    };
  }

  function zoomBy(factor: number) {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setView((v) => zoomAt(v, factor, rect.width / 2, rect.height / 2, rect.width, rect.height));
  }

  function paintAt(clientX: number, clientY: number) {
    const world = toWorld(clientX, clientY);
    if (!world) return;
    const col = Math.floor(world.x * GRID_COLS);
    const row = Math.floor(world.y * GRID_ROWS);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;

    const centerKey = `${col},${row}`;
    if (lastCellRef.current === centerKey) return;
    lastCellRef.current = centerKey;

    const radius = Math.floor(brush / 2);
    const cells: string[] = [];
    for (let dc = -radius; dc <= radius; dc++) {
      for (let dr = -radius; dr <= radius; dr++) {
        const c = col + dc;
        const r = row + dr;
        if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) cells.push(`${c},${r}`);
      }
    }
    paintFog(cells, fogTool === "reveal");
  }

  // ---------- Map-Interaktion (Pan, Fog, Cursor) ----------

  function handleMapPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (fogPaintActive) {
      paintingRef.current = true;
      lastCellRef.current = null;
      paintAt(e.clientX, e.clientY);
      return;
    }
    onSelect(null);
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: view.x,
      originY: view.y,
    };
  }

  function handleMapPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const world = toWorld(e.clientX, e.clientY);
    if (world) {
      updatePresence({
        cursor: { x: clamp(world.x, 0, 1), y: clamp(world.y, 0, 1) },
      });
    }

    if (paintingRef.current) {
      paintAt(e.clientX, e.clientY);
      return;
    }

    const pan = panRef.current;
    const rect = mapRef.current?.getBoundingClientRect();
    if (pan && rect) {
      const x = pan.originX + (e.clientX - pan.startX);
      const y = pan.originY + (e.clientY - pan.startY);
      setView((v) => clampView({ ...v, x, y }, rect.width, rect.height));
    }
  }

  function handleMapPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    paintingRef.current = false;
    lastCellRef.current = null;
    panRef.current = null;
  }

  function handleMapPointerLeave() {
    updatePresence({ cursor: null });
  }

  // ---------- Token Drag & Drop ----------

  function handleTokenPointerDown(e: ReactPointerEvent<HTMLDivElement>, token: Token) {
    e.stopPropagation();
    onSelect(token.id);
    if (!canMove(token)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingId(token.id);
  }

  function handleTokenPointerMove(e: ReactPointerEvent<HTMLDivElement>, token: Token) {
    if (draggingId !== token.id) return;
    const world = toWorld(e.clientX, e.clientY);
    if (!world) return;
    moveToken(token.id, clamp(world.x), clamp(world.y));
  }

  function handleTokenPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDraggingId(null);
  }

  const selected = visibleTokens.find((t) => t.id === selectedId);

  return (
    <div
      ref={mapRef}
      onPointerDown={handleMapPointerDown}
      onPointerMove={handleMapPointerMove}
      onPointerUp={handleMapPointerEnd}
      onPointerCancel={handleMapPointerEnd}
      onPointerLeave={handleMapPointerLeave}
      className="relative aspect-[5/3] touch-none select-none overflow-hidden rounded-2xl border-2 border-amber-900/70 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_24px_60px_rgba(0,0,0,0.6)]"
      style={{
        width: "min(100%, calc((100dvh - 6.25rem) * 5 / 3))",
        background: "radial-gradient(ellipse at 50% 40%, #2b2622 0%, #1c1917 60%, #12100f 100%)",
        cursor: fogPaintActive ? "crosshair" : view.scale > 1 ? "grab" : "default",
      }}
    >
      {/* Welt-Ebene: wird gezoomt und verschoben */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          containerType: "inline-size",
        }}
      >
        {imageVisible && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={backgroundUrl}
            src={backgroundUrl}
            alt=""
            draggable={false}
            onError={() => setFailedUrl(backgroundUrl)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        )}

        {showGrid && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,${gridAlpha}) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,${gridAlpha}) 1px, transparent 1px)`,
              backgroundSize: `${100 / GRID_COLS}% ${100 / GRID_ROWS}%`,
            }}
          />
        )}

        {showGrid && fineGrid && view.scale >= 1.8 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: `${50 / GRID_COLS}% ${50 / GRID_ROWS}%`,
            }}
          />
        )}

        {/* Nebel des Krieges */}
        {fogEnabled && (
          <svg
            viewBox={`0 0 ${GRID_COLS} ${GRID_ROWS}`}
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <path d={fogPath} fill="#0c0a09" fillOpacity={isDM ? 0.6 : 1} />
          </svg>
        )}

        {/* Tokens */}
        {visibleTokens.map((token) => {
          const size = token.size ?? 1;
          const movable = canMove(token);
          const isSelected = token.id === selectedId;
          const isDragging = token.id === draggingId;
          const isTurn = token.id === activeTokenId;
          const showHp =
            token.maxHp !== undefined && token.maxHp > 0 && (isDM || !token.isMonster);
          const hpPct = showHp
            ? Math.max(0, Math.min(1, (token.hp ?? token.maxHp ?? 0) / (token.maxHp ?? 1)))
            : 0;
          const downed = token.maxHp !== undefined && (token.hp ?? token.maxHp) <= 0;
          const conditions = token.conditions ?? [];
          return (
            <div
              key={token.id}
              onPointerDown={(e) => handleTokenPointerDown(e, token)}
              onPointerMove={(e) => handleTokenPointerMove(e, token)}
              onPointerUp={handleTokenPointerEnd}
              onPointerCancel={handleTokenPointerEnd}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${token.x * 100}%`,
                top: `${token.y * 100}%`,
                width: `${(size * 100) / GRID_COLS}%`,
                minWidth: "1.75rem",
                zIndex: isDragging ? 30 : isSelected ? 20 : 10,
                pointerEvents: fogPaintActive ? "none" : "auto",
                cursor: movable ? (isDragging ? "grabbing" : "grab") : "default",
              }}
            >
              <div
                className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border-2 font-bold text-white transition-transform ${
                  token.isMonster ? "border-red-300/90" : "border-amber-200/90"
                } ${
                  isSelected
                    ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-900"
                    : isTurn
                      ? "animate-pulse ring-4 ring-emerald-400"
                      : ""
                } ${isDragging ? "scale-105" : ""} ${downed ? "opacity-50 grayscale" : ""}`}
                style={{
                  backgroundColor: token.color,
                  backgroundImage:
                    "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.38), rgba(255,255,255,0) 55%), radial-gradient(circle at 70% 85%, rgba(0,0,0,0.35), rgba(0,0,0,0) 60%)",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.55)",
                  fontSize: `max(10px, ${size * 2}cqw)`,
                }}
              >
                {token.isMonster ? "☠" : initials(token.name)}
              </div>
              {conditions.length > 0 && (
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-0.5 flex -translate-x-1/2 gap-0.5">
                  {conditions.slice(0, 4).map((id) => {
                    const info = conditionById(id);
                    if (!info) return null;
                    return (
                      <span
                        key={id}
                        title={info.name}
                        className="flex h-4 min-w-4 items-center justify-center rounded-full border border-stone-900/60 px-0.5 text-[8px] font-bold text-stone-900 shadow"
                        style={{ backgroundColor: info.color }}
                      >
                        {info.short}
                      </span>
                    );
                  })}
                  {conditions.length > 4 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-700 px-0.5 text-[8px] font-bold text-stone-100">
                      +{conditions.length - 4}
                    </span>
                  )}
                </div>
              )}
              {showHp && (
                <div className="pointer-events-none absolute left-0 right-0 top-full mt-0.5 h-1.5 overflow-hidden rounded-full border border-black/40 bg-black/60">
                  <div
                    className={`h-full ${
                      hpPct > 0.5 ? "bg-emerald-500" : hpPct > 0.25 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${hpPct * 100}%` }}
                  />
                </div>
              )}
              <span
                className={`absolute left-1/2 top-full ${
                  showHp ? "mt-2.5" : "mt-1"
                } max-w-28 -translate-x-1/2 truncate rounded-md border border-stone-700/80 bg-stone-950/85 px-1.5 py-0.5 text-[11px] font-medium text-stone-100 shadow`}
              >
                {token.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Leerer Tisch */}
      {visibleTokens.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-stone-500">
          Noch keine Tokens. Füge im Tab „Tokens“ deinen Helden hinzu.
        </div>
      )}

      {/* Cursor der anderen (außerhalb der Welt-Ebene, damit sie nicht mitskalieren) */}
      {others.map((other) =>
        other.presence.cursor ? (
          <RemoteCursor
            key={`cursor-${other.connectionId}`}
            left={`calc(${other.presence.cursor.x * view.scale * 100}% + ${view.x}px)`}
            top={`calc(${other.presence.cursor.y * view.scale * 100}% + ${view.y}px)`}
            name={other.presence.name || "Unbekannt"}
            color={other.presence.color}
          />
        ) : null
      )}

      {/* Oben links: Hinweise */}
      <div className="pointer-events-none absolute left-3 top-3 z-50 flex flex-col items-start gap-2">
        {fogPaintActive && (
          <span className="chip border border-amber-500/40 bg-stone-950/85 text-amber-200 backdrop-blur">
            Nebel: {fogTool === "reveal" ? "Aufdecken" : "Verdecken"} · {brush}×{brush}
          </span>
        )}
        {imageFailed && (
          <span className="chip border border-red-500/40 bg-stone-950/85 text-red-300 backdrop-blur">
            Hintergrundbild konnte nicht geladen werden
          </span>
        )}
      </div>

      {/* Oben Mitte: Kampfstatus */}
      {turn && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-50 -translate-x-1/2">
          <span className="chip max-w-[70vw] gap-1.5 truncate border border-emerald-500/40 bg-stone-950/85 px-3 py-1 text-xs text-emerald-200 backdrop-blur">
            <ShieldIcon className="h-3.5 w-3.5" />
            Runde {turn.round}
            {turn.name && !hideTurnDetail ? ` · ${turn.name} ist am Zug` : ""}
          </span>
        </div>
      )}

      {/* Oben rechts: Zoom */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-3 top-3 z-50 flex items-center rounded-lg border border-stone-700 bg-stone-950/85 text-sm backdrop-blur"
      >
        <button
          onClick={() => zoomBy(1 / 1.25)}
          disabled={view.scale <= MIN_SCALE}
          aria-label="Verkleinern"
          className="flex h-8 w-8 items-center justify-center text-stone-300 transition hover:text-white disabled:opacity-30"
        >
          <MinusIcon />
        </button>
        <button
          onClick={() => setView({ scale: 1, x: 0, y: 0 })}
          title="Ansicht zurücksetzen"
          className="w-12 text-xs tabular-nums text-stone-300 transition hover:text-white"
        >
          {Math.round(view.scale * 100)}%
        </button>
        <button
          onClick={() => zoomBy(1.25)}
          disabled={view.scale >= MAX_SCALE}
          aria-label="Vergrößern"
          className="flex h-8 w-8 items-center justify-center text-stone-300 transition hover:text-white disabled:opacity-30"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Unten links: Bedienhinweis */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-50 hidden rounded-md bg-stone-950/70 px-2 py-1 text-[11px] text-stone-400 backdrop-blur sm:block">
        Mausrad: Zoom · Ziehen: Verschieben
      </div>

      {/* Unten Mitte: Token-Werkzeugleiste */}
      {selected && canMove(selected) && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-1/2 z-50 flex max-w-[95%] -translate-x-1/2 items-center gap-2 rounded-xl border border-stone-700 bg-stone-950/90 px-2.5 py-1.5 shadow-lg backdrop-blur"
        >
          <span className="max-w-24 truncate text-xs font-medium text-stone-100">
            {selected.name}
          </span>
          {selected.maxHp !== undefined && selected.maxHp > 0 && (
            <div className="flex items-center overflow-hidden rounded-lg border border-stone-700">
              <button
                onClick={() => changeHp(selected.id, -1)}
                aria-label="1 Schaden"
                title="1 Schaden"
                className="flex h-7 w-7 items-center justify-center bg-stone-900 text-stone-300 transition hover:text-red-300"
              >
                <MinusIcon className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 text-xs tabular-nums text-stone-100">
                {selected.hp ?? selected.maxHp}/{selected.maxHp}
              </span>
              <button
                onClick={() => changeHp(selected.id, 1)}
                aria-label="1 heilen"
                title="1 heilen"
                className="flex h-7 w-7 items-center justify-center bg-stone-900 text-stone-300 transition hover:text-emerald-300"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex overflow-hidden rounded-lg border border-stone-700">
            {TOKEN_SIZES.map((s) => (
              <button
                key={s.value}
                title={`Größe: ${s.label}`}
                onClick={() => resizeToken(selected.id, s.value)}
                className={`h-7 w-7 text-xs font-semibold transition ${
                  (selected.size ?? 1) === s.value
                    ? "bg-amber-500 text-stone-900"
                    : "bg-stone-900 text-stone-400 hover:text-stone-100"
                }`}
              >
                {s.short}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              removeToken(selected.id);
              onSelect(null);
            }}
            title="Token entfernen"
            aria-label="Token entfernen"
            className="btn btn-danger btn-sm"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onSelect(null)}
            title="Auswahl aufheben"
            aria-label="Auswahl aufheben"
            className="text-stone-400 transition hover:text-white"
          >
            <XIcon />
          </button>
        </div>
      )}
    </div>
  );
}
