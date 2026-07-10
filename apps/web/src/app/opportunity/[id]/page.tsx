'use client';

import React, { useState } from 'react';
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
import { mockOpportunities } from '@/lib/mock';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  CheckSquare,
  Target,
  AlertCircle,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const oppId = params.id as string;
  const opportunity = mockOpportunities.find((o) => o.id === oppId);

  const loadingMessages = [
    'Finding opportunity details...',
    'Verifying eligibility profiles...',
    'Formulating match explanation...',
    'Ready.',
  ];

  if (!opportunity) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card className="text-center p-12 max-w-md mx-auto space-y-4">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
            <Typography variant="heading-m">Opportunity Not Found</Typography>
            <Typography variant="body" className="text-secondary/70">
              The opportunity you are looking for does not exist or has been removed.
            </Typography>
            <Button variant="primary" onClick={() => router.push(ROUTES.DASHBOARD)}>
              Go Back Home
            </Button>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0B0C0E]">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={300}
            onComplete={() => setLoading(false)}
          />
        </div>
      ) : (
        <DashboardLayout>
          <PageTransition>
            <Stack gap="lg" className="max-w-5xl mx-auto space-y-8">
              {/* Back Action button */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(ROUTES.DASHBOARD)}
                  iconLeft={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Opportunities
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
                        <MatchScore score={opportunity.matchScore} />
                        {opportunity.isWomenOnly && (
                          <OpportunityBadge label="Women Preferred" variant="women-only" />
                        )}
                        {opportunity.stipend && (
                          <OpportunityBadge label={opportunity.stipend} variant="stipend" />
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
                          className="text-secondary/80 font-light leading-relaxed"
                        >
                          {opportunity.about}
                        </Typography>
                      </div>

                      {/* Eligibility details */}
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

                      {/* Program Benefits */}
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

                      {/* Application requirements */}
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

                      {/* Action links footer */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-border/40">
                        <div className="flex items-center gap-2 text-xs text-secondary/65">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Deadline:{' '}
                            <span className="font-medium text-foreground">
                              {opportunity.deadline}
                            </span>
                          </span>
                        </div>
                        <a
                          href={opportunity.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 text-xs font-medium text-primary hover:underline"
                        >
                          <span>Visit original source portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
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
                          Your profile shows high alignment with Google and Qualcomm ecosystems.
                          Scout detected strong overlaps in technical tags and academic milestone
                          requirements.
                        </p>
                      </div>

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
                          <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Academic excellence fits criteria</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Strong programming base</span>
                          </div>
                        </div>
                      </div>

                      <Divider />

                      {/* Section: Challenges */}
                      <div className="space-y-2">
                        <Typography
                          variant="label"
                          className="text-[10px] text-foreground/80 tracking-widest uppercase font-medium"
                        >
                          Possible Challenges
                        </Typography>
                        <div className="flex items-start gap-2 text-xs text-secondary/80 font-light">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>High volume of applications anticipated this week</span>
                        </div>
                      </div>

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
                            <span>Highlight open source commits in CV</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>Ask for a recommendation letter early</span>
                          </div>
                        </div>
                      </div>

                      <Divider />

                      {/* Section: Estimated Fit */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary/70 font-light">
                          Estimated compatibility
                        </span>
                        <span className="font-semibold text-primary">
                          {opportunity.matchScore}% Fit Score
                        </span>
                      </div>

                      <Button
                        variant="primary"
                        className="w-full justify-center pt-3"
                        onClick={() => window.open(opportunity.sourceUrl, '_blank')}
                        iconRight={<ExternalLink className="w-3.5 h-3.5" />}
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
      )}
    </ProtectedRoute>
  );
}
