import { z } from "zod";
import { getTagFromDB, getTagsFromDB, getTagsWithCountsFromDB } from "@/lib/db/tags";
import { tagsQuerySchema } from "@/lib/validation/schema";
import { publicProcedure, rateLimited, router } from "../init";

export const tagsRouter = router({
  list: publicProcedure
    .use(rateLimited({ prefix: "tags" }))
    .input(tagsQuerySchema.optional())
    .query(({ input }) => getTagsFromDB(input ?? {})),

  listWithCounts: publicProcedure
    .use(rateLimited({ prefix: "tags-with-counts" }))
    .input(tagsQuerySchema.optional())
    .query(({ input }) => getTagsWithCountsFromDB(input ?? {})),

  bySlug: publicProcedure
    .use(rateLimited({ prefix: "tag-detail" }))
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getTagFromDB(input.slug)),
});
