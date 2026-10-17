# Design

## Source of truth

Status: Active. Date: 2026-10-17. Surface: the single-page r/datascience salary explorer. This document describes the implemented exploration design and supersedes the retired narrative chapter structure.

## Product goal

Make the fixed 2020–2025 Reddit dataset directly explorable. Readers begin with the broad sample, then narrow one shared cohort and inspect the records behind it. The page must preserve the exact title **Salary, Allegedly**, keep source and coverage limits close to the data, and avoid presenting the sample as a market benchmark.

The product does not provide salary advice, causal explanations, representative market estimates, or a new scraping pipeline.

## Information architecture

The page has five parts:

1. A compact header with links to Reports and About the data.
2. A small portrait beside the title and factual descriptor: “Salary reports from r/datascience, 2020–2025.”
3. One explorer containing the distribution, shared filters, grouped comparison, optional salary-position comparison, and source-record table.
4. Concise data notes covering source, coverage, pay treatment, inferred labels, summary thresholds, and limits.
5. Source/code, Buy me a coffee, and back-to-top links, followed by a readable logo-source credit. The support link uses the page's typography and a small coffee icon rather than a floating widget.

There are no authored story chapters or separate editorial cohorts. The existing smirk mark sits beside the title at 56px on desktop and 44px on mobile, with no repeated portrait in the footer. It also remains the favicon. The footer credits Tim Robinson and *I Think You Should Leave*, links Netflix's official guide, and identifies the “You sure about that, that’s why?” reference.

## Exploration model

The default view uses all countries, all years, all roles, base salary, and a country breakdown. Country and pay measure sit beside the opening distribution. Year and role are the primary refinements; career stage, work arrangement, and text search are available under More filters.

All active filters define one cohort. That cohort drives distribution counts, metric coverage, grouped comparisons, salary position, source rows, and CSV export. Changing a filter returns the report table to its first page. Active filters can be removed individually. Reset restores the broad base-salary view, country breakdown, default sort, first page, and an empty salary comparison.

Switching pay measure preserves the cohort and clears the entered salary comparison. Switching the country, role, or year breakdown changes only the grouping of the same filtered cohort.

## Data presentation

The opening distribution shows 20 half-open $25,000 bins from $0 to under $500,000. Values at or above $500,000 appear in a separate inclusive tail with its count and actual maximum. The plot does not clamp an off-domain median to the $500,000 endpoint. Empty and all-tail cohorts keep finite chart geometry and explicit recovery or explanatory text.

Selected count includes every source record in the cohort. Usable count includes only records with a valid value for the active pay measure. For the broad sample, the interface also shows the share of usable values reported from the U.S.

Median and middle-50% summaries require at least 10 usable values. Sparse cohorts and groups retain observed selected/usable counts and source rows while withholding those summaries. Salary position uses the same threshold, counts reports strictly below the entered amount, and is labelled as a position within the self-selected reports rather than a market percentile.

Country and role groups place supported summaries first by median, then sample size and label. Year groups remain chronological. Long country or role results initially show eight groups with an explicit Show all control. A data table provides the complete comparison as a text equivalent.

## Source records

The report table keeps every selected record, including records without usable active pay. It sorts by title, year, base salary, or total compensation and shows eight report rows per page. Each record can reveal its original comment, raw pay fields, extraction fields, review note, and a validated Reddit source link when available.

CSV export uses the same filtered source cohort, preserves missing active pay, quotes fields, and neutralizes spreadsheet-formula prefixes.

## Visual language

The interface uses warm paper (`#f6f3eb`), dark ink (`#242722`), muted text (`#656960`), rules (`#d4d0c5`), vermilion (`#b8462f`), and sage (`#77816b`). Georgia is the display face and Inter/system sans serif is the body face. Typography, rules, native controls, and direct data marks provide hierarchy. Surfaces stay square and flat, without gradients, shadows, decorative cards, or a competing token system.

The content width is 1180px with 24px desktop and 16px mobile side gutters. The title remains compact so the primary plot, pay measure, country control, usable count, tail, and local caveat dominate the opening viewport.

## Content

Use short, functional labels and factual descriptions. Name the active pay measure and population for each statistic. Use “reports”, “selected”, and “usable” precisely. State that disclosures are self-selected, unverified, and mostly from the U.S.; values use approximate fixed USD rates without inflation, tax, or living-cost adjustments.

Do not imply representativeness, equal job scope, causal differences, or zero non-salary compensation when total is missing. Keep extraction and inferred-label limitations visible in About the data and source inspection.

## Accessibility and responsive behavior

Target WCAG 2.2 AA. Use semantic landmarks and heading order, a skip link, native controls, visible focus, labelled SVGs, live text for state changes, and keyboard-operable disclosures. Essential chart values must also be available as text or tables. Large tables may scroll inside labelled regions; the page itself must not overflow horizontally.

At 640px and below, reduce gutters and type, stack the plot tail below the histogram, stack secondary layouts, and keep essential chart labels at least 12 rendered pixels. The minimum acceptance viewport is 375px. At enlarged text or 200% zoom, controls and evidence must reflow without loss. Reduced-motion preference removes smooth scrolling and nonessential chart motion.

## Implementation constraints

Use React 19, TypeScript, Vite, semantic HTML, and native SVG with installed dependencies. Keep analytical helpers pure and test missing values, threshold boundaries, distribution conservation, filtering, grouping, source links, and CSV safety. Preserve the bundled source datasets and fixed conversion behavior.

GoatCounter supplies page-view analytics. Named interaction events describe controls and actions without embedding field values or report contents. Tracking must not change navigation or control behavior, and the page remains usable when the analytics script is unavailable.

Verification includes ESLint, analytical and analytics tests, TypeScript, production build, actual-component renderer fixtures, browser interactions, keyboard/focus behavior, responsive viewports, zoom/reflow, reduced motion, screenshots, console output, and source hashes. Record incomplete checks explicitly in `docs/verification.md`.

## Open question

- Whether to expand the dataset beyond the bundled 2020–2025 threads. This does not affect the current implementation.
