import Moment from "moment";

import * as Toggl from "~/toggl";

import * as Interval from "./Interval";

export const isSleep = (interval: Interval.Interval): boolean => {
  const { start, stop } = Interval.end(interval);

  const isLongEnoughToBeSleep =
    Interval.duration({ start, stop }).asHours() > 1;

  const isReasonableStartHour = start.hour() >= 18 || start.hour() <= 6;
  const isReasonableStopHour = stop.hour() >= 4 && stop.hour() <= 14;

  return isLongEnoughToBeSleep && isReasonableStartHour && isReasonableStopHour;
};

export const fromTimeEntries = (
  timeEntries: Toggl.TimeEntry[]
): Interval.Interval[] => {
  let previousTimeEntry;
  const sleep = [];

  for (const timeEntry of timeEntries) {
    if (!previousTimeEntry) {
      previousTimeEntry = timeEntry;
      continue;
    }

    const interval = Interval.fromStrings(
      Moment(previousTimeEntry.stop).toISOString(),
      timeEntry.start
    );

    if (isSleep(interval)) {
      sleep.push(interval);
    }

    previousTimeEntry = timeEntry;
  }

  return sleep;
};
