import { option as Option } from "fp-ts";
import _ from "lodash/fp";
import Moment from "moment";

import * as Time from "./Time";

describe("`Time`", () => {
  describe("`Interval`", () => {
    const now = Moment();
    const interval = {
      start: Moment(now).subtract(2, "minutes"),
      stop: Option.some(now)
    };

    describe("`stop`", () => {
      test("resolves to a `FormattedDate` when defined", () => {
        expect(
          Time.resolvers.Interval.stop({
            ...interval,
            stop: Option.some(now)
          })
        ).toEqual(now);
      });

      test("resolves to `null` when not defined", () => {
        expect(
          Time.resolvers.Interval.stop({
            ...interval,
            stop: Option.none
          })
        ).toEqual(null);
      });
    });

    describe("`duration`", () => {
      test("resolves to the correct `FormattedDuration` when stopped", () => {
        expect(
          Option.fromNullable(
            Time.resolvers.Interval.duration({
              start: Moment(now).subtract(25, "minutes"),
              stop: Option.some(Moment(now).subtract(20, "minutes"))
            })
          )
            .map(duration => duration.asMilliseconds())
            .getOrElse(0)
        ).toEqual(Moment.duration(5, "minutes").asMilliseconds());
      });

      test("resolves to `null` when the interval is ongoing", () => {
        expect(
          Time.resolvers.Interval.duration({
            ...interval,
            stop: Option.none
          })
        ).toEqual(null);
      });
    });
  });

  describe("`FormattedDate`", () => {
    const now = Moment();
    const dates = _.range(-50, 50).map(i =>
      Moment(now).subtract(i + Math.random(), "hours")
    );

    Moment.now = () => now.valueOf();

    test("`iso`", () => {
      expect(dates.map(Time.resolvers.FormattedDate.iso)).toEqual(
        dates.map(date => date.toISOString())
      );
    });

    test("`unix`", () => {
      expect(dates.map(Time.resolvers.FormattedDate.unix)).toEqual(
        dates.map(date => date.unix())
      );
    });

    test("`unixMilliseconds`", () => {
      expect(dates.map(Time.resolvers.FormattedDate.unixMilliseconds)).toEqual(
        dates.map(date => date.valueOf())
      );
    });

    test("`humanized`", () => {
      expect(dates.map(Time.resolvers.FormattedDate.humanized)).toEqual(
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
        dates.map(date =>
          Time.resolvers.FormattedDate.formatted(date, { template })
        )
      );

      expect(formattedDates).toEqual(
        templates.map(template => dates.map(date => date.format(template)))
      );
    });
  });

  describe("`FormattedDuration`", () => {
    const durations = _.range(0, 100).map(i =>
      Moment.duration(i + Math.random(), "hours")
    );

    test("`humanized`", () => {
      expect(durations.map(Time.resolvers.FormattedDuration.humanized)).toEqual(
        durations.map(duration => duration.humanize())
      );
    });

    test("`milliseconds`", () => {
      expect(
        durations.map(Time.resolvers.FormattedDuration.milliseconds)
      ).toEqual(durations.map(hour => hour.asMilliseconds()));
    });

    test("`seconds`", () => {
      expect(durations.map(Time.resolvers.FormattedDuration.seconds)).toEqual(
        durations.map(hour => hour.asSeconds())
      );
    });

    test("`minutes`", () => {
      expect(durations.map(Time.resolvers.FormattedDuration.minutes)).toEqual(
        durations.map(hour => hour.asMinutes())
      );
    });

    test("`hours`", () => {
      expect(durations.map(Time.resolvers.FormattedDuration.hours)).toEqual(
        durations.map(hour => hour.asHours())
      );
    });

    test("`days`", () => {
      expect(durations.map(Time.resolvers.FormattedDuration.days)).toEqual(
        durations.map(hour => hour.asDays())
      );
    });

    test("`weeks`", () => {
      expect(durations.map(Time.resolvers.FormattedDuration.weeks)).toEqual(
        durations.map(hour => hour.asWeeks())
      );
    });

    test("`months`", () => {
      expect(durations.map(Time.resolvers.FormattedDuration.months)).toEqual(
        durations.map(hour => hour.asMonths())
      );
    });

    test("`years`", () => {
      expect(durations.map(Time.resolvers.FormattedDuration.years)).toEqual(
        durations.map(hour => hour.asYears())
      );
    });
  });
});
