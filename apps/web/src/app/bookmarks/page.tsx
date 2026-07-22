'use client';

/**
 * ==========================================
 *          SAVED SCREEN REDESIGN
 * ==========================================
 * Editorial Bookmarks Collection View
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { PageTransition } from '@/components/ui';
import { OpportunityCard, OpportunityCardSkeleton } from '@/components/opportunity';
import { SectionHeader } from '@/components/dashboard';
import { ROUTES } from '@/lib/constants/routes';
import { bookmarksApi, Opportunity } from '@/lib/api';
import { Bookmark } from 'lucide-react';

export default function BookmarksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Opportunity[]>([]);

  const fetchBookmarks = async () => {
    try {
      const res = await bookmarksApi.list();
      if (res.data?.success) {
        setBookmarks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (id: string) => {
    const previousBookmarks = [...bookmarks];
    setBookmarks((prev) => prev.filter((item) => item._id !== id)); // optimistic removal

    try {
      await bookmarksApi.remove(id);
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
      setBookmarks(previousBookmarks); // rollback on error
    }
  };

  const handleCardClick = (id: string) => {
    router.push(ROUTES.OPPORTUNITY(id));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <div className="max-w-4xl mx-auto space-y-8 pb-20 select-none">
            {/* ── Collection Header ── */}
            <SectionHeader
              title="Saved Opportunities"
              description="Opportunities you've bookmarked for later."
            />

            {/* ── Content Grid / Skeletons / Empty State ── */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OpportunityCardSkeleton variant="default" />
                <OpportunityCardSkeleton variant="default" />
                <OpportunityCardSkeleton variant="default" />
              </div>
            ) : bookmarks.length === 0 ? (
              /* Collection Empty State */
              <div className="p-10 border border-border/80 bg-card rounded-3xl text-center space-y-4 my-8">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 text-muted-foreground/60 flex items-center justify-center mx-auto">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-display font-medium text-foreground">
                    Nothing saved yet.
                  </h3>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">
                    Bookmark opportunities while exploring and they&apos;ll appear here.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => router.push(ROUTES.EXPLORE)}
                    className="px-5 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Discover Opportunities
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bookmarks.map((opp) => (
                  <OpportunityCard
                    key={opp._id}
                    title={opp.title}
                    organization={opp.organization}
                    description={opp.description}
                    deadline={opp.deadline || 'Flexible'}
                    tags={opp.tags || []}
                    isBookmarked={true}
                    isWomenOnly={
                      opp.isWomenOnly ||
                      opp.genderEligibility?.toLowerCase().includes('women') ||
                      opp.genderEligibility?.toLowerCase().includes('female')
                    }
                    stipend={
                      opp.stipend != null ? `₹${Number(opp.stipend).toLocaleString()}` : undefined
                    }
                    onBookmarkToggle={() => handleRemoveBookmark(opp._id)}
                    onApplyClick={() => handleCardClick(opp._id)}
                    onCardClick={() => handleCardClick(opp._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </PageTransition>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
