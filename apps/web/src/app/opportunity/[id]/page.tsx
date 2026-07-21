'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import {
  Typography,
  Grid,
  Stack,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  UniversalLoader,
  Divider,
  PageTransition,
} from '@/components/ui';
import { MatchScore, OpportunityBadge } from '@/components/opportunity';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckSquare,
  Target,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import { opportunitiesApi, recommendationsApi, bookmarksApi, Opportunity } from '@/lib/api';

const cleanTruncatedText = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  let text = str.trim();
  // Fix specific known truncated phrases from previous DB cache runs
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

  const loadingMessages = [
    'Finding opportunity details...',
    'Verifying candidate snapshot...',
    'Retrieving Scout Career Report...',
    'Ready.',
  ];

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
      setIsBookmarked(!nextStatus); // revert on error
    }
  };

  useEffect(() => {
    if (oppId) {
      fetchData().finally(() => setLoading(false));
    }
  }, [oppId]);

  const matchScore = recommendationItem?.score || (opportunity as any)?.matchScore || 80;
  const isWomenOnly =
    (opportunity as any)?.diversityPreference?.womenOnly ||
    opportunity?.organization?.toLowerCase().includes('women');

  return (
    <ProtectedRoute>
      {loading ? (
        <DashboardLayout>
          <div className="min-h-[60vh] flex items-center justify-center">
            <UniversalLoader messages={loadingMessages} />
          </div>
        </DashboardLayout>
      ) : error || !opportunity ? (
        <DashboardLayout>
          <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
            <Stack gap="md" align="center" className="max-w-md">
              <AlertCircle className="w-12 h-12 text-destructive opacity-80" />
              <Typography variant="heading-m">{error || 'Opportunity Not Found'}</Typography>
              <Button variant="secondary" onClick={() => router.push(ROUTES.EXPLORE)}>
                Back to Explore
              </Button>
            </Stack>
          </div>
        </DashboardLayout>
      ) : opportunity ? (
        <DashboardLayout>
          <PageTransition>
            <Stack gap="lg" className="w-full pb-16">
              {/* Back button header */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  iconLeft={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isBookmarked ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={handleBookmarkToggle}
                  >
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  {(opportunity.applicationUrl || opportunity.sourceURL) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const url = opportunity.applicationUrl || opportunity.sourceURL;
                        if (url) window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      iconRight={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Content Layout (12 cols) */}
              <Grid cols={1} colsMd={12} gap="lg" className="items-start">
                {/* Left Column: Opportunity Info (8 cols) */}
                <div className="md:col-span-8 space-y-6">
                  <Card className="border border-border/60">
                    <CardContent className="p-8 md:p-12 space-y-8">
                      {/* Upper details segment */}
                      <div className="space-y-3">
                        <Typography
                          variant="caption"
                          className="text-secondary/70 tracking-widest uppercase font-medium text-[10px]"
                        >
                          {opportunity.organization}
                        </Typography>
                        <Typography
                          variant="hero"
                          className="text-3xl md:text-4xl font-normal leading-tight"
                        >
                          {opportunity.title}
                        </Typography>
                      </div>

                      <Stack direction="row" align="center" gap="xs" wrap className="pt-2">
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
                      </Stack>

                      <Divider />

                      {/* Description about */}
                      <div className="space-y-3">
                        <Typography variant="heading-s" className="font-medium text-foreground">
                          About the Program
                        </Typography>
                        <Typography
                          variant="body"
                          className="text-secondary/80 font-light leading-relaxed whitespace-pre-line break-words"
                        >
                          {opportunity.description}
                        </Typography>
                      </div>

                      {/* Eligibility details */}
                      {opportunity.eligibility && (
                        <div className="space-y-3">
                          <Typography variant="heading-s" className="font-medium text-foreground">
                            Eligibility
                          </Typography>
                          <Typography
                            variant="body"
                            className="text-secondary/80 font-light leading-relaxed whitespace-pre-line break-words"
                          >
                            {opportunity.eligibility}
                          </Typography>
                        </div>
                      )}

                      {/* Application requirements */}
                      {opportunity.requirements && opportunity.requirements.length > 0 && (
                        <div className="space-y-3">
                          <Typography variant="heading-s" className="font-medium text-foreground">
                            Application Requirements
                          </Typography>
                          <ul className="space-y-2.5 list-disc pl-5 text-sm font-light text-secondary/80 leading-relaxed whitespace-pre-line break-words">
                            {opportunity.requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action links footer */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-border/40">
                        <div className="flex items-center gap-2 text-xs text-secondary/65">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Deadline:{' '}
                            <span className="font-medium text-foreground">
                              {opportunity.deadline || 'Flexible'}
                            </span>
                          </span>
                        </div>
                        {(opportunity.sourceURL || opportunity.applicationUrl) && (
                          <a
                            href={opportunity.sourceURL || opportunity.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 text-xs font-medium text-primary hover:underline"
                          >
                            <span>Visit original source portal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Scout AI Career Report sidebar (4 cols) */}
                <div className="md:col-span-4 space-y-6">
                  <Card className="border border-primary/30 bg-primary/[0.015] shadow-sm">
                    <CardHeader className="border-b border-border/45 pb-4">
                      <Stack gap="xxs">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <Typography
                            variant="label"
                            className="text-[10px] text-primary font-semibold tracking-widest uppercase"
                          >
                            Scout AI Career Coach
                          </Typography>
                        </div>
                        <CardTitle className="text-base font-medium">
                          Personalized Career Report
                        </CardTitle>
                      </Stack>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6 text-left">
                      {/* Section 1: Executive Summary */}
                      <div className="space-y-2">
                        <Typography
                          variant="label"
                          className="text-[10px] text-primary tracking-widest uppercase font-semibold block"
                        >
                          Executive Summary
                        </Typography>
                        <p className="text-xs text-foreground/90 font-normal leading-relaxed whitespace-normal break-words">
                          {cleanTruncatedText(
                            recommendationItem?.executiveSummary ||
                              recommendationItem?.personalizedReason ||
                              `Scout selected this opportunity based on your core engineering projects and technical skills.`,
                          )}
                        </p>
                      </div>

                      {/* Section 2: Why Scout Picked This */}
                      {recommendationItem?.whyScoutPickedThis && (
                        <div className="space-y-2">
                          <Typography
                            variant="label"
                            className="text-[10px] text-foreground/70 tracking-widest uppercase font-medium block"
                          >
                            Why Scout Picked This
                          </Typography>
                          <p className="text-xs text-secondary/80 font-light leading-relaxed whitespace-normal break-words">
                            {cleanTruncatedText(recommendationItem.whyScoutPickedThis)}
                          </p>
                        </div>
                      )}

                      <Divider />

                      {/* Section 3: Strongest Strengths */}
                      <div className="space-y-2.5">
                        <Typography
                          variant="label"
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 tracking-widest uppercase font-semibold block"
                        >
                          Your Strongest Strengths
                        </Typography>
                        <div className="space-y-2 text-xs text-secondary/85 font-light">
                          {(
                            recommendationItem?.strongestStrengths ||
                            opportunity.tags || ['Hands-on project experience with core stack']
                          ).map((strength: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="whitespace-normal break-words leading-relaxed">
                                {cleanTruncatedText(strength)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 4: Skill Gap Guidance (Fully Readable Complete Sentences) */}
                      {recommendationItem?.missingSkills &&
                        recommendationItem.missingSkills.length > 0 && (
                          <>
                            <Divider />
                            <div className="space-y-2.5">
                              <Typography
                                variant="label"
                                className="text-[10px] text-amber-600 dark:text-amber-400 tracking-widest uppercase font-semibold block"
                              >
                                Skill Gap Guidance
                              </Typography>
                              <div className="space-y-3 text-xs text-secondary/90 font-light">
                                {recommendationItem.missingSkills.map(
                                  (gap: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                      <span className="whitespace-normal break-words leading-relaxed text-xs">
                                        {cleanTruncatedText(gap)}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        )}

                      {/* Section 5: Resume Improvements */}
                      {recommendationItem?.resumeImprovements &&
                        recommendationItem.resumeImprovements.length > 0 && (
                          <>
                            <Divider />
                            <div className="space-y-2.5">
                              <Typography
                                variant="label"
                                className="text-[10px] text-foreground/70 tracking-widest uppercase font-medium block"
                              >
                                Resume Improvements
                              </Typography>
                              <div className="space-y-2 text-xs text-secondary/85 font-light">
                                {recommendationItem.resumeImprovements.map(
                                  (tip: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                      <span className="whitespace-normal break-words leading-relaxed">
                                        {cleanTruncatedText(tip)}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        )}

                      {/* Section 6: Interview Preparation */}
                      {recommendationItem?.interviewPrep &&
                        recommendationItem.interviewPrep.length > 0 && (
                          <>
                            <Divider />
                            <div className="space-y-2.5">
                              <Typography
                                variant="label"
                                className="text-[10px] text-foreground/70 tracking-widest uppercase font-medium block"
                              >
                                Likely Interview Topics
                              </Typography>
                              <div className="space-y-2 text-xs text-secondary/85 font-light">
                                {recommendationItem.interviewPrep.map(
                                  (topic: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <HelpCircle className="w-3.5 h-3.5 text-secondary/70 shrink-0 mt-0.5" />
                                      <span className="whitespace-normal break-words leading-relaxed">
                                        {cleanTruncatedText(topic)}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        )}

                      <Divider />

                      {/* Section 7: Application Confidence & Verdict */}
                      <div className="space-y-3 bg-accent/40 rounded-xl p-4 border border-border/50">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-secondary/70">Application Confidence</span>
                          <span className="text-primary font-semibold">
                            {recommendationItem?.applicationConfidence?.level || 'Competitive'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-secondary/70">Scout Verdict</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {recommendationItem?.scoutVerdict?.verdict || 'Apply Immediately'}
                          </span>
                        </div>

                        {recommendationItem?.scoutVerdict?.explanation && (
                          <p className="text-[11px] text-secondary/80 font-light leading-relaxed pt-1 whitespace-normal break-words">
                            {cleanTruncatedText(recommendationItem.scoutVerdict.explanation)}
                          </p>
                        )}
                      </div>

                      {/* Section 8: Next Action */}
                      <div className="space-y-2 pt-1">
                        <Typography
                          variant="label"
                          className="text-[10px] text-primary tracking-widest uppercase font-semibold block"
                        >
                          Next Action
                        </Typography>
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/20 whitespace-normal break-words">
                          {cleanTruncatedText(
                            recommendationItem?.nextAction ||
                              recommendationItem?.firstAction ||
                              'Review the application instructions and submit your details.',
                          )}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        className="w-full justify-center pt-3"
                        onClick={() => {
                          const url = opportunity.applicationUrl || opportunity.sourceURL;
                          if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        iconRight={<ExternalLink className="w-3.5 h-3.5" />}
                        disabled={!opportunity.applicationUrl && !opportunity.sourceURL}
                      >
                        Apply on Official Portal
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </Grid>
            </Stack>
          </PageTransition>
        </DashboardLayout>
      ) : null}
    </ProtectedRoute>
  );
}
