import { NextResponse } from "next/server";

import { peopleJson } from "@/lib/content/exports";

export const dynamic = "force-static";

export const GET = () =>
  NextResponse.json(peopleJson(), { headers: { "Access-Control-Allow-Origin": "*" } });
