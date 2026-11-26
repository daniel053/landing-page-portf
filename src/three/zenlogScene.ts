/* Maquete Zenlog: o pedido sai do depositante, passa pelo Zenlog, entra no ERP (TOTVS/Senior),
   desce para o CD, o caminhão entrega e cada etapa devolve um status ao depositante. Ciclo de 15,5 s. */
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Object3D,
  PlaneGeometry,
  QuadraticBezierCurve3,
  RingGeometry,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import {
  bump,
  css,
  easeOutBack,
  glow,
  Kit,
  P,
  part,
  rng,
  runStage,
  seg,
  smooth,
  type Built,
  type SceneHandle,
  type SceneOptions,
} from "./stage";

const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 8) => new CylinderGeometry(rt, rb, h, seg);
const v3 = (x: number, y: number, z: number) => new Vector3(x, y, z);

const NODE = {
  dep: v3(-5.5, 0, 1.7),
  zen: v3(-2.5, 0, -1.9),
  erp: v3(1.0, 0, -1.9),
  cd: v3(4.6, 0, -1.5),
  store: v3(0.6, 0, 1.85),
};

/* chegada de cada status no depositante (s) — iguais aos marcos com `feed` em data/projects.ts */
const STATUS = [
  { from: "zen", start: 3.2, end: 4.4 },
  { from: "erp", start: 4.8, end: 6.0 },
  { from: "cd", start: 7.2, end: 8.4 },
  { from: "truck", start: 8.4, end: 9.6 },
  { from: "store", start: 10.6, end: 11.8 },
] as const;

const DRIVE_OUT = [7.6, 10.6];
const DRIVE_BACK = [12.0, 15.0];

/* -------------------------------- texturas -------------------------------- */

function windows(kit: Kit, base: number, glass: number, seed: number) {
  return kit.paint(128, 128, (g, w, h) => {
    const rand = rng(seed);
    for (let y = 0; y < h; y += 4)
      for (let x = 0; x < w; x += 4) {
        g.fillStyle = css(base, 1 + (rand() - 0.5) * 0.1);
        g.fillRect(x, y, 4, 4);
      }
    for (let y = 10; y < h - 20; y += 26)
      for (let x = 10; x < w - 10; x += 28) {
        g.fillStyle = css(base, 0.7);
        g.fillRect(x - 2, y - 2, 20, 18);
        g.fillStyle = rand() < 0.25 ? css(P.yellow) : css(glass, 0.9 + rand() * 0.2);
        g.fillRect(x, y, 16, 14);
        g.fillStyle = css(0xffffff, 0.95);
        g.fillRect(x + 2, y + 2, 4, 2);
      }
  }).tex;
}

function paintErp(name: string, ok: boolean) {
  return (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.fillStyle = "#1a1440";
    g.fillRect(0, 0, w, h);
    g.fillStyle = css(P.violet);
    g.fillRect(0, 0, w, 10);
    g.fillStyle = css(P.white, 0.9);
    g.font = "bold 7px monospace";
    g.textBaseline = "top";
    g.fillText("ERP DO CLIENTE", 4, 2);
    g.font = "bold 22px monospace";
    g.fillStyle = css(P.white);
    g.fillText(name, 8, 16);
    g.fillStyle = ok ? css(P.lime) : "#3a3170";
    g.fillRect(8, 48, w - 16, 14);
    g.fillStyle = ok ? "#1a1440" : css(P.white, 0.6);
    g.font = "bold 8px monospace";
    g.fillText(ok ? "#48213 INTEGRADO" : "AGUARDANDO...", 13, 51);
  };
}

/* ---------------------------------- peças ---------------------------------- */

function tree(kit: Kit, parent: Object3D, x: number, z: number, s: number, kind: number) {
  const t = new Group();
  t.position.set(x, 0, z);
  t.scale.setScalar(s);
  parent.add(t);
  part(t, cyl(0.06, 0.09, 0.4, 5), kit.std(P.wood), [0, 0.2, 0]);
  if (kind === 0) {
    part(t, new ConeGeometry(0.36, 0.7, 6), kit.std(P.leaf), [0, 0.65, 0]);
    part(t, new ConeGeometry(0.26, 0.5, 6), kit.std(P.green), [0, 0.98, 0]);
  } else {
    part(t, new IcosahedronGeometry(0.38, 0), kit.std(kind === 1 ? P.green : 0xf28fb5), [0, 0.68, 0]);
  }
}

