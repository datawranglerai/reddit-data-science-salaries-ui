import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import type { ProcessedRecord } from "../../types";
import { fmtK } from "../../utils/dataUtils";
import { getCountryNarrative, getStorySummary } from "../../utils/storyData";

interface Props {
  records: ProcessedRecord[];
}

export default function SalaryByCountry({ records }: Props) {
  const data = getCountryNarrative(records);
  const summary = getStorySummary(records);
  const maxMedian = Math.max(...data.map((item) => item.median), 1);

  return (
    <Box className="story-surface" borderRadius="12px" p={{ base: 5, md: 6 }}>
      <Text className="story-eyebrow" mb="3">
        Geography / ceiling check
      </Text>
      <Text className="story-display" fontSize={{ base: "1.8rem", md: "2.35rem" }} lineHeight="1" mb="3">
        Geography still warps the market, even after the USD cleanup.
      </Text>
      <Text color="var(--story-text-muted)" fontSize="md" lineHeight="1.7" mb="5">
        Converting everything to dollars helps. It does not magically turn this into one neat global pay table.
      </Text>

      <VStack align="stretch" gap="4">
        {data.map((item) => (
          <Box key={item.country}>
            <Flex justify="space-between" gap="4" mb="2" align="baseline" flexWrap="wrap">
              <Text color="var(--story-text)" fontWeight="700" fontSize="sm">
                {item.country}
              </Text>
              <Text color="var(--story-primary-soft)" fontWeight="700" fontSize="sm">
                {fmtK(item.median)} · n={item.count}
              </Text>
            </Flex>
            <Box h="10px" bg="rgba(255,255,255,0.05)" borderRadius="999px" overflow="hidden" position="relative">
              <Box h="full" width={`${(item.median / maxMedian) * 100}%`} bg="linear-gradient(90deg, var(--story-primary), var(--story-secondary))" borderRadius="999px" />
              {summary.medianBase && (
                <Box position="absolute" left={`${(summary.medianBase / maxMedian) * 100}%`} top="-2px" bottom="-2px" w="2px" bg="var(--story-warning)" />
              )}
            </Box>
          </Box>
        ))}
      </VStack>

      {summary.medianBase && (
        <Text mt="4" color="var(--story-text-muted)" fontSize="sm">
          Overall median in this slice: <Box as="span" color="var(--story-warning)" fontWeight="700">{fmtK(summary.medianBase)}</Box>
        </Text>
      )}
    </Box>
  );
}
