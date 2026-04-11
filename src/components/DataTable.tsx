import { useState, useMemo } from "react";
import { Box, Text, HStack, Button, Table, Icon, Flex, Badge } from "@chakra-ui/react";
import { LuArrowUpDown, LuArrowUp, LuArrowDown, LuDownload, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import type { ProcessedRecord } from "../types";
import { fmtK } from "../utils/dataUtils";

const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT1 = "#6366f1";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const ROW_HOVER = "#252b42";

type SortKey = "title" | "level" | "usdSalary" | "usdTotalComp" | "country" | "year" | "company_industry" | "roleType";

interface Props { records: ProcessedRecord[] }

const PAGE_SIZE = 10;

const COLUMNS: { key: SortKey; label: string; width?: string }[] = [
  { key: "year", label: "Year", width: "60px" },
  { key: "title", label: "Title" },
  { key: "roleType", label: "Role Type" },
  { key: "level", label: "Level", width: "80px" },
  { key: "usdSalary", label: "Base (USD)" },
  { key: "usdTotalComp", label: "TC (USD)" },
  { key: "country", label: "Country", width: "90px" },
  { key: "company_industry", label: "Industry" },
];

const ROLE_COLORS: Record<string, string> = {
  "Data Scientist": "#6366f1",
  "ML Engineer": "#14b8a6",
  "Data Analyst": "#f59e0b",
  "Data Engineer": "#ef4444",
  "Leader": "#8b5cf6",
  "Other": "#94a3b8",
};

export default function DataTable({ records }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("usdSalary");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [records, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Year", "Title", "Role Type", "Level", "Base USD", "TC USD", "Country", "City", "Industry", "Education", "Remote"];
    const rows = records.map((r) => [
      r.year,
      `"${r.title}"`,
      r.roleType,
      r.level,
      r.usdSalary ?? "",
      r.usdTotalComp ?? "",
      r.country,
      r.city,
      `"${r.company_industry}"`,
      `"${r.education}"`,
      r.is_remote,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "datascience_salaries.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Icon as={LuArrowUpDown} boxSize="3" color={MUTED} />;
    return <Icon as={sortDir === "asc" ? LuArrowUp : LuArrowDown} boxSize="3" color={ACCENT1} />;
  }

  return (
    <Box bg={SURFACE} border="1px solid" borderColor={BORDER} borderRadius="xl" overflow="hidden">
      <Flex px="5" py="4" align="center" justify="space-between" borderBottom="1px solid" borderColor={BORDER}>
        <Box>
          <Text fontWeight="600" color={TEXT} fontSize="sm">Salary Records</Text>
          <Text fontSize="xs" color={MUTED}>{records.length.toLocaleString()} entries</Text>
        </Box>
        <Button
          size="sm"
          variant="outline"
          borderColor={BORDER}
          color={TEXT}
          _hover={{ borderColor: ACCENT1, color: ACCENT1 }}
          onClick={exportCSV}
          fontSize="xs"
          gap="1.5"
        >
          <Icon as={LuDownload} boxSize="3" />
          Export CSV
        </Button>
      </Flex>

      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="#161b2e" borderColor={BORDER}>
              {COLUMNS.map((col) => (
                <Table.ColumnHeader
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  cursor="pointer"
                  color={MUTED}
                  fontSize="xs"
                  fontWeight="600"
                  letterSpacing="0.04em"
                  textTransform="uppercase"
                  borderColor={BORDER}
                  w={col.width}
                  _hover={{ color: TEXT }}
                  whiteSpace="nowrap"
                  py="3"
                  px="4"
                >
                  <HStack gap="1" display="inline-flex">
                    {col.label}
                    <SortIcon col={col.key} />
                  </HStack>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {pageData.map((r) => (
              <Table.Row
                key={r.id}
                borderColor={BORDER}
                _hover={{ bg: ROW_HOVER }}
                transition="background 0.15s"
              >
                <Table.Cell color={MUTED} fontSize="xs" py="3" px="4">{r.year || "—"}</Table.Cell>
                <Table.Cell color={TEXT} fontSize="xs" py="3" px="4" maxW="180px">
                  <Text noOfLines={1}>{r.title}</Text>
                </Table.Cell>
                <Table.Cell py="3" px="4">
                  <Badge
                    fontSize="2xs"
                    px="2"
                    py="0.5"
                    borderRadius="full"
                    bg={`${ROLE_COLORS[r.roleType] || "#94a3b8"}22`}
                    color={ROLE_COLORS[r.roleType] || "#94a3b8"}
                  >
                    {r.roleType}
                  </Badge>
                </Table.Cell>
                <Table.Cell color={MUTED} fontSize="xs" py="3" px="4">
                  <Text noOfLines={1}>{r.level}</Text>
                </Table.Cell>
                <Table.Cell color={r.usdSalary ? TEXT : MUTED} fontSize="xs" fontWeight={r.usdSalary ? "600" : "400"} py="3" px="4">
                  {r.usdSalary ? fmtK(r.usdSalary) : "—"}
                </Table.Cell>
                <Table.Cell color={r.usdTotalComp ? ACCENT1 : MUTED} fontSize="xs" fontWeight={r.usdTotalComp ? "600" : "400"} py="3" px="4">
                  {r.usdTotalComp ? fmtK(r.usdTotalComp) : "—"}
                </Table.Cell>
                <Table.Cell color={MUTED} fontSize="xs" py="3" px="4">{r.country}</Table.Cell>
                <Table.Cell color={MUTED} fontSize="xs" py="3" px="4" maxW="140px">
                  <Text noOfLines={1}>{r.company_industry}</Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <Flex px="5" py="3" align="center" justify="space-between" borderTop="1px solid" borderColor={BORDER}>
        <Text fontSize="xs" color={MUTED}>
          Page {page} of {totalPages} ({records.length} total)
        </Text>
        <HStack gap="1">
          <Button
            size="xs"
            variant="ghost"
            color={MUTED}
            _hover={{ color: TEXT }}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <Icon as={LuChevronLeft} boxSize="3.5" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <Button
                key={p}
                size="xs"
                variant={p === page ? "solid" : "ghost"}
                bg={p === page ? ACCENT1 : "transparent"}
                color={p === page ? "white" : MUTED}
                _hover={{ color: TEXT, bg: p === page ? ACCENT1 : `${BORDER}66` }}
                onClick={() => setPage(p)}
                minW="7"
              >
                {p}
              </Button>
            );
          })}
          <Button
            size="xs"
            variant="ghost"
            color={MUTED}
            _hover={{ color: TEXT }}
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <Icon as={LuChevronRight} boxSize="3.5" />
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
