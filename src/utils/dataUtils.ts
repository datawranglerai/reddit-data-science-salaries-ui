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

export function normalizeRemote(value: boolean | string | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["true", "yes", "remote", "hybrid"].includes(normalized) || normalized.includes("remote") || normalized.includes("hybrid");
}

export function parseExperienceYears(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  const range = raw.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const years = Number(match[1]);
  if (!Number.isFinite(years)) return null;
  return /\bmonth|mo\b/.test(raw) ? years / 12 : years;
}

export function getCareerStage(level: string, title = "", priorExperience?: number | string | null): string {
  const l = level.toLowerCase().trim();
  const t = title.toLowerCase();
  if (/\b(vp|vice president|chief|cxo|head of)\b/.test(l) || /\b(vp|vice president|chief|cxo|head of)\b/.test(t)) return "Director+";
  if (/\b(manager|director)\b/.test(l) || /\b(manager|director)\b/.test(t)) return "Manager/Director";
  if (/\b(lead|staff|principal)\b/.test(l) || /\b(lead|staff|principal)\b/.test(t)) return "Lead/Staff";
  if (/\b(senior|sr\.?|l5|e5|iii|3)\b/.test(l) || /\b(senior|sr\.?)\b/.test(t)) return "Senior";
  if (/\b(entry|junior|jr\.?|associate|new grad|intern|l1|i|1)\b/.test(l) || /\b(junior|intern)\b/.test(t)) return "Entry";
  if (/\b(mid|l3|l4|ii|2)\b/.test(l)) return "Mid";

  const years = parseExperienceYears(priorExperience);
  if (years !== null) {
    if (years <= 1.5) return "Entry";
    if (years < 5) return "Mid";
    if (years < 9) return "Senior";
    return "Lead/Staff";
  }

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
    const priorExperience = r.prior_experience || r.prior_experience_description;
    return {
      ...r,
      year,
      careerStage: getCareerStage(r.level || "", r.title || "", priorExperience),
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
    if (filters.remoteOnly && !normalizeRemote(r.is_remote)) return false;
    if (filters.educations.length && !filters.educations.includes(r.education)) return false;
    return true;
  });
}
