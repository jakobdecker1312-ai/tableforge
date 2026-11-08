import Link from "next/link";

const LINKS = [
  { href: "/", label: "Startseite" },
  { href: "/dashboard", label: "Tisch beitreten" },
  { href: "/dashboard#zuletzt", label: "Meine Tische" },
  { href: "/#vorlagen", label: "Entdecken" },
];

function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="#d9a050" strokeWidth="1.6" strokeLinejoin="round" />
      <polygon points="20,9 29,25 11,25" fill="none" stroke="#d9a050" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M20 2v7M36 11l-7 14M4 11l7 14M20 38v-13M36 29l-7-4M4 29l7-4" stroke="#d9a050" strokeWidth="1" />
    </svg>
  );
}

export default function SiteNav({ active = "/" }: { active?: string }) {
  return (
    <header className="relative z-20 border-b border-amber-900/40 bg-stone-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="font-serif-hero text-2xl tracking-wide text-stone-100">
            Tavern <span className="text-amber-300">Roll</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`border-b-2 px-4 py-4 font-display text-sm tracking-wide transition ${
                active === l.href
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-stone-300 hover:text-amber-200"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="btn btn-gold btn-sm md:hidden">
          Tisch
        </Link>
        <div className="hidden w-32 md:block" />
      </div>
    </header>
  );
}
