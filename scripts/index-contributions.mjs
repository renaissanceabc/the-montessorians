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
import { setTimeout as sleep } from "node:timers/promises";

import { dump, load } from "js-yaml";

const __dirname = import.meta.dirname;
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

const TOPIC = /montessori/iu;
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
  book: "book",
  "book-chapter": "chapter",
  chapter: "chapter",
  "conference-paper": "other",
  dissertation: "other",
  "edited-book": "book",
  "journal-article": "article",
  monograph: "book",
  "proceedings-article": "other",
  review: "article",
};

// Retries are sequential by design: each waits on the previous attempt and backs off.
const getJson = async (url) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- retry loop: each attempt depends on the previous one's status
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
    if (res.ok) {
      return res.json();
    }
    if (res.status === 404) {
      return null;
    }
    if (res.status === 429 || res.status >= 500) {
      // oxlint-disable-next-line eslint/no-await-in-loop -- deliberate backoff before the next retry
      await sleep(1000 * (attempt + 1));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  throw new Error(`Gave up on ${url}`);
};

const withMailto = (url) =>
  contact ? `${url}${url.includes("?") ? "&" : "?"}mailto=${encodeURIComponent(contact)}` : url;

const normalize = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .replaceAll(/[̀-ͯ]/gu, "")
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll(/[^a-z0-9]+/gu, " ")
    .trim();

// Title without subtitle, for catching "Foo Bar Baz" vs "Foo Bar Baz: A Subtitle".
// Too short a main title ("Montessori: ...") would match unrelated works.
const shortTitle = (s) => {
  const mainTitle = normalize(String(s ?? "").split(/[:.?]/u)[0]);
  return mainTitle.split(" ").length >= 3 ? mainTitle : normalize(s);
};

// "Angeline S. Lillard" and "Angeline Stoll Lillard" both become "angeline lillard".
const nameKey = (s) => {
  const parts = normalize(s).split(" ").filter(Boolean);
  return parts.length < 2 ? parts.join(" ") : `${parts[0]} ${parts.at(-1)}`;
};

const loadProfile = (slug) => {
  const file = path.join(peopleDir, `${slug}.yaml`);
  if (!fs.existsSync(file)) {
    throw new Error(`No profile at data/people/${slug}.yaml`);
  }
  return load(fs.readFileSync(file, "utf-8"));
};

const contributorSlugs = () =>
  fs
    .readdirSync(peopleDir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/u, ""))
    .filter((slug) => [loadProfile(slug).kind].flat().includes("contributor"))
    .toSorted();

// --- OpenAlex --------------------------------------------------------------

// The API calls below run one at a time on purpose: it keeps the indexer within
// the APIs' polite rate limits, and pagination needs the previous page's cursor.

const openAlexAuthors = async (profile) => {
  const found = new Map();
  const orcid = profile.identifiers?.orcid;
  if (orcid) {
    const data = await getJson(
      withMailto(`https://api.openalex.org/authors?filter=orcid:${orcid}`)
    );
    for (const a of data?.results ?? []) {
      found.set(a.id, { id: a.id, match: "orcid", name: a.display_name });
    }
  }
  const names = [profile.name, ...(profile.name_variants ?? [])];
  const keys = new Set(names.map(nameKey));
  const exact = new Set(names.map(normalize));
  for (const name of names) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- one request at a time, to stay within the API's rate limit
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
        found.set(a.id, { id: a.id, match: "exact name", name: a.display_name });
      } else if (keys.has(nameKey(a.display_name)) && !a.ids?.orcid) {
        found.set(a.id, { id: a.id, match: "name", name: a.display_name });
      }
    }
  }
  return [...found.values()];
};

const abstractText = (inverted) => {
  if (!inverted) {
    return "";
  }
  return Object.keys(inverted).join(" ");
};

