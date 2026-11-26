/* Maquete RFID: a empilhadeira tira o palete da carreta, cruza o portal de antenas,
   o sinal vai ao computador (check), sobe para a nuvem e o escudo aparece. Ciclo de 14 s. */
import {
  AdditiveBlending,
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  Object3D,
  OctahedronGeometry,
  PlaneGeometry,
  QuadraticBezierCurve3,
  RingGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
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

const PORTAL_X = -3.4;
const LANE_Z = 0.4;
const FORK_REACH = 1.41; // centro do palete à frente do centro da empilhadeira
const START_X = -9.3; // dentro da carreta
const DROP_X = 0.4;

const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 8) => new CylinderGeometry(rt, rb, h, seg);

/* ------------------------------- texturas ------------------------------- */

function textures(kit: Kit) {
  const floor = kit.paint(
    128,
    128,
    (g, w, h) => {
      const rand = rng(11);
      for (let y = 0; y < h; y += 8)
        for (let x = 0; x < w; x += 8) {
          g.fillStyle = css(0x596178, 1 + (rand() - 0.5) * 0.16);
          g.fillRect(x, y, 8, 8);
        }
      g.fillStyle = css(0x596178, 0.82);
      for (let i = 0; i <= w; i += 64) {
        g.fillRect(i, 0, 2, h);
        g.fillRect(0, i, w, 2);
      }
    },
    [7, 5],
  ).tex;

  const asphalt = kit.noise(0x2b2f3a, 0.12, 4, 5, [3, 5]);
  const concrete = kit.noise(0x8a8fa0, 0.08, 8, 3, [6, 1]);

  const wall = kit.paint(
    128,
    128,
    (g, w, h) => {
      const rand = rng(21);
      for (let y = 0; y < h; y += 8)
        for (let x = 0; x < w; x += 8) {
          g.fillStyle = css(P.cream, 1 + (rand() - 0.5) * 0.07);
          g.fillRect(x, y, 8, 8);
        }
      g.fillStyle = css(P.cream, 0.84);
      for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 2, h);
      g.fillStyle = css(P.slate, 1.1);
      g.fillRect(0, h - 18, w, 18);
      g.fillStyle = css(P.yellow);
      g.fillRect(0, h - 22, w, 4);
    },
    [6, 1],
  ).tex;

  const hazard = kit.paint(
    128,
    32,
    (g, w, h) => {
      g.fillStyle = css(P.yellow);
      g.fillRect(0, 0, w, h);
      g.fillStyle = css(P.ink);
      for (let x = -h; x < w + h; x += 32) {
        g.beginPath();
        g.moveTo(x, h);
        g.lineTo(x + 16, h);
        g.lineTo(x + 16 + h, 0);
        g.lineTo(x + h, 0);
        g.fill();
      }
    },
    [1, 1],
  ).tex;

  const crate = kit.paint(128, 128, (g, w, h) => {
    const rand = rng(31);
    for (let y = 0; y < h; y += 4)
      for (let x = 0; x < w; x += 4) {
        g.fillStyle = css(P.cardboard, 1 + (rand() - 0.5) * 0.12);
        g.fillRect(x, y, 4, 4);
      }
    g.fillStyle = css(P.cardboard, 0.72);
    g.fillRect(0, 0, w, 4);
    g.fillRect(0, h - 4, w, 4);
    g.fillRect(0, 0, 4, h);
    g.fillRect(w - 4, 0, 4, h);
    g.fillStyle = css(0xe6c48e);
    g.fillRect(0, 56, w, 16);
    g.fillStyle = css(P.white);
    g.fillRect(16, 86, 44, 26);
    g.fillStyle = css(P.ink);
    for (let x = 20; x < 56; x += 4) g.fillRect(x, 90, x % 8 ? 1 : 2, 14);
  }).tex;

  const trailer = kit.paint(128, 64, (g, w, h) => {
    const rand = rng(41);
    for (let y = 0; y < h; y += 4)
      for (let x = 0; x < w; x += 4) {
        g.fillStyle = css(P.blue, 1 + (rand() - 0.5) * 0.1);
        g.fillRect(x, y, 4, 4);
      }
    g.fillStyle = css(P.blue, 0.8);
    for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 1, h);
    g.fillStyle = css(P.white);
    g.fillRect(0, 38, w, 8);
    g.fillStyle = css(P.lime);
    g.fillRect(0, 48, w, 3);
  }).tex;

  return { floor, asphalt, concrete, wall, hazard, crate, trailer };
}

