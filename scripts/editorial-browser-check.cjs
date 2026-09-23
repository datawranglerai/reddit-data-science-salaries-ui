// Optional browser verification: uses a separately installed Playwright, not a runtime dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {})});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await fs.mkdir('screenshots/editorial', { recursive: true });
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  const check = (condition, label) => {assert(condition,label);console.log('PASS',label)};
  async function checkDistributionSplit(expectedMedian, label) {
    const plot = await page.locator('.distribution').evaluate(figure => ({
      medianX: Number(figure.querySelector('.median-line').getAttribute('x1')),
      count: Number(figure.querySelector('.distribution-stat b').textContent.match(/\d+/)[0]),
      dots: [...figure.querySelectorAll('.salary-dot')].map(dot => ({
        x: Number(dot.getAttribute('cx')),
        y: Number(dot.getAttribute('cy')),
        radius: Number(dot.getAttribute('r')),
        upper: dot.classList.contains('upper'),
        amount: Number(dot.textContent.split(' · ').at(-1).replace(/[^\d.]/g, '')),
      })),
    }));
    assert.equal(plot.dots.length, plot.count, `${label}: every report remains visible`);
    assert.ok(Math.abs(plot.medianX - (20 + expectedMedian / 450000 * 610)) < 0.001, `${label}: line stays at the exact median`);
    for (const dot of plot.dots) {
      assert.equal(dot.upper, dot.amount >= expectedMedian, `${label}: colour reflects the actual salary`);
      assert.ok(dot.upper ? dot.x - dot.radius > plot.medianX + 0.5 : dot.x + dot.radius < plot.medianX - 0.5,
        `${label}: $${dot.amount} dot must lie fully on its side of the median`);
    }
    for (let i = 0; i < plot.dots.length; i++) {
      for (let j = i + 1; j < plot.dots.length; j++) {
        const a = plot.dots[i], b = plot.dots[j];
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius,
          `${label}: reports must not overlap`);
      }
    }
    check(true, `${label}: exact median, accurate colour split, and no lost or overlapping dots`);
  }
  check(await page.locator('h1').count()===1,'One semantic page heading');
  check((await page.locator('.distribution-stat').innerText()).includes('536 usable'),'Initial distribution has audited cohort');
  await checkDistributionSplit(120000, 'All-location base pay');
  await page.getByRole('group',{name:'Distribution pay measure'}).getByRole('button',{name:'Total comp'}).click();
  check((await page.locator('.distribution-stat').innerText()).includes('total compensation'),'Distribution metric changes');
  await checkDistributionSplit(140000, 'All-location total compensation');
  await page.getByRole('group',{name:'Distribution location'}).getByRole('button',{name:'U.S. only'}).click();
  check((await page.locator('.distribution-stat').innerText()).includes('157k'),'Distribution location changes');
  await checkDistributionSplit(157000, 'U.S. total compensation');
  await page.getByRole('group',{name:'Distribution pay measure'}).getByRole('button',{name:'Base pay',exact:true}).click();
  await checkDistributionSplit(130000, 'U.S. base pay');
  await page.getByRole('group',{name:'Country comparison roles'}).getByRole('button',{name:'Data scientists',exact:true}).click();
  check((await page.locator('.country-row').first().innerText()).includes('$135k'),'Country comparison role cohort changes');
  check((await page.locator('.country-row').last().innerText()).includes('Too few reports'),'Small country samples suppressed');
  await page.getByRole('button',{name:/Under \$200k/}).click();
  check((await page.locator('.comp-big').innerText()).includes('8'),'Compensation band inspector changes');
  await page.getByRole('group',{name:'Trend cohort'}).getByRole('button',{name:'U.S. only'}).click();
  await page.locator('.chart-data summary').click();
  check((await page.locator('.chart-data').innerText()).includes('$155,500'),'Trend accessible table follows cohort');
  const explorer = page.getByRole('region',{name:'Salary report explorer',exact:true});
  check((await explorer.locator('.ex-records-head h3').innerText()).includes('416'),'Explorer defaults to US with raw rows');
  await explorer.getByLabel('Where does a salary land?').fill('150000');
  check((await explorer.locator('.ex-rank').innerText()).includes('strictly less'),'Personal comparison produces rank');
  await explorer.getByRole('button',{name:'Next',exact:true}).click();
  check((await explorer.locator('.ex-pagination').innerText()).includes('Page 2'),'Pagination advances');
  await explorer.getByRole('combobox',{name:'Country',exact:true}).selectOption('United Kingdom');
  check((await explorer.locator('.ex-pagination').innerText()).includes('Page 1'),'Filter resets pagination');
  check((await explorer.locator('.ex-stats').innerText()).includes('$75,565'),'Country filter updates summary');
  check((await explorer.locator('.ex-records-head h3').innerText()).includes('32'),'Country filter updates raw rows');
  await explorer.getByRole('combobox',{name:'Country',exact:true}).selectOption('Germany');
  await explorer.getByRole('combobox',{name:'Role',exact:true}).selectOption('Data Scientist');
  check((await explorer.locator('.ex-stats').innerText()).includes('Suppressed'),'Thin cohort summary suppressed');
  check((await explorer.locator('.ex-rank').innerText()).includes('withheld'),'Thin cohort percentile suppressed');
  await explorer.getByRole('button',{name:'Reset filters',exact:true}).click();
  await explorer.getByRole('button',{name:'Title',exact:false}).click();
  check(await explorer.locator('th').first().getAttribute('aria-sort')==='ascending','Accessible sort direction changes');
  const detail = explorer.locator('.ex-source-row summary').first();
  await detail.focus();await page.keyboard.press('Enter');
  check(await explorer.locator('.ex-source-row details').first().getAttribute('open')!==null,'Source opens with keyboard');
  check((await explorer.locator('.ex-original').first().innerText()).length>20,'Original source text available');
  check((await explorer.locator('.ex-source-detail a').first().getAttribute('href')).startsWith('https://www.reddit.com/'),'Source points to Reddit');
  const downloadPromise=page.waitForEvent('download');
  await explorer.getByRole('button',{name:'Download filtered CSV'}).click();
  const download=await downloadPromise;const csv=await fs.readFile(await download.path(),'utf8');
  check(csv.startsWith('"ID","Year","Title"')&&csv.includes('"Annual base USD"'),'CSV exports source and reviewed pay fields');
  check(csv.split('\r\n').length===417,'CSV contains all 416 filtered rows plus header');
  await explorer.getByLabel('Search title, industry, city or education').fill('zzzz_no_matching_disclosure');
  check(await explorer.getByRole('heading',{name:'No disclosures match that combination.'}).isVisible(),'Empty cohort gives recovery state');
  await explorer.getByRole('button',{name:'Reset to United States'}).click();
  await explorer.getByRole('combobox',{name:'Work arrangement',exact:true}).selectOption('Not stated');
  check((await explorer.locator('tbody').innerText()).includes('Not stated'),'Unknown work status selectable');
  await explorer.getByRole('button',{name:'Reset filters',exact:true}).click();
  await page.getByRole('group',{name:'Distribution pay measure'}).getByRole('button',{name:'Base pay',exact:true}).click();
  await page.getByRole('group',{name:'Distribution location'}).getByRole('button',{name:'All locations'}).click();
  await page.getByRole('group',{name:'Country comparison roles'}).getByRole('button',{name:'All roles',exact:true}).click();
  await page.getByRole('button',{name:/\$300k and up/}).click();
  await page.getByRole('group',{name:'Trend cohort'}).getByRole('button',{name:'All locations'}).click();
  await page.locator('.chart-data summary').click();
  await page.reload({waitUntil:'networkidle'});
  for (const width of [1440,1024,768,390,375]) {
    await page.setViewportSize({width,height:width>800?1000:844});
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    check(dimensions.scroll===dimensions.width,`No page overflow at ${width}px (${dimensions.scroll})`);
    if(width===1440||width===390){
      const name=width===1440?'desktop':'mobile';
      await page.screenshot({path:`screenshots/editorial/${name}.png`,fullPage:true});
      await page.screenshot({path:`screenshots/editorial/hero-${name}.png`});
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  check(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)==='auto','Reduced motion disables smooth scrolling');
  check(errors.length===0,`No browser runtime errors: ${errors.join(', ')}`);
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
