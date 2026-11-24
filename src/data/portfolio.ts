import {
  Bot,
  Box,
  Cctv,
  Compass,
  Factory,
  Gamepad2,
  Gauge,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
  Printer,
  Radio,
  Scale,
  ShieldCheck,
  Siren,
  Smartphone,
  Sparkles,
  Truck,
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
  photo: `${base}photos/daniel-hero.webp` as string | null,
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
  { label: "WhatsApp", handle: "(12) 99677-7673", href: whatsAppLink, icon: MessageCircle },
  {
    label: "LinkedIn",
    handle: "in/daniel-dotnet-dev",
    href: "https://www.linkedin.com/in/daniel-dotnet-dev",
    icon: Linkedin,
  },
  { label: "GitHub", handle: "daniel053", href: "https://github.com/daniel053", icon: Github },
  { label: "E-mail", handle: profile.email, href: `mailto:${profile.email}`, icon: Mail },
];

/* --------------------------------- Hero --------------------------------- */

// Palavras que se alternam em "Eu faço ___ conversarem com o seu ERP." (todas no plural).
export const heroWords = ["antenas RFID", "câmeras", "balanças", "painéis Andon", "coletores", "impressoras Zebra"];

export type ConsoleEvent = { source: string; node: 0 | 1 | 2 | 3; text: string };

export const consoleNodes = ["Pátio", "API .NET", "WMS", "ERP"];

export const consoleEvents: ConsoleEvent[] = [
  { source: "LPR", node: 0, text: "placa BRA2E19 · conf. 0.97" },
  { source: "RFID", node: 0, text: "tag E200·3412·0A91 · portão 02" },
  { source: "PESO", node: 0, text: "balança 01 · 31.480 kg" },
  { source: "API", node: 1, text: "passagem associada ao agendamento #7741" },
  { source: "ZPL", node: 2, text: "etiqueta de volume impressa · zebra-01" },
  { source: "ERP", node: 3, text: "pedido 48213 → volumes sincronizados" },
  { source: "ANDON", node: 2, text: "linha 3 · chamado de manutenção aberto" },
  { source: "KPI", node: 2, text: "painel de SLA recalculado" },
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
    detail: "Do primeiro commit, em 2019, ao mais recente, este mês.",
  },
  {
    value: 1500,
    suffix: "+",
    label: "commits em produção",
    // fonte: 1.573 commits de autoria própria em 23 repositórios
    detail: "Em 20+ sistemas de logística, portos e indústria.",
  },
  {
    value: 69,
    suffix: "%",
    label: "da plataforma principal",
    // fonte: 689 de 1.003 commits
    detail: "689 de 1.003 commits. Sou o principal mantenedor.",
  },
  {
    value: 6,
    label: "tipos de hardware integrados",
    detail: "RFID, câmeras, balanças, Zebra, coletores e Andon.",
  },
];

/* ------------------------------ Pipeline ------------------------------ */

export type Hardware = { label: string; icon: LucideIcon };

export const hardware: Hardware[] = [
  { label: "Antenas RFID UHF", icon: Radio },
  { label: "Câmeras IP", icon: Cctv },
  { label: "Balanças rodoviárias", icon: Scale },
  { label: "Impressoras Zebra", icon: Printer },
  { label: "Coletores Android", icon: Smartphone },
  { label: "Andon e semáforos", icon: Siren },
];

export type PipelineStep = {
  node: string;
  sub: string;
  title: string;
  body: string;
  log: [string, string][];
};

export const pipelineSteps: PipelineStep[] = [
  {
    node: "Pátio",
    sub: "câmera · RFID · balança",
    title: "A câmera lê a placa.",
    body: "A antena lê a tag RFID e a balança estabiliza o peso. Três sinais ao mesmo tempo, sem ninguém tocar em nada.",
    log: [
      ["LPR", "BRA2E19"],
      ["RFID", "E200…0A91"],
      ["PESO", "31.480 kg"],
    ],
  },
  {
    node: "API .NET",
    sub: "eventos validados",
    title: "Tudo vira um evento só.",
    body: "Os sinais são cruzados com o agendamento, validados e registrados. Se algo falha, fica rastreável.",
    log: [["API", "evento #7741 → viagem associada"]],
  },
  {
    node: "WMS",
    sub: "doca · volumes · etiqueta",
    title: "A expedição anda sozinha.",
    body: "Doca liberada, volumes conferidos e etiqueta Zebra impressa na hora certa.",
    log: [
      ["WMS", "doca 04 liberada"],
      ["ZPL", "zebra-01 ok"],
    ],
  },
  {
    node: "ERP",
    sub: "TOTVS Logix · Senior",
    title: "O ERP recebe pronto.",
    body: "Pedido e volumes sincronizados. Ninguém redigita, ninguém confere planilha. É esse tipo de sistema que eu construo.",
    log: [["ERP", "pedido 48213 sincronizado ✓"]],
  },
];

/* ------------------------------- Cases ------------------------------- */

