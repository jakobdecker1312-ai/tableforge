const LINKS = [
  { title: "SRD 5.1 (offiziell, D&D Beyond)", url: "https://www.dndbeyond.com/srd", note: "Kostenloses Regelwerk, englisch" },
  { title: "Basic Rules (D&D Beyond)", url: "https://www.dndbeyond.com/sources/dnd/br-2024", note: "Kostenlose Grundregeln" },
  { title: "Open5e", url: "https://open5e.com", note: "Durchsuchbar: Monster, Zauber, Regeln (SRD)" },
  { title: "Monster Manual, Spielerhandbuch & DMG", url: "https://www.dndbeyond.com/marketplace", note: "Offizielle Bücher, kostenpflichtig" },
];

export default function RulebookLinks() {
  return (
    <section className="space-y-1.5">
      <h3 className="section-title">Regelwerke online</h3>
      {LINKS.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2 transition hover:border-amber-600/60"
        >
          <span className="block text-sm font-medium text-amber-300">{l.title} ↗</span>
          <span className="block text-[11px] text-stone-500">{l.note}</span>
        </a>
      ))}
    </section>
  );
}
