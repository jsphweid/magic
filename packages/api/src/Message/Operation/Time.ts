import gql from "graphql-tag";

export const selection = "...Time";

export const fragments = gql`
  fragment Time on Time {
    narratives {
      description
      ...Interval
    }
    tagOccurrences {
      tag {
        ...Tag
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
    formatted(format: "h:MM A dd MMM D")
  }

  fragment Tag on Tag {
    name
    score
    connections {
      name
      score
      connections {
        name
        score
        connections {
          name
          score
          connections {
            name
            score
            connections {
              name
              score
            }
          }
        }
      }
    }
  }
`;
