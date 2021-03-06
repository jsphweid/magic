import * as GraphQL from "graphql";
import Moment from "moment";

import * as Utility from "../../Utility";
import * as English from "./English";
import * as Time from "./index";

export const resolvers = {
  Time__Duration: new GraphQL.GraphQLScalarType({
    name: "Time__Duration",
    serialize: (value: Time.Duration): number => value.asMilliseconds(),
    parseValue: (value: string): Time.Duration => parse(value),
    parseLiteral: (valueNode: GraphQL.ValueNode): Time.Duration =>
      valueNode.kind === GraphQL.Kind.INT ||
      valueNode.kind === GraphQL.Kind.FLOAT
        ? Moment.duration(parseFloat(valueNode.value), "ms")
        : valueNode.kind === GraphQL.Kind.STRING
        ? parse(valueNode.value, valueNode)
        : Utility.throwError(
            new GraphQL.GraphQLError(
              `"${valueNode.kind}" must be an \`Int\`, \`Float\`, or \`String\``
            )
          )
  })
};

const parse = (source: string, valueNode?: GraphQL.ValueNode): Time.Duration =>
  English.toDuration(source).getOrElseL(error =>
    Utility.throwError(new GraphQL.GraphQLError(error.message, valueNode))
  );
