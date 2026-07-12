import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronRight,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import {
  challenges,
  hobbies,
  interests,
  socialLinks,
  stackGroups,
  timeline,
  whatsAppLink,
  type Challenge,
} from "./data/portfolio";

const navItems = [
  { label: "Sobre", href: "#sobre" },
  { label: "Stack", href: "#stack" },
  { label: "Desafios", href: "#desafios" },
  { label: "Hobbies", href: "#hobbies" },
  { label: "Formação", href: "#formacao" },
  { label: "Contato", href: "#contato" },
];

export function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );

  return (
    <>
      <ParticleField />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Ir para o início">
          <span className="brand-mark">DM</span>
          <span>Daniel Messias</span>
        </a>

        <button
          className="icon-button menu-button"
          type="button"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={isMenuOpen ? "nav is-open" : "nav"} aria-label="Principal">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <Hero />
        <About />
        <Stack />
        <Challenges onSelect={setSelectedChallenge} />
        <Interests />
        <Hobbies />
        <Formation />
        <Footer />
      </main>

      {selectedChallenge ? (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
        />
      ) : null}
    </>
  );
}

function ParticleField() {
  return (
    <div className="ambient-field" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="hero section-shell">
      <div className="hero-copy">
        <p className="eyebrow">
          <MapPin size={16} />
          Joinville, SC - Desenvolvedor de Software
        </p>
        <h1>
          Engenharia para modernizar sistemas, simplificar operações e escalar
          produtos digitais.
        </h1>
        <p className="hero-lead">
          Sou Daniel Messias dos Santos. Atuo entre arquitetura, back-end,
          front-end e deploy para transformar sistemas críticos em soluções mais
          previsíveis, mensuráveis e fáceis de evoluir.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#desafios">
            Ver Meus Desafios
            <ArrowRight size={18} />
          </a>
          <a className="button secondary" href="/curriculo-daniel-messias.pdf">
            Baixar Currículo
            <Download size={18} />
          </a>
          <a
            className="button whatsapp"
            href={whatsAppLink}
            target="_blank"
            rel="noreferrer"
          >
            Conversar no WhatsApp
            <MessageCircle size={18} />
          </a>
        </div>
      </div>

      <div className="hero-visual" aria-label="Foto profissional de Daniel">
        {/* TODO: Insira a foto profissional em public/photos/daniel-hero.jpg e substitua este placeholder por:
            <img src="/photos/daniel-hero.jpg" alt="Daniel Messias dos Santos" />
        */}
        <div className="photo-placeholder hero-photo">
          <span>Foto profissional</span>
          <strong>Daniel Messias</strong>
        </div>
        <div className="signal-card">
          <BriefcaseBusiness size={18} />
          <span>Pleno/Sênior - .NET, React, Docker</span>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="section-shell split-section" id="sobre">
      <div className="section-copy">
        <p className="eyebrow">Get to know me</p>
        <h2>Perfil técnico com visão de produto e execução ponta a ponta.</h2>
        <p>
          Gosto de entrar nos problemas com calma, entender o contexto de negócio
          e traduzir isso em decisões técnicas claras. Minha atuação conecta
          System Design, implementação em .NET e React, integrações, deploy e
          acompanhamento por KPIs técnicos.
        </p>
        <p>
          Tenho interesse especial em modernização de legado, ambientes Linux com
          Docker, AI Agents e projetos paralelos com lógica de programação forte,
          incluindo criação de jogos e mecânicas em Luau no Roblox Studio.
        </p>
        <div className="social-row" aria-label="Redes sociais">
          {socialLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                className="social-link"
                href={link.href}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noreferrer" : undefined}
              >
                <Icon size={18} />
                {link.label}
              </a>
            );
          })}
        </div>
      </div>

      <div className="about-visual">
        {/* TODO: Insira uma foto mais descontraída em public/photos/daniel-setup.jpg e substitua o placeholder por:
            <img src="/photos/daniel-setup.jpg" alt="Daniel em sua rotina de trabalho" />
        */}
        <div className="photo-placeholder setup-photo">
          <span>Foto de rotina ou setup</span>
          <strong>Trabalho, código e contexto</strong>
        </div>
      </div>
    </section>
  );
}

