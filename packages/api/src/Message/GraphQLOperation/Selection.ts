import gql from "graphql-tag";

export const history = "...History";

export const fragments = gql`
  fragment History on History {
    narratives {
      ...Interval
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
        formatted(template: "h:mm A ddd")
      }
      duration {
        humanized
      }
    }
  }
`;
