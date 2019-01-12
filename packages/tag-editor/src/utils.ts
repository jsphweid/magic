import { RawTag } from "../__generatedTypes__";
import { Edge, Tag } from "./types";

export function makeEdgeId(fromId: string, toId: string): string {
  return `${fromId}___${toId}`;
}

export function parseEdgeId(edgeId: string): { fromId: string; toId: string } {
  const ids = edgeId.split("___");
  return { fromId: ids[0], toId: ids[1] };
}

export function deriveEdgesFromTags(tags: Tag[]): Edge[] {
  const edges: Edge[] = [];

  tags.forEach(tag => {
    tag.immediateConnections.forEach(c => {
      edges.push({
        id: makeEdgeId(tag.ID, c.toId),
        from: tag.ID,
        to: c.toId,
        dashes: c.isLoading
      });
    });
  });

  return edges;
}

export function convertRawTagToTag(rawTag: RawTag): Tag {
  return {
    ID: rawTag.ID,
    name: rawTag.name,
    aliases: rawTag.aliases,
    score: rawTag.score,
    immediateConnections: rawTag.connections.map(c => ({
      toId: c.ID,
      isLoading: false
    }))
  };
}

export function cloneObj<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
