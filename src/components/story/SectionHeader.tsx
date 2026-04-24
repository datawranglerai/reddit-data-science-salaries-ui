import { Box, Text } from "@chakra-ui/react";

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}

export default function SectionHeader({ eyebrow, title, description, align = "left" }: Props) {
  return (
    <Box textAlign={align} maxW={align === "center" ? "760px" : "640px"}>
      <Text className="story-eyebrow" mb="3">
        {eyebrow}
      </Text>
      <Text
        className="story-display"
        fontSize={{ base: "2rem", md: "3rem" }}
        lineHeight="1"
        color="var(--story-text)"
        mb="4"
      >
        {title}
      </Text>
      <Text color="var(--story-text-muted)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7">
        {description}
      </Text>
    </Box>
  );
}
