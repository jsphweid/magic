export * from "./graph";

interface Connection {
  toId: string;
  isLoading: boolean;
}

export interface Tag {
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  immediateConnections: Connection[];
}
