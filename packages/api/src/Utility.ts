import { option as Option } from "fp-ts";

export const throwError = (error: Error) => {
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
