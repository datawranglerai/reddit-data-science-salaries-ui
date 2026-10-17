// Optional analytics acceptance check. Uses an explicit GoatCounter SDK spy and
// intercepts every analytics/support network boundary; it never contacts live stats.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

const appUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4178/';
const outputDirectory = process.env.ANALYTICS_REPORT_DIR || '.omx/reports/analytics-support';
const registeredEvents = new Set([
  'nav-skip', 'nav-reports', 'nav-about', 'nav-top', 'data-pipeline', 'source-code', 'logo-credit', 'support-coffee',
  'pay-base', 'pay-total', 'filter-country', 'filter-year', 'filter-role', 'filter-stage', 'filter-work', 'filter-search',
  'remove-country', 'remove-year', 'remove-role', 'remove-stage', 'remove-work', 'remove-search', 'reset-view', 'more-filters',
  'breakdown-country', 'breakdown-role', 'breakdown-year', 'groups-show-all', 'groups-show-fewer', 'chart-distribution',
  'chart-country', 'chart-role', 'chart-year', 'distribution-data', 'comparison-data', 'salary-position', 'salary-input',
  'export-csv', 'sort-title', 'sort-year', 'sort-base', 'sort-total', 'source-report', 'source-reddit', 'page-previous',
  'page-next', 'method-source', 'method-pay', 'method-labels', 'method-limits',
]);

const sdkSpy = `
  window.goatcounter = {
    count: function (event) {
      window.__analyticsCalls.push(JSON.parse(JSON.stringify(event)));
    }
  };
  window.__analyticsCalls.push({ kind: 'pageview', path: location.pathname, title: document.title });
`;

function pass(label) { console.log(`PASS ${label}`); }
function check(condition, label) { assert.ok(condition, label); pass(label); }

async function instrumentPage(browser, mode = 'ready') {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  const consoleErrors = [];
  const collectorRequests = [];

  await page.addInitScript((delayed) => {
    window.__analyticsCalls = [];
    if (delayed) {
      const addEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (type === 'load' && this instanceof HTMLScriptElement && this.id === 'goatcounter-script') {
          window.__goatcounterLoadListener = listener;
          return;
        }
        return addEventListener.call(this, type, listener, options);
      };
    }
    document.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a[href^="http"]')) event.preventDefault();
    }, true);
    document.addEventListener('auxclick', (event) => {
      if (event.target instanceof Element && event.target.closest('a[href^="http"]')) event.preventDefault();
    }, true);
  }, mode === 'delayed');
  await page.route('https://stats.salaryallegedly.com/**', async (route) => {
    collectorRequests.push({ url: route.request().url(), method: route.request().method(), body: route.request().postData() });
    await route.fulfill({ status: 204, body: '' });
  });
  await page.route('https://www.buymeacoffee.com/**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('https://gc.zgo.at/count.js', async (route) => {
    if (mode === 'blocked') return route.abort('blockedbyclient');
    const body = mode === 'delayed' || mode === 'missing'
      ? 'window.goatcounter = {};'
      : mode === 'throwing'
        ? 'window.goatcounter = { count: function () { throw new Error("counter unavailable") } };'
        : sdkSpy;
    return route.fulfill({ status: 200, contentType: 'application/javascript', body });
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

  const releaseSdk = async () => page.evaluate(() => {
    window.goatcounter = {
      count(event) { window.__analyticsCalls.push(JSON.parse(JSON.stringify(event))); },
    };
    window.__analyticsCalls.push({ kind: 'pageview', path: location.pathname, title: document.title });
    const listener = window.__goatcounterLoadListener;
    if (typeof listener === 'function') listener.call(document.getElementById('goatcounter-script'), new Event('load'));
    else if (listener?.handleEvent) listener.handleEvent(new Event('load'));
  });
  return { page, pageErrors, consoleErrors, collectorRequests, releaseSdk };
}

async function calls(page) {
  return page.evaluate(() => window.__analyticsCalls);
}

function eventCalls(allCalls) {
  return allCalls.filter((event) => event.event === true);
}

function paths(allCalls) {
  return eventCalls(allCalls).map((event) => event.path);
}

function countPath(allCalls, pathName) {
  return paths(allCalls).filter((value) => value === pathName).length;
}

