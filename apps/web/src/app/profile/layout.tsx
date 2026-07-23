import type { Metadata } from 'next';
import { createPageMetadata, privateRobots } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Your profile',
  path: '/profile',
  description: 'Manage your Scout profile and opportunity preferences.',
  robots: privateRobots,
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
