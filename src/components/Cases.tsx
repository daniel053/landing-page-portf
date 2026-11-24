import { useState, type PointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { cases, sideProjects, type CaseStudy } from "../data/portfolio";
import { hasFinePointer, prefersReducedMotion } from "../hooks";

type View = "negocio" | "tecnica";

function CaseCard({
  item,
  index,
  view,
  open,
  onToggle,
}: {
  item: CaseStudy;
  index: number;
  view: View;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;

  const onMove = (event: PointerEvent<HTMLElement>) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
    if (event.pointerType === "mouse" && hasFinePointer() && !prefersReducedMotion()) {
      card.style.transform = `perspective(1000px) rotateX(${(y / rect.height - 0.5) * -4}deg) rotateY(${(x / rect.width - 0.5) * 6}deg)`;
    }
  };

  const onLeave = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.transform = "";
  };

  return (
    <article
      className={`card${open ? " is-open" : ""}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-reveal
      aria-labelledby={`${item.id}-title`}
    >
      <button
        className="card-hit"
        type="button"
        aria-expanded={open}
        aria-controls={`${item.id}-back`}
        onClick={onToggle}
      >
        <span className="sr-only">Ver bastidores: {item.title}</span>
      </button>

      <p className="card-meta">
        <span>
          <Icon size={15} aria-hidden="true" />
          Case {String(index + 1).padStart(2, "0")} · {item.sector}
        </span>
        <span>{item.period}</span>
      </p>
      <h3 id={`${item.id}-title`}>{item.title}</h3>
      <span className="card-hint" aria-hidden="true">
        bastidores <ArrowUpRight size={14} />
      </span>

      <p className="card-metric">{item.metric.value}</p>
      <p className="card-mlabel">{item.metric.label}</p>

      <div className="card-back" id={`${item.id}-back`}>
        <div className="card-back-inner" key={view}>
          {view === "negocio" ? (
            <>
              <p className="card-back-title">Resultado</p>
              <p className="card-back-lead">{item.hook}</p>
              <ul className="card-results">
                {item.results.map((result) => (
                  <li key={result}>{result}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="card-back-title">Arquitetura</p>
              <p className="card-back-lead">{item.tech}</p>
              <ul className="chips" aria-label="Tecnologias">
                {item.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function Cases() {
  const [view, setView] = useState<View>("negocio");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="section" id="cases" aria-labelledby="cases-title">
      <div className="shell">
        <header className="cases-head">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">
              <span className="eyebrow-index">02</span>
              Cases
            </p>
            <h2 id="cases-title">
              Resultados, <span className="muted">não só tecnologias.</span>
            </h2>
            <p className="section-lead">Passe o mouse (ou toque) num case para ver os bastidores.</p>
          </div>

          <div className="view-switch" role="radiogroup" aria-label="Como ler os cases" data-reveal>
            <span className="view-label">Ler como</span>
            <div className={`view-track is-${view}`}>
              <span className="view-thumb" aria-hidden="true" />
              <button type="button" role="radio" aria-checked={view === "negocio"} onClick={() => setView("negocio")}>
                Negócio
              </button>
              <button type="button" role="radio" aria-checked={view === "tecnica"} onClick={() => setView("tecnica")}>
                Técnica
              </button>
            </div>
          </div>
        </header>

        <div className="cards">
          {cases.map((item, index) => (
            <CaseCard
              key={item.id}
              item={item}
              index={index}
              view={view}
              open={open === item.id}
              onToggle={() => setOpen((current) => (current === item.id ? null : item.id))}
            />
          ))}
        </div>

        <div className="more" data-reveal>
          <h3 className="more-title">E também construí</h3>
          <ul className="more-grid">
            {sideProjects.map((project) => (
              <li className="more-card" key={project.title}>
                <p className="more-year">{project.year}</p>
                <h4>{project.title}</h4>
                <p>{project.description}</p>
                <ul className="chips small" aria-label="Tecnologias">
                  {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
