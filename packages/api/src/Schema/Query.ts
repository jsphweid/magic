import gql from "graphql-tag";

import * as Utility from "../Utility";
import * as Context from "./Context";
import * as History from "./History";
import * as Time from "./Time";

export const schema = gql`
  type Query {
    history(start: Date, duration: Duration, stop: Date): History!
  }
`;

export const resolve = {
  history: async (
    _source: undefined,
    args: Time.SelectionGraphQLArgs,
    context: Context.Context
  ): Promise<History.History> =>
    History.getFromTimeSelection(
      context,
      Time.selectionFromGraphQLArgs(args).getOrElseL(Utility.throwError)
    )
};
