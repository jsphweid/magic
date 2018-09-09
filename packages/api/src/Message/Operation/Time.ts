import gql from "graphql-tag";

export const selection = "...Time";

export const fragments = gql`
  fragment Time on Time {
    narratives {
      ...Interval
      description
    }
    tagOccurrences {
      ...Interval
      tag {
        name
      }
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
    formatted(format: "h:MM A ddd")
  }
`;
