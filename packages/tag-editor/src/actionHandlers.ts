import { ActionHandlerTypes } from "react-graph-db-editor";
import {
  CreateTag,
  CreateTagVariables,
  DeleteTag,
  DeleteTagVariables,
  UpdateTag,
  UpdateTagVariables
} from "../__GeneratedCode__";
import client from "./graphql/client";

import CreateTagMutation from "./graphql/queries/CreateTag";
import DeleteTagMutation from "./graphql/queries/DeleteTag";
import UpdateTagMutation from "./graphql/queries/UpdateTag";

type MyCustomAttributes = {
  aliases: string[];
  score: number;
};

export const addNode: ActionHandlerTypes.AddNodeHandler<
  MyCustomAttributes
> = async () => {
  return client
    .mutate<CreateTag, CreateTagVariables>({
      mutation: CreateTagMutation,
      variables: { name: "temp" }
    })
    .then(response => {
      const { aliases, ID, score } = response.data.Tag.create;
      return { aliases, id: ID, score };
    });
};

export const updateNode: ActionHandlerTypes.UpdateNodeHandler<
  MyCustomAttributes
> = async (id, updates) => {
  return client
    .mutate<UpdateTag, UpdateTagVariables>({
      mutation: UpdateTagMutation,
      variables: {
        ID: `${id}`,
        name: updates.label,
        aliases: updates.aliases,
        score: updates.score
      }
    })
    .then(response => {
      const { ID, name, aliases, score } = response.data.Tag.update;
      return {
        id: ID,
        label: name,
        aliases,
        score
      };
    });
};

export const addEdge: ActionHandlerTypes.AddEdgeHandler = async (
  edge,
  existingConnections
) => {
  const currentConnections = existingConnections.map(e => `${e.to}`);
  return client
    .mutate<UpdateTag, UpdateTagVariables>({
      mutation: UpdateTagMutation,
      variables: {
        ID: `${edge.from}`,
        connections: [...currentConnections, `${edge.to}`]
      }
    })
    .then(() => edge);
};

export const updateEdge: ActionHandlerTypes.UpdateEdgeHandler = async (
  id,
  newEdge,
  oldEdge,
  existingConnections
) => {
  const currentConnections = existingConnections
    .filter(e => e.id !== oldEdge.id)
    .map(e => `${e.to}`);

  return client
    .mutate<UpdateTag, UpdateTagVariables>({
      mutation: UpdateTagMutation,
      variables: {
        ID: `${id}`,
        connections: [...currentConnections, `${newEdge.to}`]
      }
    })
    .then(() => newEdge);
};

export const deleteEdge: ActionHandlerTypes.DeleteEdgeHandler = async (
  edge,
  existingConnections
) => {
  const newConnections = existingConnections
    .filter(e => edge.to !== e.to)
    .map(e => `${e.to}`);

  return client
    .mutate<UpdateTag, UpdateTagVariables>({
      mutation: UpdateTagMutation,
      variables: {
        ID: `${edge.from}`,
        connections: newConnections
      }
    })
    .then(() => true);
};

export const deleteNode: ActionHandlerTypes.DeleteNodeHandler = async id => {
  return client
    .mutate<DeleteTag, DeleteTagVariables>({
      mutation: DeleteTagMutation,
      variables: {
        id: `${id}`
      }
    })
    .then(() => true);
};
