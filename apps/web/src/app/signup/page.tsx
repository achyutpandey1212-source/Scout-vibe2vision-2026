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
import { Mail, Lock, ShieldAlert, ArrowRight, UserCheck, KeyRound } from 'lucide-react';

export default function SignupPage() {
  const { signUpWithEmail, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all requested registration details.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name);
      track('signup_completed', { provider: 'email', guest: false });
      router.push(ROUTES.ONBOARDING);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create account. Email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAnyLoading = authLoading || submitting;

  return (
    <AppLayout showAccents={true}>
      <Container
        size="sm"
        className="min-h-[85vh] flex flex-col justify-center items-center py-12 relative"
      >
        {/* Butterfly background decoration */}
        <div className="absolute left-0 top-1/4 opacity-[0.04] dark:opacity-[0.02] pointer-events-none select-none">
          <OrigamiDecoration name="butterfly" size={200} floating />
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
                    Get Started
                  </Typography>
                  <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground font-sans">
                    Create your profile
                  </h1>
                  <p className="text-xs text-secondary/60 font-light max-w-xs mx-auto">
                    Sign up with email to start building your personalization match options.
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
                    label="Preferred Name"
                    placeholder="Maya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<UserCheck className="w-4 h-4" />}
                    disabled={isAnyLoading}
                  />
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
                    placeholder="Choose password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    disabled={isAnyLoading}
                  />
                  <TextInput
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<KeyRound className="w-4 h-4" />}
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
                    Create Account
                  </Button>
                </form>

                {/* Login Prompt */}
                <div className="text-center text-xs text-secondary/70 font-light select-none pt-2 border-t border-border/30">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push(ROUTES.LOGIN)}
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1 ml-0.5"
                    disabled={isAnyLoading}
                  >
                    <span>Sign in here</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
