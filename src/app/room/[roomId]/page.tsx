"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import {
  ClientSideSuspense,
  hasLiveblocksKey,
  LiveblocksProvider,
  liveblocksPublicKey,
  RoomProvider,
  type CharacterSheet,
  type Combat,
  type InitiativeEntry,
  type MapSettings,
  type Roll,
  type Token,
} from "@/liveblocks.config";
import { getInitialPresence } from "@/lib/identity";
import Room from "@/components/Room";

/** Start-Zustand eines neuen Tisches. */
function buildInitialStorage() {
  return {
    tokens: new LiveMap<string, LiveObject<Token>>(),

    settings: new LiveObject<MapSettings>({
      backgroundUrl: "",
      showGrid: true,
      fogEnabled: false,
      dynamicVision: false,
      rememberExplored: true,
      visionRadius: 4,
    }),
    rolls: new LiveList<Roll>([]),
    fog: new LiveMap<string, boolean>(),
    initiative: new LiveMap<string, InitiativeEntry>(),
    combat: new LiveObject<Combat>({ active: false, round: 1, currentId: null }),
    sheets: new LiveMap<string, LiveObject<CharacterSheet>>(),
  };
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="flex items-center gap-3 text-neutral-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-700 border-t-amber-400" />
        Verbinde mit dem Tisch …
      </div>
    </div>
  );
}

function MissingKey() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">Liveblocks-Key fehlt</h1>
      <p className="mt-3 text-neutral-400">
        Lege eine <code className="rounded bg-neutral-900 px-1.5 py-0.5">.env.local</code>{" "}
        mit <code className="rounded bg-neutral-900 px-1.5 py-0.5">NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY</code>{" "}
        an und starte den Dev-Server neu.
      </p>
      <Link href="/dashboard" className="mt-6 text-amber-400 hover:underline">
        Zurück zum Dashboard
      </Link>
    </main>
  );
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const initialPresence = useMemo(() => getInitialPresence(), []);

  const [initialStorage] = useState(() => buildInitialStorage());

  if (!hasLiveblocksKey) return <MissingKey />;

  return (
    <LiveblocksProvider publicApiKey={liveblocksPublicKey} throttle={32}>
      <RoomProvider
        id={`tableforge-${roomId}`}
        initialPresence={initialPresence}
        initialStorage={initialStorage}
      >
        <ClientSideSuspense fallback={<Loading />}>
          <Room roomId={roomId} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
