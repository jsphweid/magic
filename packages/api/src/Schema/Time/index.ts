import { Date as UnitsDate, Duration as UnitsDuration } from "@grapheng/units";
import gql from "graphql-tag";
import Moment from "moment";

import { Resolvers } from "../../../GeneratedCode";
import * as Date from "./Date";
import * as Duration from "./Duration";

export { Batches, fromInterval as batchesFromInterval } from "./Batches";

export const typeDefs = gql`
  scalar Time__Date
  scalar Time__Duration

  interface Time__Timed {
    time: Time__Occurrence!
  }

  interface Time__Occurrence {
    start: DateOutput!
  }

  # TODO: is this ever really used?
  type Time__Instant implements Time__Occurrence {
    start: DateOutput!
  }

  interface Time__Interval {
    duration: DurationOutput!
  }

  type Time__OngoingInterval implements Time__Occurrence & Time__Interval {
    start: DateOutput!
    duration: DurationOutput!
  }

  type Time__StoppedInterval implements Time__Occurrence & Time__Interval {
    start: DateOutput!
    duration: DurationOutput!
    stop: DateOutput!
  }

  input Time__Selection {
    start: DateInput
    duration: DurationInput
    stop: DateInput
  }
`;

export type Date = Moment.Moment;
export type Duration = Moment.Duration;
export type Interval = OngoingInterval | StoppedInterval;
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

export const isInterval = (time: Time): time is Interval =>
  isOngoingInterval(time) || isStoppedInterval(time);

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

export const duration = (time: Time): Duration =>
  Moment.duration(
    (isStoppedInterval(time) ? time.stop : Moment()).diff(time.start)
  ).abs();

export const instantIsInInterval = (
  instant: Instant,
  interval: Interval
): boolean =>
  instant.start.valueOf() > toStoppedInterval(interval).start.valueOf() &&
  instant.start.valueOf() <= toStoppedInterval(interval).stop.valueOf();

export const resolvers: Resolvers = {
  ...Date.resolvers,
  ...Duration.resolvers,
  Time__Timed: {
    __resolveType: () => "Narrative__Narrative"
  },
  Time__Occurrence: {
    __resolveType: time =>
      `Time__${time.kind}` as
        | "Time__Instant"
        | "Time__OngoingInterval"
        | "Time__StoppedInterval"
  },
  Time__Interval: {
    __resolveType: source =>
      isStoppedInterval(source)
        ? "Time__StoppedInterval"
        : "Time__OngoingInterval"
  },
  Time__OngoingInterval: {
    start: time => ({ unix: { milliseconds: time.start.valueOf() } }),
    duration: time => ({
      milliseconds: Moment.duration(Moment().diff(time.start))
        .abs()
        .asMilliseconds()
    })
  },
  Time__StoppedInterval: {
    start: time => ({ unix: { milliseconds: time.start.valueOf() } }),
    stop: time => ({ unix: { milliseconds: time.stop.valueOf() } }),
    duration: time => ({
      milliseconds: Moment.duration(time.stop.diff(time.start))
        .abs()
        .asMilliseconds()
    })
  }
};

export const fromInputArgs = (input: {
  start?: UnitsDate.DateInput | null;
  duration?: UnitsDuration.DurationInput | null;
  stop?: UnitsDate.DateInput | null;
}): Time =>
  fromSelection({
    start: input.start
      ? Moment(UnitsDate.convertInput(input.start).unix.milliseconds)
      : undefined,
    stop: input.stop
      ? Moment(UnitsDate.convertInput(input.stop).unix.milliseconds)
      : undefined,
    duration: input.duration
      ? Moment.duration(UnitsDuration.convertInput(input.duration).milliseconds)
      : undefined
  });
