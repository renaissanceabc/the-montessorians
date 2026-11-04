import { LICENSE_URL } from "@/lib/content/authority";
import type { RecordDates } from "@/lib/content/types";

/**
 * Dublin Core meta tags for a record page, which Zotero and other citation
 * managers read: what the record is, who publishes it, its permanent
 * identifier, licence, and when it last changed.
 */
interface DublinCoreMeta {
  "dc.identifier": string;
  "dc.publisher": string;
  "dc.rights": string;
  "dc.title": string;
  "dc.type": string;
  "dc.date.created"?: string;
  "dc.date.modified"?: string;
}

export const dublinCoreMeta = ({
  title,
  permanentUrl,
  dates,
}: {
  title: string;
  permanentUrl: string;
  dates: RecordDates | null | undefined;
}): DublinCoreMeta => {
  const meta: DublinCoreMeta = {
    "dc.identifier": permanentUrl,
    "dc.publisher": "The Montessorians",
    "dc.rights": LICENSE_URL,
    "dc.title": title,
    "dc.type": "Dataset",
  };
  if (dates) {
    meta["dc.date.created"] = dates.created;
    meta["dc.date.modified"] = dates.modified;
  }
  return meta;
};
