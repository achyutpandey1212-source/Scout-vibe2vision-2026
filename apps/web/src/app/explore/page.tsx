'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { Typography, Grid, Stack, UniversalLoader, Button, PageTransition } from '@/components/ui';
import { OpportunityCard } from '@/components/opportunity';
import { ROUTES } from '@/lib/constants/routes';
import { opportunitiesApi, bookmarksApi, Opportunity } from '@/lib/api';
import { Search, SlidersHorizontal, AlertCircle, Loader2, Compass, X } from 'lucide-react';

const PAGE_SIZE = 24;

const CATEGORIES = [
  { label: 'All', value: 'ALL' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Fellowship', value: 'FELLOWSHIP' },
  { label: 'Scholarship', value: 'SCHOLARSHIP' },
  { label: 'Competition', value: 'COMPETITION' },
  { label: 'Bootcamp', value: 'BOOTCAMP' },
  { label: 'Grant', value: 'GRANT' },
  { label: 'Job', value: 'JOB' },
  { label: 'Program', value: 'PROGRAM' },
  { label: 'Event', value: 'EVENT' },
  { label: 'Course', value: 'COURSE' },
  { label: 'Volunteer', value: 'VOLUNTEER' },
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

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // UI state
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'deadline' | 'newest'>('match');

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        if (!append) setError(null);
        const res = await opportunitiesApi.list({
          page: pageNum,
          limit: PAGE_SIZE,
          opportunityType: category === 'ALL' ? undefined : category,
          q: debouncedQuery || undefined,
          sortBy,
        });

        if (res.data?.success) {
          const newItems: Opportunity[] = res.data.data;
          setOpportunities((prev) => (append ? [...prev, ...newItems] : newItems));
          setTotalCount(res.data.pagination?.total ?? 0);
          setHasNext(res.data.pagination?.hasNext ?? false);
          setPage(pageNum);
        }
      } catch (err) {
        console.error('Explore fetch error:', err);
        if (!append) setError('Could not load opportunities. Please try again.');
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [category, debouncedQuery, sortBy],
  );

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
    // Optimistic update
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
      // Rollback
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
            {/* ── Header ── */}
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                Explore All
              </h1>
              <p className="text-secondary/60 font-light text-sm">
                {totalCount > 0
                  ? `${totalCount.toLocaleString()} opportunities in Scout's live index`
                  : 'Browse every opportunity Scout has discovered'}
              </p>
            </div>

            {/* ── Search + Filters Bar ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search opportunities, organisations, tags…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-border/60 bg-card/60 text-foreground placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort select */}
              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-secondary/50" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-sm py-2.5 px-3 rounded-xl border border-border/60 bg-card/60 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Category Pill Filters ── */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border transition-all duration-200 ${
                    category === cat.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card/60 text-secondary/70 border-border/60 hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ── Content ── */}
            {initialLoading ? (
              <div className="flex items-center justify-center py-32">
                <UniversalLoader
                  messages={['Scanning Scout index…', 'Fetching opportunities…', 'Almost there…']}
                />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
                <AlertCircle className="w-10 h-10 text-destructive/60" />
                <Typography variant="heading-s" className="text-sm font-medium">
                  Failed to load opportunities
                </Typography>
                <Typography variant="body" className="text-xs text-secondary/60">
                  {error}
                </Typography>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInitialLoading(true);
                    loadPage(1, false);
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
                <Compass
                  className="w-10 h-10 text-secondary/30 animate-spin"
                  style={{ animationDuration: '20s' }}
                />
                <Typography variant="heading-s" className="text-sm font-medium">
                  No results found
                </Typography>
                <Typography variant="body" className="text-xs text-secondary/60 max-w-xs">
                  {debouncedQuery
                    ? `No opportunities match "${debouncedQuery}". Try a different search.`
                    : "Scout hasn't indexed anything for this filter yet."}
                </Typography>
                {(debouncedQuery || category !== 'ALL') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setCategory('ALL');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Grid cols={1} colsSm={2} colsLg={3} gap="md">
                  {opportunities.map((opp) => (
                    <OpportunityCard
                      key={opp._id}
                      title={opp.title}
                      organization={opp.organization}
                      deadline={opp.deadline || 'Flexible'}
                      tags={opp.tags || []}
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
                </Grid>

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
                    <Typography variant="body" className="text-xs text-secondary/40 font-light">
                      You&apos;ve seen all {totalCount.toLocaleString()} opportunities
                    </Typography>
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
