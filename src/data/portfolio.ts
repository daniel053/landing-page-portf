import {
  Bot,
  Box,
  Cctv,
  Compass,
  Cpu,
  Database,
  Factory,
  Gamepad2,
  Gauge,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
  PenTool,
  Printer,
  Radio,
  Scale,
  Server,
  ShieldCheck,
  Siren,
  Smartphone,
  Sparkles,
  Truck,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tudo que aparece na página sai deste arquivo.                       */
/*  Os números marcados com "fonte:" foram tirados do histórico git     */
/*  dos repositórios em 23/11/2026. Atualize quando quiser.            */
/* ------------------------------------------------------------------ */

const base = import.meta.env.BASE_URL;

export const profile = {
  name: "Daniel Messias dos Santos",
  shortName: "Daniel Messias",
  role: "Desenvolvedor Full Stack .NET + React",
  location: "Joinville, SC",
  workModel: "CLT ou PJ · remoto ou híbrido",
  available: true,
  email: "danielmessias053@gmail.com",
  cvUrl: `${base}curriculo-daniel-messias.pdf`,
  // Para usar foto: salve em public/photos/daniel.jpg e troque null por `${base}photos/daniel.jpg`.
  photo: null as string | null,
};

export const whatsAppLink =
  "https://wa.me/5512996777673?text=Ol%C3%A1%20Daniel%2C%20vi%20seu%20portf%C3%B3lio%20e%20gostaria%20de%20conversar.";

export type SocialLink = {
  label: string;
  handle: string;
  href: string;
  icon: LucideIcon;
};

export const socialLinks: SocialLink[] = [
  {
    label: "WhatsApp",
    handle: "(12) 99677-7673",
    href: whatsAppLink,
    icon: MessageCircle,
  },
  {
    label: "LinkedIn",
    handle: "in/daniel-dotnet-dev",
    href: "https://www.linkedin.com/in/daniel-dotnet-dev",
    icon: Linkedin,
  },
  {
    label: "GitHub",
    handle: "daniel053",
    href: "https://github.com/daniel053",
    icon: Github,
  },
  {
    label: "E-mail",
    handle: profile.email,
    href: `mailto:${profile.email}`,
    icon: Mail,
  },
];

/* ---------------------------- Prova social ---------------------------- */

export type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  detail: string;
};

export const stats: Stat[] = [
  {
    value: 7,
    suffix: " anos",
    label: "no mesmo sistema crítico",
    // fonte: primeiro commit em set/2019, último em nov/2026
    detail: "Primeiro commit em 2019. O mais recente, este mês. E a plataforma segue em produção.",
  },
  {
    value: 1500,
    suffix: "+",
    label: "commits em produção",
    // fonte: 1.573 commits de autoria própria em 23 repositórios
    detail: "Em 20+ sistemas de clientes reais: logística, portos e indústria automotiva.",
  },
  {
    value: 69,
    suffix: "%",
    label: "dos commits da plataforma principal",
    // fonte: 689 de 1.003 commits
    detail: "689 de 1.003. Na prática, sou o principal mantenedor do sistema.",
  },
  {
    value: 6,
    label: "tipos de hardware integrados",
    detail: "Antenas RFID, câmeras, balanças, impressoras Zebra, coletores e painéis Andon.",
  },
];

/* ------------------------------- Cases ------------------------------- */

export type CaseStudy = {
  id: string;
  sector: string;
  icon: LucideIcon;
  title: string;
  hook: string;
  metric: { value: string; label: string };
  challenge: string;
  built: string;
  results: string[];
  stack: string[];
  period: string;
};

