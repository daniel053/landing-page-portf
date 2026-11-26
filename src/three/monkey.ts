/* Sagui low-poly do PapeAI.
   Cada peça nasce de um poliedro ou de um "loft" de anéis e é esculpida por código: deformação
   (crânio facetado, plano do rosto, cavidade dos olhos, focinho), normais mistas (faceta +
   suavizada com peso por área, o efeito de "weighted normals"), um recorte por triângulo de um
   atlas de 256 px pintado à mão, oclusão ambiente assada por esferas e, no fim, as peças de cada
   articulação são fundidas numa malha só. ~1.500 triângulos e três materiais. */
import {
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix3,
  Matrix4,
  Mesh,
  Object3D,
  OctahedronGeometry,
  QuadraticBezierCurve3,
  Sphere,
  TubeGeometry,
  Vector3,
  type Material,
} from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { glow, Kit, part, rng } from "./stage";

/* ------------------------------ atlas pintado ------------------------------ */

/* regiões do atlas (grade 4 × 4 de células de 64 px) */
const R = {
  fur: 0,
  furDark: 1,
  furLight: 2,
  face: 3,
  faceShade: 4,
  belly: 5,
  skin: 6,
  earIn: 7,
  tailDark: 8,
  tailLight: 9,
  nose: 10,
  mouth: 11,
} as const;

/* base, luz, sombra, pinceladas, comprimento da pincelada */
type Swatch = [number, number, number, number, number];
const SWATCHES: Swatch[] = [
  [0x7a5e49, 0x9d846c, 0x584232, 170, 7], // pelo marrom
  [0x5a4434, 0x77614d, 0x3d2e24, 170, 7], // pelo escuro (topo da cabeça, costas)
  [0xb1a089, 0xd3c5b0, 0x8e7d69, 150, 8], // pelo claro, cinza-amarronzado
  [0xead3b4, 0xf8ebd6, 0xd5b994, 50, 5], // máscara do rosto
  [0xd2b08c, 0xe2c4a3, 0xb99673, 40, 5], // contorno dos olhos
  [0xdcc5a2, 0xf0dfc4, 0xc3a983, 110, 6], // barriga
  [0x40312a, 0x5b4941, 0x2a201b, 40, 4], // mãos e pés
  [0xd3a38b, 0xe8bfa9, 0xb4846e, 30, 4], // dentro da orelha
  [0x503d31, 0x6b5545, 0x382a21, 130, 6], // anel escuro da cauda
  [0xb4a18b, 0xd0c1ac, 0x93816b, 130, 6], // anel claro da cauda
  [0x2b201b, 0x46372f, 0x1a1310, 10, 3], // nariz e linha da boca
  [0x5e2832, 0x7c3b46, 0x3f1821, 10, 3], // dentro da boca
];

const rgba = (hex: number, a: number) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;

