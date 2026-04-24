import { useMemo, useState } from "react";
import { Box, Grid, Text } from "@chakra-ui/react";

import processedData from "./data/processed_salary_data_v2.json";
import originalData from "./data/original_salary_data.json";
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
const ALL_SOURCE_CONTEXT = buildSourceContext(originalData as RawSourceRecord[]);

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr)).filter(Boolean) as T[];
}

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
    { label: "Source comments", value: (originalData as RawSourceRecord[]).length.toLocaleString() },
    { label: "Years", value: "2020–2024" },
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
            eyebrow="r/datascience salary threads · 2020–2024"
            title="Data science pay didn’t just rise — it repriced."
            description="The old version of this app behaved like a monitor. This one is built to make an argument: the salary floor moved, the ceiling widened, and the market never really went back to its pre-2022 shape. Filters still matter — but they test the claim rather than replacing it."
            statLabel={filterMode ? "Current filtered slice" : "Current full-dataset read"}
            statValue={summary.medianBase ? fmtK(summary.medianBase) : "N/A"}
            statSubline={growthLine}
            facts={heroFacts}
            scopeNote={filterMode ? "Full-dataset thesis; filtered view below tests this slice. When the evidence gets thin, the UI drops back to caveats instead of pretending confidence." : undefined}
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
            title="The cleanest signal is the break in the curve."
            description="If you only remember one thing from this page, make it this: the compensation regime changes hard in 2022. That is the closest thing the dataset has to a plot point."
          />
          <SalaryByYear records={filteredRecords} hasActiveFilters={filterMode} />
          <KPICards facts={facts} />
        </Box>

        <Box className="story-divider" />

        <Box display="flex" flexDirection="column" gap="6">
          <SectionHeader
            eyebrow="Chapter 02 / upside"
            title="The upside didn’t spread evenly across the stack."
            description="Some of the premium is role-driven. Some of it is seniority-driven. And some of it is simply variance opening up once you move higher in the ladder."
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
            title="Geography, industry, and remote work keep bending the market out of shape."
            description="USD normalization smooths the rough edges, but it does not erase them. The market still clears differently across countries, industries, and work arrangements."
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
            description="The source material matters because it shows how people talked about salary, not just how they filled in a template. These excerpts are there to give the data texture. If the slice gets weak, the quotes disappear before the caveats do."
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
