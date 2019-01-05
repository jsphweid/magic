import { Edge, Tag } from "./types";

export function deriveEdgesFromTags(tags: Tag[]): Edge[] {
  const edges: Edge[] = [];

  function catalogAssociations(tag: Tag): void {
    if (tag.connections.length) {
      tag.connections.forEach(connectedTag => {
        edges.push({ from: tag.ID, to: connectedTag.ID });
        catalogAssociations(connectedTag as Tag);
      });
    }
  }

  tags.forEach(tag => {
    catalogAssociations(tag);
  });

  return edges;
}