function paintAtlas(g: CanvasRenderingContext2D) {
  const S = 64;
  g.lineCap = "round";
  SWATCHES.forEach(([base, hi, lo, strokes, len], i) => {
    const x0 = (i % 4) * S;
    const y0 = Math.floor(i / 4) * S;
    const rand = rng(31 + i * 7);
    g.save();
    g.beginPath();
    g.rect(x0, y0, S, S);
    g.clip();
    g.fillStyle = rgba(base, 1);
    g.fillRect(x0, y0, S, S);
    const shade = g.createLinearGradient(x0, y0, x0, y0 + S);
    shade.addColorStop(0, rgba(hi, 0.16));
    shade.addColorStop(1, rgba(lo, 0.16));
    g.fillStyle = shade;
    g.fillRect(x0, y0, S, S);
    /* manchas suaves: variação de tom sem cara de ruído */
    for (let k = 0; k < 9; k++) {
      const cx = x0 + rand() * S;
      const cy = y0 + rand() * S;
      const r = 10 + rand() * 14;
      const tone = rand() < 0.5 ? hi : lo;
      const blot = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      blot.addColorStop(0, rgba(tone, 0.28));
      blot.addColorStop(1, rgba(tone, 0));
      g.fillStyle = blot;
      g.fillRect(x0, y0, S, S);
    }
    /* pinceladas curtas, quase verticais: a direção do pelo */
    for (let k = 0; k < strokes; k++) {
      const x = x0 - 4 + rand() * (S + 8);
      const y = y0 - 4 + rand() * (S + 8);
      const a = 1.45 + (rand() - 0.5) * 0.7;
      const l = len * (0.6 + rand() * 0.8);
      g.strokeStyle = rgba(rand() < 0.55 ? hi : lo, 0.22 + rand() * 0.33);
      g.lineWidth = 1 + rand() * 1.6;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    g.restore();
  });
}

/* olho: esclera creme, íris castanha e pupila (mapa auxiliar de 64 px) */
function paintEye(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#f2ebdf";
  g.fillRect(0, 0, w, h);
  const iris = g.createRadialGradient(w / 2, h / 2 - 2, 2, w / 2, h / 2, 23);
  iris.addColorStop(0, "#9a6a3c");
  iris.addColorStop(0.55, "#5e3a1d");
  iris.addColorStop(1, "#2c190c");
  g.fillStyle = iris;
  g.beginPath();
  g.arc(w / 2, h / 2, 23, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(20,12,8,0.55)";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#0e0907";
  g.beginPath();
  g.arc(w / 2, h / 2, 11, 0, Math.PI * 2);
  g.fill();
}

/* --------------------------------- escultura --------------------------------- */

const CELL = 0.25;
const MARGIN = 0.035;

type Look = {
  /** 0 = faceta pura, 1 = totalmente suavizado. */
  soft: number;
  region: number | ((center: Vector3, normal: Vector3, orig: Vector3) => number);
  /** Variação de tom entre faces. */
  tint?: number;
  /** UV por unidade de mundo: tamanho da pincelada sobre a face. */
  scale?: number;
};

let seedCounter = 1;
const va = new Vector3();
const vb = new Vector3();
const vc = new Vector3();
const e1 = new Vector3();
const e2 = new Vector3();
const fn = new Vector3();
const sn = new Vector3();
const cen = new Vector3();
const ocen = new Vector3();
const tan = new Vector3();
const bit = new Vector3();
const UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3(1, 0, 0);

/** Recorta para o triângulo um pedaço da região do atlas, com orientação estável. */
function patch(uv: Float32Array, i: number, pts: Vector3[], n: Vector3, region: number, rand: () => number, scale: number) {
  tan.crossVectors(Math.abs(n.y) < 0.9 ? UP : RIGHT, n).normalize();
  bit.crossVectors(n, tan);
  cen.copy(pts[0]).add(pts[1]).add(pts[2]).divideScalar(3);
  const local = pts.map((p) => [e1.subVectors(p, cen).dot(tan), e1.dot(bit)]);
  const extent = Math.max(1e-6, ...local.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
  const half = CELL / 2 - MARGIN;
  const s = Math.min(scale, (half * 0.9) / extent);
  const room = half - extent * s;
  const cu = (region % 4) * CELL + CELL / 2 + (rand() * 2 - 1) * room;
  const cv = 1 - Math.floor(region / 4) * CELL - CELL / 2 + (rand() * 2 - 1) * room;
  local.forEach(([x, y], k) => {
    uv[(i + k) * 2] = cu + x * s;
    uv[(i + k) * 2 + 1] = cv + y * s;
  });
}

/** Funde vértices, deforma, mistura normais e pinta: devolve uma malha triangular não indexada. */
function sculpt(src: BufferGeometry, deform: ((p: Vector3) => void) | null, look: Look) {
  let g = src.clone();
  src.dispose();
  for (const name of Object.keys(g.attributes)) if (name !== "position") g.deleteAttribute(name);
  g = mergeVertices(g, 1e-4);
  g.setAttribute("orig", g.attributes.position.clone());
  if (deform) {
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      va.fromBufferAttribute(pos, i);
      deform(va);
      pos.setXYZ(i, va.x, va.y, va.z);
    }
  }
  g.computeVertexNormals();
  const flat = g.toNonIndexed();
  g.dispose();

  const pos = flat.attributes.position;
  const nor = flat.attributes.normal;
  const orig = flat.attributes.orig;
  const uv = new Float32Array(pos.count * 2);
  const col = new Float32Array(pos.count * 3);
  const rand = rng(seedCounter++ * 97);
  const tint = look.tint ?? 0.1;
  const pts = [va, vb, vc];

  for (let i = 0; i < pos.count; i += 3) {
    va.fromBufferAttribute(pos, i);
    vb.fromBufferAttribute(pos, i + 1);
    vc.fromBufferAttribute(pos, i + 2);
    fn.crossVectors(e1.subVectors(vc, vb), e2.subVectors(va, vb)).normalize();
    ocen.fromBufferAttribute(orig, i).add(e1.fromBufferAttribute(orig, i + 1)).add(e2.fromBufferAttribute(orig, i + 2)).divideScalar(3);
    cen.copy(va).add(vb).add(vc).divideScalar(3);
    const region = typeof look.region === "number" ? look.region : look.region(cen.clone(), fn.clone(), ocen.clone());
    for (let k = 0; k < 3; k++) {
      sn.fromBufferAttribute(nor, i + k);
      sn.multiplyScalar(look.soft).addScaledVector(fn, 1 - look.soft).normalize();
      nor.setXYZ(i + k, sn.x, sn.y, sn.z);
    }
    patch(uv, i, pts, fn, region, rand, look.scale ?? 0.6);
    /* cada face com um tom levemente diferente, puxando para quente ou frio */
    const t = 1 + (rand() - 0.5) * tint;
    const warm = (rand() - 0.5) * tint * 0.35;
    for (let k = 0; k < 3; k++) col.set([t * (1 + warm), t, t * (1 - warm)], (i + k) * 3);
  }
  flat.deleteAttribute("orig");
  flat.setAttribute("uv", new BufferAttribute(uv, 2));
  flat.setAttribute("color", new BufferAttribute(col, 3));
  return flat;
}

/** Superfície por anéis (tronco, membros): triângulos regulares, anéis desencontrados meio passo. */
type Ring = { y: number; rx: number; rf: number; rb?: number; x?: number; z?: number };
function loft(rings: Ring[], n: number, dome = 0.03) {
  const pos: number[] = [];
  const index: number[] = [];
  rings.forEach((r, i) => {
    for (let j = 0; j < n; j++) {
      const a = ((j + i * 0.5) / n) * Math.PI * 2;
      const s = Math.sin(a);
      pos.push((r.x ?? 0) + Math.cos(a) * r.rx, r.y, (r.z ?? 0) + s * (s > 0 ? r.rf : (r.rb ?? r.rf)));
    }
  });
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < n; j++) {
      const a = i * n + j;
      const a1 = i * n + ((j + 1) % n);
      const b = (i + 1) * n + j;
      const b1 = (i + 1) * n + ((j + 1) % n);
      index.push(a, b, a1, a1, b, b1);
    }
  const first = rings[0];
  const last = rings[rings.length - 1];
  const c0 = pos.length / 3;
  pos.push(first.x ?? 0, first.y - dome, first.z ?? 0);
  pos.push(last.x ?? 0, last.y + dome, last.z ?? 0);
  const top = (rings.length - 1) * n;
  for (let j = 0; j < n; j++) {
    index.push(c0, j, (j + 1) % n);
    index.push(c0 + 1, top + ((j + 1) % n), top + j);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(index);
  return g;
}

/* ------------------------------ oclusão ambiente ------------------------------ */

type Proxy = { c: Vector3; r: number; tag: string };

/** Escurece os vértices perto de outras partes (axilas, pescoço, entre as pernas) e do chão. */
function bakeAO(mesh: Mesh, space: Object3D, proxies: Proxy[], skip: string[]) {
  const m = new Matrix4().copy(space.matrixWorld).invert().multiply(mesh.matrixWorld);
  const nm = new Matrix3().getNormalMatrix(m);
  const { position: pos, normal: nor, color: col } = mesh.geometry.attributes;
  const p = new Vector3();
  const n = new Vector3();
  const d = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i).applyMatrix4(m);
    n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
    let occ = 0;
    for (const s of proxies) {
      if (skip.includes(s.tag)) continue;
      d.subVectors(s.c, p);
      const dist = d.length();
      if (dist < s.r) {
        occ += 0.9;
        continue;
      }
      const cos = n.dot(d) / dist;
      if (cos > 0) occ += (cos * s.r * s.r) / (dist * dist);
    }
    if (p.y < 0.22) occ += (1 - p.y / 0.22) * (n.y < 0.3 ? 0.55 : 0.2);
    const ao = 1 - Math.min(0.5, occ * 0.6);
    col.setXYZ(i, col.getX(i) * ao, col.getY(i) * ao, col.getZ(i) * ao);
  }
}

