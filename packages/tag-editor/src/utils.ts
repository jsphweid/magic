import { RawTag } from "../__generatedTypes__";
import { Edge, Tag } from "./types";

export function deriveEdgesFromTags(tags: Tag[]): Edge[] {
  const edges: Edge[] = [];

  tags.forEach(tag => {
    tag.immediateConnections.forEach(id => {
      edges.push({ from: tag.ID, to: id });
    });
  });

  return edges;
}

export function rawTagToTag(rawTag: RawTag): Tag {
  return {
    ID: rawTag.ID,
    name: rawTag.name,
    aliases: rawTag.aliases,
    score: rawTag.score,
    immediateConnections: rawTag.connections.map(c => c.ID)
  };
}

export function cloneObj<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
