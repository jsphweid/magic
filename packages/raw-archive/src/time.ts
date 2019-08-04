import Moment from "moment";

import * as Date from "./Date";
import * as Duration from "./Duration";

export { Batches, fromInterval as batchesFromInterval } from "./Batches";

export type Date = Moment.Moment;
export type Duration = Moment.Duration;
export type Interval = OngoingInterval | StoppedInterval;
export type Time = Instant | Interval;

export interface Timed {
  time: Time;
}

export interface Selection {
  start?: Date;
  duration?: Duration;
  stop?: Date;
}

interface Occurrence<Kind extends OccurrenceKind> {
  kind: Kind;
  start: Date;
}

const enum OccurrenceKind {
  Instant = "Instant",
  OngoingInterval = "OngoingInterval",
  StoppedInterval = "StoppedInterval"
}

export type Instant = Occurrence<OccurrenceKind.Instant>;
export type OngoingInterval = Occurrence<OccurrenceKind.OngoingInterval>;
export type StoppedInterval = Occurrence<OccurrenceKind.StoppedInterval> & {
  stop: Date;
};

export const isInstant = (time: Time): time is Instant =>
  time.kind === "Instant";

export const isOngoingInterval = (time: Time): time is OngoingInterval =>
  time.kind === "OngoingInterval";

export const isStoppedInterval = (time: Time): time is StoppedInterval =>
  time.kind === "StoppedInterval";

export const instant = (start?: Date | null): Instant => ({
  kind: OccurrenceKind.Instant,
  start: start || Moment()
});

export const ongoingInterval = (start?: Date | null): OngoingInterval => ({
  ...instant(start),
  kind: OccurrenceKind.OngoingInterval
});

export const stoppedInterval = (
  start?: Date | null,
  stop?: Date | null
): StoppedInterval => toStoppedInterval(ongoingInterval(start), stop);

// TODO: deal with exclusive / inclusive start / stops
export const instantIsInInterval = (
  instant: Instant,
  interval: Interval
): boolean =>
  instant.start.valueOf() > toStoppedInterval(interval).start.valueOf() &&
  instant.start.valueOf() <= toStoppedInterval(interval).stop.valueOf();

export const toStoppedInterval = (
  time: Time,
  stop?: Date | null
): StoppedInterval => ({
  ...time,
  kind: OccurrenceKind.StoppedInterval,
  stop: stop || (isStoppedInterval(time) ? time.stop : Moment())
});

export const fromSelection = (selection: Selection): Time =>
  selection.start && selection.stop
    ? stoppedInterval(selection.start, selection.stop)
    : selection.start && selection.duration
    ? stoppedInterval(
        selection.start,
        Moment(selection.start).add(selection.duration)
      )
    : selection.stop && selection.duration
    ? stoppedInterval(
        Moment(selection.stop).subtract(selection.duration),
        selection.stop
      )
    : selection.start
    ? ongoingInterval(selection.start)
    : instant();

export const duration = (time: Time): Duration =>
  Moment.duration(
    (isStoppedInterval(time) ? time.stop : Moment()).diff(time.start)
  ).abs();
