# Wikidata property proposal: The Montessorians ID

Submitted 2026-10-19 as [Wikidata:Property proposal/The Montessorians ID](https://www.wikidata.org/wiki/Wikidata:Property_proposal/The_Montessorians_ID). The wikitext below is what was posted, kept here for reference.

Paste-ready wikitext for a new proposal page. Create it at [Wikidata:Property proposal/The Montessorians ID](https://www.wikidata.org/w/index.php?title=Wikidata:Property_proposal/The_Montessorians_ID&action=edit), then add `{{Wikidata:Property proposal/The Montessorians ID}}` at the end of the "Authority control" section of [Wikidata:Property proposal/Authority control](https://www.wikidata.org/w/index.php?title=Wikidata:Property_proposal/Authority_control&action=edit). `~~~~` signs it.

Numbers checked against `data/` on 2026-10-15. Update them if the dataset has grown.

```wikitext
== {{TranslateThis | anchor = en
|en = The Montessorians ID
<!-- |xx = property names in some other languages -->
}} ==
{{Property proposal
|status                     =
|description                = {{TranslateThis
|en = identifier for a person or organization in The Montessorians, an open name authority for Montessori alumni and contributors to the Montessori field
<!-- |xx = descriptions in other languages -->
}}
|aliases                    = TM ID | Montessorians ID
|datatype                   = external-id
|domain                     = item: {{Q|Q5}}, {{Q|Q43229}}
|allowed values             = <nowiki>tm\d{7}|tmo\d{6}</nowiki> (people: "tm" + 7 digits; organizations: "tmo" + 6 digits)
|example 1                  = {{Q|Q131117}} → [https://www.themontessorians.xyz/id/tm0000067 tm0000067]
|example 2                  = {{Q|Q28458519}} → [https://www.themontessorians.xyz/id/tm0000069 tm0000069]
|example 3                  = {{Q|Q2867275}} → [https://www.themontessorians.xyz/id/tmo000001 tmo000001]
|source                     = https://www.themontessorians.xyz/data
|issued by                  = Renaissance (https://renaissance.education)
|formatter URL              = https://www.themontessorians.xyz/id/$1
|URL match pattern          = <nowiki>^https?://(?:www\.)?themontessorians\.xyz/(?:id|data)/(tm\d{7}|tmo\d{6})$</nowiki>
|number of ids              = 95 (72 people, 23 organizations, October 2026)
|expected completeness      = {{Q|Q21873974}}
|implied notability         = {{Q|Q62589320}}
|distinct values constraint = yes
|single value constraint    = yes
|mix'n'match                =
|planned use                = Add the ID to the 41 items whose records are already matched and verified (32 people, 9 organizations) with QuickStatements, then work through the rest as records are checked.
|robot and gadget jobs      = Records list their Wikidata QID, so matches can be imported directly. A Mix'n'match catalog can be loaded from https://www.themontessorians.xyz/data/people.csv (columns include id, name, tagline, wikidata), and https://www.themontessorians.xyz/api/reconcile is a W3C reconciliation endpoint for OpenRefine.
|see also                   = {{P|244}}, {{P|214}}, {{P|213}}, {{P|496}}, {{P|3430}}
|subpage                    = The Montessorians ID
|topic                      = authority control
}}

=== {{Int Motivation}} ===
There's no name authority for the Montessori field. LCNAF and VIAF cover people who published books, SNAC has only Maria and Mario Montessori, and most trainers, practitioners and school founders aren't anywhere. The Montessorians gives Montessori alumni and contributors permanent ids that are never reused (merges and withdrawals are logged at https://www.themontessorians.xyz/data/changes.json) and links each record to LCNAF, VIAF, ISNI, ORCID, SNAC and Wikidata. Every record cites its sources and is marked verified or unverified. The data is CC0 and also available as JSON, CSV and schema.org JSON-LD; /id/$1 returns JSON-LD (303 to /data/$1) when asked for application/ld+json. It's being built as the agent authority for the Montessori Glossary Community Project, an open SKOS thesaurus of Montessori terms at the Center for Montessori Studies, University of Hartford. ~~~~

=== {{int:Talk}} ===
```

## Before posting

- **Unverified records.** 23 of 72 people are unverified, and sources contradict a few of the famous-alumni claims. "Planned use" only adds the ID to verified records, which is the answer if reviewers ask whether the ID implies someone attended a Montessori school.
- **Subject item.** There's no Wikidata item for The Montessorians. It can be created once the property exists (it's then used as the "stated in" value), so `subject item` is left out.
- **Size.** Expect "too small" comments at 95 records. Point to the open contribution flow and the verified-only import.
