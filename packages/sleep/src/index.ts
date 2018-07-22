import Moment from "moment";

import * as Toggl from "~/toggl";

export const isSleep = (from: Moment.Moment, to: Moment.Moment): boolean => {
  const isLongEnoughToBeSleep = Moment.duration(to.diff(from)).asHours() > 1;

  const isReasonableFromHour = from.hour() >= 18 || from.hour() <= 6;
  const isReasonableToHour = to.hour() >= 4 && to.hour() <= 14;

  return isLongEnoughToBeSleep && isReasonableFromHour && isReasonableToHour;
};

interface Sleep {
  from: Moment.Moment;
  to: Moment.Moment;
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

      const from = Moment(acc.previousTimeEntry.stop);
      const to = Moment(timeEntry.start);

      if (!isSleep(from, to)) {
        return updatedAcc;
      }

      return { ...updatedAcc, sleep: [...updatedAcc.sleep, { from, to }] };
    },
    {
      sleep: []
    }
  ).sleep;
