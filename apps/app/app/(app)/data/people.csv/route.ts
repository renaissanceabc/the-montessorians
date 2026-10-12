import { peopleCsv } from "@/lib/content/exports";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-static";

export function GET() {
  return new Response(peopleCsv(siteUrl), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="the-montessorians-people.csv"',
      "Access-Control-Allow-Origin": "*",
    },
  });
}
