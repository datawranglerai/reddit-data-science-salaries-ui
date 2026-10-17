import { Fragment, useMemo, useState } from 'react';
import {
  EMPTY_FILTERS,
  MIN_COHORT,
  filterCohort,
  groupSalarySummaries,
  metricCoverage,
  money,
  percentileRank,
  recordsCSV,
  salaryDistribution,
  sourceLink,
  type EditorialRecord,
  type ExplorerFilters,
  type PayMetric,
  type SalaryBreakdown,
} from '../../utils/editorialData.ts';
import { ComparisonChart, DistributionChart } from './ExplorerCharts.tsx';
import './explorer.css';

const ROWS_PER_PAGE = 8;

type SortKey = 'title' | 'year' | 'usdSalary' | 'usdTotalComp';
type SortDirection = 'ascending' | 'descending';

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

function unique(values: Array<string | number | null | undefined>) {
  return [...new Set(values.filter((value): value is string | number => value !== null && value !== undefined && value !== ''))];
}

function compareRecords(left: EditorialRecord, right: EditorialRecord, sort: SortState) {
  const leftValue = left[sort.key];
  const rightValue = right[sort.key];
  if (leftValue === null || leftValue === undefined) return rightValue === null || rightValue === undefined ? 0 : 1;
  if (rightValue === null || rightValue === undefined) return -1;
  const result = typeof leftValue === 'number' && typeof rightValue === 'number'
    ? leftValue - rightValue
    : String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: 'base' });
  return sort.direction === 'ascending' ? result : -result;
}

function fieldValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text || 'Not stated';
}

const FILTER_LABELS: Record<keyof ExplorerFilters, string> = {
  country: 'Country',
  year: 'Year',
  role: 'Role',
  stage: 'Career stage',
  work: 'Work arrangement',
  search: 'Search',
};

