import processedData from './data/v2/processed_salary_data_v3.json';
import Explorer from './components/editorial/Explorer';
import type { SalaryRecord } from './types';
import { metricCoverage, prepareEditorialRecords } from './utils/editorialData';
import { LuCoffee } from 'react-icons/lu';

const RECORDS = prepareEditorialRecords(processedData as SalaryRecord[]);
const BASE_COVERAGE = metricCoverage(RECORDS, 'usdSalary');
const TOTAL_COVERAGE = metricCoverage(RECORDS, 'usdTotalComp');
const BRAND_MARK_URL = `${import.meta.env.BASE_URL}brand/salary-smirk.png`;

export default function App() {
  return (
    <>
      <a className="skip-link" href="#explorer" data-analytics-event="nav-skip">Skip to salary reports</a>
      <header className="site-header page-width">
        <nav aria-label="Page sections">
          <a href="#reports" data-analytics-event="nav-reports">Reports</a>
          <a href="#about" data-analytics-event="nav-about">About the data</a>
        </nav>
      </header>
      <main id="top">
        <section className="page-intro page-width" aria-labelledby="page-title">
          <div className="page-brand">
            <img className="brand-mark" src={BRAND_MARK_URL} alt="" width="56" height="56" />
            <h1 id="page-title">Salary, Allegedly</h1>
          </div>
          <p>Salary reports from r/datascience, 2020–2025.</p>
        </section>
        <Explorer records={RECORDS} />
        <section id="about" className="about page-width" aria-labelledby="about-title">
          <div className="about-heading">
            <h2 id="about-title">About the data</h2>
            <a href="https://github.com/datawranglerai/reddit-data-science-salaries" target="_blank" rel="noreferrer" data-analytics-event="data-pipeline">Data pipeline ↗</a>
          </div>
          <div className="about-details">
            <details open>
              <summary data-analytics-event="method-source">Source and coverage</summary>
              <p>{RECORDS.length} parsed reports from r/datascience annual salary threads, 2020–2025. Original comments were scraped and fields were extracted by an LLM. Reports are self-selected, may not represent unique people, and are not verified payslips.</p>
              <p>{BASE_COVERAGE.usableCount} reports have usable annual base salary; {TOTAL_COVERAGE.usableCount} have usable total compensation. Missing values remain missing.</p>
            </details>
            <details>
              <summary data-analytics-event="method-pay">Pay and exclusions</summary>
              <p>Values are approximate annual USD using fixed project rates: USD 1.00, GBP 1.27, CAD 0.74, EUR 1.08, INR 0.012, AUD 0.65, SGD 0.74 and CHF 1.13. These are not reporting-year exchange rates, and there is no adjustment for inflation, tax or living costs.</p>
              <p>Missing, unsupported-currency and nonpositive values do not enter pay summaries. When reported total compensation is below base salary, total compensation is excluded while a valid base salary remains. Ten reviewed monthly, hourly, per-course or ambiguous reports are also excluded from annual-pay measures; raw values and review notes remain inspectable.</p>
            </details>
            <details>
              <summary data-analytics-event="method-labels">Labels and summaries</summary>
              <p>Role and career-stage labels are inferred from titles and experience. Work arrangement can be “Not stated”. Median and middle-50% summaries require at least 10 usable reports; observed counts remain visible for smaller groups. This display safeguard is not evidence that a group is representative.</p>
            </details>
            <details>
              <summary data-analytics-event="method-limits">Limits</summary>
              <p>The sample is mostly from the U.S. and the respondents change by year. Extraction errors may remain. These reports describe this Reddit sample; they do not estimate market pay or explain why groups differ.</p>
            </details>
          </div>
        </section>
      </main>
      <footer className="site-footer page-width">
        <div className="footer-links">
          <a href="https://github.com/datawranglerai/reddit-data-science-salaries" target="_blank" rel="noreferrer" data-analytics-event="source-code">Source and code ↗</a>
          <a className="support-link" href="https://www.buymeacoffee.com/datawranglerai" target="_blank" rel="noreferrer" data-analytics-event="support-coffee"><LuCoffee size={17} aria-hidden="true" />Buy me a coffee</a>
          <a href="#top" data-analytics-event="nav-top">Back to top</a>
        </div>
        <p className="logo-credit">
          Logo inspired by Tim Robinson in{' '}
          <a href="https://www.netflix.com/tudum/articles/i-think-you-should-leave-sketch-names" target="_blank" rel="noreferrer" data-analytics-event="logo-credit">I Think You Should Leave</a>
          {' '}(Netflix): “You sure about that, that’s why?”
        </p>
      </footer>
    </>
  );
}
