import { Box, Text } from "@chakra-ui/react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ProcessedRecord } from "../../types";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

const STAGE_RANK: Record<string, number> = {
  "Entry": 1, "Mid": 2, "Senior": 3, "Lead/Staff": 4, "Manager/Director": 5, "Director+": 6,
};

const ROLE_COLORS: Record<string, string> = {
  "Data Scientist": "#6366f1",
  "ML Engineer": "#14b8a6",
  "Data Analyst": "#f59e0b",
  "Data Engineer": "#ef4444",
  "Leader": "#8b5cf6",
  "Other": "#94a3b8",
};

interface Props { records: ProcessedRecord[] }

export default function SalaryScatter({ records }: Props) {
  const byRole: Record<string, { x: number; y: number; z: number }[]> = {};

  records.forEach((r) => {
    if (!r.usdSalary || r.usdSalary <= 0) return;
    const rank = STAGE_RANK[r.careerStage];
    if (!rank) return;
    const role = r.roleType || "Other";
    if (!byRole[role]) byRole[role] = [];
    const tcGap = r.usdTotalComp && r.usdTotalComp > r.usdSalary
      ? Math.round((r.usdTotalComp - r.usdSalary) / 1000)
      : 10;
    byRole[role].push({
      x: rank + (Math.random() - 0.5) * 0.4,
      y: Math.round(r.usdSalary / 1000),
      z: Math.max(tcGap, 5),
    });
  });

  const stageLabels: Record<number, string> = {
    1: "Entry", 2: "Mid", 3: "Senior", 4: "Lead/Staff", 5: "Mgr/Dir", 6: "Dir+",
  };

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" p="5">
      <Text fontWeight="600" color={TEXT} mb="1" fontSize="sm">Salary Scatter by Career Stage</Text>
      <Text fontSize="xs" color={MUTED} mb="4">Colored by role type • dot size = TC gap over base</Text>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0.5, 6.5]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tickFormatter={(v: number) => stageLabels[Math.round(v)] || ""}
            tick={{ fill: MUTED, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            tickFormatter={(v) => `$${v}k`}
            tick={{ fill: MUTED, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{ background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12 }}
            formatter={(val: number, name: string) => {
              if (name === "y") return [`$${val}k`, "Base Salary"];
              if (name === "z") return [`+$${val}k`, "TC Premium"];
              return [val, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: MUTED, paddingTop: 8 }} />
          {Object.entries(byRole).map(([role, data]) => (
            <Scatter
              key={role}
              name={role}
              data={data.slice(0, 60)}
              fill={ROLE_COLORS[role] || "#94a3b8"}
              fillOpacity={0.7}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </Box>
  );
}
