#!/usr/bin/env node

/**
 * Suggests `contributions` for a contributor's profile from open bibliographic
 * sources, for a maintainer to review. It never writes to data files.
 *
 *   bun run contributions:index -- <slug> [<slug> ...]
 *   bun run contributions:index -- --all
 *
 * Set INDEXER_CONTACT_EMAIL to send a contact address to OpenAlex and Crossref
 * (their "polite pool"); nothing is sent otherwise.
 *
 * Options:
 *   --all          every profile with `kind: contributor`
 *   --any-topic    don't require "montessori" in the title/abstract/subjects
 *                  (on by default for maria-montessori, whose works all count)
 *
 * Sources:
 *   - OpenAlex: authors resolved by ORCID, plus author records whose display
 *     name matches the profile's name or a name variant; their works whose
 *     title or abstract mentions Montessori
 *   - Crossref: works by ORCID, and metadata (authors, venue, year) for every
 *     DOI found
 *   - Open Library: books by the person's names whose title or subjects
 *     mention Montessori
 *   - ERIC: records (including the NAMTA Journal) by the person's names whose
 *     title, abstract, subjects, or journal mention Montessori
 *
 * Candidates already on the profile (same DOI, ISBN, or normalized title) are
 * skipped. Each candidate is printed with a comment saying where it came from.
 * Check every one against the record before copying it into the profile: the
 * sources hold reprints, translations, conference abstracts, and misattributed
 * works, and only the first publication of each distinct work belongs there.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const peopleDir = path.join(ROOT, "data", "people");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const slugs = args.filter((a) => !a.startsWith("--"));
// Optional contact address for the APIs' polite pools. Unset by default; only
// ever read from the environment, never from the command line or the data.
const contact = process.env.INDEXER_CONTACT_EMAIL || "";
const USER_AGENT =
  "the-montessorians-indexer (+https://github.com/renaissanceabc/the-montessorians)";

const TOPIC = /montessori/i;
const SKIP_OPENALEX_TYPES = new Set([
  "paratext",
  "erratum",
  "retraction",
  "peer-review",
  "supplementary-materials",
  "reference-entry",
  "dataset",
  "editorial",
  "letter",
]);
const TYPE_MAP = {
  article: "article",
  review: "article",
  "journal-article": "article",
  book: "book",
  monograph: "book",
  "edited-book": "book",
  "book-chapter": "chapter",
  chapter: "chapter",
  "conference-paper": "other",
  "proceedings-article": "other",
  dissertation: "other",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (res.ok) {
      return res.json();
    }
    if (res.status === 404) {
      return null;
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  throw new Error(`Gave up on ${url}`);
}

const withMailto = (url) =>
  contact ? `${url}${url.includes("?") ? "&" : "?"}mailto=${encodeURIComponent(contact)}` : url;

const normalize = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Title without subtitle, for catching "Foo Bar Baz" vs "Foo Bar Baz: A Subtitle".
// Too short a main title ("Montessori: ...") would match unrelated works.
const shortTitle = (s) => {
  const main = normalize(String(s ?? "").split(/[:.?]/)[0]);
  return main.split(" ").length >= 3 ? main : normalize(s);
};

// "Angeline S. Lillard" and "Angeline Stoll Lillard" both become "angeline lillard".
const nameKey = (s) => {
  const parts = normalize(s).split(" ").filter(Boolean);
  return parts.length < 2 ? parts.join(" ") : `${parts[0]} ${parts.at(-1)}`;
};

function loadProfile(slug) {
  const file = path.join(peopleDir, `${slug}.yaml`);
  if (!fs.existsSync(file)) {
    throw new Error(`No profile at data/people/${slug}.yaml`);
  }
  return yaml.load(fs.readFileSync(file, "utf8"));
}

function contributorSlugs() {
  return fs
    .readdirSync(peopleDir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))
    .filter((slug) => [loadProfile(slug).kind].flat().includes("contributor"))
    .sort();
}

// --- OpenAlex --------------------------------------------------------------

async function openAlexAuthors(profile) {
  const found = new Map();
  const orcid = profile.identifiers?.orcid;
  if (orcid) {
    const data = await getJson(
      withMailto(`https://api.openalex.org/authors?filter=orcid:${orcid}`)
    );
    for (const a of data?.results ?? []) {
      found.set(a.id, { id: a.id, name: a.display_name, match: "orcid" });
    }
  }
  const names = [profile.name, ...(profile.name_variants ?? [])];
  const keys = new Set(names.map(nameKey));
  const exact = new Set(names.map(normalize));
  for (const name of names) {
    const data = await getJson(
      withMailto(`https://api.openalex.org/authors?search=${encodeURIComponent(name)}&per_page=25`)
    );
    for (const a of data?.results ?? []) {
      if (found.has(a.id)) {
        continue;
      }
      // Without an ORCID the name is all we have, so only keep author records
      // whose display name is the person's name (or a variant) word for word,
      // or whose first and last names match and that have an ORCID-less record.
      if (exact.has(normalize(a.display_name))) {
        found.set(a.id, { id: a.id, name: a.display_name, match: "exact name" });
      } else if (keys.has(nameKey(a.display_name)) && !a.ids?.orcid) {
        found.set(a.id, { id: a.id, name: a.display_name, match: "name" });
      }
    }
  }
  return [...found.values()];
}

function abstractText(inverted) {
  if (!inverted) {
    return "";
  }
  return Object.keys(inverted).join(" ");
}

async function openAlexWorks(authors, anyTopic) {
  const works = [];
  for (const author of authors) {
    const shortId = author.id.split("/").pop();
    const topic = anyTopic ? "" : ",title_and_abstract.search:montessori";
    let cursor = "*";
    while (cursor) {
      const data = await getJson(
        withMailto(
          `https://api.openalex.org/works?filter=author.id:${shortId}${topic}&per_page=100&cursor=${cursor}` +
            "&select=id,doi,title,publication_year,type,primary_location,authorships,abstract_inverted_index"
        )
      );
      for (const w of data?.results ?? []) {
        if (SKIP_OPENALEX_TYPES.has(w.type) || !w.title) {
          continue;
        }
        const text = `${w.title} ${abstractText(w.abstract_inverted_index)}`;
        if (!(anyTopic || TOPIC.test(text))) {
          continue;
        }
        const source = w.primary_location?.source;
        works.push({
          title: w.title,
          type: TYPE_MAP[w.type] ?? "other",
          year: w.publication_year ?? undefined,
          venue: source?.display_name ?? undefined,
          doi: w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//i, "") : undefined,
          url: w.doi ? undefined : (w.primary_location?.landing_page_url ?? undefined),
          authors: w.authorships?.map((a) => a.author?.display_name).filter(Boolean),
          from: `openalex ${w.id.split("/").pop()} (author ${shortId}, ${author.match})`,
        });
      }
      cursor = data?.meta?.next_cursor ?? null;
      if ((data?.results ?? []).length === 0) {
        cursor = null;
      }
    }
  }
  return works;
}

// --- Crossref --------------------------------------------------------------

function crossrefToCandidate(m, from) {
  const title = [m.title?.[0], m.subtitle?.[0]].filter(Boolean).join(": ");
  const year = (m.issued ?? m.published ?? m["published-print"])?.["date-parts"]?.[0]?.[0];
  const book = m.type === "book" || m.type === "monograph" || m.type === "edited-book";
  return {
    title,
    type: TYPE_MAP[m.type] ?? "other",
    year: year ?? undefined,
    venue: (book ? m.publisher : m["container-title"]?.[0]) ?? m.publisher ?? undefined,
    doi: m.DOI,
    authors: (m.author ?? [])
      .map((a) => [a.given, a.family].filter(Boolean).join(" ") || a.name)
      .filter(Boolean),
    from,
  };
}

async function crossrefByOrcid(orcid, anyTopic) {
  const out = [];
  let cursor = "*";
  while (cursor) {
    const data = await getJson(
      withMailto(
        `https://api.crossref.org/works?filter=orcid:${orcid}&rows=200&cursor=${encodeURIComponent(cursor)}`
      )
    );
    const items = data?.message?.items ?? [];
    for (const m of items) {
      const text = `${m.title?.[0] ?? ""} ${m.subtitle?.[0] ?? ""} ${m.abstract ?? ""}`;
      if (anyTopic || TOPIC.test(text)) {
        out.push(crossrefToCandidate(m, `crossref (orcid ${orcid})`));
      }
    }
    cursor = items.length ? data.message["next-cursor"] : null;
  }
  return out;
}

async function crossrefWork(doi) {
  const data = await getJson(
    withMailto(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
  );
  return data?.message ?? null;
}

// --- Open Library ----------------------------------------------------------

async function openLibraryBooks(profile, anyTopic) {
  const out = [];
  const names = [profile.name, ...(profile.name_variants ?? [])];
  const keys = new Set(names.map(nameKey));
  const seen = new Set();
  for (const name of names) {
    const data = await getJson(
      `https://openlibrary.org/search.json?author=${encodeURIComponent(name)}&limit=200` +
        "&fields=key,title,subtitle,first_publish_year,author_name,subject,language,publisher,edition_count"
    );
    for (const d of data?.docs ?? []) {
      if (seen.has(d.key)) {
        continue;
      }
      seen.add(d.key);
      if (!(d.author_name ?? []).some((a) => keys.has(nameKey(a)))) {
        continue;
      }
      const text = `${d.title} ${d.subtitle ?? ""} ${(d.subject ?? []).join(" ")}`;
      if (!(anyTopic || TOPIC.test(text))) {
        continue;
      }
      out.push({
        title: [d.title, d.subtitle].filter(Boolean).join(": "),
        type: "book",
        year: d.first_publish_year ?? undefined,
        venue: d.publisher?.[0] ?? undefined,
        // Orphaned editions come back with a /works/…M key; they live under /books/.
        url: `https://openlibrary.org${d.key.replace(/^\/works\/(OL\d+M)$/, "/books/$1")}`,
        authors: d.author_name,
        from: `openlibrary ${d.key} (${d.edition_count ?? "?"} editions; languages: ${(d.language ?? []).join(", ") || "?"})`,
      });
    }
  }
  return out;
}

// --- ERIC ------------------------------------------------------------------

const decodeEntities = (s) =>
  String(s ?? "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

// "Angeline Stoll Lillard" -> "Lillard, Angeline", the form ERIC indexes.
const invertName = (s) => {
  const parts = String(s).trim().split(/\s+/);
  return parts.length < 2 ? s : `${parts.at(-1)}, ${parts[0]}`;
};

async function ericRecords(profile, anyTopic) {
  const out = [];
  const names = [profile.name, ...(profile.name_variants ?? [])];
  const keys = new Set(names.map(nameKey));
  const seen = new Set();
  for (const query of new Set(names.map(invertName))) {
    const data = await getJson(
      `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(`author:"${query}"`)}&format=json&rows=200` +
        "&fields=id,title,author,publicationdateyear,source,publicationtype,isbn,description,subject"
    );
    for (const d of data?.response?.docs ?? []) {
      if (seen.has(d.id)) {
        continue;
      }
      seen.add(d.id);
      // ERIC lists authors as "Last, First"; turn them around before matching.
      const authors = (d.author ?? []).map((a) => a.split(/,\s*/).reverse().join(" "));
      if (!authors.some((a) => keys.has(nameKey(a)))) {
        continue;
      }
      const text = `${d.title} ${d.description ?? ""} ${(d.subject ?? []).join(" ")} ${d.source ?? ""}`;
      if (!(anyTopic || TOPIC.test(text))) {
        continue;
      }
      const kinds = d.publicationtype ?? [];
      const isbn = (d.isbn ?? [])
        .map((i) => i.replace(/^ISBN-/, "").replace(/-/g, ""))
        .find(Boolean);
      out.push({
        title: decodeEntities(d.title),
        type: kinds.includes("Journal Articles")
          ? "article"
          : kinds.includes("Books")
            ? "book"
            : "other",
        year: d.publicationdateyear ?? undefined,
        venue: d.source ?? undefined,
        isbn: isbn && /^(97[89])?\d{9}[\dX]$/.test(isbn) ? isbn : undefined,
        url: `https://eric.ed.gov/?id=${d.id}`,
        authors,
        from: `eric ${d.id} (${kinds.join(", ")})`,
      });
    }
  }
  return out;
}

