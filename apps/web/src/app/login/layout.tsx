import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Log in',
  path: '/login',
  description:
    'Log in to Scout to continue discovering meaningful opportunities tailored to your goals.',
  robots: { index: false, follow: false },
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
