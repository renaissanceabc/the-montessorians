import { defineConfig } from "drizzle-kit";
import { keys } from "./keys";

export default defineConfig({
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || keys().DATABASE_URL,
  },
});
