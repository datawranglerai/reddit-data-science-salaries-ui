import { Box, Text } from "@chakra-ui/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ProcessedRecord } from "../../types";
import { median, percentile } from "../../utils/dataUtils";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT1 = "#6366f1";
const ACCENT2 = "#14b8a6";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

const STAGE_ORDER = ["Entry", "Mid", "Senior", "Lead/Staff", "Manager/Director", "Director+"];

interface Props { records: ProcessedRecord[] }

export default function SalaryByStage({ records }: Props) {
  const stageMap: Record<string, number[]> = {};
  records.forEach((r) => {
    if (r.usdSalary && r.usdSalary > 0 && r.careerStage) {
      if (!stageMap[r.careerStage]) stageMap[r.careerStage] = [];
      stageMap[r.careerStage].push(r.usdSalary);
    }
  });

  const data = STAGE_ORDER.filter((s) => stageMap[s]?.length >= 2).map((stage) => {
    const salaries = stageMap[stage];
    return {
      stage: stage.replace("/", "/\u200B"),
      p25: Math.round(percentile(salaries, 25) / 1000),
      median: Math.round(median(salaries) / 1000),
      p75: Math.round(percentile(salaries, 75) / 1000),
    };
  });

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" p="5">
      <Text fontWeight="600" color={TEXT} mb="1" fontSize="sm">Salary by Career Stage</Text>
      <Text fontSize="xs" color={MUTED} mb="4">P25 / Median / P75 base salary in USD</Text>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="stage" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `$${v}k`}
            tick={{ fill: MUTED, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{ background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12 }}
            formatter={(val: number) => [`$${val}k`, undefined]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: MUTED, paddingTop: 8 }} />
          <Bar dataKey="p25" name="P25" fill={`${ACCENT1}66`} radius={[2, 2, 0, 0]} maxBarSize={24} />
          <Bar dataKey="median" name="Median" fill={ACCENT1} radius={[2, 2, 0, 0]} maxBarSize={24} />
          <Bar dataKey="p75" name="P75" fill={ACCENT2} radius={[2, 2, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
