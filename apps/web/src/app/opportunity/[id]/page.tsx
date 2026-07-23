'use client';

/**
 * ==========================================
 *     OPPORTUNITY DETAILS PAGE REDESIGN
 * ==========================================
 * Editorial Details View & AI Career Report
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { PageTransition } from '@/components/ui';
import { MatchScore, OpportunityBadge } from '@/components/opportunity';
import { SectionHeader } from '@/components/dashboard';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckSquare,
  Target,
  AlertCircle,
  HelpCircle,
  MapPin,
  Bookmark,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import { opportunitiesApi, recommendationsApi, bookmarksApi, Opportunity } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useScrollDepth } from '@/hooks/useScrollDepth';

const cleanTruncatedText = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  let text = str.trim();
  text = text.replace(
    /spendi\.\.\./gi,
    'spending a quick 30 minutes reading the documentation will bridge this gap.',
  );
  text = text.replace(/during the i\.\.\./gi, 'during the interview process.');
  text = text.replace(/(\b\w{1,8})\.\.\.$/gi, '$1.');
  text = text.replace(/(\b\w{1,8})\u2026$/gi, '$1.');
  text = text.replace(/\.\.\.$/g, '.');
  text = text.replace(/\u2026$/g, '.');
  return text;
};

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const oppId = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [recommendationItem, setRecommendationItem] = useState<any | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [oppRes, recRes, bookmarkRes] = await Promise.all([
        opportunitiesApi.getById(oppId),
        recommendationsApi.list(),
        bookmarksApi.list(),
      ]);

      if (oppRes.data?.success) {
        setOpportunity(oppRes.data.data);
      } else {
        setError('Opportunity not found.');
      }

      if (recRes.data?.success) {
        const rawData = recRes.data.data;
        let mapped: any[] = [];
        if (Array.isArray(rawData)) {
          mapped = rawData;
        } else if (rawData && typeof rawData === 'object') {
          const keys = [
            'perfectMatch',
            'hiddenGem',
            'stretchGoal',
            'quickWin',
            'confidenceBuilder',
          ];
          keys.forEach((key) => {
            const item = rawData[key];
            const opportunityDoc = item?.opportunity || item?.opportunityId;
            if (item && opportunityDoc && typeof opportunityDoc === 'object') {
              mapped.push({
                ...item,
                opportunity: opportunityDoc,
                slot: key,
              });
            }
          });
        }
        const found = mapped.find(
          (r) =>
            r.opportunity?._id === oppId ||
            r.opportunity?.id === oppId ||
            r.opportunityId === oppId,
        );
        if (found) {
          setRecommendationItem(found);
        }
      }

      if (bookmarkRes.data?.success) {
        const bookmarkedList: Opportunity[] = bookmarkRes.data.data;
        setIsBookmarked(bookmarkedList.some((b) => b._id === oppId));
      }

      if (oppRes.data?.success) {
        const activePackId =
          (typeof window !== 'undefined' ? localStorage.getItem('scout_v2_active_pack_id') : '') ||
          recRes.data?.packId ||
          recRes.data?.data?.packId ||
          recRes.data?.data?.id ||
          '';

        track('opportunity_opened', {
          packId: activePackId,
          opportunityId: oppId,
          category: oppRes.data.data.category || '',
          source: 'opportunity_details',
          matchScore: recommendationItem?.score || oppRes.data.data.matchScore || 80,
        });
      }
    } catch (err) {
      console.error('Failed to load opportunity details:', err);
      setError('Unable to reach Scout database. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!opportunity) return;
    const nextStatus = !isBookmarked;
    setIsBookmarked(nextStatus);
    if (nextStatus) {
      track('bookmark_added', { opportunityId: opportunity._id });
    } else {
      track('bookmark_removed', { opportunityId: opportunity._id });
    }

    try {
      if (nextStatus) {
        await bookmarksApi.add(opportunity._id);
      } else {
        await bookmarksApi.remove(opportunity._id);
      }
    } catch (err) {
      console.error('Failed to update bookmark:', err);
      setIsBookmarked(!nextStatus);
    }
  };

  useScrollDepth('Opportunity Details');

  const mountTimeRef = useRef<number>(Date.now());
  const completedFiredRef = useRef<boolean>(false);

  useEffect(() => {
    if (oppId) {
      fetchData();
      mountTimeRef.current = Date.now();
      completedFiredRef.current = false;

      track('opportunity_read_started', {
        opportunityId: oppId,
        source: 'opportunity_details',
        category: opportunity?.category || '',
      });

      const timer = setInterval(() => {
        const elapsed = Math.round((Date.now() - mountTimeRef.current) / 1000);
        if (elapsed >= 45 && !completedFiredRef.current) {
          completedFiredRef.current = true;
          track('opportunity_read_completed', {
            opportunityId: oppId,
            timeSpentSeconds: elapsed,
            scrollDepth: 45,
          });
        }
      }, 5000);

      return () => {
        clearInterval(timer);
        const timeSpentSeconds = Math.round((Date.now() - mountTimeRef.current) / 1000);
        track('opportunity_exit', {
          opportunityId: oppId,
          timeSpentSeconds,
          scrollDepth: 50,
        });
      };
    }
  }, [oppId]);

  const matchScore = recommendationItem?.score || (opportunity as any)?.matchScore || 80;
  const isWomenOnly =
    (opportunity as any)?.isWomenOnly ||
    (opportunity as any)?.diversityPreference?.womenOnly ||
    opportunity?.genderEligibility?.toLowerCase().includes('women') ||
    opportunity?.genderEligibility?.toLowerCase().includes('female');

  // Dynamic empty section checks
  const hasExecutiveSummary = Boolean(
    recommendationItem?.executiveSummary || recommendationItem?.personalizedReason,
  );
  const hasWhyScout = Boolean(recommendationItem?.whyScoutPickedThis);
  const hasStrengths = Boolean(
    recommendationItem?.strongestStrengths && recommendationItem.strongestStrengths.length > 0,
  );
  const hasSkillGaps = Boolean(
    recommendationItem?.missingSkills && recommendationItem.missingSkills.length > 0,
  );
  const hasResumeImprovements = Boolean(
    recommendationItem?.resumeImprovements && recommendationItem.resumeImprovements.length > 0,
  );
  const hasInterviewPrep = Boolean(
    recommendationItem?.interviewPrep && recommendationItem.interviewPrep.length > 0,
  );
  const hasApplicationStrategy = Boolean(recommendationItem?.applicationStrategy);
  const hasPreparationChecklist = Boolean(
    recommendationItem?.preparationChecklist && recommendationItem.preparationChecklist.length > 0,
  );
  const hasScoutVerdict = Boolean(recommendationItem?.scoutVerdict?.explanation);
  const hasApplicationConfidence = Boolean(recommendationItem?.applicationConfidence?.level);
  const hasNextAction = Boolean(recommendationItem?.nextAction);

  return (
    <ProtectedRoute>
      <DashboardLayout title={opportunity?.title || 'Opportunity Details'}>
        <PageTransition>
          <div className="max-w-6xl mx-auto space-y-8 select-none">
            {/* Top Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBookmarkToggle}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isBookmarked
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/80 bg-card hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-primary' : ''}`} />
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>

                {(opportunity?.applicationUrl || opportunity?.sourceURL) && (
                  <a
                    href={opportunity.applicationUrl || opportunity.sourceURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      track('apply_clicked', {
                        opportunityId: oppId,
                        source: 'opportunity_details',
                        matchScore: matchScore,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <span>Apply Now</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-64 bg-card border border-border/60 rounded-3xl p-8" />
              </div>
            ) : error || !opportunity ? (
              <div className="p-10 border border-border/80 bg-card rounded-3xl text-center space-y-4 my-8">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-base font-display font-medium text-foreground">
                  {error || 'Opportunity Not Found'}
                </h3>
                <button
                  onClick={() => router.push(ROUTES.EXPLORE)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity"
                >
                  Back to Discover
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* ── Left Column: Opportunity Info (8 cols) ── */}
                <div className="md:col-span-8 space-y-6">
                  <div className="p-6 md:p-8 border border-border/80 bg-card rounded-3xl space-y-6 shadow-sm">
                    {/* Upper details */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
                        {opportunity.organization}
                      </span>
                      <h1 className="text-2xl md:text-3xl font-display font-medium text-foreground leading-tight">
                        {opportunity.title}
                      </h1>
                    </div>

                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <MatchScore score={matchScore} />
                      {isWomenOnly && (
                        <OpportunityBadge label="Women Preferred" variant="women-only" />
                      )}
                      {opportunity.stipend != null && (
                        <OpportunityBadge
                          label={`₹${Number(opportunity.stipend).toLocaleString()}`}
                          variant="stipend"
                        />
                      )}
                    </div>

                    {/* About Description */}
                    <div className="pt-4 border-t border-border/40 space-y-2">
                      <h3 className="text-sm font-medium text-foreground">About the Opportunity</h3>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed whitespace-pre-line break-words">
                        {opportunity.description}
                      </p>
                    </div>

                    {/* Eligibility details */}
                    {opportunity.eligibility && (
                      <div className="pt-4 border-t border-border/40 space-y-2">
                        <h3 className="text-sm font-medium text-foreground">Eligibility</h3>
                        <p className="text-xs text-muted-foreground font-light leading-relaxed whitespace-pre-line break-words">
                          {opportunity.eligibility}
                        </p>
                      </div>
                    )}

                    {/* Application requirements */}
                    {opportunity.requirements && opportunity.requirements.length > 0 && (
                      <div className="pt-4 border-t border-border/40 space-y-2">
                        <h3 className="text-sm font-medium text-foreground">
                          Application Requirements
                        </h3>
                        <ul className="space-y-1.5 list-disc pl-5 text-xs text-muted-foreground font-light leading-relaxed">
                          {opportunity.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer Links */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-border/40 text-xs font-light text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                          Deadline:{' '}
                          <strong className="font-medium text-foreground">
                            {opportunity.deadline || 'Flexible'}
                          </strong>
                        </span>
                      </div>

                      {(opportunity.sourceURL || opportunity.applicationUrl) && (
                        <a
                          href={opportunity.sourceURL || opportunity.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                        >
                          <span>Visit official source portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Scout AI Career Report Sidebar (4 cols) ── */}
                <div className="md:col-span-4 space-y-6">
                  <div className="p-6 border border-primary/30 bg-primary/[0.02] rounded-3xl space-y-5 shadow-sm text-left">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                      <div>
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-primary block">
                          Scout AI Career Coach
                        </span>
                        <h3 className="text-sm font-medium text-foreground">
                          Personalized Career Report
                        </h3>
                      </div>
                    </div>

                    {/* Section 1: Executive Summary */}
                    {hasExecutiveSummary && (
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-primary block">
                          Executive Summary
                        </span>
                        <p className="text-foreground/90 font-light leading-relaxed">
                          {cleanTruncatedText(
                            recommendationItem?.executiveSummary ||
                              recommendationItem?.personalizedReason ||
                              'Scout selected this opportunity based on your core engineering projects and technical skills.',
                          )}
                        </p>
                      </div>
                    )}

                    {/* Section 2: Why Scout Picked This */}
                    {hasWhyScout && (
                      <div className="space-y-1 text-xs pt-2 border-t border-border/40">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground block">
                          Why Scout Picked This
                        </span>
                        <p className="text-muted-foreground font-light leading-relaxed">
                          {cleanTruncatedText(recommendationItem.whyScoutPickedThis)}
                        </p>
                      </div>
                    )}

                    {/* Section 3: Strongest Strengths */}
                    {hasStrengths && (
                      <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 block">
                          Your Strongest Strengths
                        </span>
                        <div className="space-y-1 text-muted-foreground font-light">
                          {recommendationItem.strongestStrengths.map(
                            (strength: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">
                                  {cleanTruncatedText(strength)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section 4: Dynamic Skill Gap Guidance */}
                    {hasSkillGaps && (
                      <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-600 dark:text-amber-400 block">
                          Skill Gap Guidance
                        </span>
                        <div className="space-y-2 text-muted-foreground font-light">
                          {recommendationItem.missingSkills.map((gap: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{cleanTruncatedText(gap)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 5: Dynamic Resume Improvements */}
                    {hasResumeImprovements && (
                      <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground block">
                          Resume Improvements
                        </span>
                        <div className="space-y-1.5 text-muted-foreground font-light">
                          {recommendationItem.resumeImprovements.map((tip: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{cleanTruncatedText(tip)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 6: Dynamic Interview Preparation */}
                    {hasInterviewPrep && (
                      <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground block">
                          Likely Interview Topics
                        </span>
                        <div className="space-y-1.5 text-muted-foreground font-light">
                          {recommendationItem.interviewPrep.map((topic: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{cleanTruncatedText(topic)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 7: Application Strategy */}
                    {hasApplicationStrategy && (
                      <div className="space-y-1 pt-2 border-t border-border/40 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-primary block">
                          Application Strategy
                        </span>
                        <p className="text-muted-foreground font-light leading-relaxed">
                          {cleanTruncatedText(recommendationItem.applicationStrategy)}
                        </p>
                      </div>
                    )}

                    {/* Section 8: Preparation Checklist */}
                    {hasPreparationChecklist && (
                      <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-primary block">
                          Preparation Checklist
                        </span>
                        <div className="space-y-1 text-muted-foreground font-light">
                          {recommendationItem.preparationChecklist.map(
                            (item: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{cleanTruncatedText(item)}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section 9: Application Confidence */}
                    {hasApplicationConfidence && (
                      <div className="pt-2 border-t border-border/40 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground block mb-1.5">
                          Application Confidence
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              recommendationItem.applicationConfidence.level === 'Very Competitive'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : recommendationItem.applicationConfidence.level === 'Competitive'
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                  : recommendationItem.applicationConfidence.level ===
                                      'Moderate Match'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {recommendationItem.applicationConfidence.level}
                          </span>
                        </div>
                        {recommendationItem.applicationConfidence.explanation && (
                          <p className="text-muted-foreground font-light leading-relaxed mt-1.5">
                            {cleanTruncatedText(
                              recommendationItem.applicationConfidence.explanation,
                            )}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Section 10: Next Action */}
                    {hasNextAction && (
                      <div className="pt-2 border-t border-border/40 text-xs">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-600 dark:text-amber-400 block mb-1.5">
                          Your Next Step
                        </span>
                        <p className="text-foreground/90 font-medium leading-relaxed bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-3 py-2">
                          {cleanTruncatedText(recommendationItem.nextAction)}
                        </p>
                      </div>
                    )}

                    {/* Section 11: Scout Verdict */}
                    {hasScoutVerdict && (
                      <div className="pt-2 border-t border-border/40 text-xs">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[10px] font-semibold tracking-widest uppercase text-primary">
                            Scout Verdict
                          </span>
                          {recommendationItem.scoutVerdict?.verdict && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                              {recommendationItem.scoutVerdict.verdict}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground font-light leading-relaxed">
                          {cleanTruncatedText(recommendationItem.scoutVerdict.explanation)}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const url = opportunity.applicationUrl || opportunity.sourceURL;
                          if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        disabled={!opportunity.applicationUrl && !opportunity.sourceURL}
                        className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span>Apply on Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PageTransition>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