/** An OpenAlex work as a candidate, or null when its type or topic rules it out. */
const openAlexCandidate = (w, author, shortId, anyTopic) => {
  if (SKIP_OPENALEX_TYPES.has(w.type) || !w.title) {
    return null;
  }
  const text = `${w.title} ${abstractText(w.abstract_inverted_index)}`;
  if (!(anyTopic || TOPIC.test(text))) {
    return null;
  }
  const source = w.primary_location?.source;
  return {
    authors: w.authorships?.map((a) => a.author?.display_name).filter(Boolean),
    doi: w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//iu, "") : undefined,
    from: `openalex ${w.id.split("/").pop()} (author ${shortId}, ${author.match})`,
    title: w.title,
    type: TYPE_MAP[w.type] ?? "other",
    url: w.doi ? undefined : (w.primary_location?.landing_page_url ?? undefined),
    venue: source?.display_name ?? undefined,
    year: w.publication_year ?? undefined,
  };
};

/** Every page of one OpenAlex author's works, as candidates. */
const openAlexAuthorWorks = async (author, anyTopic) => {
  const works = [];
  const shortId = author.id.split("/").pop();
  const topic = anyTopic ? "" : ",title_and_abstract.search:montessori";
  let cursor = "*";
  while (cursor) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- cursor pagination: each page needs the previous page's cursor
    const data = await getJson(
      withMailto(
        `https://api.openalex.org/works?filter=author.id:${shortId}${topic}&per_page=100&cursor=${cursor}` +
          "&select=id,doi,title,publication_year,type,primary_location,authorships,abstract_inverted_index"
      )
    );
    for (const w of data?.results ?? []) {
      const candidate = openAlexCandidate(w, author, shortId, anyTopic);
      if (candidate) {
        works.push(candidate);
      }
    }
    cursor = data?.meta?.next_cursor ?? null;
    if ((data?.results ?? []).length === 0) {
      cursor = null;
    }
  }
  return works;
};

const openAlexWorks = async (authors, anyTopic) => {
  const works = [];
  for (const author of authors) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- one author at a time, to stay within the API's rate limit
    works.push(...(await openAlexAuthorWorks(author, anyTopic)));
  }
  return works;
};

// --- Crossref --------------------------------------------------------------

const crossrefToCandidate = (m, from) => {
  const title = [m.title?.[0], m.subtitle?.[0]].filter(Boolean).join(": ");
  const year = (m.issued ?? m.published ?? m["published-print"])?.["date-parts"]?.[0]?.[0];
  const book = m.type === "book" || m.type === "monograph" || m.type === "edited-book";
  return {
    authors: (m.author ?? [])
      .map((a) => [a.given, a.family].filter(Boolean).join(" ") || a.name)
      .filter(Boolean),
    doi: m.DOI,
    from,
    title,
    type: TYPE_MAP[m.type] ?? "other",
    venue: (book ? m.publisher : m["container-title"]?.[0]) ?? m.publisher ?? undefined,
    year: year ?? undefined,
  };
};

const crossrefByOrcid = async (orcid, anyTopic) => {
  const out = [];
  let cursor = "*";
  while (cursor) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- cursor pagination: each page needs the previous page's cursor
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
};

const crossrefWork = async (doi) => {
  const data = await getJson(
    withMailto(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
  );
  return data?.message ?? null;
};

// --- Open Library ----------------------------------------------------------

const openLibraryBooks = async (profile, anyTopic) => {
  const out = [];
  const names = [profile.name, ...(profile.name_variants ?? [])];
  const keys = new Set(names.map(nameKey));
  const seen = new Set();
  for (const name of names) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- one request at a time, to stay within the API's rate limit
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
        authors: d.author_name,
        from: `openlibrary ${d.key} (${d.edition_count ?? "?"} editions; languages: ${(d.language ?? []).join(", ") || "?"})`,
        title: [d.title, d.subtitle].filter(Boolean).join(": "),
        type: "book",
        // Orphaned editions come back with a /works/…M key; they live under /books/.
        url: `https://openlibrary.org${d.key.replace(/^\/works\/(?<edition>OL\d+M)$/u, "/books/$<edition>")}`,
        venue: d.publisher?.[0] ?? undefined,
        year: d.first_publish_year ?? undefined,
      });
    }
  }
  return out;
};

