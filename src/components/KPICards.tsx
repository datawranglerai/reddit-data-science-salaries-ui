import { Box, Grid, Text, HStack, Icon } from "@chakra-ui/react";
import { LuUsers, LuDollarSign, LuTrendingUp, LuGlobe, LuWifi, LuCalendar } from "react-icons/lu";
import { fmtK } from "../utils/dataUtils";
import type { ProcessedRecord } from "../types";
import { median } from "../utils/dataUtils";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT1 = "#6366f1";
const ACCENT2 = "#14b8a6";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}

function KPICard({ label, value, sub, icon, accent }: KPICardProps) {
  return (
    <Box
      bg={SURFACE}
      border="1px solid"
      borderColor={BORDER}
      borderRadius="xl"
      p="5"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        h: "2px",
        bg: accent,
      }}
    >
      <HStack justify="space-between" mb="3">
        <Text fontSize="xs" color={MUTED} fontWeight="500" letterSpacing="0.05em" textTransform="uppercase">
          {label}
        </Text>
        <Box
          p="2"
          borderRadius="lg"
          bg={`${accent}20`}
          color={accent}
        >
          <Icon as={icon} boxSize="4" />
        </Box>
      </HStack>
      <Text fontSize="2xl" fontWeight="700" color={TEXT} lineHeight="1">
        {value}
      </Text>
      {sub && (
        <Text fontSize="xs" color={MUTED} mt="1">
          {sub}
        </Text>
      )}
    </Box>
  );
}

interface Props {
  records: ProcessedRecord[];
}

export default function KPICards({ records }: Props) {
  const usdSalaries = records.map((r) => r.usdSalary).filter((v): v is number => v !== null && v > 0);
  const usdTCs = records.map((r) => r.usdTotalComp).filter((v): v is number => v !== null && v > 0);
  const countries = new Set(records.map((r) => r.country).filter(Boolean));
  const remoteCount = records.filter((r) => r.is_remote === "True").length;
  const remotePercent = records.length > 0 ? Math.round((remoteCount / records.length) * 100) : 0;

  const kpis: KPICardProps[] = [
    {
      label: "Total Responses",
      value: records.length.toLocaleString(),
      sub: "salary submissions",
      icon: LuUsers,
      accent: ACCENT1,
    },
    {
      label: "Median Base Salary",
      value: usdSalaries.length ? fmtK(median(usdSalaries)) : "N/A",
      sub: "USD normalized",
      icon: LuDollarSign,
      accent: ACCENT2,
    },
    {
      label: "Median Total Comp",
      value: usdTCs.length ? fmtK(median(usdTCs)) : "N/A",
      sub: "base + bonus + equity",
      icon: LuTrendingUp,
      accent: ACCENT1,
    },
    {
      label: "Countries",
      value: countries.size.toString(),
      sub: "represented",
      icon: LuGlobe,
      accent: ACCENT2,
    },
    {
      label: "Remote Workers",
      value: `${remotePercent}%`,
      sub: `${remoteCount} of ${records.length} respondents`,
      icon: LuWifi,
      accent: ACCENT1,
    },
    {
      label: "Years of Data",
      value: "5",
      sub: "2020 – 2024",
      icon: LuCalendar,
      accent: ACCENT2,
    },
  ];

  return (
    <Grid
      templateColumns={{ base: "1fr 1fr", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }}
      gap="4"
    >
      {kpis.map((kpi) => (
        <KPICard key={kpi.label} {...kpi} />
      ))}
    </Grid>
  );
}
