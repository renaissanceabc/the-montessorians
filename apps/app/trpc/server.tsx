import "server-only";
import {
  defaultShouldDehydrateQuery,
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache, type ReactNode } from "react";
import superjson from "superjson";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
        },
        dehydrate: {
          serializeData: superjson.serialize,
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        },
        hydrate: {
          deserializeData: superjson.deserialize,
        },
      },
    })
);

export const trpc = createTRPCOptionsProxy({
  router: appRouter,
  queryClient: getQueryClient,
  // Server-side prefetch bypasses rate-limiting — no IP lookup.
  ctx: () => ({ ip: "ssr" }),
});

export function HydrateClient({ children }: { children: ReactNode }) {
  return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>;
}
