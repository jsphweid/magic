import Moment from "moment";

export type Interval = Ongoing | Complete;

export interface Ongoing {
  start: Moment.Moment;
  stop?: Moment.Moment | null;
}

export interface Complete {
  start: Moment.Moment;
  stop: Moment.Moment;
}

export const fromStrings = (start: string, stop?: string | null): Interval => ({
  start: Moment(start),
  stop: stop ? Moment(stop) : null
});

export const end = (
  interval: Interval,
  stop?: Moment.Moment | null
): Complete => ({
  ...interval,
  stop: stop ? stop : interval.stop || Moment()
});

export const duration = (interval: Interval): Moment.Duration => {
  const { start, stop } = end(interval, interval.stop);
  return Moment.duration(stop.diff(start));
};
