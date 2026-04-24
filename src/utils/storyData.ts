import type {
  CountryNarrativePoint,
  FilterState,
  IndustryNarrativeRow,
  ProcessedRecord,
  QuoteCandidate,
  RawSourceRecord,
  RemoteNarrativePoint,
  RoleNarrativePoint,
  SourceContextRecord,
  StageNarrativePoint,
  StorySummary,
  YearNarrativePoint,
} from "../types";
import { extractYear, fmtK, getCareerStage, getRoleType, median, percentile, toUSD } from "./dataUtils";

export const STORY_THRESHOLDS = {
  heroMinRecords: 10,
  perYearMinRecords: 5,
  roleMinRecords: 4,
  stageMinRecords: 4,
  countryMinRecords: 4,
  industryCellMinRecords: 3,
} as const;

export const YEAR_ORDER = [2020, 2021, 2022, 2023, 2024];
export const STAGE_ORDER = ["Entry", "Mid", "Senior", "Lead/Staff", "Manager/Director", "Director+"];

function validNumbers(values: Array<number | null | undefined>): number[] {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0);
}

function normalizeRemote(value: boolean | string | null | undefined): boolean {
  return value === true || value === "True" || value === "true" || value === "Yes";
}

function cleanExcerpt(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasActiveFilters(filters: FilterState): boolean {
  return Boolean(
    filters.years.length ||
      filters.countries.length ||
      filters.careerStages.length ||
      filters.roleTypes.length ||
      filters.industries.length ||
      filters.remoteOnly ||
      filters.educations.length,
  );
}

export function getActiveFilterTags(filters: FilterState): string[] {
  return [
    ...filters.years.map((value) => `Year ${value}`),
    ...filters.countries.map((value) => value),
    ...filters.careerStages,
    ...filters.roleTypes,
    ...filters.industries,
    ...filters.educations,
    ...(filters.remoteOnly ? ["Remote only"] : []),
  ];
}

export function getStorySummary(records: ProcessedRecord[]): StorySummary {
  const salaries = validNumbers(records.map((record) => record.usdSalary));
  const totalComp = validNumbers(records.map((record) => record.usdTotalComp));
  const yearly = getYearNarrative(records);
  const earliest = yearly.find((point) => point.base !== null);
  const latest = [...yearly].reverse().find((point) => point.base !== null);
  const earliestMedian = earliest?.base ?? null;
  const latestMedian = latest?.base ?? null;
  const growthPercent = earliestMedian && latestMedian ? Math.round(((latestMedian - earliestMedian) / earliestMedian) * 100) : null;

  return {
    totalRecords: records.length,
    totalCountries: new Set(records.map((record) => record.country).filter(Boolean)).size,
    remotePercent: records.length ? Math.round((records.filter((record) => record.is_remote === "True").length / records.length) * 100) : 0,
    medianBase: salaries.length ? Math.round(median(salaries)) : null,
    medianTotalComp: totalComp.length ? Math.round(median(totalComp)) : null,
    earliestYear: earliest?.year ?? null,
    latestYear: latest?.year ?? null,
    earliestMedian,
    latestMedian,
    growthPercent,
  };
}

export function getYearNarrative(records: ProcessedRecord[]): YearNarrativePoint[] {
  return YEAR_ORDER.map((year) => {
    const scoped = records.filter((record) => record.year === year);
    const baseValues = validNumbers(scoped.map((record) => record.usdSalary));
    const totalCompValues = validNumbers(scoped.map((record) => record.usdTotalComp));
    return {
      year,
      label: String(year),
      base: baseValues.length ? Math.round(median(baseValues)) : null,
      totalComp: totalCompValues.length ? Math.round(median(totalCompValues)) : null,
      baseCount: baseValues.length,
      totalCompCount: totalCompValues.length,
    };
  });
}

export function canShowStrongYearNarrative(records: ProcessedRecord[], series = getYearNarrative(records)): boolean {
  if (records.length < STORY_THRESHOLDS.heroMinRecords) return false;
  const year2021 = series.find((point) => point.year === 2021);
  const year2022 = series.find((point) => point.year === 2022);
  return Boolean(year2021 && year2022 && year2021.baseCount >= STORY_THRESHOLDS.perYearMinRecords && year2022.baseCount >= STORY_THRESHOLDS.perYearMinRecords);
}

export function getRoleNarrative(records: ProcessedRecord[]): RoleNarrativePoint[] {
  const groups = new Map<string, number[]>();
  records.forEach((record) => {
    if (!record.roleType || !record.usdSalary || record.usdSalary <= 0) return;
    const existing = groups.get(record.roleType) ?? [];
    existing.push(record.usdSalary);
    groups.set(record.roleType, existing);
  });

  return [...groups.entries()]
    .map(([role, values]) => ({
      role,
      count: values.length,
      median: Math.round(median(values)),
      share: records.length ? Math.round((values.length / records.length) * 100) : 0,
    }))
    .filter((row) => row.count >= STORY_THRESHOLDS.roleMinRecords)
    .sort((left, right) => right.median - left.median);
}

export function getStageNarrative(records: ProcessedRecord[]): StageNarrativePoint[] {
  return STAGE_ORDER.map((stage) => {
    const values = validNumbers(records.filter((record) => record.careerStage === stage).map((record) => record.usdSalary));
    if (values.length < STORY_THRESHOLDS.stageMinRecords) return null;
    return {
      stage,
      p25: Math.round(percentile(values, 25)),
      median: Math.round(median(values)),
      p75: Math.round(percentile(values, 75)),
      count: values.length,
    };
  }).filter((value): value is StageNarrativePoint => value !== null);
}

export function getCountryNarrative(records: ProcessedRecord[]): CountryNarrativePoint[] {
  const groups = new Map<string, number[]>();
  records.forEach((record) => {
    if (!record.country || !record.usdSalary || record.usdSalary <= 0) return;
    const existing = groups.get(record.country) ?? [];
    existing.push(record.usdSalary);
    groups.set(record.country, existing);
  });

  return [...groups.entries()]
    .map(([country, values]) => ({ country, median: Math.round(median(values)), count: values.length }))
    .filter((row) => row.count >= STORY_THRESHOLDS.countryMinRecords)
    .sort((left, right) => right.median - left.median)
    .slice(0, 6);
}

export function getRemoteNarrative(records: ProcessedRecord[]): RemoteNarrativePoint[] {
  return YEAR_ORDER.map((year) => {
    const scoped = records.filter((record) => record.year === year);
    const remoteValues = validNumbers(scoped.filter((record) => record.is_remote === "True").map((record) => record.usdSalary));
    const onsiteValues = validNumbers(scoped.filter((record) => record.is_remote !== "True").map((record) => record.usdSalary));
    return {
      year,
      label: String(year),
      remote: remoteValues.length >= STORY_THRESHOLDS.perYearMinRecords ? Math.round(median(remoteValues)) : null,
      onsite: onsiteValues.length >= STORY_THRESHOLDS.perYearMinRecords ? Math.round(median(onsiteValues)) : null,
      remoteCount: remoteValues.length,
      onsiteCount: onsiteValues.length,
    };
  });
}

export function getIndustryNarrative(records: ProcessedRecord[]): IndustryNarrativeRow[] {
  const industries = [...new Set(records.map((record) => record.company_industry).filter(Boolean))]
    .map((industry) => ({
      industry,
      count: records.filter((record) => record.company_industry === industry).length,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)
    .map((row) => row.industry);

  return industries.map((industry) => {
    const values: Record<string, number | null> = {};
    STAGE_ORDER.forEach((stage) => {
      const scoped = validNumbers(
        records
          .filter((record) => record.company_industry === industry && record.careerStage === stage)
          .map((record) => record.usdSalary),
      );
      values[stage] = scoped.length >= STORY_THRESHOLDS.industryCellMinRecords ? Math.round(median(scoped)) : null;
    });

    return {
      industry,
      values,
      totalCount: records.filter((record) => record.company_industry === industry).length,
    };
  });
}

export function getSupportFacts(records: ProcessedRecord[]): Array<{ label: string; value: string; note: string }> {
  const summary = getStorySummary(records);
  return [
    {
      label: "Median total comp",
      value: summary.medianTotalComp ? fmtK(summary.medianTotalComp) : "N/A",
      note: "base + bonus + equity",
    },
    {
      label: "Remote share",
      value: `${summary.remotePercent}%`,
      note: "respondents reporting remote work",
    },
    {
      label: "Countries",
      value: summary.totalCountries.toString(),
      note: "represented in the current slice",
    },
  ];
}

export function buildSourceContext(raw: RawSourceRecord[]): SourceContextRecord[] {
  return raw
    .map((record) => {
      const title = record.title?.trim() ?? "";
      const companyIndustry = record.company_industry?.trim() ?? "";
      const country = record.country?.trim() ?? "";
      const education = record.education?.trim() ?? "";
      const location = record.location_string?.trim() || [record.city, record.country].filter(Boolean).join(", ");
      const year = extractYear(record.thread_title ?? "");
      const numericSalary = typeof record.salary === "string" ? parseFloat(record.salary) : record.salary ?? null;
      const usdSalary = typeof numericSalary === "number" && record.currency ? toUSD(numericSalary, record.currency) : null;
      return {
        year,
        title,
        careerStage: getCareerStage(record.level ?? ""),
        roleType: getRoleType(title),
        country,
        companyIndustry,
        education,
        isRemote: normalizeRemote(record.is_remote),
        location,
        body: cleanExcerpt(record.original_body ?? ""),
        upvotes: record.upvotes ?? 0,
        commentUrl: record.comment_url ?? "",
        createdAt: record.created_at ?? "",
        usdSalary,
      };
    })
    .filter((record) => record.year > 0 && record.body.length > 0);
}

export function filterSourceContext(records: SourceContextRecord[], filters: FilterState): SourceContextRecord[] {
  return records.filter((record) => {
    if (filters.years.length && !filters.years.includes(String(record.year))) return false;
    if (filters.countries.length && !filters.countries.includes(record.country)) return false;
    if (filters.careerStages.length && !filters.careerStages.includes(record.careerStage)) return false;
    if (filters.roleTypes.length && !filters.roleTypes.includes(record.roleType)) return false;
    if (filters.industries.length && !filters.industries.includes(record.companyIndustry)) return false;
    if (filters.educations.length && !filters.educations.includes(record.education)) return false;
    if (filters.remoteOnly && !record.isRemote) return false;
    return true;
  });
}

function getQuoteScore(record: SourceContextRecord): number {
  const hasStructuredSignals = /salary|total comp|company|education|location|remote/i.test(record.body);
  const hasNumbers = /\$?\d/.test(record.body);
  const lengthScore = record.body.length >= 80 ? 2 : 0;
  const upvoteScore = Math.min(4, Math.floor(record.upvotes / 40));
  return (hasStructuredSignals ? 4 : 0) + (hasNumbers ? 2 : 0) + lengthScore + upvoteScore;
}

function truncateQuote(text: string, maxLength = 180): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function getQuoteCandidates(records: SourceContextRecord[], limit = 2): QuoteCandidate[] {
  return [...records]
    .filter((record) => getQuoteScore(record) >= 6)
    .sort((left, right) => getQuoteScore(right) - getQuoteScore(left) || right.upvotes - left.upvotes)
    .slice(0, limit)
    .map((record) => ({
      quote: truncateQuote(record.body),
      year: record.year,
      title: record.title || record.roleType,
      companyIndustry: record.companyIndustry,
      location: record.location,
      upvotes: record.upvotes,
      commentUrl: record.commentUrl,
    }));
}