type ScreenState = "idle" | "read" | "send" | "ok";

function paintScreen(state: ScreenState, progress: number) {
  return (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.fillStyle = "#0e1428";
    g.fillRect(0, 0, w, h);
    g.fillStyle = state === "ok" ? css(P.lime) : "#26304f";
    g.fillRect(0, 0, w, 12);
    g.fillStyle = state === "ok" ? "#0e1428" : css(P.white, 0.9);
    g.font = "bold 8px monospace";
    g.textBaseline = "top";
    g.fillText(state === "send" ? "ENVIANDO..." : "RFID  DOCA 02", 4, 2);

    const rows = 6;
    const filled = state === "idle" ? 0 : state === "read" ? Math.floor(progress * rows) : rows;
    for (let i = 0; i < rows; i++) {
      const y = 18 + i * 10;
      g.fillStyle = i < filled ? css(P.lime, 0.85) : "#26304f";
      g.fillRect(6, y, 8, 6);
      g.fillStyle = i < filled ? css(P.white, 0.75) : "#1c2440";
      g.fillRect(18, y + 1, 40 + ((i * 23) % 30), 4);
    }

    if (state === "ok") {
      g.fillStyle = css(P.lime);
      g.beginPath();
      g.arc(100, 46, 18, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#0e1428";
      g.lineWidth = 5;
      g.lineCap = "square";
      g.beginPath();
      g.moveTo(91, 46);
      g.lineTo(98, 53);
      g.lineTo(110, 39);
      g.stroke();
      g.fillStyle = css(P.white);
      g.fillText("24/24 OK", 82, 68);
    }
  };
}

/* -------------------------------- peças -------------------------------- */

function forklift(kit: Kit) {
  const root = new Group();
  const body = kit.std(P.yellow);
  const dark = kit.std(P.ink);
  const steel = kit.std(P.steel);
  const tire = kit.std(P.tire);

  part(root, box(1.4, 0.5, 1.0), body, [0, 0.47, 0]);
  part(root, box(0.42, 0.62, 1.0), kit.std(0xe0a92c), [-0.62, 0.58, 0]);
  part(root, box(0.3, 0.1, 1.02), dark, [0.62, 0.3, 0]);
  part(root, box(0.36, 0.1, 0.42), dark, [-0.15, 0.78, 0]);
  part(root, box(0.08, 0.38, 0.42), dark, [-0.34, 0.99, 0]);

  /* cabine de proteção */
  for (const x of [-0.42, 0.34]) for (const z of [-0.43, 0.43]) part(root, box(0.06, 1.1, 0.06), dark, [x, 1.25, z]);
  part(root, box(0.9, 0.06, 0.96), dark, [-0.04, 1.82, 0]);

  /* operador */
  part(root, cyl(0.15, 0.18, 0.42, 6), kit.std(P.orange), [-0.12, 1.04, 0]);
  part(root, new IcosahedronGeometry(0.13, 0), kit.std(P.skin), [-0.1, 1.38, 0]);
  part(root, new SphereGeometry(0.15, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), kit.std(P.white), [-0.1, 1.42, 0]);
  part(root, new TorusGeometry(0.1, 0.02, 4, 10), dark, [0.2, 1.05, 0], [0, Math.PI / 2, 0.5]);

  /* rodas */
  const wheels: Object3D[] = [];
  for (const [x, r] of [
    [0.45, 0.25],
    [-0.45, 0.21],
  ])
    for (const z of [-0.5, 0.5]) {
      const w = part(root, cyl(r, r, 0.2, 10), tire, [x, r, z], [Math.PI / 2, 0, 0]);
      part(w, cyl(r * 0.5, r * 0.5, 0.21, 6), steel);
      wheels.push(w);
    }

  /* torre + garfos (sobem e descem) */
  for (const z of [-0.33, 0.33]) part(root, box(0.08, 2.0, 0.08), steel, [0.78, 1.08, z]);
  part(root, box(0.08, 0.08, 0.74), steel, [0.78, 2.06, 0]);
  const carriage = new Group();
  carriage.position.set(0, 0.2, 0);
  root.add(carriage);
  part(carriage, box(0.06, 0.5, 0.78), dark, [0.86, 0.26, 0]);
  for (const z of [-0.26, 0.26]) part(carriage, box(1.12, 0.05, 0.12), steel, [1.41, 0.02, z]);

  return { root, wheels, carriage };
}

function pallet(kit: Kit, crate: MeshStandardMaterial, tag: MeshStandardMaterial) {
  const root = new Group();
  const wood = kit.std(P.wood);
  part(root, box(1.1, 0.05, 1.0), wood, [0, 0.13, 0]);
  for (const z of [-0.43, 0, 0.43]) part(root, box(1.1, 0.1, 0.14), wood, [0, 0.05, z]);

  const cube = box(0.5, 0.5, 0.5);
  const tagGeo = new PlaneGeometry(0.2, 0.13);
  for (let level = 0; level < 2; level++)
    for (const x of [-0.26, 0.26])
      for (const z of [-0.26, 0.26]) {
        const y = 0.41 + level * 0.51;
        part(root, cube, crate, [x, y, z], [0, (x + z) * 0.05, 0]);
        const face = z > 0 ? 0.256 : -0.256;
        part(root, tagGeo, tag, [x + 0.08, y + 0.1, z + face], [0, z > 0 ? 0 : Math.PI, 0]);
      }
  return root;
}

function shieldGeometry() {
  const s = new Shape();
  s.moveTo(0, 0.78);
  s.quadraticCurveTo(0.32, 0.64, 0.64, 0.64);
  s.lineTo(0.62, 0.02);
  s.quadraticCurveTo(0.56, -0.5, 0, -0.86);
  s.quadraticCurveTo(-0.56, -0.5, -0.62, 0.02);
  s.lineTo(-0.64, 0.64);
  s.quadraticCurveTo(-0.32, 0.64, 0, 0.78);
  const geo = new ExtrudeGeometry(s, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 1,
    curveSegments: 3,
  });
  geo.center();
  return geo;
}

