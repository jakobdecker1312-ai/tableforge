import Link from "next/link";
import { D20Art, Embers } from "@/components/ui/Ornaments";
import SiteNav from "@/components/ui/SiteNav";
import { MapIcon, SparklesIcon, UsersIcon } from "@/components/ui/Icons";

const HIGHLIGHTS = [
  { icon: "🪑", title: "Ein echter Tisch", text: "Setz dich auf einen Platz. Alle sehen, wer wo sitzt, und die Würfel rollen vor dir über den Tisch.", from: "#5a3a1f", to: "#2a170b" },
  { icon: "🕯️", title: "Stimmung und Ton", text: "Taverne, Dungeon, Sturm oder Kampf: Licht, Effekte und Geräusche für die ganze Runde.", from: "#3b2a55", to: "#140f20" },
  { icon: "🌫️", title: "Nebel des Krieges", text: "Dynamische Sicht deckt die Karte auf, während die Helden sie erkunden.", from: "#1f3a4a", to: "#0c161c" },
  { icon: "📖", title: "DM-Schirm und Bücher", text: "Notizen, Monster, NPCs, Regeln und Charakterbögen, alles am selben Tisch.", from: "#4a2a2a", to: "#1c0f0f" },
];

const QUICK = [
  { Icon: UsersIcon, title: "Tisch beitreten", text: "Mit Code oder Einladungslink", href: "/dashboard" },
  { Icon: MapIcon, title: "Eigene Tische", text: "Zuletzt besuchte Runden", href: "/dashboard#zuletzt" },
  { Icon: SparklesIcon, title: "Neuen Tisch erstellen", text: "Los geht's in einem Klick", href: "/dashboard" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-950">
      <div className="hero-bg relative overflow-hidden">
        <div className="hero-fade" />
        <Embers />
        <SiteNav active="/" />

        <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-20">
          <div>
            <div className="mb-6 flex items-center gap-3 font-display text-xs tracking-[0.3em] text-amber-300/90">
              <span className="h-px w-12 bg-amber-500/60" />
              D&amp;D · ONLINE · GEMEINSAM
              <span className="h-px w-12 bg-amber-500/60" />
            </div>
            <h1 className="anim-fade-up font-serif-hero text-6xl font-medium leading-[0.95] text-stone-100 sm:text-7xl lg:text-8xl">
              Dein Tisch.
              <br />
              Deine Geschichte.
              <br />
              <span className="text-amber-400">Live.</span>
            </h1>
            <p className="mt-7 max-w-md font-serif-hero text-xl leading-snug text-stone-200 sm:text-2xl">
              Karte, Tokens, Initiative und Würfel in Echtzeit, ohne Konto direkt im Browser.
              Erstelle deinen Tisch oder tritt einer Runde bei.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/dashboard" className="btn btn-gold px-7 py-3.5 font-display text-base">
                Tisch beitreten ›
              </Link>
              <Link href="/dashboard" className="btn-outline-gold text-base">
                <span className="text-xl leading-none">+</span> Tisch erstellen
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="absolute inset-0 -z-10 rounded-full bg-amber-500/20 blur-3xl" />
            <D20Art className="anim-float anim-glow w-full" />
          </div>
        </section>
      </div>

      <main className="mx-auto max-w-7xl px-5">
        <section className="py-10">
          <div className="divider mb-6 justify-center font-serif-hero text-3xl text-amber-200">
            <span className="whitespace-nowrap">Schnellzugriff</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {QUICK.map(({ Icon, title, text, href }) => (
              <Link key={title} href={href} className="glass-card flex items-center gap-4 rounded-xl px-5 py-4">
                <Icon className="h-9 w-9 shrink-0 text-amber-400" />
                <span className="flex-1">
                  <span className="block font-serif-hero text-xl text-stone-100">{title}</span>
                  <span className="block text-xs text-stone-400">{text}</span>
                </span>
                <span className="text-xl text-amber-400">›</span>
              </Link>
            ))}
          </div>
        </section>

        <section id="vorlagen" className="py-10">
          <h2 className="mb-5 font-serif-hero text-3xl text-stone-100">
            <span className="mr-2 text-amber-500">🔥</span>Das macht TableForge besonders
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="glass-card overflow-hidden rounded-xl">
                <div
                  className="flex aspect-[16/9] items-center justify-center text-6xl"
                  style={{ background: `radial-gradient(circle at 50% 40%, ${h.from}, ${h.to})` }}
                >
                  <span className="drop-shadow-[0_0_18px_rgba(251,191,36,0.5)]">{h.icon}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-serif-hero text-xl text-amber-200">{h.title}</h3>
                  <p className="mt-1 text-sm text-stone-400">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-amber-900/30 py-8 text-center font-fell text-base text-stone-500">
          TableForge · Ein Virtual Tabletop für deine Runde
        </footer>
      </main>
    </div>
  );
}
