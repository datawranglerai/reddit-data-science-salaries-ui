import { Box, List, Text } from "@chakra-ui/react";

export default function MethodologyBlock() {
  return (
    <Box className="story-surface-quiet" borderRadius="10px" p={{ base: 5, md: 6 }}>
      <Text className="story-eyebrow" mb="3">
        Methodology / caveats
      </Text>
      <Text className="story-display" fontSize={{ base: "1.75rem", md: "2.4rem" }} lineHeight="1" mb="4">
        Discussion data is useful — but it isn’t payroll truth.
      </Text>
      <List.Root gap="3" color="var(--story-text-muted)">
        <List.Item>
          Salaries are community-reported and may be incomplete, selective, or embellished.
        </List.Item>
        <List.Item>
          USD figures are normalized using approximate exchange rates, which is enough for narrative comparison but not precise compensation accounting.
        </List.Item>
        <List.Item>
          Strong claims are deliberately suppressed when filtered sample sizes get too small.
        </List.Item>
        <List.Item>
          Reddit excerpts are treated as source texture. If they are weak, sparse, or too anecdotal, the UI falls back to metadata instead.
        </List.Item>
      </List.Root>
    </Box>
  );
}
