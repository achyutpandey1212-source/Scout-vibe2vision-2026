'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { Typography, Grid, Stack, UniversalLoader, PageTransition, Button } from '@/components/ui';
import { FeaturedOpportunityCard, OpportunityCard } from '@/components/opportunity';
import { DashboardHero, ScoutIntelligencePanel, RecommendationStrip } from '@/components/dashboard';
import { ROUTES } from '@/lib/constants/routes';
import { SpotlightSearch } from '@/components/dashboard/SpotlightSearch';
import { Search, Compass, AlertCircle } from 'lucide-react';
import { HiddenGemCard } from '@/components/opportunity/HiddenGemCard';
import { useAuth } from '@/context/auth-context';
import {
  recommendationsApi,
  opportunitiesApi,
  bookmarksApi,
  profileApi,
  Opportunity,
  Recommendation,
} from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Page States
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended');

  // API Data
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [catalog, setCatalog] = useState<Opportunity[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [profileName, setProfileName] = useState<string | null>(null);

  // Catalog Pagination & Filter states
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalCatalogCount, setTotalCatalogCount] = useState(0);
  const [feedQuery, setFeedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'deadline'>('match');

  const loadingMessages = [
    "Finding today's matches...",
    'Reviewing new opportunities...',
    'Comparing eligibility...',
    'Preparing your recommendations...',
    'Almost ready...',
  ];

  // Global listener for Cmd+K / Ctrl+K and layout searches
  useEffect(() => {
    const handleGlobalK = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    const handleLayoutTrigger = () => {
      setIsSearchOpen(true);
    };

    window.addEventListener('keydown', handleGlobalK);
    window.addEventListener('scout-search-trigger', handleLayoutTrigger);

    return () => {
      window.removeEventListener('keydown', handleGlobalK);
      window.removeEventListener('scout-search-trigger', handleLayoutTrigger);
    };
  }, []);

  // Fetch initial dashboard and user data
  const loadDashboardData = async () => {
    try {
      setError(null);
      // Fetch recommendations, bookmarks, and profile concurrently
      const [recRes, bookmarkRes, profileRes] = await Promise.all([
        recommendationsApi.list(),
        bookmarksApi.list(),
        profileApi.get().catch((err) => {
          console.warn('Dashboard profile fetch failed:', err);
          return null;
        }),
      ]);

      if (recRes.data?.success) {
        const rawData = recRes.data.data;
        if (Array.isArray(rawData)) {
          setRecommendations(rawData);
        } else if (rawData && typeof rawData === 'object') {
          const keys: (
            'perfectMatch' | 'hiddenGem' | 'stretchGoal' | 'quickWin' | 'confidenceBuilder'
          )[] = ['perfectMatch', 'hiddenGem', 'stretchGoal', 'quickWin', 'confidenceBuilder'];
          const mapped: Recommendation[] = [];
          keys.forEach((key) => {
            const item = rawData[key];
            const opportunityDoc = item?.opportunityId;
            if (item && opportunityDoc && typeof opportunityDoc === 'object') {
              mapped.push({
                opportunity: opportunityDoc as any,
                recommendationScore: item.score || 80,
                matchedFactors: [],
                missingFactors: item.missingSkills || [],
                explanation: item.personalizedReason || item.whyNow || '',
              });
            }
          });
          setRecommendations(mapped);
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
    }
  };

  // Fetch paginated catalog opportunities
  const loadCatalogData = useCallback(
    async (pageNum: number, shouldAppend: boolean) => {
      try {
        const res = await opportunitiesApi.list({
          page: pageNum,
          limit: 12,
          category: categoryFilter,
          q: feedQuery,
          sortBy,
        });

        if (res.data?.success) {
          const newOpportunities = res.data.data;
          if (shouldAppend) {
            setCatalog((prev) => [...prev, ...newOpportunities]);
          } else {
            setCatalog(newOpportunities);
          }
          setTotalCatalogCount(res.data.pagination?.total || 0);
          setHasNext(res.data.pagination?.hasNext || false);
          setPage(pageNum);
        }
      } catch (err) {
        console.error('Failed to load catalog:', err);
      }
    },
    [categoryFilter, feedQuery, sortBy],
  );

  // Trigger loading catalog on filters/search changes
  useEffect(() => {
    if (activeTab === 'all') {
      loadCatalogData(1, false);
    }
  }, [activeTab, loadCatalogData]);

  const handleCardClick = (id: string) => {
    router.push(ROUTES.OPPORTUNITY(id));
  };

  // Bookmark toggler with Optimistic UI updates
  const handleBookmarkToggle = async (opportunityId: string) => {
    const isBookmarked = bookmarkedIds.has(opportunityId);
    const updatedBookmarks = new Set(bookmarkedIds);

    if (isBookmarked) {
      updatedBookmarks.delete(opportunityId);
    } else {
      updatedBookmarks.add(opportunityId);
    }
    setBookmarkedIds(updatedBookmarks); // optimistic

    try {
      if (isBookmarked) {
        await bookmarksApi.remove(opportunityId);
      } else {
        await bookmarksApi.add(opportunityId);
      }
    } catch (err) {
      console.error('Failed to save bookmark status:', err);
      // rollback on failure
      const rollbackBookmarks = new Set(bookmarkedIds);
      if (isBookmarked) {
        rollbackBookmarks.add(opportunityId);
      } else {
        rollbackBookmarks.delete(opportunityId);
      }
      setBookmarkedIds(rollbackBookmarks);
    }
  };

  // Setup references
  const featuredRec = recommendations[0];
  const featuredOpp = featuredRec?.opportunity;
  const hiddenGems = recommendations.filter((r) => r.opportunity.isHiddenGem);
  const recommendedOpps = recommendations.filter(
    (r) => r.recommendationScore >= 75 && r !== featuredRec,
  );

  const categories = ['ALL', 'SCHOLARSHIP', 'INTERNSHIP', 'FELLOWSHIP', 'GRANT'];

  return (
    <ProtectedRoute>
      {pageLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0B0C0E]">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={450}
            onComplete={() => {
              loadDashboardData().then(() => setPageLoading(false));
            }}
          />
        </div>
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
              ) : activeTab === 'recommended' ? (
                <>
                  {/* 1. Greeting Hero Section */}
                  <DashboardHero
                    userName={profileName || user?.name || user?.displayName || 'User'}
                    matchCount={recommendations.length}
                  />

                  {/* 2. Today's Scout Brief Section */}
                  <ScoutIntelligencePanel
                    opportunityCount={totalCatalogCount || recommendations.length * 11}
                    matchCount={recommendations.length}
                    bookmarkCount={bookmarkedIds.size}
                  />

                  {/* 3. Featured Match Section */}
                  {featuredOpp && (
                    <Stack gap="sm" className="space-y-4">
                      <div className="border-b border-border/40 pb-3 flex items-center justify-between">
                        <Typography variant="heading-m" className="font-normal font-sans">
                          Featured Match
                        </Typography>
                        <span className="text-xs text-secondary/60 font-light">
                          Highest compatibility today
                        </span>
                      </div>
                      <FeaturedOpportunityCard
                        title={featuredOpp.title}
                        organization={featuredOpp.organization}
                        description={featuredOpp.description}
                        deadline={featuredOpp.deadline || 'Flexible'}
                        matchScore={featuredRec.recommendationScore}
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
                    </Stack>
                  )}

                  {/* 4. Hidden Gems Strip */}
                  {hiddenGems.length > 0 && (
                    <RecommendationStrip
                      title="Hidden Gems"
                      description="Low-competition matching opportunities discovered recently."
                    >
                      {hiddenGems.map((gem) => (
                        <HiddenGemCard
                          key={gem.opportunity._id}
                          title={gem.opportunity.title}
                          organization={gem.opportunity.organization}
                          matchScore={gem.recommendationScore}
                          isBookmarked={bookmarkedIds.has(gem.opportunity._id)}
                          onBookmarkToggle={() => handleBookmarkToggle(gem.opportunity._id)}
                          onApplyClick={() => handleCardClick(gem.opportunity._id)}
                        />
                      ))}
                    </RecommendationStrip>
                  )}
                </>
              ) : (
                /* Explore Catalog Title Header (Dashboard curated headers hidden) */
                <div className="pt-4 pb-2 border-b border-border/30">
                  <h1 className="text-3xl md:text-5xl font-light tracking-tight text-foreground leading-tight">
                    Explore Opportunities
                  </h1>
                  <p className="text-xs text-secondary/60 font-light mt-1">
                    Scout Catalog — Browse and search all matching opportunities from our index.
                  </p>
                </div>
              )}

              {/* 5. Opportunity Feed with Tabs */}
              <Stack gap="md" className="space-y-6">
                {/* Tabs selection header */}
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
                      ? 'AI-personalized matches curated for your profile'
                      : `Displaying ${totalCatalogCount} opportunities in index`}
                  </span>
                </div>

                {/* Sub-search/filters block when "Explore Catalog" is active */}
                {activeTab === 'all' && (
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
                      {/* Category selector */}
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

                      {/* Sort Selector */}
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
                )}

                {/* Tab content rendering */}
                {activeTab === 'recommended' ? (
                  recommendedOpps.length > 0 ? (
                    <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                      {recommendedOpps.map((rec) => (
                        <OpportunityCard
                          key={rec.opportunity._id}
                          title={rec.opportunity.title}
                          organization={rec.opportunity.organization}
                          deadline={rec.opportunity.deadline || 'Flexible'}
                          tags={rec.opportunity.tags}
                          matchScore={rec.recommendationScore}
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
                    </Grid>
                  ) : (
                    <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                      <div className="text-secondary/40 shrink-0 select-none">
                        <Compass
                          className="w-12 h-12 stroke-[1.2] animate-spin"
                          style={{ animationDuration: '20s' }}
                        />
                      </div>
                      <Typography variant="heading-s" className="text-sm font-medium">
                        No matches available
                      </Typography>
                      <Typography
                        variant="body"
                        className="text-xs text-secondary/60 max-w-sm mx-auto font-light leading-relaxed"
                      >
                        Scout is analyzing opportunities in the background. Your personalized feed
                        will show up here.
                      </Typography>
                    </div>
                  )
                ) : catalog.length > 0 ? (
                  <div className="space-y-8">
                    <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                      {catalog.map((opp) => (
                        <OpportunityCard
                          key={opp._id}
                          title={opp.title}
                          organization={opp.organization}
                          deadline={opp.deadline || 'Flexible'}
                          tags={opp.tags}
                          matchScore={90} // Default score for catalog item without recommendations evaluation
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

                    {/* Pagination / Load more controls */}
                    <div className="pt-8 text-center space-y-4 border-t border-border/40">
                      <Typography variant="caption" className="text-secondary/60 font-light block">
                        Showing {catalog.length} of {totalCatalogCount} opportunities
                      </Typography>
                      {hasNext && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => loadCatalogData(page + 1, true)}
                        >
                          Load More Opportunities
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Search empty state
                  <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="text-secondary/40 shrink-0 select-none">
                      <Compass
                        className="w-12 h-12 stroke-[1.2] animate-spin"
                        style={{ animationDuration: '20s' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Typography variant="heading-s" className="text-sm font-medium">
                        No matches found
                      </Typography>
                      <Typography
                        variant="body"
                        className="text-xs text-secondary/60 max-w-sm mx-auto font-light leading-relaxed"
                      >
                        No opportunities matched your search criteria. Try removing filters or
                        changing the search keyword.
                      </Typography>
                    </div>
                  </div>
                )}
              </Stack>

              {/* 6. Scout Insights (only on curated dashboard) */}
              {activeTab === 'recommended' && recommendations.length > 0 && (
                <div className="border-t border-border/40 pt-10 select-none">
                  <Grid cols={1} colsMd={3} gap="lg">
                    <div className="p-6 rounded-2xl bg-accent/10 border border-border/30 space-y-2">
                      <Typography
                        variant="label"
                        className="text-[10px] text-primary uppercase tracking-widest font-semibold"
                      >
                        Resume Scoring
                      </Typography>
                      <Typography variant="heading-s" className="text-sm font-medium">
                        Engineering Relevance
                      </Typography>
                      <Typography
                        variant="body"
                        className="text-xs text-secondary/70 font-light leading-relaxed"
                      >
                        Your technical projects match 92% of the skills demanded by local fullstack
                        engineering programs.
                      </Typography>
                    </div>
                    <div className="p-6 rounded-2xl bg-accent/10 border border-border/30 space-y-2">
                      <Typography
                        variant="label"
                        className="text-[10px] text-primary uppercase tracking-widest font-semibold"
                      >
                        Competition Rate
                      </Typography>
                      <Typography variant="heading-s" className="text-sm font-medium">
                        Favorable Ratios
                      </Typography>
                      <Typography
                        variant="body"
                        className="text-xs text-secondary/70 font-light leading-relaxed"
                      >
                        Google Scholars and Qualcomm Travel Grants are currently receiving 15% fewer
                        applicant clicks than similar listings.
                      </Typography>
                    </div>
                    <div className="p-6 rounded-2xl bg-accent/10 border border-border/30 space-y-2">
                      <Typography
                        variant="label"
                        className="text-[10px] text-primary uppercase tracking-widest font-semibold"
                      >
                        Timeline Optimizer
                      </Typography>
                      <Typography variant="heading-s" className="text-sm font-medium">
                        Upcoming Milestones
                      </Typography>
                      <Typography
                        variant="body"
                        className="text-xs text-secondary/70 font-light leading-relaxed"
                      >
                        The highest match scholarship deadline is approaching. We suggest preparing
                        essay drafts by this Friday.
                      </Typography>
                    </div>
                  </Grid>
                </div>
              )}
            </Stack>
          </PageTransition>

          {/* Spotlight Command Search Modal overlay */}
          <SpotlightSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
