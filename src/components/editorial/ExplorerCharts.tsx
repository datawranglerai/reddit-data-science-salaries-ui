import {
  DISTRIBUTION_LIMIT,
  money,
  type GroupedSalaryRow,
  type SalaryBreakdown,
  type SalaryDistribution,
} from '../../utils/editorialData.ts';

export interface DistributionChartProps {
  distribution: SalaryDistribution;
  metricLabel: string;
}

export function DistributionChart({ distribution, metricLabel }: DistributionChartProps) {
  const plotWidth = 600;
  const plotHeight = 220;
  const slotWidth = plotWidth / distribution.bins.length;
  const summary = distribution.supportedSummary;
  const medianX = summary ? summary.median / DISTRIBUTION_LIMIT * plotWidth : 0;
  const binCounts = distribution.bins.map((bin) => bin.count).join(', ');
  const summaryDescription = summary
    ? ` Median ${money(summary.median, true)}; middle 50% ${money(summary.p25, true)} to ${money(summary.p75, true)}.${distribution.medianInRegularDomain ? '' : ' The median is outside the plotted regular range.'}`
    : '';
  const usableReportNoun = distribution.usableCount === 1 ? 'report' : 'reports';
  const allTailSubject = distribution.usableCount === 1
    ? 'The 1 usable report is'
    : `All ${distribution.usableCount.toLocaleString()} usable reports are`;
  const tailReportNoun = distribution.tailCount === 1 ? 'report' : 'reports';
  const tailReportVerb = distribution.tailCount === 1 ? 'is' : 'are';
  const tailDescription = distribution.tailMax === null
    ? ' No reports are at or above $500,000.'
    : ` ${distribution.tailCount} ${tailReportNoun} ${tailReportVerb} at or above $500,000; maximum ${money(distribution.tailMax, true)}.`;
  const chartDescription = distribution.usableCount === 0
    ? `No selected reports have usable ${metricLabel}. The regular domain is $0 to under $500,000 in 20 $25,000 bins.`
    : `${distribution.usableCount} usable ${usableReportNoun}. Regular domain $0 to under $500,000 in 20 $25,000 bins. Bin counts: ${binCounts}.${tailDescription}${summaryDescription}`;
  const offScaleMedian = summary !== null && !distribution.medianInRegularDomain;

  return (
    <figure className="distribution-chart">
      <div className="plot-and-tail">
        <div className="plot-region">
          <div className="plot-y-labels" aria-hidden="true">
            <span>{distribution.regularPeak}</span><span>Reports</span><span>0</span>
          </div>
          <div className="plot-column">
            <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} role="img" aria-label={chartDescription} preserveAspectRatio="none">
              <line className="plot-baseline" x1="0" y1={plotHeight} x2={plotWidth} y2={plotHeight} />
              {distribution.bins.map((bin, index) => {
                const height = bin.count / distribution.regularScaleMax * (plotHeight - 4);
                return (
                  <rect
                    className="distribution-bar"
                    key={bin.lowerBound}
                    x={index * slotWidth + 1}
                    y={plotHeight - height}
                    width={Math.max(0, slotWidth - 2)}
                    height={height}
                  />
                );
              })}
              {distribution.medianInRegularDomain && (
                <line className="median-marker" x1={medianX} y1="0" x2={medianX} y2={plotHeight} />
              )}
            </svg>
            <div className="plot-axis" aria-hidden="true"><span>$0</span><span>$250k</span><span>$500k</span></div>
          </div>
        </div>

        <aside className="tail-summary" aria-label="Reports at or above $500,000">
          <span>At least $500k</span>
          <strong>{distribution.tailCount.toLocaleString()}</strong>
          {distribution.tailMax !== null && <p>Maximum {money(distribution.tailMax, true)}</p>}
          {offScaleMedian && <p>Median {money(summary.median, true)} is outside the plotted range.</p>}
        </aside>
      </div>

      <figcaption className="distribution-summary" aria-live="polite">
        {distribution.usableCount === 0 ? (
          <p>No usable {metricLabel} values in this selection.</p>
        ) : distribution.allInTail ? (
          <p>{allTailSubject} ≥$500k. No usable reports are below $500k.</p>
        ) : null}
        {summary ? (
          <dl>
            <div><dt>Median</dt><dd>{money(summary.median, true)}</dd></div>
            <div><dt>Middle 50%</dt><dd>{money(summary.p25, true)}–{money(summary.p75, true)}</dd></div>
          </dl>
        ) : distribution.usableCount > 0 ? (
          <p>Small sample: {distribution.usableCount.toLocaleString()} usable {usableReportNoun}. Summary withheld.</p>
        ) : null}
      </figcaption>

      <details className="chart-data">
        <summary>View chart data</summary>
        <div className="chart-data-scroll">
          <table>
            <caption>Counts for the {metricLabel} distribution</caption>
            <thead><tr><th scope="col">Range</th><th scope="col">Reports</th></tr></thead>
            <tbody>
              {distribution.bins.map((bin) => (
                <tr key={bin.lowerBound}>
                  <th scope="row">{money(bin.lowerBound, true)} to under {money(bin.upperBound, true)}</th>
                  <td>{bin.count}</td>
                </tr>
              ))}
              <tr><th scope="row">$500,000 or more</th><td>{distribution.tailCount}</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export interface ComparisonChartProps {
  groups: GroupedSalaryRow[];
  metricLabel: string;
  dimension: SalaryBreakdown;
  isSingleGroup: boolean;
}

export function ComparisonChart({ groups, metricLabel, dimension, isSingleGroup }: ComparisonChartProps) {
  const largestSupported = Math.max(0, ...groups.flatMap((group) => group.summary ? [group.summary.p75, group.summary.median] : []));
  const scaleMaximum = Math.max(50_000, Math.ceil(largestSupported / 50_000) * 50_000);
  const label = dimension[0].toUpperCase() + dimension.slice(1);

  return (
    <figure className="comparison-chart" aria-label={`${label} comparison for selected ${metricLabel} reports`}>
      {isSingleGroup && groups[0] && <figcaption>{groups[0].label} detail</figcaption>}
      <div className="comparison-axis" aria-hidden="true"><span>$0</span><span>{money(scaleMaximum, true)}</span></div>
      <div className="comparison-rows">
        {groups.map((group) => (
          <div className="comparison-row" key={group.key}>
            <div className="group-label"><strong>{group.label}</strong><span>{group.usableCount} usable · {group.selectedCount} selected</span></div>
            <div className="range-track">
              {group.summary ? (
                <>
                  <span
                    className="iqr-range"
                    style={{ left: `${group.summary.p25 / scaleMaximum * 100}%`, width: `${(group.summary.p75 - group.summary.p25) / scaleMaximum * 100}%` }}
                  />
                  <span className="group-median" style={{ left: `${group.summary.median / scaleMaximum * 100}%` }} />
                </>
              ) : <span className="withheld">Summary withheld</span>}
            </div>
            <div className="group-value">{group.summary ? money(group.summary.median, true) : '—'}</div>
          </div>
        ))}
        {groups.length === 0 && <p className="no-groups">No groups in this selection.</p>}
      </div>
      <div className="comparison-legend"><span><i className="legend-range" />Middle 50%</span><span><i className="legend-median" />Median</span><span>Summaries require 10 usable reports</span></div>
    </figure>
  );
}
