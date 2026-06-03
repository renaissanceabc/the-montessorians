import { render } from "@react-email/render";
import { resend } from "@repo/email";
import { SubscribeEmailTemplate } from "@repo/email/templates/subscribe";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "@/env";
import { siteUrl } from "@/lib/utils";
import { EmailSchema } from "@/lib/validation/email";
import { publicProcedure, rateLimited, router } from "../init";

async function createContact(email: string) {
  const { data: contact } = await resend.contacts.get({
    email,
    audienceId: env.RESEND_AUDIENCE_ID,
  });
  if (contact?.id) {
    return { status: "already_exists" as const };
  }
  await resend.contacts.create({ email, audienceId: env.RESEND_AUDIENCE_ID });
  return { status: "created" as const };
}

async function sendWelcomeEmail(email: string) {
  const token = jwt.sign({ email }, env.UNSUBSCRIBE_SECRET, { expiresIn: "90d" });
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${token}`;
  const html = await render(<SubscribeEmailTemplate unsubscribeUrl={unsubscribeUrl} />);
  return resend.emails.send({
    from: env.RESEND_FROM,
    to: email,
    subject: "Welcome to The Montessorians",
    html,
  });
}

export const subscriptionsRouter = router({
  subscribe: publicProcedure
    .use(rateLimited({ prefix: "subscribe", limiter: Ratelimit.slidingWindow(5, "10 m") }))
    .input(EmailSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await createContact(input.email);
        if (result.status === "created") {
          const sent = await sendWelcomeEmail(input.email);
          if ("error" in sent && sent.error) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: String(sent.error) });
          }
        }
        return { ok: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        const message = parseError(error);
        log.error("Subscribe failed", { message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  unsubscribe: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { email } = jwt.verify(input.token, env.UNSUBSCRIBE_SECRET) as { email: string };
        const { data: contact } = await resend.contacts.get({
          email,
          audienceId: env.RESEND_AUDIENCE_ID,
        });
        if (contact?.id) {
          await resend.contacts.remove({ id: contact.id, audienceId: env.RESEND_AUDIENCE_ID });
        }
        log.info(`Unsubscribed ${email} from audience ${env.RESEND_AUDIENCE_ID}`);
        return { ok: true };
      } catch (error) {
        const message = parseError(error);
        log.error("Unsubscribe failed", { message });
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
    }),
});
