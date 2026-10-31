import {
  getChanges,
  idUrl,
  organizationJsonLd,
  personJsonLd,
  resolveId,
} from "@/lib/content/authority";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";

// Per-record JSON-LD: /data/<id>. Merged ids redirect to the surviving record
// (next.config); withdrawn ids answer 410 Gone with a short tombstone.

export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = () =>
  [
    ...getAllProfiles().map((p) => p.id),
    ...getAllOrganizations().map((o) => o.id),
    ...getChanges()
      .filter((c) => c.action === "withdrawn")
      .map((c) => c.id),
  ].map((id) => ({ id }));

/** What /data/<id> answers for an id that was withdrawn. */
interface Tombstone {
  "@context": string;
  "@id": string;
  description: string;
  identifier: string;
  name?: string;
}

type RecordJsonLd =
  | ReturnType<typeof personJsonLd>
  | ReturnType<typeof organizationJsonLd>
  | Tombstone;

const jsonLdResponse = (body: RecordJsonLd, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/ld+json; charset=utf-8",
    },
    status,
  });

export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const resolved = resolveId(id);
  if (resolved?.kind === "person") {
    return jsonLdResponse(personJsonLd(resolved.profile));
  }
  if (resolved?.kind === "organization") {
    return jsonLdResponse(organizationJsonLd(resolved.organization));
  }
  if (resolved?.kind === "withdrawn") {
    const { change } = resolved;
    return jsonLdResponse(
      {
        "@context": "https://schema.org",
        "@id": idUrl(id),
        description: `Withdrawn on ${change.date}${change.reason ? `: ${change.reason}` : ""}. The identifier is reserved and will not be reused.`,
        identifier: id,
        name: change.name,
      },
      410
    );
  }
  return new Response(null, { status: 404 });
};
