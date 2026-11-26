/* PapeAI: um celular com um sagui low-poly saindo da tela. Interativo, não é um ciclo fixo:
   a cabeça segue o mouse, o sagui reage a clipes (acenar, pensar, comemorar…), mexe a boca
   quando "fala" e a chave de API (BYOK) voa e entra no aparelho. Carregado sob demanda. */
import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  Raycaster,
  RingGeometry,
  Scene,
  Shape,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { buildMonkey } from "./monkey";
import { css, glow, Kit, P, part, rng, seg, smooth } from "./stage";

export type Clip = "idle" | "wave" | "think" | "happy" | "thumbs" | "facepalm" | "celebrate";

export type PapeOptions = {
  canvas: HTMLCanvasElement;
  /** Elemento observado: só renderiza enquanto está na tela. */
  host: HTMLElement;
  /** Filhos com data-anchor="head|key|phone" seguem o objeto 3D de mesmo nome. */
  overlay: HTMLElement;
  reducedMotion: boolean;
  compact: boolean;
  /** Clique no sagui. */
  onPoke: () => void;
};

export type PapeHandle = {
  play: (clip: Clip) => void;
  /** Mexe a boca por alguns segundos. */
  talk: (seconds: number) => void;
  /** A chave sai da órbita e entra na lateral do celular; onDone quando ela encaixa. */
  connectKey: (onDone?: () => void) => void;
  dispose: () => void;
};

const PHONE = 0x161925;

type Pose = {
  y: number;
  spin: number;
  yaw: number;
  pitch: number;
  roll: number;
  rZ: number;
  rX: number;
  rE: number;
  lZ: number;
  lX: number;
  lE: number;
  thumb: number;
  squint: number;
  look: number;
  /** Sobrancelhas: 1 = erguidas (curioso), -1 = franzidas. */
  brow: number;
};

const REST: Pose = { y: 0, spin: 0, yaw: 0, pitch: 0, roll: 0, rZ: 0.18, rX: -0.15, rE: -0.35, lZ: -0.18, lX: -0.15, lE: -0.35, thumb: 0, squint: 0, look: 1, brow: 0 };

const DURATION: Record<Clip, number> = { idle: 0, wave: 1.9, think: Infinity, happy: 1.15, thumbs: 1.6, facepalm: 1.9, celebrate: 2.0 };

/** Pose de cada clipe no instante ct (s desde o início). Sem movimento: osc = 0. */
function clipPose(clip: Clip, ct: number, osc: number): Partial<Pose> {
  switch (clip) {
    case "wave":
      return { rZ: 2.55, rX: -0.25, rE: -0.25 + Math.sin(ct * 13) * 0.55 * osc, roll: 0.14, squint: 0.7, brow: 0.6 };
    case "think":
      return { rZ: -0.25, rX: -1.15, rE: -2.15, roll: -0.2, pitch: -0.18, look: 0.25, lZ: -0.3, lX: -0.5, lE: -1.2, brow: 1 };
    case "happy": {
      const hop = Math.abs(Math.sin((ct / 0.55) * Math.PI)) * osc;
      return { y: hop * 0.34, rZ: 2.3, lZ: -2.3, rE: -0.3, lE: -0.3, squint: 1, pitch: -0.12, brow: 0.8 };
    }
    case "thumbs":
      return { rZ: 1.0, rX: -0.55, rE: -1.25, thumb: 1, roll: 0.12, squint: 0.75, yaw: -0.15, look: 0.4, brow: 0.5 };
    case "facepalm":
      return { rZ: -0.45, rX: -1.75, rE: -0.45, pitch: 0.45, yaw: 0, roll: -0.12, look: 0, lZ: -0.25, brow: -1 };
    case "celebrate": {
      const hop = Math.abs(Math.sin((ct / 0.5) * Math.PI)) * osc;
      return { y: hop * 0.42, spin: smooth(Math.min(1, ct / 1.1)) * Math.PI * 2 * osc, rZ: 2.6, lZ: -2.6, rE: -0.2, lE: -0.2, squint: 1, brow: 1 };
    }
    default:
      return {};
  }
}

