# The Definitive r/datascience Salary Guide

A single-page data-visualisation dashboard built with Bolt, React, TypeScript, Vite, Chakra UI, and Recharts.

The app turns community-reported salary survey data from `r/datascience` into a dark-themed interactive dashboard with:

- filterable KPI cards
- salary trend and comparison charts
- an industry/career-stage heatmap
- a scatter plot for salary vs. stage
- a paginated/exportable data table

## Project structure

- `src/App.tsx` – page layout and filter wiring
- `src/components/charts/*` – chart components
- `src/components/FilterBar.tsx` – top-level filters
- `src/components/KPICards.tsx` – headline metrics
- `src/components/DataTable.tsx` – sortable, paginated table + CSV export
- `src/utils/dataUtils.ts` – salary normalization, career-stage mapping, role bucketing, filtering
- `src/data/original_salary_data.json` – original/raw source data
- `src/data/processed_salary_data_v2.json` – processed dataset currently rendered by the UI
- `screenshots/` – visual reference screenshots for manual QA

## Running locally

### Prerequisites

- Node.js 22 LTS recommended (or another currently supported version such as Node 24+)
- npm

> Note: some dependencies emit engine warnings on Node 23.x, so Node 22 LTS is the safest choice for local work.

### Install dependencies

```bash
npm ci
```

### Start the development server

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`).

If you want the dev server accessible from other devices on your network:

```bash
npm run dev -- --host
```

### Build a production bundle

```bash
npm run build
```

### Preview the production build locally

```bash
npm run preview
```

## Testing / verification locally

There is currently **no dedicated unit/integration test suite** in this repository.

For local verification, use the quality checks below:

```bash
npm run lint
npm run typecheck
npm run build
```

Or run the full validation sequence in one command:

```bash
npm run verify
```

### Suggested manual smoke test

After starting the app locally, check that:

1. the filter pills update the KPI cards, charts, and table together
2. the **Remote Only** toggle changes the dataset as expected
3. the CSV export button downloads salary rows
4. the page still matches the general visual direction shown in `screenshots/`

## Visual references

The `screenshots/` folder contains current snapshots of the dashboard. Use them as a manual regression reference when changing layout, spacing, colors, chart legibility, or table styling.

## Data notes

- The runtime UI reads from `src/data/processed_salary_data_v2.json`
- `src/utils/dataUtils.ts` applies the shared normalization and filtering logic used across the dashboard
- `src/data/original_salary_data.json` is the original/raw input dataset and should be treated as the source artifact for future data-refresh work
