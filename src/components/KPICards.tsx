import { Box, Grid, Text } from "@chakra-ui/react";

interface Fact {
  label: string;
  value: string;
  note: string;
}

interface Props {
  facts: Fact[];
}

export default function KPICards({ facts }: Props) {
  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="4">
      {facts.map((fact, index) => (
        <Box key={fact.label} className="story-surface-quiet" borderRadius="10px" p="5" position="relative" overflow="hidden">
          <Box position="absolute" top="0" left="0" right="0" h="2px" bg={index === 1 ? "var(--story-secondary)" : "var(--story-primary)"} />
          <Text className="story-eyebrow" mb="3">
            {fact.label}
          </Text>
          <Text className={index === 1 ? "story-display story-glow-secondary" : "story-display story-glow-primary"} fontSize={{ base: "2rem", md: "2.4rem" }} lineHeight="0.95">
            {fact.value}
          </Text>
          <Text mt="2" color="var(--story-text-muted)" fontSize="sm" lineHeight="1.6">
            {fact.note}
          </Text>
        </Box>
      ))}
    </Grid>
  );
}
