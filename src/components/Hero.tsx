import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download, MapPin, MessageCircle } from "lucide-react";
import { consoleEvents, consoleNodes, heroWords, profile, whatsAppLink, type ConsoleEvent } from "../data/portfolio";
import { hasFinePointer, prefersReducedMotion, scrambleTo } from "../hooks";
import { HeroScene } from "./HeroScene";

/* Código mostrado pela lente raio-x (ilustrativo, escrito para o portfólio). */
const LENS_CODE = [
  '<span class="tk-c">// o que roda por trás desta frase</span>',
  '<span class="tk-k">public async</span> Task <span class="tk-f">OnVehicleAtGate</span>(GateEvent e)',
  "{",
  '    <span class="tk-k">var</span> plate  = <span class="tk-k">await</span> _lpr.<span class="tk-f">ReadAsync</span>(e.Camera);     <span class="tk-c">// YOLOv8</span>',
  '    <span class="tk-k">var</span> tag    = <span class="tk-k">await</span> _rfid.<span class="tk-f">ReadAsync</span>(e.Antenna);   <span class="tk-c">// UHF</span>',
  '    <span class="tk-k">var</span> weight = <span class="tk-k">await</span> _scale.<span class="tk-f">StableAsync</span>(e.ScaleId);',
  "",
  '    <span class="tk-k">var</span> trip = <span class="tk-k">await</span> _yard.<span class="tk-f">MatchAsync</span>(plate, tag);',
  '    trip.<span class="tk-f">Register</span>(weight, e.Timestamp);',
  "",
  '    <span class="tk-k">await</span> _wms.<span class="tk-f">ReleaseDockAsync</span>(trip);',
  '    <span class="tk-k">await</span> _erp.<span class="tk-f">SyncAsync</span>(trip.OrderId);   <span class="tk-c">// ninguém digitou nada</span>',
  "}",
].join("\n");

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const xrayRef = useRef<HTMLDivElement>(null);
  const swapRef = useRef<HTMLSpanElement>(null);

  /* Grade viva + lente raio-x + botões magnéticos. Tudo por refs para não re-renderizar a cada movimento. */
  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    const xray = xrayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!hero || !canvas || !xray || !ctx) return;

    const reduce = prefersReducedMotion();
    const fine = hasFinePointer();
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c6f432";
    const glow = { x: -999, y: -999 };
    let width = 0;
    let height = 0;
    let queued = false;
    let idle = false;
    let idleRaf = 0;
    let idleTimer = 0;
    let visible = false;

    const draw = () => {
      if (!width) return;
      ctx.clearRect(0, 0, width, height);
      const gap = 28;
      const reach = 180;
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          const t = Math.max(0, 1 - Math.hypot(x - glow.x, y - glow.y) / reach);
          if (t > 0) {
            const size = 1.4 + t * 2.4;
            ctx.globalAlpha = 0.18 + t * 0.82;
            ctx.fillStyle = accent;
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
          } else {
            ctx.globalAlpha = 0.09;
            ctx.fillStyle = "#f5f5f4";
            ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        draw();
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hero);

    const setLens = (x: number, y: number) => {
      xray.style.setProperty("--x", `${x}px`);
      xray.style.setProperty("--y", `${y}px`);
      const xr = xray.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      glow.x = xr.left - cr.left + x;
      glow.y = xr.top - cr.top + y;
      queue();
    };

    const centerLens = () => {
      const rect = xray.getBoundingClientRect();
      xray.style.setProperty("--x", `${rect.width / 2}px`);
      xray.style.setProperty("--y", `${rect.height / 2}px`);
    };
    centerLens();

    const lensFromEvent = (event: PointerEvent) => {
      const rect = xray.getBoundingClientRect();
      setLens(event.clientX - rect.left, event.clientY - rect.top);
      xray.classList.add("is-on");
    };
    const lensOff = () => xray.classList.remove("is-on");

    const stopIdle = () => {
      if (!idle) return;
      idle = false;
      cancelAnimationFrame(idleRaf);
      xray.classList.remove("is-idle");
    };

    const startIdle = () => {
      if (!visible || idle) return;
      if (xray.matches(":hover")) {
        armIdle();
        return;
      }
      idle = true;
      xray.classList.add("is-idle");
      const t0 = performance.now();
      const loop = (now: number) => {
        if (!idle) return;
        const rect = xray.getBoundingClientRect();
        const t = (now - t0) / 1000;
        setLens(rect.width * (0.5 + 0.4 * Math.sin(t * 0.55)), rect.height * (0.5 + 0.3 * Math.sin(t * 1.15)));
        idleRaf = requestAnimationFrame(loop);
      };
      idleRaf = requestAnimationFrame(loop);
    };

    function armIdle() {
      window.clearTimeout(idleTimer);
      if (reduce) return;
      idleTimer = window.setTimeout(startIdle, 2400);
    }

    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) armIdle();
        else {
          stopIdle();
          window.clearTimeout(idleTimer);
        }
      },
      { threshold: 0.4 },
    );
    visibility.observe(xray);

    const consoleEl = hero.querySelector<HTMLElement>(".console");
    const magnets = Array.from(hero.querySelectorAll<HTMLElement>(".magnetic"));
    const onHeroMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      glow.x = event.clientX - rect.left;
      glow.y = event.clientY - rect.top;
      queue();
      stopIdle();
      armIdle();
      if (consoleEl) {
        const c = consoleEl.getBoundingClientRect();
        consoleEl.style.setProperty("--gx", `${event.clientX - c.left}px`);
        consoleEl.style.setProperty("--gy", `${event.clientY - c.top}px`);
      }
      if (!fine || reduce) return;
      magnets.forEach((el) => {
        const r = el.getBoundingClientRect();
        const dx = event.clientX - (r.left + r.width / 2);
        const dy = event.clientY - (r.top + r.height / 2);
        el.style.transform = Math.hypot(dx, dy) < r.width / 2 + 70 ? `translate(${dx * 0.22}px, ${dy * 0.35}px)` : "";
      });
    };
    const onHeroLeave = () => {
      glow.x = -999;
      glow.y = -999;
      queue();
      magnets.forEach((el) => (el.style.transform = ""));
    };

    xray.addEventListener("pointermove", lensFromEvent);
    xray.addEventListener("pointerdown", lensFromEvent);
    xray.addEventListener("pointerleave", lensOff);
    hero.addEventListener("pointermove", onHeroMove);
    hero.addEventListener("pointerleave", onHeroLeave);

    return () => {
      resizeObserver.disconnect();
      visibility.disconnect();
      stopIdle();
      window.clearTimeout(idleTimer);
      xray.removeEventListener("pointermove", lensFromEvent);
      xray.removeEventListener("pointerdown", lensFromEvent);
      xray.removeEventListener("pointerleave", lensOff);
      hero.removeEventListener("pointermove", onHeroMove);
      hero.removeEventListener("pointerleave", onHeroLeave);
    };
  }, []);

  /* Palavra que se decodifica a cada 2,6 s. */
  useEffect(() => {
    const el = swapRef.current;
    if (!el || prefersReducedMotion()) return;
    let index = 0;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      index = (index + 1) % heroWords.length;
      scrambleTo(el, heroWords[index]);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="hero" id="top" ref={heroRef}>
      <canvas className="hero-grid-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="shell hero-layout">
        <div className="hero-head">
          <p className="kicker">
            {profile.available ? (
              <span className="status">
                <span className="status-dot" aria-hidden="true" />
                Disponível para novos desafios
              </span>
            ) : null}
            <span className="kicker-meta">
              <MapPin size={14} aria-hidden="true" />
              {profile.location} · {profile.workModel}
            </span>
          </p>

          <div className="xray" ref={xrayRef}>
            <div className="xray-under" aria-hidden="true">
              <pre dangerouslySetInnerHTML={{ __html: LENS_CODE }} />
            </div>
            <h1 aria-label="Eu faço antenas RFID, câmeras, balanças e painéis Andon conversarem com o seu ERP.">
              <span className="line" aria-hidden="true">Eu faço</span>
              <span className="line" aria-hidden="true">
                <span className="swap" ref={swapRef}>
                  {heroWords[0]}
                </span>
              </span>
              <span className="line" aria-hidden="true">
                conversarem com <br className="hero-br" />o seu ERP.
              </span>
            </h1>
            <div className="lens-ring" aria-hidden="true" />
          </div>
        </div>

        {profile.photo ? (
          <figure className="hero-portrait">
            <HeroScene />
            <img src={profile.photo} alt={`Ilustração de ${profile.shortName} com headset e camiseta de dev`} width={900} height={942} />
            <figcaption className="portrait-tag">
              <span className="status-dot" aria-hidden="true" />
              oi, eu sou o Daniel
            </figcaption>
          </figure>
        ) : null}

        <div className="hero-copy">
          <p className="hero-lead">
            <strong>Daniel Messias</strong>, full stack <strong>.NET + React</strong>. Há mais de 6 anos conecto o mundo
            físico da logística e da indústria a portais e ERPs. O sistema que comecei em 2019 ainda roda.
          </p>
          <div className="hero-actions">
            <a className="button primary magnetic" href="#cases">
              Ver resultados
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="button ghost magnetic" href={whatsAppLink} target="_blank" rel="noreferrer">
              <MessageCircle size={18} aria-hidden="true" />
              Chamar no WhatsApp
            </a>
            <a className="button link" href={profile.cvUrl} download>
              <Download size={18} aria-hidden="true" />
              Baixar CV
            </a>
          </div>
          <p className="hero-hint" aria-hidden="true">
            <span className="hint-dot" /> passe o mouse no título · aperte <kbd>/</kbd> para o terminal
          </p>
        </div>

        <OpsConsole />
      </div>
    </section>
  );
}

