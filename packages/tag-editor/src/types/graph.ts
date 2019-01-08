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
  from: ID;
  to: ID;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}
