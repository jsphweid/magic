// THIS IS A GENERATED FILE, DO NOT MODIFY
// tslint:disable
import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig
} from "graphql";
import { TagTag, NodeMeta, NarrativeNarrative } from "./mappers";
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
  GraphengMS: any;
  Time__Date: any;
  Time__Duration: any;
  Time__MS: any;
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

export type Narrative__Mutation = {
  new: Narrative__Narrative;
};

export type Narrative__MutationNewArgs = {
  description?: Maybe<Scalars["String"]>;
  time?: Maybe<Time__Selection>;
  tags?: Maybe<Tag__Filter>;
};

export type Narrative__Narrative = Node__Identifiable &
  Node__Persisted &
  Time__Timed &
  Tag__Tagged & {
    ID: Scalars["ID"];
    meta: Node__Meta;
    time: Time__Occurrence;
    tags: Array<Tag__Tag>;
    description: Scalars["String"];
  };

export type Narrative__Query = {
  narratives: Array<Narrative__Narrative>;
};

export type Narrative__QueryNarrativesArgs = {
  search?: Maybe<Scalars["String"]>;
  time?: Maybe<Time__Selection>;
  tags?: Maybe<Tag__Filter>;
};

export type Node__Identifiable = {
  ID: Scalars["ID"];
};

export type Node__Meta = {
  created: FormattedDate;
  updated: FormattedDate;
};

export type Node__Persisted = {
  meta: Node__Meta;
};

export type Query = {
  Tag: Tag__Query;
  Narrative: Narrative__Query;
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

export type Time__Instant = Time__Occurrence & {
  start: FormattedDate;
};

export type Time__Interval = {
  duration: FormattedDuration;
};

export type Time__Occurrence = {
  start: FormattedDate;
};

export type Time__OngoingInterval = Time__Occurrence &
  Time__Interval & {
    start: FormattedDate;
    duration: FormattedDuration;
  };

export type Time__Selection = {
  start?: Maybe<Scalars["Time__Date"]>;
  duration?: Maybe<Scalars["Time__Duration"]>;
  stop?: Maybe<Scalars["Time__Date"]>;
};

export type Time__StoppedInterval = Time__Occurrence &
  Time__Interval & {
    start: FormattedDate;
    duration: FormattedDuration;
    stop: FormattedDate;
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
  FormattedDate: ResolverTypeWrapper<number>;
  FormattedDuration: ResolverTypeWrapper<number>;
  GraphengMS: ResolverTypeWrapper<Scalars["GraphengMS"]>;
  Float: ResolverTypeWrapper<Scalars["Float"]>;
  Narrative__Query: ResolverTypeWrapper<
    Omit<Narrative__Query, "narratives"> & {
      narratives: Array<ResolversTypes["Narrative__Narrative"]>;
    }
  >;
  Time__Selection: Time__Selection;
  Time__Date: ResolverTypeWrapper<Scalars["Time__Date"]>;
  Time__Duration: ResolverTypeWrapper<Scalars["Time__Duration"]>;
  Tag__Filter: Tag__Filter;
  Narrative__Narrative: ResolverTypeWrapper<NarrativeNarrative>;
  Time__Timed: ResolverTypeWrapper<
    Omit<Time__Timed, "time"> & { time: ResolversTypes["Time__Occurrence"] }
  >;
  Time__Occurrence: ResolverTypeWrapper<
    Omit<Time__Occurrence, "start"> & { start: ResolversTypes["FormattedDate"] }
  >;
  Tag__Tagged: ResolverTypeWrapper<
    Omit<Tag__Tagged, "tags"> & { tags: Array<ResolversTypes["Tag__Tag"]> }
  >;
  Mutation: ResolverTypeWrapper<{}>;
  Tag__Mutation: ResolverTypeWrapper<
    Omit<Tag__Mutation, "create" | "update"> & {
      create?: Maybe<ResolversTypes["Tag__Tag"]>;
      update: ResolversTypes["Tag__Tag"];
    }
  >;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>;
  Time__MS: ResolverTypeWrapper<Scalars["Time__MS"]>;
  Time__Instant: ResolverTypeWrapper<
    Omit<Time__Instant, "start"> & { start: ResolversTypes["FormattedDate"] }
  >;
  Time__Interval: ResolverTypeWrapper<
    Omit<Time__Interval, "duration"> & {
      duration: ResolversTypes["FormattedDuration"];
    }
  >;
  Time__OngoingInterval: ResolverTypeWrapper<
    Omit<Time__OngoingInterval, "start" | "duration"> & {
      start: ResolversTypes["FormattedDate"];
      duration: ResolversTypes["FormattedDuration"];
    }
  >;
  Time__StoppedInterval: ResolverTypeWrapper<
    Omit<Time__StoppedInterval, "start" | "duration" | "stop"> & {
      start: ResolversTypes["FormattedDate"];
      duration: ResolversTypes["FormattedDuration"];
      stop: ResolversTypes["FormattedDate"];
    }
  >;
  Narrative__Mutation: ResolverTypeWrapper<
    Omit<Narrative__Mutation, "new"> & {
      new: ResolversTypes["Narrative__Narrative"];
    }
  >;
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
  FormattedDate: number;
  FormattedDuration: number;
  GraphengMS: Scalars["GraphengMS"];
  Float: Scalars["Float"];
  Narrative__Query: Omit<Narrative__Query, "narratives"> & {
    narratives: Array<ResolversTypes["Narrative__Narrative"]>;
  };
  Time__Selection: Time__Selection;
  Time__Date: Scalars["Time__Date"];
  Time__Duration: Scalars["Time__Duration"];
  Tag__Filter: Tag__Filter;
  Narrative__Narrative: NarrativeNarrative;
  Time__Timed: Omit<Time__Timed, "time"> & {
    time: ResolversTypes["Time__Occurrence"];
  };
  Time__Occurrence: Omit<Time__Occurrence, "start"> & {
    start: ResolversTypes["FormattedDate"];
  };
  Tag__Tagged: Omit<Tag__Tagged, "tags"> & {
    tags: Array<ResolversTypes["Tag__Tag"]>;
  };
  Mutation: {};
  Tag__Mutation: Omit<Tag__Mutation, "create" | "update"> & {
    create?: Maybe<ResolversTypes["Tag__Tag"]>;
    update: ResolversTypes["Tag__Tag"];
  };
  Boolean: Scalars["Boolean"];
  Time__MS: Scalars["Time__MS"];
  Time__Instant: Omit<Time__Instant, "start"> & {
    start: ResolversTypes["FormattedDate"];
  };
  Time__Interval: Omit<Time__Interval, "duration"> & {
    duration: ResolversTypes["FormattedDuration"];
  };
  Time__OngoingInterval: Omit<Time__OngoingInterval, "start" | "duration"> & {
    start: ResolversTypes["FormattedDate"];
    duration: ResolversTypes["FormattedDuration"];
  };
  Time__StoppedInterval: Omit<
    Time__StoppedInterval,
    "start" | "duration" | "stop"
  > & {
    start: ResolversTypes["FormattedDate"];
    duration: ResolversTypes["FormattedDuration"];
    stop: ResolversTypes["FormattedDate"];
  };
  Narrative__Mutation: Omit<Narrative__Mutation, "new"> & {
    new: ResolversTypes["Narrative__Narrative"];
  };
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

export type Narrative__MutationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Narrative__Mutation"] = ResolversParentTypes["Narrative__Mutation"]
> = ResolversObject<{
  new?: Resolver<
    ResolversTypes["Narrative__Narrative"],
    ParentType,
    ContextType,
    Narrative__MutationNewArgs
  >;
}>;

export type Narrative__NarrativeResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Narrative__Narrative"] = ResolversParentTypes["Narrative__Narrative"]
> = ResolversObject<{
  ID?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  meta?: Resolver<ResolversTypes["Node__Meta"], ParentType, ContextType>;
  time?: Resolver<ResolversTypes["Time__Occurrence"], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes["Tag__Tag"]>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
}>;

export type Narrative__QueryResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Narrative__Query"] = ResolversParentTypes["Narrative__Query"]
> = ResolversObject<{
  narratives?: Resolver<
    Array<ResolversTypes["Narrative__Narrative"]>,
    ParentType,
    ContextType,
    Narrative__QueryNarrativesArgs
  >;
}>;

export type Node__IdentifiableResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Node__Identifiable"] = ResolversParentTypes["Node__Identifiable"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<
    "Tag__Tag" | "Narrative__Narrative",
    ParentType,
    ContextType
  >;
  ID?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
}>;

export type Node__MetaResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Node__Meta"] = ResolversParentTypes["Node__Meta"]
> = ResolversObject<{
  created?: Resolver<ResolversTypes["FormattedDate"], ParentType, ContextType>;
  updated?: Resolver<ResolversTypes["FormattedDate"], ParentType, ContextType>;
}>;

export type Node__PersistedResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Node__Persisted"] = ResolversParentTypes["Node__Persisted"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<
    "Tag__Tag" | "Narrative__Narrative",
    ParentType,
    ContextType
  >;
  meta?: Resolver<ResolversTypes["Node__Meta"], ParentType, ContextType>;
}>;

