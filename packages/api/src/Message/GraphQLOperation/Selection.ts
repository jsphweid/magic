import gql from "graphql-tag";

export const history = "...History";

export const fragments = gql`
  fragment History on History {
    ...Interval
    narratives {
      description
    }
    tagOccurrences {
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
    formatted(template: "h:mm A ddd")
  }
`;
