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
  Chip,
  Divider,
  PageTransition,
} from '@/components/ui';
import { mockNotifications, MockNotification } from '@/lib/mock';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { Bell, BellOff, Calendar, Check, Compass, Sparkles, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<MockNotification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'deadlines'>('all');
  const router = useRouter();

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationAction = (opportunityId?: string) => {
    if (opportunityId) {
      router.push(ROUTES.OPPORTUNITY(opportunityId));
    }
  };

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'deadlines') return n.type === 'DeadlineApproaching';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'MatchingOpportunity':
        return <Sparkles className="w-4 h-4 text-primary" />;
      case 'DeadlineApproaching':
        return <Calendar className="w-4 h-4 text-rose-500 animate-pulse" />;
      case 'HiddenGemDiscovered':
        return <Compass className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

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
                  You have {notifications.filter((n) => !n.read).length} unread updates.
                </Typography>
              </div>

              {/* Filter chips */}
              <Stack direction="row" gap="xs" align="center" wrap>
                <Chip
                  label="All Updates"
                  selected={filter === 'all'}
                  onClick={() => setFilter('all')}
                />
                <Chip
                  label="Unread Only"
                  selected={filter === 'unread'}
                  onClick={() => setFilter('unread')}
                />
                <Chip
                  label="Deadlines"
                  selected={filter === 'deadlines'}
                  onClick={() => setFilter('deadlines')}
                />
              </Stack>

              {filteredNotifications.length > 0 ? (
                <Stack gap="sm" className="w-full">
                  {filteredNotifications.map((notif) => (
                    <Card
                      key={notif.id}
                      className={`
                        transition-colors duration-200 border border-border/80
                        ${!notif.read ? 'bg-primary/[0.01] border-primary/25' : 'bg-card'}
                      `}
                    >
                      <div className="p-5 flex gap-4 items-start">
                        {/* Left Icon indicator */}
                        <div className="p-2.5 rounded-full bg-accent/20 border border-border shrink-0 mt-0.5">
                          {getIcon(notif.type)}
                        </div>

                        {/* Middle Message Details */}
                        <div className="flex-1 space-y-1 text-left min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <Typography
                              variant="heading-s"
                              className={`text-sm md:text-base ${!notif.read ? 'font-medium text-foreground' : 'font-normal text-foreground/80'}`}
                            >
                              {notif.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-[10px] text-secondary/50 shrink-0"
                            >
                              {notif.date}
                            </Typography>
                          </div>
                          <Typography
                            variant="body"
                            className="text-secondary/80 font-light text-xs md:text-sm leading-relaxed pr-8"
                          >
                            {notif.message}
                          </Typography>

                          {/* Direct navigation CTA button */}
                          {notif.opportunityId && (
                            <div className="pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs px-3 py-1.5 h-auto text-primary"
                                onClick={() => handleNotificationAction(notif.opportunityId)}
                              >
                                View Opportunity Details
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Right Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="p-2 rounded-full text-secondary/60 hover:bg-accent/40 hover:text-foreground transition-all outline-none focus:ring-2 focus:ring-primary/20"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="p-2 rounded-full text-secondary/40 hover:bg-accent/40 hover:text-destructive transition-all outline-none focus:ring-2 focus:ring-destructive/20"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Stack>
              ) : (
                // Reassuring empty alerts list
                <Card className="text-center p-12 max-w-lg mx-auto bg-card border border-border/60 rounded-3xl mt-8">
                  <CardContent className="pt-6 space-y-6 flex flex-col items-center">
                    <div className="p-3 bg-accent/20 border border-border rounded-full text-secondary/40">
                      <BellOff className="w-8 h-8" />
                    </div>
                    <Stack gap="xxs">
                      <Typography variant="heading-s" className="font-medium text-foreground">
                        All caught up!
                      </Typography>
                      <Typography
                        variant="body"
                        className="text-secondary/70 leading-relaxed max-w-sm"
                      >
                        There are no notifications matching this criteria. We will notify you when
                        new matches are found.
                      </Typography>
                    </Stack>
                    <Button variant="primary" size="sm" onClick={() => setFilter('all')}>
                      Show All Updates
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </PageTransition>
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
