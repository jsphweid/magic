import gql from "graphql-tag";

export const source = "...Time";

export const fragments = gql`
  fragment Time on Time {
    ...Interval
    narratives {
      description
    }
    tags {
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
