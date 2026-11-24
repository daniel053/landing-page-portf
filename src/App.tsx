import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  Download,
  GitCommitHorizontal,
  MapPin,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import {
  cases,
  consoleEvents,
  consoleNodes,
  education,
  hardware,
  lab,
  principles,
  profile,
  sideProjects,
  socialLinks,
  stackGroups,
  stats,
  timeline,
  whatsAppLink,
  type CaseStudy,
  type ConsoleEvent,
  type Stat,
} from "./data/portfolio";

const navItems = [
  { label: "Resultados", href: "#resultados" },
  { label: "Cases", href: "#cases" },
  { label: "Como trabalho", href: "#metodo" },
  { label: "Stack", href: "#stack" },
  { label: "Trajetória", href: "#trajetoria" },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Adiciona .is-in aos elementos [data-reveal] quando entram na tela. */
function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export function App() {
  useReveal();

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <Stats />
        <Cases />
        <Hardware />
        <Method />
        <Stack />
        <Trajectory />
        <Lab />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

/* -------------------------------- Header -------------------------------- */

function AndonMark() {
  return (
    <span className="andon-mark" aria-hidden="true">
      <i className="red" />
      <i className="amber" />
      <i className="green" />
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="shell header-inner">
        <a className="brand" href="#top" aria-label="Daniel Messias, voltar ao início">
          <AndonMark />
          <span className="brand-name">
            Daniel Messias<span className="brand-dot">.</span>
          </span>
        </a>

        <nav id="menu" className={`nav${open ? " is-open" : ""}`} aria-label="Principal">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <a className="button primary small nav-cta" href="#contato" onClick={() => setOpen(false)}>
            Vamos conversar
          </a>
        </nav>

        <button
          className="icon-button menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}

/* --------------------------------- Hero --------------------------------- */

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="shell hero-grid">
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

          <h1>
            Software que <em>move</em> caminhões, linhas de produção e ERPs.
          </h1>
        </div>

        <div className="hero-copy">
          <p className="hero-lead">
            Sou <strong>Daniel Messias</strong>, desenvolvedor full stack <strong>.NET + React</strong>. Há
            mais de 6 anos conecto antenas RFID, câmeras, balanças e painéis Andon a portais web e ERPs, e
            construo pensando em durar: a plataforma logística em que fiz meu primeiro commit em 2019 continua
            em produção e recebe entregas minhas até hoje.
          </p>

          <div className="hero-actions">
            <a className="button primary" href="#cases">
              Ver resultados
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="button ghost" href={whatsAppLink} target="_blank" rel="noreferrer">
              <MessageCircle size={18} aria-hidden="true" />
              Chamar no WhatsApp
            </a>
            <a className="button link" href={profile.cvUrl} download>
              <Download size={18} aria-hidden="true" />
              Baixar CV
            </a>
          </div>

          <ul className="hero-sectors" aria-label="Setores atendidos">
            <li>Logística</li>
            <li>Terminais e pátios</li>
            <li>Indústria automotiva</li>
            <li>Integração com ERP</li>
          </ul>
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
    consoleEvents.slice(0, 4).reverse().map((event, index) => ({ ...event, key: index, time: clock() })),
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
      setLog((current) => [{ ...next, key: keySeq.current, time: clock() }, ...current].slice(0, 6));
    }, 1900);
    return () => window.clearInterval(timer);
  }, []);

  const active = log[0]?.node ?? 0;

  return (
    <figure className="console" aria-label="Simulação de eventos fluindo do pátio até o ERP">
      <div className="console-bar">
        <AndonMark />
        <span className="console-title">ops://patio → erp</span>
        <span className="console-live">
          <span className="status-dot" aria-hidden="true" /> ao vivo
        </span>
      </div>

      <ol className="console-flow" aria-hidden="true">
        {consoleNodes.map((node, index) => (
          <li key={node.label} className={index === active ? "is-active" : undefined}>
            <span className="flow-label">{node.label}</span>
            <span className="flow-sub">{node.sub}</span>
          </li>
        ))}
      </ol>

      <ol className="console-log" aria-hidden="true">
        {log.map((event) => (
          <li key={event.key} className={`tone-${event.tone}`}>
            <span className="log-time">{event.time}</span>
            <span className="log-source">{event.source}</span>
            <span className="log-text">{event.text}</span>
          </li>
        ))}
      </ol>

      <figcaption className="console-foot">
        Simulação ilustrativa dos fluxos que já coloquei em produção.
      </figcaption>
    </figure>
  );
}

/* -------------------------------- Stats -------------------------------- */

function useInView<T extends Element>(ref: RefObject<T>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

function CountUp({ stat, run }: { stat: Stat; run: boolean }) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? stat.value : 0));

  useEffect(() => {
    if (!run || prefersReducedMotion()) return;
    const duration = 1400;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(stat.value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, stat.value]);

  return (
    <>
      {stat.prefix}
      {value.toLocaleString("pt-BR")}
      {stat.suffix}
    </>
  );
}

