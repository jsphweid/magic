import { either as Either } from "fp-ts";
import * as GraphQL from "graphql";
import * as Runtime from "io-ts";

import * as Utility from "../../../Utility";

export const unsafeDecode = <A, O>(data: Runtime.Type<A, O>) => (
  value: unknown
): A =>
  data
    .decode(value)
    .getOrElseL(errors => Utility.throwError(new Error(errors.join("\n"))));

export const unsafeDecodeLiteral = <A, O>(data: Runtime.Type<A, O>) => (
  literal: GraphQL.ValueNode
) =>
  literal.kind === GraphQL.Kind.INT ||
  literal.kind === GraphQL.Kind.FLOAT ||
  literal.kind === GraphQL.Kind.STRING
    ? unsafeDecode(data)(literal.value)
    : Utility.throwError(
        new GraphQL.GraphQLError(
          `"${literal.kind}" must be an \`Int\`, \`Float\`, or \`String\``
        )
      );

export const runtimeStringOrNumber = (
  data: unknown,
  context: Runtime.Context
) =>
  Runtime.union([Runtime.string, Runtime.number])
    .validate(data, context)
    .map<Either.Either<string, number>>(stringOrNumber => {
      const asString = `${stringOrNumber}`;
      const asNumber = parseFloat(asString);
      return isNaN(asNumber) ? Either.left(asString) : Either.right(asNumber);
    });
