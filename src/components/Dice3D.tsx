"use client";

import { useEffect, useMemo, useRef, type ReactElement } from "react";
import {
  dotVec,
  faceToCameraMatrix,
  getFaces,
  SUPPORTED_SHAPES,
  type DieShape,
} from "@/lib/polyhedra";
import type { Roll } from "@/liveblocks.config";

const R = 34; // Würfelradius in px
const BOX = 80;
const LIGHT: [number, number, number] = (() => {
  const v: [number, number, number] = [-0.3, -0.55, 0.8];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();

type DieProps = {
  shape: DieShape;
  /** Index der Fläche, die oben liegen soll */
  faceIndex: number;
  /** Beschriftung pro Fläche, Standard 1..n */
  labels?: string[];
  color: string;
  size?: number;
  delay?: number;
  animate?: boolean;
};

export function Die3D({ shape, faceIndex, labels, color, size = BOX, delay = 0, animate = true }: DieProps) {
  const faces = useMemo(() => getFaces(shape), [shape]);
  const cubeRef = useRef<HTMLDivElement>(null);
  const target = faces[Math.min(faceIndex, faces.length - 1)];
  const tilt = "rotateX(-24deg) rotateY(16deg)";
  const finalTransform = `${tilt} ${faceToCameraMatrix(target)}`;

  // Schattierung nach der Endlage (Beleuchtung von links oben)
  const shades = useMemo(
    () =>
      faces.map((f) => {
        const rn: [number, number, number] = [
          dotVec(target.u, f.n),
          dotVec(target.d, f.n),
          dotVec(target.n, f.n),
        ];
        return Math.max(0.28, Math.min(1, dotVec(rn, LIGHT) * 0.75 + 0.35));
      }),
    [faces, target]
  );

  useEffect(() => {
    const el = cubeRef.current;
    if (!el || !animate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = () => (Math.random() < 0.5 ? -1 : 1) * (540 + Math.random() * 540);
    const anim = el.animate(
      [
        { transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)" },
        {
          transform: `rotateX(${r()}deg) rotateY(${r()}deg) rotateZ(${r() / 2}deg)`,
          offset: 0.78,
        },
        { transform: finalTransform },
      ],
      {
        duration: 900 + Math.random() * 400,
        delay,
        easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
        fill: "backwards",
      }
    );
    return () => anim.cancel();
  }, [animate, delay, finalTransform]);

  const scale = size / BOX;

  return (
    <div style={{ width: size, height: size, perspective: 520 * scale }}>
      <div
        ref={cubeRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: finalTransform,
        }}
      >
        {faces.map((f, i) => {
          const pts = f.verts.map((v) => {
            const rel = [v[0] - f.center[0], v[1] - f.center[1], v[2] - f.center[2]] as const;
            return [
              (rel[0] * f.u[0] + rel[1] * f.u[1] + rel[2] * f.u[2]) * R * scale,
              (rel[0] * f.d[0] + rel[1] * f.d[1] + rel[2] * f.d[2]) * R * scale,
            ] as const;
          });
          const half = Math.max(...pts.flat().map(Math.abs)) + 2;
          const S = half * 2;
          const label = labels?.[i] ?? String(i + 1);
          const matrix = `matrix3d(${f.u[0]},${f.u[1]},${f.u[2]},0,${f.d[0]},${f.d[1]},${f.d[2]},0,${f.n[0]},${f.n[1]},${f.n[2]},0,${f.center[0] * R * scale},${f.center[1] * R * scale},${f.center[2] * R * scale},1)`;
          const fontSize = Math.max(8, half * (f.verts.length === 3 ? 0.55 : 0.7) * (label.length > 1 ? 0.8 : 1));
          return (
            <svg
              key={i}
              width={S}
              height={S}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -half,
                marginTop: -half,
                transform: matrix,
                backfaceVisibility: "hidden",
                overflow: "visible",
              }}
            >
              <polygon
                points={pts.map(([x, y]) => `${x + half},${y + half}`).join(" ")}
                fill={`color-mix(in srgb, ${color} ${Math.round(shades[i] * 100)}%, #000)`}
                stroke="rgba(15,8,2,0.85)"
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
              <text
                x={half}
                y={half}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Cinzel, Georgia, serif"
                fontWeight={700}
                fontSize={fontSize}
                fill="#fff7dc"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={0.5}
              >
                {label}
              </text>
            </svg>
          );
        })}
      </div>
    </div>
  );
}

const TENS = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "00"];
const ONES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const digitIndex = (d: number) => (d + 9) % 10;

/** Alle Würfel eines Wurfs, 3D, mit Summenschild nach dem Ausrollen. */
export default function RollDice3D({ roll }: { roll: Roll }) {
  const supported = roll.sides === 100 || SUPPORTED_SHAPES.includes(roll.sides);
  const shown = roll.results.slice(0, roll.sides === 100 ? 3 : 6);
  const more = roll.results.length - shown.length;
  const small = shown.length > 3 || roll.sides === 100;
  const size = small ? 56 : 72;

  const dice: ReactElement[] = [];
  if (supported) {
    shown.forEach((value, i) => {
      if (roll.sides === 100) {
        const tens = value === 100 ? 0 : Math.floor(value / 10);
        const ones = value === 100 ? 0 : value % 10;
        dice.push(
          <Die3D key={`t${i}`} shape={10} faceIndex={digitIndex(tens)} labels={TENS} color={roll.color} size={size} delay={i * 90} />,
          <Die3D key={`o${i}`} shape={10} faceIndex={digitIndex(ones)} labels={ONES} color={roll.color} size={size} delay={i * 90 + 40} />
        );
      } else {
        dice.push(
          <Die3D
            key={i}
            shape={roll.sides as DieShape}
            faceIndex={value - 1}
            color={roll.color}
            size={size}
            delay={i * 90}
          />
        );
      }
    });
  }

  const crit = roll.sides === 20 && roll.count === 1 ? roll.results[0] : null;
  const tone = roll.secret
    ? "border-purple-400 bg-purple-950/90 text-purple-100"
    : crit === 20
      ? "border-emerald-300 bg-emerald-950/95 text-emerald-200"
      : crit === 1
        ? "border-red-300 bg-red-950/95 text-red-200"
        : "border-amber-300 bg-stone-950/95 text-amber-100";

  return (
    <div className="flex flex-col items-center">
      {supported ? (
        <div className="flex max-w-[16rem] flex-wrap items-center justify-center" style={{ filter: "drop-shadow(0 8px 6px rgba(0,0,0,0.55))" }}>
          {dice}
        </div>
      ) : null}
      <div
        className={`die-total mt-0.5 flex min-w-12 flex-col items-center rounded-xl border-2 px-2.5 py-1 shadow-xl ${tone}`}
      >
        <span className="text-[9px] text-stone-400">
          {roll.count > 1 ? roll.count : ""}W{roll.sides}
          {roll.modifier ? (roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier) : ""}
          {more > 0 ? ` (+${more})` : ""}
        </span>
        <span className="font-display text-xl font-bold leading-none">{roll.total}</span>
      </div>
    </div>
  );
}
