const US_SUFFIX = ", United States";

/** "Austin, Texas, United States" reads as "Austin, Texas"; other countries stay as they are. */
export const formatLocation = (location: string): string =>
  location.endsWith(US_SUFFIX) ? location.slice(0, -US_SUFFIX.length) : location;
