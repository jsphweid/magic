import Moment from "moment";

import { either as Either } from "fp-ts";

/*
  Parse english date expressions into a `Moment` object, i.e.
  "now", "5 days ago", "1 hour from now", "twelve days later", etc.
*/
export const toDate = (english: string): Either.Either<Error, Moment.Moment> =>
  english === "now"
    ? Either.right(Moment())
    : /*
        Parse everything needed to create a `Moment` object starting from the
        current time or a reason for failure with an `Error`
      */
      englishToWords(english).chain(words =>
        wordToTense(words.tense).chain(tense =>
          wordToUnit(words.unit).chain(unit =>
            wordToAmount(words.amount).chain(amount => {
              const now = Moment().utcOffset(`${process.env.TIME_UTC_OFFSET}`);
              return Either.right(
                tense === "past"
                  ? now.subtract(amount, unit)
                  : now.add(amount, unit)
              );
            })
          )
        )
      );

const englishToWords = (
  english: string
): Either.Either<
  Error,
  {
    tense: string;
    amount: string;
    unit: string;
  }
> => {
  const [word1, word2, word3] = english.split(" ");
  return word3 // At least three words are required
    ? Either.right(
        word1 === "in"
          ? // e.g. "in two minutes"
            { amount: word2, unit: word3, tense: "later" }
          : // e.g. "15 minutes later"
            { amount: word1, unit: word2, tense: word3 }
      )
    : Either.left(
        new Error(
          `"${english}" needs to look like "five minutes ago", "in 1 hour", "30 seconds ahead", etc.`
        )
      );
};

type Tense = "past" | "future";

const wordToTense = (word: string): Either.Either<Error, Tense> =>
  ["earlier", "ago", "prior"].includes(word)
    ? Either.right("past" as Tense)
    : ["from", "ahead", "later"].includes(word)
      ? Either.right("future" as Tense)
      : Either.left(
          new Error(`Not sure if "${word}" is past or future tense.`)
        );

const wordToAmount = (word: string): Either.Either<Error, number> => {
  // Use the english version of a word (i.e. "two") or attempt parsing it
  const numberFromWord = wordsToNumbers[word];
  const amount =
    numberFromWord === undefined ? parseFloat(word) : numberFromWord;

  return !isNaN(amount)
    ? Either.right(amount)
    : Either.left(new Error(`"${word}" is not a number.`));
};

const wordsToNumbers: {
  [word: string]: number | undefined;
} = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12
};

type Unit = Moment.DurationInputArg2;

const wordToUnit = (word: string): Either.Either<Error, Unit> =>
  [
    "year years y",
    "quarter quarters q",
    "month months M",
    "week weeks w",
    "day days d",
    "hour hours h",
    "minute minutes m",
    "second seconds s",
    "millisecond milliseconds ms"
  ].find(units => units.includes(word.toLowerCase()))
    ? Either.right(word as Unit)
    : Either.left(new Error(`"${word}" is not a valid unit of time.`));
