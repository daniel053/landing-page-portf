import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../hooks";

const KEY = "dm-boot";
const lines = ["inicializando pátio", "conectando antenas RFID", "sincronizando ERP"];

function alreadyBooted() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

/** Tela de 0,8 s na primeira visita da sessão. Qualquer tecla ou clique pula. */
export function Boot() {
  const [phase, setPhase] = useState<"run" | "out" | "hidden">(() =>
    prefersReducedMotion() || alreadyBooted() ? "hidden" : "run",
  );
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (phase === "run") {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* sem sessionStorage: segue sem lembrar */
      }
      const steps = [110, 330, 550].map((ms, index) => window.setTimeout(() => setShown(index + 1), ms));
      const end = window.setTimeout(() => setPhase("out"), 820);
      const skip = () => setPhase("out");
      window.addEventListener("keydown", skip);
      window.addEventListener("pointerdown", skip);
      return () => {
        steps.forEach(window.clearTimeout);
        window.clearTimeout(end);
        window.removeEventListener("keydown", skip);
        window.removeEventListener("pointerdown", skip);
      };
    }
    if (phase === "out") {
      const timer = window.setTimeout(() => setPhase("hidden"), 380);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div className={`boot${phase === "out" ? " is-out" : ""}`} aria-hidden="true">
      <div className="boot-inner">
        {lines.map((line, index) => (
          <p key={line} className={index < shown ? "is-on" : undefined}>
            <span className="boot-caret">›</span>
            {line}
            <span className="boot-dots" />
            <b>ok</b>
          </p>
        ))}
      </div>
    </div>
  );
}
