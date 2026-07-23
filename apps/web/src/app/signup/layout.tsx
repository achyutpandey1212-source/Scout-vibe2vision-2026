import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Create your account',
  path: '/signup',
  description: 'Create a Scout account and discover opportunities personalized for your ambitions.',
  robots: { index: false, follow: false },
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
