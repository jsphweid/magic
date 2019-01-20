/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllTags
// ====================================================

export interface AllTags_Tag_tags_connections_connections_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
}

export interface AllTags_Tag_tags_connections_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: AllTags_Tag_tags_connections_connections_connections_connections_connections[];
}

export interface AllTags_Tag_tags_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: AllTags_Tag_tags_connections_connections_connections_connections[];
}

export interface AllTags_Tag_tags_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: AllTags_Tag_tags_connections_connections_connections[];
}

export interface AllTags_Tag_tags_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: AllTags_Tag_tags_connections_connections[];
}

export interface AllTags_Tag_tags {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: AllTags_Tag_tags_connections[];
}

export interface AllTags_Tag {
  __typename: "Tag__Query";
  tags: AllTags_Tag_tags[];
}

export interface AllTags {
  Tag: AllTags_Tag;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateTag
// ====================================================

export interface CreateTag_Tag_create_connections_connections_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
}

export interface CreateTag_Tag_create_connections_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: CreateTag_Tag_create_connections_connections_connections_connections_connections[];
}

export interface CreateTag_Tag_create_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: CreateTag_Tag_create_connections_connections_connections_connections[];
}

export interface CreateTag_Tag_create_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: CreateTag_Tag_create_connections_connections_connections[];
}

export interface CreateTag_Tag_create_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: CreateTag_Tag_create_connections_connections[];
}

export interface CreateTag_Tag_create {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: CreateTag_Tag_create_connections[];
}

export interface CreateTag_Tag {
  __typename: "Tag__Mutation";
  create: CreateTag_Tag_create;
}

export interface CreateTag {
  Tag: CreateTag_Tag;
}

export interface CreateTagVariables {
  name: string;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteTag
// ====================================================

export interface DeleteTag_Tag {
  __typename: "Tag__Mutation";
  delete: boolean;
}

export interface DeleteTag {
  Tag: DeleteTag_Tag;
}

export interface DeleteTagVariables {
  id: string;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateTag
// ====================================================

export interface UpdateTag_Tag_update {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
}

export interface UpdateTag_Tag {
  __typename: "Tag__Mutation";
  update: UpdateTag_Tag_update;
}

export interface UpdateTag {
  Tag: UpdateTag_Tag;
}

export interface UpdateTagVariables {
  ID: string;
  name?: string | null;
  aliases?: string[] | null;
  score?: number | null;
  connections?: string[] | null;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: BaseTag
// ====================================================

export interface BaseTag {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: Tag
// ====================================================

export interface Tag_connections_connections_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
}

export interface Tag_connections_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: Tag_connections_connections_connections_connections_connections[];
}

export interface Tag_connections_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: Tag_connections_connections_connections_connections[];
}

export interface Tag_connections_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: Tag_connections_connections_connections[];
}

export interface Tag_connections {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: Tag_connections_connections[];
}

export interface Tag {
  __typename: "Tag__Tag";
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  connections: Tag_connections[];
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

//==============================================================
// END Enums and Input Objects
//==============================================================
