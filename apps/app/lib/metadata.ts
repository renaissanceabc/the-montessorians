import type { Metadata } from "next";

import { siteUrl } from "./utils";

/** A value inside a Next.js `Metadata` object: nested option groups, lists, and scalars. */
type MetadataNode =
  | MetadataTree
  | readonly MetadataNode[]
  | string
  | number
  | boolean
  | URL
  | null
  | undefined;

/** A `Metadata` option group, viewed by key so two of them can be merged. */
interface MetadataTree {
  [key: string]: MetadataNode;
}

const isMetadataTree = (value: MetadataNode): value is MetadataTree =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Recursively merge `source` into `target` (plain objects deep-merged, everything else overwritten). */
const deepMerge = (target: MetadataTree, source: MetadataTree): MetadataTree => {
  const output = { ...target };
  for (const [key, sourceValue] of Object.entries(source)) {
    if (sourceValue === undefined) {
      continue;
    }
    const targetValue = output[key];
    output[key] =
      isMetadataTree(targetValue) && isMetadataTree(sourceValue)
        ? deepMerge(targetValue, sourceValue)
        : sourceValue;
  }
  return output;
};

type MetadataGenerator = Omit<Metadata, "description" | "title"> & {
  title: string;
  description: string;
  image?: string;
};

const applicationName = "The Montessorians";
const author: Metadata["authors"] = [
  {
    name: "Karel Vuong",
    url: "https://x.com/karelvuong",
  },
  {
    name: "Sam Vuong",
    url: "https://x.com/samjvuong",
  },
];
const creator = "Renaissance";
const publisher = "Renaissance";
const twitterHandle = "@renaissanceabc";

/** The Atom feed of new profiles (app/feed.xml), advertised on every page. */
export const feedAlternates = {
  types: {
    "application/atom+xml": [
      { title: "The Montessorians: recently added", url: `${siteUrl}/feed.xml` },
    ],
  },
} satisfies Metadata["alternates"];

export const createMetadata = ({
  title,
  description,
  image,
  ...properties
}: MetadataGenerator): Metadata => {
  const parsedTitle = `${title} | ${applicationName}`;
  const ogImage = image ?? `${siteUrl}/og.png`;
  const defaultMetadata: Metadata = {
    // Pages that set their own `alternates` keep this: the merge below is deep.
    alternates: feedAlternates,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: parsedTitle,
    },
    applicationName,
    authors: author,
    creator,
    description,
    formatDetection: {
      telephone: false,
    },
    icons: {
      apple: "/apple-touch-icon.png",
      icon: "/favicon.ico",
      other: {
        rel: "apple-touch-icon",
        url: "/apple-touch-icon.png",
      },
      shortcut: "/favicon-96x96.png",
    },
    keywords: [
      "montessori",
      "education",
      "alternative education",
      "school",
      "teaching",
      "microschool",
      "homeschooling",
    ],
    manifest: "/site.webmanifest",
    openGraph: {
      description,
      images: [
        {
          alt: title,
          height: 630,
          url: ogImage,
          width: 1200,
        },
      ],
      locale: "en_US",
      siteName: applicationName,
      title,
      type: "website",
    },
    publisher,
    robots: {
      follow: true,
      googleBot: {
        follow: true,
        index: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
      index: true,
    },
    title: parsedTitle,
    twitter: {
      card: "summary_large_image",
      creator: twitterHandle,
      description,
      images: [
        {
          alt: title,
          height: 630,
          url: ogImage,
          width: 1200,
        },
      ],
      title,
    },
  };

  // SAFETY: `Metadata` is a tree of option groups, lists, and scalars, so both
  // inputs can be viewed by key. Every key and value in the merge comes from one
  // of the two `Metadata` inputs, so the result is still a `Metadata`.
  const merged = deepMerge(defaultMetadata as MetadataTree, properties as MetadataTree);
  // SAFETY: see above; the merged tree has only `Metadata` keys and value shapes.
  const metadata = merged as Metadata;

  return metadata;
};