export const cases: CaseStudy[] = [
  {
    id: "portaria-lpr",
    sector: "Logística · Terminais",
    icon: Cctv,
    title: "A portaria que lê placas sozinha",
    hook: "O caminhão encosta, a câmera reconhece a placa, o sistema registra a passagem. Ninguém digita nada.",
    metric: { value: "2", label: "modelos de visão computacional treinados: placas Mercosul e códigos de contêiner" },
    challenge:
      "Entradas e saídas de veículos eram apontadas à mão na portaria. Isso gerava fila, erro de digitação e um histórico em que ninguém confiava na hora de auditar.",
    built:
      "Um microsserviço em Python com YOLOv8 e PyTorch para detectar veículos, placas e contêineres, com rastreamento multi-objeto (SORT) para não duplicar leituras. Cada passagem vai para a API .NET da plataforma logística, e as imagens de evidência ficam na AWS S3.",
    results: [
      "Passagem registrada automaticamente, direto da câmera",
      "Placa, tag RFID e pesagem cruzadas no mesmo evento",
      "Evidência em imagem para cada passagem, pronta para auditoria",
    ],
    stack: ["Python", "YOLOv8", "PyTorch", "OpenCV", "SORT", "AWS S3", ".NET API"],
    period: "2024",
  },
  {
    id: "plataforma-logistica",
    sector: "WMS · Multi-tenant",
    icon: Truck,
    title: "A plataforma logística que eu evoluo há 7 anos",
    hook: "Sistema crítico não para pra ser reescrito. Ele evolui toda semana, com carga real rodando.",
    metric: { value: "689", label: "commits meus de 1.003 no total, de set/2019 até hoje" },
    challenge:
      "Uma plataforma multi-cliente que orquestra expedição, docas, pesagem, notas fiscais, portaria e integrações com ERPs e marketplaces para vários operadores logísticos. Tudo isso sem janela de parada.",
    built:
      "Módulos de expedição, balança, docas, portaria com LPR, importação de NF-e/DANFE, auditoria de integrações e conectores de ERP em ASP.NET Core (ABP) + Angular sobre PostgreSQL. O deploy roda em containers Docker na AWS, com pipelines separados para desenvolvimento, homologação e produção.",
    results: [
      "Principal mantenedor do sistema desde 2019",
      "3 ambientes com build e deploy automatizados na AWS",
      "Integrada aos ERPs TOTVS Logix e Senior",
    ],
    stack: ["C#", "ASP.NET Core", "ABP", "Angular", "PostgreSQL", "Docker", "AWS ECR", "Elastic Beanstalk"],
    period: "2019 — hoje",
  },
  {
    id: "planejamento-automotivo",
    sector: "Indústria automotiva",
    icon: Factory,
    title: "Planejamento de produção para uma multinacional de autopeças",
    hook: "O pedido da montadora entra, a capacidade é calculada e o embarque sai etiquetado, tudo no mesmo portal.",
    metric: { value: "187", label: "commits meus em 3+ anos de evolução contínua" },
    challenge:
      "Para cruzar call-offs de montadoras, capacidade produtiva e embarques, o planejamento precisava de uma visão única do chão de fábrica, sincronizada com o ERP.",
    built:
      "Um portal Blazor com cockpit de produção, importação de call-offs, capacidade produtiva, PFEP (Plan For Every Part), Kanban, eficiência de mão de obra diária e gestão de embarques com etiquetas, sincronizado com o ERP por jobs agendados.",
    results: [
      "Call-off, capacidade e embarque num fluxo único",
      "Painéis de Kanban e eficiência de mão de obra",
      "Em evolução contínua de 2023 a 2026",
    ],
    stack: ["Blazor", ".NET", "Oracle", "Jobs agendados", "TOTVS Logix"],
    period: "2023 — 2026",
  },
  {
    id: "portal-kpis",
    sector: "Operação logística",
    icon: Gauge,
    title: "Portal de KPIs construído sozinho, do zero ao container",
    hook: "Sete indicadores críticos da operação num só lugar, do SLA ao inventário, atualizados por jobs.",
    metric: { value: "7", label: "painéis de KPI: SLA, IQS, RNC, entradas, saídas, inventário e estoque" },
    challenge:
      "A operação precisava acompanhar qualidade, nível de serviço e estoque com dados vindos de um Oracle na nuvem. E precisava de um deploy simples de repetir.",
    built:
      "Fiz tudo ponta a ponta, sozinho: Blazor .NET 8, autenticação com Identity e 2FA, os sete painéis de KPI, impressão de etiquetas Zebra (ZPL), jobs de reprocessamento e deploy versionado em Docker numa VPS Linux conectada a Oracle na AWS RDS.",
    results: [
      "Do primeiro commit à produção com 1 dev",
      "Deploy versionado por imagem Docker, com rollback trivial",
      "Login com segundo fator de autenticação",
    ],
    stack: [".NET 8", "Blazor", "Docker", "Linux", "Oracle · AWS RDS", "Identity 2FA", "ZPL"],
    period: "2026",
  },
];

export type SideProject = {
  title: string;
  description: string;
  tags: string[];
  year: string;
};