export default function Explorer({ records }: { records: EditorialRecord[] }) {
  const [filters, setFilters] = useState<ExplorerFilters>(EMPTY_FILTERS);
  const [metric, setMetric] = useState<PayMetric>('usdSalary');
  const [breakdown, setBreakdown] = useState<SalaryBreakdown>('country');
  const [comparison, setComparison] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'usdSalary', direction: 'descending' });
  const [page, setPage] = useState(0);
  const [showAllGroups, setShowAllGroups] = useState(false);

  const countries = useMemo(() => unique(records.map((record) => record.country)).sort((a, b) => String(a).localeCompare(String(b))), [records]);
  const years = useMemo(() => unique(records.map((record) => record.year)).sort((a, b) => Number(b) - Number(a)), [records]);
  const roles = useMemo(() => unique(records.map((record) => record.roleType)).sort((a, b) => String(a).localeCompare(String(b))), [records]);
  const stages = useMemo(() => unique(records.map((record) => record.careerStage)).sort((a, b) => String(a).localeCompare(String(b))), [records]);
  const arrangements = useMemo(() => unique(records.map((record) => record.workArrangement)).sort((a, b) => String(a).localeCompare(String(b))), [records]);

  const cohort = useMemo(() => filterCohort(records, filters), [records, filters]);
  const coverage = useMemo(() => metricCoverage(cohort, metric), [cohort, metric]);
  const distribution = useMemo(() => salaryDistribution(cohort, metric), [cohort, metric]);
  const grouped = useMemo(() => groupSalarySummaries(cohort, metric, breakdown), [cohort, metric, breakdown]);
  const sorted = useMemo(() => [...cohort].sort((left, right) => compareRecords(left, right, sort)), [cohort, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = sorted.slice(safePage * ROWS_PER_PAGE, (safePage + 1) * ROWS_PER_PAGE);
  const visibleGroups = breakdown === 'year' || showAllGroups ? grouped.groups : grouped.groups.slice(0, 8);
  const comparisonValue = Number(comparison);
  const rank = comparison && Number.isFinite(comparisonValue) && comparisonValue > 0
    ? percentileRank(cohort, comparisonValue, metric)
    : null;
  const metricLabel = metric === 'usdSalary' ? 'base salary' : 'total compensation';
  const selectedReportGrammar = coverage.selectedCount === 1 ? 'report has' : 'reports have';
  const usableReportGrammar = coverage.usableCount === 1 ? 'report is' : 'reports are';
  const activeFilters = Object.entries(filters).filter((entry): entry is [keyof ExplorerFilters, string] => Boolean(entry[1]));

  function setFilter(key: keyof ExplorerFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
    setShowAllGroups(false);
  }

  function changeMetric(nextMetric: PayMetric) {
    setMetric(nextMetric);
    setComparison('');
  }

  function changeBreakdown(nextBreakdown: SalaryBreakdown) {
    setBreakdown(nextBreakdown);
    setShowAllGroups(false);
  }

  function resetView() {
    setFilters(EMPTY_FILTERS);
    setMetric('usdSalary');
    setBreakdown('country');
    setComparison('');
    setSort({ key: 'usdSalary', direction: 'descending' });
    setPage(0);
    setShowAllGroups(false);
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
    anchor.download = 'reddit-salary-reports.csv';
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <section id="explorer" className="explorer page-width" aria-label="Salary report explorer">
      <div className="explorer-toolbar">
        <fieldset className="choice-group metric-choice">
          <legend>Pay measure</legend>
          <label>
            <input type="radio" name="pay-metric" checked={metric === 'usdSalary'} onChange={() => changeMetric('usdSalary')} />
            <span>Base salary</span>
          </label>
          <label>
            <input type="radio" name="pay-metric" checked={metric === 'usdTotalComp'} onChange={() => changeMetric('usdTotalComp')} />
            <span>Total compensation</span>
          </label>
        </fieldset>

        <label className="primary-country">
          <span>Country</span>
          <select value={filters.country} onChange={(event) => setFilter('country', event.target.value)}>
            <option value="">All countries</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            <option value="Not stated">Not stated</option>
          </select>
        </label>
      </div>

      <div className="distribution-heading" aria-live="polite">
        <div>
          <h2>{metric === 'usdSalary' ? 'Base salary distribution' : 'Total compensation distribution'}</h2>
          <p>{coverage.usableCount.toLocaleString()} of {coverage.selectedCount.toLocaleString()} selected {selectedReportGrammar} usable {metricLabel}.</p>
        </div>
        {!filters.country && coverage.usUsableShare !== null && (
          <p className="coverage-note">
            <strong>{Math.round(coverage.usUsableShare * 100)}%</strong>
            <span>{coverage.usUsableCount.toLocaleString()} of {coverage.usableCount.toLocaleString()} usable {usableReportGrammar} from the U.S.</span>
          </p>
        )}
      </div>

      <DistributionChart distribution={distribution} metricLabel={metricLabel} />

      <p className="data-caveat">
        Self-reported Reddit sample. Approximate annual USD using fixed rates; no inflation, tax or living-cost adjustment.
      </p>

      <form className="refine" onSubmit={(event) => event.preventDefault()}>
        <div className="primary-refinements">
          <label className="filter-field">
            <span>Year</span>
            <select value={filters.year} onChange={(event) => setFilter('year', event.target.value)}>
              <option value="">All years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span>Role</span>
            <select value={filters.role} onChange={(event) => setFilter('role', event.target.value)}>
              <option value="">All roles</option>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>
        </div>

        <details className="more-filters">
          <summary>More filters</summary>
          <div>
            <label className="filter-field">
              <span>Career stage</span>
              <select value={filters.stage} onChange={(event) => setFilter('stage', event.target.value)}>
                <option value="">All stages</option>
                {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </label>
            <label className="filter-field">
              <span>Work arrangement</span>
              <select value={filters.work} onChange={(event) => setFilter('work', event.target.value)}>
                <option value="">Any arrangement</option>
                {arrangements.map((arrangement) => <option key={arrangement} value={arrangement}>{arrangement}</option>)}
              </select>
            </label>
            <label className="filter-field search-field">
              <span>Search title, industry, city or education</span>
              <input type="search" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Try fintech or PhD" />
            </label>
          </div>
        </details>

        <div className="filter-actions">
          <div className="active-filters" aria-label="Active filters">
            {activeFilters.map(([key, value]) => (
              <button key={key} type="button" onClick={() => setFilter(key, '')} aria-label={`Remove ${FILTER_LABELS[key]} filter: ${value}`}>
                <span>{FILTER_LABELS[key]}: {value}</span><span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
          <button className="reset-view" type="button" onClick={resetView}>Reset view</button>
        </div>
      </form>

      {cohort.length === 0 && (
        <div className="empty-state" role="status">
          <strong>No reports match this selection.</strong>
          <span>Remove a filter or reset the view to continue.</span>
          <button type="button" onClick={resetView}>Reset view</button>
        </div>
      )}

      <section className="comparison-section" aria-labelledby="comparison-title">
        <div className="section-heading">
          <div>
            <h2 id="comparison-title">Compare this selection</h2>
            <p>Every active filter stays applied.</p>
          </div>
          <fieldset className="choice-group breakdown-choice">
            <legend>Break down by</legend>
            {(['country', 'role', 'year'] as SalaryBreakdown[]).map((value) => (
              <label key={value}>
                <input type="radio" name="breakdown" checked={breakdown === value} onChange={() => changeBreakdown(value)} />
                <span>{value[0].toUpperCase() + value.slice(1)}</span>
              </label>
            ))}
          </fieldset>
        </div>

        <ComparisonChart
          groups={visibleGroups}
          metricLabel={metricLabel}
          dimension={breakdown}
          isSingleGroup={grouped.isSingleGroup}
        />

        {breakdown !== 'year' && grouped.groups.length > 8 && (
          <button className="show-all" type="button" onClick={() => setShowAllGroups((current) => !current)}>
            {showAllGroups ? 'Show fewer groups' : `Show all ${grouped.groups.length} groups`}
          </button>
        )}

        <details className="group-data">
          <summary>View comparison data</summary>
          <div className="table-scroll" role="region" aria-label={`${breakdown} comparison data`} tabIndex={0}>
            <table>
              <thead><tr><th scope="col">{breakdown}</th><th scope="col">Selected</th><th scope="col">Usable</th><th scope="col">Median</th><th scope="col">Middle 50%</th></tr></thead>
              <tbody>
                {grouped.groups.map((group) => (
                  <tr key={group.key}>
                    <th scope="row">{group.label}</th>
                    <td>{group.selectedCount}</td>
                    <td>{group.usableCount}</td>
                    <td>{group.summary ? money(group.summary.median, true) : 'Summary withheld'}</td>
                    <td>{group.summary ? `${money(group.summary.p25, true)}–${money(group.summary.p75, true)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <details className="salary-position">
        <summary>Compare a salary with these reports</summary>
        <div>
          <label htmlFor="salary-comparison">Annual {metricLabel} in USD</label>
          <span className="salary-input"><span aria-hidden="true">$</span><input id="salary-comparison" type="number" min="1" step="1000" inputMode="numeric" value={comparison} onChange={(event) => setComparison(event.target.value)} placeholder="125000" /></span>
          <div aria-live="polite">
            {!comparison ? <p>Enter a positive amount.</p> : distribution.usableCount < MIN_COHORT ? (
              <p>Position withheld: this selection needs at least {MIN_COHORT} usable reports.</p>
            ) : rank === null ? <p>Enter a positive amount.</p> : (
              <p><strong>{rank}%</strong> of these reports are strictly below {money(comparisonValue, true)}.</p>
            )}
          </div>
          <p>A position among these self-selected reports, not a market percentile. Ties do not count as lower.</p>
        </div>
      </details>

      <section id="reports" className="reports-section" aria-labelledby="reports-title">
        <div className="section-heading reports-heading">
          <div><h2 id="reports-title">Reports</h2><p>{cohort.length.toLocaleString()} selected source {cohort.length === 1 ? 'record' : 'records'}</p></div>
          <button type="button" onClick={downloadCSV}>Download filtered CSV</button>
        </div>

        <div className="table-scroll reports-table-scroll" role="region" aria-label="Selected salary reports" tabIndex={0}>
          <table className="reports-table">
            <thead>
              <tr>
                <th scope="col" aria-sort={sort.key === 'title' ? sort.direction : 'none'}><button type="button" onClick={() => changeSort('title')}>Title <span aria-hidden="true">{sort.key === 'title' ? (sort.direction === 'ascending' ? '↑' : '↓') : '↕'}</span></button></th>
                <th scope="col" aria-sort={sort.key === 'year' ? sort.direction : 'none'}><button type="button" onClick={() => changeSort('year')}>Year <span aria-hidden="true">{sort.key === 'year' ? (sort.direction === 'ascending' ? '↑' : '↓') : '↕'}</span></button></th>
                <th scope="col">Country</th><th scope="col">Stage</th><th scope="col">Work</th>
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
                      <td>{record.year || '—'}</td><td>{fieldValue(record.country)}</td><td>{fieldValue(record.careerStage)}</td><td>{record.workArrangement}</td>
                      <td>{money(record.usdSalary, true)}</td><td>{money(record.usdTotalComp, true)}</td>
                    </tr>
                    <tr className="source-row">
                      <td colSpan={7}>
                        <details>
                          <summary>Inspect source report</summary>
                          <div className="source-detail">
                            <div><h3>Original comment</h3><p>{record.original_body?.trim() || 'Original comment text is unavailable in this export.'}</p></div>
                            <dl>
                              <div><dt>Record ID</dt><dd>{record.id}</dd></div><div><dt>Source base</dt><dd>{fieldValue(record.salary)}</dd></div>
                              <div><dt>Source total</dt><dd>{fieldValue(record.total_comp)}</dd></div><div><dt>Currency</dt><dd>{fieldValue(record.currency)}</dd></div>
                              <div><dt>Salary post</dt><dd>{fieldValue(record.is_salary_post)}</dd></div><div><dt>Remote field</dt><dd>{fieldValue(record.is_remote)}</dd></div>
                              <div><dt>Internship</dt><dd>{fieldValue(record.had_internship)}</dd></div><div><dt>Co-op</dt><dd>{fieldValue(record.had_coop)}</dd></div>
                              <div><dt>Review note</dt><dd>{record.qualityNote || 'No manual exclusion flag'}</dd></div>
                            </dl>
                            {link ? <a href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a> : <p>No verified Reddit link in this record.</p>}
                          </div>
                        </details>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
              {visibleRows.length === 0 && <tr><td colSpan={7}>No source records match this selection.</td></tr>}
            </tbody>
          </table>
        </div>

        <nav className="pagination" aria-label="Salary report pages">
          <button type="button" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>Previous</button>
          <span>Page {safePage + 1} of {pageCount}</span>
          <button type="button" onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage === pageCount - 1}>Next</button>
        </nav>
      </section>
    </section>
  );
}
