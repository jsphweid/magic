import { RawNarrative } from "./index";
import * as Narrative from "./narrative";
import { createHoursAgo } from "./test-helpers";
import * as Time from "./time";

describe("narrative", () => {
  describe("addNarrative", () => {
    const oldOldNarrative = {
      id: "012",
      start: createHoursAgo(400).valueOf(),
      stop: createHoursAgo(300).valueOf(),
      tags: [],
      description: ""
    };

    test("that adding a narrative to empty array works without hitch", () => {
      expect(Narrative.addNarrative(oldOldNarrative, [])).toEqual([
        oldOldNarrative
      ]);
    });

    test("that adding a narrative simply adds one if no conflict", () => {
      const newNarrative = {
        id: "234",
        start: createHoursAgo(2).valueOf(),
        stop: createHoursAgo(1).valueOf(),
        tags: [],
        description: ""
      };
      expect(Narrative.addNarrative(newNarrative, [oldOldNarrative])).toEqual([
        oldOldNarrative,
        newNarrative
      ]);
    });

    test("that adding a narrative simply adds one if no conflict even if ongoing", () => {
      const newNarrative = {
        id: "234",
        start: createHoursAgo(2).valueOf(),
        tags: [],
        description: ""
      };
      expect(Narrative.addNarrative(newNarrative, [oldOldNarrative])).toEqual([
        oldOldNarrative,
        newNarrative
      ]);
    });

    test("that adding a narrative correctly consumes an old narrative when appropriate", () => {
      const narrative = {
        id: "123",
        start: createHoursAgo(4).valueOf(),
        stop: createHoursAgo(3).valueOf(),
        tags: [],
        description: ""
      };

      const newNarrative = {
        id: "234",
        start: createHoursAgo(5).valueOf(),
        stop: createHoursAgo(1).valueOf(),
        tags: [],
        description: ""
      };
      expect(
        Narrative.addNarrative(newNarrative, [oldOldNarrative, narrative])
      ).toEqual([oldOldNarrative, newNarrative]);
    });

    test("that adding a narrative that starts halfway through an old entry cuts it in half", () => {
      const newStart = createHoursAgo(4).valueOf();
      const narrative = {
        id: "123",
        start: createHoursAgo(5).valueOf(),
        stop: createHoursAgo(3).valueOf(),
        tags: [],
        description: ""
      };

      const newNarrative = {
        id: "234",
        start: newStart,
        stop: createHoursAgo(1).valueOf(),
        tags: [],
        description: ""
      };
      expect(
        Narrative.addNarrative(newNarrative, [oldOldNarrative, narrative])
      ).toEqual([
        oldOldNarrative,
        { ...narrative, stop: newStart },
        newNarrative
      ]);
    });

    test("that adding a narrative that lasts halfway through older entry cuts the older one if half", () => {
      const fourHoursAgo = createHoursAgo(4).valueOf();
      const narrative = {
        id: "123",
        start: createHoursAgo(5).valueOf(),
        stop: createHoursAgo(3).valueOf(),
        tags: [],
        description: ""
      };

      const newNarrative = {
        id: "234",
        start: createHoursAgo(6).valueOf(),
        stop: fourHoursAgo,
        tags: [],
        description: ""
      };
      expect(
        Narrative.addNarrative(newNarrative, [oldOldNarrative, narrative])
      ).toEqual([
        oldOldNarrative,
        newNarrative,
        { ...narrative, start: fourHoursAgo }
      ]);
    });

    test("that adding a narrative in the middle of a larger older one split it in half", () => {
      const fiveHoursAgo = createHoursAgo(5).valueOf();
      const threeHoursAgo = createHoursAgo(3).valueOf();
      const narrative = {
        id: "123",
        start: createHoursAgo(6).valueOf(),
        stop: createHoursAgo(2).valueOf(),
        tags: [],
        description: ""
      };

      const newNarrative = {
        id: "234",
        start: fiveHoursAgo,
        stop: threeHoursAgo,
        tags: [],
        description: ""
      };
      const result = Narrative.addNarrative(newNarrative, [
        oldOldNarrative,
        narrative
      ]);
      const newId = (result.find(n => n.id.length > 3) as RawNarrative).id;
      expect(result).toEqual([
        oldOldNarrative,
        { ...narrative, stop: fiveHoursAgo },
        newNarrative,
        { ...narrative, start: threeHoursAgo, id: newId }
      ]);
    });
  });

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
