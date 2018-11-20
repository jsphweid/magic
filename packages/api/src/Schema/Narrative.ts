import gql from "graphql-tag";

import * as Node from "./Node";
import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type Narrative implements Node__Identifiable & Node__Persisted & Time__Timed & Tag__Tagged {
    ID: ID!
    metadata: Node__PersistenceMetadata!
    time: Time__Time!
    description: String!
    tags: [Tag!]!
  }
`;

export interface Narrative
  extends Node.Identifiable,
    Node.Persisted,
    Time.Timed,
    Tag.Tagged {
  ID: string;
  time: Time.Time;
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
