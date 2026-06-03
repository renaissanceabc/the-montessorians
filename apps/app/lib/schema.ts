import { educationType, linkType } from "@repo/database/schema";
import { z } from "zod";

export const ProfileSyncSchema = z.object({
  name: z.string().trim(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/),
  tagline: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional().default([]),
  education: z.array(z.enum(educationType.enumValues)).optional().default([]),
  educationNotes: z.string().trim().optional(),
  notableAchievements: z.array(z.string().trim()).optional().default([]),
  quotes: z.array(z.string().trim()).optional().default([]),
  links: z
    .array(
      z.object({
        url: z.string().trim().url(),
        type: z.enum(linkType.enumValues),
      })
    )
    .optional()
    .default([]),
  imageUrl: z.string().trim().url().optional(),
});
