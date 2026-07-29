'use client';

/**
 * ==========================================
 *        DISCOVER SCREEN REDESIGN
 * ==========================================
 * Editorial Opportunity Collection View
 */

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { PageTransition } from '@/components/ui';
import { OpportunityCard, OpportunityCardSkeleton } from '@/components/opportunity';
import { SectionHeader } from '@/components/dashboard';
import { ROUTES } from '@/lib/constants/routes';
import { opportunitiesApi, bookmarksApi, Opportunity } from '@/lib/api';
import { PlatformRegistry } from '@scout/shared';

import { track } from '@/lib/analytics';
import { useScrollDepth } from '@/hooks/useScrollDepth';
import {
  Search,
  SlidersHorizontal,
  Loader2,
  Compass,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const UNIQUE_PLATFORMS = Object.values(
  Object.values(PlatformRegistry).reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<string, any>,
  ),
);

const PAGE_SIZE = 18;

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

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialPlatform = searchParams.get('platform') || 'ALL';
  const initialSortBy = (searchParams.get('sortBy') as any) || 'match';
  const initialQuery = searchParams.get('q') || '';

  // Data state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Pagination state
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [platform, setPlatform] = useState(initialPlatform);
  const [sortBy, setSortBy] = useState<'match' | 'deadline' | 'newest'>(initialSortBy);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null);

  const loadCounts = useCallback(async () => {
    try {
      const res = await opportunitiesApi.counts();
      if (res.data?.success && typeof res.data.data === 'object') {
        setCategoryCounts(res.data.data as Record<string, number>);
      }
    } catch {
      // Silent fail for counts
    }
  }, []);

  // Update URL params
  const updateQueryParams = useCallback(
    (newParams: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === 'ALL' || value === '' || (key === 'page' && value === 1)) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  // Debounce search query by 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      if (debouncedQuery !== searchQuery) {
        setDebouncedQuery(searchQuery);
        setPage(1); // Reset to page 1 on search change
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, debouncedQuery]);

  // Handle filter changes directly resetting page to 1
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };
  const handlePlatformChange = (val: string) => {
    setPlatform(val);
    setPage(1);
  };
  const handleSortChange = (val: typeof sortBy) => {
    setSortBy(val);
    setPage(1);
  };

  // Sync state to URL and fetch
  useEffect(() => {
    updateQueryParams({
      q: debouncedQuery,
      category,
      platform,
      sortBy,
      page,
    });

    let isMounted = true;
    setIsLoading(true);

    opportunitiesApi
      .list({
        page,
        limit: PAGE_SIZE,
        category: category === 'ALL' ? undefined : category,
        platform: platform === 'ALL' ? undefined : platform,
        q: debouncedQuery || undefined,
        sortBy,
      })
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success) {
          const newItems: Opportunity[] = res.data.data;
          setOpportunities(newItems);
          const total = res.data.pagination?.total ?? 0;
          setTotalCount(total);
          setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);

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
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Explore fetch error:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, category, platform, sortBy, page, updateQueryParams]);

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

  useScrollDepth('Discover');

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
    setPlatform('ALL');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      if (gridTopRef.current) {
        window.scrollTo({
          top: gridTopRef.current.offsetTop - 100,
          behavior: 'smooth',
        });
      }
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-transparent hover:bg-muted/50 text-muted-foreground disabled:opacity-50 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="w-8 h-8 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-all"
              >
                1
              </button>
              {startPage > 2 && <span className="text-muted-foreground/50 text-xs px-1">...</span>}
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`w-8 h-8 rounded-xl text-xs font-medium transition-all ${
                page === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {p}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="text-muted-foreground/50 text-xs px-1">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="w-8 h-8 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-all"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-transparent hover:bg-muted/50 text-muted-foreground disabled:opacity-50 disabled:hover:bg-transparent transition-all"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
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
              onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
              className="text-xs py-2.5 px-3 rounded-xl border border-border/80 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Platform Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground/60" />
            <select
              value={platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="text-xs py-2.5 px-3 rounded-xl border border-border/80 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="ALL">All Platforms</option>
              {UNIQUE_PLATFORMS.map((plat) => (
                <option key={plat.id} value={plat.id}>
                  {plat.name}
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
                onClick={() => handleCategoryChange(cat.value)}
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

      {!isLoading && totalCount !== undefined && (
        <div className="text-xs text-muted-foreground/70 font-light pt-0.5 leading-relaxed">
          <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>{' '}
          opportunities collected from{' '}
          <span className="font-medium text-foreground">Internshala</span>,{' '}
          <span className="font-medium text-foreground">Unstop</span>,{' '}
          <span className="font-medium text-foreground">LinkedIn</span> and{' '}
          <span className="font-medium text-foreground">{UNIQUE_PLATFORMS.length - 3} more</span>{' '}
          trusted platforms.
        </div>
      )}

      {/* Grid Top Anchor */}
      <div ref={gridTopRef} className="scroll-mt-24" />

      {/* ── Content Grid / Skeletons / Empty State ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <OpportunityCardSkeleton key={i} variant="default" />
          ))}
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
          {(debouncedQuery || category !== 'ALL' || platform !== 'ALL') && (
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
                sourceDomain={(opp as any).sourceDomain}
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

          {renderPagination()}
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <Suspense
            fallback={
              <div className="flex justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            }
          >
            <ExploreContent />
          </Suspense>
        </PageTransition>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
