import gql from "graphql-tag";
import Moment from "moment";

export const schema = gql`
  type Interval {
    start: Date!
    stop: Date
    duration: Duration
  }
`;

export const resolvers = {
  start: (source: { start: Moment.Moment }) => source.start.toISOString(),
  stop: (source: { stop: Moment.Moment | null }) =>
    source.stop ? source.stop.toISOString() : null,

  duration: (source: { start: Moment.Moment; stop: Moment.Moment }) =>
    source.stop ? Moment.duration(source.stop.diff(source.start)) : null
};
