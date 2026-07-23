'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  MessageSquare,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { BrandLogo } from '@/components/branding';

interface RecommendationGenerationExperienceProps {
  isReady?: boolean;
  onViewRecommendations?: () => void;
  onShareFeedback?: () => void;
}

const STAGES = [
  'Understanding your profile',
  'Matching your skills and projects',
  'Ranking opportunity matches',
  'Building your recommendation portfolio',
  'Writing personalized career reports',
];

const TOTAL_CARDS = 6;
const AUTO_ROTATE_MS = 9000;
const INACTIVITY_RESUME_MS = 25000;

export const RecommendationGenerationExperience: React.FC<
  RecommendationGenerationExperienceProps
> = ({ isReady = false, onViewRecommendations, onShareFeedback }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance timeline stages over 25 seconds
  useEffect(() => {
    if (isReady) {
      setCurrentStageIndex(STAGES.length);
      return;
    }

    const stageTimer = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 5000);

    return () => clearInterval(stageTimer);
  }, [isReady]);

  // Handle user interaction timeout (resumes auto-rotation after 25s of inactivity)
  const registerUserInteraction = useCallback(() => {
    setIsUserInteracted(true);

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setIsUserInteracted(false);
    }, INACTIVITY_RESUME_MS);
  }, []);

  // Auto-rotation timer (runs when user has NOT interacted manually)
  useEffect(() => {
    if (isReady || isUserInteracted) return;

    const autoTimer = setInterval(() => {
      setDirection(1);
      setCardIndex((prev) => (prev + 1) % TOTAL_CARDS);
    }, AUTO_ROTATE_MS);

    return () => clearInterval(autoTimer);
  }, [isReady, isUserInteracted]);

  // Cleanup inactivity timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    registerUserInteraction();
    setDirection(-1);
    setCardIndex((prev) => Math.max(0, prev - 1));
  }, [registerUserInteraction]);

  const handleNext = useCallback(() => {
    registerUserInteraction();
    setDirection(1);
    setCardIndex((prev) => {
      if (prev >= TOTAL_CARDS - 1) {
        // Wrap back to first card if on last card
        return 0;
      }
      return prev + 1;
    });
  }, [registerUserInteraction]);

  const handleSelectCard = useCallback(
    (index: number) => {
      registerUserInteraction();
      setDirection(index > cardIndex ? 1 : -1);
      setCardIndex(index);
    },
    [cardIndex, registerUserInteraction],
  );

  // Desktop keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger keyboard navigation if user is typing inside an input/textarea
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const handleFeedbackClick = () => {
    registerUserInteraction();
    if (onShareFeedback) {
      onShareFeedback();
    } else {
      window.open(
        'https://www.linkedin.com/in/achyut-pandey-122a87323/',
        '_blank',
        'noopener,noreferrer',
      );
    }
    setShowFeedbackSuccess(true);
    setTimeout(() => setShowFeedbackSuccess(false), 4000);
  };

  const renderCardBody = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-display font-medium text-foreground tracking-tight leading-snug">
              Opportunity hunting shouldn&apos;t feel like a second job.
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed space-y-3">
              <p>Do you constantly switch between:</p>
              <ul className="space-y-1.5 pl-3 border-l-2 border-primary/20 font-normal text-foreground/90">
                <li>• LinkedIn</li>
                <li>• Internshala</li>
                <li>• Unstop</li>
                <li>• Company career pages</li>
                <li>• Cold emails</li>
              </ul>
              <p className="italic pt-1">
                ...and still wonder whether you&apos;re missing better opportunities?
              </p>
              <p className="font-medium text-foreground pt-1">Scout was built to change that.</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-display font-medium text-foreground tracking-tight leading-snug">
              Searching isn&apos;t applying.
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed space-y-3">
              <p>
                The time spent opening dozens of tabs could be spent improving your resume,
                preparing interviews, or submitting applications.
              </p>
              <p className="font-medium text-foreground">Scout helps reduce the search.</p>
              <p className="text-primary font-medium">So you can focus on the opportunity.</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-display font-medium text-foreground tracking-tight leading-snug">
              You&apos;re probably missing opportunities.
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed space-y-3">
              <p>
                Some of the best internships and early-career programs never trend on social media.
              </p>
              <p>
                Many are posted only on company career pages, startup websites or niche communities.
              </p>
              <p className="font-medium text-foreground pt-1">
                Scout continuously looks beyond the obvious.
              </p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-display font-medium text-foreground tracking-tight leading-snug">
              Why this takes a little longer
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed space-y-3">
              <p>Every recommendation is generated specifically for you.</p>
              <ul className="space-y-1 pl-3 border-l-2 border-primary/20 text-foreground/90 font-normal">
                <li>• Your projects</li>
                <li>• Your skills</li>
                <li>• Your interests</li>
                <li>• Your career goals</li>
              </ul>
              <p className="pt-1">
                We&apos;d rather spend a few extra seconds building something genuinely useful than
                return generic recommendations.
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-display font-medium text-foreground tracking-tight leading-snug">
              A note from the founder
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed space-y-3">
              <p>
                I built Scout because I was tired of spending hours searching instead of learning.
              </p>
              <p>
                If Scout helps you discover even one opportunity you wouldn&apos;t have found
                otherwise, then it&apos;s doing exactly what it was built to do.
              </p>
              <p className="pt-1">Thank you for being one of our earliest users.</p>
              <p className="font-medium text-primary pt-1">— Achyut</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-display font-medium text-foreground tracking-tight leading-snug">
              Help shape Scout
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed space-y-3">
              <p>Scout is still evolving.</p>
              <p>Every bug report. Every suggestion. Every piece of feedback.</p>
              <p>It all directly influences what gets built next.</p>
              <p className="italic">
                If you ever think &quot;I wish Scout did this...&quot; I&apos;d genuinely love to
                hear it.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFeedbackClick}
                  className="px-4 py-2 border border-border/80 bg-background text-xs font-medium text-foreground rounded-xl hover:bg-muted/50 transition-colors inline-flex items-center gap-2 shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{showFeedbackSuccess ? 'Feedback Opened' : 'Share Feedback'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isFirstCard = cardIndex === 0;
  const isLastCard = cardIndex === TOTAL_CARDS - 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 md:p-12 select-none max-w-6xl mx-auto space-y-8">
      {/* Top Header Branding */}
      <header className="w-full flex items-center justify-between py-2 border-b border-border/40">
        <BrandLogo size="md" showWordmark={true} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Clock className="w-3.5 h-3.5 text-primary/70 animate-pulse" />
          <span>{isReady ? 'Analysis Complete' : 'Scout AI Pipeline Active'}</span>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="flex-1 flex flex-col lg:flex-row items-stretch justify-between gap-8 lg:gap-16 py-4 my-auto">
        {/* LEFT COLUMN (Persistent Anchor) */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-8 pr-0 lg:pr-4">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight leading-tight">
              Finding opportunities worth your time...
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed max-w-md">
              We&apos;re searching, ranking and personalizing opportunities based on your profile,
              projects and career goals.
            </p>
          </div>

          {/* Vertical Progress Timeline */}
          <div className="p-6 border border-border/80 bg-card/60 backdrop-blur-xs rounded-3xl space-y-4 shadow-2xs">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
              Live Recommendation Pipeline
            </h3>
            <div className="space-y-3">
              {STAGES.map((stage, idx) => {
                const isDone = isReady || idx < currentStageIndex;
                const isCurrent = !isReady && idx === currentStageIndex;

                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-3.5 text-xs sm:text-sm transition-all duration-300 ${
                      isDone
                        ? 'text-foreground font-medium'
                        : isCurrent
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground/40'
                    }`}
                  >
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-primary" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border/60 shrink-0" />
                    )}
                    <span>{isDone ? `✓ ${stage}` : isCurrent ? `○ ${stage}` : stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (User-Controlled Dynamic Card Container) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full relative">
            <AnimatePresence mode="wait">
              {isReady ? (
                /* CELEBRATION / COMPLETION STATE */
                <motion.div
                  key="ready-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full p-8 sm:p-10 border border-primary/30 bg-card rounded-3xl space-y-6 shadow-sm text-left my-auto"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight leading-tight">
                      Your personalized opportunity portfolio is ready.
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                      Scout analyzed hundreds of opportunities and selected the ones most relevant
                      to your profile.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onViewRecommendations}
                      className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground text-sm font-medium rounded-2xl hover:opacity-90 transition-all shadow-md inline-flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span>View My Recommendations</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* INTERACTIVE STORY CARD CAROUSEL */
                <motion.div
                  key={cardIndex}
                  initial={{ opacity: 0, x: direction * 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -12 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-full p-8 sm:p-10 border border-border/80 bg-card/70 backdrop-blur-sm rounded-3xl min-h-[340px] sm:min-h-[360px] flex flex-col justify-between shadow-2xs my-auto relative"
                >
                  {/* Upper-Right Corner Slide Counter */}
                  <div className="absolute top-6 right-8 text-xs font-mono text-muted-foreground/60 select-none">
                    {cardIndex + 1} / {TOTAL_CARDS}
                  </div>

                  {/* Main Story Content */}
                  <div className="pr-12 pt-1">{renderCardBody(cardIndex)}</div>

                  {/* Card Bottom Navigation Bar */}
                  <div className="pt-8 border-t border-border/40 flex items-center justify-between gap-4 mt-auto">
                    {/* Left: Previous Button */}
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={isFirstCard && isUserInteracted}
                      aria-label="Previous story"
                      className={`min-h-[44px] px-3 py-2 rounded-xl border transition-all inline-flex items-center justify-center gap-1 text-xs font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                        isFirstCard && isUserInteracted
                          ? 'border-border/40 text-muted-foreground/30 cursor-not-allowed'
                          : 'border-border/80 text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {/* Center: Interactive Progress Dots */}
                    <div
                      className="flex items-center gap-1.5"
                      role="tablist"
                      aria-label="Story progress"
                    >
                      {Array.from({ length: TOTAL_CARDS }).map((_, idx) => {
                        const isActive = idx === cardIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={`Go to story ${idx + 1}`}
                            onClick={() => handleSelectCard(idx)}
                            className={`min-h-[36px] min-w-[16px] flex items-center justify-center rounded-full transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary`}
                          >
                            <span
                              className={`block rounded-full transition-all duration-300 ${
                                isActive
                                  ? 'w-6 h-2 bg-primary shadow-2xs'
                                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Right: Next / Ready CTA Button */}
                    {isReady ? (
                      <button
                        type="button"
                        onClick={onViewRecommendations}
                        aria-label="View My Recommendations"
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all shadow-sm inline-flex items-center justify-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary animate-bounce-subtle"
                      >
                        <span>View My Recommendations</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isLastCard ? (
                      <button
                        type="button"
                        onClick={() => handleSelectCard(0)}
                        aria-label="Back to first story"
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-border/80 text-foreground hover:bg-muted/50 text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Back to first</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Next story"
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-border/80 text-foreground hover:bg-muted/50 text-xs font-medium transition-all inline-flex items-center justify-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-[11px] text-muted-foreground/60 font-light border-t border-border/40">
        © {new Date().getFullYear()} Scout Opportunity Intelligence. Built for ambitious students.
      </footer>
    </div>
  );
};
