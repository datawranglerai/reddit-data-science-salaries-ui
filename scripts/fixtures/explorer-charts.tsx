import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DistributionChart } from '../../src/components/editorial/ExplorerCharts.tsx';
import type { SalaryBin, SalaryDistribution } from '../../src/utils/editorialData.ts';
import '../../src/styles/global.css';
import '../../src/components/editorial/explorer.css';

const BIN_WIDTH = 25_000;

function bins(counts: number[]): SalaryBin[] {
  if (counts.length !== 20) throw new Error('Renderer fixtures require exactly twenty regular bins.');
  return counts.map((count, index) => ({
    lowerBound: index * BIN_WIDTH,
    upperBound: (index + 1) * BIN_WIDTH,
    count,
  }));
}

function distribution(
  overrides: Pick<SalaryDistribution, 'selectedCount' | 'usableCount' | 'bins' | 'tailCount' | 'tailMax' | 'regularPeak' | 'allInTail' | 'supportedSummary' | 'medianInRegularDomain'>,
): SalaryDistribution {
  return {
    ...overrides,
    regularScaleMax: Math.max(1, overrides.regularPeak),
  };
}

const fixtures: Array<{ slug: string; title: string; model: SalaryDistribution }> = [
  {
    slug: 'all-tail',
    title: 'All values in the tail',
    model: distribution({
      selectedCount: 10,
      usableCount: 10,
      bins: bins(Array(20).fill(0) as number[]),
      tailCount: 10,
      tailMax: 700_000,
      regularPeak: 0,
      allInTail: true,
      supportedSummary: { median: 587_500, p25: 531_250, p75: 643_750 },
      medianInRegularDomain: false,
    }),
  },
  {
    slug: 'threshold-median',
    title: 'Median exactly at the tail threshold',
    model: distribution({
      selectedCount: 10,
      usableCount: 10,
      bins: bins([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]),
      tailCount: 6,
      tailMax: 600_000,
      regularPeak: 1,
      allInTail: false,
      supportedSummary: { median: 500_000, p25: 456_250, p75: 543_750 },
      medianInRegularDomain: false,
    }),
  },
  {
    slug: 'empty',
    title: 'No usable values',
    model: distribution({
      selectedCount: 4,
      usableCount: 0,
      bins: bins(Array(20).fill(0) as number[]),
      tailCount: 0,
      tailMax: null,
      regularPeak: 0,
      allInTail: false,
      supportedSummary: null,
      medianInRegularDomain: false,
    }),
  },
  {
    slug: 'ordinary',
    title: 'Ordinary supported distribution',
    model: distribution({
      selectedCount: 12,
      usableCount: 12,
      bins: bins([0, 1, 1, 2, 3, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      tailCount: 1,
      tailMax: 650_000,
      regularPeak: 3,
      allInTail: false,
      supportedSummary: { median: 120_000, p25: 80_000, p75: 175_000 },
      medianInRegularDomain: true,
    }),
  },
];

export function ChartFixtures() {
  return (
    <div className="page-width" style={{ paddingBlock: 24 }}>
      <h1>Distribution chart renderer fixtures</h1>
      {fixtures.map(({ slug, title, model }) => (
        <section key={slug} data-case={slug} aria-labelledby={`${slug}-title`} style={{ marginBlock: 32 }}>
          <h2 id={`${slug}-title`}>{title}</h2>
          <DistributionChart distribution={model} metricLabel="base salary" />
        </section>
      ))}
    </div>
  );
}

createRoot(document.getElementById('fixture-root')!).render(
  <StrictMode>
    <ChartFixtures />
  </StrictMode>,
);