type LoggedEvent = ConsoleEvent & { key: number; time: string };

const clock = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function OpsConsole() {
  const [log, setLog] = useState<LoggedEvent[]>(() =>
    consoleEvents
      .slice(0, 4)
      .reverse()
      .map((event, index) => ({ ...event, key: index, time: clock() })),
  );
  const cursor = useRef(4);
  const keySeq = useRef(4);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const next = consoleEvents[cursor.current % consoleEvents.length];
      cursor.current += 1;
      keySeq.current += 1;
      setLog((current) => [{ ...next, key: keySeq.current, time: clock() }, ...current].slice(0, 5));
    }, 1900);
    return () => window.clearInterval(timer);
  }, []);

  const active = log[0]?.node ?? 0;

  return (
    <figure className="console" aria-label="Simulação de eventos fluindo do pátio até o ERP">
      <div className="console-bar">
        <span className="console-title">ops://patio → erp</span>
        <span className="console-live">
          <span className="status-dot" aria-hidden="true" /> ao vivo
        </span>
      </div>
      <ol className="console-flow" aria-hidden="true">
        {consoleNodes.map((node, index) => (
          <li key={node} className={index === active ? "is-active" : undefined}>
            {node}
          </li>
        ))}
      </ol>
      <ol className="console-log" aria-hidden="true">
        {log.map((event) => (
          <li key={event.key}>
            <span className="log-time">{event.time}</span>
            <span className="log-source">{event.source}</span>
            <span className="log-text">{event.text}</span>
          </li>
        ))}
      </ol>
      <figcaption className="console-foot">Simulação dos fluxos que já coloquei em produção.</figcaption>
    </figure>
  );
}
