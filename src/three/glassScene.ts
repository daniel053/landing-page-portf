/* Cena 3D do Hero: vidro sobre preto, uma luz lima. Carregada sob demanda (import dinâmico). */
import {
  ACESFilmicToneMapping,
  CapsuleGeometry,
  Color,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type GlassScene = { dispose: () => void };

type Options = {
  canvas: HTMLCanvasElement;
  /** Elemento observado: a cena só renderiza enquanto ele está na tela. */
  host: HTMLElement;
  accent: string;
  reducedMotion: boolean;
  /** Telas pequenas: menos pixels e menos objetos. */
  compact: boolean;
};

function glass(extra: Partial<ConstructorParameters<typeof MeshPhysicalMaterial>[0]> = {}) {
  return new MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    thickness: 0.9,
    ior: 1.5,
    dispersion: 3,
    envMapIntensity: 0.9,
    clearcoat: 0.5,
    clearcoatRoughness: 0.05,
    specularIntensity: 0.8,
    ...extra,
  });
}

export function createGlassScene({ canvas, host, accent, reducedMotion, compact }: Options): GlassScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  /* fundo preto opaco + mix-blend-mode: screen no CSS: o preto some e só o vidro aparece.
     (com fundo transparente o three clareia a refração e o vidro fica leitoso) */
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  const camera = new PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 10);

  const lime = new Color(accent);

  /* Luz: chave branca suave + contra-luz lima, que é o que "acende" a borda do vidro. */
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 4, 5);
  const rim = new PointLight(lime, 26, 14, 1.6);
  rim.position.set(2.6, -1.2, -2.5);
  scene.add(key, rim);

  const rig = new Group();
  scene.add(rig);

  /* 1. Anel: substitui o anel plano atrás do retrato. */
  const ring = new Mesh(new TorusGeometry(1.25, 0.07, 48, 220), glass({ thickness: 0.4, iridescence: 0.35 }));
  ring.position.set(0, 0, -1.2);
  ring.rotation.set(0.32, -0.38, 0);
  rig.add(ring);

  /* Núcleo lima atrás do anel: dá ao vidro algo para refratar. */
  const halo = new Mesh(
    new TorusGeometry(1.25, 0.012, 8, 220),
    new MeshBasicMaterial({ color: lime, transparent: true, opacity: 0.55 }),
  );
  halo.position.copy(ring.position);
  halo.rotation.copy(ring.rotation);
  halo.position.z -= 0.05;
  rig.add(halo);

  /* 2. Volume (caixa de carga) com um chip lima dentro. */
  const box = new Group();
  const shell = new Mesh(new RoundedBoxGeometry(0.5, 0.5, 0.5, 6, 0.1), glass({ thickness: 1.4 }));
  const chip = new Mesh(new IcosahedronGeometry(0.11, 0), new MeshBasicMaterial({ color: lime }));
  box.add(chip, shell);
  /* no celular o canto de cima é do título: o cubo desce para o lado do ombro */
  const boxY = compact ? -0.8 : 1.22;
  box.position.set(compact ? 1.62 : 1.42, boxY, 0.3);
  rig.add(box);

  /* 3. Cápsula pequena, mais perto da câmera. */
  const pill = new Mesh(new CapsuleGeometry(0.11, 0.34, 8, 24), glass({ thickness: 0.6 }));
  pill.position.set(-1.45, -1.05, 0.9);
  pill.rotation.z = 0.9;
  if (!compact) rig.add(pill);

  /* ------------------------------ ciclo de vida ------------------------------ */

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  let visible = true;
  let running = false;
  const t0 = performance.now();

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    rig.rotation.y = pointer.x * 0.22;
    rig.rotation.x = pointer.y * 0.12;

    ring.rotation.z = t * 0.08;
    halo.rotation.z = ring.rotation.z;

    box.rotation.set(t * 0.21, t * 0.29, 0);
    box.position.y = boxY + Math.sin(t * 0.8) * 0.09;
    chip.rotation.set(-t * 0.6, t * 0.9, 0);

    pill.rotation.x = t * 0.35;
    pill.position.y = -1.05 + Math.sin(t * 0.65 + 1.4) * 0.11;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  const sync = () => {
    const should = visible && !document.hidden && !reducedMotion;
    if (should && !running) {
      running = true;
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  const onPointer = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", sync);
  if (!reducedMotion) window.addEventListener("pointermove", onPointer, { passive: true });

  resize();
  sync();

  return {
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointer);
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          (object.material as MeshPhysicalMaterial).dispose();
        }
      });
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
