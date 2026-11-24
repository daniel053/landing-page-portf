import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { hardware, pipelineSteps } from "../data/portfolio";

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

/** O console do hero vira a história da página: um caminhão desce do pátio ao ERP conforme o scroll. */
export function Pipeline() {
  const [step, setStep] = useState(0);
  const [centers, setCenters] = useState<number[]>([]);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setStep(stepRefs.current.indexOf(entry.target as HTMLElement));
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    stepRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const measure = () =>
      setCenters(nodeRefs.current.map((node) => (node ? node.offsetTop + node.offsetHeight / 2 : 0)));
    measure();
    const observer = new ResizeObserver(measure);
    if (nodesRef.current) observer.observe(nodesRef.current);
    return () => observer.disconnect();
  }, []);

  const first = centers[0] ?? 0;
  const last = centers[centers.length - 1] ?? 0;
  const current = centers[step] ?? 0;

  return (
    <section className="section pipeline" id="pipeline" aria-labelledby="pipeline-title">
      <div className="shell">
        <header className="section-heading" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow-index">01</span>
            Como funciona
          </p>
          <h2 id="pipeline-title">
            Meu código não fica só na tela. <span className="muted">Role e acompanhe um caminhão.</span>
          </h2>
          <ul className="devices" aria-label="Hardware que já integrei">
            {hardware.map((device) => {
              const Icon = device.icon;
              return (
                <li key={device.label}>
                  <Icon size={16} aria-hidden="true" />
                  {device.label}
                </li>
              );
            })}
          </ul>
        </header>

        <div className="pipe">
          <div className="pipe-sticky">
            <div className="pipe-panel">
              <p className="pipe-head">
                <span>
                  viagem <b>#7741</b>
                </span>
                <span>BRA2E19</span>
              </p>
              <div className="pipe-nodes" ref={nodesRef}>
                <span className="pipe-rail" style={{ top: first, height: last - first }} aria-hidden="true">
                  <span className="pipe-fill" style={{ height: current - first }} />
                </span>
                <span className="truck" style={{ transform: `translateY(${current - 12}px)` }} aria-hidden="true">
                  <TruckIcon />
                </span>
                {pipelineSteps.map((item, index) => (
                  <div
                    key={item.node}
                    ref={(node) => {
                      nodeRefs.current[index] = node;
                    }}
                    className={`pipe-node${index <= step ? " is-on" : ""}${index === step ? " is-active" : ""}`}
                  >
                    <p className="pn-name">{item.node}</p>
                    <p className="pn-sub">{item.sub}</p>
                  </div>
                ))}
              </div>
              <p className="pipe-log" aria-live="polite">
                {pipelineSteps[step].log.map(([tag, text], index) => (
                  <span key={tag}>
                    {index > 0 ? " · " : null}
                    <b>{tag}</b> {text}
                  </span>
                ))}
              </p>
            </div>
          </div>

          <div className="pipe-steps">
            {pipelineSteps.map((item, index) => (
              <article
                key={item.node}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
                className={`pipe-step${index === step ? " is-active" : ""}`}
              >
                <p className="ps-index">
                  {String(index + 1).padStart(2, "0")} · {item.node}
                </p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {index === pipelineSteps.length - 1 ? (
                  <a className="button primary" href="#cases">
                    Ver os cases
                    <ArrowRight size={18} aria-hidden="true" />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
