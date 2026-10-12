import { organizationJsonLd, personJsonLd, resolveId } from "@/lib/content/authority";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";

// Per-record JSON-LD: /data/<id>

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [...getAllProfiles().map((p) => p.id), ...getAllOrganizations().map((o) => o.id)].map(
    (id) => ({ id })
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = resolveId(id);
  const body =
    resolved?.kind === "person"
      ? personJsonLd(resolved.profile)
      : resolved?.kind === "organization"
        ? organizationJsonLd(resolved.organization)
        : null;
  if (!body) {
    return new Response(null, { status: 404 });
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
