type ID = string | number;

export interface Node {
  id: ID;
  label: string;
  color?: string;
  x?: number;
  y?: number;
}

export interface Edge {
  from: ID;
  to: ID;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}