/** Funde as peças estáticas de uma articulação numa malha só (menos draw calls). */
function fuse(parent: Object3D, meshes: Mesh[], material: Material) {
  parent.updateMatrixWorld(true);
  const inv = new Matrix4().copy(parent.matrixWorld).invert();
  const geos = meshes.map((mesh) => {
    const g = mesh.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(inv, mesh.matrixWorld));
    mesh.geometry.dispose();
    mesh.removeFromParent();
    return g;
  });
  const merged = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return part(parent, merged, material);
}

/* ---------------------------------- formas ---------------------------------- */

const EYE = { x: 0.14, y: 0.045, z: 0.25, r: 0.088 };

/** Crânio de primata: largo nas bochechas, rosto achatado, arco das sobrancelhas e cavidade dos olhos. */
function skullShape(p: Vector3) {
  const { x, y, z } = p;
  let px = x * 0.47;
  let py = y * 0.41;
  let pz = z * 0.43;
  px *= 1 + 0.1 * Math.max(0, -y) * (z > -0.2 ? 1 : 0.35);
  if (y > 0.55) py = 0.41 * (0.55 + (y - 0.55) * 0.75);
  if (z > 0.4) pz = 0.43 * (0.4 + (z - 0.4) * 0.5);
  if (z < -0.2) pz *= 1.06;
  pz += Math.max(0, 1 - Math.abs(y - 0.33) / 0.18) * Math.max(0, (z - 0.45) / 0.55) * 0.04;
  for (const s of [-1, 1]) {
    const dd = Math.hypot(x - s * 0.3, y - 0.1);
    if (z > 0.5 && dd < 0.36) pz -= 0.05 * Math.pow(1 - dd / 0.36, 1.5);
  }
  p.set(px, py, pz);
}