export type QueryResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = ResolversObject<{
  Tag?: Resolver<ResolversTypes["Tag__Query"], ParentType, ContextType>;
  Narrative?: Resolver<
    ResolversTypes["Narrative__Query"],
    ParentType,
    ContextType
  >;
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
  __resolveType: TypeResolveFn<"Narrative__Narrative", ParentType, ContextType>;
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

export type Time__InstantResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__Instant"] = ResolversParentTypes["Time__Instant"]
> = ResolversObject<{
  start?: Resolver<ResolversTypes["FormattedDate"], ParentType, ContextType>;
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
    ResolversTypes["FormattedDuration"],
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
  start?: Resolver<ResolversTypes["FormattedDate"], ParentType, ContextType>;
}>;

export type Time__OngoingIntervalResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__OngoingInterval"] = ResolversParentTypes["Time__OngoingInterval"]
> = ResolversObject<{
  start?: Resolver<ResolversTypes["FormattedDate"], ParentType, ContextType>;
  duration?: Resolver<
    ResolversTypes["FormattedDuration"],
    ParentType,
    ContextType
  >;
}>;

export type Time__StoppedIntervalResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__StoppedInterval"] = ResolversParentTypes["Time__StoppedInterval"]
> = ResolversObject<{
  start?: Resolver<ResolversTypes["FormattedDate"], ParentType, ContextType>;
  duration?: Resolver<
    ResolversTypes["FormattedDuration"],
    ParentType,
    ContextType
  >;
  stop?: Resolver<ResolversTypes["FormattedDate"], ParentType, ContextType>;
}>;

export type Time__TimedResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Time__Timed"] = ResolversParentTypes["Time__Timed"]
> = ResolversObject<{
  __resolveType: TypeResolveFn<"Narrative__Narrative", ParentType, ContextType>;
  time?: Resolver<ResolversTypes["Time__Occurrence"], ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  FormattedDate?: FormattedDateResolvers<ContextType>;
  FormattedDuration?: FormattedDurationResolvers<ContextType>;
  GraphengMS?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Narrative__Mutation?: Narrative__MutationResolvers<ContextType>;
  Narrative__Narrative?: Narrative__NarrativeResolvers<ContextType>;
  Narrative__Query?: Narrative__QueryResolvers<ContextType>;
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
