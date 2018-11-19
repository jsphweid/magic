import gql from "graphql-tag";

export const history = "...History";

export const fragments = gql`
  fragment History on History {
    narratives {
      ...Timing
      description
    }

    tags: tagOccurrences {
      tag {
        name
      }
    }
  }

  fragment Timing on HasTiming {
    timing {
      ... on Occurrence {
        start {
          ...FormattedDate
        }
      }

      ... on Interval {
        duration {
          ...FormattedDuration
        }
      }

      ... on StoppedInterval {
        stop {
          ...FormattedDate
        }
      }
    }
  }

  fragment FormattedDate on FormattedDate {
    formatted(template: "h:mm A ddd")
  }

  fragment FormattedDuration on FormattedDuration {
    humanized
  }
`;
