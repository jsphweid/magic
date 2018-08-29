import _ from "lodash";
import Moment from "moment";
import ApolloClient from "apollo-boost";

import * as Time from "~/time";
import * as Operation from "~/operation";

const client = new ApolloClient({ uri: "http://localhost:4000" });

export interface Data {
  now: {
    interval: {
      start: string;
      stop: string | null;
    };
    tagOccurrences: Array<{
      interval: {
        start: string;
        stop: string | null;
      };
      tag: {
        score: string;
      };
    }>;
  };
}

export type D3StackDatum = Time.Score.Values & {
  startMS: number;
};

export const asD3Stack = async (
  sampleDurationMS: number,
  start: Moment.Moment | undefined,
  stop?: Moment.Moment | undefined
): Promise<{
  interval: Time.Interval.Stopped;
  stackData: D3StackDatum[];
}> => {
  const {
    data: {
      now: { interval: intervalData, tagOccurrences }
    }
  } = await client.query<Data>({
    variables: { start, stop },
    query: Operation.now
  });

  const samples: { [startMS: number]: Time.Score.Values } = {};
  const interval = Time.Interval.fromDataStopped(intervalData);

  for (const startMS of _.range(
    interval.start.valueOf(),
    interval.stop.valueOf(),
    sampleDurationMS
  )) {
    samples[startMS] = { ...Time.Score.valuesZero };
  }

  for (const { interval: intervalData, tag } of tagOccurrences) {
    const { start, stop } = Time.Interval.fromDataStopped(intervalData);

    const startMS = Moment(start).valueOf();
    const stopMS = Moment(stop || undefined).valueOf();

    const firstSampleStartMS = Object.keys(samples).find(
      sampleStartMS => parseInt(sampleStartMS, 10) >= startMS
    );

    if (!firstSampleStartMS) {
      continue;
    }

    for (const activeIntervalStartMS of _.range(
      parseInt(firstSampleStartMS, 10),
      stopMS,
      sampleDurationMS
    )) {
      samples[activeIntervalStartMS][
        Time.Score.nameFromString(tag.score)
      ] = Time.Score.absoluteValueOf(tag.score);
    }
  }

  return {
    interval,
    stackData: Object.entries(samples).map(([startMS, scores]) => ({
      startMS: parseInt(startMS, 10),
      ...scores
    }))
  };
};