function Stats() {
  const ref = useRef<HTMLDListElement>(null);
  const inView = useInView(ref);

  return (
    <section className="stats-band" id="resultados" aria-labelledby="stats-title">
      <div className="shell">
        <h2 className="sr-only" id="stats-title">
          Resultados em números
        </h2>
        <dl className="stats" ref={ref}>
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <dt>
                <span className="stat-value" aria-label={`${stat.prefix ?? ""}${stat.value}${stat.suffix ?? ""}`}>
                  <span aria-hidden="true">
                    <CountUp stat={stat} run={inView} />
                  </span>
                </span>
                <span className="stat-label">{stat.label}</span>
              </dt>
              <dd>{stat.detail}</dd>
            </div>
          ))}
        </dl>
        <p className="stats-source">
          <GitCommitHorizontal size={16} aria-hidden="true" />
          Números extraídos do histórico git dos meus repositórios, não estimados.
        </p>
      </div>
    </section>
  );
}

/* --------------------------------- Cases --------------------------------- */

function SectionHeading({
  index,
  eyebrow,
  title,
  lead,
  id,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  id: string;
}) {
  return (
    <header className="section-heading" data-reveal>
      <p className="eyebrow">
        <span className="eyebrow-index">{index}</span>
        {eyebrow}
      </p>
      <h2 id={id}>{title}</h2>
      {lead ? <p className="section-lead">{lead}</p> : null}
    </header>
  );
}

