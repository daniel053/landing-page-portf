import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Download, Menu, MessageCircle, X } from "lucide-react";
import { Artifacts } from "./components/Artifacts";
import { Boot } from "./components/Boot";
import { Cases } from "./components/Cases";
import { GlassFx } from "./components/GlassFx";
import { Hero } from "./components/Hero";
import { PapeAI } from "./components/PapeAI";
import { Pipeline } from "./components/Pipeline";
import { Projects } from "./components/Projects";
import { StackBelt } from "./components/Belt";
import { Stats } from "./components/Stats";
import { Terminal } from "./components/Terminal";
import { WhatsAppFab } from "./components/WhatsAppFab";
import { education, lab, principles, profile, socialLinks, timeline, whatsAppLink } from "./data/portfolio";
import { useReveal } from "./hooks";

const navItems = [
  { label: "Como funciona", href: "#pipeline" },
  { label: "Cases", href: "#cases" },
  { label: "IA", href: "#ia" },
  { label: "Projetos", href: "#projetos" },
  { label: "Em produção", href: "#em-producao" },
  { label: "Stack", href: "#stack" },
  { label: "Trajetória", href: "#trajetoria" },
];

export function App() {
  useReveal();

  return (
    <>
      <Boot />
      <GlassFx />
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <Stats />
        <Pipeline />
        <Cases />
        <PapeAI />
        <Projects />
        <Artifacts />
        <Method />
        <StackBelt />
        <Trajectory />
        <Lab />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
      <Terminal />
    </>
  );
}

/* -------------------------------- Header -------------------------------- */

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
    <header className={`site-header${scrolled || open ? " is-scrolled" : ""}`}>
      <div className="shell header-inner">
        <a className="brand" href="#top" aria-label="Daniel Messias, voltar ao início">
          <span className="brand-mark" aria-hidden="true">
            DM
          </span>
          <span className="brand-name">Daniel Messias</span>
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

/* ------------------------------- Helpers ------------------------------- */

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

/* -------------------------------- Método -------------------------------- */

function Method() {
  return (
    <section className="section" id="metodo" aria-labelledby="metodo-title">
      <div className="shell">
        <SectionHeading
          id="metodo-title"
          index="06"
          eyebrow="Como eu trabalho"
          title={
            <>
              Visão de produto, rigor de engenharia <span className="muted">e IA no fluxo.</span>
            </>
          }
        />
        <ul className="principles">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <li className="principle" key={principle.title} data-reveal>
                <Icon size={22} aria-hidden="true" />
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </li>
            );
          })}
        </ul>
        <p className="meta-note" data-reveal>
          <span className="meta-badge">Prova disso</span>
          Este portfólio foi redesenhado com um agente de IA a partir de 23 repositórios e 1.573 commits meus. A IA
          acelera; a revisão e as decisões finais são minhas.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- Trajetória ------------------------------- */

function Trajectory() {
  return (
    <section className="section tinted" id="trajetoria" aria-labelledby="trajetoria-title">
      <div className="shell">
        <SectionHeading
          id="trajetoria-title"
          index="08"
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
                <p className="timeline-body">{item.body}</p>
              </li>
            ))}
          </ol>

          <aside className="about-card" data-reveal>
            <div className="avatar">
              {profile.photo ? <img src={profile.photo} alt={profile.name} /> : <span aria-hidden="true">DM</span>}
            </div>
            <p className="about-name">{profile.name}</p>
            <p className="about-role">{profile.role}</p>
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
    <section className="section" id="lab" aria-labelledby="lab-title">
      <div className="shell">
        <SectionHeading
          id="lab-title"
          index="09"
          eyebrow="Fora do expediente"
          title={
            <>
              Meu laboratório: <span className="muted">jogos, 3D e render.</span>
            </>
          }
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
            <span className="eyebrow-index">10</span>
            Vamos conversar
          </p>
          <h2 id="contato-title">Ainda tem alguém digitando placa de caminhão numa planilha?</h2>
          <p className="section-lead">
            Se a sua operação depende de retrabalho manual ou de um sistema que ninguém tem coragem de mexer, quero
            conversar. CLT ou PJ, remoto ou híbrido.
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
          {socialLinks.map((item) => {
            const Icon = item.icon;
            const external = item.href.startsWith("http");
            return (
              <li key={item.label}>
                <a href={item.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                  <Icon size={20} aria-hidden="true" />
                  <span className="contact-label">{item.label}</span>
                  <span className="contact-handle">{item.handle}</span>
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
        <p>
          React + TypeScript · aperte <kbd>/</kbd> para o terminal
        </p>
      </div>
    </footer>
  );
}
