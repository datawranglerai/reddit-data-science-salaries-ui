import { Box, Link, Text, VStack } from "@chakra-ui/react";
import type { QuoteCandidate } from "../../types";

interface Props {
  quotes: QuoteCandidate[];
  hasActiveFilters: boolean;
}

function QuoteCard({ quote }: { quote: QuoteCandidate }) {
  return (
    <Box className="story-surface-quiet" borderRadius="10px" p="5" position="relative">
      <Text className="story-eyebrow" color="var(--story-reddit)" mb="3">
        r/datascience · {quote.year} · {quote.upvotes} upvotes
      </Text>
      <Text fontSize={{ base: "lg", md: "xl" }} lineHeight="1.6" color="var(--story-text)">
        “{quote.quote}”
      </Text>
      <Text mt="4" color="var(--story-text-muted)" fontSize="sm">
        {quote.title}{quote.companyIndustry ? ` · ${quote.companyIndustry}` : ""}{quote.location ? ` · ${quote.location}` : ""}
      </Text>
      {quote.commentUrl && (
        <Text mt="2" color="var(--story-secondary)" fontSize="sm" fontWeight="600">
          <Link href={quote.commentUrl} target="_blank" rel="noreferrer">
            View source thread →
          </Link>
        </Text>
      )}
    </Box>
  );
}

export default function ThreadPullout({ quotes, hasActiveFilters }: Props) {
  if (!quotes.length) {
    return (
      <Box className="story-surface-quiet" borderRadius="10px" p="5">
        <Text className="story-eyebrow" color="var(--story-reddit)" mb="3">
          Source context fallback
        </Text>
        <Text color="var(--story-text)" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.5">
          This slice is too thin for a quote worth leaning on.
        </Text>
        <Text mt="3" color="var(--story-text-muted)" fontSize="sm" lineHeight="1.7">
          {hasActiveFilters
            ? "The broader story may still hold, but this slice falls back to metadata instead of pretending one comment can carry the whole market."
            : "These thread voices are here for texture, not proof. When a quote is weak or noisy, context beats theatrics."}
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="4">
      {quotes.map((quote) => (
        <QuoteCard key={`${quote.commentUrl}-${quote.year}`} quote={quote} />
      ))}
    </VStack>
  );
}
