import { Box, HStack, Text, Wrap } from "@chakra-ui/react";
import { CartesianGrid, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProcessedRecord } from "../../types";
import { fmtK } from "../../utils/dataUtils";
import { canShowStrongYearNarrative, getStorySummary, getYearInflection, getYearNarrative } from "../../utils/storyData";

interface Props {
  records: ProcessedRecord[];
  hasActiveFilters: boolean;
}

function makeLabelRenderer(targetIndex: number, color: string, prefix: string) {
  return (props: { index?: number; value?: unknown; x?: string | number; y?: string | number }) => {
    const { index, value, x, y } = props;
    const numeric = Array.isArray(value) ? Number(value[0]) : Number(value);
    const xPos = Number(x);
    const yPos = Number(y);
    if (index !== targetIndex || !Number.isFinite(numeric) || !Number.isFinite(xPos) || !Number.isFinite(yPos)) return null;
    return (
      <text x={xPos + 12} y={yPos - 6} fill={color} fontSize="11" fontWeight="700">
        {prefix} {fmtK(numeric)}
      </text>
    );
  };
}

export default function SalaryByYear({ records, hasActiveFilters }: Props) {
  const series = getYearNarrative(records);
  const summary = getStorySummary(records);
  const strongNarrative = canShowStrongYearNarrative(records, series);
  const inflection = getYearInflection(series);
  const baseIndex = Math.max(...series.map((point, index) => (point.base ? index : -1)));
  const totalCompIndex = Math.max(...series.map((point, index) => (point.totalComp ? index : -1)));
  const latest = [...series].reverse().find((point) => point.base !== null);
  const latestIsThin = Boolean(latest && latest.baseCount < 60);

  return (
    <Box className="story-surface" borderRadius="12px" p={{ base: 5, md: 6 }}>
      <Text className="story-eyebrow" mb="3">
        Repricing / yearly evidence
      </Text>
      <Text className="story-display" fontSize={{ base: "2rem", md: "2.8rem" }} lineHeight="0.98" mb="3">
        The line goes up. Then it gets weird.
      </Text>
      <Text color="var(--story-text-muted)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7" maxW="58ch">
        Across the full run, this is not a clean hockey-stick story. Base pay climbs into 2023, slips in 2024, then jumps in 2025. Interesting, yes. Settled, no.
      </Text>

      <HStack gap="4" mt="5" mb="5" flexWrap="wrap">
        <Box>
          <Text className="story-eyebrow" mb="1">Current median base</Text>
          <Text color="var(--story-secondary)" fontWeight="800" fontSize="xl">{summary.medianBase ? fmtK(summary.medianBase) : "N/A"}</Text>
        </Box>
        <Box>
          <Text className="story-eyebrow" mb="1">From {summary.earliestYear ?? "—"} to {summary.latestYear ?? "—"}</Text>
          <Text color="var(--story-text)" fontWeight="700" fontSize="xl">
            {summary.growthPercent !== null ? `${summary.growthPercent >= 0 ? "+" : ""}${summary.growthPercent}%` : "Insufficient range"}
          </Text>
        </Box>
        <Box>
          <Text className="story-eyebrow" mb="1">Story status</Text>
          <Text color={strongNarrative ? "var(--story-success)" : "var(--story-warning)"} fontWeight="700" fontSize="xl">
            {strongNarrative ? (latestIsThin ? "Thin tail" : "Claim holds") : "Thin slice"}
          </Text>
        </Box>
      </HStack>

      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={series} margin={{ top: 24, right: 96, left: 4, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(67,61,75,0.5)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#a9a1ad", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => fmtK(Number(value))} tick={{ fill: "#a9a1ad", fontSize: 11 }} axisLine={false} tickLine={false} width={62} />
          {strongNarrative && inflection && (
            <ReferenceLine
              x={String(inflection.year)}
              stroke="var(--story-tertiary)"
              strokeDasharray="3 3"
              label={{ value: hasActiveFilters ? `${inflection.year} bump in this slice` : `${inflection.year} bump`, fill: "#ffd8bf", fontSize: 11 }}
            />
          )}
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 }}
            contentStyle={{ background: "#0f0f13", border: "1px solid #433d4b", borderRadius: 8, color: "#f5f2ef" }}
            formatter={(value, name) => {
              const numeric = Array.isArray(value) ? Number(value[0]) : Number(value);
              return [Number.isFinite(numeric) ? fmtK(numeric) : "N/A", name === "base" ? "Base salary" : "Total comp"];
            }}
          />
          <Line type="monotone" dataKey="base" stroke="var(--story-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--story-primary)" }} activeDot={{ r: 6 }} connectNulls>
            <LabelList content={makeLabelRenderer(baseIndex, "#f1dcff", "Base")} />
          </Line>
          <Line type="monotone" dataKey="totalComp" stroke="var(--story-secondary)" strokeWidth={3} dot={{ r: 4, fill: "var(--story-secondary)" }} activeDot={{ r: 6 }} connectNulls>
            <LabelList content={makeLabelRenderer(totalCompIndex, "#b9f3ff", "TC")} />
          </Line>
        </LineChart>
      </ResponsiveContainer>

      <Wrap gap="2" mt="4">
        {series.map((point) => (
          <Box key={point.year} className="story-chip">
            {point.year} · n={point.baseCount}
          </Box>
        ))}
      </Wrap>

      <Text mt="4" color="var(--story-text-muted)" fontSize="sm" lineHeight="1.7">
        {strongNarrative
          ? latestIsThin
            ? "The jump at the end clears the threshold, but the sample is thinner than the earlier years. Call it a signal, not gospel."
            : "This slice is still thick enough to support the story instead of just hinting at it."
          : "This slice is too thin for a strong claim. Read the chart, but keep your eyebrow up."}
      </Text>
    </Box>
  );
}