/* ------------------------------- chave (BYOK) ------------------------------- */

function apiKey(kit: Kit) {
  const key = new Group();
  const m = kit.std(P.lime, { emissive: P.lime, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.35 });
  part(key, new TorusGeometry(0.26, 0.085, 8, 18), m, [0, 0, 0]);
  part(key, new BoxGeometry(0.78, 0.11, 0.1), m, [0.62, 0, 0]);
  part(key, new BoxGeometry(0.1, 0.2, 0.1), m, [0.86, -0.13, 0]);
  part(key, new BoxGeometry(0.1, 0.14, 0.1), m, [0.68, -0.1, 0]);
  /* o "miolo" do aro, para ler como chave e não como anel */
  part(key, new CircleGeometry(0.17, 16), kit.basic(0x0d1a05), [0, 0, 0.01]);
  part(key, new CircleGeometry(0.17, 16), kit.basic(0x0d1a05), [0, 0, -0.01], [0, Math.PI, 0]);
  /* centraliza o giro no meio da chave */
  key.children.forEach((child) => (child.position.x -= 0.42));
  return key;
}

/* --------------------------------- tela --------------------------------- */

type ScreenState = { connected: boolean; level: number; seed: number };

function paintScreen(s: ScreenState) {
  return (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.clearRect(0, 0, w, h);
    const r = 14;
    g.beginPath();
    g.roundRect(0, 0, w, h, r);
    g.closePath();
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#141c38");
    bg.addColorStop(1, "#090d1a");
    g.fillStyle = bg;
    g.fill();
    g.save();
    g.clip();

    /* câmera frontal */
    g.fillStyle = "#05070d";
    g.beginPath();
    g.roundRect(w / 2 - 14, 5, 28, 7, 4);
    g.fill();

    /* cabeçalho do app */
    g.fillStyle = css(P.lime);
    g.beginPath();
    g.arc(17, 28, 8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#0a0a0a";
    g.fillRect(13, 26, 2, 2);
    g.fillRect(19, 26, 2, 2);
    g.fillRect(15, 31, 4, 1);
    g.fillStyle = "#f5f5f4";
    g.font = "bold 10px monospace";
    g.textBaseline = "top";
    g.fillText("PapeAI", 30, 20);
    g.font = "6px monospace";
    g.fillStyle = s.connected ? css(P.lime) : "rgba(245,245,244,0.5)";
    g.fillText(s.connected ? "● online" : "○ sem chave", 30, 31);

    /* cadeado: aberto sem chave, lima quando a chave está no aparelho */
    const lx = 108;
    g.strokeStyle = s.connected ? css(P.lime) : "rgba(245,245,244,0.45)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(lx, s.connected ? 25 : 22, 4, Math.PI, 0);
    g.stroke();
    g.fillStyle = s.connected ? css(P.lime) : "rgba(245,245,244,0.45)";
    g.fillRect(lx - 6, 25, 12, 9);

    g.fillStyle = "rgba(255,255,255,0.06)";
    g.fillRect(8, 44, w - 16, 1);

    if (s.connected) {
      /* conversa em miniatura */
      const rand = rng(s.seed + 3);
      const bubble = (x: number, y: number, bw: number, mine: boolean) => {
        g.fillStyle = mine ? css(P.lime, 0.92) : "#273152";
        g.beginPath();
        g.roundRect(x, y, bw, 15, 6);
        g.fill();
        g.fillStyle = mine ? "rgba(10,10,10,0.55)" : "rgba(245,245,244,0.45)";
        let cx = x + 6;
        while (cx < x + bw - 10) {
          const ww = 4 + Math.floor(rand() * 10);
          g.fillRect(cx, y + 6, Math.min(ww, x + bw - 6 - cx), 3);
          cx += ww + 3;
        }
      };
      bubble(8, 54, 74, false);
      bubble(w - 70, 74, 62, true);
      bubble(8, 94, 86, false);
      g.fillStyle = "rgba(245,245,244,0.4)";
      g.font = "6px monospace";
      g.fillText("you said: \"I went\" ✓", 10, 116);
    } else {
      /* convite para colar a chave */
      g.strokeStyle = "rgba(198,244,50,0.55)";
      g.setLineDash([3, 3]);
      g.lineWidth = 1;
      g.beginPath();
      g.roundRect(14, 58, w - 28, 54, 8);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = css(P.lime);
      g.beginPath();
      g.arc(46, 80, 6, 0, Math.PI * 2);
      g.fill();
      g.fillRect(50, 78, 26, 4);
      g.fillRect(70, 82, 4, 5);
      g.fillStyle = "#141c38";
      g.beginPath();
      g.arc(46, 80, 2.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(245,245,244,0.7)";
      g.font = "7px monospace";
      g.fillText("cole sua chave", 34, 96);
    }

    /* microfone e forma de onda (sobe quando o sagui fala) */
    const my = h - 22;
    const wave = rng(s.seed);
    g.fillStyle = s.connected ? css(P.lime, 0.85) : "rgba(245,245,244,0.18)";
    for (let i = 0; i < 9; i++) {
      const amp = 2 + (s.level * 12 + 1) * wave();
      g.fillRect(10 + i * 5, my - amp / 2, 3, amp);
      g.fillRect(w - 13 - i * 5, my - amp / 2, 3, amp);
    }
    g.fillStyle = s.connected ? css(P.lime) : "#2a3352";
    g.beginPath();
    g.arc(w / 2, my, 11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = s.connected ? "#0a0a0a" : "rgba(245,245,244,0.5)";
    g.beginPath();
    g.roundRect(w / 2 - 3, my - 7, 6, 10, 3);
    g.fill();
    g.fillRect(w / 2 - 0.5, my + 3, 1, 3);

    g.restore();
  };
}

/* bolhas de fala que flutuam ao redor: volume com chanfro, texto nítido e sombra suave */
const BUBBLE_FONT = (px: number) => `700 ${px}px Archivo, "Segoe UI", system-ui, sans-serif`;
const BUBBLE_H = 0.62;
const BUBBLE_TEXT = 0.22;
/* resolução do texto: px por unidade de mundo */
const PPU = 220;

function bubbleShape(w: number, h: number, r: number, tailRight: boolean) {
  const x0 = -w / 2;
  const x1 = w / 2;
  const y0 = -h / 2;
  const y1 = h / 2;
  const s = new Shape();
  s.moveTo(x0 + r, y0);
  /* rabinho na borda de baixo, do lado do sagui */
  const a = tailRight ? x1 - r - 0.3 : x0 + r + 0.08;
  s.lineTo(a, y0);
  if (tailRight) s.lineTo(a + 0.32, y0 - 0.2);
  else s.lineTo(a - 0.06, y0 - 0.2);
  s.lineTo(a + 0.22, y0);
  s.lineTo(x1 - r, y0);
  s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r);
  s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

/** Sombra desfocada compartilhada (o rect fica fora do canvas; só a sombra aparece). */
function bubbleShadow(kit: Kit) {
  const { tex } = kit.paint(128, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.shadowColor = "rgba(0,0,0,1)";
    g.shadowBlur = 14;
    g.shadowOffsetX = 1000;
    g.fillStyle = "#000";
    g.beginPath();
    g.roundRect(18 - 1000, 16, w - 36, h - 32, 14);
    g.fill();
  });
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  return tex;
}

function floatingBubble(kit: Kit, text: string, accent: boolean, tailRight: boolean, shadowTex: Texture) {
  const g = document.createElement("canvas").getContext("2d")!;
  g.font = BUBBLE_FONT(100);
  /* largura medida no texto real + folga: nada fica cortado */
  const w = Math.max(1.05, (g.measureText(text).width / 100) * BUBBLE_TEXT + 0.5);
  const group = new Group();

  const color = accent ? P.lime : 0xf3f1ea;
  const body = new ExtrudeGeometry(bubbleShape(w, BUBBLE_H, 0.24, tailRight), {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.045,
    bevelSegments: 3,
    curveSegments: 6,
  });
  body.translate(0, 0, -0.04);
  part(group, body, kit.std(color, { flatShading: false, roughness: 0.5, metalness: 0, emissive: color, emissiveIntensity: accent ? 0.16 : 0.07 }));

  const draw = (c: CanvasRenderingContext2D, cw: number, ch: number) => {
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = "#141622";
    c.font = BUBBLE_FONT(Math.round(BUBBLE_TEXT * PPU));
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, cw / 2, ch / 2 + 2);
  };
  const label = kit.paint(Math.ceil(w * PPU), Math.ceil(BUBBLE_H * PPU), draw);
  label.tex.magFilter = LinearFilter;
  label.tex.minFilter = LinearMipmapLinearFilter;
  part(group, new PlaneGeometry(w, BUBBLE_H), kit.basic(0xffffff, { map: label.tex, transparent: true, depthWrite: false }), [0, 0, 0.1]);

  const shadow = part(
    group,
    new PlaneGeometry(w + 0.7, BUBBLE_H + 0.6),
    kit.basic(0x000000, { map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false }),
    [0.1, -0.16, -0.3],
  );
  shadow.renderOrder = -1;

  return { group: glow(group), redraw: () => label.redraw(draw) };
}

/* --------------------------------- cena --------------------------------- */

export function createPapeScene(opts: PapeOptions): PapeHandle {
  const { canvas, host, overlay, reducedMotion, compact, onPoke } = opts;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const kit = new Kit();
  const target = new Vector3(0.15, 0.05, 0);

  const hemi = new HemisphereLight(0xeef3ff, 0x3a2f48, 1.25);
  const sun = new DirectionalLight(0xfff0d8, 2.4);
  sun.position.set(5, 9, 9);
  sun.target.position.copy(target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  /* contra-luz lima: recorta o pelo do sagui contra o fundo escuro */
  const rim = new DirectionalLight(P.lime, 1.6);
  rim.position.set(-6, 4, -5);
  const back = new DirectionalLight(0x9fbcff, 0.6);
  back.position.set(6, 3, -6);
  scene.add(hemi, sun, sun.target, rim, back);

  /* ------------------------------- celular ------------------------------- */
  const phone = new Group();
  phone.rotation.set(-0.04, -0.34, 0.03);
  scene.add(phone);

  const shell = kit.std(PHONE, { flatShading: false, roughness: 0.4, metalness: 0.45 });
  part(phone, new RoundedBoxGeometry(3.3, 6.5, 0.34, 4, 0.42), shell);
  /* moldura fina lima na borda */
  const frame = kit.std(P.lime, { flatShading: false, emissive: P.lime, emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.4 });
  part(phone, new BoxGeometry(0.05, 0.62, 0.12), frame, [1.665, 1.6, 0]);
  part(phone, new BoxGeometry(0.05, 0.36, 0.12), shell, [-1.665, 1.9, 0]);
  part(phone, new BoxGeometry(0.05, 0.36, 0.12), shell, [-1.665, 1.4, 0]);

  const screenState: ScreenState = { connected: false, level: 0, seed: 1 };
  const screen = kit.paint(128, 256, paintScreen(screenState));
  glow(part(phone, new PlaneGeometry(3.02, 6.04), kit.basic(0xffffff, { map: screen.tex, transparent: true }), [0, 0, 0.176]));
  const screenGlow = new PointLight(0x7f9cff, 2.2, 7, 2);
  screenGlow.position.set(0, 1.2, 1.4);
  phone.add(screenGlow);

  /* palco que sai da tela: o sagui "pula" do celular para o mundo */
  const padY = -2.5;
  const padZ = 1.15;
  const pad = part(phone, new CylinderGeometry(1.15, 1.22, 0.14, 40), kit.std(0x1f2436, { flatShading: false, roughness: 0.55, metalness: 0.3 }), [0, padY, padZ]);
  pad.receiveShadow = true;
  const rimMat = kit.basic(P.lime);
  glow(part(phone, new TorusGeometry(1.2, 0.025, 6, 60), rimMat, [0, padY + 0.07, padZ], [Math.PI / 2, 0, 0]));
  const haloMat = kit.basic(P.lime, { transparent: true, opacity: 0.18, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
  const halo = glow(part(phone, new RingGeometry(1.25, 1.75, 48), haloMat, [0, padY + 0.02, padZ], [-Math.PI / 2, 0, 0]));
  const under = new PointLight(P.lime, 2.4, 4, 2);
  under.position.set(0, padY + 0.5, padZ + 0.4);
  phone.add(under);

  /* folhas da Mata Atlântica na base */
  const leafMats = [kit.std(P.leaf), kit.std(P.green), kit.std(0x2f8a55)];
  const leaves: Mesh[] = [];
  const rand = rng(17);
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? 1 : -1;
    const leaf = part(
      phone,
      new IcosahedronGeometry(0.32, 0),
      leafMats[i % 3],
      [side * (1.05 + rand() * 0.55), padY - 0.1 + rand() * 0.5, padZ - 0.6 + rand() * 0.9],
      [rand() * 2, rand() * 3, side * (0.6 + rand() * 0.6)],
    );
    leaf.scale.set(0.55, 1.6 + rand() * 0.6, 0.18);
    leaf.userData.k = rand() * 6;
    leaves.push(leaf);
  }

  /* sagui */
  const mono = buildMonkey(kit);
  mono.root.position.set(0, padY + 0.07, padZ);
  mono.root.rotation.y = 0.3;
  mono.root.scale.setScalar(1.42);
  phone.add(mono.root);

  /* chave */
  const key = apiKey(kit);
  phone.add(key);
  const keyAnchor = new Object3D();
  key.add(keyAnchor);
  const slot = new Vector3(1.72, 1.6, 0);
  const phoneAnchor = new Object3D();
  phoneAnchor.position.set(0, 3.42, 0.2);
  phone.add(phoneAnchor);

  /* pulso quando a chave entra */
  const pulseMat = kit.basic(P.lime, { transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
  const pulse = glow(part(phone, new RingGeometry(0.9, 1.0, 48), pulseMat, [0, 0, 0.2]));

  /* bolhas */
  const shadowTex = bubbleShadow(kit);
  const bubbles = [
    { text: "Hello!", accent: false, pos: [-3.0, 2.2, -0.6] },
    { text: "How's it going?", accent: false, pos: [3.1, 0.2, -0.8] },
    { text: "I went ✓", accent: true, pos: [-3.25, -0.7, 0.2] },
    { text: "ABC", accent: false, pos: [2.7, 2.9, -1.4] },
  ].map((b, i) => {
    const bubble = floatingBubble(kit, b.text, b.accent, b.pos[0] < 0, shadowTex);
    const mesh = bubble.group;
    mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
    mesh.userData.base = mesh.position.clone();
    mesh.userData.k = i * 1.7;
    mesh.userData.redraw = bubble.redraw;
    scene.add(mesh);
    return mesh;
  });
  /* o texto é desenhado de novo quando a fonte do site termina de carregar */
  let disposed = false;
  document.fonts?.ready.then(() => {
    if (disposed) return;
    bubbles.forEach((b) => b.userData.redraw());
    if (!running) draw(0);
  });

  scene.traverse((object) => {
    if (object instanceof Mesh && !object.userData.fx) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  /* -------------------------------- câmera -------------------------------- */
  const camera = new PerspectiveCamera(30, 1.1, 0.5, 100);
  const offset = new Vector3(1.6, 1.3, 16.5);
  const designAspect = 1.05;
  let distance = 1;

  const labels = Array.from(overlay.querySelectorAll<HTMLElement>("[data-anchor]"));
  const anchors: Record<string, Object3D> = { head: mono.headAnchor, key: keyAnchor, phone: phoneAnchor };
  const v = new Vector3();
  const placeLabels = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    for (const el of labels) {
      const obj = anchors[el.dataset.anchor ?? ""];
      if (!obj) continue;
      obj.getWorldPosition(v).project(camera);
      let x = (v.x + 1) * 0.5 * w;
      /* data-clamp: mantém o filho (centralizado na âncora) inteiro dentro do palco */
      if (el.dataset.clamp !== undefined) {
        const half = ((el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0) / 2 + 12;
        x = Math.min(Math.max(x, half), Math.max(half, w - half));
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${((1 - v.y) * 0.5 * h).toFixed(1)}px, 0)`;
    }
  };

  /* --------------------------------- estado --------------------------------- */
  let clock = 0;
  let clip: Clip = "idle";
  let clipAt = 0;
  let talkUntil = -1;
  let keyAt = -1;
  let keyDone: (() => void) | undefined;
  let blinkAt = 2.4;
  let screenTick = 0;
  const pose: Pose = { ...REST };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, cx: 0, cy: 0 };
  const headScreen = new Vector3();
  const qFrom = new Quaternion();
  const qTo = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);
  const posFrom = new Vector3();
  const tmp = new Vector3();
  const lime = new Color(P.lime);
  const dim = new Color(0x3c4a1a);

  const orbit = (t: number, out: Vector3) => {
    const a = t * 0.55;
    return out.set(Math.cos(a) * 2.55, 1.55 + Math.sin(t * 1.4) * 0.18, 0.35 + Math.sin(a) * 1.3);
  };

  const update = (dt: number) => {
    const t = clock;
    const osc = reducedMotion ? 0 : 1;

    /* clipe atual (one-shots voltam sozinhos para idle) */
    let ct = t - clipAt;
    if (clip !== "idle" && ct > DURATION[clip]) {
      clip = "idle";
      ct = 0;
    }
    const target: Pose = { ...REST, ...clipPose(clip, reducedMotion ? DURATION[clip] * 0.45 : ct, osc) };

    /* olhar: segue o mouse em qualquer lugar da página */
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 6);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 6);
    target.yaw += pointer.x * 0.75 * target.look;
    target.pitch += pointer.y * 0.42 * target.look;

    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 11);
    (Object.keys(pose) as (keyof Pose)[]).forEach((name) => {
      pose[name] += (target[name] - pose[name]) * k;
    });

    /* aplica a pose */
    const breathe = Math.sin(t * 2.2) * 0.018 * osc;
    mono.body.position.y = pose.y;
    mono.body.scale.set(1 - breathe * 0.5, 1 + breathe, 1 - breathe * 0.5);
    mono.body.rotation.y = pose.spin + pose.yaw * 0.25;
    mono.head.rotation.set(pose.pitch, pose.yaw * 0.75, pose.roll + Math.sin(t * 0.9) * 0.03 * osc);
    mono.right.shoulder.rotation.set(pose.rX, 0, pose.rZ);
    mono.right.elbow.rotation.set(pose.rE, 0, 0);
    mono.left.shoulder.rotation.set(pose.lX, 0, pose.lZ);
    mono.left.elbow.rotation.set(pose.lE, 0, 0);
    mono.right.thumb.scale.setScalar(Math.max(0.001, pose.thumb));

    /* piscar */
    if (t > blinkAt + 0.16) blinkAt = t + 2 + Math.random() * 3.2;
    const blink = t > blinkAt && osc ? Math.sin(seg(t, blinkAt, blinkAt + 0.16) * Math.PI) : 0;
    const eyeY = Math.max(0.08, (1 - blink) * (1 - pose.squint * 0.3));
    mono.eyes.forEach((eye) => eye.scale.set(1, eyeY, 1));
    /* as pupilas acompanham o cursor além do giro da cabeça */
    mono.balls.forEach((ball) => ball.rotation.set(pointer.y * 0.32 * pose.look, pointer.x * 0.42 * pose.look, 0));
    /* sobrancelhas: sobem quando está curioso ou feliz, descem no facepalm; no "pensar" uma sobe mais */
    mono.brows.forEach((brow, i) => {
      const lift = pose.brow * (i === 1 ? 1 : 0.55) + pose.squint * 0.25;
      brow.position.y = brow.userData.y + lift * 0.02;
      brow.rotation.z = brow.userData.z + (i ? -1 : 1) * Math.min(0, pose.brow) * 0.25;
    });

    /* boca: abre e fecha enquanto fala */
    const talking = t < talkUntil;
    const open = talking && osc ? 0.35 + 0.65 * Math.abs(Math.sin(t * 17) * Math.sin(t * 5.3 + 1)) : talking ? 0.6 : 0;
    mono.mouth.scale.y += (Math.max(0.001, open) - mono.mouth.scale.y) * Math.min(1, dt * 20 + (reducedMotion ? 1 : 0));

    /* orelhas e cauda */
    mono.ears.forEach((ear, i) => (ear.rotation.x = Math.sin(t * 2.6 + i) * 0.06 * osc + (talking ? Math.sin(t * 9) * 0.04 * osc : 0)));
    mono.tail.forEach((s, i) => {
      const base = s.userData.base as { x: number; z: number };
      s.rotation.x = base.x + Math.sin(t * 1.6 - i * 0.45) * 0.05 * osc;
      s.rotation.z = base.z + Math.sin(t * 1.3 - i * 0.55) * 0.07 * osc;
    });
    mono.updateTail();

    /* folhas e bolhas */
    leaves.forEach((leaf) => (leaf.rotation.x += Math.sin(t * 1.4 + leaf.userData.k) * 0.002 * osc));
    bubbles.forEach((b) => {
      const base = b.userData.base as Vector3;
      b.position.set(base.x, base.y + Math.sin(t * 1.1 + b.userData.k) * 0.16 * osc, base.z);
      b.rotation.y = Math.sin(t * 0.7 + b.userData.k) * 0.25 * osc;
    });

    /* chave: orbita até ser "colada", depois voa e entra na lateral */
    if (keyAt < 0) {
      orbit(reducedMotion ? 1.2 : t, key.position);
      key.rotation.set(0.25, -t * 0.55 * osc + 0.6, Math.sin(t * 1.7) * 0.25 * osc);
      key.scale.setScalar(1);
    } else {
      const kt = t - keyAt;
      const fly = smooth(seg(kt, 0, 1.1));
      tmp.set(slot.x + 0.95, slot.y, slot.z);
      key.position.lerpVectors(posFrom, tmp, fly);
      key.position.z += Math.sin(fly * Math.PI) * 0.9;
      key.quaternion.slerpQuaternions(qFrom, qTo, fly);
      const slide = smooth(seg(kt, 1.15, 1.5));
      key.position.x -= slide * 0.7;
      key.scale.setScalar(Math.max(0.001, 1 - smooth(seg(kt, 1.45, 1.7))));
      if (kt > 1.5 && !screenState.connected) {
        screenState.connected = true;
        screen.redraw(paintScreen(screenState));
        keyDone?.();
        keyDone = undefined;
      }
      const p = seg(kt, 1.5, 2.6);
      pulse.scale.setScalar(1 + p * 3.2);
      pulseMat.opacity = p > 0 && p < 1 ? (1 - p) * 0.55 : 0;
    }
    frame.emissive.copy(screenState.connected ? lime : dim);

    /* tela: forma de onda acompanha a fala */
    const level = talking ? 0.4 + 0.6 * Math.abs(Math.sin(t * 7)) : 0;
    screenTick += dt;
    if (screenState.connected && (talking || screenState.level > 0) && screenTick > 0.09) {
      screenTick = 0;
      screenState.level = level;
      screenState.seed = (screenState.seed + 1) % 997;
      screen.redraw(paintScreen(screenState));
    }

    /* palco */
    haloMat.opacity = 0.14 + Math.sin(t * 2) * 0.05 * osc;
    halo.scale.setScalar(1 + Math.sin(t * 2) * 0.02 * osc);
    under.intensity = 2.2 + (talking ? 0.8 : 0);

    /* o celular flutua de leve */
    phone.position.y = Math.sin(t * 0.8) * 0.08 * osc;
  };

  /* ------------------------------- laço ------------------------------- */
  const draw = (dt: number) => {
    update(dt);
    const yaw = pointer.cx * 0.12;
    const o = offset.clone().multiplyScalar(distance);
    camera.position.set(target.x + o.x * Math.cos(yaw) - o.z * Math.sin(yaw), target.y + o.y - pointer.cy * 0.8, target.z + o.x * Math.sin(yaw) + o.z * Math.cos(yaw));
    camera.lookAt(target);
    renderer.render(scene, camera);
    placeLabels();
    mono.head.getWorldPosition(headScreen).project(camera);
  };

  let raf = 0;
  let last = 0;
  let running = false;
  let visible = true;
  /* com movimento reduzido o laço só roda por instantes, para aplicar uma mudança */
  let awakeUntil = 0;

  const frameFn = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reducedMotion) clock += dt;
    draw(dt);
    if (reducedMotion && now > awakeUntil) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frameFn);
  };

  const sync = () => {
    const should = visible && !document.hidden && (!reducedMotion || performance.now() < awakeUntil);
    if (should && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frameFn);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  const wake = (ms = 400) => {
    awakeUntil = performance.now() + ms;
    sync();
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    distance = camera.aspect < designAspect ? Math.pow(designAspect / camera.aspect, 0.55) : 1;
    camera.updateProjectionMatrix();
    if (!running) draw(0);
  };

  /* mouse: a câmera mexe pouco (só sobre o palco); o olhar do sagui vale para a página toda */
  const onPointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const hx = rect.left + ((headScreen.x + 1) / 2) * rect.width;
    const hy = rect.top + ((1 - headScreen.y) / 2) * rect.height;
    pointer.tx = Math.max(-1, Math.min(1, (event.clientX - hx) / (window.innerWidth * 0.45)));
    pointer.ty = Math.max(-1, Math.min(1, (event.clientY - hy) / (window.innerHeight * 0.5)));
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    pointer.cx = inside ? pointer.cx + (((event.clientX - rect.left) / rect.width) * 2 - 1 - pointer.cx) * 0.15 : pointer.cx * 0.9;
    pointer.cy = inside ? pointer.cy + (((event.clientY - rect.top) / rect.height) * 2 - 1 - pointer.cy) * 0.15 : pointer.cy * 0.9;
    if (inside) host.style.cursor = hit(event) ? "pointer" : "";
    if (reducedMotion) wake();
  };

  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const hit = (event: PointerEvent | MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(mono.root, true).length > 0;
  };
  const onClick = (event: MouseEvent) => {
    if (hit(event)) onPoke();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pointermove", onPointer, { passive: true });
  canvas.addEventListener("click", onClick);

  resize();
  wake(600);
  sync();

  return {
    play(next) {
      clip = next;
      clipAt = clock;
      wake(700);
    },
    talk(seconds) {
      talkUntil = clock + (reducedMotion ? 0 : seconds);
      wake(400);
    },
    connectKey(onDone) {
      if (keyAt >= 0) return;
      keyDone = onDone;
      keyAt = clock;
      posFrom.copy(key.position);
      qFrom.copy(key.quaternion);
      if (reducedMotion) {
        clock += 3;
        screenState.connected = true;
        screen.redraw(paintScreen(screenState));
        window.setTimeout(() => onDone?.(), 0);
        keyDone = undefined;
      }
      wake(700);
    },
    dispose() {
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("click", onClick);
      host.style.cursor = "";
      scene.traverse((object) => {
        if (object instanceof Mesh) object.geometry.dispose();
      });
      kit.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

