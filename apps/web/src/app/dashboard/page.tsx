'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { Typography, Grid, Stack, UniversalLoader, PageTransition, Button } from '@/components/ui';
import { OpportunityCard } from '@/components/opportunity';
import {
  TodaysMissionCard,
  SectionHeader,
  DashboardEmptyState,
  RecommendationStrip,
} from '@/components/dashboard';
import ScoutIntelligencePanel from '@/components/dashboard/ScoutIntelligencePanel';
import { Search, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  recommendationsApi,
  opportunitiesApi,
  bookmarksApi,
  profileApi,
  Opportunity,
  Recommendation,
} from '@/lib/api';

const getSlotBadge = (slot: string) => {
  switch (slot) {
    case 'perfectMatch':
      return { label: 'Featured Match', icon: '⭐' };
    case 'hiddenGem':
      return { label: 'Hidden Gem', icon: '💎' };
    case 'stretchGoal':
      return { label: 'Stretch Goal', icon: '📈' };
    case 'quickWin':
    case 'fastApply':
      return { label: 'Fast Apply', icon: '🚀' };
    case 'confidenceBuilder':
    case 'resumeBuilder':
      return { label: 'Resume Builder', icon: '🧠' };
    default:
      return { label: 'Curated Match', icon: '✨' };
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profileName, setProfileName] = useState<string>('');
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recommendation engine state
  const [engineStatus, setEngineStatus] = useState<string>('READY');
  const [progressPhase, setProgressPhase] = useState<string>('COMPLETED');
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Navigation tab & catalog feed state
  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [catalogOpportunities, setCatalogOpportunities] = useState<Opportunity[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number>(0);

  // Search & Filter state for catalog feed
  const [feedQuery, setFeedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'deadline'>('match');

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [recRes, catalogRes, bookmarkRes, profileRes] = await Promise.all([
        recommendationsApi.list(),
        opportunitiesApi.list({ limit: 12 }),
        bookmarksApi.list(),
        profileApi.get(),
      ]);

      if (catalogRes.data?.success) {
        const rawOppList: Opportunity[] = catalogRes.data.data;
        setCatalogOpportunities(rawOppList);
        setTotalCatalogCount(catalogRes.data.meta?.total || rawOppList.length);
      }

      if (recRes.data?.success) {
        const rawData = recRes.data.data;
        const status = recRes.data.status || 'READY';
        setEngineStatus(status);
        if (status === 'GENERATING') {
          if (recRes.data.progressPhase) {
            setProgressPhase(recRes.data.progressPhase);
          }
        }

        if (status === 'READY' && rawData) {
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
          }
        }
      }

      if (bookmarkRes.data?.success) {
        const bookmarkedList: Opportunity[] = bookmarkRes.data.data;
        setBookmarkedIds(new Set(bookmarkedList.map((opp) => opp._id)));
      }

      if (profileRes && profileRes.data?.success) {
        const p = profileRes.data.data;
        if (p?.identity?.preferredName) {
          setProfileName(p.identity.preferredName);
        }
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('We are having trouble connecting to Scout right now. Please try again.');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Polling during generation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (engineStatus === 'GENERATING') {
      timer = setInterval(async () => {
        try {
          const res = await recommendationsApi.list();
          if (res.data?.success) {
            const status = res.data.status;
            if (res.data.progressPhase) setProgressPhase(res.data.progressPhase);
            if (status === 'READY') {
              setEngineStatus('READY');
              loadDashboardData();
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [engineStatus]);

  const handleBookmarkToggle = async (oppId: string) => {
    const isBookmarked = bookmarkedIds.has(oppId);
    const nextBookmarked = new Set(bookmarkedIds);
    if (isBookmarked) {
      nextBookmarked.delete(oppId);
    } else {
      nextBookmarked.add(oppId);
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
      setBookmarkedIds(bookmarkedIds); // revert on error
    }
  };

  const handleCardClick = (oppId: string) => {
    router.push(`/opportunity/${oppId}`);
  };

  // Structured portfolio references
  const featuredRec =
    recommendations.find((r: any) => r?.slot === 'perfectMatch') || recommendations[0];
  const featuredOpp = featuredRec?.opportunity;

  const hiddenGemRec =
    recommendations.find((r: any) => r?.slot === 'hiddenGem') || recommendations[1];

  const remainingRecs = recommendations.filter(
    (r: any) => r && r.slot !== 'perfectMatch' && r.slot !== 'hiddenGem',
  );

  const categories = ['ALL', 'SCHOLARSHIP', 'INTERNSHIP', 'FELLOWSHIP', 'GRANT'];

  // Stages definitions for live progress
  const stages = [
    { key: 'RETRIEVING', label: 'Retrieving opportunities' },
    { key: 'FILTERING', label: 'Filtering opportunities' },
    { key: 'SCORING', label: 'Scoring matches' },
    { key: 'DIVERSIFYING', label: 'Diversifying recommendations' },
    { key: 'PERSONALIZING', label: 'Generating AI insights' },
    { key: 'BUILDING_PACK', label: 'Building recommendation pack' },
    { key: 'COMPLETED', label: 'Workspace Ready' },
  ];

  const getStageIndex = (phase: string) => {
    return stages.findIndex((s) => s.key === phase);
  };

  const currentStageIndex = getStageIndex(progressPhase);

  const renderPreparingWorkspace = () => {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0B0C0E] px-6 select-none">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-3 animate-fade-in">
            <Typography
              variant="heading-m"
              className="text-2xl md:text-3xl font-light tracking-tight text-foreground"
            >
              Preparing your Scout Workspace
            </Typography>
            <Typography variant="body" className="text-sm text-secondary/60 font-light block">
              We&apos;re building recommendations tailored specifically for you.
            </Typography>
          </div>

          <div className="bg-card border border-border/40 rounded-3xl p-6 text-left space-y-4 shadow-sm">
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage.key}
                  className="flex items-center gap-3 transition-all duration-300"
                >
                  {isCompleted ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-scale-up" />
                    </div>
                  ) : isCurrent ? (
                    <div className="h-5 w-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 animate-pulse">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-accent/20 border border-border/30 flex items-center justify-center shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary/30" />
                    </div>
                  )}

                  <span
                    className={`text-xs font-mono tracking-wide ${
                      isCompleted
                        ? 'text-emerald-500 font-semibold'
                        : isCurrent
                          ? 'text-foreground font-bold'
                          : 'text-secondary/40 font-light'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      {pageLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0B0C0E]">
          <UniversalLoader
            messages={[
              'Accessing security credentials...',
              'Synchronizing local workspace...',
              'Logging in...',
            ]}
            intervalMs={200}
            onComplete={() => {}}
          />
        </div>
      ) : engineStatus === 'GENERATING' ? (
        renderPreparingWorkspace()
      ) : (
        <DashboardLayout>
          <PageTransition>
            <Stack gap="xl" className="pb-16 max-w-5xl mx-auto space-y-12">
              {error ? (
                <div className="p-6 rounded-3xl border border-rose-200/50 bg-rose-50/30 dark:bg-rose-950/10 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <Typography variant="heading-s" className="text-sm font-medium text-foreground">
                      Unable to Sync with Scout
                    </Typography>
                    <Typography variant="body" className="text-xs text-secondary/80 font-light">
                      {error}
                    </Typography>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      onClick={loadDashboardData}
                    >
                      Retry Connection
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Today's Mission Briefing Card */}
                  <TodaysMissionCard
                    userName={profileName || user?.name || user?.displayName || 'User'}
                    matchCount={recommendations.length}
                  />

                  <ScoutIntelligencePanel
                    opportunityCount={totalCatalogCount || recommendations.length * 11}
                    matchCount={recommendations.length}
                    bookmarkCount={bookmarkedIds.size}
                  />

                  {/* Tabs Selection Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-4 gap-4">
                    <div className="flex gap-2 bg-accent/25 p-1 rounded-full border border-border/40">
                      <button
                        onClick={() => setActiveTab('recommended')}
                        className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                          activeTab === 'recommended'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-secondary/60 hover:text-foreground'
                        }`}
                      >
                        Dashboard Curated
                      </button>
                      <button
                        onClick={() => setActiveTab('all')}
                        className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                          activeTab === 'all'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-secondary/60 hover:text-foreground'
                        }`}
                      >
                        Explore Catalog
                      </button>
                    </div>

                    <span className="text-xs text-secondary/50 font-light select-none">
                      {activeTab === 'recommended'
                        ? '5 AI-personalized portfolio recommendations'
                        : `Displaying ${totalCatalogCount} opportunities in catalog`}
                    </span>
                  </div>

                  {/* TAB 1: Dashboard Curated Portfolio */}
                  {activeTab === 'recommended' ? (
                    recommendations.length === 0 ? (
                      <DashboardEmptyState />
                    ) : (
                      <Stack gap="xl" className="space-y-12">
                        {/* 1. Featured Match Section */}
                        {featuredOpp && (
                          <div className="space-y-4">
                            <SectionHeader
                              title="Top Match"
                              description="Highest compatibility recommendation today"
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
                            />
                          </div>
                        )}

                        {/* 2. Hidden Gem Section */}
                        {hiddenGemRec?.opportunity && (
                          <div className="space-y-4">
                            <SectionHeader
                              title="Hidden Gem"
                              description="Low competition matching opportunity"
                            />
                            <OpportunityCard
                              variant="default"
                              slot="hiddenGem"
                              title={hiddenGemRec.opportunity.title}
                              organization={hiddenGemRec.opportunity.organization}
                              description={hiddenGemRec.opportunity.description}
                              deadline={hiddenGemRec.opportunity.deadline || 'Flexible'}
                              matchScore={hiddenGemRec.recommendationScore}
                              explanation={hiddenGemRec.explanation}
                              isBookmarked={bookmarkedIds.has(hiddenGemRec.opportunity._id)}
                              onBookmarkToggle={() =>
                                handleBookmarkToggle(hiddenGemRec.opportunity._id)
                              }
                              onApplyClick={() => handleCardClick(hiddenGemRec.opportunity._id)}
                            />
                          </div>
                        )}

                        {/* 3. More Recommended Opportunities Section */}
                        {remainingRecs.length > 0 && (
                          <div className="space-y-4">
                            <SectionHeader
                              title="More Recommended Opportunities"
                              description="Portfolio recommendations matching your career goals"
                            />

                            <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                              {remainingRecs.map((rec) => {
                                return (
                                  <OpportunityCard
                                    key={rec.opportunity._id}
                                    slot={rec.slot}
                                    title={rec.opportunity.title}
                                    organization={rec.opportunity.organization}
                                    deadline={rec.opportunity.deadline || 'Flexible'}
                                    tags={rec.opportunity.tags}
                                    matchScore={rec.recommendationScore}
                                    explanation={rec.explanation}
                                    isBookmarked={bookmarkedIds.has(rec.opportunity._id)}
                                    isWomenOnly={
                                      rec.opportunity.isWomenOnly ||
                                      rec.opportunity.genderEligibility
                                        ?.toLowerCase()
                                        .includes('women') ||
                                      rec.opportunity.genderEligibility
                                        ?.toLowerCase()
                                        .includes('female')
                                    }
                                    stipend={
                                      rec.opportunity.stipend != null
                                        ? `₹${Number(rec.opportunity.stipend).toLocaleString()}`
                                        : undefined
                                    }
                                    onBookmarkToggle={() =>
                                      handleBookmarkToggle(rec.opportunity._id)
                                    }
                                    onApplyClick={() => handleCardClick(rec.opportunity._id)}
                                    onCardClick={() => handleCardClick(rec.opportunity._id)}
                                  />
                                );
                              })}
                            </Grid>
                          </div>
                        )}
                      </Stack>
                    )
                  ) : (
                    /* TAB 2: Explore Catalog Feed */
                    <Stack gap="md" className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-accent/10 p-4 rounded-3xl border border-border/30">
                        <div className="flex-1 flex items-center gap-2 bg-card border border-border/40 rounded-full px-4.5 py-2">
                          <Search className="w-4 h-4 text-secondary/50" />
                          <input
                            type="text"
                            value={feedQuery}
                            onChange={(e) => setFeedQuery(e.target.value)}
                            placeholder="Search title, tech stack, tags..."
                            className="w-full bg-transparent border-none text-xs text-foreground placeholder-secondary/50 focus:ring-0 outline-none p-0"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-secondary/50 font-medium uppercase tracking-wider select-none">
                              Filter:
                            </span>
                            <select
                              value={categoryFilter}
                              onChange={(e) => setCategoryFilter(e.target.value)}
                              className="bg-card text-xs text-foreground border border-border/40 rounded-full px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/20"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat === 'ALL' ? 'All Categories' : cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-secondary/50 font-medium uppercase tracking-wider select-none">
                              Sort:
                            </span>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as 'match' | 'deadline')}
                              className="bg-card text-xs text-foreground border border-border/40 rounded-full px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/20"
                            >
                              <option value="match">Match Score</option>
                              <option value="deadline">Deadline</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                        {catalogOpportunities
                          .filter((opp) => {
                            if (feedQuery) {
                              const q = feedQuery.toLowerCase();
                              const matchesTitle = opp.title.toLowerCase().includes(q);
                              const matchesOrg = opp.organization.toLowerCase().includes(q);
                              const matchesTags = opp.tags?.some((t) =>
                                t.toLowerCase().includes(q),
                              );
                              if (!matchesTitle && !matchesOrg && !matchesTags) return false;
                            }
                            if (categoryFilter !== 'ALL') {
                              if (opp.opportunityType?.toUpperCase() !== categoryFilter)
                                return false;
                            }
                            return true;
                          })
                          .map((opp) => (
                            <OpportunityCard
                              key={opp._id}
                              title={opp.title}
                              organization={opp.organization}
                              deadline={opp.deadline || 'Flexible'}
                              tags={opp.tags}
                              matchScore={(opp as any).matchScore || 75}
                              isBookmarked={bookmarkedIds.has(opp._id)}
                              isWomenOnly={
                                opp.isWomenOnly ||
                                opp.genderEligibility?.toLowerCase().includes('women') ||
                                opp.genderEligibility?.toLowerCase().includes('female')
                              }
                              stipend={
                                opp.stipend != null
                                  ? `₹${Number(opp.stipend).toLocaleString()}`
                                  : undefined
                              }
                              onBookmarkToggle={() => handleBookmarkToggle(opp._id)}
                              onApplyClick={() => handleCardClick(opp._id)}
                              onCardClick={() => handleCardClick(opp._id)}
                            />
                          ))}
                      </Grid>
                    </Stack>
                  )}
                </>
              )}
            </Stack>
          </PageTransition>
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
