import { Apply, Either, Error, pipe } from "@grapheng/prelude";
import Moment from "moment";

import * as Time from "./time";

/*
  Parse english date expressions...
  "now", "5 days ago", "1 hour from now", "twelve days later", etc.
*/
export const toDate = (english: string): Either.ErrorOr<Time.Date> =>
  "right now immediately instantly at once".includes(english.toLowerCase())
    ? Either.right(Moment())
    : pipe(
        englishToWords(english),
        Either.chain(words =>
          Apply.sequenceS(Either.either)({
            amount: wordToAmount(words.amount),
            unit: wordToUnit(words.unit),
            tense: wordToTense(words.tense)
          })
        ),
        Either.chain(({ tense, amount, unit }) =>
          Either.right(
            tense === Tense.PAST
              ? Moment().subtract(amount, unit)
              : Moment().add(amount, unit)
          )
        )
      );

export const toDuration = (english: string): Either.ErrorOr<Time.Duration> =>
  pipe(
    toDate(`${english} ago`),
    Either.map(date => Time.duration(Time.ongoingInterval(date)))
  );

const englishToWords = (
  english: string
): Either.ErrorOr<{
  tense: string;
  amount: string;
  unit: string;
}> =>
  pipe(
    // "one hour ago"
    english.split(" "),
    ([firstWord, secondWord, thirdWord]) =>
      // At least three words are required
      thirdWord
        ? Either.right(
            firstWord === "in"
              ? // e.g. "in two minutes"
                { amount: secondWord, unit: thirdWord, tense: "ahead" }
              : // e.g. "15 minutes later"
                { amount: firstWord, unit: secondWord, tense: thirdWord }
          )
        : Either.left(
            Error.from(
              `"${english}" needs to look like "five minutes ago", "in 1 hour", "30 seconds ahead", etc.`
            )
          )
  );

const wordToAmount = (word: string): Either.ErrorOr<number> => {
  // Use the english version of a word (i.e. "two") or attempt parsing it
  const amount = wordsToNumbers[word] || parseFloat(word);
  return isNaN(amount)
    ? Either.left(Error.from(`"${word}" is not a number.`))
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

const wordToUnit = (word: string): Either.ErrorOr<Unit> =>
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
    ? Either.right(word as Unit)
    : Either.left(Error.from(`"${word}" is not a valid unit of time.`));

const enum Tense {
  PAST,
  FUTURE
}

const wordToTense = (word: string): Either.ErrorOr<Tense> =>
  "ago earlier prior".includes(word)
    ? Either.right(Tense.PAST)
    : "from ahead later".includes(word)
    ? Either.right(Tense.FUTURE)
    : Either.left(Error.from(`Not sure if "${word}" is past or future tense.`));
