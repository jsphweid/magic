import { either as Either, option as Option } from "fp-ts";
import Moment from "moment";

import * as Time from "../index";

/*
  Parse english date expressions...
  "now", "5 days ago", "1 hour from now", "twelve days later", etc.
*/
export const toDate = (english: string): Either.Either<Error, Time.Date> =>
  "right now immediately instantly at once".includes(english.toLowerCase())
    ? Either.right(Moment())
    : /*
        Parse everything needed to create a `Moment` to, or from, now. If that
        fails then provide the reason in an `Error`
      */
      englishToWords(english).chain(words =>
        wordToTense(words.tense).chain(tense =>
          wordToAmount(words.amount).chain(amount =>
            wordToUnit(words.unit).map(unit =>
              tense === Tense.Past
                ? Moment().subtract(amount, unit)
                : Moment().add(amount, unit)
            )
          )
        )
      );

/*
  Parse english duration expressions...
  "5 days", "1 hour", "twelve days", etc.
*/
export const toDuration = (
  english: string
): Either.Either<Error, Time.Duration> =>
  toDate(`${english} ahead`).map(date =>
    Time.durationFromDates(Moment(), date)
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
  // "one hour ago"
  const [word1, word2, word3] = english.split(" ");

  // At least three words are required
  if (!word3) {
    return Either.left(
      new Error(
        `"${english}" needs to look like "five minutes ago", "in 1 hour", "30 seconds ahead", etc.`
      )
    );
  }

  return Either.right(
    word1 === "in"
      ? // e.g. "in two minutes"
        { amount: word2, unit: word3, tense: "past" }
      : // e.g. "15 minutes later"
        { amount: word1, unit: word2, tense: word3 }
  );
};

const enum Tense {
  Past,
  Future
}

const wordToTense = (word: string): Either.Either<Error, Tense> =>
  "ago earlier prior".includes(word)
    ? Either.right(Tense.Past)
    : "from ahead later".includes(word)
    ? Either.right(Tense.Future)
    : Either.left(new Error(`Not sure if "${word}" is past or future tense.`));

const wordToAmount = (word: string): Either.Either<Error, number> => {
  // Use the english version of a word (i.e. "two") or attempt parsing it
  const amount = Option.fromNullable(wordsToNumbers[word]).getOrElseL(() =>
    parseFloat(word)
  );

  return isNaN(amount)
    ? Either.left(new Error(`"${word}" is not a number.`))
    : Either.right(amount);
};

const wordsToNumbers: {
  [word: string]: number | undefined;
} = {
  zero: 0,
  a: 1,
  an: 1,
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
  `
  year years y
  quarter quarters q
  month months M
  week weeks w
  day days d
  hour hours h
  minute minutes m
  second seconds s
  millisecond milliseconds ms
  `.includes(word.toLowerCase())
    ? Either.right(word as Unit)
    : Either.left(new Error(`"${word}" is not a valid unit of time.`));