// --- Merge -----------------------------------------------------------------

// Oxford Academic splits a monograph into a book DOI (<stem>.001.0001) and
// front matter/chapters (<stem>.002.xxxx, <stem>.003.xxxx, ...). Fold the
// parts into one candidate for the book.
const OUP_PART = /^(10\.1093\/.+)\.00([2-9])\.\d{4}$/i;

function existingKeys(profile) {
  const dois = new Set();
  const isbns = new Set();
  const titles = new Set();
  for (const c of profile.contributions ?? []) {
    if (c.doi) {
      dois.add(c.doi.toLowerCase());
    }
    if (c.isbn) {
      isbns.add(c.isbn);
    }
    titles.add(normalize(c.title));
    titles.add(shortTitle(c.title));
  }
  return { dois, isbns, titles };
}

async function candidatesFor(slug) {
  const profile = loadProfile(slug);
  const anyTopic = flags.has("--any-topic") || slug === "maria-montessori";
  const authors = await openAlexAuthors(profile);
  const found = [...(await openAlexWorks(authors, anyTopic))];
  if (profile.identifiers?.orcid) {
    found.push(...(await crossrefByOrcid(profile.identifiers.orcid, anyTopic)));
  }
  found.push(...(await openLibraryBooks(profile, anyTopic)));
  found.push(...(await ericRecords(profile, anyTopic)));
  for (const c of found) {
    const part = c.doi?.match(OUP_PART);
    if (part) {
      Object.assign(c, {
        title: c.venue ?? c.title,
        type: "book",
        doi: `${part[1]}.001.0001`,
        venue: undefined,
        from: `${c.from}, folded into its book`,
      });
    }
  }

  // Prefer Crossref's metadata for anything with a DOI: it has the authors as
  // printed and the container title.
  const byDoi = new Map();
  const rest = [];
  for (const c of found) {
    if (!c.doi) {
      rest.push(c);
      continue;
    }
    const key = c.doi.toLowerCase();
    if (byDoi.has(key)) {
      byDoi.get(key).from += `; ${c.from}`;
      continue;
    }
    byDoi.set(key, c);
  }
  for (const [key, c] of byDoi) {
    if (!c.from.includes("crossref")) {
      const m = await crossrefWork(key);
      if (m) {
        const cr = crossrefToCandidate(m, c.from);
        byDoi.set(key, { ...cr, type: cr.type === "other" ? c.type : cr.type });
      }
    }
  }

  const merged = [...byDoi.values()];
  merged.push(...rest);

  const existing = existingKeys(profile);
  const seenTitles = new Map();
  const candidates = [];
  // Within a year, records with a DOI win the title dedupe over those without.
  merged.sort(
    (a, b) => (a.year ?? 9999) - (b.year ?? 9999) || Number(Boolean(b.doi)) - Number(Boolean(a.doi))
  );
  for (const c of merged) {
    const t = normalize(c.title);
    if (
      (c.doi && existing.dois.has(c.doi.toLowerCase())) ||
      (c.isbn && existing.isbns.has(c.isbn)) ||
      existing.titles.has(t) ||
      existing.titles.has(shortTitle(c.title)) ||
      // "Montessori Today: A Subtitle" when the profile lists "Montessori Today"
      existing.titles.has(normalize(String(c.title).split(":")[0]))
    ) {
      continue;
    }
    if (seenTitles.has(t)) {
      const kept = seenTitles.get(t);
      kept.from += `; also ${c.from}${c.year === kept.year ? "" : ` [${c.year}]`}`;
      continue;
    }
    seenTitles.set(t, c);
    candidates.push(c);
  }
  return { profile, authors, candidates };
}

