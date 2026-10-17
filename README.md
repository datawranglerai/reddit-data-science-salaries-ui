# Salary, Allegedly

An interactive explorer for 673 parsed salary reports from the annual r/datascience salary threads, 2020–2025. The app uses React, TypeScript, and Vite with a fixed, bundled dataset.

Start with the full sample, then apply one shared set of filters across the distribution, comparison, report table, and CSV export. The explorer supports:

- base salary or total compensation;
- country, year, role, career stage, work arrangement, and text filters;
- a 20-bin distribution below $500,000 with an inclusive $500,000-and-above tail;
- country, role, or year comparisons;
- an optional salary-position comparison;
- sortable, paginated source records with original-comment inspection; and
- filtered CSV downloads that retain records without a usable value for the active pay measure.

Median and middle-50% summaries require at least 10 usable values. Smaller cohorts keep their observed counts and source records but withhold those summaries. The data consists of voluntary, unverified Reddit disclosures and does not estimate market pay or explain differences between groups.

## Run

```sh
npm ci
npm run dev
```

## Deploy to GitHub Pages

[Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) publishes pushes to `main`. It uses Node.js 24, installs from the lockfile, runs `npm run verify`, and publishes `dist` only after the checks pass. Manual runs are available in the repository's **Actions** tab, but only `main` can deploy.

The site URL is **https://datawranglerai.github.io/reddit-data-science-salaries-ui/**.

The repository's Pages source must be **GitHub Actions**. The workflow reads the repository's Pages base path, so no custom token or repository secret is required. To preview the production build at the same subpath locally:

```sh
PAGES_BASE_PATH=/reddit-data-science-salaries-ui/ npm run build
PAGES_BASE_PATH=/reddit-data-science-salaries-ui/ npm run preview -- --host 127.0.0.1
```

Open `http://127.0.0.1:4173/reddit-data-science-salaries-ui/`.

Deployment follows the [Vite GitHub Pages guidance](https://vite.dev/guide/static-deploy.html#github-pages) and [GitHub's custom workflow requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Verify

```sh
npm run verify
```

This runs ESLint, 17 analytical tests, TypeScript, and a production build. Run the analytical tests alone with `npm test`.

The optional browser harness requires a separately installed Playwright module and Chromium. Start the Vite development server on the harness's default port:

```sh
npm run dev -- --host 127.0.0.1 --port 4178
```

Then run the harness in another terminal:

```sh
node scripts/editorial-browser-check.cjs
```

Set `PLAYWRIGHT_MODULE_PATH` when Playwright is outside this project, `BROWSER_EXECUTABLE` for a specific Chromium binary, or `PREVIEW_URL` for another server URL. The harness covers the actual distribution component fixtures, data and cohort transitions, filtering, sorting, pagination, source inspection, CSV downloads, reduced motion, focus, 200%-equivalent viewport reflow, and viewport widths from 375 to 1440px. It writes timestamped evidence under `.omx/reports/salary-allegedly-implementation/` by default; override that location with `BROWSER_REPORT_DIR`.

See [docs/verification.md](docs/verification.md) for the current verification status.

## Project map

- `DESIGN.md`: active product, interaction, accessibility, and responsive contract.
- `src/App.tsx`: compact page shell, data notes, and source links.
- `src/components/editorial/Explorer.tsx`: shared explorer state, filters, comparisons, report table, source inspection, and export.
- `src/components/editorial/ExplorerCharts.tsx`: salary distribution and grouped comparison charts.
- `src/styles/global.css` and `src/components/editorial/explorer.css`: visual and responsive styles.
- `src/utils/editorialData.ts`: reviewed exclusions, metric coverage, distribution bins, grouped summaries, filtering, safe source links, and CSV serialization.
- `src/utils/dataUtils.ts`: fixed currency conversion, inferred role/stage labels, medians, and quantiles.
- `scripts/editorial-data.test.mjs`: analytical and data-behavior regression tests.
- `scripts/editorial-browser-check.cjs` and `scripts/fixtures/`: browser interaction checks and actual-component renderer fixtures.
- `docs/data-findings.md`: historical data audit, exact cohorts, and parsing limitations.
- `src/data/v2/processed_salary_data_v3.json`: unchanged runtime source dataset; its CSV companion and earlier versions remain in the repository.

The rendered page uses semantic HTML and bespoke SVG charts. Older dashboard and story components elsewhere in the repository are outside the active page.

## Data handling

All 673 source records remain inspectable. Ten manually reviewed non-annual or currency-ambiguous records are excluded from annual-pay calculations. Positive amounts need a supported currency. When reported total compensation is below usable base pay, the total is excluded and the base is retained. This leaves 536 usable base salaries and 429 usable totals. The source files are unchanged.

Values use approximate fixed USD conversion rates rather than year-specific rates. The app does not adjust for inflation, tax, or living costs. Missing work arrangement remains distinct from on-site. Role and career-stage labels are inferred, and extraction errors may remain.

The bundled JSON includes original comments so every report can be inspected without a live data service. This also triggers Vite's non-blocking large-chunk advisory in the production build.
