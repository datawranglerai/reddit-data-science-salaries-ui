import { Box, List, Text } from "@chakra-ui/react";

export default function MethodologyBlock() {
  return (
    <Box className="story-surface-quiet" borderRadius="10px" p={{ base: 5, md: 6 }}>
      <Text className="story-eyebrow" mb="3">
        Methodology / caveats
      </Text>
      <Text className="story-display" fontSize={{ base: "1.75rem", md: "2.4rem" }} lineHeight="1" mb="4">
        Useful data. Not payroll scripture.
      </Text>
      <List.Root gap="3" color="var(--story-text-muted)">
        <List.Item>
          Salaries are self-reported, which means some are incomplete, some are selective, and a few are probably flattering to the narrator.
        </List.Item>
        <List.Item>
          USD figures use rough exchange-rate normalization. Good enough for comparison. Not good enough for pretending this is payroll accounting.
        </List.Item>
        <List.Item>
          Strong claims get pulled back when filtered sample sizes get too small. No heroic extrapolation.
        </List.Item>
        <List.Item>
          The 2025 slice is the smallest yearly slice in the set. So that jump reads as a live signal, not a new law of physics.
        </List.Item>
        <List.Item>
          Reddit excerpts are here for texture, not proof. If they get too thin or too anecdotal, the UI falls back to metadata instead.
        </List.Item>
      </List.Root>
    </Box>
  );
}
