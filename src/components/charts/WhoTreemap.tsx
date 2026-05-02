import { useState, useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import type { ProcessedRecord, WhoLeaf } from "../../types";
import { fmtK } from "../../utils/dataUtils";
import { getWhoNarrative } from "../../utils/storyData";

interface Props {
  records: ProcessedRecord[];
}

interface TooltipState {
  clientX: number;
  clientY: number;
  industry: string;
  stage: WhoLeaf;
}

function salaryToColor(salary: number | null, min: number, max: number): string {
  if (salary === null) return "rgba(255,255,255,0.06)";
  const t = max > min ? Math.min(1, Math.max(0, (salary - min) / (max - min))) : 0.5;
  const r = Math.round(183 + (83 - 183) * t);
  const g = Math.round(109 + (224 - 109) * t);
  const a = 0.22 + t * 0.58;
  return `rgba(${r}, ${g}, 255, ${a.toFixed(2)})`;
}

function truncate(name: string, max = 22): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export default function WhoTreemap({ records }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const data = useMemo(() => getWhoNarrative(records), [records]);

  const { colorMin, colorMax } = useMemo(() => {
    const salaries = data
      .flatMap((node) => node.stages)
      .filter((s) => s.medianSalary !== null)
      .map((s) => s.medianSalary as number);
    return {
      colorMin: salaries.length ? Math.min(...salaries) : 0,
      colorMax: salaries.length ? Math.max(...salaries) : 200000,
    };
  }, [data]);

  const totalCount = records.length;

  if (!data.length) {
    return (
      <Box className="story-surface" borderRadius="12px" p={{ base: 5, md: 6 }}>
        <Text color="var(--story-text-muted)" fontSize="sm">
          Not enough data to show the composition chart with the current filters.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="story-surface" borderRadius="12px" p={{ base: 5, md: 6 }}>
      <Text className="story-eyebrow" mb="3">
        The room
      </Text>
      <Text className="story-display" fontSize={{ base: "1.8rem", md: "2.35rem" }} lineHeight="1" mb="3">
        Industry and seniority, sized by headcount.
      </Text>
      <Text color="var(--story-text-muted)" fontSize="md" lineHeight="1.7" mb="5" maxW="60ch">
        Each row is an industry — height is proportional to how many respondents work there. Each block within a row is
        a career stage — width is proportional to how many sit at that level. Colour shifts from purple (lower salary)
        to cyan (higher). Only buckets with at least three responses are shown.
      </Text>

      <Box
        position="relative"
        h={{ base: "360px", md: "480px" }}
        display="flex"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Industry label column */}
        <Box
          w={{ base: "100px", md: "148px" }}
          flexShrink={0}
          display="flex"
          flexDirection="column"
          pr={{ base: 2, md: 3 }}
        >
          {data.map((node) => (
            <Box
              key={node.industry}
              style={{ flex: node.totalCount }}
              display="flex"
              alignItems="center"
              minH="0"
              overflow="hidden"
            >
              <Box>
                <Text
                  fontSize={{ base: "10px", md: "11px" }}
                  color="var(--story-text)"
                  fontWeight="700"
                  lineHeight="1.25"
                  overflow="hidden"
                  style={{ display: "block" }}
                >
                  {truncate(node.industry, 20)}
                </Text>
                <Text fontSize="10px" color="var(--story-text-muted)" lineHeight="1.4">
                  n={node.totalCount}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Mosaic area */}
        <Box flex="1" display="flex" flexDirection="column" gap="1.5" minW="0">
          {data.map((node) => (
            <Box
              key={node.industry}
              style={{ flex: node.totalCount }}
              display="flex"
              gap="1"
              minH="0"
            >
              {node.stages.map((stage) => {
                const fill = salaryToColor(stage.medianSalary, colorMin, colorMax);
                return (
                  <Box
                    key={stage.name}
                    style={{ flex: stage.count }}
                    bg={fill}
                    borderRadius="4px"
                    border="1px solid rgba(67,61,75,0.35)"
                    overflow="hidden"
                    minW="0"
                    position="relative"
                    cursor="default"
                    transition="filter 0.12s ease"
                    onMouseMove={(e) =>
                      setTooltip({
                        clientX: e.clientX,
                        clientY: e.clientY,
                        industry: node.industry,
                        stage,
                      })
                    }
                    _hover={{ filter: "brightness(1.25)" }}
                  >
                    {/* Bottom-anchored inline label — visible when cell is large enough */}
                    <Box position="absolute" bottom="0" left="0" right="0" p="1.5" pointerEvents="none">
                      <Text
                        fontSize="10px"
                        color="rgba(245,242,239,0.92)"
                        fontWeight="600"
                        lineHeight="1.2"
                        overflow="hidden"
                        whiteSpace="nowrap"
                        style={{ textOverflow: "ellipsis" }}
                      >
                        {stage.name}
                      </Text>
                      {stage.medianSalary && (
                        <Text
                          fontSize="9px"
                          color="rgba(245,242,239,0.55)"
                          lineHeight="1.3"
                          overflow="hidden"
                          whiteSpace="nowrap"
                        >
                          {fmtK(stage.medianSalary)} · n={stage.count}
                        </Text>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Floating tooltip */}
      {tooltip && (
        <Box
          position="fixed"
          style={{ left: tooltip.clientX + 14, top: Math.max(8, tooltip.clientY - 72) }}
          bg="var(--story-surface-hi)"
          border="1px solid var(--story-border-strong)"
          borderRadius="8px"
          px="3"
          py="2.5"
          zIndex={1000}
          pointerEvents="none"
          boxShadow="var(--story-shadow)"
          minW="160px"
        >
          <Text fontSize="10px" className="story-eyebrow" color="var(--story-text-muted)" mb="1">
            {truncate(tooltip.industry, 28)}
          </Text>
          <Text fontSize="14px" color="var(--story-text)" fontWeight="700" mb="0.5">
            {tooltip.stage.name}
          </Text>
          <Text fontSize="12px" color="var(--story-text-muted)">
            {tooltip.stage.count.toLocaleString()} respondents
          </Text>
          {tooltip.stage.medianSalary ? (
            <Text fontSize="13px" color="var(--story-secondary)" fontWeight="600" mt="1">
              {fmtK(tooltip.stage.medianSalary)} median base
            </Text>
          ) : (
            <Text fontSize="11px" color="var(--story-text-muted)" fontStyle="italic" mt="1">
              Salary data too thin to show
            </Text>
          )}
        </Box>
      )}

      {/* Legend */}
      <Box mt="5" display="flex" alignItems="center" gap="3" flexWrap="wrap">
        <Text className="story-eyebrow" opacity={0.55}>
          Salary scale ·
        </Text>
        <Box display="flex" alignItems="center" gap="1">
          {[0, 0.33, 0.66, 1].map((t) => {
            const r = Math.round(183 + (83 - 183) * t);
            const g = Math.round(109 + (224 - 109) * t);
            const a = 0.22 + t * 0.58;
            return (
              <Box key={t} w="36px" h="8px" borderRadius="2px" style={{ background: `rgba(${r},${g},255,${a})` }} />
            );
          })}
        </Box>
        <Text className="story-eyebrow" opacity={0.55}>
          {fmtK(colorMin)} → {fmtK(colorMax)}
        </Text>
        <Box display="flex" flex="1" />
        <Text className="story-eyebrow" opacity={0.55}>
          {totalCount.toLocaleString()} respondents · {data.length} industries
        </Text>
      </Box>
    </Box>
  );
}
