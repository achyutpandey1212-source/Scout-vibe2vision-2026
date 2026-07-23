import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata({
  title: 'Verify your email',
  path: '/verify-email',
  description: 'Verify your email address to securely finish setting up Scout.',
  robots: { index: false, follow: false },
});

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
