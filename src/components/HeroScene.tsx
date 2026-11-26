import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../hooks";
import type { GlassScene } from "../three/glassScene";

/**
 * Canvas 3D atrás do retrato. O three.js só é baixado depois que a página fica ociosa,
 * então não atrasa o primeiro carregamento. Sem WebGL (ou com ?fx=off) fica o anel em CSS.
 */
export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = document.documentElement;
    if (!canvas || !root.classList.contains("fx")) return;

    let scene: GlassScene | undefined;
    let cancelled = false;

    const start = () => {
      import("../three/glassScene")
        .then(({ createGlassScene }) => {
          if (cancelled) return;
          scene = createGlassScene({
            canvas,
            host: canvas.closest(".hero") ?? canvas,
            accent: getComputedStyle(root).getPropertyValue("--accent").trim() || "#c6f432",
            reducedMotion: prefersReducedMotion(),
            compact: window.matchMedia("(max-width: 640px)").matches,
          });
          root.classList.add("has-3d");
        })
        .catch(() => {
          /* sem WebGL ou falha no download: o anel em CSS continua lá */
        });
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 1500 })
      : window.setTimeout(start, 600);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      scene?.dispose();
      root.classList.remove("has-3d");
    };
  }, []);

  return <canvas className="hero-scene" ref={canvasRef} aria-hidden="true" />;
}
