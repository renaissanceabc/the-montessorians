import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const educationType = pgEnum("education_type", ["montessori", "homeschool", "other"]);
export const linkType = pgEnum("link_type", [
  "wikipedia",
  "website",
  "linkedin",
  "x",
  "tiktok",
  "instagram",
  "article",
  "youtube",
  "imdb",
]);

export const dailyFeature = pgTable(
  "daily_feature",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    date: date().notNull(),
    profileSlug: text("profile_slug").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("daily_feature_date_idx").using("btree", table.date.asc().nullsLast().op("date_ops")),
    foreignKey({
      columns: [table.profileSlug],
      foreignColumns: [profiles.slug],
      name: "daily_feature_profile_slug_fkey",
    }).onDelete("cascade"),
    unique("daily_feature_date_key").on(table.date),
  ]
);

export const links = pgTable(
  "links",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    profileSlug: text("profile_slug").notNull(),
    type: linkType().notNull(),
    url: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("links_profile_slug_idx").using(
      "btree",
      table.profileSlug.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("links_profile_slug_type_idx").using(
      "btree",
      table.profileSlug.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast(),
      table.url.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.profileSlug],
      foreignColumns: [profiles.slug],
      name: "links_profile_slug_fkey",
    }).onDelete("cascade"),
  ]
);

export const tags = pgTable(
  "tags",
  {
    slug: text().primaryKey().notNull(),
    label: text().notNull(),
  },
  (table) => [check("tag_slug_format_check", sql`slug ~ '^[a-z0-9-]+$'::text`)]
);

export const profiles = pgTable(
  "profiles",
  {
    slug: text().primaryKey().notNull(),
    name: text().notNull(),
    tagline: text(),
    bio: text(),
    educationNotes: text("education_notes"),
    education: educationType().array(),
    notableAchievements: text("notable_achievements").array(),
    imageUrl: text("image_url"),
    featuredAt: timestamp("featured_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
    quotes: text().array(),
  },
  (table) => [
    index("profiles_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
    check("slug_format_check", sql`slug ~ '^[a-z0-9-]+$'::text`),
  ]
);

export const profileTags = pgTable(
  "profile_tags",
  {
    profileSlug: text("profile_slug").notNull(),
    tagSlug: text("tag_slug").notNull(),
  },
  (table) => [
    index("profile_tags_profile_slug_idx").using(
      "btree",
      table.profileSlug.asc().nullsLast().op("text_ops")
    ),
    index("profile_tags_tag_slug_idx").using(
      "btree",
      table.tagSlug.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.profileSlug],
      foreignColumns: [profiles.slug],
      name: "profile_tags_profile_slug_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tagSlug],
      foreignColumns: [tags.slug],
      name: "profile_tags_tag_slug_fkey",
    }).onDelete("cascade"),
    primaryKey({ columns: [table.profileSlug, table.tagSlug], name: "profile_tags_pkey" }),
  ]
);
