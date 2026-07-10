'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { Typography, Grid, Stack, UniversalLoader, PageTransition } from '@/components/ui';
import { FeaturedOpportunityCard, HiddenGemCard, OpportunityCard } from '@/components/opportunity';
import { DashboardHero, ScoutIntelligencePanel, RecommendationStrip } from '@/components/dashboard';
import { mockOpportunities } from '@/lib/mock';
import { ROUTES } from '@/lib/constants/routes';

export default function DashboardPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  const loadingMessages = [
    'Finding opportunities...',
    'Checking eligibility...',
    'Ranking recommendations...',
    'Looking for hidden gems...',
    'Preparing your dashboard...',
    'Almost ready...',
  ];

  const handleCardClick = (id: string) => {
    router.push(ROUTES.OPPORTUNITY(id));
  };

  // Find opportunities by types
  const featuredOpp = mockOpportunities.find((o) => o.isFeatured) || mockOpportunities[0];
  const hiddenGems = mockOpportunities.filter((o) => o.isHiddenGem);
  const normalOpps = mockOpportunities.filter((o) => !o.isFeatured && !o.isHiddenGem);

  return (
    <ProtectedRoute>
      {pageLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={450}
            onComplete={() => setPageLoading(false)}
          />
        </div>
      ) : (
        <DashboardLayout>
          <PageTransition>
            <Stack gap="xl">
              {/* Dashboard Greeting Header */}
              <DashboardHero userName="Maya" />

              {/* Scout Analytics panel */}
              <ScoutIntelligencePanel />

              {/* Featured Recommendation */}
              <Stack gap="sm">
                <Typography
                  variant="heading-m"
                  className="border-b border-border/40 pb-3 font-normal"
                >
                  Featured Recommendation
                </Typography>
                <FeaturedOpportunityCard
                  title={featuredOpp.title}
                  organization={featuredOpp.organization}
                  description={featuredOpp.description}
                  deadline={featuredOpp.deadline}
                  matchScore={featuredOpp.matchScore}
                  tags={featuredOpp.tags}
                  isBookmarked={true}
                  isWomenOnly={featuredOpp.isWomenOnly}
                  stipend={featuredOpp.stipend}
                  onBookmarkToggle={() => {}}
                  onApplyClick={() => handleCardClick(featuredOpp.id)}
                />
              </Stack>

              {/* Hidden Gems Slider */}
              <RecommendationStrip
                title="Hidden Gems"
                description="Low competition matching opportunities discovered recently."
              >
                {hiddenGems.map((gem) => (
                  <HiddenGemCard
                    key={gem.id}
                    title={gem.title}
                    organization={gem.organization}
                    matchScore={gem.matchScore}
                    isBookmarked={gem.id === 'opp-qualcomm-wetech'}
                    onBookmarkToggle={() => {}}
                    onApplyClick={() => handleCardClick(gem.id)}
                  />
                ))}
              </RecommendationStrip>

              {/* Recommended Feed */}
              <Stack gap="sm">
                <Typography
                  variant="heading-m"
                  className="border-b border-border/40 pb-3 font-normal"
                >
                  Curated Opportunities Feed
                </Typography>
                <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                  {normalOpps.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      title={opp.title}
                      organization={opp.organization}
                      deadline={opp.deadline}
                      tags={opp.tags}
                      matchScore={opp.matchScore}
                      isBookmarked={false}
                      isWomenOnly={opp.isWomenOnly}
                      stipend={opp.stipend}
                      onBookmarkToggle={() => {}}
                      onApplyClick={() => handleCardClick(opp.id)}
                      onCardClick={() => handleCardClick(opp.id)}
                    />
                  ))}
                </Grid>
              </Stack>
            </Stack>
          </PageTransition>
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
