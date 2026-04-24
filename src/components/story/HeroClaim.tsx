import { Box, Grid, Text, Wrap } from "@chakra-ui/react";

interface HeroFact {
  label: string;
  value: string;
}

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  statLabel: string;
  statValue: string;
  statSubline: string;
  facts: HeroFact[];
  scopeNote?: string;
}

export default function HeroClaim({
  eyebrow,
  title,
  description,
  statLabel,
  statValue,
  statSubline,
  facts,
  scopeNote,
}: Props) {
  return (
    <Box
      className="story-surface"
      borderRadius="12px"
      px={{ base: 5, md: 8 }}
      py={{ base: 6, md: 8 }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="0"
        background="radial-gradient(circle at top right, rgba(83, 224, 255, 0.12), transparent 32%), radial-gradient(circle at bottom left, rgba(183, 109, 255, 0.16), transparent 35%)"
        pointerEvents="none"
      />
      <Grid templateColumns={{ base: "1fr", lg: "minmax(0, 1.3fr) minmax(320px, 0.9fr)" }} gap="8" position="relative">
        <Box>
          <Text className="story-eyebrow" mb="3">
            {eyebrow}
          </Text>
          <Text
            className="story-display story-glow-primary"
            fontSize={{ base: "2.75rem", md: "4.8rem" }}
            lineHeight={{ base: "0.94", md: "0.88" }}
            color="var(--story-text)"
            maxW="10ch"
          >
            {title}
          </Text>
          <Text mt="5" maxW="58ch" color="var(--story-text-muted)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.75">
            {description}
          </Text>

          <Wrap gap="2" mt="6">
            {facts.map((fact) => (
              <Box key={fact.label} className="story-chip">
                <Box className="story-dot" bg="var(--story-reddit)" />
                <span>{fact.label}</span>
                <strong style={{ color: "var(--story-text)" }}>{fact.value}</strong>
              </Box>
            ))}
          </Wrap>
        </Box>

        <Box
          className="story-surface-quiet"
          borderRadius="10px"
          px={{ base: 4, md: 5 }}
          py={{ base: 4, md: 5 }}
          backdropFilter="blur(10px)"
        >
          <Text className="story-eyebrow" mb="3">
            {statLabel}
          </Text>
          <Text className="story-display story-glow-secondary" fontSize={{ base: "3rem", md: "4.5rem" }} lineHeight="0.92" color="var(--story-secondary)">
            {statValue}
          </Text>
          <Text mt="3" color="var(--story-text-muted)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.6">
            {statSubline}
          </Text>
          {scopeNote && (
            <Box mt="5" borderLeft="2px solid" borderColor="var(--story-warning)" pl="4">
              <Text className="story-eyebrow" color="var(--story-warning)" mb="2">
                Filtered scope
              </Text>
              <Text color="var(--story-text-muted)" fontSize="sm" lineHeight="1.6">
                {scopeNote}
              </Text>
            </Box>
          )}
        </Box>
      </Grid>
    </Box>
  );
}
