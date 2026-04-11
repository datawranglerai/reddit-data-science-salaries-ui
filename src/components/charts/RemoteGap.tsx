import { Box, Text } from "@chakra-ui/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ProcessedRecord } from "../../types";
import { median } from "../../utils/dataUtils";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT1 = "#6366f1";
const ACCENT2 = "#14b8a6";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

interface Props { records: ProcessedRecord[] }

export default function RemoteGap({ records }: Props) {
  const years = [2020, 2021, 2022, 2023, 2024];
  const data = years.map((year) => {
    const yr = records.filter((r) => r.year === year);
    const remote = yr.filter((r) => r.is_remote === "True").map((r) => r.usdSalary).filter((v): v is number => v !== null && v > 0);
    const onsite = yr.filter((r) => r.is_remote !== "True").map((r) => r.usdSalary).filter((v): v is number => v !== null && v > 0);
    return {
      year: String(year),
      remote: remote.length >= 2 ? Math.round(median(remote) / 1000) : null,
      onsite: onsite.length >= 2 ? Math.round(median(onsite) / 1000) : null,
    };
  });

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" p="5">
      <Text fontWeight="600" color={TEXT} mb="1" fontSize="sm">Remote vs. On-Site Salary Gap</Text>
      <Text fontSize="xs" color={MUTED} mb="4">Median base salary by year and work arrangement</Text>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="year" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `$${v}k`}
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{ background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12 }}
            formatter={(val: number) => val ? [`$${val}k`, undefined] : ["N/A", undefined]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: MUTED, paddingTop: 8 }} />
          <Bar dataKey="remote" name="Remote" fill={ACCENT1} radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="onsite" name="On-Site" fill={ACCENT2} radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
