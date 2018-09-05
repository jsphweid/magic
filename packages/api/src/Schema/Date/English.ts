import Moment from "moment";

import { either as Either } from "fp-ts";

// 5 days ago
// 1 hour from now
// in five minutes
export const toDate = (english: string): Either.Either<Error, Moment.Moment> =>
  english === "now"
    ? Either.right(Moment())
    : englishToWords(english).chain(words =>
        wordToTense(words.tense).chain(tense =>
          wordToUnit(words.unit).chain(unit =>
            wordToAmount(words.amount).chain(amount =>
              Either.right(
                tense === "past"
                  ? Moment().subtract(amount, unit)
                  : Moment().add(amount, unit)
              )
            )
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
  return word3
    ? Either.right(
        word1 === "in"
          ? { amount: word2, unit: word3, tense: "later" } // e.g. in two minutes
          : { amount: word1, unit: word2, tense: word3 } // e.g. 15 minutes later
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
  const numberFromWord = wordsToNumbers[word];
  const amount =
    numberFromWord === undefined ? parseFloat(word) : numberFromWord;

  return !isNaN(amount)
    ? Either.right(amount)
    : Either.left(new Error(`${amount} is not a number.`));
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
  nine: 9
};

type Unit = Moment.DurationInputArg2;

const wordToUnit = (word: string): Either.Either<Error, Unit> =>
  units.includes(word.toLowerCase())
    ? Either.right(word as Unit)
    : Either.left(new Error(`"${word}" is not a valid unit of time.`));

const units = [
  "year years y",
  "quarter quarters q",
  "month months M",
  "week weeks w",
  "day days d",
  "hour hours h",
  "minute minutes m",
  "second seconds s",
  "millisecond milliseconds ms"
].join("");
