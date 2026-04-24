import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import type { ProcessedRecord } from "../../types";
import { fmtK } from "../../utils/dataUtils";
import { getRoleNarrative } from "../../utils/storyData";

interface Props {
  records: ProcessedRecord[];
}

const ROLE_COLORS: Record<string, string> = {
  "Data Scientist": "var(--story-primary)",
  "ML Engineer": "var(--story-secondary)",
  "Data Analyst": "var(--story-tertiary)",
  "Data Engineer": "#ff8e8e",
  Leader: "#d7a8ff",
  Other: "var(--story-text-muted)",
};

export default function RolePayComparison({ records }: Props) {
  const data = getRoleNarrative(records);
  const maxMedian = Math.max(...data.map((item) => item.median), 1);

  return (
    <Box className="story-surface" borderRadius="12px" p={{ base: 5, md: 6 }}>
      <Text className="story-eyebrow" mb="3">
        Who captured the upside
      </Text>
      <Text className="story-display" fontSize={{ base: "1.8rem", md: "2.4rem" }} lineHeight="1" mb="3">
        Leadership and ML roles pull the ceiling upward.
      </Text>
      <Text color="var(--story-text-muted)" fontSize="md" lineHeight="1.7" mb="5">
        This is the cleaner replacement for the old donut. It tells you where the money sits and how much of the sample each role type actually owns.
      </Text>

      <VStack align="stretch" gap="4">
        {data.map((item) => (
          <Box key={item.role}>
            <Flex justify="space-between" gap="4" mb="2" align="baseline" flexWrap="wrap">
              <Text color="var(--story-text)" fontWeight="700" fontSize="sm">
                {item.role}
              </Text>
              <Text color={ROLE_COLORS[item.role] || "var(--story-text-muted)"} fontWeight="700" fontSize="sm">
                {fmtK(item.median)} · {item.share}% of sample · n={item.count}
              </Text>
            </Flex>
            <Box h="10px" bg="rgba(255,255,255,0.05)" borderRadius="999px" overflow="hidden">
              <Box h="full" bg={ROLE_COLORS[item.role] || "var(--story-text-muted)"} width={`${(item.median / maxMedian) * 100}%`} borderRadius="999px" />
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