function truck(kit: Kit, cargoTex: ReturnType<Kit["paint"]>["tex"]) {
  const root = new Group();
  const body = new Group();
  root.add(body);
  part(body, box(1.7, 0.16, 0.62), kit.std(P.ink), [0, 0.3, 0]);
  part(body, box(1.1, 0.72, 0.66), kit.std(0xffffff, { map: cargoTex }), [-0.28, 0.75, 0]);
  part(body, box(0.5, 0.56, 0.64), kit.std(P.coral), [0.58, 0.66, 0]);
  part(body, box(0.04, 0.24, 0.54), kit.std(0x2b3d66, { roughness: 0.3 }), [0.84, 0.78, 0]);
  part(body, box(0.5, 0.06, 0.64), kit.std(P.white), [0.58, 0.97, 0]);
  for (const z of [-0.22, 0.22]) part(body, box(0.03, 0.06, 0.1), kit.std(P.yellow, { emissive: P.yellow, emissiveIntensity: 0.8 }), [0.84, 0.48, z]);
  const wheels: Mesh[] = [];
  for (const x of [0.55, -0.35, -0.7])
    for (const z of [-0.32, 0.32]) {
      const w = part(root, cyl(0.15, 0.15, 0.12, 8), kit.std(P.tire), [x, 0.15, z], [Math.PI / 2, 0, 0]);
      part(w, cyl(0.07, 0.07, 0.13, 6), kit.std(P.steel));
      wheels.push(w);
    }
  return { root, body, wheels };
}

function ribbon(curve: CatmullRomCurve3, width: number, y: number, n = 220) {
  const pos: number[] = [];
  const idx: number[] = [];
  const p = new Vector3();
  const t = new Vector3();
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    curve.getPointAt(u % 1, p);
    curve.getTangentAt(u % 1, t);
    const nx = -t.z;
    const nz = t.x;
    const len = Math.hypot(nx, nz) || 1;
    pos.push(p.x + (nx / len) * width * 0.5, y, p.z + (nz / len) * width * 0.5);
    pos.push(p.x - (nx / len) * width * 0.5, y, p.z - (nz / len) * width * 0.5);
    if (i < n) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function checkShape() {
  const s = new Shape();
  s.moveTo(-0.34, 0.04);
  s.lineTo(-0.1, -0.22);
  s.lineTo(0.36, 0.28);
  s.lineTo(0.24, 0.38);
  s.lineTo(-0.1, 0.0);
  s.lineTo(-0.22, 0.14);
  s.closePath();
  const geo = new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false });
  geo.center();
  return geo;
}

/* ---------------------------------- cena ---------------------------------- */

