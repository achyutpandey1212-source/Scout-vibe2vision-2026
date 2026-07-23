'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Container,
  Card,
  CardContent,
  Button,
  Typography,
  Stack,
  PageTransition,
  OrigamiDecoration,
} from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROUTES } from '@/lib/constants/routes';
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function VerifyEmailPage() {
  const {
    firebaseUser,
    user,
    sendVerificationEmail,
    reloadUser,
    signOut,
    loading: authLoading,
  } = useAuth();
  const router = useRouter();

  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Target email address display
  const targetEmail = firebaseUser?.email || user?.email || 'your email inbox';

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Resend Verification Email
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    try {
      setResending(true);
      setMessage(null);
      await sendVerificationEmail();
      setCooldown(60);
      setMessage({
        type: 'success',
        text: 'A new verification link has been sent to your email inbox.',
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err?.message || 'Failed to resend verification email. Please try again shortly.',
      });
    } finally {
      setResending(false);
    }
  };

  // Handle "I've Verified My Email" reload check
  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      setMessage(null);
      const reloadedFbUser = await reloadUser();

      if (reloadedFbUser?.emailVerified) {
        setMessage({
          type: 'success',
          text: 'Email verified successfully! Redirecting to Scout...',
        });
        setTimeout(() => {
          if (user?.onboardingCompleted) {
            router.push(ROUTES.DASHBOARD);
          } else {
            router.push(ROUTES.ONBOARDING);
          }
        }, 1200);
      } else {
        setMessage({
          type: 'info',
          text: 'Your email is not verified yet. Please check your inbox (and spam folder), click the link, and try again.',
        });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Unable to refresh verification status. Please try again.',
      });
    } finally {
      setChecking(false);
    }
  };

  // Handle Back to Login / Sign out
  const handleBackToLogin = async () => {
    try {
      await signOut();
      router.push(ROUTES.LOGIN);
    } catch (err) {
      router.push(ROUTES.LOGIN);
    }
  };

  const isAnyLoading = authLoading || resending || checking;

  return (
    <AppLayout showAccents={true}>
      <Container
        size="sm"
        className="min-h-[85vh] flex flex-col justify-center items-center py-12 relative select-none"
      >
        <div className="w-full">
          <PageTransition>
            <Card className="border border-border/50 max-w-md w-full mx-auto bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
              <CardContent className="p-8 md:p-10 space-y-8">
                {/* Icon & Header Title */}
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <Typography
                      variant="label"
                      className="text-primary tracking-widest text-[10px] uppercase font-semibold block"
                    >
                      Email Verification Required
                    </Typography>
                    <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground font-sans">
                      Verify your email
                    </h1>
                    <p className="text-xs text-secondary/70 font-light max-w-xs mx-auto leading-relaxed">
                      We&apos;ve sent a verification email to{' '}
                      <strong className="font-mono text-foreground font-medium">
                        {targetEmail}
                      </strong>
                      . Please verify your email before continuing to Scout.
                    </p>

                    <div className="p-3.5 rounded-2xl bg-secondary/5 border border-border/40 text-left max-w-xs mx-auto space-y-1.5 text-[11px] text-secondary/80 font-light leading-relaxed">
                      <span className="font-medium text-foreground text-xs block">
                        Can&apos;t find it?
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-secondary/70">
                        <li>Check your Spam or Promotions folder.</li>
                        <li>It may take up to a minute to arrive.</li>
                        <li>You can resend it after the countdown finishes.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Banner Notifications */}
                {message && (
                  <div
                    className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed font-light ${
                      message.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : message.type === 'error'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : message.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <Stack gap="sm" className="w-full">
                  <Button
                    variant="primary"
                    className="w-full justify-center py-3"
                    onClick={handleCheckStatus}
                    loading={checking}
                    disabled={isAnyLoading}
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    I&apos;ve Verified My Email
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full justify-center py-2.5"
                    onClick={handleResend}
                    loading={resending}
                    disabled={isAnyLoading || cooldown > 0}
                    iconLeft={
                      cooldown > 0 ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )
                    }
                  >
                    {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Verification Email'}
                  </Button>
                </Stack>

                {/* Back to Login Footer Action */}
                <div className="text-center text-xs text-secondary/70 font-light select-none pt-4 border-t border-border/30">
                  Wrong email address or want to sign in with another account?{' '}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1.5 ml-1"
                    disabled={isAnyLoading}
                  >
                    <span>Back to Login</span>
                    <LogOut className="w-3.5 h-3.5" />
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
