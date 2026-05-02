import { useMemo, useState } from "react";
import { Box, Grid, Text } from "@chakra-ui/react";

import processedData from "./data/v2/processed_salary_data_v3.json";
import { applyFilters, fmtK, processRecords } from "./utils/dataUtils";
import {
  buildSourceContext,
  filterSourceContext,
  getActiveFilterTags,
  getStorySummary,
  getSupportFacts,
  getQuoteCandidates,
  hasActiveFilters,
} from "./utils/storyData";
import type { FilterState, RawSourceRecord, SalaryRecord } from "./types";

import FilterBar from "./components/FilterBar";
import KPICards from "./components/KPICards";
import SalaryByYear from "./components/charts/SalaryByYear";
import SalaryByCountry from "./components/charts/SalaryByCountry";
import RolePayComparison from "./components/charts/RolePayComparison";
import SalaryByStage from "./components/charts/SalaryByStage";
import IndustryHeatmap from "./components/charts/IndustryHeatmap";
import RemoteGap from "./components/charts/RemoteGap";
import DataTable from "./components/DataTable";
import WhoTreemap from "./components/charts/WhoTreemap";
import HeroClaim from "./components/story/HeroClaim";
import MethodologyBlock from "./components/story/MethodologyBlock";
import SectionHeader from "./components/story/SectionHeader";
import ThreadPullout from "./components/story/ThreadPullout";

const DEFAULT_FILTERS: FilterState = {
  years: [],
  countries: [],
  careerStages: [],
  roleTypes: [],
  industries: [],
  remoteOnly: false,
  educations: [],
};

const ALL_RECORDS = processRecords(processedData as SalaryRecord[]);
const ALL_SOURCE_CONTEXT = buildSourceContext(processedData as RawSourceRecord[]);

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr)).filter(Boolean) as T[];
}

function getYearRangeLabel(records: typeof ALL_RECORDS): string {
  const years = unique(records.map((record) => record.year).filter((year) => year > 0)).sort((left, right) => left - right);
  if (!years.length) return "Unknown";
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? String(first) : `${first}–${last}`;
}

const YEAR_RANGE_LABEL = getYearRangeLabel(ALL_RECORDS);