async function verifyQueueAndInteractions(browser) {
  const { page, pageErrors, consoleErrors, collectorRequests, releaseSdk } = await instrumentPage(browser, 'delayed');
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: 'Salary, Allegedly' }).waitFor();
  const scriptConfig = await page.locator('#goatcounter-script').evaluateAll((scripts) => scripts.map((script) => ({
    src: script.getAttribute('src'),
    endpoint: script.getAttribute('data-goatcounter'),
    async: script.hasAttribute('async'),
  })));
  assert.deepEqual(scriptConfig, [{
    src: 'https://gc.zgo.at/count.js',
    endpoint: 'https://stats.salaryallegedly.com/count',
    async: true,
  }]);
  pass('One async GoatCounter script uses the expected HTTPS SDK and collector endpoint');
  check((await calls(page)).length === 0, 'No disclosure or interaction event is emitted before a user action');

  await page.locator('.distribution-chart svg').click();
  await page.locator('details.more-filters summary').click();
  await page.getByRole('link', { name: 'About the data' }).click();
  const reset = page.getByRole('region', { name: 'Salary report explorer' }).getByRole('button', { name: 'Reset view' }).first();
  for (let index = 0; index < 32; index += 1) await reset.click();

  await releaseSdk();
  await page.waitForFunction(() => window.__analyticsCalls.length === 31);
  const startupCalls = await calls(page);
  check(startupCalls.filter((event) => event.kind === 'pageview').length === 1, 'SDK spy records one automatic pageview');
  check(eventCalls(startupCalls).length === 30, 'Startup queue flushes its bounded thirty events');
  check(countPath(startupCalls, 'ui/chart-distribution/click') === 1, 'Queued chart click is retained exactly once');
  check(countPath(startupCalls, 'ui/more-filters/open') === 1, 'Queued disclosure open is retained exactly once');
  check(countPath(startupCalls, 'ui/nav-about/click') === 1, 'Queued navigation click is retained exactly once');

  await page.locator('details.more-filters summary').click();
  let allCalls = await calls(page);
  check(countPath(allCalls, 'ui/more-filters/close') === 1, 'Disclosure action is classified before close toggles');

  const beforeRadio = eventCalls(allCalls).length;
  await page.getByRole('group', { name: 'Pay measure' }).getByText('Total compensation', { exact: true }).click();
  allCalls = await calls(page);
  const radioEvents = eventCalls(allCalls).slice(beforeRadio);
  assert.deepEqual(radioEvents.map((event) => event.path), ['ui/pay-total/click', 'ui/pay-total/change']);
  pass('Visible radio label produces one click and one separate change event');

  const showAll = page.getByRole('button', { name: /Show all/ });
  await showAll.click();
  await page.getByRole('button', { name: /Show fewer/ }).click();
  allCalls = await calls(page);
  check(countPath(allCalls, 'ui/groups-show-all/click') === 1, 'Show-all identity is captured before its label changes');
  check(countPath(allCalls, 'ui/groups-show-fewer/click') === 1, 'Show-fewer identity is captured after expansion');

  await page.locator('details.more-filters summary').click();
  const search = page.getByLabel('Search title, industry, city or education');
  await search.fill('private-entered-search');
  await search.press('Tab');
  const salaryDetails = page.locator('details.salary-position');
  await salaryDetails.locator('summary').click();
  const salary = page.getByLabel('Annual total compensation in USD');
  await salary.fill('987654');
  await salary.press('Tab');
  allCalls = await calls(page);
  check(countPath(allCalls, 'ui/filter-search/change') === 1, 'Committed search emits one value-free change event');
  check(countPath(allCalls, 'ui/salary-input/change') === 1, 'Committed salary emits one value-free change event');
  const serialized = JSON.stringify(eventCalls(allCalls));
  check(!serialized.includes('private-entered-search') && !serialized.includes('987654') && !serialized.includes('368'), 'Analytics payloads omit entered values, DOM text and record IDs');
  check(eventCalls(allCalls).every((event) => Object.keys(event).sort().join(',') === 'event,no_session,path,title'), 'Every custom event has only the fixed analytics fields');
  await page.getByRole('button', { name: /Remove Search filter:/ }).click();

  await page.locator('.distribution-chart svg').click();
  await page.locator('.comparison-rows').click({ position: { x: 4, y: 4 } });
  await page.locator('details.chart-data summary').click();
  await page.locator('details.group-data summary').click();
  await page.getByRole('button', { name: 'Download filtered CSV' }).click();
  await page.getByRole('link', { name: 'Reports', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  const source = page.getByText('Inspect source report', { exact: true }).first();
  await source.click();
  await source.locator('xpath=..').getByRole('link', { name: /Original comment|Source thread/ }).click();
  const support = page.getByRole('link', { name: 'Buy me a coffee' });
  await support.dispatchEvent('auxclick', { button: 1 });

  const disabledCountBefore = countPath(await calls(page), 'ui/reset-view/click');
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.disabled = true;
    button.dataset.analyticsEvent = 'reset-view';
    document.body.append(button);
    button.click();
  });
  check(countPath(await calls(page), 'ui/reset-view/click') === disabledCountBefore, 'Disabled controls emit no event');

  allCalls = await calls(page);
  for (const expected of [
    'ui/chart-distribution/click', 'ui/chart-country/click', 'ui/distribution-data/open', 'ui/comparison-data/open',
    'ui/export-csv/click', 'ui/nav-reports/click', 'ui/page-next/click', 'ui/source-report/open',
    'ui/source-reddit/click', 'ui/support-coffee/click',
  ]) check(countPath(allCalls, expected) >= 1, `${expected} is covered`);

  const tagAudit = await page.evaluate(() => {
    const tagged = [...document.querySelectorAll('[data-analytics-event]')].map((element) => element.getAttribute('data-analytics-event'));
    const missing = [...document.querySelectorAll('a[href], button, select, input:not([type="hidden"]), summary, [role="img"]')]
      .filter((element) => !element.hasAttribute('data-analytics-event') && !element.matches('button:disabled'))
      .map((element) => `${element.tagName}:${element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 40) || element.getAttribute('type')}`);
    return { tagged: [...new Set(tagged)], missing };
  });
  assert.deepEqual(tagAudit.tagged.filter((name) => !registeredEvents.has(name)), []);
  assert.deepEqual(tagAudit.missing, []);
  pass('All current interactive controls and charts use registered event keys');
  check(collectorRequests.length === 0, 'No QA request reached the live GoatCounter collector');
  check(pageErrors.length === 0 && consoleErrors.length === 0, `Ready SDK scenario has no browser errors: ${[...pageErrors, ...consoleErrors].join(' | ')}`);
  await page.close();
}

