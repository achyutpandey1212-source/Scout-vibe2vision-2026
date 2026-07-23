import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: new URL('/', siteUrl).toString(),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: new URL('/login', siteUrl).toString(),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: new URL('/signup', siteUrl).toString(),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: new URL('/explore', siteUrl).toString(),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];
}
