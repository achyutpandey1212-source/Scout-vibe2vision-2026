'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { Typography, Grid, Stack, UniversalLoader, PageTransition, Button } from '@/components/ui';
import { FeaturedOpportunityCard, OpportunityCard } from '@/components/opportunity';
import { DashboardHero, ScoutIntelligencePanel, RecommendationStrip } from '@/components/dashboard';
import { mockOpportunities, MockOpportunity } from '@/lib/mock';
import { ROUTES } from '@/lib/constants/routes';
import { SpotlightSearch } from '@/components/dashboard/SpotlightSearch';
import { Search, Compass } from 'lucide-react';
import { HiddenGemCard } from '@/components/opportunity/HiddenGemCard';

export default function DashboardPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended');

  // Infinite scroll sizing
  const [visibleCount, setVisibleCount] = useState(12);

  // Search & Filter controls for the "All Opportunities" (Explore Catalog)
  const [feedQuery, setFeedQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'deadline'>('match');

  const router = useRouter();

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

  const handleCardClick = (id: string) => {
    router.push(ROUTES.OPPORTUNITY(id));
  };

  // Find opportunities by types
  const featuredOpp = mockOpportunities.find((o) => o.isFeatured) || mockOpportunities[0];
  const hiddenGems = mockOpportunities.filter((o) => o.isHiddenGem);

  // Recommended matches: personalized (MatchScore >= 80)
  const recommendedOpps = mockOpportunities.filter((o) => o.matchScore >= 80 && !o.isFeatured);

  // All opportunities: dynamic filters/sort/search
  const processedAllOpps = mockOpportunities
    .filter((opp) => {
      // 1. Search Query
      const matchesSearch =
        opp.title.toLowerCase().includes(feedQuery.toLowerCase()) ||
        opp.organization.toLowerCase().includes(feedQuery.toLowerCase()) ||
        opp.tags.some((t) => t.toLowerCase().includes(feedQuery.toLowerCase()));

      // 2. Category Filter
      const matchesCategory = categoryFilter === 'ALL' || opp.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return b.matchScore - a.matchScore;
    });

  // Recycle items to simulate a massive dataset of 2,314 items (Infinite scrolling)
  const baseList = processedAllOpps.length > 0 ? processedAllOpps : mockOpportunities;
  const recycledAllOpps: MockOpportunity[] = [];
  for (let i = 0; i < 48; i++) {
    const original = baseList[i % baseList.length];
    recycledAllOpps.push({
      ...original,
      id: `${original.id}-recycled-${i}`,
      title:
        i >= baseList.length
          ? `${original.title} (Batch ${Math.floor(i / baseList.length) + 1})`
          : original.title,
    });
  }

  // Extract unique categories for filter dropdown
  const categories = ['ALL', 'SCHOLARSHIP', 'INTERNSHIP', 'FELLOWSHIP', 'GRANT'];

  return (
    <ProtectedRoute>
      {pageLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0B0C0E]">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={450}
            onComplete={() => setPageLoading(false)}
          />
        </div>
      ) : (
        <DashboardLayout>
          <PageTransition>
            <Stack gap="xl" className="pb-16 max-w-5xl mx-auto space-y-12">
              {/* Conditional rendering depending on tab: Curated Dashboard vs Explore Catalog */}
              {activeTab === 'recommended' ? (
                <>
                  {/* 1. Greeting Hero Section */}
                  <DashboardHero userName="Maya" />

                  {/* 2. Today's Scout Brief Section */}
                  <ScoutIntelligencePanel />

                  {/* 3. Featured Match Section */}
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

                  {/* 4. Hidden Gems Strip */}
                  <RecommendationStrip
                    title="Hidden Gems"
                    description="Low-competition matching opportunities discovered recently."
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
                      onClick={() => {
                        setActiveTab('recommended');
                        setVisibleCount(12);
                      }}
                      className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                        activeTab === 'recommended'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-secondary/60 hover:text-foreground'
                      }`}
                    >
                      Dashboard Curated
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('all');
                        setVisibleCount(12);
                      }}
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
                      : `Displaying ${processedAllOpps.length} base opportunities in index`}
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
                  <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                    {recommendedOpps.map((opp) => (
                      <OpportunityCard
                        key={opp.id}
                        title={opp.title}
                        organization={opp.organization}
                        deadline={opp.deadline}
                        tags={opp.tags}
                        matchScore={opp.matchScore}
                        isBookmarked={opp.id === 'opp-zenkai-mern'}
                        isWomenOnly={opp.isWomenOnly}
                        stipend={opp.stipend}
                        onBookmarkToggle={() => {}}
                        onApplyClick={() => handleCardClick(opp.id)}
                        onCardClick={() => handleCardClick(opp.id)}
                      />
                    ))}
                  </Grid>
                ) : processedAllOpps.length > 0 ? (
                  <div className="space-y-8">
                    <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                      {recycledAllOpps.slice(0, visibleCount).map((opp) => (
                        <OpportunityCard
                          key={opp.id}
                          title={opp.title}
                          organization={opp.organization}
                          deadline={opp.deadline}
                          tags={opp.tags}
                          matchScore={opp.matchScore}
                          isBookmarked={opp.id.startsWith('opp-zenkai-mern')}
                          isWomenOnly={opp.isWomenOnly}
                          stipend={opp.stipend}
                          onBookmarkToggle={() => {}}
                          onApplyClick={() => handleCardClick(opp.id.split('-recycled')[0])}
                          onCardClick={() => handleCardClick(opp.id.split('-recycled')[0])}
                        />
                      ))}
                    </Grid>

                    {/* Infinite scroll layout container */}
                    <div className="pt-8 text-center space-y-4 border-t border-border/40">
                      <Typography variant="caption" className="text-secondary/60 font-light block">
                        Showing {Math.min(visibleCount, 2314)} of 2,314 opportunities
                      </Typography>
                      {visibleCount < 48 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setVisibleCount((prev) => prev + 12)}
                        >
                          Load More Opportunities
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Search empty state with Compass Illustration
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
              {activeTab === 'recommended' && (
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
                        Qualcomm Scholars and SWE Travel Grant are currently receiving 15% fewer
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
                        WTM Scholarship deadline is 2 weeks away. We suggest preparing essay drafts
                        by this Friday.
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
