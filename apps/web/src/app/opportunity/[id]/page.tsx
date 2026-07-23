'use client';

/**
 * ==========================================
 *     OPPORTUNITY DETAILS PAGE REDESIGN
 * ==========================================
 * Editorial Details View & AI Career Report
 */

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (oppId) {
      fetchData();
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <div className="max-w-4xl mx-auto space-y-8 pb-20 select-none">
            {/* Top Bar Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBookmarkToggle}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isBookmarked
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-card border-border/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-primary text-primary' : ''}`}
                  />
                  <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                </button>

                {(opportunity?.applicationUrl || opportunity?.sourceURL) && (
                  <a
                    href={opportunity.applicationUrl || opportunity.sourceURL}
                    target="_blank"
                    rel="noopener noreferrer"
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
