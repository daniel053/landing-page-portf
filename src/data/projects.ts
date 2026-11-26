import { Bot, History, Network, RadioTower, ShieldCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Seção Projetos: cada aba tem uma maquete 3D (src/three/*Scene.ts). */
/*  `marks` são instantes (s) do ciclo da animação: quando um passa,   */
/*  o passo ativo, as etiquetas e o painel mudam. Se mexer nos tempos  */
/*  da cena, ajuste aqui também.                                       */
/*  {erp} vira TOTVS ou Senior, alternando a cada volta.               */
/* ------------------------------------------------------------------ */

export type ProjectMark = { at: number; step: number; feed?: string };

export type ProjectLabel = {
  anchor: string;
  text: string;
  /** name: nome fixo do lugar; pop: aparece num marco; chip: valor ao redor do escudo. */
  kind: "name" | "pop" | "chip";
  /** índice do marco a partir do qual aparece (e até qual, se houver). */
  from?: number;
  until?: number;
};

export type Project = {
  id: "rfid" | "zenlog";
  tab: string;
  tabSub: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  lead: string;
  steps: { title: string; body: string }[];
  values: { icon: LucideIcon; title: string; body: string }[];
  stack: string[];
  marks: ProjectMark[];
  labels: ProjectLabel[];
  /** Painel de acompanhamento no canto da cena (só no Zenlog). */
  feedTitle?: string;
  stageLabel: string;
};

export const projects: Project[] = [
  {
    id: "rfid",
    tab: "RFID na doca",
    tabSub: "Portal UHF · ERP",
    icon: RadioTower,
    kicker: "Projeto · RFID UHF",
    title: "A carga passa pela doca e o sistema já sabe o que entrou.",
    lead: "Antenas no portal leem as tags de todos os volumes enquanto a empilhadeira passa. O sistema confere com a nota, registra a movimentação e sobe para a nuvem, sem ninguém bipar caixa por caixa.",
    steps: [
      { title: "Passagem na doca", body: "A empilhadeira tira o palete do caminhão e cruza o portal." },
      { title: "Leitura RFID", body: "As antenas UHF leem todas as tags do palete de uma vez." },
      { title: "Check no sistema", body: "Cada tag é conferida com a nota e o pedido." },
      { title: "Nuvem e ERP", body: "A movimentação sobe para a nuvem e chega ao ERP." },
      { title: "Dado confiável", body: "O que passou na doca é o que está no sistema." },
    ],
    values: [
      { icon: ShieldCheck, title: "Consistência", body: "Físico e sistema batem." },
      { icon: Bot, title: "Automação", body: "Zero digitação na doca." },
      { icon: History, title: "Histórico", body: "Cada leitura com hora e portal." },
    ],
    stack: ["C#", ".NET API", "Leitores UHF", "Android + BLE", "TOTVS Logix", "Oracle"],
    marks: [
      { at: 0, step: 0 },
      { at: 2.5, step: 1 },
      { at: 4.2, step: 2 },
      { at: 5.7, step: 3 },
      { at: 7.3, step: 4 },
    ],
    labels: [
      { anchor: "dock", text: "Doca 02", kind: "name" },
      { anchor: "portal", text: "Lendo tags…", kind: "pop", from: 1, until: 1 },
      { anchor: "portal", text: "✓ 24/24 tags", kind: "pop", from: 2 },
      { anchor: "pc", text: "✓ Conferido com a NF", kind: "pop", from: 3 },
      { anchor: "cloud", text: "Sincronizado", kind: "pop", from: 4 },
      { anchor: "chip1", text: "Consistência", kind: "chip", from: 4 },
      { anchor: "chip2", text: "Automação", kind: "chip", from: 4 },
      { anchor: "chip3", text: "Histórico", kind: "chip", from: 4 },
    ],
    stageLabel:
      "Animação 3D: uma empilhadeira tira um palete do caminhão e passa por um portal de antenas RFID. O sinal vai até o computador, que confere as tags, e sobe para a nuvem. Um escudo mostra consistência, automação e histórico.",
  },
  {
    id: "zenlog",
    tab: "Zenlog",
    tabSub: "Pedido · ERP · entrega",
    icon: Network,
    kicker: "Projeto · Zenlog",
    title: "Do pedido do depositante ao caminhão, com o status voltando a cada etapa.",
    lead: "O depositante manda o pedido, o Zenlog valida e integra no ERP do cliente, seja TOTVS ou Senior. Dali a operação separa, fatura e despacha, e cada evento volta sozinho para quem pediu.",
    steps: [
      { title: "Pedido enviado", body: "O depositante dispara o pedido para o Zenlog." },
      { title: "Zenlog valida", body: "Regras, cadastro e saldo conferidos antes de seguir." },
      { title: "Integra no ERP", body: "O pedido entra no ERP do cliente: TOTVS ou Senior." },
      { title: "Separação e expedição", body: "O CD separa, fatura e carrega o caminhão." },
      { title: "Entregue", body: "A entrega fecha o ciclo, e o depositante acompanhou tudo." },
    ],
    values: [
      { icon: Network, title: "Sem redigitação", body: "Um pedido, vários sistemas." },
      { icon: Truck, title: "Status em cada etapa", body: "Do envio à entrega." },
      { icon: ShieldCheck, title: "Dois ERPs, um fluxo", body: "TOTVS e Senior." },
    ],
    stack: [".NET", "PostgreSQL", "APIs REST", "Jobs", "TOTVS", "Senior"],
    marks: [
      { at: 0, step: 0, feed: "Pedido #48213 enviado" },
      { at: 2.0, step: 1 },
      { at: 3.4, step: 2 },
      { at: 4.4, step: 2, feed: "Validado pelo Zenlog" },
      { at: 5.8, step: 3 },
      { at: 6.0, step: 3, feed: "Integrado no {erp}" },
      { at: 7.6, step: 4 },
      { at: 8.4, step: 4, feed: "Separado e faturado" },
      { at: 9.6, step: 4, feed: "Saiu para entrega" },
      { at: 11.8, step: 4, feed: "Entregue ✓" },
    ],
    labels: [
      { anchor: "dep", text: "Depositante", kind: "name" },
      { anchor: "zen", text: "Zenlog", kind: "name" },
      { anchor: "erp", text: "ERP · {erp}", kind: "name" },
      { anchor: "cd", text: "CD · WMS", kind: "name" },
      { anchor: "store", text: "Cliente final", kind: "name", until: 8 },
      { anchor: "storePop", text: "✓ Entregue", kind: "pop", from: 9 },
    ],
    feedTitle: "Painel do depositante",
    stageLabel:
      "Animação 3D: o depositante envia um pedido que passa pelo Zenlog, entra no ERP do cliente (TOTVS ou Senior) e segue para o centro de distribuição. Um caminhão faz a entrega e, a cada etapa, o status volta para o depositante.",
  },
];
