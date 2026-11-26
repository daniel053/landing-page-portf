import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReducedMotion } from "../hooks";

/** Superfícies de vidro: recebem o reflexo que segue o mouse (--gx/--gy). */
export const GLASS =
  ".console, .stat, .pipe-panel, .card, .more-card, .principle, .about-card, .lab-card, .meta-note, .contact-links, .devices li";

/** Das superfícies de vidro, as que inclinam em 3D (os cards de case já inclinam sozinhos). */
const TILT = ".stat, .more-card, .principle, .lab-card";

/**
 * Luz ambiente atrás da página + reflexo e inclinação dos cards de vidro.
 * Um listener só, delegado no documento, em vez de um por card.
 */
export function GlassFx() {
  const ambientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("fx")) return;

    const reduce = prefersReducedMotion();
    const canTilt = hasFinePointer() && !reduce;
    let tilted: HTMLElement | null = null;

    const untilt = () => {
      if (!tilted) return;
      tilted.style.transform = "";
      tilted.classList.remove("is-tilting");
      tilted = null;
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const glass = target?.closest<HTMLElement>(GLASS);
      if (!glass) {
        untilt();
        return;
      }
      const rect = glass.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      glass.style.setProperty("--gx", `${x}px`);
      glass.style.setProperty("--gy", `${y}px`);

      if (!canTilt || event.pointerType !== "mouse") return;
      const tiltable = glass.matches(TILT) ? glass : null;
      if (tilted && tilted !== tiltable) untilt();
      if (!tiltable) return;
      tilted = tiltable;
      tiltable.classList.add("is-tilting");
      const rx = (y / rect.height - 0.5) * -6;
      const ry = (x / rect.width - 0.5) * 8;
      tiltable.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", untilt);

    /* luz ambiente: as manchas de luz andam devagar com a rolagem, então o vidro "muda" ao descer */
    const ambient = ambientRef.current;
    let queued = false;
    const onScroll = () => {
      if (queued || !ambient) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        ambient.style.setProperty("--p", (window.scrollY / max).toFixed(4));
      });
    };
    if (!reduce) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", untilt);
      window.removeEventListener("scroll", onScroll);
      untilt();
    };
  }, []);

  return (
    <div className="ambient" ref={ambientRef} aria-hidden="true">
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
    </div>
  );
}
