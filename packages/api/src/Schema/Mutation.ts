import gql from "graphql-tag";
import { Resolvers } from "../../GeneratedCode";
import { passThroughResolver } from "../Utility";

export const typeDefs = gql`
  type Mutation {
    Tag: Tag__Mutation!
    Narrative: Narrative__Mutation!
  }
`;

export const resolvers: Resolvers = {
  Mutation: {
    Tag: passThroughResolver,
    Narrative: passThroughResolver
  }
};