export type CaseStudy = {
  id: string;
  sector: string;
  icon: LucideIcon;
  period: string;
  title: string;
  metric: { value: string; label: string };
  /** Visão Negócio: o que mudou para a operação. */
  hook: string;
  results: string[];
  /** Visão Técnica: como foi construído. */
  tech: string;
  stack: string[];
};

export const cases: CaseStudy[] = [
  {
    id: "portaria-lpr",
    sector: "Logística · Terminais",
    icon: Cctv,
    period: "2024",
    title: "A portaria que lê placas sozinha",
    metric: { value: "2", label: "modelos de visão computacional em produção" },
    hook: "O caminhão encosta, a câmera reconhece a placa e o sistema registra a passagem. Ninguém digita nada.",
    results: [
      "Passagem registrada direto da câmera",
      "Placa, tag RFID e peso no mesmo evento",
      "Evidência em imagem para auditoria",
    ],
    tech: "Microsserviço Python com YOLOv8 e rastreamento SORT para placas Mercosul e contêineres, publicando passagens na API .NET e evidências no S3.",
    stack: ["Python", "YOLOv8", "PyTorch", "OpenCV", "SORT", "AWS S3", ".NET API"],
  },
  {
    id: "plataforma-logistica",
    sector: "WMS · Multi-tenant",
    icon: Truck,
    period: "2019 — hoje",
    title: "A plataforma logística que eu evoluo há 7 anos",
    metric: { value: "689", label: "dos 1.003 commits são meus" },
    hook: "Sistema crítico não para pra ser reescrito. Ele evolui toda semana, com carga real rodando.",
    results: [
      "Principal mantenedor desde 2019",
      "Deploy automatizado em 3 ambientes AWS",
      "Integrada aos ERPs TOTVS Logix e Senior",
    ],
    tech: "ASP.NET Core (ABP) + Angular sobre PostgreSQL, multi-tenant, em containers na AWS (ECR + Beanstalk) com pipelines CodeBuild para dev, QA e produção.",
    stack: ["C#", "ASP.NET Core", "ABP", "Angular", "PostgreSQL", "Docker", "AWS"],
  },
  {
    id: "planejamento-automotivo",
    sector: "Indústria automotiva",
    icon: Factory,
    period: "2023 — 2026",
    title: "Planejamento de produção para uma multinacional de autopeças",
    metric: { value: "187", label: "commits meus em 3+ anos de evolução" },
    hook: "O pedido da montadora entra, a capacidade é calculada e o embarque sai etiquetado, tudo no mesmo portal.",
    results: [
      "Call-off, capacidade e embarque num fluxo só",
      "Painéis de Kanban e eficiência de mão de obra",
      "Evolução contínua de 2023 a 2026",
    ],
    tech: "Portal Blazor sobre Oracle com cockpit, call-off, PFEP, Kanban e embarques, sincronizado ao TOTVS Logix por jobs agendados.",
    stack: ["Blazor", ".NET", "Oracle", "Jobs agendados", "TOTVS Logix"],
  },
  {
    id: "portal-kpis",
    sector: "Operação logística",
    icon: Gauge,
    period: "2026",
    title: "Portal de KPIs feito sozinho, do zero ao container",
    metric: { value: "7", label: "painéis de KPI, do SLA ao inventário" },
    hook: "Sete indicadores críticos da operação num só lugar, atualizados sozinhos.",
    results: [
      "Do primeiro commit à produção com 1 dev",
      "Deploy versionado em Docker, rollback trivial",
      "Login com segundo fator de autenticação",
    ],
    tech: "Blazor .NET 8 com Identity + 2FA, jobs de reprocessamento, impressão ZPL e deploy em Docker numa VPS Linux ligada a Oracle na AWS RDS.",
    stack: [".NET 8", "Blazor", "Docker", "Linux", "Oracle · AWS RDS", "ZPL"],
  },
];

export type SideProject = { title: string; description: string; tags: string[]; year: string };

export const sideProjects: SideProject[] = [
  {
    title: "Integrador ERP Senior ↔ WMS",
    description: "Pedidos, itens e volumes sincronizados sem redigitação, com testes automatizados.",
    tags: [".NET", "Jobs", "Testes"],
    year: "2025 — hoje",
  },
  {
    title: "Painéis Andon",
    description: "Chamados de linha de produção em tempo real para plantas de autopeças.",
    tags: ["C#", ".NET Framework"],
    year: "2023 — 2024",
  },
  {
    title: "Controle de pátio com RFID UHF",
    description: "Desktop, API e app Android com leitor UHF via Bluetooth.",
    tags: ["C#", "Android", "BLE"],
    year: "2021 — 2025",
  },
  {
    title: "APIs RFID no TOTVS Logix",
    description: "Integrações RFID ↔ ERP para três operadores logísticos.",
    tags: ["4GL", "Oracle"],
    year: "2020 — 2025",
  },
  {
    title: "X-Planning",
    description: "Governança de verbas com aprovação em estágios. Nasceu com agentes de IA.",
    tags: ["Blazor WASM", ".NET 8", "IA"],
    year: "2026",
  },
  {
    title: "Integração TOTVS Logix ↔ WMS",
    description: "Pedidos, notas e estoque: 206 commits meus em quatro anos.",
    tags: ["4GL", ".NET"],
    year: "2019 — 2023",
  },
];

