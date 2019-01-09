export * from "./graph";

export interface Tag {
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  immediateConnections: string[];
}
