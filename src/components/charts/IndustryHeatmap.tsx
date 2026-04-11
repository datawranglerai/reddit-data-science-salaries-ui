import { Box, Text, Grid } from "@chakra-ui/react";
import type { ProcessedRecord } from "../../types";
import { median } from "../../utils/dataUtils";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT1 = "#6366f1";
const ACCENT2 = "#14b8a6";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

const STAGE_ORDER = ["Entry", "Mid", "Senior", "Lead/Staff", "Manager/Director"];

interface Props { records: ProcessedRecord[] }

function getColor(value: number | null, min: number, max: number): string {
  if (value === null) return "#2a2f45";
  const t = max === min ? 0.5 : (value - min) / (max - min);
  const r = Math.round(99 + t * (20 - 99));
  const g = Math.round(102 + t * (184 - 102));
  const b = Math.round(241 + t * (166 - 241));
  return `rgb(${r},${g},${b})`;
}

export default function IndustryHeatmap({ records }: Props) {
  const industrySet = new Set<string>();
  records.forEach((r) => { if (r.company_industry) industrySet.add(r.company_industry); });
  const industries = Array.from(industrySet).sort();

  const cellData: Record<string, Record<string, number | null>> = {};
  const allValues: number[] = [];

  industries.forEach((ind) => {
    cellData[ind] = {};
    STAGE_ORDER.forEach((stage) => {
      const vals = records
        .filter((r) => r.company_industry === ind && r.careerStage === stage)
        .map((r) => r.usdSalary)
        .filter((v): v is number => v !== null && v > 0);
      cellData[ind][stage] = vals.length >= 2 ? Math.round(median(vals) / 1000) : null;
      if (vals.length >= 2) allValues.push(Math.round(median(vals) / 1000));
    });
  });

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" p="5">
      <Text fontWeight="600" color={TEXT} mb="1" fontSize="sm">Industry × Career Stage Heatmap</Text>
      <Text fontSize="xs" color={MUTED} mb="4">Median base salary (USD $k) — lighter = higher</Text>
      <Box overflowX="auto">
        <Box minW="540px">
          <Grid templateColumns={`160px repeat(${STAGE_ORDER.length}, 1fr)`} gap="1" mb="1">
            <Box />
            {STAGE_ORDER.map((s) => (
              <Text key={s} fontSize="9px" color={MUTED} textAlign="center" fontWeight="600" lineHeight="1.2">
                {s}
              </Text>
            ))}
          </Grid>
          {industries.slice(0, 12).map((ind) => (
            <Grid key={ind} templateColumns={`160px repeat(${STAGE_ORDER.length}, 1fr)`} gap="1" mb="1">
              <Text fontSize="10px" color={TEXT} noOfLines={1} lineHeight="2.2" pr="2">{ind}</Text>
              {STAGE_ORDER.map((stage) => {
                const val = cellData[ind][stage];
                const bg = getColor(val, min, max);
                return (
                  <Box
                    key={stage}
                    bg={bg}
                    borderRadius="sm"
                    h="7"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="9px" color={val !== null ? "rgba(0,0,0,0.8)" : MUTED} fontWeight="600">
                      {val !== null ? `$${val}k` : "—"}
                    </Text>
                  </Box>
                );
              })}
            </Grid>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