function Stack() {
  return (
    <section className="section-shell" id="stack">
      <div className="section-heading">
        <p className="eyebrow">Tech stack & ferramentas</p>
        <h2>Stack apresentada para leitura rápida de recrutadores técnicos.</h2>
      </div>
      <div className="stack-grid">
        {stackGroups.map((group) => {
          const Icon = group.icon;
          return (
            <article className={`stack-card accent-${group.accent}`} key={group.title}>
              <div className="card-icon">
                <Icon size={22} />
              </div>
              <h3>{group.title}</h3>
              <div className="tag-list">
                {group.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Challenges({ onSelect }: { onSelect: (challenge: Challenge) => void }) {
  return (
    <section className="section-shell" id="desafios">
      <div className="section-heading compact">
        <p className="eyebrow">Desafios & soluções</p>
        <h2>Estudos de caso para mostrar raciocínio, impacto e maturidade.</h2>
      </div>
      <div className="challenge-grid">
        {challenges.map((challenge) => (
          <article className="challenge-card" key={challenge.title}>
            <div className={`challenge-cover cover-${challenge.coverTone}`}>
              {/* TODO: Para usar imagem real de capa, adicione um campo coverImage em src/data/portfolio.ts
                  e renderize <img src={challenge.coverImage} alt="" /> aqui.
              */}
              <span>{challenge.eyebrow}</span>
            </div>
            <div className="challenge-body">
              <h3>{challenge.title}</h3>
              <p>{challenge.summary}</p>
              <div className="tag-list small">
                {challenge.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <button
                className="text-button"
                type="button"
                onClick={() => onSelect(challenge)}
              >
                Ler sobre o desafio
                <ChevronRight size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Interests() {
  return (
    <section className="interest-band" id="interesses">
      <div className="section-shell interest-inner">
        <div className="section-heading">
          <p className="eyebrow">Áreas de interesse</p>
          <h2>Temas que movem estudo, prática e projetos paralelos.</h2>
        </div>
        <div className="interest-grid">
          {interests.map((interest) => {
            const Icon = interest.icon;
            return (
              <div className="interest-pill" key={interest.label}>
                <Icon size={18} />
                <span>{interest.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Hobbies() {
  return (
    <section className="section-shell hobbies-section" id="hobbies">
      <div className="section-heading compact">
        <p className="eyebrow">Hobbies & criação</p>
        <h2>Jogos, mapas e sistemas como laboratório criativo de engenharia.</h2>
        <p>
          Fora do fluxo corporativo, também desenvolvo jogos em Lua/Luau para
          Roblox. Gosto de modelar mapas, criar funcionalidades, testar mecânicas
          e estudar renderização, path tracing e efeitos visuais.
        </p>
      </div>
      <div className="hobby-grid">
        {hobbies.map((hobby) => {
          const Icon = hobby.icon;
          return (
            <article className="hobby-card" key={hobby.title}>
              <div className="card-icon">
                <Icon size={22} />
              </div>
              <h3>{hobby.title}</h3>
              <p>{hobby.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Formation() {
  return (
    <section className="section-shell" id="formacao">
      <div className="section-heading compact">
        <p className="eyebrow">Evolução contínua</p>
        <h2>Formação, cursos e estudos em andamento.</h2>
      </div>
      <div className="timeline">
        {timeline.map((item) => {
          const Icon = item.icon;
          return (
            <article className="timeline-item" key={item.title}>
              <div className="timeline-icon">
                <Icon size={20} />
              </div>
              <div>
                <p className="timeline-meta">{item.meta}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="contato">
      <div className="section-shell footer-inner">
        <div>
          <p className="eyebrow">Vamos conversar</p>
          <h2>Aberto a desafios Pleno/Sênior em times que valorizam engenharia.</h2>
          <a className="button primary footer-cta" href="mailto:daniel@email.com">
            Me envie um e-mail
            <Mail size={18} />
          </a>
          <a
            className="button whatsapp footer-cta"
            href={whatsAppLink}
            target="_blank"
            rel="noreferrer"
          >
            Chamar no WhatsApp
            <MessageCircle size={18} />
          </a>
        </div>
        <div className="footer-links">
          <div>
            <h3>Seções</h3>
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
          <div>
            <h3>Redes</h3>
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.isExternal ? "_blank" : undefined}
                  rel={link.isExternal ? "noreferrer" : undefined}
                >
                  <Icon size={16} />
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

function ChallengeModal({
  challenge,
  onClose,
}: {
  challenge: Challenge;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="icon-button modal-close"
          type="button"
          aria-label="Fechar desafio"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <p className="eyebrow">{challenge.eyebrow}</p>
        <h2 id="challenge-title">{challenge.title}</h2>
        {challenge.details.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="modal-image-grid">
          {challenge.imageSlots.map((slot) => (
            <div className="modal-image-placeholder" key={slot}>
              {slot}
            </div>
          ))}
        </div>
        <a className="text-button" href={challenge.href}>
          Abrir página completa
          <ExternalLink size={18} />
        </a>
        {/* TODO: Se preferir páginas reais em vez de modal, crie rotas como /desafios/:slug
            e use challenge.href para apontar para textos longos, galerias e métricas do estudo de caso.
        */}
      </section>
    </div>
  );
}
