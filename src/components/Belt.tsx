import { useMemo, useState, type PointerEvent } from "react";
import { beltRows, type BeltItem } from "../data/portfolio";
import { brandIcons } from "../data/brandIcons";

const total = beltRows.reduce((sum, row) => sum + row.length, 0);

function hash(text: string) {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 1;
}

/** Código de barras decorativo, sempre igual para o mesmo texto. */
function barcodeRects(text: string) {
  let seed = hash(text);
  const random = () => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 4294967296;
  };
  const rects: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 150) {
    const w = 1 + Math.floor(random() * 3);
    rects.push({ x, w });
    x += w + 1 + Math.floor(random() * 2.5);
  }
  return rects;
}

/** Logo oficial (Devicon) quando existe; senão o ícone Lucide do item. */
function LabelIcon({ item }: { item: BeltItem }) {
  const brand = brandIcons[item.id];
  if (brand) {
    return (
      <svg
        className="label-icon"
        viewBox={brand.viewBox}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: brand.body }}
      />
    );
  }
  const Icon = item.icon;
  return Icon ? <Icon className="label-icon is-lucide" aria-hidden="true" strokeWidth={2.2} /> : null;
}

function Label({ item, number, state }: { item: BeltItem; number: number; state: "idle" | "scanning" | "read" }) {
  const rects = useMemo(() => barcodeRects(item.id), [item.id]);
  return (
    <div className={`label${state === "idle" ? "" : ` is-${state}`}`} data-id={item.id}>
      <div className="label-top">
        <span>TX-{String(number).padStart(4, "0")}</span>
        <span>{item.cat}</span>
      </div>
      <div className="label-name">
        <LabelIcon item={item} />
        {item.name}
      </div>
      <svg viewBox="0 0 150 30" preserveAspectRatio="none" aria-hidden="true">
        {rects.map((rect) => (
          <rect key={rect.x} x={rect.x} width={rect.w} height="30" />
        ))}
      </svg>
      <div className="label-foot">
        <span>
          VOL {number}/{total}
        </span>
        <span>DOCA {((number - 1) % 6) + 1}</span>
      </div>
      <span className="laser" aria-hidden="true" />
      <span className="stamp" aria-hidden="true">
        LIDO
      </span>
    </div>
  );
}

/** A stack vira etiquetas de carga numa esteira. Passar o mouse "bipa" a etiqueta. */
export function StackBelt() {
  const [scanning, setScanning] = useState<string[]>([]);
  const [read, setRead] = useState<string[]>([]);

  const onOver = (event: PointerEvent<HTMLDivElement>) => {
    const label = (event.target as HTMLElement).closest<HTMLElement>(".label");
    const id = label?.dataset.id;
    if (!id || read.includes(id) || scanning.includes(id)) return;
    setScanning((current) => [...current, id]);
    window.setTimeout(() => {
      setScanning((current) => current.filter((value) => value !== id));
      setRead((current) => (current.includes(id) ? current : [...current, id]));
    }, 550);
  };

  const stateOf = (id: string) => (read.includes(id) ? "read" : scanning.includes(id) ? "scanning" : "idle");
  let offset = 0;

  return (
    <section className="section belt-section" id="stack" aria-labelledby="stack-title">
      <div className="shell belt-head">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow-index">06</span>
            Stack
          </p>
          <h2 id="stack-title">
            Ferramentas de produção. <span className="muted">Passe o mouse numa etiqueta.</span>
          </h2>
        </div>
        <p className="belt-counter" aria-live="polite" data-reveal>
          <b>{read.length}</b>/{total} etiquetas lidas
        </p>
      </div>

      <div className="belts" onPointerOver={onOver}>
        {beltRows.map((row, rowIndex) => {
          const start = offset;
          offset += row.length;
          return (
            <div className={`belt${rowIndex % 2 ? " is-reverse" : ""}`} key={rowIndex}>
              <div className="belt-track">
                {[0, 1].map((copy) => (
                  <div className="belt-set" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                    {row.map((item, index) => (
                      <Label key={item.id} item={item} number={start + index + 1} state={stateOf(item.id)} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shell">
        <p className={`belt-done${read.length === total ? " is-shown" : ""}`} aria-live="polite">
          {read.length === total
            ? `${total}/${total}. Você acabou de fazer o que meus sistemas fazem o dia inteiro com RFID.`
            : ""}
        </p>
      </div>
    </section>
  );
}
