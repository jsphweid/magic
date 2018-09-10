import gql from "graphql-tag";

export const source = "...Time";

export const fragments = gql`
  fragment Time on Time {
    narratives {
      description
      ...Interval
    }
    tagOccurrences {
      tag {
        name
      }
      ...Interval
    }
  }

  fragment Interval on HasInterval {
    interval {
      start {
        ...FormattedDate
      }
      stop {
        ...FormattedDate
      }
    }
  }

  fragment FormattedDate on FormattedDate {
    formatted(format: "h:mm A ddd")
  }
`;
