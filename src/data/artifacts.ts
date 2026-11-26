import { BarChart3, PackageSearch, WalletCards, type LucideIcon } from "lucide-react";

/* Capturas reais de sistemas em produção. Nomes de clientes, valores e dados
   pessoais já vêm borrados no próprio arquivo (public/artifacts), não só por CSS. */

export type Shot = {
  src: string;
  label: string;
  /** caminho fictício mostrado na barra do "navegador" */
  path: string;
  /** ponto (em %) para onde o zoom do hover aponta */
  focus: [number, number];
};

export type Artifact = {
  id: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  body: string;
  users: string;
  chips: string[];
  shots: Shot[];
};

const asset = (file: string) => `${import.meta.env.BASE_URL}artifacts/${file}`;

export const artifacts: Artifact[] = [
  {
    id: "x-planning",
    icon: WalletCards,
    kicker: "Gestão de verbas · 2026",
    title: "X-Planning",
    body: "Integrado direto ao TOTVS Logix. Pela web, o time controla aprovações, transferências, suplementações e reduções de verba, e muito mais.",
    users: "solicitantes e aprovadores de verba",
    chips: ["Blazor WASM", ".NET 8", "TOTVS Logix"],
    shots: [
      { src: asset("xplanning-cockpit.webp"), label: "Cockpit", path: "/cockpit", focus: [58, 30] },
      { src: asset("xplanning-login.webp"), label: "Login", path: "/entrar", focus: [78, 58] },
    ],
  },
  {
    id: "fila-separacao",
    icon: PackageSearch,
    kicker: "Portal logístico · Operação",
    title: "Fila de separação",
    body: "Pedidos pendentes de separação, impressão de etiquetas e o trabalho do CD organizado numa tela. Por trás: conexão direta com o ERP e queries especializadas.",
    users: "equipe operacional do CD",
    chips: ["Integração ERP", "Etiquetas", "SQL"],
    shots: [{ src: asset("portal-separacao.webp"), label: "Pedidos aguardando separação", path: "/separacao", focus: [18, 22] }],
  },
  {
    id: "kpi-expedicao",
    icon: BarChart3,
    kicker: "Portal logístico · KPI",
    title: "Performance da expedição",
    body: "Linhas faturadas × conferidas, dia a dia, contra a meta. Rotinas agendadas coletam do banco e calculam sozinhas; o operador logístico mostra isso ao próprio cliente.",
    users: "clientes do operador logístico",
    chips: ["Jobs agendados", "KPI diário", "Meta"],
    shots: [{ src: asset("kpi-expedicao.webp"), label: "Linhas faturadas × conferidas", path: "/kpi/expedicao", focus: [66, 16] }],
  },
];