async function verifyFailureMode(browser, mode) {
  const { page, pageErrors, consoleErrors, collectorRequests } = await instrumentPage(browser, mode);
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  const explorer = page.getByRole('region', { name: 'Salary report explorer' });
  await explorer.getByRole('group', { name: 'Pay measure' }).getByText('Total compensation', { exact: true }).click();
  check((await explorer.innerText()).includes('429 of 673 selected reports'), `${mode} counter leaves the explorer usable`);
  check(collectorRequests.length === 0, `${mode} counter sends no live collector request`);
  check(pageErrors.length === 0, `${mode} counter causes no uncaught browser error`);
  if (mode !== 'blocked') check(consoleErrors.length === 0, `${mode} counter causes no console error`);
  await page.close();
}

async function verifySupport(browser) {
  const { page, pageErrors, consoleErrors } = await instrumentPage(browser, 'ready');
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  const support = page.getByRole('link', { name: 'Buy me a coffee' });
  assert.equal(await support.getAttribute('href'), 'https://www.buymeacoffee.com/datawranglerai');
  assert.equal(await support.getAttribute('target'), '_blank');
  check((await support.getAttribute('rel')).split(/\s+/).includes('noreferrer'), 'Support link protects the opener/referrer boundary');
  check(await support.locator('svg').count() === 1 && await support.locator('img, iframe, script').count() === 0, 'Support link uses the native icon-and-text treatment');
  const style = await support.evaluate((element) => {
    const own = getComputedStyle(element);
    const body = getComputedStyle(document.body);
    return { display: own.display, fontFamily: own.fontFamily, bodyFontFamily: body.fontFamily, height: element.getBoundingClientRect().height };
  });
  check(['flex', 'inline-flex'].includes(style.display), `Support link uses native flex layout (${style.display})`);
  check(style.fontFamily === style.bodyFontFamily, `Support link inherits native typography (${style.fontFamily})`);
  check(style.height >= 20, `Support link retains a readable text-and-icon target (${style.height}px high)`);

  for (const width of [375, 390, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    check(dimensions.scrollWidth <= dimensions.viewport, `Footer has no page-wide overflow at ${width}px`);
    await page.locator('footer').screenshot({ path: path.join(outputDirectory, `footer-${width}.png`) });
  }
  check(pageErrors.length === 0 && consoleErrors.length === 0, `Support checks have no browser errors: ${[...pageErrors, ...consoleErrors].join(' | ')}`);
  await page.close();
}

(async () => {
  await fs.mkdir(outputDirectory, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  try {
    await verifyQueueAndInteractions(browser);
    await verifyFailureMode(browser, 'blocked');
    await verifyFailureMode(browser, 'missing');
    await verifyFailureMode(browser, 'throwing');
    await verifySupport(browser);
    console.log(`Analytics evidence: ${path.resolve(outputDirectory)}`);
    console.log('Provider delivery note: the browser suite uses an explicit SDK spy; live GoatCounter delivery is intentionally not exercised.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
