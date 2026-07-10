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
} from '@/components/ui';
import { MatchScore, OpportunityBadge } from '@/components/opportunity';
import { mockOpportunities } from '@/lib/mock';
import { ArrowLeft, Calendar, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={300}
            onComplete={() => setLoading(false)}
          />
        </div>
      ) : (
        <DashboardLayout>
          <Stack gap="lg">
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
            <Grid cols={1} colsMd={12} gap="lg" className="items-start">
              {/* Left Column: Core Description & Details (8 cols) */}
              <div className="md:col-span-8 space-y-8">
                <Card>
                  <CardContent className="p-8 md:p-10 space-y-6">
                    {/* Upper details segment */}
                    <div className="space-y-3">
                      <Typography
                        variant="caption"
                        className="text-secondary/70 tracking-wide uppercase font-medium"
                      >
                        {opportunity.organization}
                      </Typography>
                      <Typography
                        variant="hero"
                        className="text-2xl md:text-4xl font-normal leading-tight"
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
                        What you get (Benefits)
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
                      <ul className="space-y-2 list-disc pl-5 text-sm font-light text-secondary/80 leading-relaxed">
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

              {/* Right Column: Scout Recommendation sidebar (4 cols) */}
              <div className="md:col-span-4 space-y-6">
                <Card className="border border-primary/20 bg-primary/[0.01]">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <Stack gap="xxs">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Sparkles className="w-4 h-4" />
                        <Typography variant="label" className="text-[10px] text-primary">
                          Scout Analysis
                        </Typography>
                      </div>
                      <CardTitle className="text-base font-medium">Why you match</CardTitle>
                    </Stack>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary/70 font-light">Skills Alignment</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          High Match
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary/70 font-light">Location Match</span>
                        <span className="font-semibold text-foreground">
                          {opportunity.tags.includes('Remote') ? 'Remote (100%)' : 'India'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-secondary/70 font-light">Confidence Level</span>
                        <span className="font-semibold text-primary">
                          {opportunity.matchScore}%
                        </span>
                      </div>
                    </div>

                    <Divider />

                    <div className="space-y-3 text-xs md:text-sm font-light text-secondary/80 leading-relaxed">
                      <p>✓ Your core tags match directly with Google/Qualcomm technologies.</p>
                      <p>
                        ✓ Target audience criteria specifically match a final year university
                        profile.
                      </p>
                      {opportunity.isWomenOnly && (
                        <p>
                          ✓ Gender diversity initiatives apply positive weight to this opportunity.
                        </p>
                      )}
                    </div>

                    <Divider />

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => window.open(opportunity.sourceUrl, '_blank')}
                      iconRight={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      Apply on Google Form
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </Grid>
          </Stack>
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
