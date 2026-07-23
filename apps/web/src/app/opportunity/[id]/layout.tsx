import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

type OpportunityMetadata = {
  title?: string;
  organization?: string;
  city?: string;
  state?: string;
  country?: string;
  remote?: boolean;
  opportunityType?: string;
  category?: string;
};

async function getOpportunity(id: string): Promise<OpportunityMetadata | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const response = await fetch(`${apiUrl}/api/v1/opportunities/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const opportunity = await getOpportunity(params.id);
  const title = opportunity?.title || 'Opportunity details';
  const organization = opportunity?.organization || 'Scout';
  const type = opportunity?.opportunityType || opportunity?.category || 'opportunity';
  const location = opportunity?.remote
    ? 'Remote'
    : [opportunity?.city, opportunity?.state, opportunity?.country].filter(Boolean).join(', ') ||
      'Location unavailable';

  return createPageMetadata({
    title,
    path: `/opportunity/${params.id}`,
    description: `${title} at ${organization} — ${type} in ${location}. Discover details and application guidance on Scout.`,
    keywords: [type, organization, location],
  });
}

export default function OpportunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
