import { peopleCsv } from "@/lib/content/exports";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-static";

export const GET = () =>
  new Response(peopleCsv(siteUrl), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Disposition": 'inline; filename="the-montessorians-people.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