function checkGeometry(depth = 0.1) {
  const s = new Shape();
  s.moveTo(-0.34, 0.04);
  s.lineTo(-0.1, -0.22);
  s.lineTo(0.36, 0.28);
  s.lineTo(0.24, 0.38);
  s.lineTo(-0.1, 0.0);
  s.lineTo(-0.22, 0.14);
  s.closePath();
  const geo = new ExtrudeGeometry(s, { depth, bevelEnabled: false });
  geo.center();
  return geo;
}

/* --------------------------------- cena --------------------------------- */

function build(scene: Group | Object3D, kit: Kit, compact: boolean): Built {
  const tx = textures(kit);
  const world = new Group();
  scene.add(world);

  /* base, pátio e plataforma da doca */
  const sideConcrete = kit.std(0xffffff, { map: tx.concrete });
  part(world, box(17, 0.3, 9.4), kit.std(P.ink), [-2.2, -1.75, 0]);
  part(world, box(3.4, 0.4, 9.0), [sideConcrete, sideConcrete, kit.std(0xffffff, { map: tx.asphalt }), sideConcrete, sideConcrete, sideConcrete], [-8.7, -1.4, 0]);
  const top = kit.std(0xffffff, { map: tx.floor });
  part(world, box(13, 1.6, 9.0), [sideConcrete, sideConcrete, top, sideConcrete, sideConcrete, sideConcrete], [-0.5, -0.8, 0]);
  for (const z of [-3.2, -2.2, 3.0, 4.0]) part(world, box(0.12, 0.02, 0.5), kit.std(P.white), [-8.7, -1.19, z]);

  /* paredes */
  const wallMat = kit.std(0xffffff, { map: tx.wall });
  part(world, box(13, 2.6, 0.3), wallMat, [-0.5, 1.3, -4.35]);
  part(world, box(0.3, 2.6, 3.4), wallMat, [-6.85, 1.3, -2.8]);

  /* faixa zebrada na borda da doca + para-choques */
  part(world, box(2.8, 0.02, 0.4), kit.std(0xffffff, { map: tx.hazard }), [-6.78, 0.01, LANE_Z], [0, Math.PI / 2, 0]);
  for (const z of [-0.75, 1.55]) part(world, box(0.12, 0.42, 0.34), kit.std(P.tire), [-7.06, -0.3, z]);

  /* moldura do portão da doca */
  for (const z of [-1.0, 1.8])
    for (let i = 0; i < 6; i++) part(world, box(0.26, 0.46, 0.26), kit.std(i % 2 ? P.ink : P.yellow), [-6.9, 0.23 + i * 0.46, z]);
  part(world, box(0.3, 0.3, 3.06), kit.std(P.slate), [-6.9, 2.88, LANE_Z]);
  const dockAnchor = new Object3D();
  dockAnchor.position.set(-6.9, 3.4, LANE_Z);
  world.add(dockAnchor);

  /* carreta encostada: aberta atrás (+x), de lado ela esconde a empilhadeira */
  const trailer = new Group();
  world.add(trailer);
  const trailerSide = kit.std(0xffffff, { map: tx.trailer });
  const trailerIn = kit.std(0x6d7a96);
  part(trailer, box(3.3, 0.14, 2.4), kit.std(P.slate), [-8.65, -0.07, LANE_Z]);
  part(trailer, box(3.3, 2.4, 0.1), trailerSide, [-8.65, 1.2, LANE_Z - 1.2]);
  part(trailer, box(3.3, 2.4, 0.1), trailerSide, [-8.65, 1.2, LANE_Z + 1.2]);
  part(trailer, box(0.1, 2.4, 2.4), trailerIn, [-10.3, 1.2, LANE_Z]);
  part(trailer, box(3.3, 0.1, 2.5), kit.std(P.white), [-8.65, 2.45, LANE_Z]);
  part(trailer, box(3.2, 0.25, 0.22), kit.std(P.ink), [-8.65, -0.27, LANE_Z - 0.75]);
  part(trailer, box(3.2, 0.25, 0.22), kit.std(P.ink), [-8.65, -0.27, LANE_Z + 0.75]);
  for (const x of [-9.75, -8.95])
    for (const z of [LANE_Z - 1.05, LANE_Z + 1.05]) {
      const w = part(trailer, cyl(0.46, 0.46, 0.32, 10), kit.std(P.tire), [x, -0.74, z], [Math.PI / 2, 0, 0]);
      part(w, cyl(0.22, 0.22, 0.34, 6), kit.std(P.steel));
    }
  for (const z of [LANE_Z - 1.22, LANE_Z + 1.22]) part(trailer, box(0.06, 0.12, 0.06), kit.std(P.coral, { emissive: P.coral, emissiveIntensity: 0.6 }), [-7.05, 0.2, z]);

  /* faixas de corredor e área de descarga */
  const laneMat = kit.std(P.yellow);
  for (const z of [LANE_Z - 1.0, LANE_Z + 1.0]) part(world, box(9.4, 0.02, 0.07), laneMat, [-2.0, 0.01, z]);
  const dropMat = kit.std(P.lime, { emissive: P.lime, emissiveIntensity: 0.2 });
  const dx = DROP_X + FORK_REACH;
  part(world, box(1.7, 0.02, 0.08), dropMat, [dx, 0.015, LANE_Z - 0.82]);
  part(world, box(1.7, 0.02, 0.08), dropMat, [dx, 0.015, LANE_Z + 0.82]);
  part(world, box(0.08, 0.02, 1.7), dropMat, [dx + 0.82, 0.015, LANE_Z]);

  /* porta-paletes no fundo */
  const upright = kit.std(P.blue);
  const beam = kit.std(P.orange);
  const deck = kit.std(0x9aa3b8);
  const rand = rng(99);
  const binColors = [P.cardboard, P.cardboard, P.coral, P.sky, P.cardboard, P.teal, P.yellow, P.violet];
  const crateMat = kit.std(0xffffff, { map: tx.crate });
  for (let bay = 0; bay < 3; bay++) {
    const x0 = -2.2 + bay * 2.25;
    for (const x of bay === 0 ? [x0, x0 + 2.2] : [x0 + 2.2])
      for (const z of [-3.05, -4.05]) part(world, box(0.1, 2.45, 0.1), upright, [x, 1.22, z]);
    for (const y of [0.95, 1.85]) {
      for (const z of [-3.05, -4.05]) part(world, box(2.2, 0.1, 0.08), beam, [x0 + 1.1, y, z]);
      part(world, box(2.15, 0.04, 1.0), deck, [x0 + 1.1, y + 0.06, -3.55]);
    }
    for (const y of [0, 1.0, 1.9])
      for (let i = 0; i < 3; i++) {
        if (rand() < 0.22) continue;
        const color = binColors[Math.floor(rand() * binColors.length)];
        const s = 0.42 + rand() * 0.16;
        part(
          world,
          box(s, s * (0.7 + rand() * 0.4), s),
          color === P.cardboard ? crateMat : kit.std(color),
          [x0 + 0.4 + i * 0.7, y + 0.08 + s * 0.4, -3.55 + (rand() - 0.5) * 0.3],
          [0, (rand() - 0.5) * 0.3, 0],
        );
      }
  }

  /* cones e extintor: escala humana */
  for (const [x, z] of [
    [-6.2, -1.5],
    [-6.2, 2.3],
  ]) {
    part(world, box(0.34, 0.04, 0.34), kit.std(P.orange), [x, 0.02, z]);
    part(world, new ConeGeometry(0.14, 0.48, 7), kit.std(P.orange), [x, 0.28, z]);
    part(world, cyl(0.1, 0.12, 0.06, 7), kit.std(P.white), [x, 0.3, z]);
  }
  part(world, cyl(0.09, 0.09, 0.42, 7), kit.std(P.coral), [-6.5, 0.9, -4.12]);

  /* ---------------------------- portal RFID ---------------------------- */
  const steelMat = kit.std(P.steel);
  const panelMat = kit.std(P.white);
  const ledMat = kit.std(P.lime, { emissive: P.lime, emissiveIntensity: 0.4 });
  const antennas: number[] = [];
  for (const [z, dir] of [
    [LANE_Z - 1.45, 1],
    [LANE_Z + 1.45, -1],
  ]) {
    part(world, box(0.5, 0.06, 0.5), kit.std(P.slate), [PORTAL_X, 0.03, z]);
    part(world, box(0.16, 2.75, 0.16), steelMat, [PORTAL_X, 1.38, z]);
    for (const y of [0.85, 1.75]) {
      part(world, box(0.6, 0.72, 0.08), panelMat, [PORTAL_X, y, z + dir * 0.12]);
      part(world, box(0.07, 0.07, 0.03), ledMat, [PORTAL_X + 0.2, y + 0.26, z + dir * 0.17]);
    }
    antennas.push(z + dir * 0.18);
  }
  part(world, box(0.18, 0.18, 3.06), steelMat, [PORTAL_X, 2.8, LANE_Z]);
  part(world, box(0.5, 0.28, 0.36), kit.std(P.ink), [PORTAL_X, 3.03, LANE_Z]);
  const lampMat = kit.std(P.coral, { emissive: P.coral, emissiveIntensity: 0.8 });
  part(world, new IcosahedronGeometry(0.11, 0), lampMat, [PORTAL_X, 3.28, LANE_Z]);
  const portalAnchor = new Object3D();
  portalAnchor.position.set(PORTAL_X, 3.55, LANE_Z);
  world.add(portalAnchor);

  /* ondas: anéis que saem das antenas para o corredor */
  const ringGeo = new RingGeometry(0.3, 0.46, 20);
  /* campo de leitura: um volume lima entre as antenas que acende quando o palete passa */
  const fieldMat = kit.basic(P.lime, { transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
  glow(part(world, box(1.6, 2.4, 2.7), fieldMat, [PORTAL_X, 1.2, LANE_Z]));
  const rings: { mesh: ReturnType<typeof part>; z0: number; dir: number; k: number; mat: MeshBasicMaterial }[] = [];
  antennas.forEach((z0, i) => {
    const dir = i === 0 ? 1 : -1;
    for (let k = 0; k < 4; k++) {
      const mat = kit.basic(P.lime, { transparent: true, opacity: 0, side: DoubleSide, depthWrite: false, blending: AdditiveBlending });
      for (const y of [0.85, 1.75]) {
        const mesh = glow(part(world, ringGeo, mat, [PORTAL_X, y, z0]));
        rings.push({ mesh, z0, dir, k, mat });
      }
    }
  });

  /* ------------------------------ empilhadeira ------------------------------ */
  const tagMat = kit.std(P.lime, { emissive: P.lime, emissiveIntensity: 0.15, side: DoubleSide });
  const lift = forklift(kit);
  lift.root.position.set(START_X, 0, LANE_Z);
  world.add(lift.root);
  const load = pallet(kit, crateMat, tagMat);
  world.add(load);

  /* --------------------------- mesa do computador --------------------------- */
  const desk = new Group();
  desk.position.set(4.0, 0, 2.5);
  desk.rotation.y = -0.45;
  world.add(desk);
  const deskMat = kit.std(0xf0e4cc);
  part(desk, box(1.9, 0.08, 0.9), deskMat, [0, 0.78, 0]);
  for (const x of [-0.88, 0.88]) for (const z of [-0.38, 0.38]) part(desk, box(0.06, 0.76, 0.06), kit.std(P.slate), [x, 0.38, z]);
  part(desk, box(0.42, 0.03, 0.26), kit.std(P.slate), [0, 0.835, -0.18]);
  part(desk, box(0.06, 0.38, 0.06), kit.std(P.slate), [0, 1.02, -0.2]);
  part(desk, box(1.04, 0.66, 0.06), kit.std(P.ink), [0, 1.44, -0.18]);
  const screenTex = kit.paint(128, 80, paintScreen("idle", 0));
  const screen = part(desk, new PlaneGeometry(0.94, 0.56), kit.basic(0xffffff, { map: screenTex.tex }), [0, 1.44, -0.145]);
  glow(screen);
  part(desk, box(0.62, 0.03, 0.2), kit.std(0xd3d7e2), [0, 0.835, 0.16]);
  part(desk, box(0.08, 0.03, 0.12), kit.std(0xd3d7e2), [0.45, 0.835, 0.18]);
  part(desk, cyl(0.06, 0.06, 0.13, 8), kit.std(P.coral), [-0.6, 0.885, 0.12]);
  part(desk, cyl(0.1, 0.08, 0.16, 7), kit.std(P.orange), [-0.75, 0.9, -0.25]);
  part(desk, new IcosahedronGeometry(0.17, 0), kit.std(P.leaf), [-0.75, 1.1, -0.25]);
  part(desk, box(0.26, 0.56, 0.5), kit.std(P.ink), [1.2, 0.28, -0.05]);
  part(desk, box(0.02, 0.04, 0.04), kit.std(P.lime, { emissive: P.lime, emissiveIntensity: 1 }), [1.33, 0.48, 0.12]);
  /* cadeira */
  part(desk, box(0.5, 0.08, 0.5), kit.std(P.violet), [0, 0.5, 0.75]);
  part(desk, box(0.5, 0.55, 0.08), kit.std(P.violet), [0, 0.82, 1.0]);
  part(desk, cyl(0.04, 0.04, 0.4, 6), kit.std(P.slate), [0, 0.27, 0.75]);
  part(desk, cyl(0.28, 0.28, 0.04, 5), kit.std(P.slate), [0, 0.05, 0.75]);
  const pcAnchor = new Object3D();
  pcAnchor.position.set(0, 2.05, -0.18);
  desk.add(pcAnchor);

  /* --------------------------------- nuvem --------------------------------- */
  const cloud = new Group();
  cloud.position.set(-0.2, 5.1, -2.6);
  world.add(cloud);
  const cloudMat = kit.std(0xffffff, { emissive: 0xdfe9ff, emissiveIntensity: 0.15 });
  for (const [r, x, y, z] of [
    [0.78, 0, 0, 0],
    [0.56, -0.86, -0.18, 0.1],
    [0.62, 0.84, -0.12, 0],
    [0.5, 0.32, 0.5, 0.12],
    [0.42, -0.4, 0.42, -0.1],
    [0.4, 1.45, -0.3, 0.05],
  ])
    part(cloud, new IcosahedronGeometry(r, 1), cloudMat, [x, y, z]);
  const cloudAnchor = new Object3D();
  cloudAnchor.position.set(0, 1.25, 0);
  cloud.add(cloudAnchor);

  /* --------------------------------- escudo --------------------------------- */
  const shieldSpot = new Group();
  shieldSpot.position.set(3.1, 3.9, -0.7);
  world.add(shieldSpot);
  const shield = new Group();
  shieldSpot.add(shield);
  part(shield, shieldGeometry(), kit.std(P.lime, { emissive: P.lime, emissiveIntensity: 0.25 }));
  const inner = part(shield, shieldGeometry(), kit.std(0x2f8f3e), [0, 0, 0.1]);
  inner.scale.set(0.74, 0.74, 0.6);
  part(shield, checkGeometry(), kit.std(P.white, { emissive: P.white, emissiveIntensity: 0.2 }), [0, 0, 0.24]);
  const gems: Object3D[] = [];
  [P.sky, P.coral, P.yellow].forEach((color, i) => {
    const gem = glow(part(shieldSpot, new OctahedronGeometry(0.13, 0), kit.std(color, { emissive: color, emissiveIntensity: 0.5 })));
    gem.userData.k = i;
    gems.push(gem);
  });
  const chips = [
    [-1.5, 0.75, 0],
    [1.45, 0.15, 0],
    [0.15, -1.45, 0],
  ].map(([x, y, z]) => {
    const anchor = new Object3D();
    anchor.position.set(x, y, z);
    shieldSpot.add(anchor);
    return anchor;
  });
  shield.scale.setScalar(0.001);

  /* --------------------------- caminho dos dados --------------------------- */
  world.updateMatrixWorld(true);
  const from = new Vector3(PORTAL_X, 3.05, LANE_Z);
  const pcPos = screen.getWorldPosition(new Vector3()).add(new Vector3(0, 0.1, 0.2));
  const cloudPos = cloud.position.clone().add(new Vector3(0.1, -0.3, 0.3));
  const toPc = new QuadraticBezierCurve3(from, new Vector3(0.4, 5.2, 2.0), pcPos);
  const toCloud = new CatmullRomCurve3([pcPos, new Vector3(5.0, 3.4, 1.4), new Vector3(2.4, 6.1, -0.9), cloudPos]);
  const tubeMat = kit.basic(0xffffff, { transparent: true, opacity: 0.12, depthWrite: false });
  glow(part(world, new TubeGeometry(toPc, 48, 0.022, 4), tubeMat));
  glow(part(world, new TubeGeometry(toCloud, 48, 0.022, 4), tubeMat));

  const packet = new Group();
  world.add(packet);
  glow(part(packet, new IcosahedronGeometry(0.15, 0), kit.basic(P.lime)));
  glow(part(packet, new IcosahedronGeometry(0.3, 1), kit.basic(P.lime, { transparent: true, opacity: 0.22, depthWrite: false })));
  const trail = Array.from({ length: compact ? 3 : 6 }, (_, i) =>
    glow(part(world, new IcosahedronGeometry(0.09 - i * 0.011, 0), kit.basic(P.lime, { transparent: true, opacity: 0.7 - i * 0.1 }))),
  );

  /* -------------------------------- animação -------------------------------- */
  const lime = new Color(P.lime);
  const coral = new Color(P.coral);
  const lampColor = new Color();
  let screenKey = "";
  let prevX = START_X;

  const flight = (t: number) => {
    if (t >= 3.9 && t <= 5.5) return { curve: toPc, u: smooth(seg(t, 3.9, 5.5)) };
    if (t >= 5.8 && t <= 7.1) return { curve: toCloud, u: smooth(seg(t, 5.8, 7.1)) };
    return null;
  };

  const update = (t: number) => {
    /* empilhadeira: entra (0–6.4), baixa o garfo (6.4–7), volta de ré (7.2–10.6) */
    let x: number;
    if (t < 6.4) x = START_X + (DROP_X - START_X) * smooth(seg(t, 0, 6.4));
    else if (t < 7.2) x = DROP_X;
    else x = DROP_X + (START_X - DROP_X) * smooth(seg(t, 7.2, 10.6));
    lift.root.position.x = x;
    const dist = x - prevX;
    prevX = x;
    lift.wheels.forEach((w, i) => (w.rotation.y -= dist / (i < 2 ? 0.25 : 0.21)));
    const forkY = t < 6.4 ? 0.2 : t < 7.2 ? 0.2 - 0.18 * smooth(seg(t, 6.4, 7.0)) : 0.02 + 0.18 * smooth(seg(t, 7.2, 7.8));
    lift.carriage.position.y = forkY;
    lift.root.position.y = Math.abs(dist) > 0.002 ? Math.sin(t * 30) * 0.008 : 0;

    /* palete: no garfo, descarregado, depois "guardado" (some) e recarregado na carreta */
    const attached = t < 7.0 || t >= 13.0;
    if (attached) load.position.set(x + FORK_REACH, forkY, LANE_Z);
    else load.position.set(DROP_X + FORK_REACH, 0, LANE_Z);
    const out = smooth(seg(t, 12.0, 12.6));
    const back = t >= 13.0 ? easeOutBack(seg(t, 13.0, 13.6)) : 1;
    load.scale.setScalar(Math.max(0.001, (1 - out) * back));
    if (!attached) load.position.y += out * 1.2;

    /* leitura: o palete dentro do campo das antenas */
    const palletX = load.position.x;
    const inField = attached && t < 7 && Math.abs(palletX - PORTAL_X) < 1.35;
    tagMat.emissiveIntensity = inField ? 0.4 + (Math.sin(t * 38) > 0 ? 0.9 : 0) : t > 3.6 && t < 12.6 ? 0.85 : 0.12;
    for (const ring of rings) {
      const s = (t * 1.5 + ring.k / 4) % 1;
      const on = inField ? 1 : 0;
      ring.mat.opacity = on * (1 - s);
      ring.mesh.position.z = ring.z0 + ring.dir * s * 1.25;
      ring.mesh.scale.setScalar(0.4 + s * 1.3);
    }
    lampColor.copy(t > 3.0 && t < 12.6 ? lime : coral);
    lampMat.color.copy(lampColor);
    lampMat.emissive.copy(lampColor);
    ledMat.emissiveIntensity = inField ? 1.4 : 0.4;
    fieldMat.opacity = inField ? 0.1 + Math.sin(t * 20) * 0.03 : 0;

    /* tela do computador */
    const state: ScreenState = t < 2.5 || t > 12.6 ? "idle" : t < 3.7 ? "read" : t < 5.5 ? "send" : "ok";
    const progress = seg(t, 2.5, 3.6);
    const key = state === "read" ? `read${Math.floor(progress * 6)}` : state;
    if (key !== screenKey) {
      screenKey = key;
      screenTex.redraw(paintScreen(state, progress));
    }

    /* pacote de dados com rastro */
    const f = flight(t);
    packet.visible = !!f;
    trail.forEach((dot, i) => {
      dot.visible = !!f && f.u - (i + 1) * 0.035 > 0;
      if (dot.visible && f) f.curve.getPoint(f.u - (i + 1) * 0.035, dot.position);
    });
    if (f) {
      f.curve.getPoint(f.u, packet.position);
      packet.rotation.set(t * 3, t * 4, 0);
    }

    /* nuvem pulsa quando o dado chega */
    cloud.position.y = 5.1 + Math.sin(t * 1.2) * 0.08;
    cloud.scale.setScalar(1 + 0.14 * bump(t, 7.0, 7.6));

    /* escudo */
    const show = easeOutBack(seg(t, 7.2, 7.9)) * (1 - smooth(seg(t, 12.6, 13.2)));
    shield.scale.setScalar(Math.max(0.001, show));
    shield.rotation.y = Math.sin(t * 0.9) * 0.45;
    shieldSpot.position.y = 3.9 + Math.sin(t * 1.4) * 0.1;
    gems.forEach((gem) => {
      const a = t * 1.3 + (gem.userData.k * Math.PI * 2) / 3;
      gem.position.set(Math.cos(a) * 1.05, Math.sin(a * 2) * 0.25, Math.sin(a) * 1.05 * 0.6);
      gem.rotation.set(t * 2, t * 3, 0);
      gem.scale.setScalar(Math.max(0.001, show));
    });
  };

  return {
    update,
    anchors: { dock: dockAnchor, portal: portalAnchor, pc: pcAnchor, cloud: cloudAnchor, chip1: chips[0], chip2: chips[1], chip3: chips[2] },
  };
}

export function createRfidScene(options: SceneOptions): SceneHandle {
  return runStage(options, {
    duration: 14,
    still: 9.5,
    fov: 30,
    target: [-1.7, 1.5, 0.1],
    offset: [9.4, 11.0, 17.6],
    aspect: 1.3,
    fit: 1,
    build: (scene, kit, compact) => build(scene, kit, compact),
  });
}
