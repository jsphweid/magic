import * as Narrative from "./narrative";
import { createHoursAgo } from "./test-helpers";
import * as Time from "./time";

describe("narrative", () => {
  describe("getNarrativesFromTime", () => {
    const fiveHoursAgoToNow = Time.stoppedInterval(createHoursAgo(5));
    const sevenToTwoHoursAgo = Time.stoppedInterval(
      createHoursAgo(7),
      createHoursAgo(2)
    );

    test("that it should find no narratives if there are none", () => {
      expect(
        Narrative.getNarrativesFromInterval(fiveHoursAgoToNow, [])
      ).toEqual([]);
    });

    test("that it should find one narrative if ongoing in timeframe", () => {
      const narrativeInRange = {
        id: "123",
        start: createHoursAgo(3).valueOf(),
        tags: [],
        description: ""
      };
      expect(
        Narrative.getNarrativesFromInterval(
          Time.ongoingInterval(createHoursAgo(5)),
          [narrativeInRange]
        )
      ).toEqual([narrativeInRange]);
    });

    test("that it should find one narrative if ongoing in but started a long time ago", () => {
      const narrativeInRange = {
        id: "123",
        start: createHoursAgo(8).valueOf(),
        tags: [],
        description: ""
      };

      expect(
        Narrative.getNarrativesFromInterval(
          Time.ongoingInterval(createHoursAgo(5)),
          [narrativeInRange]
        )
      ).toEqual([narrativeInRange]);
    });

    describe.each`
      startHoursAgo | stopHoursAgo | shouldBeInRange
      ${3}          | ${1}         | ${true}
      ${10}         | ${4}         | ${true}
      ${10}         | ${9}         | ${false}
    `(
      "in the range of seven to two hours ago",
      ({ startHoursAgo, stopHoursAgo, shouldBeInRange }) => {
        test(`a narrative from ${startHoursAgo} to ${stopHoursAgo} hours ago should ${
          shouldBeInRange ? "" : "NOT"
        } exist`, () => {
          const narrativePossiblyInRange = {
            id: "123",
            start: createHoursAgo(startHoursAgo).valueOf(),
            stop: createHoursAgo(stopHoursAgo).valueOf(),
            tags: [],
            description: ""
          };

          expect(
            Narrative.getNarrativesFromInterval(sevenToTwoHoursAgo, [
              narrativePossiblyInRange
            ])
          ).toEqual(shouldBeInRange ? [narrativePossiblyInRange] : []);
        });
      }
    );
  });
});
