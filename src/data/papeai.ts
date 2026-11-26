import { Compass, Ear, KeyRound, Smartphone, SlidersHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Clip } from "../three/papeaiScene";

/* ------------------------------------------------------------------ */
/*  Seção "Projetos com IA": PapeAI, projeto pessoal em andamento.     */
/*  Fatos tirados do repositório PapeAI (docs/). Nada de números de   */
/*  resultado: o app ainda está na fase F00 (planejamento).            */
/* ------------------------------------------------------------------ */

export type Turn = {
  /** O que o aluno "diz" (botão). */
  prompt: string;
  /** Resposta do sagui, em inglês. */
  reply: string;
  /** Dica em português embaixo da resposta. */
  note?: string;
  clip: Clip;
};

export const papeai = {
  name: "PapeAI",
  status: "Projeto pessoal · em andamento",
  phase: { current: 0, total: 13, label: "Fase F00 · planejamento e arquitetura" },
  lead: "Um sagui 3D que mora no seu celular e conversa em inglês com você. A trilha é montada para o que você quer fazer: trabalhar como dev, viajar, mudar de país.",
  byok: {
    title: "Traga sua chave. O app não te cobra nada.",
    body: "Se você é dev e já tem uma chave de API, usa o PapeAI sem assinatura: paga só o que consumir, direto ao provedor. A chave fica cifrada no seu aparelho e nunca passa pelos meus servidores.",
  },
  pillars: [
    { icon: Smartphone, title: "Sagui 3D no aparelho", body: "Renderizado no celular: não gasta tokens." },
    { icon: Compass, title: "Trilha pelo seu objetivo", body: "Daily de dev, aeroporto, entrevista." },
    { icon: SlidersHorizontal, title: "Professor do seu jeito", body: "Gentil, equilibrado ou sem filtro." },
    { icon: Ear, title: "Escuta honesta", body: "Mostra palavra por palavra o que entendeu." },
  ] satisfies { icon: LucideIcon; title: string; body: string }[],
  quote:
    "Conhecimento e aprendizado devem ser para todo mundo. Se a gente facilita para mais gente aprender e compartilhar, constrói um mundo melhor.",
  stack: ["React", "TypeScript", "three.js", "Claude API", "Supabase", "PWA + Capacitor", "Código aberto · GPL-3.0"],
  keyIcon: KeyRound,

  /* roteiro da demo */
  intro: "Hey! Plug in your API key and let's talk.",
  hello: "Yay! Your key stays right here, on this phone. What do you want to practice?",
  turns: [
    {
      prompt: "I goed to the beach yesterday.",
      reply: "Almost! We say “I went to the beach”. Great story, though!",
      note: "go → went: passado irregular",
      clip: "thumbs",
    },
    {
      prompt: "I have a job interview next week.",
      reply: "Let's rehearse! First question: tell me about yourself.",
      note: "trilha: entrevista para vaga de dev",
      clip: "happy",
    },
    {
      prompt: "I'm agree with you.",
      reply: "Again?! It's just “I agree”. No “am” there.",
      note: "modo sem filtro, só se você pedir",
      clip: "facepalm",
    },
    {
      prompt: "See you tomorrow!",
      reply: "Bye! Ten minutes a day beats three hours a month.",
      note: "constância vence intensidade",
      clip: "wave",
    },
  ] satisfies Turn[],
  pokes: ["Hehe, that tickles!", "Psst… practice makes progress.", "I'm small, but my vocabulary is huge!", "Hey! I'm teaching here."],
  stageLabel:
    "Animação 3D interativa: um celular com um sagui low-poly saindo da tela. Uma chave verde-limão orbita o aparelho e, ao ser conectada, entra na lateral do celular. O sagui responde frases em inglês com gestos.",
};
