import { either as Either } from "fp-ts";

export type Result<T> = Either.Either<Error, T>;

export const success = Either.right;

export const error = <T>(message: string): Result<T> =>
  Either.left(new Error(message));
