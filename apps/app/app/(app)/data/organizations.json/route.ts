import { NextResponse } from "next/server";

import { idUrl } from "@/lib/content/authority";
import { getAllOrganizations } from "@/lib/content/organizations";

export const dynamic = "force-static";

export const GET = () =>
  NextResponse.json(
    {
      license: "https://creativecommons.org/publicdomain/zero/1.0/",
      organizations: getAllOrganizations().map((o) => ({ uri: idUrl(o.id), ...o })),
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
