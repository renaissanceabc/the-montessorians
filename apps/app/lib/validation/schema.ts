import { z } from "zod";

const cleanInput = (val: unknown) =>
  val === "" || val === "null" || val === null ? undefined : val;

export const profilesQuerySchema = z.object({
  orderBy: z
    .preprocess(cleanInput, z.enum(["latest", "trending", "alphabetical"]).optional())
    .default("latest"),
  sortBy: z.preprocess(cleanInput, z.enum(["asc", "desc"]).optional()).default("desc"),
  limit: z.preprocess(cleanInput, z.coerce.number().int().min(1).max(100).optional()).default(10),
  page: z.preprocess(cleanInput, z.coerce.number().int().min(1).optional()).default(1),
  search: z.preprocess(cleanInput, z.string().optional()),
  tags: z.preprocess(cleanInput, z.string().optional()),
});

export const tagsQuerySchema = z.object({
  orderBy: z.preprocess(cleanInput, z.enum(["alphabetical"]).optional()).default("alphabetical"),
  sortBy: z.preprocess(cleanInput, z.enum(["asc", "desc"]).optional()).default("asc"),
});
