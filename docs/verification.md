# Editorial feature verification

Verified 2026-09-24 against the bundled v3 dataset.

- `npm run verify`: passes ESLint, all 11 analytical tests, TypeScript, and the production build.
- `scripts/editorial-browser-check.cjs`: all 35 assertions pass in local Chromium. Covers chart controls, country and role cohorts, small-sample suppression, salary comparisons, filtering and pagination, sorting semantics, keyboard source inspection, Reddit source links, and the contents of the downloaded filtered CSV.
- Figure 1 regression checks cover all four measure/location combinations: the line stays at the exact median, colours match actual pay, all reported dots remain visible, and dots neither cross the median nor overlap. The check reproduced the original bug before the fix.
- Empty cohorts offer a working reset; unknown work arrangement is selectable separately from on-site.
- No page-wide horizontal overflow at 375, 390, 768, 1024, or 1440px. Tables scroll within their own region.
- Reduced-motion preference disables smooth scrolling. No browser runtime errors observed.
- Desktop and mobile screenshots were visually inspected. This is a browser smoke check, not a full assistive-technology or cross-browser accessibility certification.
- `git diff --check`: passes.

Screenshots: [desktop](../screenshots/editorial/desktop.png), [mobile](../screenshots/editorial/mobile.png), [desktop first screen](../screenshots/editorial/hero-desktop.png), [mobile first screen](../screenshots/editorial/hero-mobile.png).

The source dataset is unchanged. All 673 rows remain available; audited calculations have 536 usable base salaries and 429 usable totals. The production bundle includes original source comments and triggers Vite's non-blocking size advisory (approximately 1.3 MB raw / 262 kB gzip). Source parsing and voluntary-reporting limitations are described on the page and in the data audit.
