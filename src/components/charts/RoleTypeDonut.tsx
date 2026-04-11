import { Box, Text, HStack } from "@chakra-ui/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ProcessedRecord } from "../../types";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface Props { records: ProcessedRecord[] }

export default function RoleTypeDonut({ records }: Props) {
  const roleMap: Record<string, number> = {};
  records.forEach((r) => {
    if (r.roleType) roleMap[r.roleType] = (roleMap[r.roleType] || 0) + 1;
  });

  const data = Object.entries(roleMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" p="5">
      <Text fontWeight="600" color={TEXT} mb="1" fontSize="sm">Role Type Breakdown</Text>
      <Text fontSize="xs" color={MUTED} mb="4">Distribution of respondents by role</Text>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12 }}
            formatter={(val: number) => [`${val} (${Math.round((val / total) * 100)}%)`, undefined]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: MUTED }}
            formatter={(value) => <span style={{ color: MUTED }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
