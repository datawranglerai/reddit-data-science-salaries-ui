# Design

## Source of truth
Status: Active. Date: 2026-09-23. Surface: the single-page r/datascience salary feature. This contract supersedes the legacy visual brief in `.codex/DESIGN.md` for the new feature. Evidence reviewed: README, App, existing chart/story components, global CSS, normalization utilities, v3 JSON/CSV, original comment bodies, and the previous full-page screenshot. The logo uses the user-supplied Tim Robinson still for its expression and the Bao restaurant logo for its graphic style; see `docs/brand-mark.md`. The user's latest request replaces the previous dashboard and weak narrative.

## Brand
Salary, allegedly. An independent, curious, slightly irreverent data feature. The brand mark is a compact dark-ink portrait with a tilted head and knowing smirk, riffing on the user-provided Tim Robinson still. Its solid hair silhouette, sparse facial contours, and hand-drawn character follow the Bao style reference. Retain the serif wordmark. Warm editorial paper, ink, restrained vermilion, sharp rules. Earn trust with visible cohort sizes, source comments, and reproducible numbers. Avoid neon, gradients, dashboard card grids, empty superlatives, fabricated causal claims, and sarcastic caveats in every paragraph.

## Product goals
Help readers understand why Reddit salary comparisons mislead, discover specific evidence, and find relevant disclosures. Success: first screen communicates the premise and shows real data; each chapter has an evidenced point; readers can inspect and export their cohort. Non-goals: market-rate estimates, salary advice, causal inference, a new scraping pipeline, or unsupported claims about AI and layoffs.

## Personas and jobs
Curious data professionals reading on a phone; job seekers comparing offers; technically literate readers auditing the story. Read a short feature, compare similar reports, inspect original text, download a filtered slice.

## Information architecture
One page: masthead and hook with an interactive salary distribution; sticky chapter navigation; geography; paired base/total compensation; participation over time; local cohort explorer and source records; transparent methodology and source links. Editorial cohorts remain stable. Controls within a figure affect that figure only; explorer controls affect explorer stats, chart, rows, and export together.

## Design principles
A finding earns its headline. Every statistic names its measure and population. Pacing varies across a large opening plot, country comparisons, a dark compensation chapter, paired trend/count charts, and a practical explorer. Source details are reachable without abandoning the feature. Use original raw records without silently editing them.

## Visual language
Paper #f4f1e9, ink #242722, muted #686b62, rule #d3d1c5, vermilion #bb432b, sage #727d62. Serif display (Georgia), sans body (Inter), mono metadata (system monospace). Typography and data marks carry the personality. 4px spacing unit; 24–48px gutters; 80–120px chapter spacing. Square edges, no blur or decorative gradients. Native SVG charts and direct labels. Short state transitions only; respect reduced motion. Charts remain native SVG. The logo is a transparent generated PNG, used at 68px in the masthead, 50–54px on mobile, and 56px in the footer.

## Components
New editorial components live in `src/components/editorial`; derived evidence in `src/utils/editorialData.ts`; CSS tokens belong to global.css. Native controls, semantic tables, SVG figures, expandable source records, and clear in-context annotations. Existing legacy components remain available but are outside the rendered feature. No competing token layer.

## Accessibility
Target WCAG 2.2 AA. Skip link, semantic landmarks, heading order, visible focus, native select/input/button controls, labelled SVGs with text equivalents, readable contrasts. All chart state changes use buttons or selects and show their values outside hover. Record inspection works with keyboard and touch. No essential hover-only content. Motion is optional. Large tables may scroll within their labelled region.

## Responsive behavior
Desktop max-width 1280px with asymmetric columns. Tablet reduces typography and gutters. Below 760px, stack narrative and figures, keep chapter navigation horizontally scrollable, use compact chart labels, and collapse explorer fields into two columns. Mobile 375px minimum acceptance target; no page-wide overflow.

## Interaction states
Every local control shows selected state. Explorer filters update together and reset pagination. Empty cohorts explain how to recover and offer reset. Small samples retain rows but suppress percentile/summary claims below the documented threshold. Missing values stay missing; unknown remote status is distinct. CSV exports the selected records. Static bundled data needs no network loading state; source links require internet.

## Content voice
Sharp, precise, human. Premise: “Nice salary. Wrong context.” Subheading: “Six years of Reddit salary threads, and why someone else’s number isn’t necessarily your benchmark.” Explain why country, compensation composition, and participation affect comparison. Use “reported”, “in these threads”, and explicit cohorts where they matter. Never imply representativeness, equal job scope, real-wage growth, or a causal premium. Do not describe missing non-salary compensation as zero. Titles should contain an observation or useful tension.

## Implementation constraints
React 19, TypeScript, Vite; installed dependencies only. Reuse audited utilities where correct; new analytical functions must be pure and tested for missing values, exclusions, paired cohorts, and filtering. Preserve source datasets unchanged. Use fixed legacy FX rates as approximate nominal conversion and publish them. Verify lint, typecheck, build, analytical assertions, browser interactions, desktop/mobile screenshots, and console output. Any unverified source parsing is disclosed.

## Open questions
- [ ] Whether to expand the dataset beyond the bundled 2020–2025 threads. Owner: project maintainer. No impact on this implementation.