export const sideProjects: SideProject[] = [
  {
    title: "Integrador ERP Senior ↔ WMS",
    description:
      "API, jobs e um conector dedicado que sincronizam pedidos, itens atendidos e volumes de conferência entre o ERP e a plataforma, sem redigitação. Com testes automatizados.",
    tags: [".NET", "Jobs", "Testes", "Senior ERP"],
    year: "2025 — hoje",
  },
  {
    title: "Painéis Andon para plantas automotivas",
    description:
      "Sinalização de chamados de linha de produção em tempo real para plantas de autopeças.",
    tags: ["C#", ".NET Framework", "Chão de fábrica"],
    year: "2023 — 2024",
  },
  {
    title: "Controle de pátio com RFID UHF",
    description:
      "Desktop, API e app Android com leitor UHF via Bluetooth para rastrear veículos e cargas por tag.",
    tags: ["C#", "Java · Android", "RFID UHF", "BLE"],
    year: "2021 — 2025",
  },
  {
    title: "APIs RFID integradas ao TOTVS Logix",
    description:
      "Integrações RFID ↔ ERP em 4GL para três operadores logísticos diferentes.",
    tags: ["4GL", "TOTVS Logix", "Oracle"],
    year: "2020 — 2025",
  },
  {
    title: "X-Planning: governança de verbas",
    description:
      "Planejamento orçamentário com aprovação em estágios e integração com ERP. Nasceu com agentes de IA e já tem testes de unidade e de integração.",
    tags: ["Blazor WASM", ".NET 8", "Quartz", "IA"],
    year: "2026",
  },
  {
    title: "Integração TOTVS Logix ↔ WMS",
    description:
      "Integração entre o ERP e a plataforma logística, evoluída por quatro anos: 206 commits meus no ciclo de pedidos, notas e estoque.",
    tags: ["4GL", ".NET", "TOTVS Logix"],
    year: "2019 — 2023",
  },
];

/* ------------------------------ Hardware ------------------------------ */

export type Hardware = { label: string; detail: string; icon: LucideIcon };

export const hardware: Hardware[] = [
  { label: "Antenas RFID UHF", detail: "leitura de tags em portais e docas", icon: Radio },
  { label: "Câmeras IP", detail: "visão computacional para placas e contêineres", icon: Cctv },
  { label: "Balanças rodoviárias", detail: "pesagem integrada à expedição", icon: Scale },
  { label: "Impressoras Zebra", detail: "etiquetas de volume em ZPL", icon: Printer },
  { label: "Coletores Android", detail: "leitores UHF via Bluetooth", icon: Smartphone },
  { label: "Andon e semáforos", detail: "sinalização no chão de fábrica e no pátio", icon: Siren },
];

/* ----------------------------- Como trabalho ----------------------------- */

export type Principle = { title: string; body: string; icon: LucideIcon };

export const principles: Principle[] = [
  {
    title: "Entendo a operação antes do código",
    body: "Levanto requisitos direto com o cliente, prototipo no Figma e só então desenho a arquitetura. Software de chão de fábrica que ignora o operador não é usado.",
    icon: Compass,
  },
  {
    title: "Construo para durar",
    body: "SOLID, camadas bem separadas, testes onde dói e deploy reproduzível em Docker. É por isso que um sistema de 2019 ainda aceita mudanças toda semana.",
    icon: ShieldCheck,
  },
  {
    title: "Meço o que entrego",
    body: "SLA, IQS, RNC, eficiência de mão de obra: se a operação não consegue medir, eu construo o painel que mede.",
    icon: Gauge,
  },
  {
    title: "Uso IA como multiplicador, não como muleta",
    body: "Agentes como Claude Code e Codex aceleram protótipos, refatorações e documentação. Arquitetura, revisão e testes continuam comigo.",
    icon: Bot,
  },
];

/* -------------------------------- Stack -------------------------------- */

export type StackGroup = { title: string; icon: LucideIcon; items: string[] };

export const stackGroups: StackGroup[] = [
  {
    title: "Back-end",
    icon: Server,
    items: ["C#", ".NET 8", "ASP.NET Core", "Blazor", "ABP Framework", "EF Core", "Quartz", "4GL (TOTVS)"],
  },
  {
    title: "Front-end & UX",
    icon: PenTool,
    items: ["React", "TypeScript", "Angular", "Blazor", "HTML/CSS", "Figma"],
  },
  {
    title: "Dados",
    icon: Database,
    items: ["PostgreSQL", "SQL Server", "Oracle", "Redis"],
  },
  {
    title: "Infra & entrega",
    icon: Box,
    items: ["Docker", "Linux", "AWS (ECR, Beanstalk, CodeBuild, RDS, S3)", "IIS", "Git", "Jira"],
  },
  {
    title: "Visão & IoT",
    icon: Cpu,
    items: ["Python", "YOLOv8", "PyTorch", "OpenCV", "RFID UHF", "Android (Java)"],
  },
  {
    title: "Processo",
    icon: Workflow,
    items: ["SOLID", "Design Patterns", "Scrum", "Kanban", "Testes unitários"],
  },
];

