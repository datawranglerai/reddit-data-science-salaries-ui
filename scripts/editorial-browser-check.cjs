// Optional browser verification. Playwright and Chromium may be supplied from any external install:
// PLAYWRIGHT_MODULE_PATH=/path/to/playwright BROWSER_EXECUTABLE=/path/to/chromium \
// PREVIEW_URL=http://127.0.0.1:4178/ node scripts/editorial-browser-check.cjs
// Set BROWSER_CHECK_SCOPE=fixture to run only the renderer contract while the app is being integrated.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const sourceRows = require('../src/data/v2/processed_salary_data_v3.json');

const appUrl = new URL(process.env.PREVIEW_URL || 'http://127.0.0.1:4178/');
const fixtureUrl = new URL('/scripts/fixtures/explorer-charts.html', appUrl);
const outputRoot = process.env.BROWSER_REPORT_DIR || path.join(
  '.omx', 'reports', 'salary-allegedly-implementation',
  `browser-${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}`,
);
const scope = process.env.BROWSER_CHECK_SCOPE || 'full';
const regressionFailures = [];
const sourceHashes = {
  'src/data/v2/processed_salary_data_v3.json': '16ea5cd13b0f0b1193b568ea2525cb2f6dac269e1ce67c1b30eb277facfbe7b2',
  'src/data/v2/processed_salary_data_v3.csv': '755f9e214766d03c948b9d1a752340c6e37559eaa9cd58b0a8e337ed9feb63ac',
};

