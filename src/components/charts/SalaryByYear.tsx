import { Box, Text } from "@chakra-ui/react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { ProcessedRecord } from "../../types";
import { median, fmtK } from "../../utils/dataUtils";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT1 = "#6366f1";
const ACCENT2 = "#14b8a6";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

interface Props { records: ProcessedRecord[] }

export default function SalaryByYear({ records }: Props) {
  const years = [2020, 2021, 2022, 2023, 2024];
  const data = years.map((year) => {
    const yr = records.filter((r) => r.year === year);
    const salaries = yr.map((r) => r.usdSalary).filter((v): v is number => v !== null && v > 0);
    const tcs = yr.map((r) => r.usdTotalComp).filter((v): v is number => v !== null && v > 0);
    return {
      year: String(year),
      base: salaries.length ? Math.round(median(salaries) / 1000) : null,
      tc: tcs.length ? Math.round(median(tcs) / 1000) : null,
    };
  });

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" p="5">
      <Text fontWeight="600" color={TEXT} mb="1" fontSize="sm">Median Salary by Year</Text>
      <Text fontSize="xs" color={MUTED} mb="4">USD normalized, filtered respondents</Text>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
            formatter={(val: number) => [`$${val}k`, undefined]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: MUTED, paddingTop: 8 }}
          />
          <Line
            type="monotone"
            dataKey="base"
            name="Base Salary"
            stroke={ACCENT1}
            strokeWidth={2.5}
            dot={{ fill: ACCENT1, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="tc"
            name="Total Comp"
            stroke={ACCENT2}
            strokeWidth={2.5}
            dot={{ fill: ACCENT2, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
