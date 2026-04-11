import { Box, Text } from "@chakra-ui/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { ProcessedRecord } from "../../types";
import { median } from "../../utils/dataUtils";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT1 = "#6366f1";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

interface Props { records: ProcessedRecord[] }

export default function SalaryByCountry({ records }: Props) {
  const countryMap: Record<string, number[]> = {};
  records.forEach((r) => {
    if (r.usdSalary && r.usdSalary > 0 && r.country) {
      if (!countryMap[r.country]) countryMap[r.country] = [];
      countryMap[r.country].push(r.usdSalary);
    }
  });

  const data = Object.entries(countryMap)
    .map(([country, salaries]) => ({
      country,
      median: Math.round(median(salaries) / 1000),
      count: salaries.length,
    }))
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.median - a.median)
    .slice(0, 10);

  const allSalaries = records.map((r) => r.usdSalary).filter((v): v is number => v !== null && v > 0);
  const overallMedian = allSalaries.length ? Math.round(median(allSalaries) / 1000) : 0;

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" p="5">
      <Text fontWeight="600" color={TEXT} mb="1" fontSize="sm">Salary by Country</Text>
      <Text fontSize="xs" color={MUTED} mb="4">Top 10 countries by median base salary (USD)</Text>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${v}k`}
            tick={{ fill: MUTED, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="country"
            tick={{ fill: TEXT, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            contentStyle={{ background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12 }}
            formatter={(val: number, _name, props) => [`$${val}k (n=${props.payload.count})`, "Median Salary"]}
          />
          <ReferenceLine
            x={overallMedian}
            stroke="#f59e0b"
            strokeDasharray="4 3"
            label={{ value: "Overall Median", position: "insideTopRight", fill: "#f59e0b", fontSize: 10 }}
          />
          <Bar dataKey="median" fill={ACCENT1} radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
