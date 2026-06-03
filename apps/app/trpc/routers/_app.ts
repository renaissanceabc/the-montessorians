import { router } from "../init";
import { profilesRouter } from "./profiles";
import { subscriptionsRouter } from "./subscriptions";
import { tagsRouter } from "./tags";

export const appRouter = router({
  profiles: profilesRouter,
  tags: tagsRouter,
  subscriptions: subscriptionsRouter,
});

export type AppRouter = typeof appRouter;
