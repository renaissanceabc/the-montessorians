import { idUrl } from "@/lib/content/authority";
import { getAllProfiles } from "@/lib/content/profiles";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-static";

/** Profiles in the feed, newest first. */
const FEED_SIZE = 50;

const XML_ESCAPES = new Map([
  ['"', "&quot;"],
  ["&", "&amp;"],
  ["'", "&apos;"],
  ["<", "&lt;"],
  [">", "&gt;"],
]);

const escapeXml = (s: string) => s.replaceAll(/[&<>"']/gu, (c) => XML_ESCAPES.get(c) ?? c);

/**
 * GET /feed.xml
 *
 * An Atom feed of the most recently added profiles. Entry ids are the
 * records' permanent identifiers, so feed readers never see an entry twice
 * after a slug changes.
 */
export const GET = () => {
  const profiles = getAllProfiles()
    // Dates carry different UTC offsets, so compare instants, not strings.
    .toSorted(
      (a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt) || a.name.localeCompare(b.name)
    )
    .slice(0, FEED_SIZE);
  const updated = profiles[0]?.addedAt ?? new Date(0).toISOString();

  const entries = profiles.map((p) => {
    const url = `${siteUrl}/${p.slug}`;
    const categories = p.tags
      .map((t) => `    <category term="${escapeXml(t.slug)}" label="${escapeXml(t.label)}"/>`)
      .join("\n");
    return `  <entry>
    <id>${escapeXml(idUrl(p.id))}</id>
    <title>${escapeXml(p.name)}</title>
    <link rel="alternate" type="text/html" href="${escapeXml(url)}"/>
    <published>${escapeXml(p.addedAt)}</published>
    <updated>${escapeXml(p.addedAt)}</updated>
${p.tagline ? `    <summary>${escapeXml(p.tagline)}</summary>\n` : ""}${categories}
  </entry>`;
  });

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${escapeXml(`${siteUrl}/feed.xml`)}</id>
  <title>The Montessorians: recently added</title>
  <subtitle>Montessori alumni and contributors, newest profiles first.</subtitle>
  <link rel="self" type="application/atom+xml" href="${escapeXml(`${siteUrl}/feed.xml`)}"/>
  <link rel="alternate" type="text/html" href="${escapeXml(siteUrl)}"/>
  <updated>${escapeXml(updated)}</updated>
  <author><name>The Montessorians</name><uri>${escapeXml(siteUrl)}</uri></author>
  <rights>Data dedicated to the public domain under CC0 1.0</rights>
  <icon>${escapeXml(`${siteUrl}/favicon-96x96.png`)}</icon>
${entries.join("\n")}
</feed>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
};
