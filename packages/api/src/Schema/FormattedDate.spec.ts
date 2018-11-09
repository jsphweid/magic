import _ from "lodash/fp";
import Moment from "moment";

import * as FormattedDate from "./FormattedDate";

describe("`FormattedDate`", () => {
  const now = Moment();
  const dates = _.range(-50, 50).map(i =>
    Moment(now).subtract(i + Math.random(), "hours")
  );

  Moment.now = () => now.valueOf();

  test("`iso`", () => {
    expect(dates.map(FormattedDate.resolve.iso)).toEqual(
      dates.map(date => date.toISOString())
    );
  });

  test("`unix`", () => {
    expect(dates.map(FormattedDate.resolve.unix)).toEqual(
      dates.map(date => date.unix())
    );
  });

  test("`unixMilliseconds`", () => {
    expect(dates.map(FormattedDate.resolve.unixMilliseconds)).toEqual(
      dates.map(date => date.valueOf())
    );
  });

  test("`humanized`", () => {
    expect(dates.map(FormattedDate.resolve.humanized)).toEqual(
      dates.map(date => Moment.duration(date.diff(Moment())).humanize(true))
    );
  });

  test("`format`", () => {
    const templates = [
      "h:mm A, dddd, MMMM Do, YYYY",
      "YY-MM-DD",
      "h:mm:ss",
      "YYYY"
    ];

    const formattedDates = templates.map(template =>
      dates.map(date => FormattedDate.resolve.format(date, { template }))
    );

    expect(formattedDates).toEqual(
      templates.map(template => dates.map(date => date.format(template)))
    );
  });
});
