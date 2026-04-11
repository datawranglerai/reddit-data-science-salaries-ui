export interface SalaryRecord {
  id: number;
  title: string;
  level: string;
  salary: number | string;
  total_comp: number | string;
  currency: string;
  country: string;
  city: string;
  company_industry: string;
  education: string;
  is_remote: string;
  thread_title: string;
  prior_experience: number | string;
  had_internship: string;
  is_salary_post: string;
  location_string: string;
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
