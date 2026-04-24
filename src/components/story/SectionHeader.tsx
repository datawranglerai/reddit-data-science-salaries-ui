import { Box, Text } from "@chakra-ui/react";

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}

export default function SectionHeader({ eyebrow, title, description, align = "left" }: Props) {
  return (
    <Box textAlign={align} maxW={align === "center" ? "760px" : "620px"}>
      <Text className="story-eyebrow" mb="3">
        {eyebrow}
      </Text>
      <Text
        className="story-display"
        fontSize={{ base: "1.9rem", md: "2.7rem" }}
        lineHeight="0.98"
        letterSpacing="-0.035em"
        color="var(--story-text)"
        mb="4"
      >
        {title}
      </Text>
      <Text color="var(--story-text-muted)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.65" maxW="54ch">
        {description}
      </Text>
    </Box>
  );
}
