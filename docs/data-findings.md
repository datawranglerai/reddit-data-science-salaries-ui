# Data findings and editorial audit

This note records the evidence behind **“Nice salary. Wrong comparison.”** Every figure below comes from the same implemented functions used by the interface: `prepareEditorialRecords()`, `summarize()`, `yearlySummary()`, `pairedRecords()`, `compensationSummary()`, and `getRoleType()`.

## Reproduction

Run Node with type stripping and import the editorial utilities directly:

```sh
node --experimental-strip-types --input-type=module
```

```js
import fs from 'node:fs';
import {
  compensationSummary,
  pairedRecords,
  prepareEditorialRecords,
  summarize,
  yearlySummary,
} from './src/utils/editorialData.ts';

const raw = JSON.parse(
  fs.readFileSync('./src/data/v2/processed_salary_data_v3.json', 'utf8'),
);
const records = prepareEditorialRecords(raw);
```

The prepared dataset contains all **673 source rows**. Of those, **536** supply usable annual base pay and **429** supply usable annual total compensation.

## What enters a pay statistic

- Ten reviewed records have both derived pay metrics set to null: IDs **104, 123, 185, 195, 264, 360, 456, 482, 502, and 596**. Their source rows remain in the explorer and participation counts.
  - 104: source omits currency and annual basis; extracted INR is unverified.
  - 123: monthly internship pay.
  - 185: monthly pay.
  - 195: hourly work-study pay.
  - 264: hourly internship pay.
  - 360: per-course adjunct pay.
  - 456: source uses dollar amounts but extracted currency is INR.
  - 482: hourly internship pay.
  - 502: source uses a dollar sign but extracted currency is INR.
  - 596: internship pay has no clear annual basis.
- No salary floor is used. Explicitly annual low salaries remain part of the evidence.
- Positive values are converted with the project's fixed rates: USD 1.00, GBP 1.27, CAD 0.74, EUR 1.08, INR 0.012, AUD 0.65, SGD 0.74, and CHF 1.13. Missing and unsupported currencies produce null derived pay.
- When reported total compensation is below valid base pay, total is set to null and base is retained. This affects IDs 62, 249, and 607.
- Percentiles use linear interpolation as implemented by `percentile()` in `dataUtils.ts`.
- `getRoleType()` applies ordered title rules. In particular, an ML-engineer title is classified as `ML Engineer` before the later `Data Scientist` rule. “Data scientists” below means exactly `roleType === 'Data Scientist'`.

## Finding 1: a job title is not a pay bracket

The country chart uses pooled 2020–2025 annual base pay. It does not adjust for living costs, tax, inflation, experience, employer, or the mix of reporting years.

| Country | All roles n | p25 | Median | p75 | Data Scientist n | DS p25 | DS median | DS p75 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| United States | 402 | $104,000 | $130,000 | $174,000 | 215 | $115,000 | $135,000 | $170,500 |
| Canada | 29 | $66,600 | $88,800 | $148,000 | 15 | $86,580 | $118,400 | $182,500 |
| United Kingdom | 30 | $56,515 | $75,565 | $88,900 | 14 | $42,704 | $74,930 | $100,108 |
| Germany | 10 | $63,450 | $78,840 | $96,390 | 6† | $77,220 | $83,160 | $96,390 |

† The interface suppresses summaries below ten usable reports. The six-record German Data Scientist result is listed here only to audit the computed values.

Across all roles, the US median is **$130,000**, versus **$75,565** in the UK: about **1.7×** as high in nominal USD. Restricting the comparison to the shared Data Scientist role leaves medians of **$135,000** and **$74,930**. This is a difference between these disclosures, not a purchasing-power ranking.

## Finding 2: above $300k, salary stops telling the whole story

The compensation chart starts with US records, then requires valid base and total compensation with total greater than or equal to base. This yields **329 paired reports**.

| Total-compensation band | n | Median base | Median total | Median person's gap | Median non-base share |
| --- | ---: | ---: | ---: | ---: | ---: |
| Under $200k | 213 | $115,000 | $125,000 | $9,830 | 8.0% |
| $200k–$299k | 68 | $179,500 | $225,000 | $51,000 | 23.1% |
| $300k+ | 48 | $209,500 | $377,500 | $162,500 | 44.8% |

The share is calculated for each person as `(total − base) / total`, then the median of those individual shares is reported. It is not the difference between the two displayed medians.

Only **48 of 329 paired US reports (14.6%)** reach $300k total compensation. In that group, the median respondent gets **44.8%** of reported compensation outside base salary. The source calls these extras stock, cash bonuses, signing payments, and other awards; they do not all carry the same certainty or vesting terms.

## Finding 3: the 2024 dip disappears when the cohort becomes US-only

Raw records count participation. Usable-base counts are the rows that actually enter the median after preparation.

