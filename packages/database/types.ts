import type { InferSelectModel } from "drizzle-orm";
import type { links, profiles, tags } from "./drizzle/schema";

export type Profile = InferSelectModel<typeof profiles>;
export type Tag = InferSelectModel<typeof tags>;
export type Link = InferSelectModel<typeof links>;