// --- ERIC ------------------------------------------------------------------

const decodeEntities = (s) =>
  String(s ?? "")
    .replaceAll("&quot;", '"')
    .replaceAll(/&#39;|&apos;/gu, "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

// "Angeline Stoll Lillard" -> "Lillard, Angeline", the form ERIC indexes.
const invertName = (s) => {
  const parts = String(s).trim().split(/\s+/u);
  return parts.length < 2 ? s : `${parts.at(-1)}, ${parts[0]}`;
};

const ericType = (kinds) => {
  if (kinds.includes("Journal Articles")) {
    return "article";
  }
  if (kinds.includes("Books")) {
    return "book";
  }
  return "other";
};

/** An ERIC record as a candidate, or null when the author or topic doesn't match. */
const ericCandidate = (d, keys, anyTopic) => {
  // ERIC lists authors as "Last, First"; turn them around before matching.
  const authors = (d.author ?? []).map((a) => a.split(/,\s*/u).toReversed().join(" "));
  if (!authors.some((a) => keys.has(nameKey(a)))) {
    return null;
  }
  const text = `${d.title} ${d.description ?? ""} ${(d.subject ?? []).join(" ")} ${d.source ?? ""}`;
  if (!(anyTopic || TOPIC.test(text))) {
    return null;
  }
  const kinds = d.publicationtype ?? [];
  const isbn = (d.isbn ?? [])
    .map((i) => i.replace(/^ISBN-/u, "").replaceAll("-", ""))
    .find(Boolean);
  return {
    authors,
    from: `eric ${d.id} (${kinds.join(", ")})`,
    isbn: isbn && /^(?:97[89])?\d{9}[\dX]$/u.test(isbn) ? isbn : undefined,
    title: decodeEntities(d.title),
    type: ericType(kinds),
    url: `https://eric.ed.gov/?id=${d.id}`,
    venue: d.source ?? undefined,
    year: d.publicationdateyear ?? undefined,
  };
};

const ericRecords = async (profile, anyTopic) => {
  const out = [];
  const names = [profile.name, ...(profile.name_variants ?? [])];
  const keys = new Set(names.map(nameKey));
  const seen = new Set();
  for (const query of new Set(names.map(invertName))) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- one request at a time, to stay within the API's rate limit
    const data = await getJson(
      `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(`author:"${query}"`)}&format=json&rows=200` +
        "&fields=id,title,author,publicationdateyear,source,publicationtype,isbn,description,subject"
    );
    for (const d of data?.response?.docs ?? []) {
      if (seen.has(d.id)) {
        continue;
      }
      seen.add(d.id);
      const candidate = ericCandidate(d, keys, anyTopic);
      if (candidate) {
        out.push(candidate);
      }
    }
  }
  return out;
};

// --- Merge -----------------------------------------------------------------

// Oxford Academic splits a monograph into a book DOI (<stem>.001.0001) and
// front matter/chapters (<stem>.002.xxxx, <stem>.003.xxxx, ...). Fold the
// parts into one candidate for the book.
const OUP_PART = /^(?<stem>10\.1093\/.+)\.00(?<part>[2-9])\.\d{4}$/iu;

const existingKeys = (profile) => {
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
};

/** Fold Oxford Academic chapter/front-matter DOIs into their book (in place). */
const foldOupParts = (found) => {
  for (const c of found) {
    const part = c.doi?.match(OUP_PART);
    if (part) {
      Object.assign(c, {
        doi: `${part.groups.stem}.001.0001`,
        from: `${c.from}, folded into its book`,
        title: c.venue ?? c.title,
        type: "book",
        venue: undefined,
      });
    }
  }
};

/**
 * One candidate per DOI, preferring Crossref's metadata for anything with a DOI
 * (it has the authors as printed and the container title), then those without.
 */
