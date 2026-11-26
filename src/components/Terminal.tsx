import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { cases, profile, socialLinks, whatsAppLink } from "../data/portfolio";

type Line = { id: number; html: string; kind?: "cmd" };

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);

const acc = (text: string) => `<span class="acc">${text}</span>`;
const link = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`;

/** Terminal escondido (tecla /) + alerta Andon (digitar "andon" fora do terminal). */
export function Terminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [andon, setAndon] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(0);
  const seq = useRef(0);
  const andonTimer = useRef(0);

  const triggerAndon = useCallback(() => {
    setAndon(true);
    window.clearTimeout(andonTimer.current);
    andonTimer.current = window.setTimeout(() => setAndon(false), 4200);
  }, []);

  const print = useCallback((html: string, kind?: Line["kind"]) => {
    seq.current += 1;
    const id = seq.current;
    setLines((current) => [...current, { id, html, kind }]);
  }, []);

  const openTerminal = useCallback(() => {
    lastFocus.current = document.activeElement;
    setOpen(true);
  }, []);

  const closeTerminal = useCallback(() => {
    setOpen(false);
    (lastFocus.current as HTMLElement | null)?.focus?.();
  }, []);

  const commands: Record<string, () => string | null> = {
    help: () =>
      `comandos: ${["whoami", "cases", "stack", "contato", "ls", "andon", "sudo contratar", "clear", "exit"]
        .map(acc)
        .join(" · ")}\n<span class="dim">tab completa · ↑ repete</span>`,
    whoami: () =>
      `${profile.name} · full stack .NET + React · ${profile.location}\n7 anos no mesmo sistema crítico. ${acc("1.573")} commits em 23 repositórios.`,
    cases: () =>
      cases
        .map((item, index) => `${String(index + 1).padStart(2, "0")}  ${escapeHtml(item.title)}  ${acc(`[${escapeHtml(item.metric.value)}]`)}`)
        .join("\n"),
    stack: () => "C# · .NET 8 · Blazor · React · TypeScript · PostgreSQL · Oracle · RabbitMQ\nDocker · Kubernetes · AWS · Python · YOLOv8 · IA · RFID UHF · Zebra ZPL · 4GL\ntrabalho em equipe, sempre",
    contato: () =>
      socialLinks.map((item) => `${item.label.toLowerCase().padEnd(10)} ${link(item.href, item.handle)}`).join("\n"),
    ls: () => `cases/  stack/  contato/  ${acc("segredos.txt")}`,
    "cat segredos.txt": () =>
      "1. digite andon em qualquer lugar da página (fora daqui)\n2. leia todas as etiquetas da esteira\n3. você já achou o terminal ;)",
    andon: () => {
      triggerAndon();
      return `${acc("⚠ chamado aberto na linha 3.")} manutenção a caminho.`;
    },
    "sudo contratar": () => {
      window.open(whatsAppLink, "_blank", "noreferrer");
      return `[sudo] senha para recrutador: ********\n${acc("permissão concedida.")} abrindo o WhatsApp do Daniel…`;
    },
    clear: () => {
      setLines([]);
      return null;
    },
    exit: () => {
      closeTerminal();
      return null;
    },
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (lines.length === 0) print(`bem-vindo ao terminal do Daniel. digite ${acc("help")}.`);
  }, [open]);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    let typed = "";
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        closeTerminal();
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, [contenteditable='true']")) return;
      if (!open && (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k"))) {
        event.preventDefault();
        openTerminal();
        return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        typed = (typed + event.key.toLowerCase()).slice(-5);
        if (typed === "andon") triggerAndon();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openTerminal, closeTerminal, triggerAndon]);

  useEffect(() => () => window.clearTimeout(andonTimer.current), []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = inputRef.current;
    if (!input) return;
    const command = input.value.trim();
    input.value = "";
    if (!command) return;
    history.current.push(command);
    historyIndex.current = history.current.length;
    print(`❯ ${escapeHtml(command)}`, "cmd");
    const run = commands[command.toLowerCase()];
    const result = run ? run() : `comando não encontrado: ${escapeHtml(command)}. digite ${acc("help")}.`;
    if (result) print(result);
  };

  const onInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    if (event.key === "Tab") {
      event.preventDefault();
      const match = Object.keys(commands).find((name) => input.value && name.startsWith(input.value.toLowerCase()));
      if (match) input.value = match;
    } else if (event.key === "ArrowUp" && historyIndex.current > 0) {
      event.preventDefault();
      historyIndex.current -= 1;
      input.value = history.current[historyIndex.current];
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex.current = Math.min(historyIndex.current + 1, history.current.length);
      input.value = history.current[historyIndex.current] ?? "";
    }
  };

  return (
    <>
      <div className={`andon-layer${andon ? " is-on" : ""}`} aria-hidden="true">
        <div className="andon-banner">⚠ Chamado Andon · linha 3 · manutenção a caminho</div>
      </div>

      <button className="term-fab" type="button" onClick={openTerminal} aria-label="Abrir terminal (atalho: barra)">
        <span aria-hidden="true">&gt;_</span> terminal <kbd aria-hidden="true">/</kbd>
      </button>

      {open ? (
        <div
          className="term"
          role="dialog"
          aria-modal="true"
          aria-label="Terminal"
          onClick={(event) => event.target === event.currentTarget && closeTerminal()}
        >
          <div className="term-box">
            <div className="term-bar">
              <span>daniel@portfolio: ~</span>
              <button type="button" onClick={closeTerminal}>
                esc para fechar
              </button>
            </div>
            <div className="term-out" ref={outRef} aria-live="polite">
              {lines.map((line) => (
                <div key={line.id} className={line.kind} dangerouslySetInnerHTML={{ __html: line.html }} />
              ))}
            </div>
            <form className="term-in" onSubmit={onSubmit}>
              <span aria-hidden="true">❯</span>
              <input ref={inputRef} autoComplete="off" spellCheck={false} aria-label="Comando" onKeyDown={onInputKey} />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
