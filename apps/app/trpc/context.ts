import "server-only";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export function createTRPCContext(opts: Pick<FetchCreateContextFnOptions, "req">) {
  const forwardedFor = opts.req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "127.0.0.1";
  return { ip };
}

export type TRPCContext = ReturnType<typeof createTRPCContext>;
