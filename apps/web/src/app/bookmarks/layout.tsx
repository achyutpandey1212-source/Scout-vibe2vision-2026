import type { Metadata } from 'next';
import { createPageMetadata, privateRobots } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Saved opportunities',
  path: '/bookmarks',
  description: 'Review the opportunities you have saved in Scout.',
  robots: privateRobots,
});

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
