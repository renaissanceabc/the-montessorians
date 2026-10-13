---
"app": minor
---

One consistent layout, redesigned pages, a safer submit flow, and fuller organization and profile records.

- **Layout**: the header, pages, and footer share one width and edge. Browsing pages use the full width, with people as two-column cards and organizations as a three-column grid; reading pages use a centered column; profiles and organizations put cite, identifiers, sources, and related people in a side column. Dark mode is gone, text styles are shared, photos load at the size they're shown, focus is visible everywhere, and profiles print cleanly.
- **Safety**: submissions and the reconciliation API are rate limited and size capped, every page sends a content security policy and hardening headers, and a new privacy page explains what the site collects.
- **Discovery**: an Atom feed of new profiles, share images for organizations and tags, cleaner linked data, and search across taglines, tags, and organization names.
- **Organizations**: Toronto Montessori Schools is now Lauremont School and Okemos Montessori School is now Montessori Radmoor (old names kept as variants), Paint Branch is in Spencerville, and most records gain a description, founding year, website, and Library of Congress, VIAF, Wikidata, ROR, or ISNI identifiers. New: Montessori School of Sudbury and Emmy Bergmann's Montessori Kinderhaus.
- **Profiles**: photo credits where a source could be traced, ISNI and other identifiers from authority records, school links, and Sara Gilbert's photo now shows the right person.
- **Pages**: the home page leads with today's Montessorian beside the headline, six recent alumni, a row of contributors, and one contribute prompt. Profiles and organizations put sources and related people first, with the permanent link, a copy button, and identifiers in a quieter record block that folds away on phones. Phone headers are centered, facts wrap instead of being cut off, sharing floats at the bottom, verification is a blue seal, and US locations drop the country.
- **Feel**: cards and chips respond to presses, the cite button and form steps ease in, popovers use one quick curve, and reduced-motion settings are respected.
- **Speed**: Sentry and PostHog load only when configured and after the page is idle, and an unused font is gone, cutting most pages' JavaScript and lifting phone Lighthouse scores to 80–93, with accessibility at 100.
