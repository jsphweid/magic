import * as GraphQL from "graphql";
import gql from "graphql-tag";

import * as Operation from "./index";

describe("translating messages into GraphQL operations", () => {
  describe("translating basic queries", () => {
    test("translates a basic query", () => {
      messageBecomesOperation(
        "hello",
        gql`
          {
            hello
          }
        `
      );
    });
  });

  describe("parsing args", () => {
    test("args are all null", () => {
      messageBecomesOperation(
        "Has args",
        gql`
          {
            hasArgs(string: null, int: null, float: null)
          }
        `
      );
    });

    test("no args are null", () => {
      messageBecomesOperation(
        "Has args string this is a string int 123 float 1.23",
        gql`
          {
            hasArgs(string: "this is a string", int: 123, float: 1.23)
          }
        `
      );
    });

    test("some args are null", () => {
      messageBecomesOperation(
        "Has args int 123 float 1.23",
        gql`
          {
            hasArgs(string: null, int: 123, float: 1.23)
          }
        `
      );
    });

    test("arg order is preserved", () => {
      messageBecomesOperation(
        "Has args float 1.23 string this is a string int 123",
        gql`
          {
            hasArgs(string: "this is a string", int: 123, float: 1.23)
          }
        `
      );

      messageBecomesOperation(
        "Has args int 123 float 1.23 string this is a string",
        gql`
          {
            hasArgs(string: "this is a string", int: 123, float: 1.23)
          }
        `
      );
    });
  });
});

const messageBecomesOperation = (
  message: string,
  operation: GraphQL.DocumentNode
) => {
  expect(GraphQL.print(Operation.fromMessage(schema, message))).toEqual(
    GraphQL.print(operation)
  );
};

const schema = GraphQL.buildASTSchema(gql`
  type Query {
    hello: String
    hasArgs(string: String, int: Int, float: Float): Int
  }

  type Mutation {
    mutate: String
  }
`);
