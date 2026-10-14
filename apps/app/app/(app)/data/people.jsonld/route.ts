import { peopleJsonLd } from "@/lib/content/exports";

export const dynamic = "force-static";

export const GET = () =>
  new Response(JSON.stringify(peopleJsonLd(), null, 2), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/ld+json; charset=utf-8",
    },
  });
