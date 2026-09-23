import { useEffect, useState } from 'react';
import { LuArrowDown, LuArrowDownRight, LuArrowUpRight, LuMoveUpRight } from 'react-icons/lu';
import processedData from './data/v2/processed_salary_data_v3.json';
import type { SalaryRecord } from './types';
import { compensationSummary, money, pairedRecords, prepareEditorialRecords, sourceLink, summarize, yearlySummary } from './utils/editorialData';
import { Compensation, Distribution, Geography, Participation } from './components/editorial/StoryCharts';
import Explorer from './components/editorial/Explorer';

const RECORDS = prepareEditorialRecords(processedData as SalaryRecord[]);
const BASE = summarize(RECORDS);
const US = RECORDS.filter((r) => r.country === 'United States');
const UK = RECORDS.filter((r) => r.country === 'United Kingdom');
const COUNTRY_RATIO = summarize(US).median! / summarize(UK).median!;
const TOP_COMP = compensationSummary(pairedRecords(US).filter((r) => r.usdTotalComp! >= 300000));
const TREND = yearlySummary(RECORDS);
const DIP = Math.round((1 - TREND[4].median! / TREND[3].median!) * 100);
const QUOTE = RECORDS.find((r) => r.id === 274)!;
const QUOTE_SOURCE = sourceLink(QUOTE);
const BRAND_MARK_URL = `${import.meta.env.BASE_URL}brand/salary-smirk.png`;
const CHAPTERS = [
  { id: 'geography', number: '01', label: 'The comparison trap' },
  { id: 'compensation', number: '02', label: 'Beyond the salary' },
  { id: 'the-sample', number: '03', label: 'Who’s still posting?' },
  { id: 'explore', number: '04', label: 'Find your people' },
];

