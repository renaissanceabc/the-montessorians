import { captureException } from "@sentry/nextjs";

import { log } from "./log";

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- receives raw `catch` bindings and error-boundary values, which the language types as unknown; this is the boundary that turns them into a message.
export const parseError = (error: unknown): string => {
  let message = "An error occurred";

  if (error instanceof Error) {
    ({ message } = error);
  } else if (error instanceof Object && "message" in error) {
    message = String(error.message);
  } else {
    message = String(error);
  }

  try {
    captureException(error);
    log.error(`Parsing error: ${message}`);
  } catch (newError) {
    console.error("Error parsing error:", newError);
  }

  return message;
};