const mergeByDoi = async (found) => {
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
      // oxlint-disable-next-line eslint/no-await-in-loop -- one request at a time, to stay within the API's rate limit
      const m = await crossrefWork(key);
      if (m) {
        const cr = crossrefToCandidate(m, c.from);
        byDoi.set(key, { ...cr, type: cr.type === "other" ? c.type : cr.type });
      }
    }
  }
  return [...byDoi.values(), ...rest];
};

/** Whether the profile already lists this candidate (same DOI, ISBN, or title). */
const alreadyListed = (existing, c) =>
  (c.doi && existing.dois.has(c.doi.toLowerCase())) ||
  (c.isbn && existing.isbns.has(c.isbn)) ||
  existing.titles.has(normalize(c.title)) ||
  existing.titles.has(shortTitle(c.title)) ||
  // "Montessori Today: A Subtitle" when the profile lists "Montessori Today"
  existing.titles.has(normalize(String(c.title).split(":")[0]));

/** Drop what the profile already has, and fold same-title records into the first. */
const dedupe = (profile, merged) => {
  const existing = existingKeys(profile);
  const seenTitles = new Map();
  const candidates = [];
  // Within a year, records with a DOI win the title dedupe over those without.
  const ordered = merged.toSorted(
    (a, b) => (a.year ?? 9999) - (b.year ?? 9999) || Number(Boolean(b.doi)) - Number(Boolean(a.doi))
  );
  for (const c of ordered) {
    if (alreadyListed(existing, c)) {
      continue;
    }
    const t = normalize(c.title);
    if (seenTitles.has(t)) {
      const kept = seenTitles.get(t);
      kept.from += `; also ${c.from}${c.year === kept.year ? "" : ` [${c.year}]`}`;
      continue;
    }
    seenTitles.set(t, c);
    candidates.push(c);
  }
  return candidates;
};

const candidatesFor = async (slug) => {
  const profile = loadProfile(slug);
  const anyTopic = flags.has("--any-topic") || slug === "maria-montessori";
  const authors = await openAlexAuthors(profile);
  const found = [...(await openAlexWorks(authors, anyTopic))];
  if (profile.identifiers?.orcid) {
    found.push(...(await crossrefByOrcid(profile.identifiers.orcid, anyTopic)));
  }
  found.push(
    ...(await openLibraryBooks(profile, anyTopic)),
    ...(await ericRecords(profile, anyTopic))
  );
  foldOupParts(found);
  const merged = await mergeByDoi(found);
  return { authors, candidates: dedupe(profile, merged), profile };
};

// Some sources carry stray C1 control characters (e.g. around "The NAMTA journal").
// API values arrive untyped; only strings are cleaned (years and the like pass through).
const clean = (s) =>
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- raw API field: strings get cleaned, numbers (years) pass through unchanged
  typeof s === "string"
    ? s
        // oxlint-disable-next-line eslint/no-control-regex -- stripping control characters is the point
        .replaceAll(/[\u0000-\u001F\u007F-\u009F]/gu, "")
        .replaceAll(/\s+/gu, " ")
        .trim()
    : s;

const toYaml = (c) => {
  const entry = { title: clean(c.title), type: c.type };
  for (const key of ["year", "venue", "doi", "isbn", "url"]) {
    if (c[key] !== undefined && c[key] !== "") {
      entry[key] = clean(c[key]);
    }
  }
  if ((c.authors ?? []).length > 1) {
    entry.authors = c.authors.map(clean);
  }
  const body = dump([entry], { lineWidth: 120, quotingType: '"' }).trimEnd();
  return `  # from ${c.from}\n${body.replaceAll(/^/gmu, "  ")}`;
};

const main = async () => {
  const targets = flags.has("--all") ? contributorSlugs() : slugs;
  if (targets.length === 0) {
    console.error(
      "Usage: bun run contributions:index -- <slug> [<slug> ...] | --all [--any-topic]"
    );
    process.exit(1);
  }
  for (const slug of targets) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- one profile at a time: keeps API traffic polite and the output in order
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
};

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
