import { Box, Button, Text, Wrap, Badge, Flex } from "@chakra-ui/react";
import { Switch } from "@/components/ui/switch";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "@/components/ui/menu";
import { LuChevronDown, LuX } from "react-icons/lu";
import type { FilterState } from "../types";

interface Props {
  filters: FilterState;
  options: {
    years: string[];
    countries: string[];
    careerStages: string[];
    roleTypes: string[];
    industries: string[];
    educations: string[];
  };
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const BG = "#0f1117";
const SURFACE = "#1e2130";
const BORDER = "#2a2f45";
const ACCENT = "#6366f1";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };
  const active = selected.length > 0;

  return (
    <MenuRoot closeOnSelect={false}>
      <MenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          bg={active ? `${ACCENT}22` : SURFACE}
          borderColor={active ? ACCENT : BORDER}
          color={active ? ACCENT : TEXT}
          _hover={{ borderColor: ACCENT, bg: `${ACCENT}15` }}
          fontWeight="500"
          fontSize="xs"
          px="3"
          h="8"
          borderRadius="full"
        >
          {label}
          {active && (
            <Badge
              ml="1"
              fontSize="2xs"
              bg={ACCENT}
              color="white"
              borderRadius="full"
              px="1.5"
              minW="4"
              textAlign="center"
            >
              {selected.length}
            </Badge>
          )}
          <Box as={LuChevronDown} ml="1" boxSize="3" />
        </Button>
      </MenuTrigger>
      <MenuContent
        bg={SURFACE}
        border="1px solid"
        borderColor={BORDER}
        borderRadius="lg"
        shadow="xl"
        minW="48"
        maxH="64"
        overflowY="auto"
        p="1"
        zIndex="popover"
      >
        {options.map((opt) => (
          <MenuItem
            key={opt}
            value={opt}
            onClick={() => toggle(opt)}
            bg={selected.includes(opt) ? `${ACCENT}22` : "transparent"}
            color={selected.includes(opt) ? ACCENT : TEXT}
            _hover={{ bg: `${ACCENT}15` }}
            borderRadius="md"
            fontSize="sm"
            px="3"
            py="1.5"
            cursor="pointer"
          >
            <Flex align="center" gap="2" w="full">
              <Box
                w="3.5"
                h="3.5"
                borderRadius="sm"
                border="1.5px solid"
                borderColor={selected.includes(opt) ? ACCENT : BORDER}
                bg={selected.includes(opt) ? ACCENT : "transparent"}
                flexShrink={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {selected.includes(opt) && (
                  <Box w="1.5" h="1.5" bg="white" borderRadius="1px" />
                )}
              </Box>
              {opt}
            </Flex>
          </MenuItem>
        ))}
      </MenuContent>
    </MenuRoot>
  );
}

export default function FilterBar({ filters, options, onChange, onReset }: Props) {
  const hasFilters =
    filters.years.length > 0 ||
    filters.countries.length > 0 ||
    filters.careerStages.length > 0 ||
    filters.roleTypes.length > 0 ||
    filters.industries.length > 0 ||
    filters.remoteOnly ||
    filters.educations.length > 0;

  return (
    <Box
      position="sticky"
      top="0"
      zIndex="sticky"
      bg={`${BG}ee`}
      borderBottom="1px solid"
      borderColor={BORDER}
      backdropFilter="blur(12px)"
      px={{ base: 4, md: 6 }}
      py="3"
    >
      <Wrap gap="2" align="center">
        <MultiSelect
          label="Year"
          options={options.years}
          selected={filters.years}
          onChange={(v) => onChange({ ...filters, years: v })}
        />
        <MultiSelect
          label="Country"
          options={options.countries}
          selected={filters.countries}
          onChange={(v) => onChange({ ...filters, countries: v })}
        />
        <MultiSelect
          label="Career Stage"
          options={options.careerStages}
          selected={filters.careerStages}
          onChange={(v) => onChange({ ...filters, careerStages: v })}
        />
        <MultiSelect
          label="Role Type"
          options={options.roleTypes}
          selected={filters.roleTypes}
          onChange={(v) => onChange({ ...filters, roleTypes: v })}
        />
        <MultiSelect
          label="Industry"
          options={options.industries}
          selected={filters.industries}
          onChange={(v) => onChange({ ...filters, industries: v })}
        />
        <MultiSelect
          label="Education"
          options={options.educations}
          selected={filters.educations}
          onChange={(v) => onChange({ ...filters, educations: v })}
        />

        <Flex align="center" gap="2" px="3" h="8" bg={filters.remoteOnly ? `${ACCENT}22` : SURFACE} borderRadius="full" border="1px solid" borderColor={filters.remoteOnly ? ACCENT : BORDER}>
          <Text fontSize="xs" color={filters.remoteOnly ? ACCENT : TEXT} fontWeight="500">
            Remote Only
          </Text>
          <Switch
            size="sm"
            colorPalette="blue"
            checked={filters.remoteOnly}
            onCheckedChange={(e) => onChange({ ...filters, remoteOnly: e.checked })}
          />
        </Flex>

        {hasFilters && (
          <Button
            size="sm"
            variant="ghost"
            color={MUTED}
            _hover={{ color: TEXT, bg: `${BORDER}66` }}
            onClick={onReset}
            fontSize="xs"
            h="8"
            px="2"
            borderRadius="full"
            gap="1"
          >
            <Box as={LuX} boxSize="3" />
            Reset
          </Button>
        )}
      </Wrap>
    </Box>
  );
}
