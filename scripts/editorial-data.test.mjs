import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  EMPTY_FILTERS,
  MIN_COHORT,
  REVIEW_EXCLUSIONS,
  compensationSummary,
  filterCohort,
  percentileRank,
  prepareEditorialRecords,
  recordsCSV,
  sourceLink,
  summarize,
  workArrangement,
} from '../src/utils/editorialData.ts';

const rawRecords = JSON.parse(
  readFileSync(new URL('../src/data/v2/processed_salary_data_v3.json', import.meta.url), 'utf8'),
);
const editorialRecords = prepareEditorialRecords(rawRecords);

function record(overrides = {}) {
  return {
    id: 1,
    title: 'Data Scientist',
    level: 'Mid',
    salary: 100_000,
    total_comp: 120_000,
    currency: 'USD',
    country: 'United States',
    city: 'New York City',
    company_industry: 'Technology',
    education: 'BS',
    is_remote: 'True',
    thread_title: '[Official] 2024 End of Year Salary Sharing Thread',
    prior_experience: 3,
    had_internship: '',
    is_salary_post: 'True',
    location_string: 'New York City, NY',
    year: 2024,
    careerStage: 'Mid',
    roleType: 'Data Scientist',
    usdSalary: 100_000,
    usdTotalComp: 120_000,
    qualityNote: null,
    workArrangement: 'Remote / hybrid',
    ...overrides,
  };
}

test('the editorial preparation preserves every source row', () => {
  assert.equal(rawRecords.length, 673);
  assert.equal(editorialRecords.length, rawRecords.length);
  assert.deepEqual(
    editorialRecords.map(({ id }) => id),
    rawRecords.map(({ id }) => id),
  );
});

test('reviewed non-annual or ambiguous reports retain raw pay but lose annual USD metrics', () => {
  const expectedExclusions = {
    104: 'Source omits currency and annual basis; extracted INR is unverified.',
    123: 'Monthly internship pay; not annualised.',
    185: 'Monthly pay; not annualised.',
    195: 'Hourly work-study pay; not annualised.',
    264: 'Hourly internship pay; not annualised.',
    360: 'Per-course adjunct pay; not an annual salary.',
    456: 'Source uses dollar amounts but extracted currency is INR; currency is ambiguous.',
    482: 'Hourly internship pay; not annualised.',
    502: 'Source uses a dollar sign but extracted currency is INR; currency is ambiguous.',
    596: 'Internship pay has no clear annual basis.',
  };

  assert.deepEqual(REVIEW_EXCLUSIONS, expectedExclusions);
  for (const [idText, note] of Object.entries(expectedExclusions)) {
    const id = Number(idText);
    const raw = rawRecords.find((candidate) => candidate.id === id);
    const prepared = editorialRecords.find((candidate) => candidate.id === id);

    assert.ok(raw, `source row ${id} should exist`);
    assert.ok(prepared, `prepared row ${id} should exist`);
    assert.equal(prepared.salary, raw.salary, `row ${id} raw base pay`);
    assert.equal(prepared.total_comp, raw.total_comp, `row ${id} raw total compensation`);
    assert.equal(prepared.usdSalary, null, `row ${id} annual base`);
    assert.equal(prepared.usdTotalComp, null, `row ${id} annual total compensation`);
    assert.equal(prepared.qualityNote, note, `row ${id} review note`);
  }
});

test('unknown work arrangements remain distinct from remote and on-site reports', () => {
  assert.equal(workArrangement(true), 'Remote / hybrid');
  assert.equal(workArrangement('hybrid'), 'Remote / hybrid');
  assert.equal(workArrangement(false), 'On-site');
  assert.equal(workArrangement('on-site'), 'On-site');
  assert.equal(workArrangement(''), 'Not stated');
  assert.equal(workArrangement('sometimes'), 'Not stated');

  const counts = Object.fromEntries(
    ['Remote / hybrid', 'On-site', 'Not stated'].map((value) => [
      value,
      editorialRecords.filter(({ workArrangement: arrangement }) => arrangement === value).length,
    ]),
  );
  assert.deepEqual(counts, { 'Remote / hybrid': 388, 'On-site': 22, 'Not stated': 263 });
});

test('total compensation below base is excluded without discarding base or raw pay', () => {
  const [prepared] = prepareEditorialRecords([
    record({ id: 9001, salary: 150_000, total_comp: 125_000 }),
  ]);

  assert.equal(prepared.salary, 150_000);
  assert.equal(prepared.total_comp, 125_000);
  assert.equal(prepared.usdSalary, 150_000);
  assert.equal(prepared.usdTotalComp, null);
  assert.equal(
    prepared.qualityNote,
    'Reported total compensation is below base pay; total excluded, base retained.',
  );
});

test('reports without a supported currency do not enter annual USD analysis', () => {
  const supportedCurrencies = new Set(['USD', 'GBP', 'CAD', 'EUR', 'INR', 'AUD', 'SGD', 'CHF']);
  const unsupportedWithPay = rawRecords.filter(
    ({ currency, salary, total_comp }) =>
      !supportedCurrencies.has(String(currency).toUpperCase()) &&
      (typeof salary === 'number' || typeof total_comp === 'number'),
  );

  assert.ok(unsupportedWithPay.some(({ id }) => id === 22), 'missing-currency example');
  assert.ok(unsupportedWithPay.some(({ id }) => id === 210), 'unsupported-currency example');
  for (const raw of unsupportedWithPay) {
    const prepared = editorialRecords.find(({ id }) => id === raw.id);
    assert.equal(prepared.usdSalary, null, `row ${raw.id} base with currency ${raw.currency || '(missing)'}`);
    assert.equal(prepared.usdTotalComp, null, `row ${raw.id} total with currency ${raw.currency || '(missing)'}`);
  }
});

