# Lettura Contatori

Progressive Web App per le **letture contatori condominiali** durante i sopralluoghi in scala (A, B, C). Interfaccia in italiano, pensata per lo smartphone: si installa sulla Home e resta usabile **offline** dopo la prima apertura.

## Funzionalità

- Selezione scala e schede/tabella per appartamento: acqua calda e riscaldamento, lettura precedente, nuova lettura, consumo
- Avviso se la nuova lettura è inferiore alla precedente
- Dataset precaricato dal foglio **25/26** di `acqua_riscaldamento.ods` (Via Maffucci 53, gestione 2025/2026): 93 appartamenti (A 20, B 57, C 16; 186 contatori)
- Import ODS (solo foglio `25-26`), CSV o JSON; export di **tutte** le scale
- Auto-salvataggio in `localStorage`
- PWA: icona sulla Home, service worker che mette in cache tutto il sito, pagina di fallback se un URL non è in memoria
- Su telefono, a sopralluogo (o scala) finito: barra fissa in basso con **Scarica file CSV**

## Requisiti

- Node.js 20+
- npm

## Avvio in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:4318](http://localhost:4318).

In sviluppo il service worker **non** si registra (come in ExpnsTracker), così il refresh resta immediato.

## Build di produzione (offline + Home)

```bash
npm run build
npm start
```

Poi apri [http://localhost:4318](http://localhost:4318), aggiungi l’app alla schermata Home e, dopo la prima visita, puoi chiudere la rete: home, scale e letture restano disponibili. I dati stanno sul dispositivo (`localStorage`).

Su iPhone: Safari → Condividi → **Aggiungi a Home**.

## GitHub Pages

Al push su `main` GitHub Actions pubblica `out/` sul branch `gh-pages` e attiva Pages.

Repository: [adefendi14/lettura-contatori](https://github.com/adefendi14/lettura-contatori)

URL pubblico: [https://adefendi14.github.io/lettura-contatori/](https://adefendi14.github.io/lettura-contatori/)

Build locale identica alla CI:

```bash
npm run build:pages
```

Il file `.nojekyll` è incluso così GitHub Pages serve correttamente `_next/`. Il service worker usa URL relativi (`./…`) e funziona anche sotto `/lettura-contatori/`.

## Formato import

- **ODS** (`acqua_riscaldamento.ods` o analogo): viene letto **solo** il foglio `25-26` (gestione 2025/2026). Gli altri fogli storici (`24-25`, `23-24`, …) sono ignorati. Colonne `24/25` → lettura precedente; colonne `25/26` → nuova lettura da compilare in sopralluogo (vuote nel file). Ogni alloggio ha due contatori: **Acqua calda** e **Riscaldamento**.
- **CSV** (separatore `;` o `,`) o **JSON** con campi riconoscibili, ad esempio:
  `scala`, `appartamento`, `tipo`, `codiceContatore`, `intestatario`, `letturaPrecedente`, `nuovaLettura`

È accettato anche un array JSON di oggetti o un oggetto con proprietà `records` / `meters` / `data`.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, font Outfit.
