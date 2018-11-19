import gql from "graphql-tag";

import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type Narrative implements Node & Time_Timed & Tag_Tagged {
    ID: ID!
    timing: Time_Timing!
    description: String!
    tags: [Tag!]!
  }
`;

export interface Narrative extends Time.Timed, Tag.Tagged {
  ID: string;
  timing: Time.Timing;
  description: string;
}

export const descriptionFromTags = (tags: Tag.Tag[]): string =>
  tags.reduce((previous, tag, i) => {
    const name = tag.name.replace(/-/g, " ");
    if (i === 0) return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    if (i === 1 && tags.length === 1) return `${previous} and ${name}`;
    if (i === tags.length - 1) return `${previous}, and ${name}`;
    return `${previous}, ${name}`;
  }, "");