function pass(label) { console.log(`PASS ${label}`); }
function check(condition, label) { assert.ok(condition, label); pass(label); }
function recordRegression(condition, label, evidence) {
  if (condition) pass(label);
  else {
    const failure = `${label}: ${evidence}`;
    regressionFailures.push(failure);
    console.error(`FAIL ${failure}`);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (quoted) throw new Error('CSV ended inside a quoted cell.');
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const [headers, ...data] = rows;
  assert(headers, 'CSV has a header row');
  return data.filter((values) => values.some(Boolean)).map((values, index) => {
    assert.equal(values.length, headers.length, `CSV row ${index + 2} matches the header width`);
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}

async function downloadCsv(page, buttonName = /Download filtered CSV/i) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: buttonName }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  assert(filePath, 'CSV download has a readable temporary path');
  return parseCsv(await fs.readFile(filePath, 'utf8'));
}

async function clickChoice(page, groupName, label) {
  await page.getByRole('group', { name: groupName, exact: true }).getByText(label, { exact: true }).click();
}

async function textIncludes(locator, expected, label) {
  const actual = await locator.innerText();
  assert(actual.includes(expected), `${label}: expected ${JSON.stringify(expected)} in ${JSON.stringify(actual)}`);
  pass(label);
}

async function chartModel(chart) {
  return chart.evaluate((root) => {
    const svg = root.querySelector('svg');
    const numericAttributes = ['x', 'y', 'x1', 'x2', 'y1', 'y2', 'width', 'height', 'cx', 'cy', 'r'];
    const attributes = [...root.querySelectorAll('svg *')].flatMap((element) => numericAttributes
      .filter((name) => element.hasAttribute(name))
      .map((name) => ({ tag: element.tagName, name, value: element.getAttribute(name) })));
    return {
      aria: svg?.getAttribute('aria-label') || '', text: root.textContent || '',
      bars: [...root.querySelectorAll('.distribution-bar')].map((bar) => ({
        x: Number(bar.getAttribute('x')), y: Number(bar.getAttribute('y')),
        width: Number(bar.getAttribute('width')), height: Number(bar.getAttribute('height')),
      })),
      median: root.querySelector('.median-marker') ? {
        x1: Number(root.querySelector('.median-marker').getAttribute('x1')),
        x2: Number(root.querySelector('.median-marker').getAttribute('x2')),
      } : null,
      baselineY: Number(root.querySelector('.plot-baseline')?.getAttribute('y1')),
      attributes,
    };
  });
}

function assertFiniteChart(model, label) {
  check(model.bars.length === 20, `${label}: all twenty regular bins render`);
  for (const attribute of model.attributes) {
    assert(Number.isFinite(Number(attribute.value)), `${label}: ${attribute.tag}.${attribute.name} must be finite, got ${attribute.value}`);
  }
  for (const bar of model.bars) assert(bar.height >= 0 && bar.width >= 0, `${label}: bar geometry cannot be negative`);
  pass(`${label}: finite non-negative SVG geometry`);
}

async function verifyRendererFixtures(page) {
  await page.goto(fixtureUrl.href, { waitUntil: 'networkidle' });
  check(await page.getByRole('heading', { name: 'Distribution chart renderer fixtures' }).count() === 1, 'Renderer fixture loaded through Vite');

  const allTail = await chartModel(page.locator('[data-case="all-tail"] .distribution-chart'));
  assertFiniteChart(allTail, 'All-tail fixture');
  check(allTail.bars.every(({ height, y }) => height === 0 && y === allTail.baselineY), 'All-tail fixture: zero-count regular bars remain at zero height');
  check(allTail.median === null, 'All-tail fixture: off-domain median has no marker');
  check(/All 10 usable reports are ≥\$500k/.test(allTail.text), 'All-tail fixture: exact all-tail statement is visible');
  check(allTail.text.includes('$587,500') && allTail.text.includes('$700,000'), 'All-tail fixture: exact median and maximum are visible');
  check(allTail.aria.includes('$587,500') && /outside|beyond|tail/i.test(allTail.aria), 'All-tail fixture: accessible description identifies the off-domain median');
  check(allTail.aria.includes('$700,000'), 'All-tail fixture: accessible description includes the actual maximum');

  const threshold = await chartModel(page.locator('[data-case="threshold-median"] .distribution-chart'));
  assertFiniteChart(threshold, 'Threshold-median fixture');
  check(threshold.bars.filter(({ height }) => height > 0).length === 4, 'Threshold-median fixture: four regular observations render');
  check(threshold.median === null, 'Threshold-median fixture: $500,000 median is not clamped to the endpoint');
  check(threshold.text.includes('$500,000') && threshold.text.includes('$600,000'), 'Threshold-median fixture: median and maximum are visible');
  check(threshold.aria.includes('$500,000') && /outside|beyond|tail/i.test(threshold.aria), 'Threshold-median fixture: accessible description identifies the median outside the regular plot');

  const empty = await chartModel(page.locator('[data-case="empty"] .distribution-chart'));
  assertFiniteChart(empty, 'Empty fixture');
  check(empty.bars.every(({ height }) => height === 0), 'Empty fixture: every regular bar remains zero height');
  check(empty.median === null && /No usable base salary values/i.test(empty.text), 'Empty fixture: no marker or invented summary');

  const ordinary = await chartModel(page.locator('[data-case="ordinary"] .distribution-chart'));
  assertFiniteChart(ordinary, 'Ordinary fixture');
  check(ordinary.median !== null && ordinary.median.x1 === 144 && ordinary.median.x2 === 144, 'Ordinary fixture: median marker uses the exact $120,000 position');
  check(ordinary.bars.some(({ height }) => height === ordinary.baselineY - 4), 'Ordinary fixture: peak reaches the finite chart maximum');
  check(ordinary.bars.some(({ height }) => height === 0), 'Ordinary fixture: zero bins retain zero height');
}

async function assertOpeningGeometry(page, width, outputDirectory, suffix = '') {
  const height = width === 1440 ? 1000 : 844;
  await page.setViewportSize({ width, height });
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  const geometry = await page.evaluate(() => {
    const box = (element) => element ? element.getBoundingClientRect().toJSON() : null;
    const axis = [...document.querySelectorAll('.plot-axis span')];
    return {
      viewport: { width: innerWidth, height: innerHeight }, scrollWidth: document.documentElement.scrollWidth,
      plot: box(document.querySelector('.plot-column svg')), tail: box(document.querySelector('.tail-summary')),
      caveat: box(document.querySelector('.data-caveat')),
      country: box(document.querySelector('select[aria-label="Country"], label.primary-country select')),
      metric: box(document.querySelector('fieldset.metric-choice')),
      axes: axis.map((element) => ({ text: element.textContent, box: box(element) })),
      positiveBars: [...document.querySelectorAll('.distribution-bar')].filter((bar) => Number(bar.getAttribute('height')) > 0).length,
    };
  });
  check(geometry.scrollWidth <= geometry.viewport.width, `No page-wide overflow at ${width}px`);
  for (const [name, box] of Object.entries({ plot: geometry.plot, tail: geometry.tail, caveat: geometry.caveat, country: geometry.country, metric: geometry.metric })) {
    check(Boolean(box && box.top >= 0 && box.left >= 0 && box.right <= width + 0.5 && box.bottom <= height + 0.5), `${name} is fully present in the ${width}px opening viewport`);
  }
  check(geometry.axes.some(({ text }) => text === '$0') && geometry.axes.some(({ text }) => text === '$500k'), `${width}px opening shows both salary endpoints`);
  check(geometry.axes.every(({ box }) => box && box.left >= 0 && box.right <= width + 0.5 && box.bottom <= height + 0.5), `${width}px opening axis labels are not clipped`);
  check(geometry.positiveBars > 1, `${width}px opening shows the distribution shape`);
  await page.screenshot({ path: path.join(outputDirectory, `opening-${width}${suffix}.png`) });
}

async function assertEssentialTextSizes(page, width) {
  const sizes = await page.locator('.plot-axis span, .plot-y-labels span, .tail-summary span, .tail-summary p, .data-caveat, .group-label span, .comparison-axis span, .comparison-legend span').evaluateAll((elements) => elements
    .filter((element) => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0; })
    .map((element) => {
      const transform = element.getScreenCTM?.();
      return { text: element.textContent?.trim(), size: parseFloat(getComputedStyle(element).fontSize) * (transform ? Math.hypot(transform.a, transform.b) : 1) };
    }));
  const undersized = sizes.filter((item) => item.size < 12);
  recordRegression(
    undersized.length === 0,
    `Essential chart labels render at least 12px at ${width}px`,
    undersized.map((item) => `${JSON.stringify(item.text)}=${item.size}px`).join(', '),
  );
}

