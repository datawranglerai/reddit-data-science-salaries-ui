import type { ProcessedRecord, SalaryRecord } from '../types';
import { median, percentile, processRecords } from './dataUtils.ts';

export type PayMetric = 'usdSalary' | 'usdTotalComp';
export type WorkArrangement = 'Remote / hybrid' | 'On-site' | 'Not stated';
export interface EditorialRecord extends ProcessedRecord {
  qualityNote: string | null;
  workArrangement: WorkArrangement;
}

// Reviewed against original_body. Preserve the source rows; do not guess annual hours or FX.
export const REVIEW_EXCLUSIONS: Record<number, string> = {
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

export const MIN_COHORT = 10;
export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
export const COUNTRY_ORDER = ['United States', 'United Kingdom', 'Canada', 'Germany', 'Netherlands', 'India'];

export function workArrangement(value: unknown): WorkArrangement {
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', 'yes', 'remote', 'hybrid'].includes(text)) return 'Remote / hybrid';
  if (['false', 'no', 'onsite', 'on-site'].includes(text)) return 'On-site';
  return 'Not stated';
}

export function prepareEditorialRecords(raw: SalaryRecord[]): EditorialRecord[] {
  return processRecords(raw).map((record) => {
    let qualityNote = REVIEW_EXCLUSIONS[record.id] ?? null;
    let usdSalary = validPay(record.usdSalary) ? record.usdSalary : null;
    let usdTotalComp = validPay(record.usdTotalComp) ? record.usdTotalComp : null;
    if (qualityNote) {
      usdSalary = null;
      usdTotalComp = null;
    } else if (usdSalary !== null && usdTotalComp !== null && usdTotalComp < usdSalary) {
      qualityNote = 'Reported total compensation is below base pay; total excluded, base retained.';
      usdTotalComp = null;
    }
    return { ...record, usdSalary, usdTotalComp, qualityNote, workArrangement: workArrangement(record.is_remote) };
  });
}

export function validPay(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function payValues(records: EditorialRecord[], metric: PayMetric = 'usdSalary'): number[] {
  return records.map((r) => r[metric]).filter(validPay);
}

export function summarize(records: EditorialRecord[], metric: PayMetric = 'usdSalary') {
  const values = payValues(records, metric);
  return {
    n: values.length,
    median: values.length ? median(values) : null,
    p10: values.length ? percentile(values, 10) : null,
    p25: values.length ? percentile(values, 25) : null,
    p75: values.length ? percentile(values, 75) : null,
    p90: values.length ? percentile(values, 90) : null,
  };
}

export function pairedRecords(records: EditorialRecord[]) {
  return records.filter((r) => validPay(r.usdSalary) && validPay(r.usdTotalComp) && r.usdTotalComp >= r.usdSalary);
}

export function compensationSummary(records: EditorialRecord[]) {
  const pairs = pairedRecords(records);
  return {
    n: pairs.length,
    base: pairs.length ? median(pairs.map((r) => r.usdSalary!)) : null,
    total: pairs.length ? median(pairs.map((r) => r.usdTotalComp!)) : null,
    extra: pairs.length ? median(pairs.map((r) => r.usdTotalComp! - r.usdSalary!)) : null,
    extraShare: pairs.length ? median(pairs.map((r) => (r.usdTotalComp! - r.usdSalary!) / r.usdTotalComp!)) : null,
  };
}

export function yearlySummary(records: EditorialRecord[], metric: PayMetric = 'usdSalary') {
  return YEARS.map((year) => {
    const cohort = records.filter((r) => r.year === year);
    return { year, records: cohort.length, ...summarize(cohort, metric) };
  });
}

export function money(value: number | null | undefined, precise = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (precise) return '$' + Math.round(value).toLocaleString('en-US');
  if (value >= 1_000_000) return `$${Number((value / 1_000_000).toFixed(1))}m`;
  return `$${Math.round(value / 1000)}k`;
}

export interface ExplorerFilters {
  country: string;
  year: string;
  role: string;
  stage: string;
  work: string;
  search: string;
}
export const EMPTY_FILTERS: ExplorerFilters = { country: '', year: '', role: '', stage: '', work: '', search: '' };

export function filterCohort(records: EditorialRecord[], filters: ExplorerFilters) {
  const search = filters.search.trim().toLowerCase();
  return records.filter((r) =>
    (!filters.country || (filters.country === 'Not stated' ? !r.country : r.country === filters.country)) &&
    (!filters.year || String(r.year) === filters.year) &&
    (!filters.role || r.roleType === filters.role) &&
    (!filters.stage || r.careerStage === filters.stage) &&
    (!filters.work || r.workArrangement === filters.work) &&
    (!search || `${r.title} ${r.company_industry} ${r.city} ${r.education}`.toLowerCase().includes(search)),
  );
}

export function percentileRank(records: EditorialRecord[], salary: number, metric: PayMetric): number | null {
  const values = payValues(records, metric);
  if (values.length < MIN_COHORT) return null;
  // Strictly below: ties never count as lower-paid reports.
  return Math.round(values.filter((value) => value < salary).length / values.length * 100);
}

export function sourceLink(record: EditorialRecord): { href: string; label: string } | null {
  for (const [value, label] of [[record.comment_url, 'Original comment'], [record.thread_url, 'Source thread']] as const) {
    if (value && /^https:\/\/(?:www\.)?reddit\.com\//.test(value)) return { href: value, label };
  }
  return null;
}

function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function recordsCSV(records: EditorialRecord[]): string {
  const headers = ['ID', 'Year', 'Title', 'Country', 'City', 'Industry', 'Role', 'Career stage (inferred)', 'Work arrangement', 'Original base', 'Original total', 'Original currency', 'Annual base USD', 'Annual total USD', 'Review note', 'Source'];
  const rows = records.map((r) => [r.id, r.year, r.title, r.country, r.city, r.company_industry, r.roleType, r.careerStage, r.workArrangement, r.salary, r.total_comp, r.currency, r.usdSalary, r.usdTotalComp, r.qualityNote, sourceLink(r)?.href]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}
