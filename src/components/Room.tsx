"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { LiveMap, type LiveObject } from "@liveblocks/client";
import { useMutation, useSelf, useStorage, type CharacterSheet } from "@/liveblocks.config";
import { saveIdentity } from "@/lib/identity";
import { getOwnerKey } from "@/lib/owner";
import { saveRecentRoom } from "@/lib/recentRooms";
import type { FogTool } from "@/lib/map";
import TopBar from "@/components/TopBar";
import MapView from "@/components/MapView";
import TokensTab from "@/components/TokensTab";
import InitiativeTracker from "@/components/InitiativeTracker";
import DiceLog from "@/components/DiceLog";
import MapSettingsTab from "@/components/MapSettingsTab";
import TableTab from "@/components/TableTab";
import TableScene from "@/components/TableScene";
import MoodLayer from "@/components/MoodLayer";
import Compendium from "@/components/books/Compendium";
import SheetsTab from "@/components/sheets/SheetsTab";
import CharacterSheetModal from "@/components/sheets/CharacterSheetModal";
import DmScreen from "@/components/dm/DmScreen";
import {
  BookIcon,
  DiceIcon,
  MapIcon,
  ScrollIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/Icons";

type TabId = "tokens" | "combat" | "dice" | "books" | "sheets" | "map" | "table";
type Overlay = { kind: "dm" } | { kind: "sheet"; id: string } | null;

const TABS: { id: TabId; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: "tokens", label: "Tokens", Icon: UserIcon },
  { id: "combat", label: "Kampf", Icon: ShieldIcon },
  { id: "dice", label: "Würfel", Icon: DiceIcon },
  { id: "books", label: "Bücher", Icon: BookIcon },
  { id: "sheets", label: "Helden", Icon: ScrollIcon },
  { id: "map", label: "Karte", Icon: MapIcon },
  { id: "table", label: "Tisch", Icon: UsersIcon },
];

export default function Room({ roomId }: { roomId: string }) {
  const me = useSelf();
  const combatActive = useStorage((root) => root.combat.active);

  const [tab, setTab] = useState<TabId>("tokens");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fogTool, setFogTool] = useState<FogTool>("off");
  const [brush, setBrush] = useState<1 | 3>(1);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [tableView, setTableView] = useState(true);
  const [ownerKey] = useState(() => getOwnerKey());

  const { name, color, role } = me.presence;

  // Ältere Tische kennen die Charakterbögen noch nicht: einmalig anlegen.
  const ensureSheets = useMutation(({ storage }) => {
    if (!storage.get("sheets")) {
      storage.set("sheets", new LiveMap<string, LiveObject<CharacterSheet>>());
    }
  }, []);

  useEffect(() => {
    ensureSheets();
  }, [ensureSheets]);

  // Identität und zuletzt besuchten Tisch lokal merken.
  useEffect(() => {
    saveIdentity({ name, color, role });
  }, [name, color, role]);

  // Auf kleinen Bildschirmen startet die Vollbild-Karte.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setTableView(false);
  }, []);

  useEffect(() => {
    saveRecentRoom(roomId);
  }, [roomId]);

  return (
    <div className="flex min-h-screen flex-col lg:h-dvh lg:overflow-hidden">
      <TopBar roomId={roomId} onOpenDmScreen={() => setOverlay({ kind: "dm" })} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        {/* Karte */}
        <main className="relative flex min-w-0 flex-1 items-start justify-center lg:items-center">
          <button
            onClick={() => setTableView((v) => !v)}
            className="btn btn-sm absolute left-2 top-2 z-30"
            title="Zwischen Tisch und Vollbild-Karte wechseln"
          >
            {tableView ? "🗺️ Vollbild-Karte" : "🪑 Tischansicht"}
          </button>
          {(() => {
            const map = (
              <MapView
                selectedId={selectedId}
                onSelect={setSelectedId}
                fogTool={fogTool}
                brush={brush}
              />
            );
            return tableView ? <TableScene>{map}</TableScene> : map;
          })()}
          <MoodLayer />
        </main>

        {/* Seitenpanel mit Tabs */}
        <aside className="panel flex min-h-[28rem] w-full flex-col overflow-hidden rounded-2xl lg:min-h-0 lg:w-[22rem] xl:w-[24rem]">
          <nav className="grid grid-cols-7 border-b border-stone-800 bg-stone-950/40" role="tablist">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  className={`relative flex flex-col items-center gap-1 border-b-2 px-0.5 py-2.5 text-[10px] font-medium transition ${
                    active
                      ? "border-amber-400 bg-amber-400/5 text-amber-300"
                      : "border-transparent text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                  {id === "combat" && combatActive && (
                    <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Alle Tabs bleiben eingehängt, damit Eingaben beim Wechseln erhalten bleiben. */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div role="tabpanel" className={tab === "tokens" ? "" : "hidden"}>
              <TokensTab selectedId={selectedId} onSelect={setSelectedId} />
            </div>
            <div role="tabpanel" className={tab === "combat" ? "" : "hidden"}>
              <InitiativeTracker />
            </div>
            <div role="tabpanel" className={tab === "dice" ? "" : "hidden"}>
              <DiceLog />
            </div>
            <div role="tabpanel" className={tab === "books" ? "" : "hidden"}>
              <Compendium roomId={roomId} />
            </div>
            <div role="tabpanel" className={tab === "sheets" ? "" : "hidden"}>
              <SheetsTab
                ownerKey={ownerKey}
                onOpen={(id) => setOverlay({ kind: "sheet", id })}
              />
            </div>
            <div role="tabpanel" className={tab === "map" ? "" : "hidden"}>
              <MapSettingsTab
                fogTool={fogTool}
                onFogToolChange={setFogTool}
                brush={brush}
                onBrushChange={setBrush}
              />
            </div>
            <div role="tabpanel" className={tab === "table" ? "" : "hidden"}>
              <TableTab roomId={roomId} />
            </div>
          </div>
        </aside>
      </div>

      {/* Overlays */}
      {overlay?.kind === "dm" && role === "dm" && (
        <DmScreen
          roomId={roomId}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay?.kind === "sheet" && (
        <CharacterSheetModal
          sheetId={overlay.id}
          ownerKey={ownerKey}
          onClose={() => setOverlay(null)}
          onSelectToken={(id) => {
            setSelectedId(id);
            setTab("tokens");
          }}
        />
      )}
    </div>
  );
}
