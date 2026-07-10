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
  ShieldAlert,
  Sparkles,
  CheckSquare,
  Target,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';
import {
  opportunitiesApi,
  recommendationsApi,
  bookmarksApi,
  Opportunity,
  Recommendation,
} from '@/lib/api';

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const oppId = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const loadingMessages = [
    'Finding opportunity details...',
    'Verifying eligibility profiles...',
    'Formulating match explanation...',
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
        const found = (recRes.data.data as Recommendation[]).find(
          (r) => r.opportunity._id === oppId,
        );
        if (found) {
          setRecommendation(found);
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
    setIsBookmarked(nextStatus); // optimistic update

    try {
      if (nextStatus) {
        await bookmarksApi.add(opportunity._id);
      } else {
        await bookmarksApi.remove(opportunity._id);
      }
    } catch (err) {
      console.error('Bookmark toggle error:', err);
      setIsBookmarked(!nextStatus); // rollback
    }
  };

  if (error && !loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card className="text-center p-12 max-w-md mx-auto space-y-4">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <Typography variant="heading-m">Opportunity Not Found</Typography>
            <Typography variant="body" className="text-secondary/70">
              {error}
            </Typography>
            <Button variant="primary" onClick={() => router.push(ROUTES.DASHBOARD)}>
              Go Back Home
            </Button>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Derived scoring and intelligence parameters
  const matchScore = recommendation ? recommendation.recommendationScore : 85;
  const isWomenOnly =
    opportunity?.isWomenOnly ||
    opportunity?.genderEligibility?.toLowerCase().includes('women') ||
    opportunity?.genderEligibility?.toLowerCase().includes('female') ||
    opportunity?.tags?.some((t) => t.toLowerCase().includes('women'));

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0B0C0E]">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={300}
            onComplete={() => {
              fetchData().then(() => setLoading(false));
            }}
          />
        </div>
      ) : opportunity ? (
        <DashboardLayout>
          <PageTransition>
            <Stack gap="lg" className="max-w-5xl mx-auto space-y-8">
              {/* Back Action button */}
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(ROUTES.DASHBOARD)}
                  iconLeft={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Opportunities
                </Button>

                <Button
                  variant={isBookmarked ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={handleBookmarkToggle}
                  iconLeft={<Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />}
                >
                  {isBookmarked ? 'Saved' : 'Save opportunity'}
                </Button>
              </div>

              {/* Split Page details layout */}
              <Grid cols={1} colsMd={12} gap="lg" className="items-start gap-8">
                {/* Left Column: Core Description & Details (8 cols) */}
                <div className="md:col-span-8 space-y-8">
                  <Card className="border border-border/40">
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
                          className="text-secondary/80 font-light leading-relaxed whitespace-pre-line"
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
                            className="text-secondary/80 font-light leading-relaxed"
                          >
                            {opportunity.eligibility}
                          </Typography>
                        </div>
                      )}

                      {/* Program Benefits */}
                      {opportunity.benefits && (
                        <div className="space-y-3">
                          <Typography variant="heading-s" className="font-medium text-foreground">
                            Benefits
                          </Typography>
                          <Typography
                            variant="body"
                            className="text-secondary/80 font-light leading-relaxed"
                          >
                            {opportunity.benefits}
                          </Typography>
                        </div>
                      )}

                      {/* Application requirements */}
                      {opportunity.requirements && opportunity.requirements.length > 0 && (
                        <div className="space-y-3">
                          <Typography variant="heading-s" className="font-medium text-foreground">
                            Application Requirements
                          </Typography>
                          <ul className="space-y-2.5 list-disc pl-5 text-sm font-light text-secondary/80 leading-relaxed">
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

                {/* Right Column: Scout Intelligence sidebar (4 cols) */}
                <div className="md:col-span-4 space-y-6">
                  <Card className="border border-primary/20 bg-primary/[0.01]">
                    <CardHeader className="border-b border-border/45 pb-4">
                      <Stack gap="xxs">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Sparkles className="w-4 h-4" />
                          <Typography
                            variant="label"
                            className="text-[10px] text-primary font-semibold tracking-widest uppercase"
                          >
                            Scout Intelligence
                          </Typography>
                        </div>
                        <CardTitle className="text-base font-medium">
                          Curated Compatibility
                        </CardTitle>
                      </Stack>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6 text-left">
                      {/* Section: Why it matches */}
                      <div className="space-y-2">
                        <Typography
                          variant="label"
                          className="text-[10px] text-foreground/80 tracking-widest uppercase font-medium"
                        >
                          Why it matches
                        </Typography>
                        <p className="text-xs text-secondary/80 font-light leading-relaxed">
                          {recommendation?.explanation ||
                            `This opportunity contains tags matching your skills and work preferences (${opportunity.tags.join(', ')}).`}
                        </p>
                      </div>

                      {recommendation && recommendation.matchedFactors.length > 0 && (
                        <>
                          <Divider />
                          {/* Section: Strengths */}
                          <div className="space-y-2">
                            <Typography
                              variant="label"
                              className="text-[10px] text-foreground/80 tracking-widest uppercase font-medium"
                            >
                              Your Strengths
                            </Typography>
                            <div className="space-y-1.5 text-xs text-secondary/80 font-light">
                              {recommendation.matchedFactors.map((strength, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>{strength}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {recommendation && recommendation.missingFactors.length > 0 && (
                        <>
                          <Divider />
                          {/* Section: Challenges */}
                          <div className="space-y-2">
                            <Typography
                              variant="label"
                              className="text-[10px] text-foreground/80 tracking-widest uppercase font-medium"
                            >
                              Possible Gaps
                            </Typography>
                            <div className="space-y-1.5 text-xs text-secondary/80 font-light">
                              {recommendation.missingFactors.map((gap, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{gap}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <Divider />

                      {/* Section: Suggestions */}
                      <div className="space-y-2.5">
                        <Typography
                          variant="label"
                          className="text-[10px] text-foreground/80 tracking-widest uppercase font-medium"
                        >
                          Suggestions before applying
                        </Typography>
                        <div className="space-y-2 text-xs text-secondary/80 font-light">
                          <div className="flex items-start gap-2">
                            <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>Highlight technical key capabilities in CV</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>Review application instructions on portal</span>
                          </div>
                        </div>
                      </div>

                      <Divider />

                      {/* Section: Estimated Fit */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary/70 font-light">
                          Estimated compatibility
                        </span>
                        <span className="font-semibold text-primary">{matchScore}% Fit Score</span>
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
                        Apply on Portal
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
