'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Container,
  Section,
  Button,
  OrigamiDecoration,
  ScoutOpeningSequence,
  Typography,
  Grid,
  Stack,
} from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeToggle } from '@/components/theme-toggle';
import { ROUTES } from '@/lib/constants/routes';
import { ArrowRight, ChevronDown } from 'lucide-react';

export default function Home() {
  const { user, signIn, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Check session storage to only play splash once per browser session
  useEffect(() => {
    const played = sessionStorage.getItem('scout-splash-played');
    if (played === 'true') {
      setShowSplash(false);
    }
  }, []);

  // Monitor scroll for nav header background transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showSplash]);

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
    return <ScoutOpeningSequence onComplete={handleSplashComplete} />;
  }

  // Animation variants: elegant 8px lift and fade
  const fadeUp = {
    hidden: { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
    visible: {
      opacity: 1,
      transform: 'translate3d(0, 0, 0)',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const staggeredContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.25 },
    },
  };

  const floatingWallTags = [
    'Google',
    'Microsoft',
    'UN Women',
    'Adobe',
    'NASA',
    'Research',
    'Scholarships',
    'Hackathons',
    'Fellowships',
    'Internships',
    'Remote Jobs',
  ];

  return (
    <AppLayout showAccents={true}>
      {/* Navigation Header */}
      <header
        className={`sticky top-0 w-full z-50 transition-all duration-200 border-b select-none ${
          scrolled
            ? 'bg-background border-border/80 shadow-sm'
            : 'bg-transparent border-transparent'
        }`}
      >
        <Container size="xl" className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={handleCTA} loading={loading}>
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Button>
          </div>
        </Container>
      </header>

      {/* HERO SECTION - Viewport height, whitespace driven */}
      <Section
        size="lg"
        className="relative min-h-[90vh] flex flex-col justify-center items-center overflow-hidden py-20"
      >
        {/* Subtle background crane decoration (6-8% opacity) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.07] dark:opacity-[0.04] select-none -z-10">
          <OrigamiDecoration
            name="crane"
            size={360}
            floating
            floatingOffset={8}
            floatingDuration={9}
          />
        </div>

        <Container size="lg" className="text-center space-y-10 relative z-10">
          <motion.div
            variants={staggeredContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.1] font-sans"
            >
              Opportunities don&apos;t find everyone. <br />
              <span className="font-serif italic text-primary font-normal">
                Scout makes sure they find you.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base md:text-xl text-secondary max-w-xl mx-auto font-light leading-relaxed"
            >
              Scout searches, analyzes, and matches opportunities in the background. Curated and
              direct.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={handleCTA}
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Start your journey
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                const target = document.getElementById('problem-section');
                target?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See how Scout works
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* SECTION 1: THE PROBLEM - Almost empty viewport, staggered typography fades */}
      <Section
        id="problem-section"
        size="lg"
        className="min-h-[85vh] flex flex-col justify-center bg-card/25 border-y border-border/40 py-24 relative overflow-hidden"
      >
        <Container size="md" className="text-center">
          <motion.div
            variants={staggeredContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-6 md:space-y-8"
          >
            <motion.p variants={fadeUp} className="text-2xl md:text-4xl font-light text-secondary">
              Millions of scholarships...
            </motion.p>
            <motion.p variants={fadeUp} className="text-2xl md:text-4xl font-light text-secondary">
              Thousands of fellowships...
            </motion.p>
            <motion.p variants={fadeUp} className="text-2xl md:text-4xl font-light text-secondary">
              Countless internships...
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="text-3xl md:text-5xl font-semibold text-foreground font-serif pt-4"
            >
              Most women never hear about them.
            </motion.p>
          </motion.div>
        </Container>
      </Section>

      {/* SECTION 2: HOW SCOUT WORKS - Four generous editorial blocks */}
      <Section id="engine-section" size="lg" className="py-28 md:py-36">
        <Container size="lg" className="space-y-24">
          <div className="text-center space-y-2 select-none">
            <Typography
              variant="label"
              className="text-primary tracking-widest text-[10px] uppercase font-semibold"
            >
              The Engine
            </Typography>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground font-sans">
              How Scout Works
            </h2>
          </div>

          <Grid cols={1} colsMd={2} gap="xl" className="max-w-4xl mx-auto gap-y-16">
            {/* Block 1: Discover */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-primary font-semibold tracking-widest uppercase block">
                  01 / DISCOVER
                </span>
                <h3 className="text-2xl md:text-3xl font-normal text-foreground font-sans">
                  Continuous Crawling
                </h3>
                <p className="text-sm md:text-base text-secondary font-light leading-relaxed">
                  Scout continuously scans hundreds of global source portals, databases, and
                  university repositories.
                </p>
              </div>
              <div className="pt-4 opacity-30 select-none">
                <OrigamiDecoration
                  name="paper_airplane"
                  size={60}
                  floating
                  floatingOffset={4}
                  floatingDuration={7}
                />
              </div>
            </motion.div>

            {/* Block 2: Analyze */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-primary font-semibold tracking-widest uppercase block">
                  02 / ANALYZE
                </span>
                <h3 className="text-2xl md:text-3xl font-normal text-foreground font-sans">
                  Eligibility Extraction
                </h3>
                <p className="text-sm md:text-base text-secondary font-light leading-relaxed">
                  We parse complex application documents, requirements, benefits, and timelines into
                  structured indexes.
                </p>
              </div>
              <div className="pt-4 opacity-30 select-none">
                <OrigamiDecoration
                  name="blooming_seed"
                  size={60}
                  floating
                  floatingOffset={3}
                  floatingDuration={5}
                />
              </div>
            </motion.div>

            {/* Block 3: Match */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-primary font-semibold tracking-widest uppercase block">
                  03 / MATCH
                </span>
                <h3 className="text-2xl md:text-3xl font-normal text-foreground font-sans">
                  Profile Compatibility
                </h3>
                <p className="text-sm md:text-base text-secondary font-light leading-relaxed">
                  Scout evaluates your interests, skills, and goals to compute a compatibility
                  relevance match score.
                </p>
              </div>
              <div className="pt-4 opacity-30 select-none">
                <OrigamiDecoration
                  name="dreams_bird"
                  size={60}
                  floating
                  floatingOffset={5}
                  floatingDuration={6}
                />
              </div>
            </motion.div>

            {/* Block 4: Notify */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-primary font-semibold tracking-widest uppercase block">
                  04 / NOTIFY
                </span>
                <h3 className="text-2xl md:text-3xl font-normal text-foreground font-sans">
                  Personalized Summaries
                </h3>
                <p className="text-sm md:text-base text-secondary font-light leading-relaxed">
                  Receive clean, structured summaries and recommendations without advertisement spam
                  or clutter.
                </p>
              </div>
              <div className="pt-4 opacity-30 select-none">
                <OrigamiDecoration
                  name="envelope"
                  size={60}
                  floating
                  floatingOffset={4}
                  floatingDuration={8}
                />
              </div>
            </motion.div>
          </Grid>
        </Container>
      </Section>

      {/* SECTION 3: WHAT SCOUT FINDS - Floating editorial wall */}
      <Section size="md" className="bg-card/25 border-y border-border/40 py-24">
        <Container size="lg" className="space-y-16">
          <div className="text-center space-y-2 select-none">
            <Typography
              variant="label"
              className="text-primary tracking-widest text-[10px] uppercase font-semibold"
            >
              The Scope
            </Typography>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground font-sans">
              What Scout Finds
            </h2>
          </div>

          {/* Organic spacing floating tag wall */}
          <motion.div
            variants={staggeredContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto px-4"
          >
            {floatingWallTags.map((tag, idx) => {
              // Create slight organic rotation tilts
              const rotation = ((idx % 3) - 1) * 2; // -2, 0, or 2 degrees
              return (
                <motion.div
                  key={tag}
                  variants={fadeUp}
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="px-6 py-3.5 rounded-full border border-border bg-card shadow-sm text-sm font-medium tracking-wide hover:scale-105 hover:bg-accent/40 transition-all select-none"
                >
                  {tag}
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </Section>

      {/* SECTION 4: WHY SCOUT EXISTS - Large emotional typography */}
      <Section size="lg" className="py-28 md:py-36 relative overflow-hidden">
        {/* Subtle lotus background */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] dark:opacity-[0.02] select-none -z-10">
          <OrigamiDecoration
            name="lotus"
            size={280}
            floating
            floatingOffset={6}
            floatingDuration={10}
          />
        </div>

        <Container size="md" className="text-center space-y-8 relative z-10">
          <motion.div
            variants={staggeredContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl font-light text-foreground leading-[1.25] font-sans"
            >
              Talent is universal. <br />
              <span className="font-serif italic text-primary font-normal">
                Opportunity isn&apos;t.
              </span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-sm md:text-base text-secondary max-w-md mx-auto font-light leading-relaxed pt-2"
            >
              Scout exists to reduce that gap. To ensure high-quality matching alerts reach
              everyone, regardless of network connections.
            </motion.p>
          </motion.div>
        </Container>
      </Section>

      {/* SECTION 5: TRUST - Live intelligence metrics */}
      <Section size="md" className="bg-card/25 border-y border-border/40 py-24 select-none">
        <Container size="lg" className="space-y-16">
          <div className="text-center space-y-2">
            <Typography
              variant="label"
              className="text-primary tracking-widest text-[10px] uppercase font-semibold"
            >
              Live Monitor
            </Typography>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground font-sans">
              System Scale
            </h2>
          </div>

          <Grid cols={2} colsMd={4} gap="xl" className="max-w-4xl mx-auto text-center">
            <div className="space-y-1">
              <span className="text-4xl md:text-6xl font-light text-foreground font-sans block">
                413+
              </span>
              <span className="text-[10px] text-secondary/60 uppercase tracking-widest block font-medium">
                Sources Monitored
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-4xl md:text-6xl font-light text-foreground font-sans block">
                2,314+
              </span>
              <span className="text-[10px] text-secondary/60 uppercase tracking-widest block font-medium">
                Opportunities Reviewed
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-4xl md:text-6xl font-light text-foreground font-sans block">
                11
              </span>
              <span className="text-[10px] text-secondary/60 uppercase tracking-widest block font-medium">
                Matches Found Today
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-4xl md:text-6xl font-light text-foreground font-sans block">
                24/7
              </span>
              <span className="text-[10px] text-secondary/60 uppercase tracking-widest block font-medium">
                Continuous Scans
              </span>
            </div>
          </Grid>
        </Container>
      </Section>

      {/* FINAL CTA - Large whitespace, clean buttons */}
      <Section
        size="lg"
        className="py-32 relative overflow-hidden flex flex-col justify-center items-center"
      >
        {/* Butterfly decoration */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] dark:opacity-[0.02] select-none -z-10">
          <OrigamiDecoration
            name="butterfly"
            size={240}
            floating
            floatingOffset={5}
            floatingDuration={8}
          />
        </div>

        <Container size="md" className="text-center space-y-10 relative z-10">
          <motion.div
            variants={staggeredContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-7xl font-semibold tracking-tight text-foreground font-sans"
            >
              Stop searching. <br />
              <span className="font-serif italic text-primary font-normal">Start discovering.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={handleCTA}
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Begin with Scout
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                const target = document.getElementById('problem-section');
                target?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn more
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* EDITORIAL FOOTER */}
      <footer className="w-full border-t border-border/80 py-12 bg-card text-xs text-secondary/60 select-none">
        <Container
          size="xl"
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground font-sans">
              Scout
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] uppercase tracking-widest">
            <a href="/" className="hover:text-foreground transition-colors">
              Navigation
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>

          <span className="text-[10px] tracking-widest uppercase">ZenKai Ecosystem</span>
        </Container>
      </footer>
    </AppLayout>
  );
}
