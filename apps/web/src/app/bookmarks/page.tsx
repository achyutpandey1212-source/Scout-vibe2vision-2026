'use client';

import React, { useState } from 'react';
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
import { mockBookmarks } from '@/lib/mock';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { HeartOff } from 'lucide-react';

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState(mockBookmarks);
  const router = useRouter();

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
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
            onComplete={() => setLoading(false)}
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

              {bookmarks.length > 0 ? (
                <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                  {bookmarks.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      title={opp.title}
                      organization={opp.organization}
                      deadline={opp.deadline}
                      tags={opp.tags}
                      matchScore={opp.matchScore}
                      isBookmarked={true}
                      isWomenOnly={opp.isWomenOnly}
                      stipend={opp.stipend}
                      onBookmarkToggle={() => handleRemoveBookmark(opp.id)}
                      onApplyClick={() => handleCardClick(opp.id)}
                      onCardClick={() => handleCardClick(opp.id)}
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
                        No bookmarks saved yet
                      </Typography>
                      <Typography
                        variant="body"
                        className="text-secondary/70 leading-relaxed max-w-sm"
                      >
                        {
                          '"When something feels right, save it here. We\'ll keep it waiting for you."'
                        }
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
