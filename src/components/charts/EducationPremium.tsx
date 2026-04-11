import { Box, Text } from "@chakra-ui/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ProcessedRecord } from "../../types";
import { median } from "../../utils/dataUtils";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT2 = "#14b8a6";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

const EDU_ORDER = ["High School", "Some College", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "PhD"];
const EDU_SHORT: Record<string, string> = {
  "High School": "HS",
  "Some College": "Some Col.",
  "Associate's Degree": "Assoc.",
  "Bachelor's Degree": "B.S.",
  "Master's Degree": "M.S.",
  "PhD": "PhD",
};

interface Props { records: ProcessedRecord[] }

export default function EducationPremium({ records }: Props) {
  const eduMap: Record<string, number[]> = {};
  records.forEach((r) => {
    if (r.usdSalary && r.usdSalary > 0 && r.education) {
      if (!eduMap[r.education]) eduMap[r.education] = [];
      eduMap[r.education].push(r.usdSalary);
    }
  });

  const data = EDU_ORDER.filter((e) => eduMap[e]?.length >= 2).map((edu) => ({
    edu: EDU_SHORT[edu] || edu,
    median: Math.round(median(eduMap[edu]) / 1000),
    count: eduMap[edu].length,
  }));

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" p="5">
      <Text fontWeight="600" color={TEXT} mb="1" fontSize="sm">Education Premium</Text>
      <Text fontSize="xs" color={MUTED} mb="4">Median base salary by education level (USD)</Text>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="edu" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `$${v}k`}
            tick={{ fill: MUTED, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{ background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12 }}
            formatter={(val: number, _name, props) => [`$${val}k (n=${props.payload.count})`, "Median Salary"]}
          />
          <Bar dataKey="median" fill={ACCENT2} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