export default function App() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-15% 0px -55% 0px' });
    CHAPTERS.forEach(({ id }) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  return <>
    <a className="skip-link" href="#main">Skip to the story</a>
    <header className="masthead page-width">
      <a className="wordmark" href="#" aria-label="Salary, allegedly. Back to top"><img className="brand-mark" src={BRAND_MARK_URL} alt="" width="68" height="68" /> salary, <em>allegedly.</em></a>
      <span className="masthead-edition">A FIELD GUIDE TO GETTING PAID</span>
      <a className="masthead-link" href="#explore">Explore the data <LuArrowUpRight aria-hidden="true" /></a>
    </header>
    <main id="main">
      <section className="hero page-width" aria-labelledby="headline">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="reddit-marker">r/</span><span>DATASCIENCE, WITH THE RECEIPTS</span></div>
          <h1 id="headline">Nice salary.<br /><em>Wrong</em><br /><em>comparison.</em></h1>
          <p className="hero-deck">Six years of Reddit salary threads. A lot of big numbers. And a few very good reasons to stop comparing yourself to strangers.</p>
          <div className="hero-actions"><a className="button button-primary" href="#geography">Follow the money <LuArrowDownRight aria-hidden="true" /></a><a className="text-link" href="#explore">Find your people <LuArrowUpRight aria-hidden="true" /></a></div>
          <p className="hero-disclaimer">Self-reported. Self-selected. Surprisingly revealing.</p>
        </div>
        <Distribution records={RECORDS} />
      </section>
      <div className="edition-strip page-width"><span><strong>{RECORDS.length}</strong> parsed records</span><span><strong>6</strong> annual threads</span><span><strong>2020—2025</strong> reporting years</span><a href="#methodology">The small print matters <LuArrowDown size={13} aria-hidden="true" /></a></div>
      <nav className="chapter-nav" aria-label="Story chapters"><div className="page-width">{CHAPTERS.map(({ id, number, label }) => <a href={`#${id}`} key={id} className={active === id ? 'is-active' : ''} aria-current={active === id ? 'location' : undefined}><span>{number}</span>{label}<LuArrowDownRight aria-hidden="true" /></a>)}</div></nav>

      <section id="geography" className="chapter geography page-width" aria-labelledby="geography-title">
        <div className="chapter-heading"><span className="chapter-number">01 / THE COMPARISON TRAP</span><span className="eyebrow">Location, location, compensation.</span></div>
        <div className="chapter-split">
          <div className="chapter-copy"><h2 id="geography-title">A job title is not<br />a pay bracket.</h2><p>“Data scientist” sounds like a useful salary benchmark. Add a country and it starts to mean something.</p><p>Across all roles in these threads, the U.S. median base is <strong>{money(summarize(US).median)}</strong>. The UK median is <strong>{money(summarize(UK).median)}</strong>. Narrow the chart to data scientists: the gap survives.</p><div className="margin-stat"><strong>{COUNTRY_RATIO.toFixed(1)}<span>×</span></strong><p>U.S. median base vs UK<br /><span>Pooled 2020–2025 reports, all roles</span></p></div><p className="editorial-note">This is a difference between reported pay packets, not a verdict on purchasing power. Experience, employers, taxes, and living costs differ too.</p></div>
          <Geography records={RECORDS} />
        </div>
        <aside className="thread-quote"><span className="quote-mark" aria-hidden="true">“</span><div><blockquote>Damn I gotta get a new job and leave this country</blockquote><div className="quote-attribution"><span>ML engineer · Bangalore · {money(QUOTE.usdSalary)} base · {QUOTE.year}</span>{QUOTE_SOURCE && <a href={QUOTE_SOURCE.href} target="_blank" rel="noreferrer">Read the original comment <LuArrowUpRight aria-hidden="true" /></a>}</div></div><span className="quote-stamp">FROM<br />THE THREADS</span></aside>
      </section>

      <section id="compensation" className="chapter dark-chapter" aria-labelledby="comp-title"><div className="page-width">
        <div className="chapter-heading"><span className="chapter-number">02 / BEYOND THE SALARY</span><span className="eyebrow">Read the whole offer.</span></div>
        <div className="comp-intro"><h2 id="comp-title">The big numbers<br />aren’t just <em>salaries.</em></h2><p>In U.S. reports with $300k+ total compensation, a median <strong>{Math.round(TOP_COMP.extraShare! * 100)}%</strong> comes from the gap above base pay. Stock, bonuses, and other extras belong in the comparison. They also come with different strings attached.</p></div>
        <Compensation records={RECORDS} />
        <div className="dark-endnote"><span aria-hidden="true">↳</span><p>The takeaway: compare base with base, and total with total. That spectacular number in the comments might include a very different kind of money.</p></div>
      </div></section>

      <section id="the-sample" className="chapter page-width" aria-labelledby="sample-title">
        <div className="chapter-heading"><span className="chapter-number">03 / WHO’S STILL POSTING?</span><span className="eyebrow">A trend line is only as good as its crowd.</span></div>
        <div className="chapter-split sample-layout"><div className="chapter-copy"><h2 id="sample-title">The 2024 dip<br />vanishes in the U.S.</h2><p>Across all locations, median base pay fell <strong>{DIP}% in 2024</strong>. Among U.S. reports? It stayed at <strong>$140k</strong>.</p><p>Change who you’re comparing and the downturn disappears. These are different people each year, not the same workers taking a pay cut.</p><div className="sample-pullout"><span className="eyebrow">AND THE LATEST “BOOM”?</span><strong>{TREND[5].n}<span> reports.</span></strong><p>That’s the usable base-pay sample behind 2025. In 2021 it was {TREND[1].n}. A bigger number from a smaller crowd deserves a second look.</p></div><a className="text-link" href="#methodology">How we handled the data <LuArrowDownRight aria-hidden="true" /></a></div><Participation records={RECORDS} /></div>
      </section>

      <section id="explore" className="chapter explorer-chapter" aria-labelledby="explore-title"><div className="page-width">
        <div className="chapter-heading"><span className="chapter-number">04 / FIND YOUR PEOPLE</span><span className="eyebrow">Your turn to interrogate the numbers.</span></div>
        <div className="explore-intro"><h2 id="explore-title">Less salary envy.<br /><em>Better comparisons.</em></h2><p>Choose a market. Narrow the role. Open the actual comment. The useful number is the one with context.</p></div>
        <Explorer records={RECORDS} />
      </div></section>

      <section id="methodology" className="methodology page-width" aria-labelledby="method-title">
        <div className="method-intro"><span className="chapter-number">THE SMALL PRINT, IN READABLE TYPE</span><h2 id="method-title">Receipts.<br />Not gospel.</h2><p>Enough evidence to ask better questions.<br />Not enough to price an entire profession.</p><a className="text-link" href="https://github.com/datawranglerai/reddit-data-science-salaries" target="_blank" rel="noreferrer">See the data pipeline <LuMoveUpRight aria-hidden="true" /></a></div>
        <div className="method-details">
          <details open><summary><span>01</span> Where the numbers come from</summary><div><p>{RECORDS.length} parsed records from the r/datascience end-of-year salary threads, 2020–2025. Original comments were scraped and fields extracted by an LLM. These are disclosures, not verified payslips or necessarily unique people. The bundled v3 dataset is a historical snapshot.</p><p>All {RECORDS.length} rows remain in the explorer. {BASE.n} supply usable annual base pay; {summarize(RECORDS, 'usdTotalComp').n} supply usable total compensation. Missing data is never replaced with zero.</p></div></details>
          <details><summary><span>02</span> What we count, and what we leave out</summary><div><p>We exclude ten reviewed records from annual-pay statistics: monthly pay (123, 185), hourly pay (195, 264, 482), per-course pay (360), ambiguous currency or annual basis (104, 456, 502), and an unclear internship pay period (596). We do not invent annual hours or correct ambiguous amounts.</p><p>Non-positive pay, missing or unsupported currencies, and totals below a valid base are excluded from their respective measures. Total-below-base records retain valid base pay. The explorer shows review notes and original figures. Other LLM extraction errors may remain.</p><p>Groups below 10 usable reports do not receive explorer summaries or percentiles. Percentiles describe these reports only. Career stages and role groups are inferred from titles and experience; inspect the original comment for nuance. Blank remote status means “not stated”.</p></div></details>
          <details><summary><span>03</span> Dollars, dates, and the compensation gap</summary><div><p>Figures are nominal annual USD equivalents using the project’s fixed rates: USD 1; GBP 1.27; CAD 0.74; EUR 1.08; INR 0.012; AUD 0.65; SGD 0.74; CHF 1.13. These are approximate constants, not current or year-specific exchange rates. No inflation, tax, or living-cost adjustment is applied.</p><p>The reporting year comes from the thread title, not the comment date. The compensation chapter uses U.S. rows with both positive base and total, with total at least base. For each person, the non-base share is (total − base) / total; the chart reports the median of those individual shares. The gap can include equity, cash bonuses, or one-off payments; it is not a stock-only measure.</p></div></details>
          <details><summary><span>04</span> What this sample cannot tell you</summary><div><p>Reddit posters choose whether to share. The sample skews toward the U.S., changes every year, and can include offers, internships, or unusual compensation packages. Comments can be inaccurate; extracted fields can be wrong. Medians do not remove selection bias.</p><p>Country comparisons mix roles, experience levels, and years. Compensation bands are defined by the outcome itself. Neither chart estimates a causal premium. An offer’s quality, the market’s direction, or what you “should” earn cannot be established from these threads alone.</p></div></details>
        </div>
      </section>
    </main>
    <footer className="footer page-width"><a className="wordmark" href="#"><img className="brand-mark" src={BRAND_MARK_URL} alt="" width="68" height="68" /> salary, <em>allegedly.</em></a><p>Read the numbers. Question the comparison.</p><div><a href="https://buymeacoffee.com/datawranglerai" target="_blank" rel="noreferrer">Buy the author a coffee ↗</a><a href="#">Back to top ↑</a></div></footer>
  </>;
}
