'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Typography,
  Container,
  Section,
  Stack,
  Grid,
  Button,
  OrigamiDecoration,
  SplashExperience,
  fadeVariants,
  slideUpVariants,
} from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROUTES } from '@/lib/constants/routes';
import { ArrowRight, Sparkles, Target, Compass, Award } from 'lucide-react';

export default function Home() {
  const { user, signIn, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  // Check session storage to only play splash once per browser session
  useEffect(() => {
    const hasPlayedSplash = sessionStorage.getItem('scout-splash-played');
    if (hasPlayedSplash === 'true') {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('scout-splash-played', 'true');
    setShowSplash(false);
  };

  const handleCTA = () => {
    if (user) {
      router.push(ROUTES.DASHBOARD);
    } else {
      signIn().then(() => {
        router.push(ROUTES.DASHBOARD);
      });
    }
  };

  if (showSplash) {
    return <SplashExperience onComplete={handleSplashComplete} />;
  }

  return (
    <AppLayout showAccents={true}>
      {/* Navigation Header */}
      <header className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40 select-none">
        <Container size="xl" className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-6.5 h-6.5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-lg font-medium tracking-tight font-sans">Scout</span>
          </div>

          <Button variant="secondary" size="sm" onClick={handleCTA} loading={loading}>
            {user ? 'Go to Dashboard' : 'Get Started'}
          </Button>
        </Container>
      </header>

      {/* Hero Section */}
      <Section
        size="md"
        className="relative flex flex-col justify-center items-center overflow-hidden"
      >
        <Container size="lg" className="text-center space-y-8 relative z-10">
          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-secondary/90 tracking-wide uppercase font-medium">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Opportunity Intelligence Companion</span>
            </div>

            <Typography variant="display">
              Opportunities found <br />
              <span className="font-normal text-primary">while you sleep.</span>
            </Typography>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-base md:text-xl text-secondary max-w-xl mx-auto font-light leading-relaxed"
          >
            Scout continuously searches the web, analyzes criteria, matches skills, and provides
            personalized daily summaries. Calm, quiet, and direct.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="pt-4"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={handleCTA}
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {user ? 'Open Dashboard' : 'Continue with Google'}
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* Mission Section */}
      <Section size="sm" className="bg-card/40 border-y border-border/40 py-16 md:py-24">
        <Container size="md" className="text-center space-y-6">
          <Typography variant="label" className="text-primary tracking-widest text-[10px]">
            Our Mission
          </Typography>
          <Typography variant="heading-l" className="font-light max-w-2xl mx-auto leading-relaxed">
            {'"Talent shouldn\'t depend on who you know."'}
          </Typography>
          <Typography variant="body" className="text-secondary/70 max-w-xl mx-auto font-light">
            Scout is built specifically for women—not just in tech, and not just in college. Whether
            you are a student, a homemaker restarting your career, or a freelancer, Scout is here to
            help you notice what is possible.
          </Typography>
        </Container>
      </Section>

      {/* How Scout Works Section */}
      <Section size="md">
        <Container size="lg" className="space-y-12">
          <div className="text-center space-y-2">
            <Typography variant="label" className="text-primary tracking-widest text-[10px]">
              The Engine
            </Typography>
            <Typography variant="heading-l" className="font-normal">
              How Scout Works
            </Typography>
          </div>

          <Grid cols={1} colsMd={3} gap="lg">
            <Stack gap="sm" className="p-6 border border-border/60 rounded-3xl bg-card">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Compass className="w-5 h-5" />
              </div>
              <Typography variant="heading-s" className="font-medium">
                1. Discover
              </Typography>
              <Typography variant="body" className="text-secondary/70 font-light">
                Scout searches hundreds of trusted opportunity portals, scholarships, fellowships,
                and grants continuously in the background.
              </Typography>
            </Stack>

            <Stack gap="sm" className="p-6 border border-border/60 rounded-3xl bg-card">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Target className="w-5 h-5" />
              </div>
              <Typography variant="heading-s" className="font-medium">
                2. Understand
              </Typography>
              <Typography variant="body" className="text-secondary/70 font-light">
                Our parsing engine analyzes eligibility criteria, benefits, and required skills,
                aligning them directly with your aspirations profile.
              </Typography>
            </Stack>

            <Stack gap="sm" className="p-6 border border-border/60 rounded-3xl bg-card">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Award className="w-5 h-5" />
              </div>
              <Typography variant="heading-s" className="font-medium">
                3. Apply & Grow
              </Typography>
              <Typography variant="body" className="text-secondary/70 font-light">
                Receive curated daily match recommendations showing why they fit. Bookmark what
                matters and track your application progress.
              </Typography>
            </Stack>
          </Grid>
        </Container>
      </Section>

      {/* Why Scout Exists Section */}
      <Section size="md" className="bg-card/30 border-t border-border/40 py-20">
        <Container size="lg">
          <Grid cols={1} colsMd={12} gap="lg" className="items-center">
            <div className="md:col-span-7 space-y-6">
              <Typography variant="label" className="text-primary tracking-widest text-[10px]">
                Product Philosophy
              </Typography>
              <Typography variant="heading-xl" className="font-light">
                A quiet, premium space built to support your journey.
              </Typography>
              <Typography variant="body" className="text-secondary/80 font-light leading-relaxed">
                Most modern networks compete for attention and trigger anxiety. Scout is built to be
                a calm space of quiet intelligence. No advertisements, no gamification, and no
                notification spam. We respect your attention and focus.
              </Typography>
            </div>
            <div className="md:col-span-5 flex justify-center">
              <OrigamiDecoration
                name="dreams_bird"
                size={180}
                floating
                floatingOffset={10}
                floatingDuration={7}
              />
            </div>
          </Grid>
        </Container>
      </Section>

      {/* Testimonials Section */}
      <Section size="sm" className="pb-24 border-t border-border/40 pt-16">
        <Container size="lg" className="space-y-12">
          <div className="text-center space-y-2">
            <Typography variant="label" className="text-primary tracking-widest text-[10px]">
              Community Voices
            </Typography>
            <Typography variant="heading-l" className="font-normal">
              Empowering Aspirations
            </Typography>
          </div>

          <Grid cols={1} colsMd={2} gap="lg">
            <Stack
              gap="xs"
              className="p-6 border border-border/40 rounded-3xl bg-card/60 italic font-light text-secondary/80"
            >
              <p className="leading-relaxed text-sm">
                {
                  '"Coming from a tier-3 college, I had zero network or guidance about global scholarships. Scout matched me with the Google WTM Scholar program, which literally changed my career."'
                }
              </p>
              <span className="text-xs font-medium text-foreground not-italic mt-2">
                — Ananya, ECE Graduate
              </span>
            </Stack>

            <Stack
              gap="xs"
              className="p-6 border border-border/40 rounded-3xl bg-card/60 italic font-light text-secondary/80"
            >
              <p className="leading-relaxed text-sm">
                {
                  '"After a three-year career break, restarting felt incredibly overwhelming. Scout didn\'t spam me with 500 random jobs; it quietly matched me with exactly three flexible PM fellowships."'
                }
              </p>
              <span className="text-xs font-medium text-foreground not-italic mt-2">
                — Preeti, Career Restarter
              </span>
            </Stack>
          </Grid>
        </Container>
      </Section>

      {/* Editorial Footer */}
      <footer className="w-full border-t border-border/85 py-10 bg-card text-xs text-secondary/60">
        <Container
          size="xl"
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <span>© {new Date().getFullYear()} Scout. All rights reserved.</span>
          <span className="tracking-widest uppercase text-[10px]">ZenKai Ecosystem</span>
        </Container>
      </footer>
    </AppLayout>
  );
}
