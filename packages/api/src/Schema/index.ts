import gql from "graphql-tag";
import * as GraphQL from "graphql";
import Moment from "moment";

import * as Query from "./Query";
import * as Mutation from "./Mutation";
import * as Interval from "./Interval";
import * as Duration from "./Duration";
import * as Time from "./Time";
import * as Narrative from "./Narrative";
import * as Tag from "./Tag";
import * as TagOccurrence from "./TagOccurrence";

export const source = gql`
  ${GraphQL.print(Query.schema)}
  ${GraphQL.print(Mutation.schema)}

  interface HasInterval {
    interval: Interval!
  }

  ${GraphQL.print(Interval.schema)}
  ${GraphQL.print(Duration.schema)}

  ${GraphQL.print(Time.schema)}

  interface Node {
    id: ID!
  }

  ${GraphQL.print(Narrative.schema)}

  ${GraphQL.print(Tag.schema)}
  ${GraphQL.print(TagOccurrence.schema)}

  scalar Date
`;

// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
export const resolvers: any = {
  Query: Query.resolvers,
  Mutation: Mutation.resolvers,
  Interval: Interval.resolvers,
  Duration: Duration.resolvers,

  Node: { __resolveType: () => "Node" },
  HasInterval: { __resolveType: () => "HasInterval" },

  Date: new GraphQL.GraphQLScalarType({
    name: "Date",

    serialize: (value: Moment.Moment): number => value.valueOf(),

    parseValue: (value: string): Moment.Moment | undefined => parseDate(value),

    parseLiteral: (ast: GraphQL.ValueNode): Moment.Moment | undefined => {
      if (ast.kind === GraphQL.Kind.INT || ast.kind === GraphQL.Kind.FLOAT) {
        return Moment(ast.value);
      }

      if (ast.kind === GraphQL.Kind.STRING) {
        return;
      }
    }
  })
};

const parseDate = (date: string): Moment.Moment | undefined => {
  if (
    Moment(date, Moment.ISO_8601).isValid() ||
    Moment(date, Moment.RFC_2822).isValid()
  ) {
    return Moment(date);
  }

  console.log(date);

  const [value, unit, tense] = date.split(" ");

  const timeFromNow = value as Moment.DurationInputArg1;
  const timeUnit = unit as Moment.DurationInputArg2;

  return ["from", "ahead"].includes(tense || "ago")
    ? Moment().add(timeFromNow, timeUnit)
    : Moment().subtract(timeFromNow, timeUnit);
};
