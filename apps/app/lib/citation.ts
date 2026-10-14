// Citations for authority records. No data imports, so client components can
// use it without bundling the dataset.

/** "Montessori, Maria, 1870-1952. The Montessorians, tm0000067. https://…/id/tm0000067." */
export const formatCitation = ({
  heading,
  id,
  permanentUrl,
}: {
  /** The authorized form of the name (or the plain name when there is none) */
  heading: string;
  id: string;
  permanentUrl: string;
}): string => `${heading.replace(/\.$/u, "")}. The Montessorians, ${id}. ${permanentUrl}.`;

/** The citation with today's access date, for copying: the record can change. */
export const withAccessDate = (citation: string, date: Date): string =>
  `${citation} Accessed ${date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}.`;
