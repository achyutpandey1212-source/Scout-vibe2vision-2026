import type { Metadata } from 'next';

const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return 'https://scout.app';
};

export const siteUrl = new URL(getSiteUrl());
export const siteName = 'Scout';
export const defaultDescription =
  'Scout helps women discover internships, scholarships, hackathons, fellowships, grants, returnships, jobs and hidden opportunities personalized for their goals.';
export const defaultKeywords = [
  'opportunities for women',
  'internships',
  'scholarships',
  'fellowships',
  'grants',
  'jobs',
  'hackathons',
  'career opportunities',
];

const defaultImage = new URL('/og/og-default.png', siteUrl).toString();

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  robots?: Metadata['robots'];
  type?: 'website' | 'article';
};

/** Builds a complete, consistent metadata record for each Scout route. */
export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  robots = { index: true, follow: true },
  type = 'website',
}: PageMetadataOptions): Metadata {
  const url = new URL(path, siteUrl).toString();

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    robots,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url,
      type,
      siteName,
      images: [{ url: defaultImage, width: 1200, height: 630, alt: 'Scout' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteName}`,
      description,
      images: [defaultImage],
    },
  };
}

export const privateRobots: Metadata['robots'] = { index: false, follow: false, nocache: true };
