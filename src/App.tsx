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
    { label: "Thesis", value: "Full-dataset editorial framing. Filters below pressure-test the claim, but the 2025 spike stays marked as an early signal." },
    { label: "Evidence", value: `${summary.totalCountries} countries, ${summary.totalRecords} rendered records, and source texture from the refreshed end-of-year Reddit threads.` },
    { label: "Bias check", value: "Community-reported pay is useful, but the latest-year sample is thinner than the earlier threads, so confidence is deliberately bounded." },
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
            title="The ladder is intact. The latest signal is loud."
            description="The refreshed threads tell a sharper, less tidy story: pay climbed into 2023, base salary softened in 2024 while total comp kept edging up, and 2025 jumps hard on the smallest sample. The spike matters — it just does not get to pretend it is settled law."
            statLabel={filterMode ? "Current filtered slice" : "Current full-dataset read"}
            statValue={summary.medianBase ? fmtK(summary.medianBase) : "N/A"}
            statSubline={growthLine}
            facts={heroFacts}
            scopeNote={filterMode ? "Full-dataset thesis; filtered view below tests this slice. When the evidence gets thin, the UI drops back to caveats instead of pretending confidence." : undefined}
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
            eyebrow="Chapter 01 / repricing"
            title="The curve no longer has one clean break."
            description="The old story was a simple repricing jump. The refreshed version is more interesting: gradual lift, a 2024 wobble, then a 2025 acceleration that deserves attention and a caveat in the same breath."
          />
          <SalaryByYear records={filteredRecords} hasActiveFilters={filterMode} />
          <KPICards facts={facts} />
        </Box>

        <Box className="story-divider" />

        <Box display="flex" flexDirection="column" gap="6">
          <SectionHeader
            eyebrow="Chapter 02 / upside"
            title="The upside still belongs to the top of the ladder."
            description="The broad salary ladder survives the data refresh. Analysts sit lower, data scientists anchor the middle, and leadership plus senior tracks pull the ceiling upward — especially when total comp enters the room."
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
            title="Geography still bends the read. Remote work mostly adds noise."
            description="The dataset is still US-heavy, so global comparisons need a raised eyebrow. Remote work is common, but the premium is unstable enough that it reads more like market texture than a universal rule."
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
            description="The source material matters because it shows how people talked about salary, not just how they filled in a template. These excerpts add texture. If the slice gets weak, the quotes disappear before the caveats do."
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
            description="The narrative is here to reduce noise, not to block inspection. If you want to audit the slice, download it, sort it, and see where the story holds up or starts to crack."
          />
          <DataTable records={filteredRecords} />
        </Box>

        <Box textAlign="center" pb="4">
          <Text className="story-eyebrow" color="var(--story-reddit)">
            Built with React + Chakra UI + Recharts · authored for skeptical readers, not dashboard wallpaper.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
