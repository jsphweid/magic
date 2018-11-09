import _ from "lodash/fp";
import Moment from "moment";

import * as FormattedDuration from "./FormattedDuration";

describe("`FormattedDuration`", () => {
  const durations = _.range(0, 100).map(i =>
    Moment.duration(i + Math.random(), "hours")
  );

  test("`humanized`", () => {
    expect(durations.map(FormattedDuration.resolve.humanized)).toEqual(
      durations.map(duration => duration.humanize())
    );
  });

  test("`milliseconds`", () => {
    expect(durations.map(FormattedDuration.resolve.milliseconds)).toEqual(
      durations.map(hour => hour.asMilliseconds())
    );
  });

  test("`seconds`", () => {
    expect(durations.map(FormattedDuration.resolve.seconds)).toEqual(
      durations.map(hour => hour.asSeconds())
    );
  });

  test("`minutes`", () => {
    expect(durations.map(FormattedDuration.resolve.minutes)).toEqual(
      durations.map(hour => hour.asMinutes())
    );
  });

  test("`hours`", () => {
    expect(durations.map(FormattedDuration.resolve.hours)).toEqual(
      durations.map(hour => hour.asHours())
    );
  });

  test("`days`", () => {
    expect(durations.map(FormattedDuration.resolve.days)).toEqual(
      durations.map(hour => hour.asDays())
    );
  });

  test("`weeks`", () => {
    expect(durations.map(FormattedDuration.resolve.weeks)).toEqual(
      durations.map(hour => hour.asWeeks())
    );
  });

  test("`months`", () => {
    expect(durations.map(FormattedDuration.resolve.months)).toEqual(
      durations.map(hour => hour.asMonths())
    );
  });

  test("`years`", () => {
    expect(durations.map(FormattedDuration.resolve.years)).toEqual(
      durations.map(hour => hour.asYears())
    );
  });
});
