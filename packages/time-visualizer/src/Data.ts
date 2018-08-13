import _ from "lodash";
import Moment from "moment";

import * as Interval from "~/interval";
import * as Score from "~/score";

import DATA from "../data/data.json";

const {
  data: {
    now: {
      interval: { start, stop },
      tagOccurences
    }
  }
} = DATA;

export const interval = Interval.end(Interval.fromStrings(start, stop));

export type D3StackDatum = Score.Values & { startMS: number };

export const toD3StackFormat = (
  diverging: boolean,
  sampleDurationMS: number
): {
  [startMS: number]: Score.Values;
} => {
  const samples: { [startMS: number]: Score.Values } = {};

  for (const startMS of _.range(
    interval.start.valueOf(),
    interval.stop.valueOf(),
    sampleDurationMS
  )) {
    samples[startMS] = _.clone(Score.valuesZero);
  }

  for (const { interval, tag } of tagOccurences) {
    const startMS = Moment(interval.start).valueOf();
    const stopMS = Moment(interval.stop || undefined).valueOf();

    const startIntervalMS = Object.keys(samples).find(
      sampleStartMS => parseInt(sampleStartMS, 10) >= startMS
    );

    if (!startIntervalMS) {
      continue;
    }

    for (const activeIntervalStartMS of _.range(
      parseInt(startIntervalMS, 10),
      stopMS,
      sampleDurationMS
    )) {
      samples[activeIntervalStartMS][
        Score.nameFromString(tag.score)
      ] = diverging
        ? Score.valueOf(tag.score)
        : Score.absoluteValueOf(tag.score);
    }
  }

  if (!diverging) {
    for (const startMS in samples) {
      if (_.sum(Object.values(samples[startMS])) === 0) {
        samples[startMS][Score.Name.NEUTRAL] = 1;
      }
    }
  }

  return Object.entries(samples).map(([startMS, scores]) => ({
    startMS: parseInt(startMS, 10),
    ...scores
  }));
};
