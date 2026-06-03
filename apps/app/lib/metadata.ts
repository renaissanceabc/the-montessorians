import merge from "lodash.merge";
import type { Metadata } from "next";
import { siteUrl } from "./utils";

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

export const createMetadata = ({
  title,
  description,
  image,
  ...properties
}: MetadataGenerator): Metadata => {
  const parsedTitle = `${title} | ${applicationName}`;
  const ogImage = image ?? `${siteUrl}/og.png`;
  const defaultMetadata: Metadata = {
    applicationName,
    title: parsedTitle,
    description,
    authors: author,
    creator,
    publisher,
    keywords: [
      "montessori",
      "education",
      "alternative education",
      "school",
      "teaching",
      "microschool",
      "homeschooling",
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-96x96.png",
      apple: "/apple-touch-icon.png",
      other: {
        rel: "apple-touch-icon",
        url: "/apple-touch-icon.png",
      },
    },
    manifest: "/site.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: parsedTitle,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: applicationName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: twitterHandle,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };

  const metadata: Metadata = merge({}, defaultMetadata, properties);

  return metadata;
};
