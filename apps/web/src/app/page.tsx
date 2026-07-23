'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';
import { Container, Section, Button, Grid } from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeToggle } from '@/components/theme-toggle';
import { SourceMarquee, DashboardPreviewMockup } from '@/components/landing';
import { Brand } from '@/components/common/Brand';
import { Footer } from '@/components/layout/Footer';
import { FounderCard } from '@/components/engagement/FounderCard';
import { track } from '@/lib/analytics';
import { useScrollDepth } from '@/hooks/useScrollDepth';
import { ROUTES } from '@/lib/constants/routes';
import { opportunitiesApi, sourcesApi } from '@/lib/api';
import { ArrowRight, Compass, Sparkles, ShieldCheck } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [liveOpportunityCount, setLiveOpportunityCount] = useState<number | null>(null);
  const [liveSourceCount, setLiveSourceCount] = useState<number | null>(null);

  useScrollDepth('Landing');

  // Track landing page viewed
  useEffect(() => {
    track('landing_viewed', {
      source: 'landing_page',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      authenticated: Boolean(user),
    });
  }, [user]);

  // Splash opening sequence once per session
  useEffect(() => {
    const played = sessionStorage.getItem('scout-splash-played');
    if (played === 'true') {
      setShowSplash(false);
    }
  }, []);

  // Monitor scroll header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch live collection stats from backend APIs
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const oppRes = await opportunitiesApi.list({ limit: 1 });
        if (oppRes.data?.pagination?.total) {
          setLiveOpportunityCount(oppRes.data.pagination.total);
        } else if (Array.isArray(oppRes.data?.data)) {
          setLiveOpportunityCount(oppRes.data.data.length);
        }
      } catch {
        // Live totals are progressive enhancement; the landing page remains useful without them.
      }

      try {
        const sourceRes = await sourcesApi.getStats();
        if (sourceRes.data?.total) {
          setLiveSourceCount(sourceRes.data.total);
        } else if (Array.isArray(sourceRes.data)) {
          setLiveSourceCount(sourceRes.data.length);
        }
      } catch {
        // Live totals are progressive enhancement; the landing page remains useful without them.
      }
    };
    fetchLiveStats();
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('scout-splash-played', 'true');
    setShowSplash(false);
  };

  const handleCTA = () => {
    track('cta_clicked', {
      cta: user ? 'Go to Dashboard' : 'Get Started',
      location: 'Hero',
    });
    if (user) {
      router.push(ROUTES.DASHBOARD);
    } else {
      router.push(ROUTES.LOGIN);
    }
  };

  const scrollToHowItWorks = () => {
    const section = document.getElementById('how-scout-works');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fade up animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const staggeredContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  return (
    <AppLayout showAccents={false}>
      {/* ── 1. NAVBAR ── */}
      <header
        className={`sticky top-0 w-full z-50 transition-all duration-200 border-b select-none ${
          scrolled
            ? 'bg-background/90 backdrop-blur-md border-border/80 shadow-sm'
            : 'bg-transparent border-transparent'
        }`}
      >
        <Container size="xl" className="h-16 flex items-center justify-between">
          <Brand size="lg" href="/" />

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {!user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(ROUTES.LOGIN)}
                className="hidden sm:inline-flex text-xs"
              >
                Sign In
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleCTA} loading={loading}>
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Button>
          </div>
        </Container>
      </header>

      {/* ── 2. HERO SECTION ── */}
      <Section size="lg" className="pt-12 md:pt-20 pb-16 relative overflow-hidden">
        <Container size="lg" className="text-center space-y-12">
          <motion.div
            variants={staggeredContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6 max-w-3xl mx-auto"
          >
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-6xl md:text-7xl font-display font-medium tracking-tight text-foreground leading-[1.1]"
            >
              Discover opportunities you would&apos;ve otherwise missed.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto"
            >
              Scout continuously discovers internships, hackathons, scholarships, fellowships,
              government programs, and early-career opportunities across the web—then recommends the
              ones most relevant to you.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleCTA}
                loading={loading}
                iconRight={<ArrowRight className="w-4 h-4" />}
                className="px-8 text-base"
              >
                Get Started
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={scrollToHowItWorks}
                className="text-base font-normal text-muted-foreground hover:text-foreground"
              >
                See How Scout Works
              </Button>
            </motion.div>
          </motion.div>

          {/* REAL DASHBOARD BROWSER MOCKUP PREVIEW */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pt-4"
          >
            <DashboardPreviewMockup />
          </motion.div>
        </Container>
      </Section>

      {/* ── 3. SOURCE MARQUEE ── */}
      <SourceMarquee />

      {/* ── 4. LIVE SYSTEM STATS ── */}
      <Section size="md" className="py-20 bg-card/25 border-b border-border/40 select-none">
        <Container size="lg" className="space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Live Monitor
            </span>
            <h2 className="text-2xl md:text-4xl font-display font-medium text-foreground tracking-tight">
              Continuously updated discovery pipeline.
            </h2>
          </div>

          <Grid cols={1} colsSm={3} gap="lg" className="max-w-3xl mx-auto text-center">
            <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-2">
              <span className="text-3xl md:text-5xl font-mono font-medium text-foreground block">
                {liveOpportunityCount ? `${liveOpportunityCount}+` : '172+'}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Live Opportunities
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-2">
              <span className="text-3xl md:text-5xl font-mono font-medium text-foreground block">
                {liveSourceCount ? `${liveSourceCount}+` : '287+'}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Sources Tracked
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-2">
              <span className="text-3xl md:text-5xl font-mono font-medium text-foreground block">
                24 / 7
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Continuous Scans
              </span>
            </div>
          </Grid>
        </Container>
      </Section>

      {/* ── 5. HOW SCOUT WORKS ── */}
      <Section id="how-scout-works" size="lg" className="py-24 md:py-32">
        <Container size="lg" className="space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              The Process
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-medium text-foreground tracking-tight">
              How Scout Works
            </h2>
            <p className="text-sm md:text-base text-muted-foreground font-light max-w-lg mx-auto">
              Three simple steps to transition from endlessly searching to receiving curated
              recommendations.
            </p>
          </div>

          <Grid cols={1} colsMd={3} gap="xl" className="max-w-5xl mx-auto">
            {/* Step 1 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-8 rounded-2xl bg-card border border-border/80 space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-xs font-mono font-semibold text-primary tracking-widest uppercase block">
                  01 / DISCOVER
                </span>
                <h3 className="text-xl md:text-2xl font-medium text-foreground">Scout Discovers</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  Continuously scans trusted platforms, company career pages, and niche communities
                  for new opportunities across the web.
                </p>
              </div>
              <div className="pt-4 text-primary/40">
                <Compass className="w-8 h-8" />
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-8 rounded-2xl bg-card border border-border/80 space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-xs font-mono font-semibold text-primary tracking-widest uppercase block">
                  02 / UNDERSTAND
                </span>
                <h3 className="text-xl md:text-2xl font-medium text-foreground">
                  Scout Understands You
                </h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  Your profile and preferences help Scout evaluate compatibility, eligibility, and
                  prioritize recommendations tailored to your goals.
                </p>
              </div>
              <div className="pt-4 text-primary/40">
                <Sparkles className="w-8 h-8" />
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-8 rounded-2xl bg-card border border-border/80 space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-xs font-mono font-semibold text-primary tracking-widest uppercase block">
                  03 / APPLY
                </span>
                <h3 className="text-xl md:text-2xl font-medium text-foreground">
                  You Apply Direct
                </h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  Review structured AI insights explaining why each recommendation matches your
                  profile, then apply directly on official platform pages.
                </p>
              </div>
              <div className="pt-4 text-primary/40">
                <ShieldCheck className="w-8 h-8" />
              </div>
            </motion.div>
          </Grid>
        </Container>
      </Section>

      {/* ── 6. WHY SCOUT EXISTS (VISUALLY BALANCED COMPARISON BLOCK) ── */}
      <Section size="lg" className="py-24 bg-card/25 border-y border-border/40">
        <Container size="lg">
          <div className="max-w-3xl mx-auto text-center space-y-10">
            {/* Centered Heading Block */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Product Philosophy
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-medium text-foreground tracking-tight leading-tight">
                Finding opportunities shouldn&apos;t feel like a second job.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
                Most opportunities already exist across the web—they are simply scattered across
                dozens of platforms. Scout brings them together in one place.
              </p>
            </div>

            {/* Centered Editorial Comparison Table */}
            <div className="w-full border border-border/80 rounded-2xl overflow-hidden bg-card shadow-sm text-left">
              <div className="grid grid-cols-2 bg-muted/40 p-4 border-b border-border/60 text-xs uppercase tracking-wider font-semibold text-center">
                <span className="text-muted-foreground">Traditional Platforms</span>
                <span className="text-primary font-bold">Scout</span>
              </div>

              <div className="divide-y divide-border/60 text-xs sm:text-sm font-light">
                <div className="grid grid-cols-2 p-5 sm:p-6 gap-4 sm:gap-6 items-center">
                  <span className="text-muted-foreground">
                    Built for organizations to publish listings
                  </span>
                  <span className="text-foreground font-medium">
                    Built for students to discover opportunities
                  </span>
                </div>
                <div className="grid grid-cols-2 p-5 sm:p-6 gap-4 sm:gap-6 items-center">
                  <span className="text-muted-foreground">
                    Search across multiple sites yourself
                  </span>
                  <span className="text-foreground font-medium">
                    Discover from across the web in one place
                  </span>
                </div>
                <div className="grid grid-cols-2 p-5 sm:p-6 gap-4 sm:gap-6 items-center">
                  <span className="text-muted-foreground">Generic listings with heavy ads</span>
                  <span className="text-foreground font-medium">
                    Personalized, editorial recommendations
                  </span>
                </div>
                <div className="grid grid-cols-2 p-5 sm:p-6 gap-4 sm:gap-6 items-center">
                  <span className="text-muted-foreground">Endless manual scrolling</span>
                  <span className="text-foreground font-medium">
                    Carefully selected high-match opportunities
                  </span>
                </div>
                <div className="grid grid-cols-2 p-5 sm:p-6 gap-4 sm:gap-6 items-center">
                  <span className="text-muted-foreground">You do all the searching</span>
                  <span className="text-foreground font-medium">
                    Scout searches continuously for you
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── 7. FINAL CTA ── */}
      <Section size="lg" className="py-28 text-center space-y-8 select-none">
        <Container size="md" className="space-y-6">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-medium text-foreground tracking-tight">
            Stop searching. <br />
            <span className="font-serif italic text-primary font-normal">Start discovering.</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-light max-w-md mx-auto">
            Spend less time checking dozens of websites and more time applying to opportunities that
            move your career forward.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCTA}
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
              className="px-8 text-base"
            >
              Get Started
            </Button>
          </div>
        </Container>
      </Section>

      {/* ── 8. EDITORIAL FOOTER ── */}
      <Footer />

      {/* ── 9. FOUNDER CARD (LANDING EXCLUSIVE) ── */}
      <FounderCard />
    </AppLayout>
  );
}
