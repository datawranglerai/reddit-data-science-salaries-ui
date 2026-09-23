import { useState } from 'react';
import type { EditorialRecord, PayMetric } from '../../utils/editorialData';
import { compensationSummary, MIN_COHORT, money, pairedRecords, summarize, validPay, yearlySummary } from '../../utils/editorialData';

function Segments<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <div className="segments" role="group" aria-label={label}>{options.map((option) => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}

export function Distribution({ records }: { records: EditorialRecord[] }) {
  const [metric, setMetric] = useState<PayMetric>('usdSalary');
  const [scope, setScope] = useState('all');
  const cohort = records.filter((r) => scope === 'all' || r.country === 'United States');
  const stats = summarize(cohort, metric);
  const bins = Array.from({ length: 46 }, () => [] as EditorialRecord[]);
  cohort.forEach((r) => { if (validPay(r[metric])) bins[Math.min(45, Math.floor(r[metric]! / 10000))].push(r); });
  const peak = Math.max(...bins.map((bin) => Math.ceil(bin.length / 2)), 1);
  const dotStep = Math.min(7, 168 / peak);
  const x = (amount: number) => 20 + Math.min(amount, 450000) / 450000 * 610;
  const overflow = bins[45].length;
  return <figure className="distribution">
    <div className="figure-heading"><span className="eyebrow">Every dot is a disclosure</span><span className="figure-index">FIG. 01</span></div>
    <div className="distribution-controls"><Segments label="Distribution pay measure" value={metric} options={[{ value: 'usdSalary', label: 'Base pay' }, { value: 'usdTotalComp', label: 'Total comp' }]} onChange={setMetric} /><Segments label="Distribution location" value={scope} options={[{ value: 'all', label: 'All locations' }, { value: 'us', label: 'U.S. only' }]} onChange={setScope} /></div>
    <div className="distribution-stat" aria-live="polite"><strong>{money(stats.median)}</strong><span>median {metric === 'usdSalary' ? 'base salary' : 'total compensation'}<br /><b>{stats.n} usable reports · 2020–2025</b></span></div>
    <svg className="distribution-svg" viewBox="0 0 660 250" role="img" aria-label={`${stats.n} ${metric === 'usdSalary' ? 'base salaries' : 'total compensation reports'}. Median ${money(stats.median)}. The middle 80 percent spans ${money(stats.p10)} to ${money(stats.p90)}. Last bin contains values at or above $450,000.`}>
      {[0, 100000, 200000, 300000, 450000].map((tick) => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1="18" y2="213" className="chart-grid" /><text x={x(tick)} y="238" textAnchor={tick === 0 ? 'start' : tick === 450000 ? 'end' : 'middle'} className="axis-label">{tick === 450000 ? '$450k+' : money(tick)}</text></g>)}
      {bins.map((bin, i) => bin.map((r, j) => <circle key={r.id} cx={20 + i / 45 * 610 + (j % 2 ? 3 : -3)} cy={207 - Math.floor(j / 2) * dotStep} r={Math.min(2.6, dotStep / 2.3)} className={r[metric]! >= stats.median! ? 'salary-dot upper' : 'salary-dot'}><title>{r.title || 'Title not stated'} · {r.country || 'Location not stated'} · {r.year} · {money(r[metric], true)}</title></circle>))}
      <line x1={x(stats.median!)} x2={x(stats.median!)} y1="12" y2="215" className="median-line" />
      <text x={x(stats.median!) + 9} y="23" className="median-label">THE MIDDLE</text>
    </svg>
    <figcaption className="distribution-caption"><span><i className="legend-dot" />1 dot = 1 report · $10k bins</span><span>Annual USD equivalent{overflow > 0 ? ` · ${overflow} in $450k+ bin` : ''}</span></figcaption>
    <div className="distribution-takeaway" aria-live="polite"><span className="eyebrow">The middle 80%</span><strong>{money(stats.p10)} <span>—</span> {money(stats.p90)}</strong><p>One median hides a lot of different lives.</p></div>
  </figure>;
}

export function Geography({ records }: { records: EditorialRecord[] }) {
  const [role, setRole] = useState('all');
  const [selected, setSelected] = useState('United States');
  const cohort = role === 'all' ? records : records.filter((r) => r.roleType === 'Data Scientist');
  const countries = ['United States', 'Canada', 'United Kingdom', 'Germany'];
  const rows = countries.map((country) => ({ country, ...summarize(cohort.filter((r) => r.country === country)) }));
  const active = rows.find((r) => r.country === selected)!;
  const max = 250000;
  return <figure className="geography-chart">
    <div className="figure-heading"><span className="eyebrow">Base salary, by country</span><span className="figure-index">FIG. 02</span></div>
    <div className="chart-toolbar"><Segments label="Country comparison roles" value={role} options={[{ value: 'all', label: 'All roles' }, { value: 'ds', label: 'Data scientists' }]} onChange={setRole} /><span className="small-note">2020–2025 · USD</span></div>
    <div className="country-chart-axis"><span>$0</span><span>$125k</span><span>$250k</span></div>
    <div className="country-rows">{rows.map((row) => <button type="button" key={row.country} aria-pressed={selected === row.country} className={`country-row ${selected === row.country ? 'is-selected' : ''}`} onClick={() => setSelected(row.country)}>
      <span className="country-label">{row.country}<small>n = {row.n}{row.n < MIN_COHORT ? ' · small sample' : ''}</small></span>
      <span className="country-track">{row.n >= MIN_COHORT ? <><span className="country-whisker" style={{ left: `${row.p10! / max * 100}%`, width: `${(row.p90! - row.p10!) / max * 100}%` }} /><span className="country-iqr" style={{ left: `${row.p25! / max * 100}%`, width: `${(row.p75! - row.p25!) / max * 100}%` }} /><span className="country-median" style={{ left: `${row.median! / max * 100}%` }} /></> : <span className="country-suppressed">Too few reports to summarise</span>}</span>
      <strong className="country-value">{row.n >= MIN_COHORT ? money(row.median) : '—'}</strong>
    </button>)}</div>
    <div className="range-legend"><span><i className="range-line" />Middle 80%</span><span><i className="range-box" />Middle 50%</span><span><i className="range-median" />Median</span></div>
    <figcaption className="country-inspector" aria-live="polite"><span className="eyebrow">{active.country} / {role === 'ds' ? 'Data scientists' : 'All roles'}</span><p>{active.n >= MIN_COHORT ? <>Half of these {active.n} reports fall between <strong>{money(active.p25)}</strong> and <strong>{money(active.p75)}</strong>.</> : <>Only {active.n} usable reports. The rows are available in the explorer; a summary would overstate this sample.</>}</p></figcaption>
    <p className="chart-footnote">Select a country to inspect its range. Nominal pay, approximate fixed FX; no adjustment for taxes, living costs, year, or seniority. Groups under 10 are suppressed.</p>
  </figure>;
}

const COMP_BANDS = [
  { label: 'Under $200k', short: '< $200k', min: 0, max: 200000 },
  { label: '$200–299k', short: '$200–299k', min: 200000, max: 300000 },
  { label: '$300k and up', short: '$300k+', min: 300000, max: Infinity },
];

export function Compensation({ records }: { records: EditorialRecord[] }) {
  const [selected, setSelected] = useState(2);
  const pairs = pairedRecords(records.filter((r) => r.country === 'United States'));
  const bands = COMP_BANDS.map((band) => ({ ...band, ...compensationSummary(pairs.filter((r) => r.usdTotalComp! >= band.min && r.usdTotalComp! < band.max)) }));
  const active = bands[selected];
  return <div className="comp-content">
    <figure className="comp-chart">
      <div className="figure-heading"><span className="eyebrow">What the package is made of</span><span className="figure-index">FIG. 03</span></div>
      <p className="comp-chart-subtitle">U.S. reports, grouped by total compensation</p>
      <div className="comp-legend"><span><i />Base salary</span><span><i />Everything beyond base</span></div>
      <div className="comp-bars">{bands.map((band, index) => <button type="button" key={band.label} className={`comp-row ${selected === index ? 'is-selected' : ''}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <span className="comp-row-title">{band.label}<small>{band.n} paired reports</small></span>
        <span className="comp-track"><span className="comp-base" style={{ width: `${(1 - band.extraShare!) * 100}%` }}>{Math.round((1 - band.extraShare!) * 100)}%</span><span className="comp-extra" style={{ width: `${band.extraShare! * 100}%` }}><b>{Math.round(band.extraShare! * 100)}%</b></span></span>
        <span className="comp-row-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
      <figcaption className="chart-footnote">Median of each person’s non-base share, not the difference between two medians. Includes only reports with both figures and total ≥ base. Select a band.</figcaption>
    </figure>
    <div className="comp-receipt" aria-live="polite"><span className="eyebrow">Inside the {active.short} package</span><div className="comp-big">{Math.round(active.extraShare! * 100)}<span>%</span></div><p>of compensation sits<br /><em>outside the salary.</em></p><dl><div><dt>Median base</dt><dd>{money(active.base)}</dd></div><div><dt>Median total</dt><dd>{money(active.total)}</dd></div><div><dt>Median person’s gap</dt><dd>{money(active.extra)}</dd></div></dl><span className="receipt-note">{active.n} U.S. reports · 2020–2025</span></div>
  </div>;
}

export function Participation({ records }: { records: EditorialRecord[] }) {
  const [scope, setScope] = useState('all');
  const all = yearlySummary(records);
  const us = yearlySummary(records.filter((r) => r.country === 'United States'));
  const selected = scope === 'all' ? all : us;
  const x = (i: number) => 60 + i * 106;
  const y = (pay: number) => 250 - (pay - 80000) / 100000 * 210;
  const path = (series: typeof all) => series.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p.median!)}`).join(' ');
  return <figure className="participation-chart">
    <div className="figure-heading"><span className="eyebrow">Same threads. Change the cohort.</span><span className="figure-index">FIG. 04</span></div>
    <div className="chart-toolbar"><Segments label="Trend cohort" value={scope} options={[{ value: 'all', label: 'All locations' }, { value: 'us', label: 'U.S. only' }]} onChange={setScope} /><span className="small-note">Median annual base · USD</span></div>
    <svg viewBox="0 0 660 324" className="trend-svg" role="img" aria-label={`All-location median base fell from ${money(all[3].median, true)} in 2023 to ${money(all[4].median, true)} in 2024. The U.S. medians were ${money(us[3].median, true)} and ${money(us[4].median, true)} respectively. Yearly values and counts are listed below.`}>
      {[100000, 125000, 150000, 175000].map((tick) => <g key={tick}><line x1="60" x2="600" y1={y(tick)} y2={y(tick)} className="chart-grid" /><text x="43" y={y(tick) + 4} textAnchor="end" className="axis-label">{money(tick)}</text></g>)}
      <rect x={x(3) - 18} width="142" y="24" height="257" className="trend-highlight" />
      <path d={path(all)} fill="none" className={`trend-line all ${scope === 'all' ? 'active' : ''}`} />
      <path d={path(us)} fill="none" className={`trend-line us ${scope === 'us' ? 'active' : ''}`} />
      {[{ data: all, key: 'all' }, { data: us, key: 'us' }].map(({ data, key }) => data.map((p, i) => <circle key={`${key}-${p.year}`} cx={x(i)} cy={y(p.median!)} r={key === scope ? 5 : 3} className={`trend-point ${key} ${key === scope ? 'active' : ''}`}><title>{key === 'us' ? 'U.S.' : 'All locations'} {p.year}: {money(p.median, true)}, n={p.n}</title></circle>))}
      {selected.map((p, i) => <g key={p.year}><text x={x(i)} y={y(p.median!) - 15} textAnchor="middle" className={`trend-value ${scope}`}>{money(p.median)}</text><text x={x(i)} y="309" textAnchor="middle" className="axis-label">{p.year}</text></g>)}
      <text x={x(3) + 53} y="46" textAnchor="middle" className="annotation-label">WATCH 2024</text>
    </svg>
    <div className="trend-legend"><span className={scope === 'all' ? 'selected' : ''}><i />All locations</span><span className={scope === 'us' ? 'selected' : ''}><i />U.S. only</span><span>Vertical scale starts at $80k</span></div>
    <div className="sample-strip"><span className="eyebrow">Who’s behind the line?</span><span>Usable base reports per year</span></div>
    <div className="sample-bars" aria-live="polite">{selected.map((p) => <div key={p.year}><strong>{p.n}</strong><span style={{ height: `${p.n / 133 * 64}px` }} /><small>{p.year}</small></div>)}</div>
    <details className="chart-data"><summary>Read the chart as a table</summary><table><caption>Annual base salary medians, {scope === 'all' ? 'all locations' : 'United States'}</caption><thead><tr><th>Year</th><th>Usable reports</th><th>Median</th></tr></thead><tbody>{selected.map((p) => <tr key={p.year}><th scope="row">{p.year}</th><td>{p.n}</td><td>{money(p.median, true)}</td></tr>)}</tbody></table></details>
    <figcaption className="chart-footnote">Different respondents each year; this is not a panel. Figures are nominal, not inflation-adjusted. The 2025 slice has {all[5].n} usable base reports, versus {all[1].n} in 2021.</figcaption>
  </figure>;
}