| Year | All raw records | All usable bases | All-location median | US raw records | US usable bases | US median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2020 | 90 | 72 | $109,250 | 61 | 59 | $118,000 |
| 2021 | 167 | 133 | $115,000 | 105 | 101 | $130,000 |
| 2022 | 116 | 99 | $118,400 | 71 | 69 | $130,000 |
| 2023 | 127 | 94 | $129,750 | 80 | 75 | $140,000 |
| 2024 | 110 | 86 | $122,000 | 55 | 55 | $140,000 |
| 2025 | 63 | 52 | $151,000 | 44 | 43 | $155,500 |

The all-location median falls from **$129,750 in 2023 to $122,000 in 2024**, a **5.97% decline**, shown editorially as 6%. The US median remains **$140,000** in both years. The apparent downturn therefore depends on who is included; these annual threads contain different respondents and cannot show the same workers taking a pay cut.

The 2025 all-location median rises to $151,000, but rests on **52 usable bases**, compared with 133 in 2021. That latest point is a finding about this smaller reporting cohort, not sufficient evidence of a market-wide boom.

## Source voice used to support the story

Quotes provide context and tone. They do not establish the aggregate findings.

- **ID 274, ML engineer, Bangalore:** “Damn I gotta get a new job and leave this country” This is the quote used by the geography chapter. [Source](https://www.reddit.com/r/datascience/comments/101hxlj/official_2022_end_of_year_salary_sharing_thread/j5leir4/)
- **ID 292, Data Science Director, NYC:** “wow this is honestly the first time I’ve added these up” — a concise explanation for looking beyond base. [Source](https://www.reddit.com/r/datascience/comments/1ia175l/official_2024_end_of_year_salary_sharing_thread/m96nhcg/)
- **ID 420, Senior Staff ML Engineer, Bay Area:** “stock had a good year and so did I” — a reminder that high total compensation can move with equity. [Source](https://www.reddit.com/r/datascience/comments/18tevwk/official_2023_end_of_year_salary_sharing_thread/kffgsr0/)
- **ID 65, Head of Machine Learning, Germany:** “it looks less impressive if you don't take rent/cost of living/vacation days into account.” [Source](https://www.reddit.com/r/datascience/comments/re46xx/official_2021_end_of_year_salary_sharing_thread/ho6oju4/)
- **ID 105, Data Scientist, Bay Area:** “Remember, this thread suffers from tremendous voluntary response bias!” [Source](https://www.reddit.com/r/datascience/comments/re46xx/official_2021_end_of_year_salary_sharing_thread/ho7ec8e/)

## Data-quality audit

- All **673 rows** remain after preparation. Reviewed exclusions null derived pay; they do not remove records.
- The apparent duplicate-ID problem is a missing-ID problem. All **63 records from the 2025 thread have a blank `comment_id`**, but their source URLs have distinct comment suffixes. The UI should use the source URL or numeric dataset ID as a fallback key.
- In the raw 673 rows, remote status is **388 true, 22 false, and 263 blank**. Among the 536 usable-base rows it is **338 remote/hybrid, 18 on-site, and 180 not stated**. Blank is preserved as `Not stated`; it must not be interpreted as on-site.
- Raw fields contain **91 blank currencies**, 13 unsupported currencies, 106 blank countries, 64 blank education values, and 63 blank industries. These records remain inspectable even when their missing fields prevent a particular summary.
- One record-level currency is applied to both base and total compensation. Mixed-currency comments can still be extracted incorrectly. ID 62 reports base in INR with a USD equivalent and total comp as `$8,000`; preparation detects total below base and excludes the total metric.
- Industry and education remain free text with spelling and capitalization variants. The explorer exposes them as context but the headline analysis does not claim normalized industry or education effects.
- Career stage is inferred from title, level, and sometimes parsed prior experience. It is an exploratory grouping, not a respondent-reported fact.
- Fixed FX rates are approximate constants rather than current or year-specific rates. All country comparisons are nominal and lack tax or purchasing-power adjustment.
- **ID 650's $3.5M total compensation is present in its original body**: approximately $350k base, $150k bonus, and $3M stock. It remains in the explorer, but its derived pay is null because currency is blank; country is also missing. [Source](https://www.reddit.com/r/datascience/comments/1q0vtzx/official_2025_end_of_year_salary_sharing_thread/nzmf98j/)

## Claim boundaries

- This is a voluntary, self-selected Reddit sample, not a representative salary survey.
- Country comparisons mix employers, roles, seniority, and years.
- Compensation bands are defined by total compensation itself and estimate no causal premium.
- Annual medians compare different respondents each year and are not inflation-adjusted.
- Counts accompany every result; interface summaries below ten usable reports are suppressed.
- Original comments and review notes remain reachable so readers can inspect what entered each comparison.
