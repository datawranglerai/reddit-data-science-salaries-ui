export interface SalaryRecord {
  id: number;
  title: string;
  level: string;
  tenure_length?: string;
  salary: number | string | null;
  total_comp: number | string | null;
  currency: string;
  country: string;
  city: string;
  company_industry: string;
  education: string;
  is_remote: string;
  thread_title: string;
  prior_experience: number | string;
  prior_experience_description?: string;
  had_internship: string;
  had_coop?: string;
  is_salary_post: string;
  location_string: string;
  original_body?: string;
  upvotes?: number | string;
  comment_url?: string;
  created_at?: string;
  thread_url?: string;
}

export interface ProcessedRecord extends SalaryRecord {
  year: number;
  careerStage: string;
  roleType: string;
  usdSalary: number | null;
  usdTotalComp: number | null;
}

export interface FilterState {
  years: string[];
  countries: string[];
  careerStages: string[];
  roleTypes: string[];
  industries: string[];
  remoteOnly: boolean;
  educations: string[];
}

export interface RawSourceRecord {
  title?: string | null;
  level?: string | null;
  salary?: number | string | null;
  total_comp?: number | string | null;
  currency?: string | null;
  country?: string | null;
  city?: string | null;
  company_industry?: string | null;
  education?: string | null;
  is_remote?: boolean | string | null;
  thread_title?: string | null;
  location_string?: string | null;
  original_body?: string | null;
  upvotes?: number | string | null;
  comment_url?: string | null;
  created_at?: string | null;
  prior_experience?: number | string | null;
  prior_experience_description?: string | null;
}

export interface SourceContextRecord {
  year: number;
  title: string;
  careerStage: string;
  roleType: string;
  country: string;
  companyIndustry: string;
  education: string;
  isRemote: boolean;
  location: string;
  body: string;
  upvotes: number;
  commentUrl: string;
  createdAt: string;
}

export interface QuoteCandidate {
  quote: string;
  year: number;
  title: string;
  companyIndustry: string;
  location: string;
  upvotes: number;
  commentUrl: string;
}

export interface StorySummary {
  totalRecords: number;
  totalCountries: number;
  remotePercent: number;
  medianBase: number | null;
  medianTotalComp: number | null;
  earliestYear: number | null;
  latestYear: number | null;
  earliestMedian: number | null;
  latestMedian: number | null;
  growthPercent: number | null;
}

export interface YearNarrativePoint {
  year: number;
  label: string;
  base: number | null;
  totalComp: number | null;
  baseCount: number;
  totalCompCount: number;
}

export interface RoleNarrativePoint {
  role: string;
  median: number;
  count: number;
  share: number;
}

export interface StageNarrativePoint {
  stage: string;
  p25: number;
  median: number;
  p75: number;
  count: number;
}

export interface CountryNarrativePoint {
  country: string;
  median: number;
  count: number;
}

export interface RemoteNarrativePoint {
  year: number;
  label: string;
  remote: number | null;
  onsite: number | null;
  remoteCount: number;
  onsiteCount: number;
}

export interface IndustryNarrativeRow {
  industry: string;
  values: Record<string, number | null>;
  totalCount: number;
}
