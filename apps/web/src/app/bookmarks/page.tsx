'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import {
  Typography,
  Grid,
  Stack,
  Card,
  CardContent,
  UniversalLoader,
  OrigamiDecoration,
  Button,
  PageTransition,
} from '@/components/ui';
import { OpportunityCard } from '@/components/opportunity';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { AlertCircle } from 'lucide-react';
import { bookmarksApi, Opportunity } from '@/lib/api';

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Opportunity[]>([]);
  const router = useRouter();

  const fetchBookmarks = async () => {
    try {
      setError(null);
      const res = await bookmarksApi.list();
      if (res.data?.success) {
        setBookmarks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
      setError('Unable to retrieve your bookmarks right now. Please try again.');
    }
  };

  const handleRemoveBookmark = async (id: string) => {
    const previousBookmarks = [...bookmarks];
    setBookmarks((prev) => prev.filter((item) => item._id !== id)); // optimistic UI

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

  const loadingMessages = ['Opening your library...', 'Checking application dates...', 'Ready.'];

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={300}
            onComplete={() => {
              fetchBookmarks().then(() => setLoading(false));
            }}
          />
        </div>
      ) : (
        <DashboardLayout>
          <PageTransition>
            <Stack gap="lg" className="w-full">
              <div className="border-b border-border/40 pb-3 flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                <Typography variant="heading-l" className="font-normal">
                  Saved Opportunities
                </Typography>
                <Typography variant="caption" className="text-secondary/60">
                  You have saved {bookmarks.length} opportunities.
                </Typography>
              </div>

              {error ? (
                <div className="p-6 rounded-3xl border border-rose-200/50 bg-rose-50/30 dark:bg-rose-950/10 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <Typography variant="heading-s" className="text-sm font-medium text-foreground">
                      Failed to Retrieve Saved Items
                    </Typography>
                    <Typography variant="body" className="text-xs text-secondary/80 font-light">
                      {error}
                    </Typography>
                    <Button variant="secondary" size="sm" className="mt-2" onClick={fetchBookmarks}>
                      Retry loading
                    </Button>
                  </div>
                </div>
              ) : bookmarks.length > 0 ? (
                <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                  {bookmarks.map((opp) => (
                    <OpportunityCard
                      key={opp._id}
                      title={opp.title}
                      organization={opp.organization}
                      deadline={opp.deadline || 'Flexible'}
                      tags={opp.tags}
                      matchScore={90} // default match score reference placeholder
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
                </Grid>
              ) : (
                // empty state
                <Card className="text-center p-12 max-w-lg mx-auto bg-card border border-border/60 rounded-3xl mt-8">
                  <CardContent className="pt-6 space-y-6 flex flex-col items-center">
                    <div className="text-secondary/40 shrink-0">
                      <OrigamiDecoration
                        name="butterfly"
                        size={64}
                        floating
                        floatingOffset={4}
                        floatingDuration={5}
                      />
                    </div>
                    <Stack gap="xxs">
                      <Typography variant="heading-s" className="font-medium text-foreground">
                        You haven&apos;t saved anything yet.
                      </Typography>
                      <Typography
                        variant="body"
                        className="text-secondary/70 leading-relaxed max-w-sm"
                      >
                        When something feels right, save it here. We&apos;ll keep it waiting for
                        you.
                      </Typography>
                    </Stack>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(ROUTES.DASHBOARD)}
                    >
                      Discover Opportunities
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </PageTransition>
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
