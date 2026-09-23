# Salary, allegedly.

**Nice salary. Wrong context.** An interactive editorial feature about six years of r/datascience salary threads, built with React, TypeScript, and Vite.

The story asks why online salary comparisons can mislead:

- **Location:** a U.S. median base of $130k versus approximately $76k in the UK, across pooled reports. A role filter lets readers narrow the comparison.
- **Compensation:** among paired U.S. reports with $300k+ total compensation, the median non-base share is 44.8%, compared with 8.0% below $200k.
- **Participation:** the roughly 6% dip in the all-location base median in 2024 is absent in U.S. reports, whose median stays at $140k. Counts sit alongside the trend.
- **Your cohort:** filter, compare an annual salary, inspect original comments, sort and paginate the records, and export the selected rows.

These are descriptions of voluntary Reddit disclosures, not market estimates or causal conclusions.

## Run

```sh
npm ci
npm run dev
```

## Deploy to GitHub Pages

[Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) automatically publishes every push to `main`, including merged pull requests. It uses Node.js 24, installs from the lockfile with `npm ci`, runs all checks in `npm run verify`, and publishes `dist` only after they pass. Failed checks leave the previous deployment in place. A manual run is also available in the repository's **Actions** tab; only the `main` branch can deploy.

The site URL is **https://datawranglerai.github.io/reddit-data-science-salaries-ui/**.

This repository's Pages publishing source is already set to **GitHub Actions**. Once the workflow is committed and pushed to `main`, its first deployment will run automatically. No custom token or additional repository secrets are required: the workflow uses GitHub's built-in token and Pages deployment permissions.

The Pages configuration supplies `PAGES_BASE_PATH` at build time so scripts, styles, and the favicon load under the repository subpath. Local development and other hosts continue to use `/` by default. For a local production preview matching the Pages URL:

```sh
PAGES_BASE_PATH=/reddit-data-science-salaries-ui/ npm run build
PAGES_BASE_PATH=/reddit-data-science-salaries-ui/ npm run preview -- --host 127.0.0.1
```

Open `http://127.0.0.1:4173/reddit-data-science-salaries-ui/`.

For a fork, select **Settings → Pages → Build and deployment → Source → GitHub Actions** once. The workflow reads that repository's Pages path automatically. Deployment follows the [official Vite Pages guidance](https://vite.dev/guide/static-deploy.html#github-pages) and [GitHub's custom Pages workflow requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Verify

```sh
npm run verify
```

This runs ESLint, 11 analytical tests, TypeScript, and a production build. The analytical tests use Node's native TypeScript stripping; they were run here with Node 23.4.0. Run them separately with `npm test`.

The optional browser smoke script requires a separately installed Playwright and Chromium, plus a running local server:

```sh
node scripts/editorial-browser-check.cjs
```

If Playwright or Chromium lives outside this project, set `PLAYWRIGHT_MODULE_PATH` to the Playwright module directory and `BROWSER_EXECUTABLE` to the browser binary. `PREVIEW_URL` defaults to `http://127.0.0.1:5173/`. The script checks the chart controls, filters, sparse/empty cohorts, sorting, pagination, source inspection, CSV downloads, reduced motion, and viewport widths from 375 to 1440px. It writes screenshots under `screenshots/editorial/`. No browser-testing dependency was added to the app.

## Project map

- `DESIGN.md`: active editorial, interaction, accessibility, and responsive contract.
- `src/App.tsx`: authored story, chapter navigation, source quote, and methodology.
- `src/components/editorial/StoryCharts.tsx`: dot distribution, country ranges, compensation bands, and trend/sample figures.
- `src/components/editorial/Explorer.tsx`: filters, histogram, salary comparison, and source-record table.
- `src/styles/global.css` and `src/components/editorial/explorer.css`: the visual system.
- `src/utils/editorialData.ts`: explicit audit exclusions, analytical cohorts, safe source links, and CSV serialization.
- `src/utils/dataUtils.ts`: existing fixed FX, title/stage grouping, medians, and quantiles.
- `scripts/editorial-data.test.mjs`: regression checks for the data claims and core explorer behavior.
- `docs/data-findings.md`: evidence, exact cohorts, and parsing limitations.
- `src/data/v2/processed_salary_data_v3.json`: unchanged runtime source dataset; its CSV companion and earlier dataset versions are retained.

The previous chart and Chakra component files remain in the repository but are not part of the rendered feature. The new page uses semantic HTML and bespoke SVG charts; unused UI libraries are not loaded into the page.

## Data handling

All 673 source records remain inspectable. Ten manually reviewed non-annual or currency-ambiguous records are excluded from annual-pay calculations. Positive amounts need a supported currency; totals below a usable base are excluded from total compensation while retaining base. This leaves 536 usable base salaries and 429 usable totals. The source files are not edited.

The project uses approximate fixed USD conversion rates, not year-specific FX, and makes no adjustment for inflation, taxes, or living costs. Compensation-share comparisons require base and total from the same record. Missing work arrangement is distinct from on-site. Explorer summaries and percentile comparisons are withheld below ten usable values. Role and career-stage labels are inferred, and other LLM extraction errors can remain.

The JSON includes original comment text for inspection, so the production JavaScript bundle is approximately 1.3 MB uncompressed / 262 kB gzip and triggers Vite's size advisory. All figures remain available without a live data service. The optional web font falls back to local system fonts if offline.
