import { z } from "zod";
import {
  getDailyProfileFromFeatureDB,
  getEasternDateForFeature,
  getPastProfilesFromDB,
  getProfilesFromDB,
  getProfileWithAdjacentFromDB,
} from "@/lib/db/profiles";
import { profilesQuerySchema } from "@/lib/validation/schema";
import { publicProcedure, rateLimited, router } from "../init";

const slugInput = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) });

const listInput = profilesQuerySchema
  .extend({
    cursor: z.number().int().min(1).optional(),
  })
  .partial();

export const profilesRouter = router({
  list: publicProcedure
    .use(rateLimited({ prefix: "profiles" }))
    .input(listInput.optional())
    .query(({ input }) => {
      const { cursor, ...rest } = input ?? {};
      return getProfilesFromDB({ ...rest, page: cursor ?? 1 });
    }),

  bySlug: publicProcedure
    .use(rateLimited({ prefix: "profile-detail" }))
    .input(slugInput)
    .query(({ input }) => getProfileWithAdjacentFromDB(input.slug)),

  daily: publicProcedure
    .use(rateLimited({ prefix: "profiles-daily" }))
    .query(() => getDailyProfileFromFeatureDB(getEasternDateForFeature())),

  past: publicProcedure
    .use(rateLimited({ prefix: "profiles-past" }))
    .input(listInput.optional())
    .query(({ input }) => {
      const { cursor, ...rest } = input ?? {};
      return getPastProfilesFromDB(getEasternDateForFeature(), { ...rest, page: cursor ?? 1 });
    }),
});
