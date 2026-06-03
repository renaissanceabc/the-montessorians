import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./routers/_app";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Convenience aliases derived from the router output shape.
export type Profile = RouterOutputs["profiles"]["list"]["data"][number];
export type PastProfile = RouterOutputs["profiles"]["past"]["data"][number];
export type ProfilePage = NonNullable<RouterOutputs["profiles"]["bySlug"]>;
export type Tag = RouterOutputs["tags"]["list"]["data"][number];
