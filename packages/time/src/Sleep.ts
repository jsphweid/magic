import * as Interval from "./Interval";

export const isSleep = (interval: Interval.Interval): boolean => {
  const { start, stop } = Interval.toStopped(interval);

  const isLongEnoughToBeSleep = Interval.duration(interval).asHours() > 1;
  const isReasonableStartHour = start.hour() >= 18 || start.hour() <= 6;
  const isReasonableStopHour = stop.hour() >= 4 && stop.hour() <= 14;

  return isLongEnoughToBeSleep && isReasonableStartHour && isReasonableStopHour;
};

export const fromIntervals = (
  intervals: Interval.Stopped[]
): Interval.Stopped[] => {
  let previous;
  const sleep = [];

  for (const interval of intervals) {
    if (!previous) {
      previous = interval;
      continue;
    }

    if (isSleep(interval)) {
      sleep.push(interval);
    }

    previous = interval;
  }

  return sleep;
};
