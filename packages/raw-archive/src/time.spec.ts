import { createHoursAgo } from "./test-helpers";
import * as Time from "./time";

describe("time", () => {
  describe.each`
    instantHoursAgo | startHoursAgo | stopHoursAgo | isInInterval
    ${4}            | ${5}          | ${3}         | ${true}
    ${3}            | ${4}          | ${2}         | ${true}
    ${3}            | ${3}          | ${1}         | ${false}
    ${10}           | ${5}          | ${0}         | ${false}
    ${0}            | ${5}          | ${0}         | ${true}
  `(
    "instantIsInInterval",
    ({ instantHoursAgo, startHoursAgo, stopHoursAgo, isInInterval }) => {
      test(`that instant ${instantHoursAgo} hours ago ${
        isInInterval ? "is" : "is NOT"
      } between ${startHoursAgo} and ${stopHoursAgo} hours ago`, () => {
        expect(
          Time.instantIsInInterval(
            Time.instant(createHoursAgo(instantHoursAgo)),
            Time.stoppedInterval(
              createHoursAgo(startHoursAgo),
              createHoursAgo(stopHoursAgo)
            )
          )
        ).toEqual(isInInterval);
      });
    }
  );

  test("that an instant of now in an ongoing interval works", () => {
    expect(
      Time.instantIsInInterval(
        Time.instant(createHoursAgo(0)),
        Time.ongoingInterval(createHoursAgo(2))
      )
    ).toEqual(true);
  });
});
