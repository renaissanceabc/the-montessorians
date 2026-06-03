import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { keys } from "./keys";
import * as schema from "./schema";

const connectionString = keys().DATABASE_URL;

// Optimized for Vercel serverless with Neon pooled connection
const client = postgres(connectionString, {
  prepare: false, // Required for Neon connection pooling (PgBouncer)
  max: 1, // Single connection per serverless invocation
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Neon cold starts are fast (~500ms)
});

export const db = drizzle(client, { schema });

export * from "drizzle-orm";
export * from "./types";
