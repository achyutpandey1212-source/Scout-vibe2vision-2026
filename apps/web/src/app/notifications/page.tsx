'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import {
  Typography,
  Stack,
  Card,
  CardContent,
  UniversalLoader,
  Button,
  PageTransition,
} from '@/components/ui';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { BellOff } from 'lucide-react';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadingMessages = ['Checking update streams...', 'Syncing alerts...', 'Ready.'];

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
          <PageTransition>
            <Stack gap="lg" className="w-full">
              <div className="border-b border-border/40 pb-3 flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                <Typography variant="heading-l" className="font-normal">
                  Updates & Alerts
                </Typography>
                <Typography variant="caption" className="text-secondary/60">
                  You have 0 unread alerts.
                </Typography>
              </div>

              {/* Graceful empty state as notifications are processed in the background */}
              <Card className="text-center p-12 max-w-lg mx-auto bg-card border border-border/60 rounded-3xl mt-8">
                <CardContent className="pt-6 space-y-6 flex flex-col items-center">
                  <div className="text-secondary/30 shrink-0">
                    <BellOff className="w-12 h-12 stroke-[1.2]" />
                  </div>
                  <Stack gap="xxs">
                    <Typography variant="heading-s" className="font-medium text-foreground">
                      No updates yet.
                    </Typography>
                    <Typography
                      variant="body"
                      className="text-secondary/70 leading-relaxed max-w-sm"
                    >
                      We monitor hundreds of source channels daily. As soon as a high-compatibility
                      fit is found, it will appear here.
                    </Typography>
                  </Stack>
                  <Button variant="primary" size="sm" onClick={() => router.push(ROUTES.DASHBOARD)}>
                    Go back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </PageTransition>
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
