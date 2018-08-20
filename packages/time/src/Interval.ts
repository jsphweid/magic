import Moment from "moment";

export type Interval = Ongoing | Stopped;

export interface Ongoing {
  start: Moment.Moment;
  stop?: Moment.Moment | null;
}

export interface Stopped {
  start: Moment.Moment;
  stop: Moment.Moment;
}

interface Data {
  start?: string | null;
  stop?: string | null;
}

export const fromDataStopped = (data: Data): Stopped =>
  toStopped(fromData(data));

export const fromData = ({ start, stop }: Data): Interval => ({
  start: start ? Moment(start) : Moment(),
  stop: stop ? Moment(stop) : null
});

export const toStopped = (
  interval: Interval,
  stop?: Moment.Moment | null
): Stopped => ({
  ...interval,
  stop: stop ? stop : interval.stop || Moment()
});

export const duration = (interval: Interval): Moment.Duration => {
  const { start, stop } = toStopped(interval, interval.stop);
  return Moment.duration(stop.diff(start));
};
