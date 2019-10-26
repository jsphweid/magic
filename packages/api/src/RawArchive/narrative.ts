import { Option, pipe } from "@grapheng/prelude";
import Moment from "moment-timezone";

import { RawNarrative } from ".";
import * as ID from "./id";
import * as Time from "./time";

const narrativeIsOngoing = (narrative: RawNarrative): boolean =>
  !narrative.stop;

const narrativeIsInInterval = (
  narrative: RawNarrative,
  interval: Time.Interval
) =>
  Time.instantIsInInterval(Time.instant(Moment(narrative.start)), interval) ||
  (narrativeIsOngoing(narrative)
    ? Time.instantIsInInterval(Time.instant(Moment()), interval)
    : Time.instantIsInInterval(Time.instant(Moment(narrative.stop)), interval));

export const getNarrativesFromInterval = (
  interval: Time.Interval,
  narratives: RawNarrative[]
) => narratives.filter(narrative => narrativeIsInInterval(narrative, interval));

export const addNarrative = (
  narrative: RawNarrative,
  oldNarratives: RawNarrative[]
): RawNarrative[] => {
  const newNarratives: RawNarrative[] = [];
  const now = Moment();

  const time = Time.fromSelection({
    start: Moment(narrative.start),
    stop: narrative.stop ? Moment(narrative.stop) : undefined
  });

  const interval = Time.toStoppedInterval(time);

  const newEntryStartMS = time.start.valueOf();
  const newEntryStopMS = interval.stop.valueOf();

  oldNarratives.forEach(oldNarrative => {
    const oldEntryStart = Moment(oldNarrative.start);
    const oldEntryStop = pipe(
      Option.fromNullable(oldNarrative.stop),
      Option.map(stop => Moment(stop)),
      Option.getOrElse(() => now)
    );

    const oldEntryStartMS = oldEntryStart.valueOf();
    const oldEntryStopMS = oldEntryStop.valueOf();

    if (
      /*
        New:      |=================|
        Old:            |------|

        Action: Delete the old entry

        Result:   |=================|
      */
      newEntryStartMS <= oldEntryStartMS &&
      oldEntryStopMS <= newEntryStopMS
    ) {
      // don't push it to arr
    } else if (
      /*
        New:            |=====|
        Old:      |-----------------|
        
        Action: Split the old entry

        Result:   |----||=====||----|
      */
      oldEntryStartMS < newEntryStartMS &&
      newEntryStopMS < oldEntryStopMS
    ) {
      newNarratives.push({ ...oldNarrative, stop: newEntryStartMS });
      newNarratives.push({
        ...oldNarrative,
        start: newEntryStopMS,
        id: ID.makeUnique()
      });
    } else if (
      /*
        New:            |===============|
        Old:      |-----------------|
        
        Action: Trim the end of the old entry

        Result:   |----||===============|
      */
      oldEntryStartMS < newEntryStartMS &&
      newEntryStartMS < oldEntryStopMS
    ) {
      newNarratives.push({ ...oldNarrative, stop: newEntryStartMS });
    } else if (
      /*
        New:      |===============|
        Old:            |-----------------|
        
        Action: Trim the start of the old entry

        Result:   |===============||------|
      */
      newEntryStartMS < oldEntryStartMS &&
      oldEntryStartMS < newEntryStopMS
    ) {
      newNarratives.push({ ...oldNarrative, start: newEntryStopMS });
    } else {
      newNarratives.push(oldNarrative);
    }
  });
  newNarratives.push(narrative);
  newNarratives.sort((a, b) => a.start - b.start);
  return newNarratives;
};
