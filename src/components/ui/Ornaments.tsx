import type { CSSProperties, ReactNode } from "react";

const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: 3 + ((i * 5) % 5),
  duration: 9 + ((i * 7) % 11),
  delay: -((i * 3) % 14),
  drift: ((i % 2 === 0 ? 1 : -1) * (20 + ((i * 11) % 60))) + "px",
}));

/** Aufsteigende Glutfunken als Hintergrund. */
export function Embers() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={
            {
              left: e.left,
              width: e.size,
              height: e.size,
              animationDuration: `${e.duration}s`,
              animationDelay: `${e.delay}s`,
              "--drift": e.drift,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Verzierte Trennlinie mit Raute. */
export function Divider({ children }: { children?: ReactNode }) {
  return <div className="divider text-sm">{children ?? "◆"}</div>;
}

/** Großer, goldener W20. */
export function D20Art({ className = "" }: { className?: string }) {
  const V = { t: "100,10", ur: "178,55", lr: "178,145", b: "100,190", ll: "22,145", ul: "22,55" };
  const T = { t: "100,46", r: "140,116", l: "60,116" };
  const facets = [
    `${V.t} ${V.ur} ${T.t}`,
    `${V.ur} ${T.r} ${T.t}`,
    `${V.ur} ${V.lr} ${T.r}`,
    `${V.lr} ${V.b} ${T.r}`,
    `${V.b} ${T.l} ${T.r}`,
    `${V.b} ${V.ll} ${T.l}`,
    `${V.ll} ${T.l} ${V.ul}`,
    `${V.ul} ${T.l} ${T.t}`,
    `${V.ul} ${T.t} ${V.t}`,
    `${T.t} ${T.r} ${T.l}`,
  ];
  const shades = ["#fbbf24", "#d97706", "#f59e0b", "#92400e", "#b45309", "#78350f", "#92400e", "#d97706", "#fcd34d", "#f59e0b"];
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <radialGradient id="d20shine" cx="35%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {facets.map((pts, i) => (
        <polygon key={i} points={pts} fill={shades[i]} stroke="#451a03" strokeWidth="2" strokeLinejoin="round" />
      ))}
      <polygon
        points={`${V.t} ${V.ur} ${V.lr} ${V.b} ${V.ll} ${V.ul}`}
        fill="url(#d20shine)"
        stroke="#451a03"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <text
        x="100"
        y="98"
        textAnchor="middle"
        fontFamily="serif"
        fontWeight="900"
        fontSize="30"
        fill="#2a1405"
      >
        20
      </text>
    </svg>
  );
}
