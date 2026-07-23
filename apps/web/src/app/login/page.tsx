'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Container,
  Card,
  CardContent,
  Button,
  TextInput,
  Typography,
  Stack,
  PageTransition,
  OrigamiDecoration,
} from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { track } from '@/lib/analytics';
import { ROUTES } from '@/lib/constants/routes';
import { useBackendStatus } from '@/context/backend-status-context';
import { BackendReadinessBanner } from '@/components/common/BackendReadinessBanner';
import { Mail, Lock, ShieldAlert, ArrowRight, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signInAsGuest, loading: authLoading } = useAuth();
  const { isReady } = useBackendStatus();
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      track('login_completed', { provider: 'email', guest: false });
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      track('login_completed', { provider: 'google', guest: false });
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      console.error(err);
      setError('Failed to authenticate with Google. Please retry.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError(null);
    try {
      await signInAsGuest();
      track('login_completed', { provider: 'guest', guest: true });
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      console.error(err);
      setError('Unable to log in as Guest. Please verify server connection.');
    } finally {
      setGuestLoading(false);
    }
  };

  const isAnyLoading = authLoading || submitting || guestLoading || googleLoading || !isReady;

  return (
    <AppLayout showAccents={true}>
      <BackendReadinessBanner />
      <Container
        size="sm"
        className="min-h-[85vh] flex flex-col justify-center items-center py-12 relative"
      >
        {/* Crane background decoration */}
        <div className="absolute right-0 top-1/4 opacity-[0.04] dark:opacity-[0.02] pointer-events-none select-none">
          <OrigamiDecoration name="crane" size={240} floating />
        </div>

        <div className="w-full">
          <PageTransition>
            <Card className="border border-border/50 max-w-md w-full mx-auto bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
              <CardContent className="p-8 md:p-10 space-y-8">
                {/* Header Title */}
                <div className="text-center space-y-2">
                  <Typography
                    variant="label"
                    className="text-primary tracking-widest text-[10px] uppercase font-semibold block"
                  >
                    Welcome back
                  </Typography>
                  <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground font-sans">
                    Sign in to Scout
                  </h1>
                  <p className="text-xs text-secondary/60 font-light max-w-xs mx-auto">
                    Access your opportunity intelligence feed and matched options.
                  </p>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl border border-rose-200/50 bg-rose-50/20 dark:bg-rose-950/10 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <Typography
                      variant="body"
                      className="text-xs text-rose-600 dark:text-rose-400 font-light leading-relaxed"
                    >
                      {error}
                    </Typography>
                  </div>
                )}

                {/* Form Input fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <TextInput
                    label="Email Address"
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    disabled={isAnyLoading}
                  />
                  <TextInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    disabled={isAnyLoading}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center pt-3"
                    loading={submitting}
                    disabled={isAnyLoading}
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    {!isReady ? 'Starting...' : 'Continue with Email'}
                  </Button>
                </form>

                {/* Divider option */}
                <div className="relative flex items-center justify-center select-none py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60"></div>
                  </div>
                  <span className="relative px-3 text-[10px] text-secondary/40 uppercase tracking-widest bg-card">
                    or explore another way
                  </span>
                </div>

                {/* Alternative Auth buttons */}
                <Stack gap="xs" className="w-full">
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={handleGoogleLogin}
                    loading={googleLoading}
                    disabled={isAnyLoading}
                  >
                    Sign in with Google
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-center hover:bg-accent/40"
                    onClick={handleGuestLogin}
                    loading={guestLoading}
                    disabled={isAnyLoading}
                  >
                    Explore as Guest
                  </Button>
                </Stack>

                {/* Registration Prompt */}
                <div className="text-center text-xs text-secondary/70 font-light select-none pt-2 border-t border-border/30">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push(ROUTES.SIGNUP)}
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1 ml-0.5"
                    disabled={isAnyLoading}
                  >
                    <span>Register here</span>
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </PageTransition>
        </div>
      </Container>
    </AppLayout>
  );
}
