import { useRef } from "react";
import { GitCommitHorizontal } from "lucide-react";
import { stats, type Stat } from "../data/portfolio";
import { useInView } from "../hooks";

/** Número que rola dígito a dígito, como painel de pátio. */
function Odometer({ stat, run }: { stat: Stat; run: boolean }) {
  const text = stat.value.toLocaleString("pt-BR");
  const full = `${stat.prefix ?? ""}${text}${stat.suffix ?? ""}`;
  let digitIndex = 0;

  return (
    <span className="stat-value">
      <span className="sr-only">{full}</span>
      <span className="odo" aria-hidden="true">
        {stat.prefix ? <span>{stat.prefix}</span> : null}
        {Array.from(text).map((char, index) => {
          if (!/\d/.test(char)) return <span key={index}>{char}</span>;
          const digit = Number(char);
          const order = digitIndex++;
          return (
            <span className="odo-col" key={index}>
              <span
                className="odo-strip"
                style={{
                  transform: run ? `translateY(-${10 + digit}em)` : "translateY(0)",
                  transitionDelay: `${order * 90}ms`,
                }}
              >
                {Array.from({ length: 20 }, (_, n) => (
                  <span key={n}>{n % 10}</span>
                ))}
              </span>
            </span>
          );
        })}
        {stat.suffix ? <span className="odo-suffix">{stat.suffix}</span> : null}
      </span>
    </span>
  );
}

export function Stats() {
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
                <Odometer stat={stat} run={inView} />
                <span className="stat-label">{stat.label}</span>
              </dt>
              <dd>{stat.detail}</dd>
            </div>
          ))}
        </dl>
        <p className="stats-source">
          <GitCommitHorizontal size={16} aria-hidden="true" />
          Números tirados do histórico git dos meus repositórios, não estimados.
        </p>
      </div>
    </section>
  );
}
