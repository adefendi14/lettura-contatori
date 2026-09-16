# Lettura Contatori

Progressive Web App per la gestione delle **letture contatori condominiali** durante i sopralluoghi in scala (A, B, C). Interfaccia in italiano, ottimizzata per smartphone, con salvataggio locale e funzionamento offline dopo il primo caricamento.

## Funzionalità

- Selezione scala e tabella/card per appartamento, codice contatore, intestatario, lettura precedente e nuova lettura
- Calcolo immediato del consumo (differenza) con avviso se la nuova lettura è inferiore alla precedente
- Dataset di esempio precaricato (scale A, B, C)
- Import CSV/JSON (unione o sostituzione) ed esportazione di tutte le scale
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

## Formato import

CSV (separatore `;` o `,`) o JSON con colonne/campi riconoscibili, ad esempio:

`scala`, `appartamento`, `codiceContatore`, `intestatario`, `letturaPrecedente`, `nuovaLettura`

È accettato anche un array JSON di oggetti o un oggetto con proprietà `records` / `meters` / `data`.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
