import Moment from "moment";

import * as Toggl from "~/toggl";

export const isSleep = (start: Moment.Moment, stop: Moment.Moment): boolean => {
  const isLongEnoughToBeSleep = Moment.duration(stop.diff(start)).asHours() > 1;

  const isReasonableFromHour = start.hour() >= 18 || start.hour() <= 6;
  const isReasonableToHour = stop.hour() >= 4 && stop.hour() <= 14;

  return isLongEnoughToBeSleep && isReasonableFromHour && isReasonableToHour;
};

interface Sleep {
  start: Moment.Moment;
  stop: Moment.Moment;
}

export const fromTimeEntries = (timeEntries: Toggl.TimeEntry[]): Sleep[] =>
  timeEntries.reduce<{
    previousTimeEntry?: Toggl.TimeEntry;
    sleep: Sleep[];
  }>(
    (acc, timeEntry) => {
      const updatedAcc = { ...acc, previousTimeEntry: timeEntry };

      if (!acc.previousTimeEntry) {
        return updatedAcc;
      }

      const start = Moment(acc.previousTimeEntry.stop);
      const stop = Moment(timeEntry.start);

      if (!isSleep(start, stop)) {
        return updatedAcc;
      }

      return { ...updatedAcc, sleep: [...updatedAcc.sleep, { start, stop }] };
    },
    {
      sleep: []
    }
  ).sleep;
