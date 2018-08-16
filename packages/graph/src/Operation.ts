import gql from "graphql-tag";

export const now = gql`
  query Now($start: Date, $stop: Date) {
    now(start: $start, stop: $stop) {
      ...Interval
      narratives {
        ...Interval
        description
      }
      tagOccurrences {
        ...Interval
        tag {
          name
          score
        }
      }
    }
  }

  fragment Interval on HasInterval {
    interval {
      start
      stop
    }
  }
`;
