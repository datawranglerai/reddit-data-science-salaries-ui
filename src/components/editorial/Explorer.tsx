import { Fragment, useMemo, useState } from 'react';
import {
  filterCohort,
  MIN_COHORT,
  money,
  payValues,
  percentileRank,
  recordsCSV,
  sourceLink,
  summarize,
  type EditorialRecord,
  type ExplorerFilters,
  type PayMetric,
} from '../../utils/editorialData.ts';
import './explorer.css';

const ROWS_PER_PAGE = 8;
const DEFAULT_FILTERS: ExplorerFilters = {
  country: 'United States',
  year: '',
  role: '',
  stage: '',
  work: '',
  search: '',
};

type SortKey = 'title' | 'year' | 'usdSalary' | 'usdTotalComp';
type SortDirection = 'ascending' | 'descending';

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

interface HistogramBin {
  from: number;
  to: number;
  count: number;
}

function unique(values: Array<string | number | null | undefined>) {
  return [...new Set(values.filter((value): value is string | number => value !== null && value !== undefined && value !== ''))];
}

function histogram(values: number[], binCount = 12): HistogramBin[] {
  if (!values.length) return [];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) return [{ from: minimum, to: maximum, count: values.length }];
  const width = (maximum - minimum) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    from: minimum + index * width,
    to: minimum + (index + 1) * width,
    count: 0,
  }));
  values.forEach((value) => {
    const index = Math.min(Math.floor((value - minimum) / width), binCount - 1);
    bins[index].count += 1;
  });
  return bins;
}

function compareRecords(a: EditorialRecord, b: EditorialRecord, sort: SortState) {
  const aValue = a[sort.key];
  const bValue = b[sort.key];
  if (aValue === null || aValue === undefined) return bValue === null || bValue === undefined ? 0 : 1;
  if (bValue === null || bValue === undefined) return -1;
  let result = 0;
  if (typeof aValue === 'number' && typeof bValue === 'number') result = aValue - bValue;
  else result = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
  return sort.direction === 'ascending' ? result : -result;
}

function fieldValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text || 'Not stated';
}

