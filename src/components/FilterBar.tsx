import { Badge, Box, Button, Flex, Text, Wrap } from "@chakra-ui/react";
import { Switch } from "@/components/ui/switch";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "@/components/ui/menu";
import { LuChevronDown, LuFilterX } from "react-icons/lu";
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
  filteredCount: number;
  totalCount: number;
  activeTags: string[];
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

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
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };
  const active = selected.length > 0;

  return (
    <MenuRoot closeOnSelect={false}>
      <MenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          bg={active ? "rgba(183,109,255,0.12)" : "rgba(19,19,22,0.94)"}
          borderColor={active ? "var(--story-primary)" : "var(--story-border)"}
          color={active ? "var(--story-primary-soft)" : "var(--story-text)"}
          _hover={{ borderColor: "var(--story-primary)", bg: "rgba(183,109,255,0.12)" }}
          fontFamily="Space Grotesk, Inter, sans-serif"
          fontWeight="600"
          fontSize="xs"
          px="3"
          h="9"
          borderRadius="6px"
          gap="1.5"
        >
          {label}
          {active && (
            <Badge bg="var(--story-primary)" color="#1a1020" borderRadius="4px" fontSize="10px" px="1.5">
              {selected.length}
            </Badge>
          )}
          <Box as={LuChevronDown} boxSize="3.5" />
        </Button>
      </MenuTrigger>
      <MenuContent
        bg="rgba(19,19,22,0.98)"
        border="1px solid"
        borderColor="var(--story-border)"
        borderRadius="8px"
        minW="52"
        maxH="72"
        overflowY="auto"
        p="1"
        zIndex="popover"
      >
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <MenuItem
              key={option}
              value={option}
              onClick={() => toggle(option)}
              bg={isSelected ? "rgba(83,224,255,0.12)" : "transparent"}
              color={isSelected ? "var(--story-secondary-soft)" : "var(--story-text)"}
              _hover={{ bg: "rgba(83,224,255,0.08)" }}
              borderRadius="6px"
              fontSize="sm"
              px="3"
              py="2"
            >
              <Flex align="center" gap="2" w="full">
                <Box
                  w="3.5"
                  h="3.5"
                  borderRadius="3px"
                  border="1px solid"
                  borderColor={isSelected ? "var(--story-secondary)" : "var(--story-border)"}
                  bg={isSelected ? "var(--story-secondary)" : "transparent"}
                />
                {option}
              </Flex>
            </MenuItem>
          );
        })}
      </MenuContent>
    </MenuRoot>
  );
}

export default function FilterBar({ filters, options, filteredCount, totalCount, activeTags, onChange, onReset }: Props) {
  const hasFilters = activeTags.length > 0;

  return (
    <Box
      className="story-surface"
      borderRadius="10px"
      px={{ base: 4, md: 5 }}
      py={{ base: 4, md: 4 }}
      position="sticky"
      top={{ base: 3, md: 4 }}
      zIndex="sticky"
      backdropFilter="blur(12px)"
    >
      <Flex justify="space-between" align={{ base: "flex-start", lg: "center" }} gap="4" mb="4" flexDirection={{ base: "column", lg: "row" }}>
        <Box>
          <Text className="story-eyebrow" mb="2">
            Pressure-test the story
          </Text>
          <Text color="var(--story-text)" fontSize={{ base: "md", md: "lg" }} fontWeight="600">
            {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} rendered records in this slice.
          </Text>
          <Text color="var(--story-text-muted)" fontSize="sm" mt="1">
            Filters change the evidence. They do not magically rescue a bad claim.
          </Text>
        </Box>

        {hasFilters && (
          <Wrap gap="2" justify={{ base: "flex-start", lg: "flex-end" }}>
            {activeTags.slice(0, 6).map((tag) => (
              <Box key={tag} className="story-chip">
                {tag}
              </Box>
            ))}
          </Wrap>
        )}
      </Flex>

      <Wrap gap="2" align="center">
        <MultiSelect label="Year" options={options.years} selected={filters.years} onChange={(value) => onChange({ ...filters, years: value })} />
        <MultiSelect label="Country" options={options.countries} selected={filters.countries} onChange={(value) => onChange({ ...filters, countries: value })} />
        <MultiSelect label="Career stage" options={options.careerStages} selected={filters.careerStages} onChange={(value) => onChange({ ...filters, careerStages: value })} />
        <MultiSelect label="Role" options={options.roleTypes} selected={filters.roleTypes} onChange={(value) => onChange({ ...filters, roleTypes: value })} />
        <MultiSelect label="Industry" options={options.industries} selected={filters.industries} onChange={(value) => onChange({ ...filters, industries: value })} />
        <MultiSelect label="Education" options={options.educations} selected={filters.educations} onChange={(value) => onChange({ ...filters, educations: value })} />

        <Flex
          align="center"
          gap="2"
          px="3"
          h="9"
          bg={filters.remoteOnly ? "rgba(255,122,26,0.12)" : "rgba(19,19,22,0.94)"}
          borderRadius="6px"
          border="1px solid"
          borderColor={filters.remoteOnly ? "var(--story-tertiary)" : "var(--story-border)"}
        >
          <Text fontFamily="Space Grotesk, Inter, sans-serif" fontSize="xs" letterSpacing="0.08em" textTransform="uppercase" color={filters.remoteOnly ? "var(--story-tertiary-soft)" : "var(--story-text)"}>
            Remote only
          </Text>
          <Switch checked={filters.remoteOnly} onCheckedChange={(event) => onChange({ ...filters, remoteOnly: event.checked })} />
        </Flex>

        {hasFilters && (
          <Button
            size="sm"
            variant="ghost"
            color="var(--story-text-muted)"
            _hover={{ color: "var(--story-text)", bg: "rgba(255,255,255,0.04)" }}
            onClick={onReset}
            fontSize="xs"
            h="9"
            px="3"
            borderRadius="6px"
            gap="1.5"
            fontFamily="Space Grotesk, Inter, sans-serif"
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            <Box as={LuFilterX} boxSize="3.5" />
            Reset slice
          </Button>
        )}
      </Wrap>
    </Box>
  );
}
