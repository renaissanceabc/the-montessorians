// proxy.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const blockedPaths = [
  ".env",
  ".env.local",
  "login.action",
  "_all_dbs",
  "server-status",
  "config.json",
  "info.php",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (blockedPaths.some((path) => pathname.includes(path))) {
    return new NextResponse("Blocked", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  // matcher tells Next.js which routes to run the proxy on. This runs the
  // proxy on all routes except for static assets, public files, and Posthog ingest
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon-\\d+x\\d+\\.png|apple-touch-icon.*\\.png|site\\.webmanifest|web-app-manifest-.*\\.png|robots\\.txt|sitemap\\.xml|relay-r9etm|api|img|images/).*)",
  ],
};
