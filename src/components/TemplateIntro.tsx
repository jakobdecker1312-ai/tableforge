"use client";

import { useState } from "react";
import { useSelf, useUpdateMyPresence } from "@/liveblocks.config";
import { getTemplate } from "@/data/templates";

/** Einmaliger Einstieg für die Person, die den Tisch aus einer Vorlage erstellt hat. */
export default function TemplateIntro({ templateId }: { templateId: string }) {
  const template = getTemplate(templateId);
  const me = useSelf();
  const updatePresence = useUpdateMyPresence();
  const [open, setOpen] = useState(true);
  if (!template || !open) return null;
  const isDM = me.presence.role === "dm";

  return (
    <div className="panel ornate fixed bottom-4 left-1/2 z-[60] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl p-5 shadow-2xl">
      <h2 className="font-decor text-xl font-bold text-amber-200">{template.title}</h2>
      <p className="mt-2 font-fell text-lg leading-snug text-stone-200">{template.intro}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
        {template.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {!isDM && (
          <button onClick={() => updatePresence({ role: "dm" })} className="btn btn-gold">
            Ich bin die DM
          </button>
        )}
        <button onClick={() => setOpen(false)} className="btn">
          Los geht&apos;s
        </button>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Teile oben den Einladungslink, damit deine Gruppe mitspielen kann.
      </p>
    </div>
  );
}
