import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, MousePointerClick, Server, Smartphone, X } from "lucide-react";
import { papeai, type Turn } from "../data/papeai";
import { prefersReducedMotion } from "../hooks";
import type { PapeHandle } from "../three/papeaiScene";
import "../papeai.css";

type Line = { text: string; note?: string; typing?: boolean };

const KeyIcon = papeai.keyIcon;

export function PapeAI() {
  const hostRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PapeHandle | null>(null);
  const timers = useRef<number[]>([]);
  const greeted = useRef(false);

  const [status, setStatus] = useState<"wait" | "on" | "off">("wait");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<Line | null>(null);
  const [shown, setShown] = useState(0);
  const [you, setYou] = useState<string | null>(null);
  const [used, setUsed] = useState<number[]>([]);
  const [inView, setInView] = useState(false);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /* o sagui fala: digita a frase e mexe a boca no mesmo ritmo */
  const say = useCallback((text: string, note?: string) => {
    setLine({ text, note });
    setShown(prefersReducedMotion() ? text.length : 0);
    handleRef.current?.talk(text.length * 0.032);
  }, []);

  useEffect(() => {
    if (!line || line.typing || shown >= line.text.length) {
      if (line && !line.typing && shown >= line.text.length) setBusy(false);
      return;
    }
    const id = window.setTimeout(() => setShown((n) => n + 1), 30);
    return () => window.clearTimeout(id);
  }, [line, shown]);

  /* cena 3D: só baixa o three.js quando a seção chega perto */
  useEffect(() => {
    const host = hostRef.current;
    const overlay = overlayRef.current;
    if (!host || !overlay) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);
    let cancelled = false;

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        import("../three/papeaiScene")
          .then(({ createPapeScene }) => {
            if (cancelled) return;
            handleRef.current = createPapeScene({
              canvas,
              host,
              overlay,
              reducedMotion: prefersReducedMotion(),
              compact: window.matchMedia("(max-width: 640px)").matches,
              onPoke: () => poke(),
            });
            setStatus("on");
          })
          .catch((error) => {
            if (cancelled) return;
            console.warn("[papeai] cena 3D indisponível", error);
            setStatus("off");
          });
      },
      { rootMargin: "400px 0px" },
    );
    near.observe(host);

    /* cumprimenta uma vez, quando o palco está bem visível */
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen.disconnect();
        setInView(true);
      },
      { threshold: 0.55 },
    );
    seen.observe(host);

    return () => {
      cancelled = true;
      near.disconnect();
      seen.disconnect();
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      handleRef.current?.dispose();
      handleRef.current = null;
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* cumprimenta uma vez, quando o palco está visível e o 3D já respondeu (ou falhou) */
  useEffect(() => {
    if (!inView || status === "wait" || greeted.current) return;
    greeted.current = true;
    later(() => {
      if (busyRef.current) return;
      handleRef.current?.play("wave");
      say(papeai.intro);
    }, 450);
  }, [inView, status, say]);

  const pokeIndex = useRef(0);
  const busyRef = useRef(false);
  busyRef.current = busy;

  function poke() {
    if (busyRef.current) return;
    handleRef.current?.play("happy");
    say(papeai.pokes[pokeIndex.current++ % papeai.pokes.length]);
  }

  const connect = () => {
    if (busy || connected) return;
    setBusy(true);
    setYou("sk-ant-api03-••••••••••••");
    setLine({ text: "", typing: true });
    const greet = () => {
      setConnected(true);
      handleRef.current?.play("celebrate");
      say(papeai.hello);
    };
    if (handleRef.current) handleRef.current.connectKey(() => later(greet, 250));
    else later(greet, 600);
  };

  const ask = (turn: Turn, index: number) => {
    if (busy) return;
    setBusy(true);
    setYou(turn.prompt);
    setUsed((list) => (list.includes(index) ? list : [...list, index]));
    setLine({ text: "", typing: true });
    handleRef.current?.play("think");
    later(() => {
      handleRef.current?.play(turn.clip);
      say(turn.reply, turn.note);
    }, 1150);
  };

  const done = line && !line.typing && shown >= line.text.length;

  return (
    <section className="section papeai" id="ia" aria-labelledby="ia-title">
      <div className="shell">
        <header className="section-heading" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow-index">03</span>
            Projetos com IA
          </p>
          <h2 id="ia-title">
            Um tutor de inglês em 3D, <span className="muted">no seu celular e sem mensalidade.</span>
          </h2>
        </header>

        <div className="pape">
          <div className="pape-demo" data-reveal>
            <div className={`pape-stage is-${status}`} ref={hostRef} role="img" aria-label={papeai.stageLabel}>
              <div className="pape-overlay" ref={overlayRef} aria-hidden="true">
                <div className="pape-anchor" data-anchor="head" data-clamp>
                  {line ? (
                    <div className={`pape-bubble${line.typing ? " is-typing" : ""}`} key={line.text || "typing"}>
                      {line.typing ? (
                        <span className="pape-dots">
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : (
                        <>
                          <p>
                            {line.text.slice(0, shown)}
                            {!done ? <span className="pape-caret" /> : null}
                          </p>
                          {line.note && done ? <small>{line.note}</small> : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="pape-anchor" data-anchor="key">
                  <span className={`pape-tag${connected || busy ? "" : " is-on"}`}>
                    <KeyIcon size={12} aria-hidden="true" /> sua chave de API
                  </span>
                </div>
                <div className="pape-anchor" data-anchor="phone">
                  <span className={`pape-tag is-lock${connected ? " is-on" : ""}`}>cifrada neste aparelho</span>
                </div>
              </div>

              {you ? (
                <p className="pape-you" key={you} aria-hidden="true">
                  <span>você</span>
                  {you}
                </p>
              ) : null}

              {status === "wait" ? <p className="pape-wait">acordando o sagui…</p> : null}
              {status === "off" ? <p className="pape-wait">Seu navegador não abriu o 3D, mas a conversa abaixo funciona.</p> : null}
              <p className="pape-hint" aria-hidden="true">
                <MousePointerClick size={12} /> clique no sagui
              </p>
            </div>

            <p className="sr-only" aria-live="polite">
              {done && line ? `Sagui: ${line.text}` : ""}
            </p>

            <div className="pape-chat">
              {!connected ? (
                <button className="pape-connect" type="button" onClick={connect} disabled={busy}>
                  <KeyIcon size={18} aria-hidden="true" />
                  <span>
                    <b>Conectar minha chave</b>
                    <small>demonstração: nada sai da sua tela</small>
                  </span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              ) : (
                <>
                  <p className="pape-chat-label">Responda em inglês:</p>
                  <ul className="pape-replies">
                    {papeai.turns.map((turn, index) => (
                      <li key={turn.prompt}>
                        <button
                          type="button"
                          onClick={() => ask(turn, index)}
                          disabled={busy}
                          className={used.includes(index) ? "is-used" : undefined}
                        >
                          {turn.prompt}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="pape-copy">
            <p className="pape-status" data-reveal>
              <span className="pape-dot" aria-hidden="true" />
              {papeai.status}
            </p>
            <h3 className="pape-name" data-reveal>
              Pape<span>AI</span>
            </h3>
            <p className="pape-lead" data-reveal>
              {papeai.lead}
            </p>

            <div className="pape-byok" data-reveal>
              <p className="pape-byok-title">
                <KeyIcon size={18} aria-hidden="true" />
                {papeai.byok.title}
              </p>
              <p className="pape-byok-body">{papeai.byok.body}</p>
              <div className="pape-route" aria-label="A chave vai do seu celular direto para o provedor da IA. O servidor do PapeAI nunca a vê.">
                <span className="pape-node is-on">
                  <Smartphone size={14} aria-hidden="true" /> seu celular
                </span>
                <span className="pape-wire" aria-hidden="true" />
                <span className="pape-node is-on">API do provedor</span>
                <span className="pape-node is-off">
                  <Server size={14} aria-hidden="true" /> servidor PapeAI
                  <X size={13} aria-hidden="true" />
                </span>
              </div>
            </div>

            <ul className="pape-pillars">
              {papeai.pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <li key={pillar.title} data-reveal>
                    <Icon size={18} aria-hidden="true" />
                    <b>{pillar.title}</b>
                    <span>{pillar.body}</span>
                  </li>
                );
              })}
            </ul>

            <blockquote className="pape-quote" data-reveal>
              <p>“{papeai.quote}”</p>
              <footer>Daniel, sobre o porquê do PapeAI</footer>
            </blockquote>

            <div className="pape-phase" data-reveal>
              <ol aria-hidden="true">
                {Array.from({ length: papeai.phase.total }, (_, i) => (
                  <li key={i} className={i === papeai.phase.current ? "is-now" : undefined} />
                ))}
              </ol>
              <p>
                <b>{papeai.phase.label}</b> · 13 fases até o lançamento
              </p>
            </div>

            <ul className="chips small" aria-label="Tecnologias" data-reveal>
              {papeai.stack.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
