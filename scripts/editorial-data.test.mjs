import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  EMPTY_FILTERS,
  MIN_COHORT,
  REVIEW_EXCLUSIONS,
  compensationSummary,
  filterCohort,
  groupSalarySummaries,
  metricCoverage,
  percentileRank,
  prepareEditorialRecords,
  recordsCSV,
  salaryDistribution,
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

test('metric coverage uses the active measure and omits an undefined share', () => {
  const base = metricCoverage(editorialRecords, 'usdSalary');
  const total = metricCoverage(editorialRecords, 'usdTotalComp');
  const uk = editorialRecords.filter(({ country }) => country === 'United Kingdom');

  assert.deepEqual(base, {
    selectedCount: 673,
    usableCount: 536,
    usUsableCount: 402,
    usUsableShare: 402 / 536,
  });
  assert.deepEqual(total, {
    selectedCount: 673,
    usableCount: 429,
    usUsableCount: 330,
    usUsableShare: 330 / 429,
  });
  assert.equal(Math.round(base.usUsableShare * 100), 75);
  assert.equal(Math.round(total.usUsableShare * 100), 77);
  assert.deepEqual(metricCoverage(uk, 'usdSalary'), {
    selectedCount: 32,
    usableCount: 30,
    usUsableCount: 0,
    usUsableShare: 0,
  });
  assert.deepEqual(metricCoverage([record({ usdSalary: null })], 'usdSalary'), {
    selectedCount: 1,
    usableCount: 0,
    usUsableCount: 0,
    usUsableShare: null,
  });
});

test('salary distribution uses stable half-open bins and conserves every usable value', () => {
  const values = [1, 24_999, 25_000, 49_999, 50_000, 499_999, 500_000, 1_100_000, 1_300_000];
  const cohort = [
    ...values.map((usdSalary, index) => record({ id: index + 1, usdSalary })),
    record({ id: 20, usdSalary: null }),
    record({ id: 21, usdSalary: 0 }),
    record({ id: 22, usdSalary: -1 }),
    record({ id: 23, usdSalary: Number.NaN }),
    record({ id: 24, usdSalary: Number.POSITIVE_INFINITY }),
  ];
  const distribution = salaryDistribution(cohort, 'usdSalary');

  assert.equal(distribution.bins.length, 20);
  assert.deepEqual(distribution.bins.slice(0, 3), [
    { lowerBound: 0, upperBound: 25_000, count: 2 },
    { lowerBound: 25_000, upperBound: 50_000, count: 2 },
    { lowerBound: 50_000, upperBound: 75_000, count: 1 },
  ]);
  assert.equal(distribution.bins[19].count, 1);
  assert.equal(distribution.bins.slice(3, 19).reduce((sum, bin) => sum + bin.count, 0), 0);
  assert.equal(distribution.usableCount, values.length);
  assert.equal(distribution.tailCount, 3);
  assert.equal(distribution.tailMax, 1_300_000);
  assert.equal(distribution.bins.reduce((sum, bin) => sum + bin.count, 0) + distribution.tailCount, distribution.usableCount);
  assert.equal(distribution.supportedSummary, null);
  assert.equal(distribution.medianInRegularDomain, false);
});

test('broad distributions match fixed dataset oracles without dropping the tail', () => {
  const base = salaryDistribution(editorialRecords, 'usdSalary');
  const total = salaryDistribution(editorialRecords, 'usdTotalComp');

  assert.deepEqual(base.bins.map(({ count }) => count), [12, 26, 53, 89, 103, 79, 62, 53, 27, 11, 8, 3, 6, 0, 0, 1, 1, 0, 1, 0]);
  assert.deepEqual(total.bins.map(({ count }) => count), [7, 14, 34, 60, 62, 56, 43, 29, 35, 19, 11, 7, 17, 0, 6, 6, 2, 1, 4, 0]);
  assert.deepEqual(
    {
      usableCount: base.usableCount,
      tailCount: base.tailCount,
      tailMax: base.tailMax,
      regularPeak: base.regularPeak,
      regularScaleMax: base.regularScaleMax,
      summary: base.supportedSummary,
    },
    {
      usableCount: 536,
      tailCount: 1,
      tailMax: 500_000,
      regularPeak: 103,
      regularScaleMax: 103,
      summary: { median: 120_000, p25: 86_300, p75: 160_000 },
    },
  );
  assert.equal(total.usableCount, 429);
  assert.equal(total.tailCount, 16);
  assert.equal(total.tailMax, 1_300_000);
  assert.equal(total.bins.reduce((sum, bin) => sum + bin.count, 0) + total.tailCount, 429);
});

