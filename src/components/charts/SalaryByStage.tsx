import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import type { ProcessedRecord } from "../../types";
import { fmtK } from "../../utils/dataUtils";
import { getStageNarrative } from "../../utils/storyData";

interface Props {
  records: ProcessedRecord[];
}

export default function SalaryByStage({ records }: Props) {
  const data = getStageNarrative(records);
  const maxValue = Math.max(...data.map((item) => item.p75), 1);

  return (
    <Box className="story-surface" borderRadius="12px" p={{ base: 5, md: 6 }}>
      <Text className="story-eyebrow" mb="3">
        Seniority spread
      </Text>
      <Text className="story-display" fontSize={{ base: "1.8rem", md: "2.4rem" }} lineHeight="1" mb="3">
        Seniority still matters. The spread just gets wider higher up.
      </Text>
      <Text color="var(--story-text-muted)" fontSize="md" lineHeight="1.7" mb="5">
        Each bar shows the P25–P75 range. The square marker is the median. Once you hit lead and manager/director territory, the room for variance gets a lot bigger.
      </Text>

      <VStack align="stretch" gap="5">
        {data.map((item) => {
          const p25 = (item.p25 / maxValue) * 100;
          const p75 = (item.p75 / maxValue) * 100;
          const median = (item.median / maxValue) * 100;
          return (
            <Box key={item.stage}>
              <Flex justify="space-between" gap="4" mb="2" align="baseline" flexWrap="wrap">
                <Text color="var(--story-text)" fontWeight="700" fontSize="sm">
                  {item.stage}
                </Text>
                <Text color="var(--story-text-muted)" fontSize="sm">
                  median {fmtK(item.median)} · n={item.count}
                </Text>
              </Flex>
              <Box position="relative" h="24px" bg="rgba(255,255,255,0.04)" borderRadius="999px">
                <Box position="absolute" left={`${p25}%`} width={`${Math.max(p75 - p25, 3)}%`} top="7px" h="10px" bg="rgba(83,224,255,0.22)" borderRadius="999px" />
                <Box position="absolute" left={`calc(${median}% - 6px)`} top="4px" w="12px" h="16px" bg="var(--story-primary)" borderRadius="3px" />
              </Box>
              <Flex justify="space-between" mt="2" color="var(--story-text-muted)" fontSize="xs">
                <Text>P25 {fmtK(item.p25)}</Text>
                <Text>P75 {fmtK(item.p75)}</Text>
              </Flex>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
