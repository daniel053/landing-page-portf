import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Plus, Users, X } from "lucide-react";
import { artifacts, type Artifact } from "../data/artifacts";
import "../artifacts.css";

type Open = { artifact: number; shot: number } | null;

function ShotCard({ item, index, onOpen }: { item: Artifact; index: number; onOpen: (shot: number) => void }) {
  const [active, setActive] = useState(0);
  const Icon = item.icon;
  const multi = item.shots.length > 1;
  const shot = item.shots[active];

  return (
    <li className="more-card shot-card" data-reveal style={{ transitionDelay: `${index * 90}ms` }}>
      <div className="shot">
        <div className="shot-bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span className="shot-path">{shot.path}</span>
          <span className="shot-live">em produção</span>
        </div>

        <button
          type="button"
          className="shot-view"
          onClick={() => onOpen(active)}
          aria-label={`Ampliar tela real: ${item.title}, ${shot.label}`}
        >
          <span className="shot-pan" aria-hidden="true">
            {item.shots.map((s, i) => (
              <img
                key={s.src}
                src={s.src}
                alt=""
                loading="lazy"
                decoding="async"
                className={i === active ? "is-on" : undefined}
                style={{ "--fx": `${s.focus[0]}%`, "--fy": `${s.focus[1]}%` } as CSSProperties}
              />
            ))}
          </span>
          <span className="shot-scan" aria-hidden="true" />
          <span className="shot-zoom" aria-hidden="true">
            <Maximize2 size={13} />
            ampliar
          </span>
        </button>
      </div>

      {multi ? (
        <div className="shot-tabs" role="group" aria-label={`Telas do ${item.title}`}>
          {item.shots.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className={i === active ? "is-on" : undefined}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
            >
              {s.label}
              {/* a barra enche e, ao terminar, passa para a próxima tela (pausa no hover) */}
              <span
                className="shot-fill"
                aria-hidden="true"
                onAnimationEnd={() => setActive((current) => (current + 1) % item.shots.length)}
              />
            </button>
          ))}
        </div>
      ) : null}

      <p className="shot-kicker">
        <Icon size={14} aria-hidden="true" />
        {item.kicker}
      </p>
      <h3>{item.title}</h3>
      <p className="shot-body">{item.body}</p>
      <p className="shot-users">
        <Users size={13} aria-hidden="true" />
        <span>
          Quem usa: <b>{item.users}</b>
        </span>
      </p>
      <ul className="chips small" aria-label="Destaques">
        {item.chips.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
    </li>
  );
}

function Lightbox({ open, onClose, onShot }: { open: Open; onClose: () => void; onShot: (shot: number) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const item = open ? artifacts[open.artifact] : null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const total = item?.shots.length ?? 0;
  const step = (delta: number) => open && onShot((open.shot + delta + total) % total);

  return (
    <dialog
      ref={ref}
      className="shot-dialog"
      aria-label={item ? `${item.title}: tela real ampliada` : "Tela ampliada"}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onKeyDown={(event) => {
        if (total < 2) return;
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
    >
      {item && open ? (
        <figure>
          <img src={item.shots[open.shot].src} alt={`${item.title}, ${item.shots[open.shot].label}. Dados sensíveis borrados.`} />
          <figcaption>
            <span>
              <b>{item.title}</b> · {item.shots[open.shot].label}
            </span>
            <span className="shot-dialog-note">nomes, valores e dados pessoais borrados · LGPD</span>
            {total > 1 ? (
              <span className="shot-dialog-nav">
                <button type="button" onClick={() => step(-1)} aria-label="Tela anterior">
                  <ChevronLeft size={18} />
                </button>
                {open.shot + 1}/{total}
                <button type="button" onClick={() => step(1)} aria-label="Próxima tela">
                  <ChevronRight size={18} />
                </button>
              </span>
            ) : null}
          </figcaption>
          <button type="button" className="shot-dialog-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </figure>
      ) : null}
    </dialog>
  );
}

export function Artifacts() {
  const [open, setOpen] = useState<Open>(null);

  return (
    <section className="section shots" id="em-producao" aria-labelledby="em-producao-title">
      <div className="shell">
        <header className="section-heading" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow-index">05</span>
            Em produção
          </p>
          <h2 id="em-producao-title">
            Telas reais, com usuário de verdade. <span className="muted">Sem maquete.</span>
          </h2>
          <p className="section-lead">
            Capturas dos sistemas rodando nos clientes. Clique para ampliar. Nomes, valores e dados pessoais foram
            borrados por respeito a eles e à LGPD.
          </p>
        </header>

        <ul className="shot-grid">
          {artifacts.map((item, index) => (
            <ShotCard key={item.id} item={item} index={index} onOpen={(shot) => setOpen({ artifact: index, shot })} />
          ))}
          <li className="shot-slot" data-reveal style={{ transitionDelay: `${artifacts.length * 90}ms` }}>
            <span className="shot-slot-frame" aria-hidden="true">
              <Plus size={22} />
            </span>
            <p className="shot-kicker">Próxima tela</p>
            <p className="shot-body">Mais sistemas em produção entram aqui em breve.</p>
          </li>
        </ul>
      </div>

      <Lightbox
        open={open}
        onClose={() => setOpen(null)}
        onShot={(shot) => setOpen((current) => (current ? { ...current, shot } : current))}
      />
    </section>
  );
}
