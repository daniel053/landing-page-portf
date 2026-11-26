/* Base das maquetes low-poly da seção Projetos: renderer, luz, câmera, ciclo de vida,
   texturas de 128 px desenhadas em canvas e etiquetas HTML que acompanham a cena. */
import {
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type MeshBasicMaterialParameters,
  type MeshStandardMaterialParameters,
} from "three";

export type SceneOptions = {
  canvas: HTMLCanvasElement;
  /** Elemento observado: só renderiza enquanto está na tela. Também recebe o mouse (paralaxe). */
  host: HTMLElement;
  /** Camada de etiquetas: filhos com data-anchor="nome" seguem o objeto 3D de mesmo nome. */
  overlay: HTMLElement;
  /** Instantes (s) que mudam o texto da página; a cena avisa quando cada um passa. */
  marks: number[];
  reducedMotion: boolean;
  compact: boolean;
  onMark: (index: number, loop: number) => void;
};

export type SceneHandle = {
  dispose: () => void;
  /** Pula para um instante do ciclo (clique num passo). */
  seek: (time: number) => void;
};

export type Built = {
  update: (t: number, loop: number, dt: number) => void;
  anchors: Record<string, Object3D>;
};

export type StageConfig = {
  duration: number;
  /** Quadro usado quando o usuário pede menos movimento. */
  still: number;
  fov: number;
  target: [number, number, number];
  /** Câmera = alvo + deslocamento. */
  offset: [number, number, number];
  /** Proporção para a qual a câmera foi enquadrada; telas mais estreitas afastam a câmera. */
  aspect: number;
  /** Quanto a câmera recua em telas mais estreitas que `aspect` (1 = mantém tudo; menor = aproxima). */
  fit?: number;
  build: (scene: Scene, kit: Kit, compact: boolean) => Built;
};

/* --------------------------------- paleta --------------------------------- */

export const P = {
  lime: 0xc6f432,
  yellow: 0xffc93c,
  orange: 0xff8a3d,
  coral: 0xff5d73,
  pink: 0xff9bd2,
  sky: 0x5cc8ff,
  blue: 0x3d6bff,
  violet: 0x8b6cff,
  teal: 0x2dd4bf,
  green: 0x5fcf80,
  leaf: 0x3fae6a,
  cardboard: 0xc99459,
  wood: 0xa8743f,
  white: 0xf3f1ea,
  cream: 0xe9e1cf,
  steel: 0x8b93a7,
  slate: 0x343a4b,
  ink: 0x1d2030,
  tire: 0x222222,
  skin: 0xf1c09a,
};

/* --------------------------------- tempo --------------------------------- */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0→1 entre a e b. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (x: number) => x * x * (3 - 2 * x);
export const easeOutBack = (x: number) => {
  const c = 1.70158;
  return x <= 0 ? 0 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
/** Sobe e desce uma vez entre a e b. */
export const bump = (t: number, a: number, b: number) => Math.sin(seg(t, a, b) * Math.PI);

export function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------ materiais/texturas ------------------------------ */

const toRgb = (hex: number) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
export const css = (hex: number, k = 1) => {
  const [r, g, b] = toRgb(hex).map((c) => Math.round(Math.min(255, Math.max(0, c * k))));
  return `rgb(${r},${g},${b})`;
};

export type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

export class Kit {
  private owned: { dispose: () => void }[] = [];
  private cache = new Map<number, MeshStandardMaterial>();

  /** Material fosco de faces chapadas (o visual low-poly). Sem `extra`, reaproveita por cor. */
  std(color: number, extra?: MeshStandardMaterialParameters) {
    if (!extra && this.cache.has(color)) return this.cache.get(color)!;
    const m = new MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.02, ...extra });
    if (!extra) this.cache.set(color, m);
    this.owned.push(m);
    return m;
  }

  basic(color: number, extra?: MeshBasicMaterialParameters) {
    const m = new MeshBasicMaterial({ color, ...extra });
    this.owned.push(m);
    return m;
  }

  /** Textura pixelada (filtro nearest): 128 px esticados em superfícies grandes. */
  paint(w: number, h: number, draw: Painter, repeat?: [number, number]) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    draw(g, w, h);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.magFilter = NearestFilter;
    tex.anisotropy = 4;
    if (repeat) {
      tex.wrapS = tex.wrapT = RepeatWrapping;
      tex.repeat.set(repeat[0], repeat[1]);
    }
    this.owned.push(tex);
    return {
      tex,
      redraw: (fn: Painter) => {
        g.clearRect(0, 0, w, h);
        fn(g, w, h);
        tex.needsUpdate = true;
      },
    };
  }

  /** Ruído em blocos: dá "grão" de pixel art a pisos e paredes. */
  noise(base: number, amount = 0.1, cell = 8, seed = 7, repeat?: [number, number]) {
    return this.paint(
      128,
      128,
      (g, w, h) => {
        const rand = rng(seed);
        for (let y = 0; y < h; y += cell)
          for (let x = 0; x < w; x += cell) {
            g.fillStyle = css(base, 1 + (rand() - 0.5) * 2 * amount);
            g.fillRect(x, y, cell, cell);
          }
      },
      repeat,
    ).tex;
  }

  dispose() {
    this.owned.forEach((item) => item.dispose());
    this.owned = [];
    this.cache.clear();
  }
}

