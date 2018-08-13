import _ from "lodash";
import Moment from "moment";

import * as Score from "~/score";

import DATA from "../data/data.json";

const {
  data: {
    now: {
      // interval: { start, stop },
      tagOccurences
    }
  }
} = DATA;

export const interval = { start: Moment().subtract(1, "day"), stop: Moment() };

export type D3StackDatum = Score.Values & { startMS: number };

export const toD3StackFormat = (
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
      ] = Score.absoluteValueOf(tag.score);
    }
  }

  return Object.entries(samples).map(([startMS, scores]) => ({
    startMS: parseInt(startMS, 10),
    ...scores
  }));
};
