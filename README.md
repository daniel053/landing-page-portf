# Portfólio: Daniel Messias dos Santos

Landing page em React + TypeScript + Vite, publicada no GitHub Pages.

**Conceito:** um console de operações industrial, com fundo grafite e as cores de uma torre Andon. A narrativa é guiada por resultados: números tirados do histórico git, cases no formato Desafio → O que construí → Resultado, e a integração com hardware como diferencial.

## Rodando localmente

Requer Node 18+ (o projeto usa Vite 5).

```bash
npm install
npm run dev
```

## Onde editar

| O quê | Arquivo |
| --- | --- |
| Textos, números, cases, stack, trajetória e links | `src/data/portfolio.ts` |
| Estrutura das seções | `src/App.tsx` |
| Visual, cores, responsividade e animações | `src/styles.css` |

## Foto

Salve a foto em `public/photos/daniel.jpg` e, em `src/data/portfolio.ts`, troque `photo: null` por:

```ts
photo: `${base}photos/daniel.jpg`,
```

## Deploy

```bash
npm run deploy
```

Esse comando gera o build e publica a pasta `dist` na branch `gh-pages`.
