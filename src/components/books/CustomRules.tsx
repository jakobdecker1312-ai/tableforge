"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { v4 as uuid } from "uuid";
import { useCustomRules } from "@/lib/customContent";
import { PlusIcon, XIcon } from "@/components/ui/Icons";

/** Eigene Hausregeln: privat auf diesem Gerät gespeichert. */
export default function CustomRules() {
  const { rules, add, remove } = useCustomRules();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    add({ id: uuid(), title: title.trim(), text: text.trim() });
    setTitle("");
    setText("");
    setAdding(false);
  }

  return (
    <section className="space-y-2">
      <h3 className="section-title">Meine Hausregeln</h3>
      {rules.length === 0 && !adding && (
        <p className="text-xs text-stone-500">Noch keine eigenen Regeln.</p>
      )}
      {rules.map((rule) => (
        <div key={rule.id} className="rounded-xl border border-amber-900/40 bg-stone-950/60 p-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-amber-300">{rule.title}</h4>
            <button
              onClick={() => remove(rule.id)}
              aria-label="Regel löschen"
              className="rounded p-1 text-stone-500 hover:text-red-300"
            >
              <XIcon />
            </button>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-300">{rule.text}</p>
        </div>
      ))}
      {adding ? (
        <form onSubmit={submit} className="panel space-y-2 rounded-xl p-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel, z. B. Kritischer Patzer" className="field" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Regeltext" className="field" />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-gold flex-1">Speichern</button>
            <button type="button" onClick={() => setAdding(false)} className="btn">Abbrechen</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="btn btn-sm w-full">
          <PlusIcon className="h-3.5 w-3.5" /> Eigene Regel hinzufügen
        </button>
      )}
    </section>
  );
}