async function verifyApp(page, outputDirectory) {
  await page.goto(appUrl.href, { waitUntil: 'networkidle' });
  const metadata = await page.evaluate(() => ({
    language: document.documentElement.lang,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
  }));
  assert.deepEqual(metadata, {
    language: 'en', title: 'Salary, Allegedly',
    description: 'Explore salary reports from r/datascience, 2020–2025.',
    viewport: 'width=device-width, initial-scale=1.0',
  }, 'Document metadata describes the redesigned explorer');
  pass('Document metadata describes the redesigned explorer');
  check(await page.getByRole('heading', { level: 1, name: 'Salary, Allegedly', exact: true }).count() === 1, 'One exact page h1');
  await textIncludes(page.locator('body'), 'Salary reports from r/datascience, 2020–2025.', 'Plain source descriptor');
  const payDetails = page.locator('.about-details details').filter({ hasText: /Pay and exclusions/i });
  await payDetails.locator('summary').click();
  await textIncludes(payDetails, 'USD 1.00, GBP 1.27, CAD 0.74, EUR 1.08, INR 0.012, AUD 0.65, SGD 0.74 and CHF 1.13', 'Methods retain every fixed FX rate');
  await textIncludes(payDetails, 'not reporting-year exchange rates', 'Methods identify the fixed-rate limitation');
  await textIncludes(payDetails, 'Missing, unsupported-currency and nonpositive values do not enter pay summaries.', 'Methods retain pay eligibility rules');
  await textIncludes(payDetails, 'total compensation is excluded while a valid base salary remains', 'Methods retain the total-below-base rule');
  await payDetails.locator('summary').click();
  const summaryDetails = page.locator('.about-details details').filter({ hasText: /Labels and summaries/i });
  await summaryDetails.locator('summary').click();
  await textIncludes(summaryDetails, 'This display safeguard is not evidence that a group is representative.', 'Methods explain the n=10 safeguard limit');
  await summaryDetails.locator('summary').click();
  const explorer = page.getByRole('region', { name: 'Salary report explorer', exact: true });
  const countrySelect = explorer.locator('label.primary-country select');
  const yearSelect = explorer.locator('label.filter-field').filter({ hasText: /^Year/ }).locator('select');
  const roleSelect = explorer.locator('label.filter-field').filter({ hasText: /^Role/ }).locator('select');
  await textIncludes(explorer, '536 of 673 selected reports', 'Broad base coverage');
  await textIncludes(explorer, '402 of 536 usable reports are from the U.S.', 'Broad base geography coverage');
  await textIncludes(explorer.locator('.tail-summary'), '1', 'Broad base tail count');
  const broadBase = await chartModel(explorer.locator('.distribution-chart'));
  assertFiniteChart(broadBase, 'Broad base chart');
  check(broadBase.bars.filter(({ height }) => height > 0).length > 1, 'Broad base chart has a visible distribution');

  const broadRows = await downloadCsv(page);
  const broadIds = broadRows.map((row) => Number(row.ID)).sort((a, b) => a - b);
  const sourceIds = sourceRows.map((row) => Number(row.id)).sort((a, b) => a - b);
  assert.deepEqual(broadIds, sourceIds, 'Broad CSV contains every source identity exactly once');
  check(new Set(broadIds).size === 673, 'Broad CSV has 673 unique source IDs');

  const comparisonDetails = page.locator('details').filter({ hasText: /Compare a salary/i }).first();
  if (await comparisonDetails.count() && await comparisonDetails.getAttribute('open') === null) await comparisonDetails.locator('summary').click();
  const salaryInput = page.getByLabel(/Annual (?:base salary|total compensation) in USD/i).first();
  await salaryInput.fill('150000');
  await textIncludes(explorer, 'strictly', 'Salary comparison explains tie behavior');
  await clickChoice(page, 'Pay measure', 'Total compensation');
  check(await salaryInput.inputValue() === '', 'Metric change clears salary comparison input');
  await textIncludes(explorer, '429 of 673 selected reports', 'Broad total coverage');
  await textIncludes(explorer, '330 of 429 usable reports are from the U.S.', 'Broad total geography coverage');
  await textIncludes(explorer.locator('.tail-summary'), '16', 'Broad total tail count');
  await textIncludes(explorer.locator('.tail-summary'), '$1,300,000', 'Broad total actual maximum');
  await page.screenshot({ path: path.join(outputDirectory, 'broad-total.png'), fullPage: true });

  await clickChoice(page, 'Pay measure', 'Base salary');
  await countrySelect.selectOption({ label: 'United Kingdom' });
  await textIncludes(explorer, '30 of 32 selected reports', 'UK base coverage');
  await textIncludes(explorer, '$75,565', 'UK supported median');
  await textIncludes(explorer, '$56,515', 'UK first quartile');
  await textIncludes(explorer, '$88,900', 'UK third quartile');
  await textIncludes(explorer, 'United Kingdom', 'UK country detail');
  await page.screenshot({ path: path.join(outputDirectory, 'uk-detail.png'), fullPage: true });

  await roleSelect.selectOption({ label: 'Data Scientist' });
  await yearSelect.selectOption('2024');
  await textIncludes(explorer, '1 of 1 selected report has usable base salary.', 'UK Data Scientist 2024 base coverage');
  await textIncludes(explorer, 'Small sample: 1 usable report. Summary withheld.', 'Sparse selection has an exact usable count and local warning');
  check(!/Median\s*\$34,290/.test(await explorer.innerText()), 'Sparse selection withholds a median claim');
  const sparseSource = explorer.locator('details').filter({ hasText: /Inspect source report/i }).first();
  await sparseSource.locator('summary').click();
  check(await sparseSource.getByText('368', { exact: true }).isVisible(), 'Source ID 368 remains inspectable');
  await page.screenshot({ path: path.join(outputDirectory, 'sparse-id-368.png'), fullPage: true });

  await clickChoice(page, 'Pay measure', 'Total compensation');
  await textIncludes(explorer, '0 of 1 selected report has usable total compensation.', 'ID 368 zero-total coverage');
  check(!/NaN|Infinity/.test(await explorer.innerText()), 'Zero-usable state has no non-finite claim');
  const zeroSource = explorer.locator('details').filter({ hasText: /Inspect source report/i }).first();
  if (await zeroSource.getAttribute('open') === null) await zeroSource.locator('summary').click();
  await textIncludes(zeroSource, '368', 'Zero-usable state retains source ID 368');
  await page.screenshot({ path: path.join(outputDirectory, 'zero-usable-id-368.png'), fullPage: true });

  await clickChoice(page, 'Pay measure', 'Base salary');
  await countrySelect.selectOption('');
  check(await roleSelect.inputValue() === 'Data Scientist', 'Clearing Country preserves Role');
  check(await yearSelect.inputValue() === '2024', 'Clearing Country preserves Year');
  await textIncludes(explorer, '44 of 51 selected reports', 'Clear-Country base coverage');
  const filteredRows = await downloadCsv(page);
  const expectedFilteredIds = broadRows.filter((row) => row.Year === '2024' && row.Role === 'Data Scientist').map((row) => Number(row.ID)).sort((a, b) => a - b);
  const actualFilteredIds = filteredRows.map((row) => Number(row.ID)).sort((a, b) => a - b);
  assert.deepEqual(actualFilteredIds, expectedFilteredIds, 'Filtered CSV identities match Data Scientist + 2024 from the broad export');
  check(actualFilteredIds.length === 51 && actualFilteredIds.includes(368), 'Filtered CSV contains the exact 51-row cohort including ID 368');

  const breakdown = page.getByRole('group', { name: 'Break down by', exact: true });
  const showAll = explorer.getByRole('button', { name: /Show all/i });
  check(await showAll.count() === 1, 'Truncated country comparison exposes Show all');
  const beforeGroups = await explorer.locator('.comparison-row').count();
  await showAll.click();
  check(await explorer.locator('.comparison-row').count() > beforeGroups, 'Show all expands the visible group rows');
  await breakdown.getByRole('radio').first().focus();
  await page.keyboard.press('ArrowRight');
  check(await breakdown.getByRole('radio', { checked: true }).count() === 1, 'Breakdown selection works by keyboard');
  await page.keyboard.press('ArrowRight');
  check(await breakdown.getByRole('radio', { checked: true }).count() === 1, 'Breakdown selection exposes one checked state');
  const chartData = explorer.locator('.group-data').first();
  await chartData.locator('summary').click();
  check(await chartData.getByRole('table').isVisible(), 'Group chart data disclosure is a keyboard-usable text equivalent');
  const reportsTable = explorer.getByRole('region', { name: 'Selected salary reports', exact: true }).getByRole('table');
  const titleHeader = reportsTable.getByRole('columnheader', { name: /Title/i });
  const firstTitleBefore = await reportsTable.locator('tbody tr:not(.source-row)').first().locator('td').first().innerText();
  await titleHeader.getByRole('button').click();
  check((await titleHeader.getAttribute('aria-sort')) !== 'none', 'Sort updates aria-sort');
  const firstTitleAfter = await reportsTable.locator('tbody tr:not(.source-row)').first().locator('td').first().innerText();
  check(firstTitleAfter !== firstTitleBefore, 'Sort changes visible row order');
  await explorer.getByRole('button', { name: 'Next', exact: true }).click();
  await textIncludes(explorer, 'Page 2', 'Pagination advances');
  await countrySelect.selectOption({ label: 'United Kingdom' });
  await textIncludes(explorer, 'Page 1', 'Filter change resets pagination');

  const sourceDetails = explorer.locator('details').filter({ hasText: /Original (comment|report)|Raw values/i }).first();
  await sourceDetails.locator('summary').focus();
  await page.keyboard.press('Enter');
  check(await sourceDetails.getAttribute('open') !== null, 'Source inspection opens by keyboard');
  await textIncludes(sourceDetails, 'Original', 'Source inspection exposes original text and raw fields');
  const safeLinks = await sourceDetails.locator('a').evaluateAll((links) => links.map((link) => link.href));
  check(safeLinks.length > 0 && safeLinks.every((href) => /^https:\/\/(?:www\.)?reddit\.com\//.test(href)), 'Source links are restricted to safe Reddit URLs');
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(outputDirectory, 'source-detail.png'), fullPage: true });

  const moreFilters = explorer.locator('details.more-filters');
  if (await moreFilters.getAttribute('open') === null) await moreFilters.locator('summary').click();
  const workSelect = moreFilters.locator('label.filter-field').filter({ hasText: /^Work arrangement/ }).locator('select');
  const searchInput = moreFilters.locator('input[type="search"]');
  await workSelect.selectOption('Not stated');
  await textIncludes(explorer, 'Not stated', 'Unknown work arrangement remains selectable');
  await searchInput.fill('zzzz_no_matching_disclosure');
  await textIncludes(explorer, 'No reports match', 'Impossible search has an empty recovery state');
  check(await explorer.getByRole('button', { name: /Remove Search filter|Reset view/i }).count() > 0, 'Empty state exposes filter removal and reset recovery');
  await explorer.getByRole('status').getByRole('button', { name: 'Reset view', exact: true }).click();
  await textIncludes(explorer, '536 of 673 selected reports', 'Reset restores broad base coverage');
  check(await countrySelect.inputValue() === '', 'Reset restores all countries');
  check(await explorer.getByLabel(/Annual base salary in USD/i).inputValue() === '', 'Reset clears comparison value');
  await countrySelect.selectOption('Not stated');
  await textIncludes(explorer, 'Not stated', 'Unknown country remains a distinct filter value');
  await explorer.getByRole('button', { name: 'Reset view', exact: true }).click();

  const baseRadio = explorer.getByRole('radio', { name: 'Base salary', exact: true });
  await page.keyboard.press('Tab');
  await baseRadio.focus();
  const focusEvidence = await baseRadio.evaluate((input) => {
    const indicator = input.nextElementSibling;
    const style = getComputedStyle(indicator);
    const background = getComputedStyle(document.body).backgroundColor;
    const channels = (color) => (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = (color) => {
      const values = channels(color).map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
    };
    const light = Math.max(luminance(style.outlineColor), luminance(background));
    const dark = Math.min(luminance(style.outlineColor), luminance(background));
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth),
      contrast: (light + 0.05) / (dark + 0.05),
      target: indicator.getBoundingClientRect().toJSON(),
    };
  });
  check(focusEvidence.outlineStyle !== 'none' && focusEvidence.outlineWidth >= 2, 'Keyboard focus has a visible outline');
  check(focusEvidence.contrast >= 3, `Keyboard focus outline contrast is at least 3:1 (${focusEvidence.contrast.toFixed(2)}:1)`);
  check(focusEvidence.target.width >= 24 && focusEvidence.target.height >= 24, 'Pay measure target meets the 24px minimum size');
  await page.screenshot({ path: path.join(outputDirectory, 'keyboard-focus.png') });
  await page.evaluate(() => document.activeElement?.blur());

  const longSearch = 'MachineLearningEngineeringLeadership'.repeat(3);
  await page.setViewportSize({ width: 390, height: 844 });
  if (await moreFilters.getAttribute('open') === null) await moreFilters.locator('summary').click();
  await searchInput.fill(longSearch);
  const searchChip = explorer.getByRole('button', { name: `Remove Search filter: ${longSearch}`, exact: true });
  check(await searchChip.isVisible(), 'Long search chip exposes its complete removal name');
  check((await searchChip.innerText()).includes(longSearch), 'Long search chip retains its complete value');
  const searchOverflow = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  recordRegression(
    searchOverflow.scrollWidth <= searchOverflow.viewport,
    'Long unbroken search chip does not create page-wide overflow at 390px',
    `scrollWidth ${searchOverflow.scrollWidth}px for ${searchOverflow.viewport}px viewport`,
  );
  await searchChip.click();
  check(await searchInput.inputValue() === '', 'Long search chip remains removable');

  await page.setViewportSize({ width: 384, height: 500 });
  const salaryDetails = explorer.locator('details.salary-position');
  if (await salaryDetails.getAttribute('open') === null) await salaryDetails.locator('summary').click();
  await salaryInput.fill('1e100');
  const salaryResult = salaryDetails.locator('[aria-live="polite"]');
  const salaryResultText = await salaryResult.innerText();
  check(await salaryResult.isVisible() && salaryResultText.includes('strictly below') && !/NaN|Infinity/.test(salaryResultText), 'Large finite salary result remains rendered and finite');
  const salaryOverflow = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  recordRegression(
    salaryOverflow.scrollWidth <= salaryOverflow.viewport,
    'Large finite salary result does not create page-wide overflow at the 384px CSS viewport',
    `scrollWidth ${salaryOverflow.scrollWidth}px for ${salaryOverflow.viewport}px viewport`,
  );
  await salaryInput.fill('');

  for (const width of [375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 });
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    check(dimensions.scroll <= dimensions.viewport, `No page-wide overflow at ${width}px (${dimensions.scroll}/${dimensions.viewport})`);
    await assertEssentialTextSizes(page, width);
  }
  await assertOpeningGeometry(page, 390, outputDirectory);
  await assertOpeningGeometry(page, 1440, outputDirectory);

  // Browser zoom halves the CSS-pixel viewport. A 384px CSS viewport represents 200% zoom
  // from the 768px reference without using CSS `zoom`, which changes overflow semantics.
  await page.setViewportSize({ width: 384, height: 500 });
  const zoom = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: innerWidth }));
  check(zoom.scrollWidth <= zoom.width, 'Content reflows at a 200%-equivalent CSS viewport (384px from 768px)');
  check(await countrySelect.isVisible(), 'Country control remains available at the 200%-equivalent CSS viewport');
  check(await explorer.locator('.tail-summary').isVisible(), 'Tail evidence remains available at the 200%-equivalent CSS viewport');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    animationDuration: getComputedStyle(document.querySelector('.distribution-bar')).animationDuration,
  }));
  check(reducedMotion.scrollBehavior === 'auto', 'Reduced motion disables smooth scrolling');
  const animationSeconds = reducedMotion.animationDuration.endsWith('ms')
    ? parseFloat(reducedMotion.animationDuration) / 1000
    : parseFloat(reducedMotion.animationDuration);
  check(animationSeconds <= 0.00001, `Reduced motion removes nonessential chart animation (${reducedMotion.animationDuration})`);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(appUrl.href, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(outputDirectory, 'full-desktop.png'), fullPage: true });
}

(async () => {
  await fs.mkdir(outputRoot, { recursive: true });
  for (const [file, expected] of Object.entries(sourceHashes)) {
    const actual = crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
    check(actual === expected, `${file} retains its approved source hash`);
  }
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  // Functional QA must not depend on the analytics CDN or create live statistics.
  // The separate analytics harness verifies event delivery with an intercepted SDK.
  await page.route('https://gc.zgo.at/count.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.goatcounter = { count: function () {} };',
  }));
  await page.route('https://stats.salaryallegedly.com/**', (route) => route.fulfill({ status: 204, body: '' }));
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    const source = location.url ? ` at ${location.url}:${location.lineNumber}:${location.columnNumber}` : '';
    runtimeErrors.push(`console: ${message.text()}${source}`);
  });
  try {
    await verifyRendererFixtures(page);
    if (scope !== 'fixture') await verifyApp(page, outputRoot);
    check(regressionFailures.length === 0, `No browser regression failures: ${regressionFailures.join(' | ')}`);
    check(runtimeErrors.length === 0, `No browser runtime errors: ${runtimeErrors.join(' | ')}`);
    console.log(`Browser evidence: ${path.resolve(outputRoot)}`);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
