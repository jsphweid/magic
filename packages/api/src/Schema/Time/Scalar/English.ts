import { apply as Apply, either as Either } from "fp-ts";
import Moment from "moment";

import * as Result from "../../../Result";
import * as Time from "../index";

/*
  Parse english date expressions...
  "now", "5 days ago", "1 hour from now", "twelve days later", etc.
*/
export const toDate = (english: string): Result.Result<Time.Date> =>
  "right now immediately instantly at once".includes(english.toLowerCase())
    ? Result.success(Moment())
    : // prettier-ignore
      englishToWords(english).chain(words =>
        Apply.liftA3(Either.either)<number, Unit, Tense, Time.Date>(
          amount => unit => tense => 
             tense === Tense.PAST
              ? Moment().subtract(amount, unit)
              : Moment().add(amount, unit)
        )
          (wordToAmount(words.amount))
          (wordToUnit(words.unit))
          (wordToTense(words.tense))
      );

/*
  Parse english duration expressions...
  "5 days", "1 hour", "twelve days", etc.
*/
export const toDuration = (english: string): Result.Result<Time.Duration> =>
  toDate(`${english} ago`).map(date =>
    Time.duration(Time.ongoingInterval(date))
  );

const englishToWords = (
  english: string
): Result.Result<{
  tense: string;
  amount: string;
  unit: string;
}> => {
  // "one hour ago"
  const [firstWord, secondWord, thirdWord] = english.split(" ");

  // At least three words are required
  if (!thirdWord) {
    return Result.error(
      `"${english}" needs to look like "five minutes ago", "in 1 hour", "30 seconds ahead", etc.`
    );
  }

  return Result.success(
    firstWord === "in"
      ? // e.g. "in two minutes"
        { amount: secondWord, unit: thirdWord, tense: "ahead" }
      : // e.g. "15 minutes later"
        { amount: firstWord, unit: secondWord, tense: thirdWord }
  );
};

const wordToAmount = (word: string): Result.Result<number> => {
  // Use the english version of a word (i.e. "two") or attempt parsing it
  const amount = wordsToNumbers[word] || parseFloat(word);
  return isNaN(amount)
    ? Result.error(`"${word}" is not a number.`)
    : Result.success(amount);
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

const wordToUnit = (word: string): Result.Result<Unit> =>
  `
  year years y
  quarter quarters q
  month months
  week weeks w
  day days d
  hour hours h
  minute minutes m
  second seconds s
  millisecond milliseconds ms
  `.includes(word.toLowerCase())
    ? Result.success(word as Unit)
    : Result.error(`"${word}" is not a valid unit of time.`);

const enum Tense {
  PAST,
  FUTURE
}

const wordToTense = (word: string): Result.Result<Tense> =>
  "ago earlier prior".includes(word)
    ? Result.success(Tense.PAST)
    : "from ahead later".includes(word)
    ? Result.success(Tense.FUTURE)
    : Result.error(`Not sure if "${word}" is past or future tense.`);
