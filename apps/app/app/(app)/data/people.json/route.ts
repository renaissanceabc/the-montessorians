import { NextResponse } from "next/server";
import { peopleJson } from "@/lib/content/exports";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(peopleJson(), { headers: { "Access-Control-Allow-Origin": "*" } });
}
