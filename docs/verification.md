# Explorer verification

Current status as of 2026-10-16 against the bundled v3 dataset.

## Completed

- `npm run verify` passes ESLint, all 17 analytical tests, TypeScript, and the production build.
- The analytical tests cover source-row preservation, reviewed exclusions, missing/invalid pay, work-arrangement states, total-below-base handling, active-metric coverage, composed filters, threshold/tie behavior, fixed histogram edges, count conservation, inclusive tails, grouped summaries, safe source URLs, and CSV quoting/formula neutralization.
- The actual `DistributionChart` renderer fixtures pass the all-tail, exact-$500,000-median, empty, and ordinary cases. They verify 20 regular bins, finite non-negative SVG geometry, zero-height empty bins, exact in-domain median placement, no clamped off-domain median, and accurate visible/accessible tail text.
- Browser interaction checks pass for broad base and total coverage, UK and sparse/zero-usable cohorts, shared-filter preservation, country/role/year grouping, salary comparison behavior, empty-state recovery, sorting, pagination reset, source inspection, safe Reddit links, and broad/filtered CSV identities.
- The full Chromium harness exits successfully with 126 passing logged checks. At 375, 390, 768, 1024, and 1440px there is no page-wide overflow and essential chart labels, including comparison counts, render at least 12px. At 390×844 and 1440×1000 the opening view contains the complete plot, both salary-axis endpoints, tail, caveat, pay measure, and country control.
- At 390px and the 384px reflow proxy, long search text and its removal control stay contained, as do results for a large finite comparison input (`1e100`).
- Keyboard focus has a visible outline measured at 4.79:1 contrast. The checked controls and disclosures work by keyboard, the 384px check verifies 200%-equivalent viewport reflow from 768px, reduced-motion preferences disable nonessential motion, and the run reports no browser runtime errors.
- The bundled source files remain unchanged at their approved SHA-256 hashes:
  - `src/data/v2/processed_salary_data_v3.json`: `16ea5cd13b0f0b1193b568ea2525cb2f6dac269e1ce67c1b30eb277facfbe7b2`
  - `src/data/v2/processed_salary_data_v3.csv`: `755f9e214766d03c948b9d1a752340c6e37559eaa9cd58b0a8e337ed9feb63ac`

## Browser evidence

The final generated screenshots are under `.omx/reports/salary-allegedly-implementation/browser-reviewed`; the corresponding logs are `.omx/reports/salary-allegedly-implementation/browser-reviewed.log` and `.omx/reports/salary-allegedly-implementation/verification-reviewed.log`. New runs write timestamped evidence under `.omx/reports/salary-allegedly-implementation/` unless `BROWSER_REPORT_DIR` is set.

This is browser smoke and interaction coverage, not a full assistive-technology or cross-browser accessibility certification.

## Data scope

All 673 source rows remain available. Audited calculations have 536 usable base salaries and 429 usable totals. Summaries and salary-position comparisons require at least 10 usable values, while smaller cohorts retain their observed counts and source records.

The production bundle includes original source comments and triggers Vite's non-blocking large-chunk advisory. Source parsing, self-selection, fixed conversion rates, and other interpretation limits are described in the app and the historical data audit.