export default function App() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filterOptions = useMemo(
    () => ({
      years: unique(ALL_RECORDS.map((record) => String(record.year)).filter((year) => year !== "0")).sort(),
      countries: unique(ALL_RECORDS.map((record) => record.country)).sort(),
      careerStages: ["Entry", "Mid", "Senior", "Lead/Staff", "Manager/Director", "Director+"],
      roleTypes: unique(ALL_RECORDS.map((record) => record.roleType)).sort(),
      industries: unique(ALL_RECORDS.map((record) => record.company_industry)).sort(),
      educations: unique(ALL_RECORDS.map((record) => record.education)).sort(),
    }),
    [],
  );

  const filteredRecords = useMemo(() => applyFilters(ALL_RECORDS, filters), [filters]);
  const filteredSourceContext = useMemo(() => filterSourceContext(ALL_SOURCE_CONTEXT, filters), [filters]);
  const summary = useMemo(() => getStorySummary(filteredRecords), [filteredRecords]);
  const activeFilterTags = useMemo(() => getActiveFilterTags(filters), [filters]);
  const facts = useMemo(() => getSupportFacts(filteredRecords), [filteredRecords]);
  const quotes = useMemo(() => getQuoteCandidates(filteredSourceContext, 2), [filteredSourceContext]);
  const filterMode = hasActiveFilters(filters);

  const heroFacts = [
    { label: "Rendered records", value: ALL_RECORDS.length.toLocaleString() },
    { label: "Source comments", value: ALL_SOURCE_CONTEXT.length.toLocaleString() },
    { label: "Years", value: YEAR_RANGE_LABEL },
  ];

  const heroContextItems = [
    { label: "Thesis", value: "This is the full-dataset read. The filters below are there to stress-test it, not quietly rewrite it." },
    { label: "Evidence", value: `${summary.totalCountries} countries, ${summary.totalRecords} rendered records, and thread-level source material from the end-of-year posts.` },
    { label: "Bias check", value: "Self-reported pay is useful right up until people start treating it like payroll data. And the tail end of the series is thinner than the middle." },
  ];

  const growthLine =
    summary.growthPercent !== null && summary.earliestYear !== null && summary.latestYear !== null
      ? `${summary.growthPercent >= 0 ? "+" : ""}${summary.growthPercent}% versus ${summary.earliestYear} inside the current slice.`
      : `${filteredRecords.length.toLocaleString()} records currently clear the active filters.`;

  return (
    <Box color="var(--story-text)" pb={{ base: 14, md: 20 }}>
      <Box className="story-shell" display="flex" flexDirection="column" gap="16">
        <Box pt={{ base: 6, md: 10 }}>
          <HeroClaim
            eyebrow={`r/datascience salary threads · ${YEAR_RANGE_LABEL}`}
            title="The pay ladder still holds. The end of the line gets noisy."
            description="Taken as one run of data, the shape is pretty clear. Pay climbs into 2023. Base softens in 2024. Then the line jumps right where the sample gets thinnest. Worth paying attention to. Not something I'd call settled."
            statLabel={filterMode ? "Current filtered slice" : "Current full-dataset read"}
            statValue={summary.medianBase ? fmtK(summary.medianBase) : "N/A"}
            statSubline={growthLine}
            facts={heroFacts}
            scopeNote={filterMode ? "This slice can sharpen the read or make it weird. When the sample gets thin, the UI backs off instead of bluffing." : undefined}
            contextItems={heroContextItems}
          />
        </Box>

        <FilterBar
          filters={filters}
          options={filterOptions}
          filteredCount={filteredRecords.length}
          totalCount={ALL_RECORDS.length}
          activeTags={activeFilterTags}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        <Box display="flex" flexDirection="column" gap="6">
          <SectionHeader
            eyebrow="The room"
            title="Here's who put their numbers in."
            description="Before the pay analysis: this is the shape of the dataset. The people who self-reported, which industries they work in, and how senior they are. Everything downstream is a read of this room — knowing its composition helps judge how far the conclusions travel."
          />
          <WhoTreemap records={filteredRecords} />
        </Box>

        <Box className="story-divider" />

        <Box display="flex" flexDirection="column" gap="6">
          <SectionHeader
            eyebrow="Chapter 01 / repricing"
            title="The trend line stopped being tidy."
            description="This is not one clean repricing jump. It is a longer run: steady lift, a 2024 dip in base pay, then a jump at the thin end of the series that is real enough to notice and small enough to treat carefully."
          />
          <SalaryByYear records={filteredRecords} hasActiveFilters={filterMode} />
          <KPICards facts={facts} />
        </Box>

        <Box className="story-divider" />

        <Box display="flex" flexDirection="column" gap="6">
          <SectionHeader
            eyebrow="Chapter 02 / upside"
            title="The upside still belongs to the top of the ladder."
            description="The broad ladder is still easy to see. Analysts sit lower. Data scientists fill the middle. Leadership and senior tracks are where total comp starts to get noticeably fatter."
          />
          <Grid templateColumns={{ base: "1fr", xl: "1fr 1.15fr" }} gap="6">
            <RolePayComparison records={filteredRecords} />
            <SalaryByStage records={filteredRecords} />
          </Grid>
        </Box>

        <Box className="story-divider" />

        <Box display="flex" flexDirection="column" gap="6">
          <SectionHeader
            eyebrow="Chapter 03 / market bends"
            title="Geography still matters. Remote is messier than the hype."
            description="This is still a US-heavy dataset, so any global takeaway needs a footnote. And the remote split is noisy enough that I'd treat it as context, not doctrine."
          />
          <Grid templateColumns={{ base: "1fr", xl: "1.15fr 0.85fr" }} gap="6">
            <SalaryByCountry records={filteredRecords} />
            <RemoteGap records={filteredRecords} />
          </Grid>
          <IndustryHeatmap records={filteredRecords} />
        </Box>

        <Box className="story-divider" />

        <Box display="flex" flexDirection="column" gap="6">
          <SectionHeader
            eyebrow="Chapter 04 / thread voice"
            title="The threads help explain the mood — not the truth."
            description="The threads matter because they show how people talk about comp when they are not polishing it for a survey. Useful texture. Not proof on their own."
          />
          <Grid templateColumns={{ base: "1fr", xl: "1.25fr 0.75fr" }} gap="6" alignItems="start">
            <ThreadPullout quotes={quotes} hasActiveFilters={filterMode} />
            <MethodologyBlock />
          </Grid>
        </Box>

        <Box className="story-divider" />

        <Box display="flex" flexDirection="column" gap="6">
          <SectionHeader
            eyebrow="Chapter 05 / raw records"
            title="Now check the rows yourself."
            description="The prose is here to compress the noise, not hide the rows. Download the slice, sort it yourself, and see where the argument holds up."
          />
          <DataTable records={filteredRecords} />
        </Box>

        <Box textAlign="center" pb="4" display="flex" flexDirection="column" alignItems="center" gap="2">
          <Text className="story-eyebrow" color="var(--story-reddit)">
            Built with React + Chakra UI + Recharts · for people who read charts with one eyebrow up.
          </Text>
          <Text className="story-eyebrow" color="var(--story-text-muted)">
            <a
              href="https://github.com/datawranglerai/reddit-data-science-salaries"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              data pipeline &amp; analysis · open-source on github ↗
            </a>
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
