# Lettura Contatori

Progressive Web App per la gestione delle **letture contatori condominiali** durante i sopralluoghi in scala (A, B, C). Interfaccia in italiano, ottimizzata per smartphone, con salvataggio locale e funzionamento offline dopo il primo caricamento.

## Funzionalità

- Selezione scala e tabella/card per appartamento, codice contatore, intestatario, lettura precedente e nuova lettura
- Calcolo immediato del consumo (differenza) con avviso se la nuova lettura è inferiore alla precedente
- Dataset precaricato dal foglio **25/26** di `acqua_riscaldamento.ods` (Via Maffucci 53, gestione 2025/2026): acqua calda e riscaldamento per 93 appartamenti
- Import ODS (usa solo il foglio `25-26`), CSV o JSON; esportazione di tutte le scale
- Auto-salvataggio in `localStorage`
- PWA installabile: `manifest.json`, service worker, prompt di installazione

## Requisiti

- Node.js 20+
- npm

## Avvio in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:4318](http://localhost:4318).

## Build di produzione

```bash
npm run build
npm start
```

Per testare l’offline completo (cache degli asset statici), usa la build di produzione dopo almeno una visita con rete attiva.

## GitHub Pages

Il deploy è automatico su push a `main` (workflow `.github/workflows/github-pages.yml`).

Repository: [adefendi14/lettura-contatori](https://github.com/adefendi14/lettura-contatori)

1. In **Settings → Pages**, imposta **Source: GitHub Actions** (solo la prima volta).
2. Il push su `main` avvia la build con `NEXT_PUBLIC_BASE_PATH` = `/lettura-contatori`.

URL pubblico: [https://adefendi14.github.io/lettura-contatori/](https://adefendi14.github.io/lettura-contatori/)

Build locale identica alla CI:

```bash
NEXT_PUBLIC_BASE_PATH=/lettura-contatori npm run build:pages
```

I file statici finiscono in `out/`. Il file `.nojekyll` è incluso così GitHub Pages serve correttamente `_next/`.

## Formato import

- **ODS** (`acqua_riscaldamento.ods`): viene letto solo il foglio `25-26` (o `25/26`). Le colonne `24/25` sono la lettura precedente; `25/26` è la nuova lettura da compilare. Ogni alloggio ha due contatori: acqua calda e riscaldamento.
- **CSV** (separatore `;` o `,`) o **JSON** con campi riconoscibili, ad esempio:
  `scala`, `appartamento`, `tipo`, `codiceContatore`, `intestatario`, `letturaPrecedente`, `nuovaLettura`

È accettato anche un array JSON di oggetti o un oggetto con proprietà `records` / `meters` / `data`.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
