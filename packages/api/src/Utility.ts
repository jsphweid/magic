import { option as Option } from "fp-ts";
import _ from "lodash";
import * as UUID from "uuid";

export const throwError = (error: Error) => {
  // tslint:disable-next-line:no-console
  console.log(error);

  throw error;
};

export const trim = (strings: TemplateStringsArray, ...args: any[]): string => {
  const string = strings
    .map(
      (string, index) =>
        `${string}${Option.fromNullable(args[index]).getOrElse("")}`
    )
    .join("");

  const indent = Option.fromNullable(string.match(/ +/))
    .map(spaces => spaces[0])
    .getOrElse("");

  return string.replace(new RegExp(indent, "g"), "").trim();
};

export const makeRandomUniqueID = (): string => UUID.v4();

export const passThroughResolver = () => ({} as any);