/** Máscara em forma de coração, olhos com contorno mais escuro, topo e nuca escuros. */
function skullRegion(_c: Vector3, _n: Vector3, d: Vector3) {
  d.normalize();
  const { x, y, z } = d;
  if (z > 0.55 && (Math.hypot(x - 0.3, y - 0.1) < 0.2 || Math.hypot(x + 0.3, y - 0.1) < 0.2)) return R.faceShade;
  const lobe = Math.min(Math.hypot(x - 0.3, (y - 0.12) * 1.1), Math.hypot(x + 0.3, (y - 0.12) * 1.1)) < 0.4;
  const lower = (x / 0.6) ** 2 + ((y + 0.22) / 0.55) ** 2 < 1;
  if (z > 0.35 && (lobe || lower)) return R.face;
  if (y > 0.45 || z < -0.3) return R.furDark;
  if (Math.abs(x) > 0.72 && y < 0.05 && z > -0.2) return R.furLight;
  return R.fur;
}

function muzzleShape(p: Vector3) {
  let { x, y, z } = p;
  if (y < -0.35) y = -0.35 + (y + 0.35) * 0.4;
  if (z < -0.2) z = -0.2 + (z + 0.2) * 0.6;
  /* lábio superior em dois lobos, com o sulco no meio */
  if (z > 0.3 && y > -0.35 && y < 0.3) x *= 1.08;
  if (z > 0.6 && Math.abs(x) < 0.25 && y > -0.1) z -= 0.06;
  p.set(x * 0.205, y * 0.15, z * 0.17);
}

/* ---------------------------------- sagui ---------------------------------- */

export type Arm = { shoulder: Group; elbow: Group; thumb: Mesh };

export type Monkey = {
  root: Group;
  body: Group;
  head: Group;
  /** Encaixes dos olhos: escala em Y pisca. */
  eyes: Group[];
  /** Globos oculares: giram para onde o sagui olha. */
  balls: Mesh[];
  /** Boca aberta: escala em Y fala. */
  mouth: Mesh;
  ears: Group[];
  brows: Mesh[];
  right: Arm;
  left: Arm;
  tail: Group[];
  /** Refaz o tubo da cauda depois de girar os segmentos. */
  updateTail: () => void;
  headAnchor: Object3D;
  triangles: number;
};

