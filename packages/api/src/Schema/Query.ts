import gql from "graphql-tag";

import * as Utility from "../Utility";
import * as Context from "./Context";
import * as History from "./History";
import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type Query {
    history(time: Time__Selection!, tags: Tag__Selection): History!
  }
`;

export const resolve = {
  history: async (
    _source: undefined,
    args: {
      time: Time.SelectionGraphQLArgs;
      tags: Tag.SelectionGraphQLArgs | null;
    },
    context: Context.Context
  ): Promise<History.History> =>
    History.getFromSelection(context, {
      time: Time.selectionFromGraphQLArgs(args.time).getOrElseL(
        Utility.throwError
      ),
      tags: Tag.selectionFromGraphQLArgs(args.tags).getOrElseL(
        Utility.throwError
      )
    })
};