export default function Explorer({ records }: { records: EditorialRecord[] }) {
  const [filters, setFilters] = useState<ExplorerFilters>(DEFAULT_FILTERS);
  const [metric, setMetric] = useState<PayMetric>('usdSalary');
  const [comparison, setComparison] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'usdSalary', direction: 'descending' });
  const [page, setPage] = useState(0);

  const countries = useMemo(() => unique(records.map((record) => record.country)).sort((a, b) => String(a).localeCompare(String(b))), [records]);
  const years = useMemo(() => unique(records.map((record) => record.year)).sort((a, b) => Number(b) - Number(a)), [records]);
  const roles = useMemo(() => unique(records.map((record) => record.roleType)).sort(), [records]);
  const stages = useMemo(() => unique(records.map((record) => record.careerStage)).sort(), [records]);
  const arrangements = useMemo(() => unique(records.map((record) => record.workArrangement)).sort(), [records]);

  const cohort = useMemo(() => filterCohort(records, filters), [records, filters]);
  const stats = useMemo(() => summarize(cohort, metric), [cohort, metric]);
  const values = useMemo(() => payValues(cohort, metric), [cohort, metric]);
  const bins = useMemo(() => histogram(values), [values]);
  const sorted = useMemo(() => [...cohort].sort((a, b) => compareRecords(a, b, sort)), [cohort, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = sorted.slice(safePage * ROWS_PER_PAGE, (safePage + 1) * ROWS_PER_PAGE);
  const comparisonValue = Number(comparison);
  const rank = comparison && Number.isFinite(comparisonValue) && comparisonValue > 0
    ? percentileRank(cohort, comparisonValue, metric)
    : null;
  const metricLabel = metric === 'usdSalary' ? 'base salary' : 'total compensation';

  function updateFilter(key: keyof ExplorerFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
    setMetric('usdSalary');
    setComparison('');
    setPage(0);
  }

  function changeSort(key: SortKey) {
    setSort((current) => current.key === key
      ? { key, direction: current.direction === 'ascending' ? 'descending' : 'ascending' }
      : { key, direction: key === 'title' ? 'ascending' : 'descending' });
    setPage(0);
  }

  function downloadCSV() {
    const blob = new Blob([recordsCSV(cohort)], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'reddit-salary-cohort.csv';
    anchor.click();
    URL.revokeObjectURL(href);
  }

  const maxBin = Math.max(1, ...bins.map((bin) => bin.count));

  return (
    <section className="explorer" aria-label="Salary report explorer">
      <div className="ex-intro">
        <p className="ex-kicker">Build a fairer comparison</p>
        <p>Slice the disclosures, check the sample, then open the source comments behind the numbers.</p>
      </div>

      <form className="ex-filters" onSubmit={(event) => event.preventDefault()}>
        <label className="ex-field">
          <span>Country</span>
          <select value={filters.country} onChange={(event) => updateFilter('country', event.target.value)}>
            <option value="">All countries</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            <option value="Not stated">Not stated</option>
          </select>
        </label>
        <label className="ex-field">
          <span>Year</span>
          <select value={filters.year} onChange={(event) => updateFilter('year', event.target.value)}>
            <option value="">All years</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label className="ex-field">
          <span>Role</span>
          <select value={filters.role} onChange={(event) => updateFilter('role', event.target.value)}>
            <option value="">All roles</option>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </label>
        <label className="ex-field">
          <span>Career stage</span>
          <select value={filters.stage} onChange={(event) => updateFilter('stage', event.target.value)}>
            <option value="">All stages</option>
            {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
        </label>
        <label className="ex-field">
          <span>Work arrangement</span>
          <select value={filters.work} onChange={(event) => updateFilter('work', event.target.value)}>
            <option value="">Any arrangement</option>
            {arrangements.map((arrangement) => <option key={arrangement} value={arrangement}>{arrangement}</option>)}
          </select>
        </label>
        <label className="ex-field ex-search">
          <span>Search title, industry, city or education</span>
          <input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Try fintech or PhD" />
        </label>
        <button className="ex-reset" type="button" onClick={reset}>Reset filters</button>
      </form>

      {cohort.length === 0 ? (
        <div className="ex-empty" role="status">
          <h3>No disclosures match that combination.</h3>
          <p>Broaden one or more filters to bring the evidence back into view.</p>
          <button type="button" onClick={reset}>Reset to United States</button>
        </div>
      ) : (
        <>
          <div className="ex-analysis">
            <div className="ex-metric-block">
              <fieldset className="ex-metric-picker">
                <legend>Pay measure</legend>
                <label>
                  <input type="radio" name="pay-metric" checked={metric === 'usdSalary'} onChange={() => setMetric('usdSalary')} />
                  Base salary
                </label>
                <label>
                  <input type="radio" name="pay-metric" checked={metric === 'usdTotalComp'} onChange={() => setMetric('usdTotalComp')} />
                  Total compensation
                </label>
              </fieldset>

              <div className="ex-stats" aria-live="polite">
                <div><span>Reports with {metricLabel}</span><strong>{stats.n.toLocaleString()}</strong></div>
                <div><span>Median</span><strong>{stats.n >= MIN_COHORT ? money(stats.median, true) : 'Suppressed'}</strong></div>
                <div><span>Middle 50%</span><strong>{stats.n >= MIN_COHORT ? `${money(stats.p25, true)}–${money(stats.p75, true)}` : 'Suppressed'}</strong></div>
              </div>
              {stats.n < MIN_COHORT && (
                <p className="ex-small-sample">Fewer than {MIN_COHORT} usable pay reports. Individual rows remain visible, but summary claims are withheld.</p>
              )}
            </div>

            <figure className="ex-histogram">
              <figcaption>
                <strong>Every bar is a count of reports</strong>
                <span>{stats.n.toLocaleString()} usable {metricLabel} disclosures in this cohort</span>
              </figcaption>
              {bins.length ? (
                <>
                  <svg viewBox="0 0 720 230" role="img" aria-labelledby="ex-hist-title ex-hist-desc" preserveAspectRatio="none">
                    <title id="ex-hist-title">Distribution of reported {metricLabel}</title>
                    <desc id="ex-hist-desc">A histogram of {stats.n} reports from {money(bins[0].from, true)} to {money(bins[bins.length - 1].to, true)}. The largest bin contains {maxBin} reports.</desc>
                    <line x1="18" y1="198" x2="702" y2="198" className="ex-axis" />
                    {bins.map((bin, index) => {
                      const slot = 684 / bins.length;
                      const height = bin.count / maxBin * 164;
                      return (
                        <g key={`${bin.from}-${bin.to}`}>
                          <rect x={18 + index * slot + 2} y={198 - height} width={Math.max(2, slot - 4)} height={height} className="ex-bar">
                            <title>{money(bin.from, true)} to {money(bin.to, true)}: {bin.count} reports</title>
                          </rect>
                          <text x={18 + index * slot + slot / 2} y={190 - height} textAnchor="middle" className="ex-bar-count">{bin.count || ''}</text>
                        </g>
                      );
                    })}
                  </svg>
                  <div className="ex-hist-scale" aria-hidden="true"><span>{money(bins[0].from)}</span><span>{money(bins[bins.length - 1].to)}</span></div>
                </>
              ) : <p className="ex-no-pay">No usable {metricLabel} values in this slice.</p>}
            </figure>

            <div className="ex-comparison">
              <label htmlFor="ex-salary-comparison">Where does a salary land?</label>
              <div className="ex-comparison-input">
                <span aria-hidden="true">$</span>
                <input id="ex-salary-comparison" type="number" min="1" step="1000" inputMode="numeric" value={comparison} onChange={(event) => setComparison(event.target.value)} placeholder="125000" />
              </div>
              <div className="ex-rank" aria-live="polite">
                {!comparison ? <p>Enter annual USD {metricLabel}.</p> : stats.n < MIN_COHORT ? (
                  <p>Percentile withheld: this slice needs at least {MIN_COHORT} usable reports.</p>
                ) : rank === null ? <p>Enter a positive salary.</p> : (
                  <p><strong>{rank}%</strong> of this cohort reported strictly less than {money(comparisonValue, true)}.</p>
                )}
              </div>
              <p className="ex-caveat">A position among self-selected Reddit disclosures, not a market percentile. Ties are not counted as lower.</p>
            </div>
          </div>

          <div className="ex-records-head">
            <div>
              <p className="ex-kicker">The receipts</p>
              <h3>{cohort.length.toLocaleString()} filtered disclosures</h3>
            </div>
            <button type="button" onClick={downloadCSV}>Download filtered CSV</button>
          </div>

          <div className="ex-table-wrap" role="region" aria-label="Filtered salary disclosures" tabIndex={0}>
            <table className="ex-table">
              <thead>
                <tr>
                  <th scope="col" aria-sort={sort.key === 'title' ? sort.direction : 'none'}><button type="button" onClick={() => changeSort('title')}>Title <span aria-hidden="true">{sort.key === 'title' ? (sort.direction === 'ascending' ? '↑' : '↓') : '↕'}</span></button></th>
                  <th scope="col" aria-sort={sort.key === 'year' ? sort.direction : 'none'}><button type="button" onClick={() => changeSort('year')}>Year <span aria-hidden="true">{sort.key === 'year' ? (sort.direction === 'ascending' ? '↑' : '↓') : '↕'}</span></button></th>
                  <th scope="col">Country</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Work</th>
                  <th scope="col" aria-sort={sort.key === 'usdSalary' ? sort.direction : 'none'}><button type="button" onClick={() => changeSort('usdSalary')}>Base <span aria-hidden="true">{sort.key === 'usdSalary' ? (sort.direction === 'ascending' ? '↑' : '↓') : '↕'}</span></button></th>
                  <th scope="col" aria-sort={sort.key === 'usdTotalComp' ? sort.direction : 'none'}><button type="button" onClick={() => changeSort('usdTotalComp')}>Total <span aria-hidden="true">{sort.key === 'usdTotalComp' ? (sort.direction === 'ascending' ? '↑' : '↓') : '↕'}</span></button></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((record) => {
                  const link = sourceLink(record);
                  return (
                    <Fragment key={record.id}>
                      <tr>
                        <td><strong>{fieldValue(record.title)}</strong><small>{fieldValue(record.company_industry)}</small></td>
                        <td>{record.year || '—'}</td>
                        <td>{fieldValue(record.country)}</td>
                        <td>{fieldValue(record.careerStage)}</td>
                        <td>{record.workArrangement}</td>
                        <td>{money(record.usdSalary, true)}</td>
                        <td>{money(record.usdTotalComp, true)}</td>
                      </tr>
                      <tr className="ex-source-row">
                        <td colSpan={7}>
                          <details>
                            <summary>Inspect source disclosure</summary>
                            <div className="ex-source-detail">
                              <div>
                                <h4>Original comment</h4>
                                <p className="ex-original">{record.original_body?.trim() || 'Original comment text is unavailable in this export.'}</p>
                              </div>
                              <dl>
                                <div><dt>Record ID</dt><dd>{record.id}</dd></div>
                                <div><dt>Source base</dt><dd>{fieldValue(record.salary)}</dd></div>
                                <div><dt>Source total</dt><dd>{fieldValue(record.total_comp)}</dd></div>
                                <div><dt>Currency</dt><dd>{fieldValue(record.currency)}</dd></div>
                                <div><dt>Salary post</dt><dd>{fieldValue(record.is_salary_post)}</dd></div>
                                <div><dt>Remote field</dt><dd>{fieldValue(record.is_remote)}</dd></div>
                                <div><dt>Internship</dt><dd>{fieldValue(record.had_internship)}</dd></div>
                                <div><dt>Co-op</dt><dd>{fieldValue(record.had_coop)}</dd></div>
                                <div><dt>Review note</dt><dd>{record.qualityNote || 'No manual exclusion flag'}</dd></div>
                              </dl>
                              {link ? <a href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a> : <p className="ex-link-missing">No verified Reddit link in this record.</p>}
                            </div>
                          </details>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <nav className="ex-pagination" aria-label="Salary disclosure pages">
            <button type="button" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>Previous</button>
            <span>Page {safePage + 1} of {pageCount}</span>
            <button type="button" onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage === pageCount - 1}>Next</button>
          </nav>
        </>
      )}
    </section>
  );
}
