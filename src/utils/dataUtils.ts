import type { SalaryRecord, ProcessedRecord } from "../types";

const FX: Record<string, number> = {
  USD: 1,
  GBP: 1.27,
  CAD: 0.74,
  EUR: 1.08,
  INR: 0.012,
  AUD: 0.65,
  SGD: 0.74,
  CHF: 1.13,
};

export function toUSD(amount: number, currency: string): number | null {
  const rate = FX[currency.toUpperCase()];
  if (!rate) return null;
  return Math.round(amount * rate);
}

export function extractYear(threadTitle: string): number {
  const match = threadTitle.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1]) : 0;
}

export function getCareerStage(level: string): string {
  const l = level.toLowerCase().trim();
  if (["entry", "junior"].includes(l)) return "Entry";
  if (["mid"].includes(l)) return "Mid";
  if (["senior"].includes(l)) return "Senior";
  if (["lead", "staff", "principal"].includes(l)) return "Lead/Staff";
  if (["manager", "director"].includes(l)) return "Manager/Director";
  if (["vp"].includes(l)) return "Director+";
  return "Mid";
}

export function getRoleType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("ml engineer") || t.includes("machine learning engineer")) return "ML Engineer";
  if (t.includes("data engineer")) return "Data Engineer";
  if (t.includes("data scientist") || t.includes("research scientist") || t.includes("applied scientist")) return "Data Scientist";
  if (t.includes("data analyst") || t.includes("analytics engineer")) return "Data Analyst";
  if (t.includes("manager") || t.includes("director") || t.includes("vp") || t.includes("lead")) return "Leader";
  return "Other";
}

export function processRecords(raw: SalaryRecord[]): ProcessedRecord[] {
  return raw.map((r) => {
    const salary = typeof r.salary === "string" ? parseFloat(r.salary) : r.salary;
    const tc = typeof r.total_comp === "string" ? parseFloat(r.total_comp) : r.total_comp;
    const year = extractYear(r.thread_title || "");
    return {
      ...r,
      year,
      careerStage: getCareerStage(r.level || ""),
      roleType: getRoleType(r.title || ""),
      usdSalary: salary && !isNaN(salary) ? toUSD(salary, r.currency) : null,
      usdTotalComp: tc && !isNaN(tc) ? toUSD(tc, r.currency) : null,
    };
  });
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export function fmtK(val: number): string {
  if (!val) return "$0";
  return `$${Math.round(val / 1000)}k`;
}

export function applyFilters(
  records: ProcessedRecord[],
  filters: {
    years: string[];
    countries: string[];
    careerStages: string[];
    roleTypes: string[];
    industries: string[];
    remoteOnly: boolean;
    educations: string[];
  }
): ProcessedRecord[] {
  return records.filter((r) => {
    if (r.year === 0) return false;
    if (filters.years.length && !filters.years.includes(String(r.year))) return false;
    if (filters.countries.length && !filters.countries.includes(r.country)) return false;
    if (filters.careerStages.length && !filters.careerStages.includes(r.careerStage)) return false;
    if (filters.roleTypes.length && !filters.roleTypes.includes(r.roleType)) return false;
    if (filters.industries.length && !filters.industries.includes(r.company_industry)) return false;
    if (filters.remoteOnly && r.is_remote !== "True") return false;
    if (filters.educations.length && !filters.educations.includes(r.education)) return false;
    return true;
  });
}