/** Cria a malha, posiciona e pendura no pai. */
export function part(
  parent: Object3D,
  geometry: BufferGeometry,
  material: Material | Material[],
  pos: [number, number, number] = [0, 0, 0],
  rot?: [number, number, number],
) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...pos);
  if (rot) mesh.rotation.set(...rot);
  parent.add(mesh);
  return mesh;
}

/** Marca a malha como efeito (sem sombra). */
export const glow = <T extends Object3D>(object: T) => {
  object.traverse((child) => {
    child.userData.fx = true;
  });
  return object;
};

/* --------------------------------- palco --------------------------------- */

export function runStage(opts: SceneOptions, cfg: StageConfig): SceneHandle {
  const { canvas, host, overlay, marks, reducedMotion, compact, onMark } = opts;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const kit = new Kit();
  const target = new Vector3(...cfg.target);

  /* luz de maquete: céu claro, chão arroxeado, sol quente com sombra e um contra-luz azul */
  const hemi = new HemisphereLight(0xeef3ff, 0x40334f, 1.35);
  const sun = new DirectionalLight(0xfff0d8, 2.6);
  sun.position.set(target.x + 7, 14, target.z + 8);
  sun.target.position.copy(target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  const back = new DirectionalLight(0x9fbcff, 0.7);
  back.position.set(target.x - 9, 6, target.z - 7);
  scene.add(hemi, sun, sun.target, back);

  const built = cfg.build(scene, kit, compact);
  scene.traverse((object) => {
    if (object instanceof Mesh && !object.userData.fx) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  const camera = new PerspectiveCamera(cfg.fov, cfg.aspect, 0.5, 150);
  const offset = new Vector3(...cfg.offset);
  let distance = 1;

  const labels = Array.from(overlay.querySelectorAll<HTMLElement>("[data-anchor]"))
    .map((el) => ({ el, obj: built.anchors[el.dataset.anchor ?? ""] }))
    .filter((item) => item.obj);
  const v = new Vector3();

  const placeLabels = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    for (const { el, obj } of labels) {
      obj.getWorldPosition(v).project(camera);
      el.style.transform = `translate3d(${((v.x + 1) * 0.5 * w).toFixed(1)}px, ${((1 - v.y) * 0.5 * h).toFixed(1)}px, 0)`;
    }
  };

  let lastMark = -1;
  let lastLoop = -1;
  const emit = (t: number, loop: number) => {
    let index = 0;
    for (let i = 0; i < marks.length; i++) if (t >= marks[i]) index = i;
    if (index !== lastMark || loop !== lastLoop) {
      lastMark = index;
      lastLoop = loop;
      onMark(index, loop);
    }
  };

  /* relógio próprio: pausa de verdade quando a cena sai da tela */
  let clock = reducedMotion ? cfg.still : 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const draw = (dt: number) => {
    const loop = Math.floor(clock / cfg.duration);
    const t = clock - loop * cfg.duration;
    built.update(t, loop, dt);

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    const yaw = pointer.x * 0.16;
    const o = offset.clone().multiplyScalar(distance);
    camera.position.set(
      target.x + o.x * Math.cos(yaw) - o.z * Math.sin(yaw),
      target.y + o.y - pointer.y * 1.1,
      target.z + o.x * Math.sin(yaw) + o.z * Math.cos(yaw),
    );
    camera.lookAt(target);

    renderer.render(scene, camera);
    placeLabels();
    emit(t, loop);
  };

  let raf = 0;
  let last = 0;
  let running = false;
  let visible = true;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    draw(dt);
    raf = requestAnimationFrame(frame);
  };

  const sync = () => {
    const should = visible && !document.hidden && !reducedMotion;
    if (should && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    distance = camera.aspect < cfg.aspect ? Math.pow(cfg.aspect / camera.aspect, cfg.fit ?? 0.9) : 1;
    camera.updateProjectionMatrix();
    if (!running) draw(0);
  };

  const onPointer = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointer.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.ty = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };
  const onLeave = () => {
    pointer.tx = 0;
    pointer.ty = 0;
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", sync);
  if (!reducedMotion) {
    host.addEventListener("pointermove", onPointer, { passive: true });
    host.addEventListener("pointerleave", onLeave);
  }

  resize();
  sync();

  return {
    seek(time) {
      const loop = Math.floor(clock / cfg.duration);
      clock = loop * cfg.duration + time + 0.001;
      if (!running) draw(0);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerleave", onLeave);
      scene.traverse((object) => {
        if (object instanceof Mesh) object.geometry.dispose();
      });
      kit.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