/* ------------------------------ Esteira (stack) ------------------------------ */

export type BeltItem = { id: string; name: string; cat: string };

export const beltRows: BeltItem[][] = [
  [
    { id: "csharp", name: "C#", cat: "Linguagem" },
    { id: "net8", name: ".NET 8", cat: "Back-end" },
    { id: "aspnet", name: "ASP.NET Core", cat: "Back-end" },
    { id: "blazor", name: "Blazor", cat: "Full stack" },
    { id: "efcore", name: "EF Core", cat: "Dados" },
    { id: "abp", name: "ABP", cat: "Framework" },
    { id: "react", name: "React", cat: "Front-end" },
    { id: "ts", name: "TypeScript", cat: "Front-end" },
    { id: "angular", name: "Angular", cat: "Front-end" },
    { id: "figma", name: "Figma", cat: "UX/UI" },
    { id: "4gl", name: "4GL TOTVS", cat: "ERP" },
  ],
  [
    { id: "pg", name: "PostgreSQL", cat: "Dados" },
    { id: "sqlserver", name: "SQL Server", cat: "Dados" },
    { id: "oracle", name: "Oracle", cat: "Dados" },
    { id: "redis", name: "Redis", cat: "Cache" },
    { id: "docker", name: "Docker", cat: "Infra" },
    { id: "aws", name: "AWS", cat: "Nuvem" },
    { id: "linux", name: "Linux", cat: "Infra" },
    { id: "python", name: "Python", cat: "Visão" },
    { id: "yolo", name: "YOLOv8", cat: "Visão" },
    { id: "rfid", name: "RFID UHF", cat: "Hardware" },
    { id: "zpl", name: "Zebra ZPL", cat: "Hardware" },
  ],
];

/* ----------------------------- Como trabalho ----------------------------- */

export type Principle = { title: string; body: string; icon: LucideIcon };

export const principles: Principle[] = [
  {
    title: "Entendo a operação antes do código",
    body: "Requisitos direto com o cliente, protótipo no Figma, só depois arquitetura.",
    icon: Compass,
  },
  {
    title: "Construo para durar",
    body: "Camadas claras, testes onde dói e deploy reproduzível. Por isso um sistema de 2019 ainda aceita mudanças.",
    icon: ShieldCheck,
  },
  {
    title: "Meço o que entrego",
    body: "Se a operação não consegue medir, eu construo o painel que mede.",
    icon: Gauge,
  },
  {
    title: "IA como multiplicador",
    body: "Claude Code e Codex aceleram protótipo e refatoração. Arquitetura, revisão e testes ficam comigo.",
    icon: Bot,
  },
];

/* ------------------------------ Trajetória ------------------------------ */

export type TimelineItem = { period: string; title: string; org: string; body: string; highlight?: boolean };

export const timeline: TimelineItem[] = [
  {
    period: "2026",
    title: ".NET 8, Docker e IA no fluxo",
    org: "Portais e integrações",
    body: "Portal de KPIs em Docker, integrador com o ERP Senior e uma plataforma iniciada com agentes de IA.",
    highlight: true,
  },
  {
    period: "Set/2020 — Jan/2026",
    title: "Desenvolvedor de Software Sênior",
    org: "TX Tecnologia",
    body: "Liderança técnica em logística e indústria: requisitos, Figma, arquitetura, APIs .NET, RFID e visão computacional.",
  },
  {
    period: "Ago/2019 — Set/2020",
    title: "Desenvolvedor Web Jr. · Suporte N2",
    org: "FormaIT (parceira TOTVS)",
    body: "Portais, automação industrial e correções em produção. Aqui veio o primeiro commit na plataforma que mantenho até hoje.",
  },
  {
    period: "2019",
    title: "Técnico em Desenvolvimento de Sistemas",
    org: "SENAI CIMATEC",
    body: "A base que me levou direto para sistemas em produção.",
  },
];

export const education = [
  { title: "Análise e Desenvolvimento de Sistemas", org: "UniFatecie · conclusão 2026" },
  { title: "Full Stack & Design (UX/UI, React, Node.js, TypeScript)", org: "Origamid" },
];

/* --------------------------------- Lab --------------------------------- */

export type LabItem = { title: string; body: string; icon: LucideIcon };

export const lab: LabItem[] = [
  { title: "Jogos em Roblox (Luau)", body: "Mecânicas e sistemas cliente/servidor: lógica com feedback instantâneo.", icon: Gamepad2 },
  { title: "Modelagem 3D e mapas", body: "Cenários no Blender e no Studio, pensando em ritmo e leitura visual.", icon: Box },
  { title: "Render e path tracing", body: "Onde programação encontra estética.", icon: Sparkles },
];
