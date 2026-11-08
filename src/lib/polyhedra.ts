export type Vec = [number, number, number];

export type Face = {
  verts: Vec[];
  center: Vec;
  /** Nach außen zeigende Normale */
  n: Vec;
  /** Richtung "nach unten" in der Fläche (Beschriftung steht dann aufrecht) */
  d: Vec;
  /** Richtung "nach rechts" in der Fläche, u × d = n */
  u: Vec;
};

export type DieShape = 4 | 6 | 8 | 10 | 12 | 20;
export const SUPPORTED_SHAPES: readonly number[] = [4, 6, 8, 10, 12, 20];

const PHI = (1 + Math.sqrt(5)) / 2;

const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const len = (a: Vec) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: Vec): Vec => mul(a, 1 / len(a));

/** Alle Vorzeichenkombinationen (±a, ±b, ±c) */
function signs(a: number, b: number, c: number): Vec[] {
  const out: Vec[] = [];
  for (const x of a === 0 ? [0] : [a, -a])
    for (const y of b === 0 ? [0] : [b, -b])
      for (const z of c === 0 ? [0] : [c, -c]) out.push([x, y, z]);
  return out;
}

function cyc(a: number, b: number): Vec[] {
  // (0, ±a, ±b) und zyklische Vertauschungen
  const base = signs(0, a, b);
  return [
    ...base,
    ...base.map((v): Vec => [v[1], v[2], v[0]]),
    ...base.map((v): Vec => [v[2], v[0], v[1]]),
  ];
}

function buildFace(rawVerts: Vec[]): Face {
  const center = mul(rawVerts.reduce(add), 1 / rawVerts.length);
  let n = norm(cross(sub(rawVerts[1], rawVerts[0]), sub(rawVerts[2], rawVerts[0])));
  if (dot(n, center) < 0) n = mul(n, -1);
  // Eckpunkte um die Normale herum ordnen
  const ref = norm(sub(rawVerts[0], center));
  const side = cross(n, ref);
  const verts = [...rawVerts].sort((a, b) => {
    const ang = (p: Vec) => {
      const v = sub(p, center);
      return Math.atan2(dot(v, side), dot(v, ref));
    };
    return ang(a) - ang(b);
  });
  // "unten" zeigt vom Mittelpunkt weg zur ersten Ecke, Zahl steht mit dem Kopf zur Ecke.
  const toVertex = sub(verts[0], center);
  let d = sub(toVertex, mul(n, dot(toVertex, n)));
  if (len(d) < 1e-6) d = cross(n, [1, 0, 0]);
  d = mul(norm(d), -1);
  const u = cross(d, n);
  return { verts, center, n, d, u };
}

/** Flächen aus Eckpunkten und bekannten Flächennormalen: Ecken mit größtem Skalarprodukt. */
function facesByNormals(verts: Vec[], normals: Vec[]): Face[] {
  return normals.map((nv) => {
    const nn = norm(nv);
    const best = Math.max(...verts.map((v) => dot(v, nn)));
    return buildFace(verts.filter((v) => Math.abs(dot(v, nn) - best) < 1e-6));
  });
}

function scaleToUnit(faces: Face[]): Face[] {
  let max = 0;
  for (const f of faces) for (const v of f.verts) max = Math.max(max, len(v));
  const s = 1 / max;
  return faces.map((f) => ({
    ...f,
    verts: f.verts.map((v) => mul(v, s)),
    center: mul(f.center, s),
  }));
}

function icosaVerts(): Vec[] {
  return cyc(1, PHI);
}

/** Alle 20 Dreiecke des Ikosaeders: Eckentripel mit gleichem Mindestabstand. */
function icosaFaces(): Vec[][] {
  const v = icosaVerts();
  const edge = Math.min(...v.flatMap((a, i) => v.slice(i + 1).map((b) => len(sub(a, b)))));
  const near = (a: Vec, b: Vec) => Math.abs(len(sub(a, b)) - edge) < 1e-6;
  const out: Vec[][] = [];
  for (let i = 0; i < v.length; i++)
    for (let j = i + 1; j < v.length; j++)
      for (let k = j + 1; k < v.length; k++)
        if (near(v[i], v[j]) && near(v[j], v[k]) && near(v[i], v[k])) out.push([v[i], v[j], v[k]]);
  return out;
}

const cache = new Map<number, Face[]>();

export function getFaces(shape: DieShape): Face[] {
  const hit = cache.get(shape);
  if (hit) return hit;
  let faces: Face[];

  if (shape === 4) {
    const v: Vec[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
    faces = [0, 1, 2, 3].map((i) => buildFace(v.filter((_, j) => j !== i)));
  } else if (shape === 6) {
    const v = signs(1, 1, 1);
    faces = facesByNormals(v, [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
  } else if (shape === 8) {
    const v: Vec[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    faces = facesByNormals(v, signs(1, 1, 1));
  } else if (shape === 12) {
    // Dual zum Ikosaeder: Ecken = Mittelpunkte der Ikosaeder-Dreiecke, Flächen = Ikosaeder-Ecken
    faces = facesByNormals(icosaFaces().map((t) => norm(t.reduce(add))), icosaVerts());
  } else if (shape === 20) {
    faces = icosaFaces().map((t) => buildFace(t));
  } else {
    // Zehnflächner: fünfeckiges Trapezoeder (Drachenvierecke)
    const a = 0.2;
    const h = 1.8944271909999;
    const T: Vec = [0, 0, h];
    const B: Vec = [0, 0, -h];
    const ring = (k: number, z: number, off: number): Vec => {
      const t = ((72 * k + off) * Math.PI) / 180;
      return [Math.cos(t), Math.sin(t), z];
    };
    faces = [];
    for (let k = 0; k < 5; k++) {
      faces.push(buildFace([T, ring(k, a, 0), ring(k, -a, 36), ring(k + 1, a, 0)]));
      faces.push(buildFace([B, ring(k, -a, 36), ring(k + 1, a, 0), ring(k + 1, -a, 36)]));
    }
  }

  const out = scaleToUnit(faces);
  cache.set(shape, out);
  return out;
}

/** matrix3d, das die Fläche zur Kamera dreht (Normale → +z, "unten" → +y). */
export function faceToCameraMatrix(f: Face): string {
  const { u, d, n } = f;
  return `matrix3d(${u[0]},${d[0]},${n[0]},0,${u[1]},${d[1]},${n[1]},0,${u[2]},${d[2]},${n[2]},0,0,0,0,1)`;
}

export { dot as dotVec };
