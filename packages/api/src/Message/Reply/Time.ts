export const toString = ({
  interval: {
    start: { formatted }
  },
  narratives,
  tagOccurrences
}: {
  interval: {
    start: { formatted: string };
  };
  narratives: Array<{ description: string }>;
  tagOccurrences: Array<{ tag: { name: string } }>;
}): string => {
  const [narrative] = narratives;
  const tags = tagOccurrences.map(({ tag: { name } }) =>
    name
      .split("-")
      .map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
      .join(" ")
  );

  if (!narrative && tags.length === 0) {
    return "Nothing is being tracked!";
  }

  return `
    ${formatted} – ${
    narrative ? `${narrative.description}` : "No narrative is active!"
  }

    ${tags.length > 0 ? `Tags: ${tags.join(", ")}` : "No tags are active!"}
  `
    .replace(/    /g, "")
    .trim();
};