/* ------------------------------ Trajetória ------------------------------ */

export type TimelineItem = {
  period: string;
  title: string;
  org: string;
  body: string;
  highlight?: boolean;
};

export const timeline: TimelineItem[] = [
  {
    period: "2026",
    title: ".NET 8, Docker e IA no fluxo",
    org: "Portais e integrações",
    body: "Portal de KPIs em Blazor .NET 8 com deploy em Docker, integrador com o ERP Senior e uma plataforma de governança de verbas iniciada com agentes de IA.",
    highlight: true,
  },
  {
    period: "Set/2020 — Jan/2026",
    title: "Desenvolvedor de Software Sênior",
    org: "TX Tecnologia",
    body: "Liderança técnica em soluções sob demanda para logística e indústria: requisitos com clientes, protótipos no Figma, arquitetura, APIs .NET, RFID, visão computacional e portais Blazor.",
  },
  {
    period: "Ago/2019 — Set/2020",
    title: "Desenvolvedor Web Jr. · Suporte N2",
    org: "FormaIT Soluções Logísticas (parceira TOTVS)",
    body: "Portais web e softwares desktop para automação industrial, correções em produção e integrações logísticas. Foi aqui que veio o primeiro commit na plataforma que mantenho até hoje.",
  },
  {
    period: "2019",
    title: "Técnico em Desenvolvimento de Sistemas",
    org: "SENAI CIMATEC",
    body: "Base técnica que me levou direto para sistemas em produção.",
  },
];

export const education = [
  { title: "Análise e Desenvolvimento de Sistemas", org: "UniFatecie · conclusão 2026" },
  { title: "Formação Full Stack & Design (UX/UI, React, Node.js, TypeScript)", org: "Origamid" },
];

/* --------------------------------- Lab --------------------------------- */

export type LabItem = { title: string; body: string; icon: LucideIcon };

export const lab: LabItem[] = [
  {
    title: "Jogos em Roblox (Luau)",
    body: "Mecânicas, progressão e sistemas cliente/servidor. Game dev é meu treino de lógica com feedback instantâneo.",
    icon: Gamepad2,
  },
  {
    title: "Modelagem 3D e mapas",
    body: "Ambientes jogáveis no Blender e no Studio, pensando em navegação, ritmo e leitura visual.",
    icon: Box,
  },
  {
    title: "Render e path tracing",
    body: "Iluminação e renderização: o ponto onde programação encontra estética.",
    icon: Sparkles,
  },
];

/* ------------------------- Console do hero (simulação) ------------------------- */

export type ConsoleEvent = {
  source: "LPR" | "RFID" | "PESO" | "ZPL" | "ERP" | "ANDON" | "KPI" | "JOB";
  node: 0 | 1 | 2 | 3;
  text: string;
  tone: "ok" | "warn" | "info";
};

export const consoleNodes = [
  { label: "Pátio", sub: "câmera · RFID · balança" },
  { label: "API .NET", sub: "eventos" },
  { label: "WMS", sub: "expedição" },
  { label: "ERP", sub: "Logix · Senior" },
];

export const consoleEvents: ConsoleEvent[] = [
  { source: "LPR", node: 0, text: "placa BRA2E19 reconhecida · conf. 0.97", tone: "ok" },
  { source: "RFID", node: 0, text: "tag E200·3412·0A91 lida · portão 02", tone: "ok" },
  { source: "PESO", node: 0, text: "balança 01 estabilizada · 31.480 kg", tone: "info" },
  { source: "JOB", node: 1, text: "passagem associada ao agendamento #7741", tone: "ok" },
  { source: "ZPL", node: 2, text: "etiqueta de volume impressa · zebra-01", tone: "info" },
  { source: "ERP", node: 3, text: "pedido 48213 → volumes sincronizados", tone: "ok" },
  { source: "ANDON", node: 2, text: "linha 3 · chamado de manutenção aberto", tone: "warn" },
  { source: "KPI", node: 2, text: "painel de SLA recalculado", tone: "info" },
];
