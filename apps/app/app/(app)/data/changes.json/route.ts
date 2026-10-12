import { NextResponse } from "next/server";
import { getChanges, idUrl } from "@/lib/content/authority";

export const dynamic = "force-static";

/** Merged, withdrawn, and renamed records — for anyone mirroring the dataset. */
export function GET() {
  return NextResponse.json(
    {
      changes: getChanges().map((c) => ({
        uri: idUrl(c.id),
        ...c,
        replacedBy: c.replacedBy ? idUrl(c.replacedBy) : undefined,
      })),
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
