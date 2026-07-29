'use client';

/**
 * ==========================================
 *        DASHBOARD SCREEN REDESIGN
 * ==========================================
 * Editorial Morning Briefing Layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { PageTransition } from '@/components/ui';
import { OpportunityCard, OpportunityCardSkeleton } from '@/components/opportunity';
import {
  TodaysMissionCard,
  SectionHeader,
  DashboardEmptyState,
  AICapacityExhaustedScreen,
} from '@/components/dashboard';
import { useAuth } from '@/context/auth-context';
import {
  recommendationsApi,
  bookmarksApi,
  profileApi,
  opportunitiesApi,
  Opportunity,
} from '@/lib/api';
import { track } from '@/lib/analytics';
import { useScrollDepth } from '@/hooks/useScrollDepth';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getRelativeTimeString(dateString?: string | Date): string {
  if (!dateString) return 'recently';
  const now = new Date();
  const date = new Date(dateString);
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return 'today';
}

const getInitialProfileName = () => {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('scout_v2_profile_name');
    if (cached) return cached;
  }
  return '';
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string>(getInitialProfileName);
  const [pageLoading, setPageLoading] = useState(true);

  // Recommendation Engine State
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | Date | undefined>(undefined);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isCapacityExhausted, setIsCapacityExhausted] = useState(false);

  // New opportunities state
  const [newOppsData, setNewOppsData] = useState<{
    count: number | null;
    lastVisitedAt: string | null;
    latestOpportunityAt: string | null;
  }>({ count: null, lastVisitedAt: null, latestOpportunityAt: null });

  // Recent opportunities state
  const [recentOpps, setRecentOpps] = useState<any[]>([]);

  // Automatic retry ref
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadDashboardData = async (retryCount = 0) => {
    try {
      const [recRes, bookmarkRes, profileRes, newRes, recentRes] = await Promise.all([
        recommendationsApi.list(),
        bookmarksApi.list(),
        profileApi.getV2(),
        opportunitiesApi.newOpportunities(),
        opportunitiesApi.listRecent(),
      ]);

      if (profileRes.data?.success && profileRes.data.data?.profile?.fullName) {
        const name = profileRes.data.data.profile.fullName.trim();
        setProfileName(name);
        if (typeof window !== 'undefined') {
          localStorage.setItem('scout_v2_profile_name', name);
        }
      }

      if (newRes.data?.success) {
        setNewOppsData(newRes.data.data);
      }

      if (recentRes.data?.success) {
        setRecentOpps(recentRes.data.data || []);
      }

      if (recRes.data?.status === 'AI_CAPACITY_EXHAUSTED') {
        setIsCapacityExhausted(true);
        setPageLoading(false);
        return;
      }

      if (recRes.data?.success) {
        const rawData = recRes.data.data;
        if (recRes.data.generatedAt) {
          setGeneratedAt(recRes.data.generatedAt);
        }

        if (rawData) {
          if (Array.isArray(rawData)) {
            setRecommendations(rawData);
          } else if (typeof rawData === 'object') {
            const keys: (
              'perfectMatch' | 'hiddenGem' | 'stretchGoal' | 'quickWin' | 'confidenceBuilder'
            )[] = ['perfectMatch', 'hiddenGem', 'stretchGoal', 'quickWin', 'confidenceBuilder'];
            const mapped: any[] = [];
            keys.forEach((key) => {
              const item = rawData[key];
              const opportunityDoc = item?.opportunity || item?.opportunityId;
              if (item && opportunityDoc && typeof opportunityDoc === 'object') {
                mapped.push({
                  opportunity: opportunityDoc as any,
                  recommendationScore: item.score || 80,
                  matchedFactors: item.strongestStrengths || [],
                  missingFactors: item.missingSkills || [],
                  explanation:
                    item.executiveSummary ||
                    item.whyScoutPickedThis ||
                    item.personalizedReason ||
                    item.whyNow ||
                    '',
                  slot: key,
                  report: item,
                });
              }
            });
            setRecommendations(mapped);
            const fetchedPackId = recRes.data.packId || rawData?.packId || rawData?.id || '';
            if (fetchedPackId && typeof window !== 'undefined') {
              localStorage.setItem('scout_v2_active_pack_id', fetchedPackId);
            }

            // Track impressions per slot
            mapped.forEach((rec) => {
              track('recommendation_card_impression', {
                packId: fetchedPackId,
                slot: rec.slot,
                opportunityId: rec.opportunity?._id || rec.opportunity?.id,
                matchScore: rec.recommendationScore || 80,
                category: rec.opportunity?.category || '',
              });
            });
          }
        }
      }

      if (bookmarkRes.data?.success) {
        const bookmarkedList: Opportunity[] = bookmarkRes.data.data;
        setBookmarkedIds(new Set(bookmarkedList.map((opp) => opp._id)));
      }
      setPageLoading(false);
      track('dashboard_viewed', {
        recommendationsAvailable: true,
        recommendationCount: recommendations.length || 5,
      });
    } catch (err: any) {
      console.warn('Dashboard sync delay, retrying automatically...', err);
      // Automatic silent retry without alarming the user
      const nextDelay = Math.min(2000 * Math.pow(1.5, retryCount), 10000);
      retryTimerRef.current = setTimeout(() => {
        loadDashboardData(retryCount + 1);
      }, nextDelay);
    }
  };

  useScrollDepth('Dashboard');

  const mountTimeRef = useRef<number>(Date.now());
  const cardsClickedRef = useRef<number>(0);

  useEffect(() => {
    loadDashboardData();
    mountTimeRef.current = Date.now();
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const timeSpentSeconds = Math.round((Date.now() - mountTimeRef.current) / 1000);
      track('dashboard_session', {
        timeSpentSeconds,
        recommendationsViewed: recommendations.length || 5,
        cardsClicked: cardsClickedRef.current,
      });
    };
  }, []);

  // Restore scroll position after navigation
  useEffect(() => {
    if (!pageLoading) {
      const savedScroll = sessionStorage.getItem('scout_dashboard_scroll');
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo({ top: Number(savedScroll), behavior: 'instant' as any });
          sessionStorage.removeItem('scout_dashboard_scroll');
        }, 100);
      }
    }
  }, [pageLoading]);

  const handleBookmarkToggle = async (oppId: string) => {
    const isBookmarked = bookmarkedIds.has(oppId);
    const nextBookmarked = new Set(bookmarkedIds);
    if (isBookmarked) {
      nextBookmarked.delete(oppId);
      track('bookmark_removed', { opportunityId: oppId });
    } else {
      nextBookmarked.add(oppId);
      track('bookmark_added', { opportunityId: oppId });
    }
    setBookmarkedIds(nextBookmarked);

    try {
      if (isBookmarked) {
        await bookmarksApi.remove(oppId);
      } else {
        await bookmarksApi.add(oppId);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      setBookmarkedIds(bookmarkedIds);
    }
  };

  const handleCardClick = (oppId: string) => {
    sessionStorage.setItem('scout_dashboard_scroll', window.scrollY.toString());
    router.push(`/opportunity/${oppId}`);
  };

  // Portfolio slots mapping directly from RE Pack
  const featuredRec =
    recommendations.find((r: any) => r?.slot === 'perfectMatch') || recommendations[0];
  const featuredOpp = featuredRec?.opportunity;

  const hiddenGemRec =
    recommendations.find((r: any) => r?.slot === 'hiddenGem') || recommendations[1];
  const hiddenGemOpp = hiddenGemRec?.opportunity;

  const remainingRecs = recommendations.filter(
    (r: any) => r && r.slot !== 'perfectMatch' && r.slot !== 'hiddenGem',
  );

  const userNameDisplay = profileName || user?.name || user?.displayName || 'Student';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <div className="max-w-4xl mx-auto space-y-12 pb-20 select-none">
            {/* 0. NEW SINCE LAST VISIT BRIEFING CHIP */}
            {!pageLoading && newOppsData.count !== null && (
              <div className="p-4 border border-border/80 bg-card rounded-2xl flex items-center justify-between text-xs transition-all duration-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">✨</span>
                  <div>
                    {newOppsData.count === 0 ? (
                      <p className="text-foreground/90 font-medium">
                        You&apos;re all caught up. No new opportunities since your last visit.
                      </p>
                    ) : (
                      <p className="text-foreground/90 font-medium">
                        {newOppsData.count} new{' '}
                        {newOppsData.count === 1 ? 'opportunity' : 'opportunities'} since your last
                        visit.
                      </p>
                    )}
                  </div>
                </div>
                {newOppsData.count > 0 && (
                  <button
                    onClick={() => router.push('/explore?new=true')}
                    className="text-primary hover:underline text-xs font-medium flex items-center gap-1 shrink-0"
                  >
                    <span>Explore what&apos;s new</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* INITIAL LOADING SKELETON (ZERO LAYOUT SHIFT) */}
            {pageLoading ? (
              <div className="space-y-12 animate-pulse">
                {/* Mission Card Skeleton */}
                <div className="h-44 rounded-3xl bg-card border border-border/60 p-6 space-y-3">
                  <div className="h-4 w-1/3 bg-muted rounded-md" />
                  <div className="h-6 w-2/3 bg-muted rounded-md" />
                  <div className="h-3 w-1/2 bg-muted rounded-md pt-2" />
                </div>

                {/* Featured Skeleton */}
                <div className="space-y-4">
                  <div className="h-5 w-40 bg-muted rounded-md" />
                  <OpportunityCardSkeleton variant="featured" />
                </div>

                {/* Hidden Gem Skeleton */}
                <div className="space-y-4">
                  <div className="h-5 w-32 bg-muted rounded-md" />
                  <OpportunityCardSkeleton variant="default" />
                </div>

                {/* More Grid Skeleton */}
                <div className="space-y-4">
                  <div className="h-5 w-48 bg-muted rounded-md" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <OpportunityCardSkeleton variant="default" />
                    <OpportunityCardSkeleton variant="default" />
                    <OpportunityCardSkeleton variant="default" />
                  </div>
                </div>
              </div>
            ) : isCapacityExhausted ? (
              <AICapacityExhaustedScreen onRetry={() => loadDashboardData()} />
            ) : recommendations.length === 0 ? (
              /* EMPTY STATE */
              <DashboardEmptyState
                onDiscoverClick={() => router.push('/explore')}
                onRefreshClick={() => loadDashboardData()}
              />
            ) : (
              /* COMPOSER MORNING BRIEFING CONTENT */
              <div className="space-y-12">
                {/* 1. TODAY'S MISSION CARD */}
                <TodaysMissionCard userName={userNameDisplay} matchCount={recommendations.length} />

                {/* 1.5 RECENTLY ADDED FEED STRIP */}
                <section className="space-y-4 overflow-hidden">
                  <SectionHeader
                    title="Recently Added"
                    description="Fresh opportunities discovered by Scout."
                  />

                  {recentOpps.length === 0 ? (
                    <div className="p-6 border border-border/80 bg-card rounded-2xl text-center text-xs text-muted-foreground">
                      Scout is preparing new discoveries. Check back soon.
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar scroll-smooth">
                      {recentOpps.map((opp) => {
                        const platform = (() => {
                          if (opp.sourceDomain?.includes('internshala.com'))
                            return { name: 'Internshala', logo: '/Sources/Internshala.svg' };
                          if (opp.sourceDomain?.includes('unstop.com'))
                            return { name: 'Unstop', logo: '/Sources/Unstop.svg' };
                          if (opp.sourceDomain?.includes('linkedin.com'))
                            return { name: 'LinkedIn', logo: '/Sources/Linkedin.svg' };
                          if (opp.sourceDomain?.includes('indeed.com'))
                            return { name: 'Indeed', logo: '/Sources/Indeed.svg' };
                          if (opp.sourceDomain?.includes('glassdoor.com'))
                            return { name: 'Glassdoor', logo: '/Sources/Glassdoor.svg' };
                          if (opp.sourceDomain?.includes('google.com'))
                            return { name: 'Google Careers', logo: '/Sources/Google.svg' };
                          return { name: 'External Portal', logo: null };
                        })();

                        const addedText = (() => {
                          const diffMs = Date.now() - new Date(opp.createdAt).getTime();
                          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                          if (diffHrs < 1) return 'Just Now';
                          if (diffHrs < 24) return `${diffHrs}h ago`;
                          const diffDays = Math.floor(diffHrs / 24);
                          if (diffDays === 1) return 'Yesterday';
                          return `${diffDays} days ago`;
                        })();

                        return (
                          <div
                            key={opp._id}
                            onClick={() => handleCardClick(opp._id)}
                            className="w-[280px] shrink-0 snap-start border border-border/60 bg-card hover:border-primary/40 hover:-translate-y-0.5 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-150 shadow-sm"
                          >
                            <div className="space-y-3">
                              {/* Source Platform branding */}
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider truncate">
                                  {platform.name}
                                </span>
                                {platform.logo ? (
                                  <img
                                    src={platform.logo}
                                    alt={platform.name}
                                    width={14}
                                    height={14}
                                    className="rounded-sm shrink-0"
                                  />
                                ) : (
                                  <span className="text-xs shrink-0">🌐</span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground/85 block truncate">
                                  {opp.organization}
                                </span>
                                <h4 className="text-xs font-semibold leading-snug line-clamp-2 text-foreground hover:text-primary transition-colors">
                                  {opp.title}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-4 border-t border-border/30 mt-3 text-[10px] text-muted-foreground/75 font-light">
                              <span className="bg-muted px-2 py-0.5 rounded-md text-[9px] font-semibold text-secondary-foreground uppercase">
                                {opp.opportunityType}
                              </span>
                              <span>Added {addedText}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* View More Card */}
                      <div
                        onClick={() => router.push('/explore?sortBy=newest')}
                        className="w-[180px] shrink-0 snap-start border border-dashed border-border/80 bg-card hover:bg-muted/30 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-150"
                      >
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                          <span>View all</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. FEATURED RECOMMENDATION (Today's Best Match) */}
                {featuredOpp && (
                  <section className="space-y-4">
                    <SectionHeader
                      title="Today's Best Match"
                      description="The strongest opportunity Scout found for you today."
                    />
                    <OpportunityCard
                      variant="featured"
                      slot="perfectMatch"
                      title={featuredOpp.title}
                      organization={featuredOpp.organization}
                      description={featuredOpp.description}
                      deadline={featuredOpp.deadline || 'Flexible'}
                      matchScore={featuredRec.recommendationScore}
                      explanation={featuredRec.explanation}
                      tags={featuredOpp.tags}
                      isBookmarked={bookmarkedIds.has(featuredOpp._id)}
                      isWomenOnly={
                        featuredOpp.isWomenOnly ||
                        featuredOpp.genderEligibility?.toLowerCase().includes('women') ||
                        featuredOpp.genderEligibility?.toLowerCase().includes('female')
                      }
                      stipend={
                        featuredOpp.stipend != null
                          ? `₹${Number(featuredOpp.stipend).toLocaleString()}`
                          : undefined
                      }
                      onBookmarkToggle={() => handleBookmarkToggle(featuredOpp._id)}
                      onApplyClick={() => handleCardClick(featuredOpp._id)}
                      onCardClick={() => handleCardClick(featuredOpp._id)}
                    />
                  </section>
                )}

                {/* 3. HIDDEN GEM */}
                {hiddenGemOpp && (
                  <section className="space-y-4">
                    <SectionHeader
                      title="Hidden Gem"
                      description="An opportunity you might not have discovered on your own."
                    />
                    <OpportunityCard
                      variant="default"
                      slot="hiddenGem"
                      title={hiddenGemOpp.title}
                      organization={hiddenGemOpp.organization}
                      description={hiddenGemOpp.description}
                      deadline={hiddenGemOpp.deadline || 'Flexible'}
                      matchScore={hiddenGemRec.recommendationScore}
                      explanation={hiddenGemRec.explanation}
                      tags={hiddenGemOpp.tags}
                      isBookmarked={bookmarkedIds.has(hiddenGemOpp._id)}
                      isWomenOnly={
                        hiddenGemOpp.isWomenOnly ||
                        hiddenGemOpp.genderEligibility?.toLowerCase().includes('women') ||
                        hiddenGemOpp.genderEligibility?.toLowerCase().includes('female')
                      }
                      stipend={
                        hiddenGemOpp.stipend != null
                          ? `₹${Number(hiddenGemOpp.stipend).toLocaleString()}`
                          : undefined
                      }
                      onBookmarkToggle={() => handleBookmarkToggle(hiddenGemOpp._id)}
                      onApplyClick={() => handleCardClick(hiddenGemOpp._id)}
                      onCardClick={() => handleCardClick(hiddenGemOpp._id)}
                    />
                  </section>
                )}

                {/* 4. MORE RECOMMENDATIONS */}
                {remainingRecs.length > 0 && (
                  <section className="space-y-4">
                    <SectionHeader
                      title="More Opportunities Worth Exploring"
                      description="Different paths depending on your confidence, experience and goals."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {remainingRecs.map((rec) => (
                        <OpportunityCard
                          key={rec.opportunity._id}
                          variant="default"
                          slot={rec.slot}
                          title={rec.opportunity.title}
                          organization={rec.opportunity.organization}
                          description={rec.opportunity.description}
                          deadline={rec.opportunity.deadline || 'Flexible'}
                          tags={rec.opportunity.tags}
                          matchScore={rec.recommendationScore}
                          explanation={rec.explanation}
                          isBookmarked={bookmarkedIds.has(rec.opportunity._id)}
                          isWomenOnly={
                            rec.opportunity.isWomenOnly ||
                            rec.opportunity.genderEligibility?.toLowerCase().includes('women') ||
                            rec.opportunity.genderEligibility?.toLowerCase().includes('female')
                          }
                          stipend={
                            rec.opportunity.stipend != null
                              ? `₹${Number(rec.opportunity.stipend).toLocaleString()}`
                              : undefined
                          }
                          onBookmarkToggle={() => handleBookmarkToggle(rec.opportunity._id)}
                          onApplyClick={() => handleCardClick(rec.opportunity._id)}
                          onCardClick={() => handleCardClick(rec.opportunity._id)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* 5. DISCOVER CTA */}
                <section className="p-8 border border-border/80 bg-card rounded-3xl text-center space-y-4 my-8">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-lg font-display font-medium text-foreground">
                      Looking for more?
                    </h3>
                    <p className="text-xs text-muted-foreground font-light leading-relaxed">
                      Scout has hundreds of verified opportunities beyond today&apos;s personalized
                      recommendations.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => router.push('/explore')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <span>Discover All Opportunities</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </section>

                {/* 6. RECOMMENDATION FRESHNESS FOOTER */}
                <footer className="pt-4 border-t border-border/40 text-center text-[11px] text-muted-foreground/70 font-light space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground/60" />
                    <span>
                      Recommendations generated today • Generated{' '}
                      {getRelativeTimeString(generatedAt)} • Refreshes every 24 hours.
                    </span>
                  </div>
                </footer>
              </div>
            )}
          </div>
        </PageTransition>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
