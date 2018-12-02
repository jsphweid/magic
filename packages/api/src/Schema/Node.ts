import DataLoader from "dataloader";
import { firestore as Firestore } from "firebase";
import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import * as Runtime from "io-ts";
import Moment from "moment";

import { type } from "os";
import * as Result from "../Result";
import * as Time from "./Time";

export const schema = gql`
  interface Node {
    ID: ID!
    metadata: Node__Metadata!
  }

  type Node__Metadata {
    created: Time__FormattedDate!
    updated: Time__FormattedDate!
  }
`;

const metadata = Runtime.exact(
  Runtime.interface({
    created: Time.dateTime,
    updated: Time.dateTime
  })
);

export type Node = Runtime.TypeOf<typeof node>;

const node = Runtime.exact(
  Runtime.interface({
    ID: Runtime.string,
    metadata
  })
);

export interface Metadata {
  created: Time.DateTime;
  updated: Time.DateTime;
}

export const resolvers = {
  Node: {
    __resolveType: () => "Node"
  }
};

export const loader = <T extends Node>(
  DB: Firestore.Firestore,
  collectionName: string,
  type: RuntimeType.Type<T>
): DataLoader<string, Result.Result<T>> =>
  new DataLoader(async keys => {
    const results = new Map<string, Result.Result<T>>();
    await Promise.all(
      keys.map(async key => {
        try {
          const document = await DB.collection(collectionName)
            .doc(key)
            .get();

          const result = Option.fromNullable(document.data()).map(data => ({
            ID: document.id,
            metadata: {
              created: Moment(),
              updated: Moment()
            }
          }));

          results.set(
            key,
            result
              .map(Result.success)
              .getOrElse(
                Result.error(
                  `No data exists for "${
                    document.id
                  }" in \'${collectionName}\'.`
                )
              )
          );
        } catch (error) {
          results.set(key, Result.error(error));
        }
      })
    );

    // We know the `get` will never be undefined
    return keys.map(key => tags.get(key) as Result);
  });
