import gql from "graphql-tag";

import * as Date from "./Date";
import * as Duration from "./Duration";
import * as FormattedDate from "./FormattedDate";
import * as Interval from "./Interval";
import * as Mutation from "./Mutation";
import * as Narrative from "./Narrative";
import * as Query from "./Query";
import * as Tag from "./Tag";
import * as TagOccurrence from "./TagOccurrence";
import * as Time from "./Time";

export const source = gql`
  ${Query.schema}
  ${Mutation.schema}

  interface HasInterval {
    interval: Interval!
  }

  ${Interval.schema}
  ${FormattedDate.schema}
  ${Duration.schema}

  ${Time.schema}

  interface Node {
    ID: ID!
  }

  ${Narrative.schema}

  ${Tag.schema}
  ${TagOccurrence.schema}

  ${Date.schema}
`;

// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
export const resolvers: any = {
  Query: Query.resolve,
  Mutation: Mutation.resolve,

  Time: Time.resolve,
  Tag: Tag.resolve,

  Interval: Interval.resolve,
  FormattedDate: FormattedDate.resolve,
  Duration: Duration.resolve,

  Node: { __resolveType: () => "Node" },
  HasInterval: { __resolveType: () => "HasInterval" },

  Date: Date.resolve
};
