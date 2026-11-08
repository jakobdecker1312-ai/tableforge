"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { v4 as uuid } from "uuid";
import type { Monster } from "@/data/monsters";
import { CR_OPTIONS, parseEntries, xpForCr } from "@/lib/customContent";

const SIZES = ["Winzig", "Klein", "Mittel", "Groß", "Riesig", "Gigantisch"];
const TOKEN_SIZE: Record<string, number> = {
  Winzig: 0.5, Klein: 1, Mittel: 1, Groß: 2, Riesig: 3, Gigantisch: 4,
};
const ABILITY_LABELS = ["STR", "GES", "KON", "INT", "WEI", "CHA"];

export default function CustomMonsterForm({
  onSave,
  onCancel,
}: {
  onSave: (m: Monster) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [size, setSize] = useState("Mittel");
  const [type, setType] = useState("Humanoid");
  const [alignment, setAlignment] = useState("neutral");
  const [cr, setCr] = useState("1");
  const [ac, setAc] = useState(12);
  const [hp, setHp] = useState(20);
  const [hpDice, setHpDice] = useState("");
  const [speed, setSpeed] = useState("9 m");
  const [abilities, setAbilities] = useState<number[]>([10, 10, 10, 10, 10, 10]);
  const [senses, setSenses] = useState("");
  const [languages, setLanguages] = useState("");
  const [traits, setTraits] = useState("");
  const [actions, setActions] = useState("");
  const [color, setColor] = useState("#b91c1c");
  const [imageUrl, setImageUrl] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: `custom-${uuid()}`,
      name: name.trim(),
      en: "Eigenes Monster",
      size,
      type: type.trim() || "Kreatur",
      alignment: alignment.trim() || "neutral",
      cr,
      xp: xpForCr(cr),
      ac,
      hp,
      hpDice: hpDice.trim(),
      speed,
      abilities: abilities as Monster["abilities"],
      extras: [],
      senses,
      languages,
      traits: parseEntries(traits),
      actions: parseEntries(actions),
      color,
      tokenSize: TOKEN_SIZE[size] ?? 1,
      custom: true,
      ...(/^https?:\/\//i.test(imageUrl.trim()) ? { imageUrl: imageUrl.trim() } : {}),
    });
  }

  const num = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <form onSubmit={submit} className="panel ornate space-y-3 rounded-xl p-3 text-xs">
      <h3 className="section-title">Eigenes Monster erschaffen</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" className="field" required />
      <div className="grid grid-cols-2 gap-2">
        <select value={size} onChange={(e) => setSize(e.target.value)} className="field">
          {SIZES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Typ" className="field" />
        <input value={alignment} onChange={(e) => setAlignment(e.target.value)} placeholder="Gesinnung" className="field" />
        <select value={cr} onChange={(e) => setCr(e.target.value)} className="field" aria-label="Herausforderungsgrad">
          {CR_OPTIONS.map((c) => <option key={c} value={c}>HG {c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <label>RK<input type="number" min={0} value={ac} onChange={(e) => setAc(num(e.target.value))} className="field" /></label>
        <label>TP<input type="number" min={1} value={hp} onChange={(e) => setHp(num(e.target.value))} className="field" /></label>
        <label className="col-span-2">TP-Würfel<input value={hpDice} onChange={(e) => setHpDice(e.target.value)} placeholder="z. B. 4W8+4" className="field" /></label>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {ABILITY_LABELS.map((label, i) => (
          <label key={label} className="text-center text-[10px] text-stone-400">
            {label}
            <input
              type="number" min={1} max={30} value={abilities[i]}
              onChange={(e) => setAbilities((cur) => cur.map((v, j) => (j === i ? num(e.target.value) : v)))}
              className="field px-1 text-center"
            />
          </label>
        ))}
      </div>
      <input value={speed} onChange={(e) => setSpeed(e.target.value)} placeholder="Bewegung" className="field" />
      <input value={senses} onChange={(e) => setSenses(e.target.value)} placeholder="Sinne" className="field" />
      <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Sprachen" className="field" />
      <textarea value={traits} onChange={(e) => setTraits(e.target.value)} rows={3} placeholder={"Eigenschaften, eine pro Zeile:\nRudeltaktik: Vorteil auf Angriffe, wenn ein Verbündeter angrenzt."} className="field" />
      <textarea value={actions} onChange={(e) => setActions(e.target.value)} rows={3} placeholder={"Aktionen, eine pro Zeile:\nBiss: +4 auf Treffer, 2W6+2 Stichschaden."} className="field" />
      <label className="flex items-center gap-2">
        Tokenfarbe
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-10 rounded border border-stone-700 bg-transparent" />
      </label>
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Token-Bild als Link (optional, https://…)" className="field" />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-gold flex-1">Speichern</button>
        <button type="button" onClick={onCancel} className="btn">Abbrechen</button>
      </div>
    </form>
  );
}
