"use client";

import { useRef, useState } from "react";
import { useMutation, type Token } from "@/liveblocks.config";
import { resizeImageFile } from "@/lib/imageResize";

/** Bild für den ausgewählten Token: Link einfügen oder Datei hochladen. */
export default function TokenImageEditor({ token }: { token: Token }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setImage = useMutation(({ storage }, value: string | null) => {
    const t = storage.get("tokens").get(token.id);
    if (!t) return;
    if (value) t.set("imageUrl", value);
    else t.delete("imageUrl");
  }, [token.id]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setError(null);
      setImage(await resizeImageFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function applyUrl() {
    const value = url.trim();
    if (!/^https?:\/\//i.test(value)) {
      setError("Der Link muss mit http:// oder https:// beginnen.");
      return;
    }
    setError(null);
    setImage(value);
    setUrl("");
  }

  return (
    <section>
      <h2 className="section-title">Bild für {token.name}</h2>
      <div className="flex items-center gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-200/80 text-xs text-stone-400"
          style={{ backgroundColor: token.color }}
        >
          {token.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={token.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            "kein Bild"
          )}
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <button onClick={() => fileRef.current?.click()} className="btn btn-sm">
            Bild hochladen
          </button>
          {token.imageUrl && (
            <button onClick={() => setImage(null)} className="btn btn-danger btn-sm">
              Bild entfernen
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <div className="mt-2 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyUrl()}
          placeholder="oder Bild-Link (https://…)"
          className="field"
        />
        <button onClick={applyUrl} className="btn">
          OK
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      <p className="mt-1.5 text-xs text-stone-500">
        Hochgeladene Bilder werden verkleinert und im Tisch gespeichert. Mit einem Link muss das
        Bild öffentlich erreichbar sein.
      </p>
    </section>
  );
}
