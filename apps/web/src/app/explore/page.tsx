'use client';

/**
 * ==========================================
 *        DISCOVER SCREEN REDESIGN
 * ==========================================
 * Editorial Opportunity Collection View
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { PageTransition } from '@/components/ui';
import { OpportunityCard, OpportunityCardSkeleton } from '@/components/opportunity';
import { SectionHeader } from '@/components/dashboard';
import { ROUTES } from '@/lib/constants/routes';
import { opportunitiesApi, bookmarksApi, Opportunity } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useScrollDepth } from '@/hooks/useScrollDepth';
import { Search, SlidersHorizontal, Loader2, Compass, X } from 'lucide-react';

const PAGE_SIZE = 24;

const CATEGORIES = [
  { label: 'All', value: 'ALL' },
  { label: 'Internship', value: 'INTERNSHIPS' },
  { label: 'Fellowship', value: 'FELLOWSHIPS' },
  { label: 'Scholarship', value: 'SCHOLARSHIPS' },
  { label: 'Hackathons', value: 'HACKATHONS' },
  { label: 'Job', value: 'JOB' },
  { label: 'Event', value: 'EVENT' },
];

const SORT_OPTIONS = [
  { label: 'Best Match', value: 'match' },
  { label: 'Deadline', value: 'deadline' },
  { label: 'Newest', value: 'newest' },
];

export default function ExplorePage() {
  const router = useRouter();

  // Data state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // UI state
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'deadline' | 'newest'>('match');

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadCounts = useCallback(async () => {
    try {
      const res = await opportunitiesApi.counts();
      if (res.data?.success && typeof res.data.data === 'object') {
        setCategoryCounts(res.data.data as Record<string, number>);
      }
    } catch {
      // Silent fail for counts — filters still work without counts
    }
  }, []);

  // Debounce search query by 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset and reload when filters change
  useEffect(() => {
    setOpportunities([]);
    setPage(1);
    setHasNext(false);
    setInitialLoading(true);
    loadPage(1, false);
  }, [debouncedQuery, category, sortBy]);

  // Fetch bookmarks once on mount
  useEffect(() => {
    bookmarksApi
      .list()
      .then((res) => {
        if (res.data?.success) {
          const ids = res.data.data.map((o: Opportunity) => o._id);
          setBookmarkedIds(new Set(ids));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch category counts once on mount
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        const res = await opportunitiesApi.list({
          page: pageNum,
          limit: PAGE_SIZE,
          category: category === 'ALL' ? undefined : category,
          q: debouncedQuery || undefined,
          sortBy,
        });

        if (res.data?.success) {
          const newItems: Opportunity[] = res.data.data;
          setOpportunities((prev) => (append ? [...prev, ...newItems] : newItems));
          setTotalCount(res.data.pagination?.total ?? 0);
          setHasNext(res.data.pagination?.hasNext ?? false);
          setPage(pageNum);

          if (debouncedQuery) {
            track('discover_search', {
              queryLength: debouncedQuery.length,
              resultsReturned: newItems.length,
            });
          }
          if (newItems.length === 0) {
            track('empty_state_viewed', {
              page: 'explore',
              reason: 'no_search_results',
            });
          }
        }
      } catch (err) {
        console.error('Explore fetch error:', err);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [category, debouncedQuery, sortBy],
  );

  useScrollDepth('Discover');

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loadingMore && !initialLoading) {
          setLoadingMore(true);
          loadPage(page + 1, true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNext, loadingMore, initialLoading, page, loadPage]);

  const handleCardClick = (id: string) => router.push(ROUTES.OPPORTUNITY(id));

  const handleBookmarkToggle = async (id: string) => {
    const isBookmarked = bookmarkedIds.has(id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (isBookmarked) await bookmarksApi.remove(id);
      else await bookmarksApi.add(id);
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('ALL');
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <div className="max-w-4xl mx-auto space-y-8 pb-20 select-none">
            {/* ── Collection Header ── */}
            <SectionHeader
              title="Discover Opportunities"
              description="Browse verified opportunities from across the web."
            />

            {/* ── Search & Filter Controls ── */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search opportunities, organizations, technologies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-border/80 bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground/60" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="text-xs py-2.5 px-3 rounded-xl border border-border/80 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Pill Filters */}
              <div className="flex flex-wrap gap-2 pt-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-card border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {!initialLoading && totalCount !== undefined && (
              <p className="text-xs text-muted-foreground/70 font-light pt-0.5">
                {totalCount.toLocaleString()}+ opportunities
              </p>
            )}

            {/* ── Content Grid / Skeletons / Empty State ── */}
            {initialLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OpportunityCardSkeleton variant="default" />
                <OpportunityCardSkeleton variant="default" />
                <OpportunityCardSkeleton variant="default" />
                <OpportunityCardSkeleton variant="default" />
                <OpportunityCardSkeleton variant="default" />
                <OpportunityCardSkeleton variant="default" />
              </div>
            ) : opportunities.length === 0 ? (
              /* Collection Empty State */
              <div className="p-10 border border-border/80 bg-card rounded-3xl text-center space-y-4 my-8">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 text-muted-foreground/60 flex items-center justify-center mx-auto">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-display font-medium text-foreground">
                    No opportunities match your search.
                  </h3>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">
                    Try adjusting your filters or explore a broader category.
                  </p>
                </div>
                {(debouncedQuery || category !== 'ALL') && (
                  <div className="pt-2">
                    <button
                      onClick={clearFilters}
                      className="px-5 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {opportunities.map((opp) => (
                    <OpportunityCard
                      key={opp._id}
                      title={opp.title}
                      organization={opp.organization}
                      description={opp.description}
                      deadline={opp.deadline || 'Flexible'}
                      tags={opp.tags || []}
                      matchScore={(opp as any).matchScore ?? (opp as any).score}
                      isBookmarked={bookmarkedIds.has(opp._id)}
                      isWomenOnly={
                        opp.isWomenOnly ||
                        opp.genderEligibility?.toLowerCase().includes('women') ||
                        opp.genderEligibility?.toLowerCase().includes('female')
                      }
                      stipend={
                        opp.stipend != null ? `₹${Number(opp.stipend).toLocaleString()}` : undefined
                      }
                      onBookmarkToggle={() => handleBookmarkToggle(opp._id)}
                      onApplyClick={() => handleCardClick(opp._id)}
                      onCardClick={() => handleCardClick(opp._id)}
                    />
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="w-full h-8" />

                {/* Loading more spinner */}
                {loadingMore && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
                  </div>
                )}

                {/* End of list message */}
                {!hasNext && opportunities.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground/60 font-light">
                      You&apos;ve seen all {totalCount.toLocaleString()} opportunities
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </PageTransition>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
