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
  'Discover internships, hackathons, fellowships, jobs, scholarships and more from across the web—personalized to your profile in one place.';
export const defaultKeywords = [
  'internships',
  'hackathons',
  'fellowships',
  'scholarships',
  'jobs',
  'career opportunities',
  'student opportunities',
  'software engineering internships',
  'AI internships',
  'personalized recommendations',
  'opportunity discovery',
  'Scout',
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
