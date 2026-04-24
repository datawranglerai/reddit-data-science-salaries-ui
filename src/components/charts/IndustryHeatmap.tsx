import { Box, Grid, Text } from "@chakra-ui/react";
import type { ProcessedRecord } from "../../types";
import { fmtK } from "../../utils/dataUtils";
import { getIndustryNarrative, STAGE_ORDER } from "../../utils/storyData";

interface Props {
  records: ProcessedRecord[];
}

function getHeatColor(value: number | null, min: number, max: number): string {
  if (value === null) return "rgba(255,255,255,0.04)";
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  const alpha = 0.16 + ratio * 0.34;
  return `rgba(83, 224, 255, ${alpha.toFixed(2)})`;
}

export default function IndustryHeatmap({ records }: Props) {
  const rows = getIndustryNarrative(records);
  const allValues = rows.flatMap((row) => Object.values(row.values).filter((value): value is number => value !== null));
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 1);

  return (
    <Box className="story-surface" borderRadius="12px" p={{ base: 5, md: 6 }}>
      <Text className="story-eyebrow" mb="3">
        Industry ceilings
      </Text>
      <Text className="story-display" fontSize={{ base: "1.8rem", md: "2.35rem" }} lineHeight="1" mb="3">
        Industry still changes who gets range.
      </Text>
      <Text color="var(--story-text-muted)" fontSize="md" lineHeight="1.7" mb="5" maxW="60ch">
        A market with one clean salary ladder would not produce this pattern. Some industries pay up early; others only open up once seniority crosses a threshold.
      </Text>

      <Box overflowX="auto">
        <Box minW="760px">
          <Grid templateColumns={`180px repeat(${STAGE_ORDER.length}, minmax(96px, 1fr))`} gap="2" mb="2">
            <Box />
            {STAGE_ORDER.map((stage) => (
              <Text key={stage} className="story-eyebrow" textAlign="center">
                {stage}
              </Text>
            ))}
          </Grid>
          {rows.map((row) => (
            <Grid key={row.industry} templateColumns={`180px repeat(${STAGE_ORDER.length}, minmax(96px, 1fr))`} gap="2" mb="2">
              <Box py="2">
                <Text color="var(--story-text)" fontWeight="700" fontSize="sm">
                  {row.industry}
                </Text>
                <Text color="var(--story-text-muted)" fontSize="xs">
                  n={row.totalCount}
                </Text>
              </Box>
              {STAGE_ORDER.map((stage) => {
                const value = row.values[stage];
                return (
                  <Box
                    key={`${row.industry}-${stage}`}
                    bg={getHeatColor(value, min, max)}
                    border="1px solid"
                    borderColor="rgba(67,61,75,0.45)"
                    borderRadius="6px"
                    minH="56px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color={value ? "#061419" : "var(--story-text-muted)"} fontWeight="700" fontSize="xs">
                      {value ? fmtK(value) : "—"}
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
