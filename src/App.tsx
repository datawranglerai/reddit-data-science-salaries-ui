import { useMemo, useState } from "react";
import { Box, Text, HStack, Flex } from "@chakra-ui/react";

import rawData from "./data/processed_salary_data_v2.json";
import { processRecords, applyFilters } from "./utils/dataUtils";
import type { FilterState, SalaryRecord } from "./types";

import FilterBar from "./components/FilterBar";
import KPICards from "./components/KPICards";
import SalaryByYear from "./components/charts/SalaryByYear";
import SalaryByCountry from "./components/charts/SalaryByCountry";
import RoleTypeDonut from "./components/charts/RoleTypeDonut";
import SalaryByStage from "./components/charts/SalaryByStage";
import IndustryHeatmap from "./components/charts/IndustryHeatmap";
import EducationPremium from "./components/charts/EducationPremium";
import SalaryScatter from "./components/charts/SalaryScatter";
import RemoteGap from "./components/charts/RemoteGap";
import DataTable from "./components/DataTable";

const BG = "#0f1117";
const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const REDDIT = "#ff4500";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const ACCENT1 = "#6366f1";

const DEFAULT_FILTERS: FilterState = {
  years: [],
  countries: [],
  careerStages: [],
  roleTypes: [],
  industries: [],
  remoteOnly: false,
  educations: [],
};

const ALL_RECORDS = processRecords(rawData as SalaryRecord[]);

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr)).filter(Boolean) as T[];
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filterOptions = useMemo(() => ({
    years: unique(ALL_RECORDS.map((r) => String(r.year)).filter((y) => y !== "0")).sort(),
    countries: unique(ALL_RECORDS.map((r) => r.country)).sort(),
    careerStages: ["Entry", "Mid", "Senior", "Lead/Staff", "Manager/Director", "Director+"],
    roleTypes: unique(ALL_RECORDS.map((r) => r.roleType)).sort(),
    industries: unique(ALL_RECORDS.map((r) => r.company_industry)).sort(),
    educations: unique(ALL_RECORDS.map((r) => r.education)).sort(),
  }), []);

  const filtered = useMemo(() => applyFilters(ALL_RECORDS, filters), [filters]);

  return (
    <Box bg={BG} minH="100dvh" color={TEXT} fontFamily="body">
      <Box
        borderBottom="1px solid"
        borderColor={BORDER}
        bg={`${SURFACE}cc`}
        backdropFilter="blur(16px)"
        px={{ base: 4, md: 8 }}
        py="5"
      >
        <Flex align="center" justify="space-between" maxW="1400px" mx="auto" flexWrap="wrap" gap="3">
          <Box>
            <HStack gap="2" mb="1">
              <Box
                as="span"
                fontSize="xs"
                fontWeight="700"
                color={REDDIT}
                bg={`${REDDIT}18`}
                px="2"
                py="0.5"
                borderRadius="full"
                letterSpacing="0.06em"
              >
                r/datascience
              </Box>
              <Text fontSize="xs" color={MUTED}>Community Salary Survey</Text>
            </HStack>
            <Text
              fontSize={{ base: "lg", md: "2xl" }}
              fontWeight="800"
              color={TEXT}
              letterSpacing="-0.02em"
              lineHeight="1.2"
            >
              The Definitive{" "}
              <Box as="span" color={REDDIT}>r/datascience</Box>{" "}
              Salary Guide{" "}
              <Box as="span" color={MUTED} fontWeight="400" fontSize={{ base: "md", md: "xl" }}>
                (2020&ndash;2024)
              </Box>
            </Text>
          </Box>
          <Box textAlign={{ base: "left", md: "right" }}>
            <Text fontSize="xs" color={MUTED}>Total Submissions</Text>
            <Text fontSize="xl" fontWeight="700" color={ACCENT1}>
              {ALL_RECORDS.length.toLocaleString()}
            </Text>
          </Box>
        </Flex>
      </Box>

      <FilterBar
        filters={filters}
        options={filterOptions}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }} py="6">
        <KPICards records={filtered} />

        <Box mt="6" display="grid" gridTemplateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap="4">
          <SalaryByYear records={filtered} />
          <SalaryByCountry records={filtered} />
        </Box>

        <Box mt="4" display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }} gap="4">
          <RoleTypeDonut records={filtered} />
          <SalaryByStage records={filtered} />
          <EducationPremium records={filtered} />
        </Box>

        <Box mt="4" display="grid" gridTemplateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap="4">
          <SalaryScatter records={filtered} />
          <RemoteGap records={filtered} />
        </Box>

        <Box mt="4">
          <IndustryHeatmap records={filtered} />
        </Box>

        <Box mt="4">
          <DataTable records={filtered} />
        </Box>

        <Box mt="8" pt="6" borderTop="1px solid" borderColor={BORDER} textAlign="center">
          <Text fontSize="xs" color={MUTED}>
            Data sourced from{" "}
            <Box as="span" color={REDDIT} fontWeight="600">r/datascience</Box>
            {" "}salary threads (2020&ndash;2024). Salaries normalized to USD using approximate annual exchange rates.
            Community-reported data &mdash; use with appropriate skepticism.
          </Text>
          <Text fontSize="xs" color={`${MUTED}88`} mt="1">
            Built with React + Recharts + Chakra UI
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