export function buildMonkey(kit: Kit): Monkey {
  seedCounter = 1;
  const atlas = kit.paint(256, 256, (g) => paintAtlas(g)).tex;
  atlas.magFilter = LinearFilter;
  atlas.minFilter = LinearMipmapLinearFilter;
  const fur = kit.std(0xffffff, { map: atlas, vertexColors: true, flatShading: false, roughness: 0.82, metalness: 0 });
  const eyeTex = kit.paint(64, 64, paintEye).tex;
  eyeTex.magFilter = LinearFilter;
  eyeTex.minFilter = LinearMipmapLinearFilter;
  const eyeMat = kit.std(0xffffff, { map: eyeTex, flatShading: false, roughness: 0.3, metalness: 0 });
  const shine = kit.basic(0xffffff);

  const root = new Group();
  const body = new Group();
  root.add(body);
  const head = new Group();
  head.position.set(0, 1.5, 0.04);
  body.add(head);

  const ao: [Mesh, string[]][] = [];
  const fusions: (() => void)[] = [];
  const add = (parent: Object3D, geo: BufferGeometry, pos?: [number, number, number], rot?: [number, number, number], skip: string[] = []) => {
    const mesh = part(parent, geo, fur, pos, rot);
    ao.push([mesh, skip]);
    return mesh;
  };

  /* -------- cabeça -------- */
  const headParts: Mesh[] = [];
  const onHead = (geo: BufferGeometry, pos?: [number, number, number], rot?: [number, number, number]) => {
    const mesh = add(head, geo, pos, rot, ["head"]);
    headParts.push(mesh);
    return mesh;
  };
  onHead(sculpt(new IcosahedronGeometry(1, 2), skullShape, { soft: 0.5, region: skullRegion }));
  onHead(
    sculpt(new IcosahedronGeometry(1, 1), muzzleShape, { soft: 0.7, region: (_c, _n, d) => (d.normalize().y < -0.6 ? R.faceShade : R.face), tint: 0.06 }),
    [0, -0.15, 0.27],
  );
  onHead(
    sculpt(new IcosahedronGeometry(1, 0), (p) => p.set(p.x * 0.056 * (p.y > 0 ? 1.2 : 1), p.y * 0.032, p.z * 0.03), { soft: 0.6, region: R.nose, tint: 0.04 }),
    [0, -0.075, 0.425],
    [-0.35, 0, 0],
  );
  /* sorriso: linha curva que sobe nas pontas */
  const smile = new QuadraticBezierCurve3(new Vector3(-0.066, 0.014, -0.012), new Vector3(0, -0.024, 0.014), new Vector3(0.066, 0.014, -0.012));
  onHead(sculpt(new TubeGeometry(smile, 6, 0.0085, 3, false), null, { soft: 0.6, region: R.nose, tint: 0 }), [0, -0.2, 0.432], [0.12, 0, 0]);
  /* volume de pelo: mechas facetadas nas bochechas e no topo (sem pelos soltos) */
  const tuft = (pos: [number, number, number], rot: [number, number, number], size: [number, number, number], region: number) =>
    onHead(sculpt(new ConeGeometry(1, 1, 4), (p) => p.set(p.x * size[0], (p.y + 0.5) * size[1], p.z * size[2]), { soft: 0, region, tint: 0.08 }), pos, rot);
  for (const s of [-1, 1]) {
    tuft([s * 0.41, -0.1, 0.05], [0, 0, -s * 2.0], [0.065, 0.12, 0.045], R.furLight);
    tuft([0.0 + s * 0.06, 0.34, -0.06], [-0.6, 0, -s * 0.35], [0.065, 0.11, 0.045], R.furDark);
  }

  /* boca aberta (fala): escondida até mexer */
  const mouth = part(
    head,
    sculpt(new IcosahedronGeometry(1, 0), (p) => p.set(p.x * 0.05, p.y * 0.034, p.z * 0.016), { soft: 0.6, region: R.mouth, tint: 0 }),
    fur,
    [0, -0.214, 0.425],
    [0.12, 0, 0],
  );
  mouth.scale.y = 0.001;

  /* olhos: um pouco menores que antes, próximos e voltados para a frente */
  const eyeGeo = new IcosahedronGeometry(EYE.r, 1);
  {
    const p = eyeGeo.attributes.position;
    const uv = eyeGeo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (2 * EYE.r), 0.5 + p.getY(i) / (2 * EYE.r));
  }
  const eyes: Group[] = [];
  const balls: Mesh[] = [];
  for (const s of [-1, 1]) {
    const socket = new Group();
    socket.position.set(s * EYE.x, EYE.y, EYE.z);
    head.add(socket);
    balls.push(part(socket, eyeGeo, eyeMat));
    for (const [dx, dy, r] of [
      [0.32, 0.38, 0.021],
      [-0.3, -0.3, 0.009],
    ]) {
      const dir = new Vector3(dx, dy, 0).setZ(Math.sqrt(1 - dx * dx - dy * dy));
      const spark = glow(part(socket, new CircleGeometry(r, 5), shine));
      spark.position.copy(dir).multiplyScalar(EYE.r * 1.01);
      spark.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir);
    }
    eyes.push(socket);
  }

  /* sobrancelhas sutis, mais baixas na ponta de fora (expressão amigável) */
  const brows = [-1, 1].map((s) => {
    const brow = part(
      head,
      sculpt(new OctahedronGeometry(1, 0), (p) => p.set(p.x * 0.068, p.y * 0.016, p.z * 0.026), { soft: 0.3, region: R.furDark, tint: 0 }),
      fur,
      [s * 0.14, 0.158, 0.305],
      [0.15, 0, -s * 0.2],
    );
    brow.userData.y = brow.position.y;
    brow.userData.z = brow.rotation.z;
    return brow;
  });

  /* orelhas pequenas e arredondadas, em concha, viradas para a frente e para fora */
  const ears = [-1, 1].map((s) => {
    const pivot = new Group();
    pivot.position.set(s * 0.47, 0.05, -0.05);
    pivot.rotation.set(0, s * 1.0, -s * 0.12);
    head.add(pivot);
    const geo = sculpt(
      new CylinderGeometry(1, 1, 1, 7, 1).rotateX(Math.PI / 2),
      (p) => {
        const rad = Math.hypot(p.x, p.y);
        if (p.z > 0 && rad < 0.6) p.z -= 0.75;
        p.set(p.x * 0.1, p.y * 0.115, p.z * 0.05);
      },
      { soft: 0.35, region: (_c, n, o) => (n.z > 0.3 && Math.hypot(o.x, o.y) < 0.8 ? R.earIn : R.fur) },
    );
    add(pivot, geo, [0, 0, 0], undefined, ["head"]);
    return pivot;
  });

  /* -------- corpo -------- */
  const bodyParts: Mesh[] = [];
  const onBody = (geo: BufferGeometry, skip: string[], pos?: [number, number, number], rot?: [number, number, number]) => {
    const mesh = add(body, geo, pos, rot, skip);
    bodyParts.push(mesh);
    return mesh;
  };
  /* tronco em pera, barriga um pouco saliente, leve curvatura para a frente */
  onBody(
    sculpt(
      loft(
        [
          { y: 0.34, rx: 0.17, rf: 0.15, rb: 0.16, z: -0.02 },
          { y: 0.42, rx: 0.26, rf: 0.25, rb: 0.23, z: -0.02 },
          { y: 0.56, rx: 0.31, rf: 0.31, rb: 0.26 },
          { y: 0.72, rx: 0.31, rf: 0.31, rb: 0.25, z: 0.01 },
          { y: 0.87, rx: 0.29, rf: 0.26, rb: 0.23 },
          { y: 1.0, rx: 0.28, rf: 0.21, rb: 0.21, z: -0.01 },
          { y: 1.1, rx: 0.2, rf: 0.17, rb: 0.17 },
          { y: 1.2, rx: 0.13, rf: 0.12, rb: 0.12, z: 0.02 },
        ],
        10,
      ),
      null,
      { soft: 0.45, region: (c) => (c.z < -0.08 && c.y > 0.78 ? R.furDark : R.fur) },
    ),
    ["torso"],
  );
  /* barriga creme: volume próprio, meio enterrado no tronco, contorno oval limpo */
  onBody(
    sculpt(
      new IcosahedronGeometry(1, 1),
      /* acompanha a curvatura do tronco: as bordas recuam, só o centro fica saliente */
      (p) => p.set(p.x * 0.21, p.y * 0.26, p.z * (p.z > 0 ? 0.075 : 0.04) - p.x * p.x * 0.1 - p.y * p.y * 0.05),
      { soft: 0.55, region: R.belly, tint: 0.06 },
    ),
    ["torso"],
    [0, 0.64, 0.265],
    [-0.04, 0, 0],
  );
  /* pernas curtas e fortes, pés largos e escuros com dedos */
  for (const s of [-1, 1]) {
    onBody(
      sculpt(
        loft(
          [
            { y: 0.07, rx: 0.078, rf: 0.082, x: s * 0.215, z: 0.06 },
            { y: 0.2, rx: 0.105, rf: 0.115, rb: 0.1, x: s * 0.215, z: 0.08 },
            { y: 0.33, rx: 0.145, rf: 0.155, rb: 0.13, x: s * 0.2, z: 0.04 },
            { y: 0.47, rx: 0.13, rf: 0.13, rb: 0.12, x: s * 0.17 },
          ],
          6,
        ),
        null,
        { soft: 0.4, region: (c) => (c.y < 0.13 ? R.furDark : R.fur) },
      ),
      ["leg" + s],
    );
    const foot = sculpt(
      loft(
        [
          { y: -0.09, rx: 0.06, rf: 0.026, rb: 0.045 },
          { y: 0.02, rx: 0.088, rf: 0.03, rb: 0.062 },
          { y: 0.1, rx: 0.098, rf: 0.028, rb: 0.045 },
          { y: 0.15, rx: 0.08, rf: 0.022, rb: 0.03 },
        ],
        6,
        0.015,
      ).rotateX(Math.PI / 2),
      null,
      { soft: 0.35, region: R.skin, tint: 0.06 },
    );
    const footMesh = onBody(foot, ["leg" + s], [s * 0.225, 0.04, 0.1], [0, s * 0.22, 0]);
    for (const k of [-1, 0, 1]) {
      const toe = sculpt(new OctahedronGeometry(1, 0), (p) => p.set(p.x * 0.026, p.y * 0.022, p.z * 0.038), { soft: 0.3, region: R.skin, tint: 0.06 });
      const mesh = onBody(toe, ["leg" + s]);
      mesh.position.set(k * 0.058, -0.008, 0.165 - Math.abs(k) * 0.02).applyEuler(footMesh.rotation).add(footMesh.position);
      mesh.rotation.y = footMesh.rotation.y + k * 0.25;
    }
  }

  /* -------- braços compridos: ombro → cotovelo → mão escura -------- */
  const arm = (s: number): Arm => {
    const tag = "arm" + s;
    const shoulder = new Group();
    shoulder.position.set(s * 0.28, 1.02, -0.01);
    body.add(shoulder);
    add(
      shoulder,
      sculpt(
        loft(
          [
            { y: -0.31, rx: 0.066, rf: 0.07 },
            { y: -0.15, rx: 0.088, rf: 0.09 },
            { y: 0.04, rx: 0.095, rf: 0.095 },
          ],
          6,
        ),
        null,
        { soft: 0.45, region: (c) => (c.y > -0.05 ? R.furDark : R.fur) },
      ),
      undefined,
      undefined,
      [tag],
    );
    const elbow = new Group();
    elbow.position.y = -0.29;
    shoulder.add(elbow);
    const fore = add(
      elbow,
      sculpt(
        loft(
          [
            { y: -0.28, rx: 0.054, rf: 0.056 },
            { y: -0.12, rx: 0.074, rf: 0.078 },
            { y: 0.03, rx: 0.07, rf: 0.07 },
          ],
          6,
        ),
        null,
        { soft: 0.45, region: R.fur },
      ),
      undefined,
      undefined,
      [tag],
    );
    const palm = add(
      elbow,
      sculpt(new IcosahedronGeometry(1, 0), (p) => p.set(p.x * 0.062, p.y * 0.08, p.z * (p.z > 0 ? 0.04 : 0.05)), { soft: 0.4, region: R.skin, tint: 0.06 }),
      [0, -0.34, 0.008],
      undefined,
      [tag],
    );
    const fingers = [-1, 1].map((k) =>
      add(
        elbow,
        sculpt(new OctahedronGeometry(1, 0), (p) => p.set(p.x * 0.02, p.y * 0.048, p.z * 0.022), { soft: 0.3, region: R.skin, tint: 0.06 }),
        [k * 0.026, -0.415, 0.022],
        [0.4, 0, k * 0.08],
        [tag],
      ),
    );
    fusions.push(() => fuse(elbow, [fore, palm, ...fingers], fur));
    const thumb = part(
      elbow,
      sculpt(new OctahedronGeometry(1, 0), (p) => p.set(p.x * 0.024, p.y * 0.06, p.z * 0.024), { soft: 0.3, region: R.skin, tint: 0.06 }),
      fur,
      [0.02, -0.43, 0.045],
      [0.3, 0, 0],
    );
    thumb.scale.setScalar(0.001);
    return { shoulder, elbow, thumb };
  };
  const right = arm(1);
  const left = arm(-1);

  /* -------- cauda longa e anelada: corrente de segmentos que balança; o tubo acompanha -------- */
  const tail: Group[] = [];
  const N = 10;
  const LEN = 0.17;
  const RAD = 5;
  let parent: Object3D = body;
  for (let i = 0; i < N; i++) {
    const seg = new Group();
    if (i === 0) seg.position.set(0, 0.44, -0.22);
    else seg.position.y = LEN;
    seg.userData.base = i === 0 ? { x: -2.0, z: 0.55 } : { x: 0.3, z: 0.05 };
    seg.rotation.set(seg.userData.base.x, 0, seg.userData.base.z);
    parent.add(seg);
    tail.push(seg);
    parent = seg;
  }
  const tailTris = N * RAD * 2 + RAD;
  const tailGeo = new BufferGeometry();
  const tPos = new Float32Array(tailTris * 9);
  const tNor = new Float32Array(tailTris * 9);
  const tUv = new Float32Array(tailTris * 6);
  const tCol = new Float32Array(tailTris * 9);
  {
    const rand = rng(404);
    const shape = [new Vector3(-0.04, -0.03, 0), new Vector3(0.04, -0.03, 0), new Vector3(0, 0.04, 0)];
    for (let t = 0; t < tailTris; t++) {
      const span = Math.floor(t / (RAD * 2));
      const region = span >= N ? R.tailDark : span % 2 ? R.tailLight : R.tailDark;
      patch(tUv, t * 3, shape, new Vector3(0, 0, 1), region, rand, 0.6);
      const k = 1 + (rand() - 0.5) * 0.1;
      for (let v = 0; v < 3; v++) tCol.set([k, k, k], (t * 3 + v) * 3);
    }
  }
  tailGeo.setAttribute("position", new BufferAttribute(tPos, 3));
  tailGeo.setAttribute("normal", new BufferAttribute(tNor, 3));
  tailGeo.setAttribute("uv", new BufferAttribute(tUv, 2));
  tailGeo.setAttribute("color", new BufferAttribute(tCol, 3));
  tailGeo.boundingSphere = new Sphere(new Vector3(0, 0.7, -0.4), 1.4);
  const tailMesh = part(body, tailGeo, fur);
  tailMesh.frustumCulled = false;

  const rings = Array.from({ length: N + 1 }, () => Array.from({ length: RAD }, () => new Vector3()));
  const frame = new Matrix4();
  const stepEnd = new Matrix4().makeTranslation(0, LEN, 0);
  const ex = new Vector3();
  const ey = new Vector3();
  const ez = new Vector3();
  const o = new Vector3();
  const tip = new Vector3();
  const updateTail = () => {
    frame.identity();
    for (let i = 0; i <= N; i++) {
      if (i < N) {
        tail[i].updateMatrix();
        frame.multiply(tail[i].matrix);
      } else frame.multiply(stepEnd);
      frame.extractBasis(ex, ey, ez);
      o.setFromMatrixPosition(frame);
      const r = 0.07 - i * 0.0042;
      for (let j = 0; j < RAD; j++) {
        const a = ((j + i * 0.5) / RAD) * Math.PI * 2;
        rings[i][j].copy(o).addScaledVector(ex, Math.cos(a) * r).addScaledVector(ez, Math.sin(a) * r);
      }
    }
    tip.copy(o).addScaledVector(ey, 0.05);
    let w = 0;
    const tri = (a: Vector3, b: Vector3, c: Vector3) => {
      fn.crossVectors(e1.subVectors(c, b), e2.subVectors(a, b)).normalize();
      for (const v of [a, b, c]) {
        tPos.set([v.x, v.y, v.z], w);
        tNor.set([fn.x, fn.y, fn.z], w);
        w += 3;
      }
    };
    for (let i = 0; i < N; i++)
      for (let j = 0; j < RAD; j++) {
        const j1 = (j + 1) % RAD;
        tri(rings[i][j], rings[i + 1][j], rings[i][j1]);
        tri(rings[i][j1], rings[i + 1][j], rings[i + 1][j1]);
      }
    for (let j = 0; j < RAD; j++) tri(tip, rings[N][(j + 1) % RAD], rings[N][j]);
    tailGeo.attributes.position.needsUpdate = true;
    tailGeo.attributes.normal.needsUpdate = true;
  };
  updateTail();

  /* -------- oclusão assada e fusão -------- */
  const proxies: Proxy[] = [
    { c: new Vector3(0, 1.5, 0.04), r: 0.4, tag: "head" },
    { c: new Vector3(0, 1.35, 0.31), r: 0.13, tag: "head" },
    { c: new Vector3(0, 0.64, 0), r: 0.29, tag: "torso" },
    { c: new Vector3(0, 0.95, 0), r: 0.24, tag: "torso" },
    ...[-1, 1].flatMap((s) => [
      { c: new Vector3(s * 0.2, 0.3, 0.05), r: 0.12, tag: "leg" + s },
      { c: new Vector3(s * 0.225, 0.05, 0.12), r: 0.07, tag: "leg" + s },
      { c: new Vector3(s * 0.32, 0.86, 0.02), r: 0.085, tag: "arm" + s },
      { c: new Vector3(s * 0.35, 0.6, 0.12), r: 0.07, tag: "arm" + s },
    ]),
  ];
  root.updateMatrixWorld(true);
  ao.forEach(([mesh, skip]) => {
    if (mesh.parent) bakeAO(mesh, body, proxies, skip);
  });
  fuse(head, headParts, fur);
  fuse(body, bodyParts, fur);
  fusions.forEach((run) => run());

  const headAnchor = new Object3D();
  headAnchor.position.set(0, 0.6, 0.12);
  head.add(headAnchor);

  let triangles = 0;
  root.traverse((child) => {
    if (child instanceof Mesh) {
      const g = child.geometry as BufferGeometry;
      triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
  });

  return { root, body, head, eyes, balls, mouth, ears, brows, right, left, tail, updateTail, headAnchor, triangles };
}
