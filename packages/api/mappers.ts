import { Date, Duration } from "@grapheng/units";
import { RawNarrative, RawTag } from "~/raw-archive";

import { PersistenceMeta } from "./src/Schema/Node";
import * as Time from "./src/Schema/Time";

export type TagTag = RawTag;
export type NarrativeNarrative = RawNarrative;
export type TimeOccurrence = Time.Time;
export type TimeStoppedInterval = Time.StoppedInterval;
export type TimeOngoingInterval = Time.OngoingInterval;
export type TimeInterval = TimeStoppedInterval | TimeOngoingInterval;

export type NodeMeta = PersistenceMeta;

export type DateOutputMapper = Date.DateInput;
export type DurationOutputMapper = Duration.DurationInput;
