import { pipe } from "@grapheng/prelude";
import gql from "graphql-tag";
import Moment from "moment";

// import * as Date from "./Date";
// import * as Duration from "./Duration";
import { Resolvers } from "../../../GeneratedTypes";

export { Batches, fromInterval as batchesFromInterval } from "./Batches";

export const typeDefs = gql`
  scalar Time__Date
  scalar Time__Duration
  scalar Time__MS

  interface Time__Timed {
    time: Time__Occurrence!
  }

  interface Time__Occurrence {
    start: FormattedDate!
  }

  # TODO: is this ever really used?
  type Time__Instant implements Time__Occurrence {
    start: FormattedDate!
  }

  interface Time__Interval {
    duration: FormattedDuration!
  }

  type Time__OngoingInterval implements Time__Occurrence & Time__Interval {
    start: FormattedDate!
    duration: FormattedDuration!
  }

  type Time__StoppedInterval implements Time__Occurrence & Time__Interval {
    start: FormattedDate!
    duration: FormattedDuration!
    stop: FormattedDate!
  }

  input Time__Selection {
    start: Time__Date
    duration: Time__Duration
    stop: Time__Date
  }
`;

export type Date = Moment.Moment;
export type Duration = Moment.Duration;
export type Time = Instant | OngoingInterval | StoppedInterval;

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

export const convertToFormattedBaseType = (
  time: Time
): { kind: OccurrenceKind; start: number; stop?: number } =>
  pipe(
    { start: time.start.valueOf(), kind: time.kind },
    base =>
      isStoppedInterval(time) ? { ...base, stop: time.stop.valueOf() } : base
  );

export const duration = (time: Time): Duration =>
  Moment.duration(
    (isStoppedInterval(time) ? time.stop : Moment()).diff(time.start)
  ).abs();

export const resolvers: Resolvers = {
  // ...Date.resolvers,
  // ...Duration.resolvers,
  // Time__Timed: { __resolveType: () => "Time__Timed" },
  // Time__Occurrence: {
  //   __resolveType: () => "Time__Instant"
  // }
  Time__Occurrence: {
    __resolveType: (time: any) =>
      `Time__${time.kind}` as
        | "Time__Instant"
        | "Time__OngoingInterval"
        | "Time__StoppedInterval"
  }
  // Time__Interval: { __resolveType: () => "Time__Interval" },
  // Time__OngoingInterval: { duration },
  // Time__StoppedInterval: { duration },
};
