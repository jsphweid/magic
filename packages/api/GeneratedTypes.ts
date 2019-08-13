// THIS IS A GENERATED FILE, DO NOT MODIFY
// tslint:disable
import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig
} from "graphql";
import { TagTag, NodeMeta } from "./mappers";
import { Context } from "./src/Schema/Context";
export type Maybe<T> = T | null;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = {
  [X in Exclude<keyof T, K>]?: T[X]
} &
  { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Time__MS: any;
  GraphengMS: any;
  Time__Date: any;
  Time__Duration: any;
};

export type FormattedDate = {
  unix: FormattedDuration;
  iso: Scalars["String"];
  humanized: Scalars["String"];
  formatted: Scalars["String"];
};

export type FormattedDateFormattedArgs = {
  template: Scalars["String"];
  zone?: Maybe<Scalars["String"]>;
};

export type FormattedDuration = {
  humanized: Scalars["String"];
  milliseconds: Scalars["GraphengMS"];
  seconds: Scalars["Float"];
  minutes: Scalars["Float"];
  hours: Scalars["Float"];
  days: Scalars["Float"];
  weeks: Scalars["Float"];
  months: Scalars["Float"];
  years: Scalars["Float"];
};

export type Mutation = {
  Tag: Tag__Mutation;
};

export type Node__Identifiable = {
  ID: Scalars["ID"];
};

export type Node__Meta = {
  created: Time__FormattedDate;
  updated: Time__FormattedDate;
};

export type Node__Persisted = {
  meta: Node__Meta;
};

export type Query = {
  Tag: Tag__Query;
};

export type Tag__Filter = {
  include?: Maybe<Tag__Selection>;
  exclude?: Maybe<Tag__Selection>;
};

export type Tag__Mutation = {
  create?: Maybe<Tag__Tag>;
  update: Tag__Tag;
  delete: Scalars["Boolean"];
};

export type Tag__MutationCreateArgs = {
  name: Scalars["String"];
  aliases?: Maybe<Array<Scalars["String"]>>;
  connections?: Maybe<Array<Scalars["String"]>>;
};

export type Tag__MutationUpdateArgs = {
  ID: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
  aliases?: Maybe<Array<Scalars["String"]>>;
  connections?: Maybe<Array<Scalars["String"]>>;
};

export type Tag__MutationDeleteArgs = {
  ID: Scalars["ID"];
};

export type Tag__Query = {
  tags: Array<Tag__Tag>;
};

export type Tag__QueryTagsArgs = {
  include?: Maybe<Tag__Selection>;
  exclude?: Maybe<Tag__Selection>;
};

export type Tag__Selection = {
  ids?: Maybe<Array<Scalars["ID"]>>;
  names?: Maybe<Array<Scalars["String"]>>;
};

export type Tag__Tag = Node__Identifiable &
  Node__Persisted & {
    ID: Scalars["ID"];
    meta: Node__Meta;
    name: Scalars["String"];
    aliases: Array<Scalars["String"]>;
    connections: Array<Tag__Tag>;
  };

export type Tag__Tagged = {
  tags: Array<Tag__Tag>;
};

export type Time__FormattedDate = {
  unix: Time__FormattedDuration;
  iso: Scalars["String"];
  humanized: Scalars["String"];
  formatted: Scalars["String"];
};

export type Time__FormattedDateFormattedArgs = {
  template?: Maybe<Scalars["String"]>;
};

export type Time__FormattedDuration = {
  humanized: Scalars["String"];
  milliseconds: Scalars["Time__MS"];
  seconds: Scalars["Float"];
  minutes: Scalars["Float"];
  hours: Scalars["Float"];
  days: Scalars["Float"];
  weeks: Scalars["Float"];
  months: Scalars["Float"];
  years: Scalars["Float"];
};

export type Time__Instant = Time__Occurrence & {
  start: Time__FormattedDate;
};

export type Time__Interval = {
  duration: Time__FormattedDuration;
};

export type Time__Occurrence = {
  start: Time__FormattedDate;
};

export type Time__OngoingInterval = Time__Occurrence &
  Time__Interval & {
    start: Time__FormattedDate;
    duration: Time__FormattedDuration;
  };

export type Time__Selection = {
  start?: Maybe<Scalars["Time__Date"]>;
  duration?: Maybe<Scalars["Time__Duration"]>;
  stop?: Maybe<Scalars["Time__Date"]>;
};

