import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import type { ProcessedRecord } from "../../types";
import { fmtK } from "../../utils/dataUtils";
import { getRemoteNarrative } from "../../utils/storyData";

interface Props {
  records: ProcessedRecord[];
}

export default function RemoteGap({ records }: Props) {
  const data = getRemoteNarrative(records);

  return (
    <Box className="story-surface-quiet" borderRadius="10px" p="5">
      <Text className="story-eyebrow" mb="3">
        Remote premium
      </Text>
      <Text className="story-display" fontSize={{ base: "1.5rem", md: "1.9rem" }} lineHeight="1" mb="3">
        Remote work is common. The premium is not clean.
      </Text>
      <Text color="var(--story-text-muted)" fontSize="sm" lineHeight="1.7" mb="4">
        Missing and hybrid labels make this a noisy split. Use it as a tension line, not proof that remote work universally pays more.
      </Text>

      <Grid templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }} gap="3">
        {data.map((item) => (
          <Box key={item.year} border="1px solid" borderColor="rgba(67,61,75,0.5)" borderRadius="8px" p="3">
            <Text className="story-eyebrow" mb="2">{item.year}</Text>
            <Flex justify="space-between" color="var(--story-secondary-soft)" fontSize="xs" mb="1">
              <Text>Remote</Text>
              <Text>{item.remote ? fmtK(item.remote) : "—"}</Text>
            </Flex>
            <Flex justify="space-between" color="var(--story-tertiary-soft)" fontSize="xs">
              <Text>On-site</Text>
              <Text>{item.onsite ? fmtK(item.onsite) : "—"}</Text>
            </Flex>
          </Box>
        ))}
      </Grid>
    </Box>
  );
}
