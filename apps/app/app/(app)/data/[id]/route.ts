import { organizationJsonLd, personJsonLd, resolveId } from "@/lib/content/authority";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";

// Per-record JSON-LD: /data/<id>

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = () =>
  [...getAllProfiles().map((p) => p.id), ...getAllOrganizations().map((o) => o.id)].map((id) => ({
    id,
  }));

export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const resolved = resolveId(id);
  let body: ReturnType<typeof personJsonLd> | ReturnType<typeof organizationJsonLd> | null = null;
  if (resolved?.kind === "person") {
    body = personJsonLd(resolved.profile);
  } else if (resolved?.kind === "organization") {
    body = organizationJsonLd(resolved.organization);
  }
  if (!body) {
    return new Response(null, { status: 404 });
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/ld+json; charset=utf-8",
    },
  });
};
