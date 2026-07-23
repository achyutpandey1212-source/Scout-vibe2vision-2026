import type { Metadata } from 'next';
import { createPageMetadata, privateRobots } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Your opportunity dashboard',
  path: '/dashboard',
  description:
    'Your personalized Scout dashboard for meaningful opportunities and next career moves.',
  robots: privateRobots,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
