import { relations } from "drizzle-orm/relations";
import { dailyFeature, links, profiles, profileTags, tags } from "./schema";

export const dailyFeatureRelations = relations(dailyFeature, ({ one }) => ({
  profile: one(profiles, {
    fields: [dailyFeature.profileSlug],
    references: [profiles.slug],
  }),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  dailyFeatures: many(dailyFeature),
  links: many(links),
  profileTags: many(profileTags),
}));

export const linksRelations = relations(links, ({ one }) => ({
  profile: one(profiles, {
    fields: [links.profileSlug],
    references: [profiles.slug],
  }),
}));

export const profileTagsRelations = relations(profileTags, ({ one }) => ({
  profile: one(profiles, {
    fields: [profileTags.profileSlug],
    references: [profiles.slug],
  }),
  tag: one(tags, {
    fields: [profileTags.tagSlug],
    references: [tags.slug],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  profileTags: many(profileTags),
}));