export type Time__StoppedInterval = Time__Occurrence &
  Time__Interval & {
    start: Time__FormattedDate;
    duration: Time__FormattedDuration;
    stop: Time__FormattedDate;
  };

export type Time__Timed = {
  time: Time__Occurrence;
};
export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, TParent, TContext, TArgs>;
}

export type SubscriptionResolver<
  TResult,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((
      ...args: any[]
    ) => SubscriptionResolverObject<TResult, TParent, TContext, TArgs>)
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {}
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Query: ResolverTypeWrapper<{}>;
  Tag__Query: ResolverTypeWrapper<
    Omit<Tag__Query, "tags"> & { tags: Array<ResolversTypes["Tag__Tag"]> }
  >;
  Tag__Selection: Tag__Selection;
  ID: ResolverTypeWrapper<Scalars["ID"]>;
  String: ResolverTypeWrapper<Scalars["String"]>;
  Tag__Tag: ResolverTypeWrapper<TagTag>;
  Node__Identifiable: ResolverTypeWrapper<Node__Identifiable>;
  Node__Persisted: ResolverTypeWrapper<
    Omit<Node__Persisted, "meta"> & { meta: ResolversTypes["Node__Meta"] }
  >;
  Node__Meta: ResolverTypeWrapper<NodeMeta>;
  Time__FormattedDate: ResolverTypeWrapper<Time__FormattedDate>;
  Time__FormattedDuration: ResolverTypeWrapper<Time__FormattedDuration>;
  Time__MS: ResolverTypeWrapper<Scalars["Time__MS"]>;
  Float: ResolverTypeWrapper<Scalars["Float"]>;
  Mutation: ResolverTypeWrapper<{}>;
  Tag__Mutation: ResolverTypeWrapper<
    Omit<Tag__Mutation, "create" | "update"> & {
      create?: Maybe<ResolversTypes["Tag__Tag"]>;
      update: ResolversTypes["Tag__Tag"];
    }
  >;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>;
  GraphengMS: ResolverTypeWrapper<Scalars["GraphengMS"]>;
  FormattedDate: ResolverTypeWrapper<FormattedDate>;
  FormattedDuration: ResolverTypeWrapper<FormattedDuration>;
  Time__Date: ResolverTypeWrapper<Scalars["Time__Date"]>;
  Time__Duration: ResolverTypeWrapper<Scalars["Time__Duration"]>;
  Time__Timed: ResolverTypeWrapper<Time__Timed>;
  Time__Occurrence: ResolverTypeWrapper<Time__Occurrence>;
  Time__Instant: ResolverTypeWrapper<Time__Instant>;
  Time__Interval: ResolverTypeWrapper<Time__Interval>;
  Time__OngoingInterval: ResolverTypeWrapper<Time__OngoingInterval>;
  Time__StoppedInterval: ResolverTypeWrapper<Time__StoppedInterval>;
  Time__Selection: Time__Selection;
  Tag__Tagged: ResolverTypeWrapper<
    Omit<Tag__Tagged, "tags"> & { tags: Array<ResolversTypes["Tag__Tag"]> }
  >;
  Tag__Filter: Tag__Filter;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Query: {};
  Tag__Query: Omit<Tag__Query, "tags"> & {
    tags: Array<ResolversTypes["Tag__Tag"]>;
  };
  Tag__Selection: Tag__Selection;
  ID: Scalars["ID"];
  String: Scalars["String"];
  Tag__Tag: TagTag;
  Node__Identifiable: Node__Identifiable;
  Node__Persisted: Omit<Node__Persisted, "meta"> & {
    meta: ResolversTypes["Node__Meta"];
  };
  Node__Meta: NodeMeta;
  Time__FormattedDate: Time__FormattedDate;
  Time__FormattedDuration: Time__FormattedDuration;
  Time__MS: Scalars["Time__MS"];
  Float: Scalars["Float"];
  Mutation: {};
  Tag__Mutation: Omit<Tag__Mutation, "create" | "update"> & {
    create?: Maybe<ResolversTypes["Tag__Tag"]>;
    update: ResolversTypes["Tag__Tag"];
  };
  Boolean: Scalars["Boolean"];
  GraphengMS: Scalars["GraphengMS"];
  FormattedDate: FormattedDate;
  FormattedDuration: FormattedDuration;
  Time__Date: Scalars["Time__Date"];
  Time__Duration: Scalars["Time__Duration"];
  Time__Timed: Time__Timed;
  Time__Occurrence: Time__Occurrence;
  Time__Instant: Time__Instant;
  Time__Interval: Time__Interval;
  Time__OngoingInterval: Time__OngoingInterval;
  Time__StoppedInterval: Time__StoppedInterval;
  Time__Selection: Time__Selection;
  Tag__Tagged: Omit<Tag__Tagged, "tags"> & {
    tags: Array<ResolversTypes["Tag__Tag"]>;
  };
  Tag__Filter: Tag__Filter;
}>;

