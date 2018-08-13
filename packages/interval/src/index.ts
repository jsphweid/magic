import Moment from "moment";

export type Interval = Ongoing | Complete;

export interface Ongoing {
  start: Moment.Moment;
  stop: Moment.Moment | null;
}

export interface Complete {
  start: Moment.Moment;
  stop: Moment.Moment;
}

export const fromStrings = (start: string, stop?: string | null): Interval => ({
  start: Moment(start),
  stop: stop ? Moment(stop) : null
});

export const end = (interval: Ongoing, stop?: Moment.Moment): Complete => ({
  ...interval,
  stop: stop ? Moment(stop) : Moment()
});
