import Moment from "moment";

import texts from "../data/texts.json";

export const timeEntries = texts
  .reduceRight<{
    previousFrom?: Moment.Moment;
    timeEntries: Array<{
      from: Moment.Moment;
      to: Moment.Moment;
      narrative: string;
      symbols?: string[];
    }>;
  }>(
    (acc, [time, text]) => {
      const [narrative, rawSymbols] = text.split(".");

      const timeEntry = {
        from: Moment(`2018-07-23 ${time}-05:00`),
        to: acc.previousFrom ? acc.previousFrom : Moment(),
        narrative,
        symbols: rawSymbols
          .toLocaleLowerCase()
          .split(",")
          .map(symbol => symbol.trim().replace(" ", "-"))
          .filter(symbol => symbol !== "")
      };

      return {
        previousFrom: timeEntry.from,
        timeEntries: [...acc.timeEntries, timeEntry]
      };
    },
    {
      timeEntries: []
    }
  )
  .timeEntries.reverse();
