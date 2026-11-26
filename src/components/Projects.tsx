import { useEffect, useRef, useState, type KeyboardEvent, type MutableRefObject } from "react";
import { projects, type Project } from "../data/projects";
import { prefersReducedMotion } from "../hooks";
import type { SceneHandle, SceneOptions } from "../three/stage";
import "../projects.css";

type Loader = () => Promise<(options: SceneOptions) => SceneHandle>;

/* three.js e as cenas só são baixados quando a seção chega perto da tela */
const loaders: Record<Project["id"], Loader> = {
  rfid: () => import("../three/rfidScene").then((m) => m.createRfidScene),
  zenlog: () => import("../three/zenlogScene").then((m) => m.createZenlogScene),
};

const fill = (text: string, loop: number) => text.replace("{erp}", loop % 2 ? "Senior" : "TOTVS");

function Stage({ project, onStep, seekRef }: { project: Project; onStep: (step: number) => void; seekRef: MutableRefObject<((step: number) => void) | null> }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState(0);
  const [loop, setLoop] = useState(0);
  const [status, setStatus] = useState<"wait" | "on" | "off">("wait");

  useEffect(() => {
    const host = hostRef.current;
    const overlay = overlayRef.current;
    if (!host || !overlay) return;

    /* um canvas novo a cada montagem: o descarte força a perda do contexto WebGL,
       então reaproveitar o mesmo elemento (HMR, StrictMode) deixaria a tela preta */
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);

    let handle: SceneHandle | undefined;
    let cancelled = false;

    const start = () => {
      loaders[project.id]()
        .then((create) => {
          if (cancelled) return;
          handle = create({
            canvas,
            host,
            overlay,
            marks: project.marks.map((m) => m.at),
            reducedMotion: prefersReducedMotion(),
            compact: window.matchMedia("(max-width: 640px)").matches,
            onMark: (index, lap) => {
              setMark(index);
              setLoop(lap);
              onStep(project.marks[index].step);
            },
          });
          seekRef.current = (step) => {
            const target = project.marks.find((m) => m.step === step);
            if (target) handle?.seek(target.at);
          };
          setStatus("on");
        })
        .catch((error) => {
          if (cancelled) return;
          console.warn("[projetos] cena 3D indisponível", error);
          setStatus("off");
        });
    };

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        start();
      },
      { rootMargin: "400px 0px" },
    );
    near.observe(host);

    return () => {
      cancelled = true;
      near.disconnect();
      seekRef.current = null;
      handle?.dispose();
      canvas.remove();
    };
  }, [project, onStep, seekRef]);

  const feed = project.marks.slice(0, mark + 1).filter((m) => m.feed);

  return (
    <div className={`stage is-${status} stage-${project.id}`} ref={hostRef} role="img" aria-label={project.stageLabel}>
      <div className="stage-overlay" ref={overlayRef} aria-hidden="true">
        {project.labels.map((label, i) => {
          const on = (label.from ?? 0) <= mark && (label.until === undefined || mark <= label.until);
          return (
            <div className="anchor" data-anchor={label.anchor} key={`${label.anchor}-${i}`}>
              <span className={`tag tag-${label.kind}${on ? " is-on" : ""}`}>{fill(label.text, loop)}</span>
            </div>
          );
        })}
      </div>

      {project.feedTitle ? (
        <div className="feed" aria-hidden="true">
          <p className="feed-title">
            <span className="feed-dot" />
            {project.feedTitle}
          </p>
          <ol>
            {feed
              .slice()
              .reverse()
              .map((item, index) => (
                <li key={item.at} className={index === 0 ? "is-new" : undefined}>
                  {fill(item.feed!, loop)}
                </li>
              ))}
          </ol>
        </div>
      ) : null}

      {status === "wait" ? <p className="stage-wait">montando a maquete 3D…</p> : null}
      {status === "off" ? <p className="stage-wait">Seu navegador não abriu o 3D. Os passos ao lado contam a história.</p> : null}
      <p className="stage-hint" aria-hidden="true">
        low-poly · three.js · texturas 128 px
      </p>
    </div>
  );
}

function Panel({ project }: { project: Project }) {
  const [step, setStep] = useState(0);
  const seekRef = useRef<((step: number) => void) | null>(null);
  const Icon = project.icon;

  return (
    <div className="project" role="tabpanel" id={`painel-${project.id}`} aria-labelledby={`aba-${project.id}`}>
      <div className="project-copy">
        <p className="project-kicker">
          <Icon size={15} aria-hidden="true" />
          {project.kicker}
        </p>
        <h3>{project.title}</h3>
        <p className="project-lead">{project.lead}</p>

        <ol className="project-steps">
          {project.steps.map((item, index) => (
            <li key={item.title} className={index === step ? "is-active" : index < step ? "is-done" : undefined}>
              <button type="button" onClick={() => seekRef.current?.(index)} aria-current={index === step ? "step" : undefined}>
                <span className="ps-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="ps-text">
                  <b>{item.title}</b>
                  <span>{item.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <ul className="project-values">
          {project.values.map((value) => {
            const ValueIcon = value.icon;
            return (
              <li key={value.title}>
                <ValueIcon size={18} aria-hidden="true" />
                <b>{value.title}</b>
                <span>{value.body}</span>
              </li>
            );
          })}
        </ul>

        <ul className="chips small" aria-label="Tecnologias">
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>

      <Stage project={project} onStep={setStep} seekRef={seekRef} />
    </div>
  );
}

export function Projects() {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const next = (active + (event.key === "ArrowRight" ? 1 : projects.length - 1)) % projects.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  const project = projects[active];

  return (
    <section className="section projects" id="projetos" aria-labelledby="projetos-title">
      <div className="shell">
        <header className="section-heading" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow-index">04</span>
            Projetos
          </p>
          <h2 id="projetos-title">
            Veja o sistema trabalhando, <span className="muted">do sensor na doca ao ERP.</span>
          </h2>
          <p className="section-lead">Cada aba é uma maquete do que o projeto faz no mundo real. Clique num passo para pular para ele.</p>
        </header>

        <div className="project-tabs" role="tablist" aria-label="Projetos" onKeyDown={onKey} data-reveal>
          {projects.map((item, index) => {
            const TabIcon = item.icon;
            const selected = index === active;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabsRef.current[index] = node;
                }}
                id={`aba-${item.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`painel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                className={selected ? "is-active" : undefined}
                onClick={() => setActive(index)}
              >
                <TabIcon size={18} aria-hidden="true" />
                <span>
                  <b>{item.tab}</b>
                  <small>{item.tabSub}</small>
                </span>
              </button>
            );
          })}
        </div>

        <Panel key={project.id} project={project} />
      </div>
    </section>
  );
}
