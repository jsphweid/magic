import _ from "lodash/fp";
import Moment from "moment";

import * as Time from "./index";

export type Batches = Time.StoppedInterval[];

export const fromInterval = (
  batchDuration: Time.Duration,
  interval: Time.StoppedInterval
): Batches => {
  const startMS = interval.start.valueOf();
  const stopMS = interval.stop.valueOf();

  const batchDurationMS = batchDuration.asMilliseconds();
  const intervalDurationMS = stopMS - startMS;
  const batchesInInterval = Math.floor(intervalDurationMS / batchDurationMS);

  return batchesInInterval <= 0
    ? [interval]
    : _.range(0, batchesInInterval).reduce<Batches>(
        (previous, _, i, array) => [
          ...previous,

          Time.stoppedInterval(
            Moment(startMS).add(i * batchDurationMS, "milliseconds"),
            i < array.length - 1
              ? Moment(startMS).add((i + 1) * batchDurationMS, "milliseconds")
              : Moment(stopMS)
          )
        ],
        []
      );
};