export type FormattedDateResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["FormattedDate"] = ResolversParentTypes["FormattedDate"]
> = ResolversObject<{
  unix?: Resolver<ResolversTypes["FormattedDuration"], ParentType, ContextType>;
  iso?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  humanized?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  formatted?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType,
    FormattedDateFormattedArgs
  >;
}>;

export type FormattedDurationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["FormattedDuration"] = ResolversParentTypes["FormattedDuration"]
> = ResolversObject<{
  humanized?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  milliseconds?: Resolver<
    ResolversTypes["GraphengMS"],
    ParentType,
    ContextType
  >;
  seconds?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  minutes?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  hours?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  days?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  weeks?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  months?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  years?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
}>;

export interface GraphengMsScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["GraphengMS"], any> {
  name: "GraphengMS";
}

export type MutationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"]
> = ResolversObject<{
  Tag?: Resolver<ResolversTypes["Tag__Mutation"], ParentType, ContextType>;
}>;

export type Node__IdentifiableResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Node__Identifiable"] = ResolversParentTypes["Node__Identifiable"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<"Tag__Tag", ParentType, ContextType>;
  ID?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
}>;

export type Node__MetaResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Node__Meta"] = ResolversParentTypes["Node__Meta"]
> = ResolversObject<{
  created?: Resolver<
    ResolversTypes["Time__FormattedDate"],
    ParentType,
    ContextType
  >;
  updated?: Resolver<
    ResolversTypes["Time__FormattedDate"],
    ParentType,
    ContextType
  >;
}>;

export type Node__PersistedResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Node__Persisted"] = ResolversParentTypes["Node__Persisted"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<"Tag__Tag", ParentType, ContextType>;
  meta?: Resolver<ResolversTypes["Node__Meta"], ParentType, ContextType>;
}>;

export type QueryResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = ResolversObject<{
  Tag?: Resolver<ResolversTypes["Tag__Query"], ParentType, ContextType>;
}>;

export type Tag__MutationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Tag__Mutation"] = ResolversParentTypes["Tag__Mutation"]
> = ResolversObject<{
  create?: Resolver<
    Maybe<ResolversTypes["Tag__Tag"]>,
    ParentType,
    ContextType,
    RequireFields<Tag__MutationCreateArgs, "aliases" | "connections">
  >;
  update?: Resolver<
    ResolversTypes["Tag__Tag"],
    ParentType,
    ContextType,
    Tag__MutationUpdateArgs
  >;
  delete?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    Tag__MutationDeleteArgs
  >;
}>;

export type Tag__QueryResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Tag__Query"] = ResolversParentTypes["Tag__Query"]
> = ResolversObject<{
  tags?: Resolver<
    Array<ResolversTypes["Tag__Tag"]>,
    ParentType,
    ContextType,
    Tag__QueryTagsArgs
  >;
}>;

export type Tag__TagResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Tag__Tag"] = ResolversParentTypes["Tag__Tag"]
> = ResolversObject<{
  ID?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  meta?: Resolver<ResolversTypes["Node__Meta"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  aliases?: Resolver<Array<ResolversTypes["String"]>, ParentType, ContextType>;
  connections?: Resolver<
    Array<ResolversTypes["Tag__Tag"]>,
    ParentType,
    ContextType
  >;
}>;

export type Tag__TaggedResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Tag__Tagged"] = ResolversParentTypes["Tag__Tagged"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<null, ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes["Tag__Tag"]>, ParentType, ContextType>;
}>;

export interface Time__DateScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["Time__Date"], any> {
  name: "Time__Date";
}

export interface Time__DurationScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["Time__Duration"], any> {
  name: "Time__Duration";
}