test('paired U.S. compensation cohorts reproduce the published findings', () => {
  const usRecords = editorialRecords.filter(({ country }) => country === 'United States');
  const cohorts = [
    [
      'all paired reports',
      usRecords,
      { n: 329, base: 135_000, total: 157_000, extra: 20_000, extraShare: 0.12941176470588237 },
    ],
    [
      'total compensation below $200k',
      usRecords.filter(({ usdTotalComp }) => usdTotalComp < 200_000),
      { n: 213, base: 115_000, total: 125_000, extra: 9_830, extraShare: 0.08045977011494253 },
    ],
    [
      'total compensation from $200k to $299,999',
      usRecords.filter(({ usdTotalComp }) => usdTotalComp >= 200_000 && usdTotalComp < 300_000),
      { n: 68, base: 179_500, total: 225_000, extra: 51_000, extraShare: 0.23076923076923078 },
    ],
    [
      'total compensation of at least $300k',
      usRecords.filter(({ usdTotalComp }) => usdTotalComp >= 300_000),
      { n: 48, base: 209_500, total: 377_500, extra: 162_500, extraShare: 0.4482496194824962 },
    ],
  ];

  for (const [name, cohort, expected] of cohorts) {
    assert.deepEqual(compensationSummary(cohort), expected, name);
  }
});

test('summary statistics use an even median and linearly interpolated quantiles', () => {
  const cohort = [10, 20, 30, 40, null].map((usdSalary, index) =>
    record({ id: index + 1, usdSalary }),
  );

  assert.deepEqual(summarize(cohort), {
    n: 4,
    median: 25,
    p10: 13,
    p25: 17.5,
    p75: 32.5,
    p90: 37,
  });
});

test('percentile rank excludes ties and requires the minimum cohort size', () => {
  const salaries = [10, 20, 20, 20, 30, 40, 50, 60, 70, 80];
  const cohort = salaries.map((usdSalary, index) => record({ id: index + 1, usdSalary }));

  assert.equal(cohort.length, MIN_COHORT);
  assert.equal(percentileRank(cohort, 20, 'usdSalary'), 10);
  assert.equal(percentileRank(cohort.slice(0, MIN_COHORT - 1), 20, 'usdSalary'), null);
});

test('explorer filters compose across dimensions and searchable fields', () => {
  const records = [
    record({ id: 1, title: 'Senior Data Scientist', careerStage: 'Senior', city: 'London', country: 'United Kingdom', company_industry: 'Fintech', year: 2024 }),
    record({ id: 2, title: 'Senior Data Scientist', careerStage: 'Senior', city: 'London', country: 'United Kingdom', company_industry: 'Retail', year: 2023 }),
    record({ id: 3, title: 'Data Engineer', roleType: 'Data Engineer', careerStage: 'Mid', city: '', country: '', company_industry: 'Fintech', workArrangement: 'Not stated', year: 2024 }),
  ];

  assert.deepEqual(filterCohort(records, EMPTY_FILTERS).map(({ id }) => id), [1, 2, 3]);
  assert.deepEqual(
    filterCohort(records, {
      country: 'United Kingdom',
      year: '2024',
      role: 'Data Scientist',
      stage: 'Senior',
      work: 'Remote / hybrid',
      search: 'FINTECH london',
    }).map(({ id }) => id),
    [1],
  );
  assert.deepEqual(
    filterCohort(records, { ...EMPTY_FILTERS, country: 'Not stated', work: 'Not stated' }).map(({ id }) => id),
    [3],
  );
});

test('source links prefer a valid comment, fall back to its thread, and reject unsafe URLs', () => {
  const comment = 'https://www.reddit.com/r/datascience/comments/abc/thread/def/';
  const thread = 'https://reddit.com/r/datascience/comments/abc/thread/';

  assert.deepEqual(sourceLink(record({ comment_url: comment, thread_url: thread })), {
    href: comment,
    label: 'Original comment',
  });
  assert.deepEqual(sourceLink(record({ comment_url: 'http://reddit.com/unsafe', thread_url: thread })), {
    href: thread,
    label: 'Source thread',
  });
  assert.equal(sourceLink(record({ comment_url: 'https://reddit.com.evil.test/path', thread_url: '' })), null);
});

test('CSV export quotes fields, neutralizes spreadsheet formulas, and includes the source URL', () => {
  const source = 'https://www.reddit.com/r/datascience/comments/abc/thread/def/';
  const csv = recordsCSV([
    record({
      title: '=2+2',
      country: '+COUNTRY',
      city: '-CITY',
      company_industry: '@INDUSTRY',
      roleType: '\tROLE',
      careerStage: '\rSTAGE',
      qualityNote: 'Reviewed, says "hello"',
      comment_url: source,
    }),
  ]);

  assert.match(csv, /"'=2\+2"/);
  assert.match(csv, /"'\+COUNTRY"/);
  assert.match(csv, /"'-CITY"/);
  assert.match(csv, /"'@INDUSTRY"/);
  assert.ok(csv.includes('"\'\tROLE"'));
  assert.ok(csv.includes('"\'\rSTAGE"'));
  assert.ok(csv.includes('"Reviewed, says ""hello"""'));
  assert.ok(csv.includes(`"${source}"`));
  assert.equal(csv.split('\r\n').length, 2);
});
