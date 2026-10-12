import { peopleJsonLd } from "@/lib/content/exports";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(peopleJsonLd(), null, 2), {
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