export type Time__FormattedDateResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__FormattedDate"] = ResolversParentTypes["Time__FormattedDate"]
> = ResolversObject<{
  unix?: Resolver<
    ResolversTypes["Time__FormattedDuration"],
    ParentType,
    ContextType
  >;
  iso?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  humanized?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  formatted?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType,
    RequireFields<Time__FormattedDateFormattedArgs, "template">
  >;
}>;

export type Time__FormattedDurationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__FormattedDuration"] = ResolversParentTypes["Time__FormattedDuration"]
> = ResolversObject<{
  humanized?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  milliseconds?: Resolver<ResolversTypes["Time__MS"], ParentType, ContextType>;
  seconds?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  minutes?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  hours?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  days?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  weeks?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  months?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  years?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
}>;

export type Time__InstantResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__Instant"] = ResolversParentTypes["Time__Instant"]
> = ResolversObject<{
  start?: Resolver<
    ResolversTypes["Time__FormattedDate"],
    ParentType,
    ContextType
  >;
}>;

export type Time__IntervalResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__Interval"] = ResolversParentTypes["Time__Interval"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<
    "Time__OngoingInterval" | "Time__StoppedInterval",
    ParentType,
    ContextType
  >;
  duration?: Resolver<
    ResolversTypes["Time__FormattedDuration"],
    ParentType,
    ContextType
  >;
}>;

export interface Time__MsScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["Time__MS"], any> {
  name: "Time__MS";
}

export type Time__OccurrenceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__Occurrence"] = ResolversParentTypes["Time__Occurrence"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<
    "Time__Instant" | "Time__OngoingInterval" | "Time__StoppedInterval",
    ParentType,
    ContextType
  >;
  start?: Resolver<
    ResolversTypes["Time__FormattedDate"],
    ParentType,
    ContextType
  >;
}>;

export type Time__OngoingIntervalResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__OngoingInterval"] = ResolversParentTypes["Time__OngoingInterval"]
> = ResolversObject<{
  start?: Resolver<
    ResolversTypes["Time__FormattedDate"],
    ParentType,
    ContextType
  >;
  duration?: Resolver<
    ResolversTypes["Time__FormattedDuration"],
    ParentType,
    ContextType
  >;
}>;

export type Time__StoppedIntervalResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__StoppedInterval"] = ResolversParentTypes["Time__StoppedInterval"]
> = ResolversObject<{
  start?: Resolver<
    ResolversTypes["Time__FormattedDate"],
    ParentType,
    ContextType
  >;
  duration?: Resolver<
    ResolversTypes["Time__FormattedDuration"],
    ParentType,
    ContextType
  >;
  stop?: Resolver<
    ResolversTypes["Time__FormattedDate"],
    ParentType,
    ContextType
  >;
}>;

export type Time__TimedResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__Timed"] = ResolversParentTypes["Time__Timed"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<null, ParentType, ContextType>;
  time?: Resolver<ResolversTypes["Time__Occurrence"], ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  FormattedDate?: FormattedDateResolvers<ContextType>;
  FormattedDuration?: FormattedDurationResolvers<ContextType>;
  GraphengMS?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Node__Identifiable?: Node__IdentifiableResolvers;
  Node__Meta?: Node__MetaResolvers<ContextType>;
  Node__Persisted?: Node__PersistedResolvers;
  Query?: QueryResolvers<ContextType>;
  Tag__Mutation?: Tag__MutationResolvers<ContextType>;
  Tag__Query?: Tag__QueryResolvers<ContextType>;
  Tag__Tag?: Tag__TagResolvers<ContextType>;
  Tag__Tagged?: Tag__TaggedResolvers;
  Time__Date?: GraphQLScalarType;
  Time__Duration?: GraphQLScalarType;
  Time__FormattedDate?: Time__FormattedDateResolvers<ContextType>;
  Time__FormattedDuration?: Time__FormattedDurationResolvers<ContextType>;
  Time__Instant?: Time__InstantResolvers<ContextType>;
  Time__Interval?: Time__IntervalResolvers;
  Time__MS?: GraphQLScalarType;
  Time__Occurrence?: Time__OccurrenceResolvers;
  Time__OngoingInterval?: Time__OngoingIntervalResolvers<ContextType>;
  Time__StoppedInterval?: Time__StoppedIntervalResolvers<ContextType>;
  Time__Timed?: Time__TimedResolvers;
}>;

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
