# ⚔️ Tavern Roll

Ein schlankes D&D Virtual Tabletop mit Echtzeit-Sync.

**Funktionen:** Tische erstellen/beitreten · Live-Presence und Cursor · Tokens per Drag & Drop (mit Größen) ·
DM-/Spieler-Rolle · Hintergrundbild · Zoom · Nebel des Krieges mit dynamischer Sicht · Würfellog mit
verdeckten DM-Würfen · Initiative-Tracker · animierter DM-Schirm mit Notizen und Begegnungs-Tracker ·
Bücher (Monster, Zustände, Regeln, NPCs) · Charakterbögen mit Würfelintegration, Export und Import

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Liveblocks · uuid

## Schnellstart

1. **Node.js installieren** (LTS-Version, mindestens 18.18): https://nodejs.org

2. **Liveblocks-Key holen**
   Kostenlosen Account auf https://liveblocks.io anlegen, ein Projekt erstellen und im Dashboard unter
   *API keys* den **Public key** (beginnt mit `pk_`) kopieren.

3. **Key eintragen**
   Kopiere die Datei `.env.example` und nenne die Kopie `.env.local`. Trage deinen Key ein:

   ```
   NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dein_key
   ```

4. **Im Projektordner ein Terminal öffnen** und ausführen:

   ```bash
   npm install
   npm run dev
   ```

5. Im Browser **http://localhost:3000** öffnen.

## Ausprobieren

1. Im Dashboard einen Tisch erstellen.
2. Den Einladungslink (Button oben im Tisch) in einem zweiten Browserfenster oder Inkognito-Tab öffnen.
3. Tokens hinzufügen und ziehen. Die Bewegung erscheint live im anderen Fenster.
4. Oben auf **DM** wechseln, um Monster, Nebel, Hintergrundbild und verdeckte Würfe zu nutzen.

## Online stellen (Vercel)

```bash
npx vercel
npx vercel env add NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY
npx vercel --prod
```

Beim Eintragen der Variable alle Umgebungen auswählen. Die Variable wird beim Bauen eingebaut, nach dem
Eintragen also neu deployen.

## Hinweis zur Sicherheit

Der Public Key ist für Entwicklung und kleine Gruppen gedacht: Jeder, der einen Tisch-Code kennt, kann
beitreten. Rollen, verdeckte Würfe, Nebel und versteckte Initiative-Einträge werden nur im Browser
durchgesetzt. Für den öffentlichen Betrieb sollte auf Liveblocks-Authentifizierung mit einem eigenen
Auth-Endpoint umgestellt werden.

## Projektstruktur

```
src/
├── liveblocks.config.ts          Client, Types (Presence/Storage), Hooks
├── lib/identity.ts               Name, Farbe, Rolle (localStorage)
├── app/
│   ├── page.tsx                  Landingpage
│   ├── dashboard/page.tsx        Tisch erstellen/beitreten
│   └── room/[roomId]/page.tsx    RoomProvider + Suspense
└── components/
    ├── Room.tsx                  Map, Tokens, Nebel, Zoom, Sidebars
    ├── DiceLog.tsx               Würfel und Verlauf
    └── InitiativeTracker.tsx     Kampfreihenfolge
```

## Hinweise zu den neuen Funktionen

- **Bücher:** Monster, Zustände und Regeln basieren auf dem System Reference Document 5.1 von Wizards of
  the Coast (CC BY 4.0), sinngemäß ins Deutsche übertragen. Neue Einträge ergänzt du in `src/data/`.
- **Private DM-Daten:** DM-Notizen und das NPC-Verzeichnis liegen nur im Browser der DM (localStorage).
- **Charakterbögen:** Sie liegen im geteilten Tisch-Speicher. Bearbeiten dürfen nur die Besitzerin bzw.
  der Besitzer (erkannt über einen Schlüssel im Browser) und die DM. Das ist keine echte Anmeldung.