test('distribution keeps all-tail and exact-threshold medians outside the regular domain', () => {
  const allTailValues = [500_000, 500_000, 525_000, 550_000, 575_000, 600_000, 625_000, 650_000, 675_000, 700_000];
  const thresholdValues = [400_000, 425_000, 450_000, 475_000, 500_000, 500_000, 525_000, 550_000, 575_000, 600_000];
  const allTail = salaryDistribution(allTailValues.map((usdSalary, index) => record({ id: index + 1, usdSalary })));
  const threshold = salaryDistribution(thresholdValues.map((usdSalary, index) => record({ id: index + 1, usdSalary })));

  assert.deepEqual(allTail.bins.map(({ count }) => count), Array(20).fill(0));
  assert.deepEqual(
    {
      usableCount: allTail.usableCount,
      regularPeak: allTail.regularPeak,
      regularScaleMax: allTail.regularScaleMax,
      tailCount: allTail.tailCount,
      tailMax: allTail.tailMax,
      allInTail: allTail.allInTail,
      summary: allTail.supportedSummary,
      medianInRegularDomain: allTail.medianInRegularDomain,
    },
    {
      usableCount: 10,
      regularPeak: 0,
      regularScaleMax: 1,
      tailCount: 10,
      tailMax: 700_000,
      allInTail: true,
      summary: { median: 587_500, p25: 531_250, p75: 643_750 },
      medianInRegularDomain: false,
    },
  );
  assert.equal(threshold.bins.reduce((sum, bin) => sum + bin.count, 0), 4);
  assert.equal(threshold.tailCount, 6);
  assert.equal(threshold.tailMax, 600_000);
  assert.equal(threshold.supportedSummary.median, 500_000);
  assert.equal(threshold.medianInRegularDomain, false);
});

test('distribution and grouped summaries expose counts but withhold statistics below ten', () => {
  const sparse = Array.from({ length: MIN_COHORT - 1 }, (_, index) =>
    record({ id: index + 1, country: 'Sparse', usdSalary: 100_000 + index }),
  );
  const supported = [...sparse, record({ id: 10, country: 'Sparse', usdSalary: 100_009 })];

  assert.equal(salaryDistribution(sparse).bins.reduce((sum, bin) => sum + bin.count, 0), 9);
  assert.equal(salaryDistribution(sparse).supportedSummary, null);
  assert.deepEqual(salaryDistribution(supported).supportedSummary, {
    median: 100_004.5,
    p25: 100_002.25,
    p75: 100_006.75,
  });
  assert.equal(groupSalarySummaries(sparse, 'usdSalary', 'country').groups[0].summary, null);
  assert.deepEqual(groupSalarySummaries(supported, 'usdSalary', 'country').groups[0].summary, {
    median: 100_004.5,
    p25: 100_002.25,
    p75: 100_006.75,
  });
});

test('group summaries use the already-filtered cohort, retain missing groups, and sort predictably', () => {
  const uk = filterCohort(editorialRecords, { ...EMPTY_FILTERS, country: 'United Kingdom' });
  const ukCountry = groupSalarySummaries(uk, 'usdSalary', 'country');
  const ukRoles = groupSalarySummaries(uk, 'usdSalary', 'role');
  const ukYears = groupSalarySummaries(uk, 'usdSalary', 'year');
  assert.equal(ukCountry.isSingleGroup, true);
  assert.deepEqual(ukCountry.groups, [{
    key: 'United Kingdom',
    label: 'United Kingdom',
    selectedCount: 32,
    usableCount: 30,
    summary: { median: 75_565, p25: 56_515, p75: 88_900 },
  }]);
  for (const result of [ukRoles, ukYears]) {
    assert.equal(result.groups.reduce((sum, group) => sum + group.selectedCount, 0), 32);
    assert.equal(result.groups.reduce((sum, group) => sum + group.usableCount, 0), 30);
  }
  assert.deepEqual(ukYears.groups.map(({ key }) => key), ['2020', '2021', '2022', '2023', '2024']);

  const dataScientist2024 = filterCohort(editorialRecords, { ...EMPTY_FILTERS, role: 'Data Scientist', year: '2024' });
  const countries = groupSalarySummaries(dataScientist2024, 'usdSalary', 'country');
  assert.equal(dataScientist2024.length, 51);
  assert.equal(countries.groups.reduce((sum, group) => sum + group.selectedCount, 0), 51);
  assert.equal(countries.groups.reduce((sum, group) => sum + group.usableCount, 0), 44);

  const orderingFixture = [
    ...Array.from({ length: 10 }, (_, index) => record({ id: 100 + index, country: 'Lower supported', usdSalary: 100_000 + index })),
    ...Array.from({ length: 10 }, (_, index) => record({ id: 200 + index, country: 'Higher supported', usdSalary: 200_000 + index })),
    ...Array.from({ length: 3 }, (_, index) => record({ id: 300 + index, country: 'Sparse', usdSalary: 300_000 + index })),
    record({ id: 400, country: '', usdSalary: 400_000 }),
    record({ id: 401, country: '', usdSalary: null }),
  ];
  const ordered = groupSalarySummaries(orderingFixture, 'usdSalary', 'country');
  assert.deepEqual(ordered.groups.map(({ key }) => key), ['Higher supported', 'Lower supported', 'Sparse', 'Not stated']);
  assert.deepEqual(ordered.groups.at(-1), {
    key: 'Not stated',
    label: 'Not stated',
    selectedCount: 2,
    usableCount: 1,
    summary: null,
  });
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