function CaseCard({ item, index }: { item: CaseStudy; index: number }) {
  const Icon = item.icon;
  return (
    <article className="case" data-reveal aria-labelledby={`${item.id}-title`}>
      <div className="case-aside">
        <p className="case-meta">
          <span>Case {String(index + 1).padStart(2, "0")}</span>
          <span>{item.period}</span>
        </p>
        <p className="case-sector">
          <Icon size={16} aria-hidden="true" />
          {item.sector}
        </p>
        <h3 id={`${item.id}-title`}>{item.title}</h3>
        <div className="case-metric">
          <strong>{item.metric.value}</strong>
          <span>{item.metric.label}</span>
        </div>
      </div>

      <div className="case-main">
        <p className="case-hook">{item.hook}</p>
        <dl className="case-body">
          <div>
            <dt>Desafio</dt>
            <dd>{item.challenge}</dd>
          </div>
          <div>
            <dt>O que construí</dt>
            <dd>{item.built}</dd>
          </div>
          <div>
            <dt>Resultado</dt>
            <dd>
              <ul className="case-results">
                {item.results.map((result) => (
                  <li key={result}>
                    <CircleCheck size={18} aria-hidden="true" />
                    {result}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
        <ul className="chips" aria-label="Tecnologias">
          {item.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Cases() {
  return (
    <section className="section" id="cases" aria-labelledby="cases-title">
      <div className="shell">
        <SectionHeading
          id="cases-title"
          index="01"
          eyebrow="Cases"
          title={
            <>
              Resultados, <span className="muted">não só tecnologias.</span>
            </>
          }
          lead="Problemas reais de operação, o que eu construí e o que mudou depois. Os clientes ficam anônimos por confidencialidade, mas os números são do meu histórico de commits."
        />

        <div className="case-list">
          {cases.map((item, index) => (
            <CaseCard item={item} index={index} key={item.id} />
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

/* -------------------------------- Hardware -------------------------------- */

function Hardware() {
  return (
    <section className="hardware" id="hardware" aria-labelledby="hardware-title">
      <div className="hazard" aria-hidden="true" />
      <div className="shell hardware-grid">
        <SectionHeading
          id="hardware-title"
          index="02"
          eyebrow="Mundo físico"
          title="Meu código não fica só na tela."
          lead="Software de pátio e de chão de fábrica tem que conviver com ruído, latência e hardware que falha no meio do turno. É aí que eu gosto de trabalhar."
        />
        <ul className="device-grid">
          {hardware.map((device) => {
            const Icon = device.icon;
            return (
              <li className="device" key={device.label} data-reveal>
                <span className="device-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="device-label">{device.label}</span>
                <span className="device-detail">{device.detail}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* --------------------------------- Método --------------------------------- */

function Method() {
  return (
    <section className="section" id="metodo" aria-labelledby="metodo-title">
      <div className="shell">
        <SectionHeading
          id="metodo-title"
          index="03"
          eyebrow="Como eu trabalho"
          title={
            <>
              Visão de produto, rigor de engenharia <span className="muted">e IA no fluxo.</span>
            </>
          }
        />
        <ul className="principles">
          {principles.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <li className={`principle${index === principles.length - 1 ? " is-ai" : ""}`} key={principle.title} data-reveal>
                <span className="principle-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </li>
            );
          })}
        </ul>

        <aside className="meta-note" data-reveal>
          <span className="meta-badge">Prova disso</span>
          <p>
            Este portfólio foi redesenhado junto com um agente de IA, a partir dos meus repositórios reais. A
            narrativa, os cases e os números desta página saíram de 23 repositórios e 1.573 commits. A IA acelera;
            a revisão e as decisões finais são minhas.
          </p>
        </aside>
      </div>
    </section>
  );
}

/* --------------------------------- Stack --------------------------------- */

function Stack() {
  return (
    <section className="section tinted" id="stack" aria-labelledby="stack-title">
      <div className="shell">
        <SectionHeading
          id="stack-title"
          index="04"
          eyebrow="Stack"
          title={
            <>
              Ferramentas de produção, <span className="muted">não de tutorial.</span>
            </>
          }
        />
        <div className="stack-grid">
          {stackGroups.map((group) => {
            const Icon = group.icon;
            return (
              <article className="stack-card" key={group.title} data-reveal>
                <h3>
                  <Icon size={18} aria-hidden="true" />
                  {group.title}
                </h3>
                <ul className="chips">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Trajetória ------------------------------- */

function Trajectory() {
  return (
    <section className="section" id="trajetoria" aria-labelledby="trajetoria-title">
      <div className="shell">
        <SectionHeading
          id="trajetoria-title"
          index="05"
          eyebrow="Trajetória"
          title={
            <>
              Do suporte N2 à liderança técnica, <span className="muted">sempre com sistema em produção.</span>
            </>
          }
        />
        <div className="trajectory-grid">
          <ol className="timeline">
            {timeline.map((item) => (
              <li className={`timeline-item${item.highlight ? " is-now" : ""}`} key={item.period} data-reveal>
                <p className="timeline-period">{item.period}</p>
                <h3>{item.title}</h3>
                <p className="timeline-org">{item.org}</p>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>

          <aside className="about-card" data-reveal>
            <div className="avatar">
              {profile.photo ? <img src={profile.photo} alt={profile.name} /> : <span aria-hidden="true">DM</span>}
            </div>
            <p className="about-name">{profile.name}</p>
            <p className="about-role">{profile.role}</p>
            <p className="about-text">
              Gosto de entrar no problema com calma, entender a operação e traduzir isso em decisões técnicas
              claras, do requisito com o cliente até o deploy.
            </p>
            <h3 className="about-sub">Formação</h3>
            <ul className="education">
              {education.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.org}</span>
                </li>
              ))}
            </ul>
            <a className="button ghost full" href={profile.cvUrl} download>
              <Download size={18} aria-hidden="true" />
              Currículo em PDF
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- Lab ---------------------------------- */

function Lab() {
  return (
    <section className="section lab" id="lab" aria-labelledby="lab-title">
      <div className="shell">
        <SectionHeading
          id="lab-title"
          index="06"
          eyebrow="Fora do expediente"
          title={
            <>
              Meu laboratório: <span className="muted">jogos, 3D e render.</span>
            </>
          }
          lead="Desenvolvo jogos em Luau para Roblox, modelo cenários no Blender e estudo renderização. É onde testo ideias sem medo de quebrar produção."
        />
        <ul className="lab-grid">
          {lab.map((item) => {
            const Icon = item.icon;
            return (
              <li className="lab-card" key={item.title} data-reveal>
                <Icon size={22} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------- Contato -------------------------------- */

function Contact() {
  return (
    <section className="contact" id="contato" aria-labelledby="contato-title">
      <div className="hazard" aria-hidden="true" />
      <div className="shell contact-grid">
        <div data-reveal>
          <p className="eyebrow">
            <span className="eyebrow-index">07</span>
            Vamos conversar
          </p>
          <h2 id="contato-title">Ainda tem alguém digitando placa de caminhão numa planilha?</h2>
          <p className="section-lead">
            Se a sua operação depende de retrabalho manual, de integração frágil ou de um sistema que ninguém tem
            coragem de mexer, quero conversar. Aberto a vagas e projetos CLT ou PJ, remoto ou híbrido.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={whatsAppLink} target="_blank" rel="noreferrer">
              <MessageCircle size={18} aria-hidden="true" />
              Chamar no WhatsApp
            </a>
            <a className="button ghost" href={`mailto:${profile.email}`}>
              Enviar e-mail
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>

        <ul className="contact-links" data-reveal>
          {socialLinks.map((link) => {
            const Icon = link.icon;
            const external = link.href.startsWith("http");
            return (
              <li key={link.label}>
                <a href={link.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                  <Icon size={20} aria-hidden="true" />
                  <span className="contact-label">{link.label}</span>
                  <span className="contact-handle">{link.handle}</span>
                  <ArrowUpRight size={18} className="contact-arrow" aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p>React + TypeScript · redesenhado com Claude Code</p>
      </div>
    </footer>
  );
}
