type ID = string | number;

export interface NodeInput {
  label: string;
  color?: string;
  x?: number;
  y?: number;
}

export interface Node extends NodeInput {
  id: ID;
}

export interface Edge {
  id: string;
  from: ID;
  to: ID;
  dashes?: boolean;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}