// Some sources carry stray C1 control characters (e.g. around "The NAMTA journal").
const clean = (s) =>
  typeof s === "string"
    ? s
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : s;

function toYaml(c) {
  const entry = { title: clean(c.title), type: c.type };
  for (const key of ["year", "venue", "doi", "isbn", "url"]) {
    if (c[key] !== undefined && c[key] !== "") {
      entry[key] = clean(c[key]);
    }
  }
  if ((c.authors ?? []).length > 1) {
    entry.authors = c.authors.map(clean);
  }
  const body = yaml.dump([entry], { lineWidth: 120, quotingType: '"' }).trimEnd();
  return `  # from ${c.from}\n${body.replace(/^/gm, "  ")}`;
}

async function main() {
  const targets = flags.has("--all") ? contributorSlugs() : slugs;
  if (targets.length === 0) {
    console.error(
      "Usage: bun run contributions:index -- <slug> [<slug> ...] | --all [--any-topic]"
    );
    process.exit(1);
  }
  for (const slug of targets) {
    const { profile, authors, candidates } = await candidatesFor(slug);
    console.log(`# ${profile.name} (data/people/${slug}.yaml)`);
    console.log(
      `# ${(profile.contributions ?? []).length} existing contributions, ${candidates.length} candidates`
    );
    for (const a of authors) {
      console.log(`# OpenAlex author ${a.id} "${a.name}" (${a.match})`);
    }
    console.log(
      "# Review each candidate against its record before adding it. Nothing has been written."
    );
    console.log("contributions:");
    for (const c of candidates) {
      console.log(toYaml(c));
    }
    console.log();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
