import { useMemo, useState } from "react";
import { Badge, Box, Button, Flex, HStack, Icon, Table, Text } from "@chakra-ui/react";
import { LuArrowDown, LuArrowUp, LuArrowUpDown, LuChevronLeft, LuChevronRight, LuDownload } from "react-icons/lu";
import type { ProcessedRecord } from "../types";
import { fmtK } from "../utils/dataUtils";

type SortKey = "title" | "level" | "usdSalary" | "usdTotalComp" | "country" | "year" | "company_industry" | "roleType";

interface Props {
  records: ProcessedRecord[];
}

const PAGE_SIZE = 12;

const COLUMNS: { key: SortKey; label: string; width?: string }[] = [
  { key: "year", label: "Year", width: "70px" },
  { key: "title", label: "Title" },
  { key: "roleType", label: "Role" },
  { key: "level", label: "Level", width: "100px" },
  { key: "usdSalary", label: "Base" },
  { key: "usdTotalComp", label: "Total comp" },
  { key: "country", label: "Country", width: "120px" },
  { key: "company_industry", label: "Industry", width: "180px" },
];

const ROLE_COLORS: Record<string, string> = {
  "Data Scientist": "var(--story-primary)",
  "ML Engineer": "var(--story-secondary)",
  "Data Analyst": "var(--story-tertiary)",
  "Data Engineer": "#ff8e8e",
  Leader: "#d7a8ff",
  Other: "var(--story-text-muted)",
};

export default function DataTable({ records }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("usdSalary");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    return [...records].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      if (leftValue === null || leftValue === undefined) return 1;
      if (rightValue === null || rightValue === undefined) return -1;
      const comparison = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [records, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Year", "Title", "Role Type", "Level", "Base USD", "TC USD", "Country", "City", "Industry", "Education", "Remote"];
    const rows = records.map((record) => [
      record.year,
      `"${record.title}"`,
      record.roleType,
      record.level,
      record.usdSalary ?? "",
      record.usdTotalComp ?? "",
      record.country,
      record.city,
      `"${record.company_industry}"`,
      `"${record.education}"`,
      record.is_remote,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "datascience_salaries.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <Icon as={LuArrowUpDown} boxSize="3" color="var(--story-text-muted)" />;
    return <Icon as={sortDir === "asc" ? LuArrowUp : LuArrowDown} boxSize="3" color="var(--story-secondary)" />;
  }

  return (
    <Box className="story-surface" borderRadius="12px" overflow="hidden">
      <Flex px={{ base: 4, md: 5 }} py="4" align={{ base: "flex-start", md: "center" }} justify="space-between" gap="4" borderBottom="1px solid" borderColor="var(--story-border)">
        <Box>
          <Text className="story-eyebrow" mb="2">
            Record explorer
          </Text>
          <Text color="var(--story-text)" fontSize={{ base: "lg", md: "xl" }} fontWeight="700">
            Audit the rows, not just the story.
          </Text>
          <Text color="var(--story-text-muted)" fontSize="sm" mt="1">
            {records.length.toLocaleString()} filtered records. Sorting and CSV export stay live.
          </Text>
        </Box>

        <Button
          size="sm"
          variant="outline"
          borderColor="var(--story-border)"
          color="var(--story-text)"
          _hover={{ borderColor: "var(--story-secondary)", color: "var(--story-secondary-soft)", bg: "rgba(83,224,255,0.06)" }}
          onClick={exportCSV}
          fontSize="xs"
          gap="1.5"
          borderRadius="6px"
          fontFamily="Space Grotesk, Inter, sans-serif"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          <Icon as={LuDownload} boxSize="3.5" />
          Export CSV
        </Button>
      </Flex>

      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="rgba(9, 9, 11, 0.82)" borderColor="var(--story-border)">
              {COLUMNS.map((column) => (
                <Table.ColumnHeader
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  cursor="pointer"
                  color="var(--story-text-muted)"
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  borderColor="var(--story-border)"
                  w={column.width}
                  _hover={{ color: "var(--story-text)" }}
                  whiteSpace="nowrap"
                  py="3"
                  px="4"
                  fontFamily="Space Grotesk, Inter, sans-serif"
                >
                  <HStack gap="1.5" display="inline-flex">
                    {column.label}
                    <SortIcon column={column.key} />
                  </HStack>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {pageData.map((record) => (
              <Table.Row key={record.id} borderColor="rgba(67,61,75,0.4)" _hover={{ bg: "rgba(255,255,255,0.02)" }}>
                <Table.Cell color="var(--story-text-muted)" fontSize="xs" py="3" px="4">{record.year || "—"}</Table.Cell>
                <Table.Cell color="var(--story-text)" fontSize="xs" py="3" px="4" maxW="200px">
                  <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{record.title}</Text>
                </Table.Cell>
                <Table.Cell py="3" px="4">
                  <Badge
                    fontSize="10px"
                    px="2"
                    py="0.5"
                    borderRadius="4px"
                    bg="rgba(255,255,255,0.04)"
                    color={ROLE_COLORS[record.roleType] || "var(--story-text-muted)"}
                    border="1px solid rgba(255,255,255,0.06)"
                  >
                    {record.roleType}
                  </Badge>
                </Table.Cell>
                <Table.Cell color="var(--story-text-muted)" fontSize="xs" py="3" px="4">{record.level || "—"}</Table.Cell>
                <Table.Cell color="var(--story-text)" fontSize="xs" fontWeight="700" py="3" px="4">
                  {record.usdSalary ? fmtK(record.usdSalary) : "—"}
                </Table.Cell>
                <Table.Cell color="var(--story-secondary-soft)" fontSize="xs" fontWeight="700" py="3" px="4">
                  {record.usdTotalComp ? fmtK(record.usdTotalComp) : "—"}
                </Table.Cell>
                <Table.Cell color="var(--story-text-muted)" fontSize="xs" py="3" px="4">{record.country || "—"}</Table.Cell>
                <Table.Cell color="var(--story-text-muted)" fontSize="xs" py="3" px="4" maxW="180px">
                  <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{record.company_industry || "—"}</Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <Flex px={{ base: 4, md: 5 }} py="3" align="center" justify="space-between" borderTop="1px solid" borderColor="var(--story-border)">
        <Text color="var(--story-text-muted)" fontSize="xs" fontFamily="Space Grotesk, Inter, sans-serif" textTransform="uppercase" letterSpacing="0.08em">
          Page {page} of {totalPages}
        </Text>
        <HStack gap="1">
          <Button size="xs" variant="ghost" color="var(--story-text-muted)" _hover={{ color: "var(--story-text)" }} disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <Icon as={LuChevronLeft} boxSize="3.5" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
            const basePage = Math.max(1, Math.min(page - 2, totalPages - 4));
            const buttonPage = basePage + index;
            return (
              <Button
                key={buttonPage}
                size="xs"
                variant={buttonPage === page ? "solid" : "ghost"}
                bg={buttonPage === page ? "var(--story-primary)" : "transparent"}
                color={buttonPage === page ? "#130f19" : "var(--story-text-muted)"}
                _hover={{ color: "var(--story-text)", bg: buttonPage === page ? "var(--story-primary)" : "rgba(255,255,255,0.04)" }}
                onClick={() => setPage(buttonPage)}
                minW="7"
              >
                {buttonPage}
              </Button>
            );
          })}
          <Button size="xs" variant="ghost" color="var(--story-text-muted)" _hover={{ color: "var(--story-text)" }} disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
            <Icon as={LuChevronRight} boxSize="3.5" />
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
