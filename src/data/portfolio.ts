import {
  Bot,
  Boxes,
  BrainCircuit,
  Code2,
  Cpu,
  Database,
  Gamepad2,
  Github,
  GraduationCap,
  Instagram,
  Layers3,
  Linkedin,
  Map,
  MessageCircle,
  MonitorCog,
  Network,
  Route,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SocialLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  isExternal?: boolean;
};

export type StackGroup = {
  title: string;
  icon: LucideIcon;
  accent: "cyan" | "green" | "amber" | "coral";
  items: string[];
};

export type Challenge = {
  title: string;
  eyebrow: string;
  summary: string;
  tags: string[];
  coverTone: "cyan" | "green" | "amber";
  details: string[];
  imageSlots: string[];
  href: string;
};

export type Hobby = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const whatsAppLink =
  "https://wa.me/5512996777673?text=Ol%C3%A1%20vi%20seu%20site%20portifolio%20e%20gostaria%20de%20conversar%20e%20conhecer%20melhor%20o%20seu%20perfil";

export const socialLinks: SocialLink[] = [
  {
    label: "GitHub",
    // TODO: Substitua pelo GitHub real do Daniel.
    href: "https://github.com/",
    icon: Github,
  },
  {
    label: "LinkedIn",
    // TODO: Substitua pelo LinkedIn real do Daniel.
    href: "https://www.linkedin.com/",
    icon: Linkedin,
  },
  {
    label: "Instagram",
    // TODO: Substitua pelo Instagram real do Daniel.
    href: "https://www.instagram.com/",
    icon: Instagram,
  },
  {
    label: "WhatsApp",
    href: whatsAppLink,
    icon: MessageCircle,
    isExternal: true,
  },
];

export const stackGroups: StackGroup[] = [
  {
    title: "Back-end",
    icon: ServerCog,
    accent: "cyan",
    items: [".NET 8", ".NET Framework", "System Design", "Redis"],
  },
  {
    title: "Front-end",
    icon: Code2,
    accent: "green",
    items: ["React", "TypeScript", "Blazor", "Bulma", "Radzen"],
  },
  {
    title: "Infra & DevOps",
    icon: Boxes,
    accent: "amber",
    items: ["Docker", "Linux", "IIS", "Deploy conteinerizado"],
  },
  {
    title: "Inovação & Outros",
    icon: BrainCircuit,
    accent: "coral",
    items: ["AI Agents", "Criação de KPIs", "Lua/Luau", "Roblox Studio"],
  },
];

export const challenges: Challenge[] = [
  {
    title: "PortalXPM",
    eyebrow: "Modernização de produto",
    summary:
      "Refatoração em Blazor .NET 8, gestão eficiente de sessões e preparação para deploy moderno em containers Linux.",
    tags: ["Blazor", ".NET 8", "Docker", "Sessões"],
    coverTone: "cyan",
    details: [
      "O desafio parte de um cenário típico de produto em evolução: reduzir dependências legadas, melhorar previsibilidade de deploy e deixar a base mais preparada para novas entregas.",
      "A abordagem proposta combina revisão de arquitetura, refatoração incremental e organização de indicadores técnicos para medir estabilidade, performance e tempo de entrega.",
    ],
    imageSlots: ["Arquitetura antes/depois", "Fluxo de sessões", "Pipeline de deploy"],
    // TODO: Para página dedicada, troque por "/desafios/portalxpm".
    // Para conteúdo remoto, este campo pode receber um slug vindo de CMS, MDX ou API.
    href: "#portalxpm",
  },
  {
    title: "IIS para Docker",
    eyebrow: "Evolução de infraestrutura",
    summary:
      "Plano de migração de ambientes Windows/IIS para containers em Linux, com foco em manutenção, portabilidade e escala.",
    tags: ["IIS", "Docker", "Linux", "DevOps"],
    coverTone: "green",
    details: [
      "A solução prioriza redução de variação entre ambientes, documentação do processo de release e execução consistente em Linux.",
      "O resultado esperado é uma operação mais simples de reproduzir, com menor fricção para testes, rollback e novas integrações.",
    ],
    imageSlots: ["Mapa de migração", "Dockerfile", "Checklist de release"],
    href: "#iis-para-docker",
  },
  {
    title: "KPIs Técnicos",
    eyebrow: "Engenharia orientada a resultado",
    summary:
      "Definição de métricas para conectar decisões técnicas a impacto de negócio: estabilidade, tempo de entrega e manutenção.",
    tags: ["KPIs", "Observabilidade", "Qualidade", "Produto"],
    coverTone: "amber",
    details: [
      "O trabalho transforma decisões de engenharia em sinais acompanháveis por times técnicos e stakeholders.",
      "A proposta inclui indicadores de saúde do sistema, gargalos de entrega e evolução do débito técnico.",
    ],
    imageSlots: ["Dashboard", "Matriz de decisão", "Relatório executivo"],
    href: "#kpis-tecnicos",
  },
];

export const interests = [
  { label: "Arquitetura de Software", icon: Network },
  { label: "AI Agents", icon: Bot },
  { label: "Game Development", icon: Sparkles },
  { label: "Cloud Native", icon: Layers3 },
  { label: "Performance", icon: MonitorCog },
  { label: "Dados & Redis", icon: Database },
  { label: "Segurança Aplicada", icon: ShieldCheck },
  { label: "DX e Automação", icon: TerminalSquare },
];

export const hobbies: Hobby[] = [
  {
    title: "Game development em Lua/Luau",
    description:
      "Desenvolvimento de jogos e sistemas para Roblox, unindo lógica de programação, prototipagem e experiência do jogador.",
    icon: Gamepad2,
  },
  {
    title: "Modelagem de mapas",
    description:
      "Criação e organização de ambientes jogáveis, pensando em navegação, ritmo, ambientação e leitura visual do cenário.",
    icon: Map,
  },
  {
    title: "Funcionalidades e mecânicas",
    description:
      "Construção de interações, regras, progressão e sistemas que dão vida ao mapa e tornam a experiência mais dinâmica.",
    icon: Route,
  },
  {
    title: "Path tracing e render",
    description:
      "Interesse por iluminação, renderização, path tracing e técnicas visuais que aproximam programação de estética.",
    icon: Cpu,
  },
];

export const timeline = [
  {
    title: "Análise e Desenvolvimento de Sistemas",
    meta: "UniFatecie",
    description:
      "Base acadêmica aplicada à construção, manutenção e evolução de sistemas reais.",
    icon: GraduationCap,
  },
  {
    title: "Cursos concluídos",
    meta: "Placeholders editáveis",
    description:
      "Reserve este bloco para certificados de .NET, React, Docker, arquitetura ou liderança técnica.",
    icon: ShieldCheck,
  },
  {
    title: "Em andamento",
    meta: "Aprendizado contínuo",
    description:
      "Espaço para destacar o que Daniel está estudando agora, reforçando ritmo de evolução e curiosidade técnica.",
    icon: BrainCircuit,
  },
];
