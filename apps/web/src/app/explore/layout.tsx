import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Explore opportunities',
  path: '/explore',
  description:
    'Browse internships, scholarships, fellowships, grants, jobs, hackathons, and more opportunities for women.',
});

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
