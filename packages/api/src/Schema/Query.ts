import gql from "graphql-tag";

import { Resolvers } from "../../GeneratedCode";
import { passThroughResolver } from "../Utility";

export const typeDefs = gql`
  type Query {
    Tag: Tag__Query!
    Narrative: Narrative__Query!
  }
`;

export const resolvers: Resolvers = {
  Query: {
    Tag: passThroughResolver,
    Narrative: passThroughResolver
  }
};
