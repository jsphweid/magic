import gql from "graphql-tag";

export const history = "...history";

export const fragments = gql`
  fragment History on History {
    ...Interval
    narratives {
      description
    }
    tags: tagOccurrences {
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
    formatted(format: "h:mm A ddd")
  }
`;