function build(scene: Object3D, kit: Kit, compact: boolean): Built {
  const world = new Group();
  scene.add(world);

  /* tabuleiro: grama sobre terra, como maquete de isopor */
  const grass = kit.noise(0x67c47c, 0.09, 8, 13, [6, 4]);
  const dirt = kit.noise(0x7a5238, 0.12, 8, 17, [6, 1]);
  const dirtMat = kit.std(0xffffff, { map: dirt });
  part(world, box(14.8, 0.3, 8.4), kit.std(P.ink), [0, -0.95, 0.4]);
  part(world, box(14.2, 0.8, 7.8), [dirtMat, dirtMat, kit.std(0xffffff, { map: grass }), dirtMat, dirtMat, dirtMat], [0, -0.4, 0.4]);

  /* estrada em circuito, passando pelo CD e pela loja */
  const loop = new CatmullRomCurve3(
    [
      v3(4.6, 0, 0.75),
      v3(5.5, 0, 1.9),
      v3(4.4, 0, 2.9),
      v3(2.0, 0, 2.95),
      v3(0.6, 0, 2.95),
      v3(-2.2, 0, 2.9),
      v3(-3.5, 0, 2.3),
      v3(-3.4, 0, 1.0),
      v3(-1.6, 0, 0.7),
      v3(2.2, 0, 0.72),
      v3(3.9, 0, 0.6),
    ],
    true,
    "catmullrom",
    0.5,
  );
  part(world, ribbon(loop, 0.95, 0.012), kit.std(0x3a3f50));
  part(world, ribbon(loop, 1.15, 0.006), kit.std(0xd8d2c0));
  const dash = box(0.24, 0.01, 0.05);
  const dashMat = kit.std(P.white);
  const p = new Vector3();
  const tan = new Vector3();
  for (let i = 0; i < 70; i++) {
    const u = i / 70;
    loop.getPointAt(u, p);
    loop.getTangentAt(u, tan);
    part(world, dash, dashMat, [p.x, 0.022, p.z], [0, Math.atan2(-tan.z, tan.x), 0]);
  }
  let uStore = 0;
  let best = Infinity;
  for (let i = 0; i < 400; i++) {
    loop.getPointAt(i / 400, p);
    const d = p.distanceToSquared(v3(NODE.store.x, 0, 2.95));
    if (d < best) {
      best = d;
      uStore = i / 400;
    }
  }

  /* --------------------------- depositante --------------------------- */
  const dep = new Group();
  dep.position.copy(NODE.dep);
  world.add(dep);
  part(dep, box(2.0, 0.1, 1.8), kit.std(0xcfc8b8), [0, 0.05, 0]);
  part(dep, box(1.5, 1.7, 1.3), kit.std(0xffffff, { map: windows(kit, P.coral, 0xbfe7ff, 3) }), [0, 0.95, 0]);
  part(dep, box(1.62, 0.12, 1.42), kit.std(P.ink), [0, 1.86, 0]);
  part(dep, box(0.4, 0.2, 0.3), kit.std(P.steel), [0.4, 2.02, -0.2]);
  part(dep, box(0.36, 0.5, 0.06), kit.std(P.ink), [0, 0.35, 0.66]);
  part(dep, cyl(0.03, 0.03, 0.6, 5), kit.std(P.steel), [-0.45, 2.2, 0.1]);
  part(dep, new IcosahedronGeometry(0.06, 0), kit.std(P.sky, { emissive: P.sky, emissiveIntensity: 1 }), [-0.45, 2.52, 0.1]);
  const depRing = glow(part(dep, new RingGeometry(0.5, 0.6, 24), kit.basic(P.sky, { transparent: true, opacity: 0, side: DoubleSide, depthWrite: false }), [0, 1.95, 0], [-Math.PI / 2, 0, 0]));
  const depRingMat = depRing.material as MeshBasicMaterial;
  const depAnchor = new Object3D();
  depAnchor.position.set(0, 2.85, 0);
  dep.add(depAnchor);

  /* ------------------------------ Zenlog ------------------------------ */
  const zen = new Group();
  zen.position.copy(NODE.zen);
  world.add(zen);
  part(zen, cyl(1.05, 1.15, 0.3, 6), kit.std(P.slate), [0, 0.15, 0]);
  part(zen, cyl(0.8, 0.9, 0.25, 6), kit.std(P.ink), [0, 0.42, 0]);
  part(zen, cyl(0.48, 0.6, 1.4, 6), kit.std(P.ink), [0, 1.24, 0]);
  const band = kit.std(P.lime, { emissive: P.lime, emissiveIntensity: 0.7 });
  for (const y of [0.85, 1.3, 1.75]) part(zen, cyl(0.52 - (y - 0.85) * 0.06, 0.55 - (y - 0.85) * 0.06, 0.07, 6), band, [0, y, 0]);
  part(zen, cyl(0.18, 0.5, 0.26, 6), kit.std(P.slate), [0, 2.07, 0]);
  const core = glow(part(zen, new IcosahedronGeometry(0.32, 0), kit.basic(P.lime), [0, 2.65, 0]));
  const orbit = glow(part(zen, new TorusGeometry(0.62, 0.025, 4, 28), kit.basic(P.lime, { transparent: true, opacity: 0.7 }), [0, 2.65, 0]));
  const orbit2 = glow(part(zen, new TorusGeometry(0.8, 0.018, 4, 32), kit.basic(P.white, { transparent: true, opacity: 0.35 }), [0, 2.65, 0]));
  const zenAnchor = new Object3D();
  zenAnchor.position.set(0, 3.55, 0);
  zen.add(zenAnchor);

  /* -------------------------------- ERP -------------------------------- */
  const erp = new Group();
  erp.position.copy(NODE.erp);
  world.add(erp);
  part(erp, box(2.1, 0.1, 1.7), kit.std(0xcfc8b8), [0, 0.05, 0]);
  const leds = kit.paint(32, 64, () => undefined);
  const drawLeds = (seed: number) =>
    leds.redraw((g, w, h) => {
      const rand = rng(seed);
      g.fillStyle = "#151827";
      g.fillRect(0, 0, w, h);
      for (let y = 3; y < h; y += 8) {
        g.fillStyle = "#262b42";
        g.fillRect(2, y - 1, w - 4, 6);
        for (let x = 4; x < w - 4; x += 5) {
          const r = rand();
          g.fillStyle = r < 0.35 ? css(P.lime) : r < 0.5 ? css(P.sky) : r < 0.56 ? css(P.coral) : "#30364f";
          g.fillRect(x, y + 1, 2, 2);
        }
      }
    });
  drawLeds(1);
  const rackMat = kit.std(0xffffff, { map: leds.tex, emissive: 0xffffff, emissiveMap: leds.tex, emissiveIntensity: 0.6 });
  for (const x of [-0.5, 0.15]) {
    part(erp, box(0.55, 1.5, 0.6), [kit.std(P.ink), kit.std(P.ink), kit.std(P.slate), kit.std(P.ink), rackMat, kit.std(P.ink)], [x, 0.85, -0.35]);
  }
  for (const x of [-0.72, 0.72]) part(erp, box(0.07, 1.6, 0.07), kit.std(P.slate), [x, 0.8, 0.45]);
  part(erp, box(1.62, 0.96, 0.1), kit.std(P.ink), [0, 2.0, 0.45]);
  const erpTex = kit.paint(128, 72, paintErp("TOTVS", false));
  glow(part(erp, new PlaneGeometry(1.5, 0.84), kit.basic(0xffffff, { map: erpTex.tex }), [0, 2.0, 0.505]));
  const erpAnchor = new Object3D();
  erpAnchor.position.set(0, 2.85, 0.45);
  erp.add(erpAnchor);

  /* ----------------------------- CD / armazém ----------------------------- */
  const cd = new Group();
  cd.position.copy(NODE.cd);
  world.add(cd);
  const ribs = kit.paint(128, 64, (g, w, h) => {
    g.fillStyle = css(P.sky);
    g.fillRect(0, 0, w, h);
    g.fillStyle = css(P.sky, 0.84);
    for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h);
    g.fillStyle = css(P.white);
    g.fillRect(0, 6, w, 4);
  }).tex;
  part(cd, box(2.6, 1.4, 2.0), kit.std(0xffffff, { map: ribs }), [0, 0.7, 0]);
  const roofShape = new Shape();
  roofShape.moveTo(-1.45, 0);
  roofShape.lineTo(1.45, 0);
  roofShape.lineTo(0, 0.62);
  roofShape.closePath();
  const roofGeo = new ExtrudeGeometry(roofShape, { depth: 2.2, bevelEnabled: false });
  roofGeo.translate(0, 0, -1.1);
  part(cd, roofGeo, kit.std(P.orange), [0, 1.4, 0]);
  part(cd, box(1.1, 1.0, 0.05), kit.std(P.ink), [0, 0.5, 1.01]);
  const door = part(cd, box(1.0, 0.92, 0.05), kit.std(0xd9dde6), [0, 0.5, 1.04]);
  for (const [x, z, c] of [
    [1.65, 0.4, P.cardboard],
    [1.65, -0.2, P.cardboard],
    [1.7, 0.1, P.yellow],
  ] as const)
    part(cd, box(0.45, 0.4, 0.45), kit.std(c), [x, c === P.yellow ? 0.6 : 0.2, z]);
  const parcel = part(world, box(0.3, 0.3, 0.3), kit.std(P.cardboard), [NODE.cd.x, 0.35, NODE.cd.z + 1.1]);
  const cdAnchor = new Object3D();
  cdAnchor.position.set(0, 2.55, 0);
  cd.add(cdAnchor);

  /* ------------------------------ cliente final ------------------------------ */
  const store = new Group();
  store.position.copy(NODE.store);
  world.add(store);
  const awning = kit.paint(64, 16, (g, w, h) => {
    for (let x = 0; x < w; x += 8) {
      g.fillStyle = x % 16 ? css(P.white) : css(P.coral);
      g.fillRect(x, 0, 8, h);
    }
  }).tex;
  part(store, box(1.3, 0.9, 0.9), kit.std(0xffffff, { map: windows(kit, P.yellow, 0xbfe7ff, 9) }), [0, 0.45, 0]);
  part(store, box(1.4, 0.1, 1.0), kit.std(P.ink), [0, 0.95, 0]);
  part(store, box(1.4, 0.06, 0.45), kit.std(0xffffff, { map: awning }), [0, 0.78, 0.62], [0.35, 0, 0]);
  part(store, box(0.3, 0.5, 0.04), kit.std(P.ink), [0.3, 0.25, 0.46]);
  const storeAnchor = new Object3D();
  storeAnchor.position.set(0, 1.45, 0);
  store.add(storeAnchor);
  const popAnchor = new Object3D();
  popAnchor.position.set(0, 2.25, 0.9);
  store.add(popAnchor);
  const badge = new Group();
  badge.position.set(0, 1.75, 0.6);
  store.add(badge);
  glow(part(badge, cyl(0.32, 0.32, 0.08, 12), kit.std(P.lime, { emissive: P.lime, emissiveIntensity: 0.5 }), [0, 0, 0], [Math.PI / 2, 0, 0]));
  glow(part(badge, checkShape(), kit.std(P.white), [0, 0, 0.06]));
  badge.scale.setScalar(0.001);

  /* árvores e arbustos */
  const rand = rng(5);
  for (const [x, z] of [
    [-6.4, -3.0],
    [-4.6, -2.9],
    [-0.75, -3.1],
    [2.8, -3.0],
    [6.5, -2.8],
    [6.4, 0.4],
    [-6.5, -0.6],
    [-4.4, -0.9],
    [-2.0, 1.8],
    [2.4, 1.75],
    [3.6, 1.9],
    [6.4, 3.6],
    [-6.4, 3.8],
    [3.0, 3.95],
    [-1.6, 3.95],
    [-4.4, 3.9],
  ])
    tree(kit, world, x + (rand() - 0.5) * 0.3, z, 0.8 + rand() * 0.5, Math.floor(rand() * 3));

  /* ----------------------------- caminhão ----------------------------- */
  const cargo = kit.paint(128, 64, (g, w, h) => {
    g.fillStyle = css(P.white);
    g.fillRect(0, 0, w, h);
    g.fillStyle = css(P.lime);
    g.fillRect(0, 36, w, 10);
    g.fillStyle = css(P.ink);
    g.font = "bold 14px monospace";
    g.textBaseline = "top";
    g.fillText("zenlog", 18, 14);
  }).tex;
  const van = truck(kit, cargo);
  world.add(van.root);

  const truckAt = (t: number) => {
    let u = 0;
    if (t >= DRIVE_OUT[0] && t < DRIVE_OUT[1]) u = uStore * smooth(seg(t, DRIVE_OUT[0], DRIVE_OUT[1]));
    else if (t >= DRIVE_OUT[1] && t < DRIVE_BACK[0]) u = uStore;
    else if (t >= DRIVE_BACK[0]) u = uStore + (1 - uStore) * smooth(seg(t, DRIVE_BACK[0], DRIVE_BACK[1]));
    return u % 1;
  };

  /* ------------------------------ fluxos de dados ------------------------------ */
  const top = {
    dep: NODE.dep.clone().add(v3(0, 2.2, 0)),
    zen: NODE.zen.clone().add(v3(0, 3.0, 0)),
    erp: NODE.erp.clone().add(v3(0, 2.6, 0.45)),
    cd: NODE.cd.clone().add(v3(0, 2.2, 0)),
    store: NODE.store.clone().add(v3(0, 1.2, 0)),
    truck: loop.getPointAt(truckAt(STATUS[3].start)).add(v3(0, 1.1, 0)),
  };
  const arc = (a: Vector3, b: Vector3, lift: number, push: number) =>
    new QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(v3(0, lift, push)), b);

  const out = [arc(top.dep, top.zen, 1.3, 0.7), arc(top.zen, top.erp, 1.3, 0.7), arc(top.erp, top.cd, 1.2, 0.7)];
  const back = STATUS.map((s) => arc(top[s.from], top.dep, s.from === "zen" ? 1.6 : 2.6, s.from === "store" || s.from === "truck" ? -0.6 : -1.0));

  const outTube = kit.basic(P.orange, { transparent: true, opacity: 0.32, depthWrite: false });
  const backTube = kit.basic(P.sky, { transparent: true, opacity: 0.18, depthWrite: false });
  out.forEach((c) => glow(part(world, new TubeGeometry(c, 40, 0.03, 4), outTube)));
  back.forEach((c) => glow(part(world, new TubeGeometry(c, 48, 0.02, 4), backTube)));

  /* o pedido: um cartão laranja que fica lima quando o Zenlog valida */
  const paper = kit.paint(48, 32, (g, w, h) => {
    g.fillStyle = css(P.white);
    g.fillRect(0, 0, w, h);
    g.fillStyle = css(P.ink, 2.2);
    for (let y = 12; y < h - 4; y += 5) g.fillRect(6, y, 20 + ((y * 7) % 14), 2);
    g.fillStyle = css(P.ink);
    g.fillRect(0, 0, w, 7);
  }).tex;
  const cardColor = kit.std(P.orange, {}); // material próprio: muda de cor sem afetar o telhado do CD
  const order = new Group();
  world.add(order);
  glow(part(order, box(0.5, 0.06, 0.36), [cardColor, cardColor, kit.std(0xffffff, { map: paper }), cardColor, cardColor, cardColor]));
  glow(part(order, box(0.5, 0.02, 0.36), cardColor, [0, -0.04, 0]));
  const orange = new Color(P.orange);
  const lime = new Color(P.lime);

  const pulses = STATUS.map(() => {
    const g = new Group();
    glow(part(g, new IcosahedronGeometry(0.17, 0), kit.basic(P.sky)));
    glow(part(g, new IcosahedronGeometry(0.34, 1), kit.basic(P.sky, { transparent: true, opacity: 0.25, depthWrite: false })));
    world.add(g);
    const trail = Array.from({ length: compact ? 2 : 4 }, (_, i) =>
      glow(part(world, new IcosahedronGeometry(0.075 - i * 0.012, 0), kit.basic(P.sky, { transparent: true, opacity: 0.6 - i * 0.12 }))),
    );
    return { g, trail };
  });

  /* confete na entrega */
  const confettiColors = [P.lime, P.coral, P.sky, P.yellow, P.violet, P.pink];
  const confetti = Array.from({ length: compact ? 12 : 22 }, (_, i) => {
    const m = glow(part(world, box(0.07, 0.07, 0.02), kit.std(confettiColors[i % confettiColors.length], { emissive: confettiColors[i % confettiColors.length], emissiveIntensity: 0.4 })));
    m.userData.v = v3((rand() - 0.5) * 2.4, 2.6 + rand() * 1.6, (rand() - 0.2) * 1.6);
    m.userData.s = v3(rand() * 9, rand() * 9, rand() * 9);
    return m;
  });
  const confettiOrigin = NODE.store.clone().add(v3(0, 1.4, 0.6));

  /* -------------------------------- animação -------------------------------- */
  let ledTick = -1;
  let erpKey = "";
  let prevU = 0;

  const update = (t: number, lap: number) => {
    /* LEDs do servidor piscando */
    const tick = Math.floor(t * 4);
    if (tick !== ledTick) {
      ledTick = tick;
      drawLeds(tick + 3);
    }

    /* tela do ERP alterna TOTVS / Senior a cada volta */
    const name = lap % 2 ? "Senior" : "TOTVS";
    const ok = t >= 4.8 && t < 14.5;
    const key = name + ok;
    if (key !== erpKey) {
      erpKey = key;
      erpTex.redraw(paintErp(name, ok));
    }

    /* Zenlog: núcleo acelera enquanto valida */
    const busy = bump(t, 1.9, 3.5);
    core.rotation.set(t * (0.7 + busy * 5), t * (0.9 + busy * 6), 0);
    core.scale.setScalar(1 + busy * 0.25 + Math.sin(t * 3) * 0.04);
    orbit.rotation.set(Math.PI / 2 + Math.sin(t * 0.7) * 0.4, 0, t * (0.8 + busy * 4));
    orbit2.rotation.set(Math.PI / 2.4, t * 0.5, -t * 0.3);
    band.emissiveIntensity = 0.6 + busy * 1.2;

    /* pedido */
    let visible = true;
    let scale = 1;
    if (t < 0.35) {
      out[0].getPoint(0, order.position);
      scale = easeOutBack(seg(t, 0, 0.35));
    } else if (t < 2.0) out[0].getPoint(smooth(seg(t, 0.35, 2.0)), order.position);
    else if (t < 3.4) {
      out[0].getPoint(1, order.position);
      order.position.y += Math.sin(t * 4) * 0.06;
    } else if (t < 4.8) out[1].getPoint(smooth(seg(t, 3.4, 4.8)), order.position);
    else if (t < 5.8) {
      out[1].getPoint(1, order.position);
      order.position.y += Math.sin(t * 4) * 0.06;
    } else if (t < 7.0) out[2].getPoint(smooth(seg(t, 5.8, 7.0)), order.position);
    else if (t < 7.3) {
      out[2].getPoint(1, order.position);
      scale = 1 - seg(t, 7.0, 7.3);
    } else visible = false;
    order.visible = visible;
    order.scale.setScalar(Math.max(0.001, scale) * 1.5);
    order.rotation.set(Math.sin(t * 2) * 0.25, t * 1.6, Math.cos(t * 2) * 0.2);
    cardColor.color.copy(orange).lerp(lime, seg(t, 2.9, 3.2));

    /* status voltando ao depositante */
    STATUS.forEach((s, i) => {
      const { g, trail } = pulses[i];
      const on = t >= s.start && t <= s.end;
      const u = smooth(seg(t, s.start, s.end));
      g.visible = on;
      if (on) back[i].getPoint(u, g.position);
      g.rotation.set(t * 3, t * 4, 0);
      trail.forEach((dot, k) => {
        dot.visible = on && u - (k + 1) * 0.04 > 0;
        if (dot.visible) back[i].getPoint(u - (k + 1) * 0.04, dot.position);
      });
    });
    let ripple = 0;
    for (const s of STATUS) if (t >= s.end && t < s.end + 0.9) ripple = seg(t, s.end, s.end + 0.9);
    if (t < 0.9) ripple = seg(t, 0, 0.9);
    depRingMat.opacity = ripple > 0 ? (1 - ripple) * 0.9 : 0;
    depRingMat.color.set(t < 0.9 ? P.orange : P.sky);
    depRing.scale.setScalar(0.6 + ripple * 1.4);

    /* CD: porta sobe, volume entra no caminhão */
    const open = smooth(seg(t, 6.9, 7.2)) * (1 - smooth(seg(t, 7.5, 7.8)));
    door.scale.y = Math.max(0.05, 1 - open * 0.92);
    door.position.y = 0.5 + open * 0.42;
    const load = seg(t, 7.0, 7.5);
    parcel.visible = t >= 7.0 && t < 7.5;
    parcel.position.set(NODE.cd.x, 0.35 + bump(t, 7.0, 7.5) * 0.25, NODE.cd.z + 1.1 + load * 0.9);

    /* caminhão */
    const u = truckAt(t);
    loop.getPointAt(u, p);
    loop.getTangentAt(u, tan);
    van.root.position.copy(p);
    van.root.rotation.y = Math.atan2(-tan.z, tan.x);
    let du = u - prevU;
    if (du < -0.5) du += 1;
    prevU = u;
    const moving = Math.abs(du) > 1e-5;
    van.wheels.forEach((w) => (w.rotation.y -= (du * loop.getLength()) / 0.15));
    van.body.position.y = moving ? Math.abs(Math.sin(t * 22)) * 0.015 : 0;

    /* entrega: selo + confete */
    const pop = easeOutBack(seg(t, 10.6, 11.1)) * (1 - smooth(seg(t, 14.2, 14.8)));
    badge.scale.setScalar(Math.max(0.001, pop));
    badge.rotation.y = Math.sin(t * 2) * 0.4;
    const tau = t - 10.6;
    confetti.forEach((c) => {
      c.visible = tau > 0 && tau < 1.6;
      if (!c.visible) return;
      const vel = c.userData.v as Vector3;
      const spin = c.userData.s as Vector3;
      c.position.set(confettiOrigin.x + vel.x * tau, confettiOrigin.y + vel.y * tau - 4.2 * tau * tau, confettiOrigin.z + vel.z * tau);
      c.rotation.set(spin.x * tau, spin.y * tau, spin.z * tau);
    });
  };

  return {
    update,
    anchors: { dep: depAnchor, zen: zenAnchor, erp: erpAnchor, cd: cdAnchor, store: storeAnchor, storePop: popAnchor },
  };
}

export function createZenlogScene(options: SceneOptions): SceneHandle {
  return runStage(options, {
    duration: 15.5,
    still: 11.4,
    fov: 30,
    target: [-0.8, 1.0, 0.9],
    offset: [5.9, 13.2, 18.2],
    aspect: 1.3,
    fit: 0.75,
    build: (scene, kit, compact) => build(scene, kit, compact),
  });
}
