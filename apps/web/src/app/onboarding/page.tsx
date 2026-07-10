'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, Sparkles, Check } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

// Steps setup
const TOTAL_STEPS = 16;

export default function OnboardingPage() {
  const { syncWithBackend } = useAuth();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User Intelligence Form Data
  const [formData, setFormData] = useState({
    identity: { preferredName: '' },
    situations: [] as string[],
    educationDetail: { qualification: '', college: '', course: '', graduationYear: 2026 },
    workDetail: { role: '', industry: '', experienceYears: 0 },
    whyHere: [] as string[],
    happiestDestination: '',
    magicOneProblem: '',
    timeLossActivities: [] as string[],
    discoveryChannels: [] as string[],
    biggestObstacles: [] as string[],
    readinessIllustrativeLevel: 3,
    motivatedTime: [] as string[],
    availability: { timeOfDay: [] as string[], hoursPerWeek: 10 },
    opportunityExcitement: [] as string[],
    workPreferences: [] as string[],
    companionPreferences: {
      tone: 'gentle',
      celebrationStyle: '🌸 Gentle',
      guidanceLevel: 'Recommend opportunities',
      preferredLanguage: 'English',
      reminderStyle: 'Flexible',
    },
  });

  // Fetch existing state on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/v1/profile');
        if (res.data && res.data.success) {
          const profile = res.data.data;
          // Merge defaults
          setFormData((prev) => ({
            ...prev,
            identity: { preferredName: profile.identity?.preferredName || '' },
            situations: profile.situations || [],
            educationDetail: {
              qualification: profile.educationDetail?.qualification || '',
              college: profile.educationDetail?.college || '',
              course: profile.educationDetail?.course || '',
              graduationYear: profile.educationDetail?.graduationYear || 2026,
            },
            workDetail: {
              role: profile.workDetail?.role || '',
              industry: profile.workDetail?.industry || '',
              experienceYears: profile.workDetail?.experienceYears || 0,
            },
            whyHere: profile.whyHere || [],
            happiestDestination: profile.happiestDestination || '',
            magicOneProblem: profile.magicOneProblem || '',
            timeLossActivities: profile.timeLossActivities || [],
            discoveryChannels: profile.discoveryChannels || [],
            biggestObstacles: profile.biggestObstacles || [],
            readinessIllustrativeLevel: profile.readinessIllustrativeLevel || 3,
            motivatedTime: profile.motivatedTime || [],
            availability: {
              timeOfDay: profile.availability?.timeOfDay || [],
              hoursPerWeek: profile.availability?.hoursPerWeek || 10,
            },
            opportunityExcitement: profile.opportunityExcitement || [],
            workPreferences: profile.workPreferences || [],
            companionPreferences: {
              tone: profile.companionPreferences?.tone || 'gentle',
              celebrationStyle: profile.companionPreferences?.celebrationStyle || '🌸 Gentle',
              guidanceLevel:
                profile.companionPreferences?.guidanceLevel || 'Recommend opportunities',
              preferredLanguage: profile.companionPreferences?.preferredLanguage || 'English',
              reminderStyle: profile.companionPreferences?.reminderStyle || 'Flexible',
            },
          }));
          if (profile.onboarding?.currentStep) {
            setStep(profile.onboarding.currentStep);
          }
        }
      } catch (err) {
        console.error('Failed to load onboarding profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Autosave when transitioning steps
  const saveProgress = async (nextStep: number) => {
    setSaving(true);
    try {
      await api.post('/api/v1/profile', {
        ...formData,
        onboarding: {
          currentStep: nextStep,
          completed: false,
        },
      });
    } catch (err) {
      console.error('Autosave failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // Navigations
  const handleNext = async () => {
    let nextStep = step + 1;

    // Check branching: Skip step 4 (Education & Work) if not applicable
    if (step === 3) {
      const isStudying = formData.situations.includes("🌸 I'm studying right now");
      const isWorking = formData.situations.includes("💼 I'm already working");
      if (!isStudying && !isWorking) {
        nextStep = 5; // skip details
      }
    }

    if (nextStep <= TOTAL_STEPS) {
      setStep(nextStep);
      await saveProgress(nextStep);
    }
  };

  const handleBack = async () => {
    let prevStep = step - 1;

    // Check branching: Skip step 4 on going backward
    if (step === 5) {
      const isStudying = formData.situations.includes("🌸 I'm studying right now");
      const isWorking = formData.situations.includes("💼 I'm already working");
      if (!isStudying && !isWorking) {
        prevStep = 3;
      }
    }

    if (prevStep >= 1) {
      setStep(prevStep);
      await saveProgress(prevStep);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save final state
      await api.post('/api/v1/profile', formData);
      // Mark onboarding complete
      await api.post('/api/v1/profile/onboarding/complete');
      // Sync auth context
      await syncWithBackend();
      router.replace('/dashboard');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setSaving(false);
    }
  };

  // Multiple Choice Helpers
  const toggleArrayItem = (fieldName: keyof typeof formData, item: string) => {
    setFormData((prev) => {
      const current = prev[fieldName] as string[];
      const updated = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item];
      return { ...prev, [fieldName]: updated };
    });
  };

  // Framer Motion Animation Config
  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-light text-secondary tracking-wide">
          Loading your memory...
        </span>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans relative pb-24">
        {/* Progress Bar Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur z-20 w-full p-4 border-b border-border">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-light text-secondary">Onboarding Progress</span>
              <span className="text-xs font-medium text-primary">{progressPercent}% Complete</span>
            </div>
            <ThemeToggle />
          </div>
          <div className="max-w-xl mx-auto mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>

        {/* Form Container */}
        <main className="flex-1 max-w-xl mx-auto w-full px-6 pt-8 md:pt-16 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* SCREEN 1: WELCOME */}
              {step === 1 && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-light leading-tight">
                    Welcome to <span className="font-semibold text-primary">Scout</span>
                  </h1>
                  <p className="text-secondary font-light leading-relaxed max-w-md mx-auto">
                    We will help you discover opportunities, learning pathways, and mentorship
                    milestones that actually fit your unique journey. 🌸
                  </p>
                  <p className="text-xs text-secondary/60">
                    Onboarding takes about 3 minutes. Your progress is saved automatically.
                  </p>
                </div>
              )}

              {/* SCREEN 2: PREFERRED NAME */}
              {step === 2 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">How should Scout address you? 🌸</h1>
                  <p className="text-sm text-secondary font-light">
                    We prefer your preferred name or nickname to make conversations warmer.
                  </p>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={formData.identity.preferredName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        identity: { preferredName: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:border-primary text-base font-light transition-all"
                  />
                </div>
              )}

              {/* SCREEN 3: SITUATION */}
              {step === 3 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">Tell us a little about yourself.</h1>
                  <p className="text-sm text-secondary font-light">
                    Select options that describe your current lifestyle. You can select more than
                    one!
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      "🌸 I'm studying right now",
                      "💼 I'm already working",
                      "🏠 I'm managing my home and family",
                      "🚀 I'm building something on my own",
                      "🔄 I'm planning a comeback",
                      "❤️ Just exploring what's possible",
                    ].map((sit) => {
                      const isSelected = formData.situations.includes(sit);
                      return (
                        <button
                          key={sit}
                          onClick={() => toggleArrayItem('situations', sit)}
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          <span className="text-sm font-light">{sit}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 4: EDUCATION & WORK DETAILS */}
              {step === 4 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">
                    A few more details about your daily routine
                  </h1>

                  {formData.situations.includes("🌸 I'm studying right now") && (
                    <div className="space-y-4 pt-2">
                      <h2 className="text-sm font-medium text-secondary">Education Details</h2>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Degree / Course (e.g. B.Tech)"
                          value={formData.educationDetail.course}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              educationDetail: { ...prev.educationDetail, course: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                        <input
                          type="text"
                          placeholder="College / school Name"
                          value={formData.educationDetail.college}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              educationDetail: { ...prev.educationDetail, college: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                      </div>
                    </div>
                  )}

                  {formData.situations.includes("💼 I'm already working") && (
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <h2 className="text-sm font-medium text-secondary">Work details</h2>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Current Role (e.g. Designer)"
                          value={formData.workDetail.role}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              workDetail: { ...prev.workDetail, role: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                        <input
                          type="text"
                          placeholder="Industry (e.g. IT)"
                          value={formData.workDetail.industry}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              workDetail: { ...prev.workDetail, industry: e.target.value },
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SCREEN 5: WHY INSTALLED */}
              {step === 5 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">What&apos;s bringing you here today?</h1>
                  <p className="text-sm text-secondary font-light">
                    Select the key outcomes you are hoping to get.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      '🌱 Find my first internship',
                      '💻 Learn new skills',
                      '💼 Switch jobs',
                      '👩 Restart my career',
                      '🎓 Scholarships',
                      '🏆 Competitions',
                      '🌍 Remote work',
                      '❤️ Just exploring',
                    ].map((w) => {
                      const isSelected = formData.whyHere.includes(w);
                      return (
                        <button
                          key={w}
                          onClick={() => toggleArrayItem('whyHere', w)}
                          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          <span className="text-sm font-light">{w}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 6: HAPPIEST DESTINATION */}
              {step === 6 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">Imagine it&apos;s one year from now.</h1>
                  <p className="text-sm text-secondary font-light">
                    Which of these achievements would make you happiest?
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      'I landed my first internship',
                      'I got my first job',
                      "I'm earning online",
                      'I restarted my career after a break',
                      'I got into my dream company',
                      'I received a scholarship to support my studies',
                      'I started freelancing',
                      'I started my own business',
                    ].map((dest) => {
                      const isSelected = formData.happiestDestination === dest;
                      return (
                        <button
                          key={dest}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, happiestDestination: dest }))
                          }
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          <span className="text-sm font-light">{dest}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 7: MAGIC ONE PROBLEM */}
              {step === 7 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">If Scout could solve just ONE problem...</h1>
                  <p className="text-sm text-secondary font-light">
                    What would you want it to be over the next few months?
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      'Find my first internship',
                      'Help me restart my career',
                      'Find work from home jobs',
                      'Help me earn online as a student',
                      'Prepare me for placements',
                      'Guide me every day like a mentor',
                      'Help me learn coding/AI from scratch',
                    ].map((prob) => {
                      const isSelected = formData.magicOneProblem === prob;
                      return (
                        <button
                          key={prob}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, magicOneProblem: prob }))
                          }
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          <span className="text-sm font-light">{prob}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 8: INTERESTS ACTIVITIES */}
              {step === 8 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">Which things make you lose track of time?</h1>
                  <p className="text-sm text-secondary font-light">
                    Select activities you genuinely enjoy or have spent time doing.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Coding',
                      'Design',
                      'Teaching',
                      'Drawing',
                      'Writing',
                      'Public Speaking',
                      'Cooking',
                      'Fashion',
                      'Beauty',
                      'Photography',
                      'Finance',
                      'Editing',
                      'Content Creation',
                      'Business',
                      'Gaming',
                      'Marketing',
                      'Crafts',
                      'Tailoring',
                      'Dancing',
                      'Music',
                    ].map((act) => {
                      const isSelected = formData.timeLossActivities.includes(act);
                      return (
                        <button
                          key={act}
                          onClick={() => toggleArrayItem('timeLossActivities', act)}
                          className={`px-4 py-2 rounded-full border text-xs transition-all ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          {act}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 9: DISCOVERY */}
              {step === 9 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">How do you discover opportunities today?</h1>
                  <p className="text-sm text-secondary font-light">Choose your main sources.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Instagram',
                      'LinkedIn',
                      'Friends',
                      'WhatsApp Groups',
                      'Telegram Channels',
                      'College Notification Boards',
                      'Google Searches',
                      "I don't know where to look",
                    ].map((ch) => {
                      const isSelected = formData.discoveryChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          onClick={() => toggleArrayItem('discoveryChannels', ch)}
                          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          <span className="text-sm font-light">{ch}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 10: OBSTACLES */}
              {step === 10 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">Which of these feels familiar?</h1>
                  <p className="text-sm text-secondary font-light">
                    We ask because Scout works to guide you past these roadblocks.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      "I don't know where to begin",
                      "I don't have enough confidence",
                      'Family responsibilities take up my day',
                      'Financial difficulties',
                      'College workload is too heavy',
                      'I lack professional guidance',
                      "I don't own a personal laptop",
                      'Poor internet connectivity',
                      'Fear of rejection keeps me from applying',
                      "English isn't my strongest language",
                      'None of these',
                    ].map((ob) => {
                      const isSelected = formData.biggestObstacles.includes(ob);
                      return (
                        <button
                          key={ob}
                          onClick={() => toggleArrayItem('biggestObstacles', ob)}
                          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          <span className="text-xs font-light">{ob}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 11: READINESS LEVEL */}
              {step === 11 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">
                    If the perfect opportunity appeared tomorrow, how ready would you feel?
                  </h1>
                  <p className="text-sm text-secondary font-light">
                    Move the slider to match your current feeling.
                  </p>
                  <div className="space-y-8 pt-4">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={formData.readinessIllustrativeLevel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          readinessIllustrativeLevel: parseInt(e.target.value),
                        }))
                      }
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />

                    <div className="p-6 border border-border bg-card rounded-2xl text-center space-y-2">
                      {formData.readinessIllustrativeLevel === 1 && (
                        <>
                          <div className="text-3xl">🌱</div>
                          <h2 className="text-sm font-semibold text-primary">
                            {'"I\'m just exploring."'}
                          </h2>
                        </>
                      )}
                      {formData.readinessIllustrativeLevel === 2 && (
                        <>
                          <div className="text-3xl">🌿</div>
                          <h2 className="text-sm font-semibold text-primary">
                            {'"I\'ve started learning."'}
                          </h2>
                        </>
                      )}
                      {formData.readinessIllustrativeLevel === 3 && (
                        <>
                          <div className="text-3xl">🌸</div>
                          <h2 className="text-sm font-semibold text-primary">
                            {'"I\'m ready to apply."'}
                          </h2>
                        </>
                      )}
                      {formData.readinessIllustrativeLevel === 4 && (
                        <>
                          <div className="text-3xl">🌟</div>
                          <h2 className="text-sm font-semibold text-primary">
                            {'"I\'m actively applying."'}
                          </h2>
                        </>
                      )}
                      {formData.readinessIllustrativeLevel === 5 && (
                        <>
                          <div className="text-3xl">🚀</div>
                          <h2 className="text-sm font-semibold text-primary">
                            {'"I\'m chasing big opportunities."'}
                          </h2>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 12: MOTIVATED TIME */}
              {step === 12 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">When do you usually feel motivated?</h1>
                  <p className="text-sm text-secondary font-light">
                    Helps us schedule matching notifications.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Morning hours',
                      'Night owl sessions',
                      'After college / work',
                      'Quiet weekends',
                      'Whenever someone reminds me',
                    ].map((m) => {
                      const isSelected = formData.motivatedTime.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => toggleArrayItem('motivatedTime', m)}
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          <span className="text-sm font-light">{m}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 13: AVAILABILITY */}
              {step === 13 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">
                    When do you usually get time for yourself?
                  </h1>
                  <p className="text-sm text-secondary font-light">
                    Select the times and input hours.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends', 'Flexible'].map(
                      (time) => {
                        const isSelected = formData.availability.timeOfDay.includes(time);
                        return (
                          <button
                            key={time}
                            onClick={() => {
                              const current = formData.availability.timeOfDay;
                              const updated = current.includes(time)
                                ? current.filter((x) => x !== time)
                                : [...current, time];
                              setFormData((prev) => ({
                                ...prev,
                                availability: { ...prev.availability, timeOfDay: updated },
                              }));
                            }}
                            className={`px-4 py-2 rounded-full border text-xs transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground font-medium'
                                : 'border-border bg-card hover:bg-accent text-secondary'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="text-sm text-secondary font-light">
                      Hours per week:{' '}
                      <span className="font-medium text-primary">
                        {formData.availability.hoursPerWeek} hrs
                      </span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="40"
                      step="2"
                      value={formData.availability.hoursPerWeek}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          availability: { ...prev.availability, hoursPerWeek: val },
                        }));
                      }}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              )}

              {/* SCREEN 14: OPPORTUNITY PREFERENCES */}
              {step === 14 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">
                    Which of these would make you excited to wake up tomorrow?
                  </h1>
                  <p className="text-sm text-secondary font-light">
                    Select all opportunity categories you&apos;d love to see.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      '🌱 Internship',
                      '💼 Job',
                      '🎓 Scholarship',
                      '💻 Freelancing',
                      '🚀 Startup',
                      '❤️ Volunteering',
                      '✨ Competitions',
                      '📚 Courses',
                      '💰 Grants',
                      '🏆 Fellowships',
                    ].map((exc) => {
                      const isSelected = formData.opportunityExcitement.includes(exc);
                      return (
                        <button
                          key={exc}
                          onClick={() => toggleArrayItem('opportunityExcitement', exc)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          <span className="text-xs font-light">{exc}</span>
                          {isSelected && <Check className="w-3 h-3 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCREEN 15: COMPANION SETTINGS */}
              {step === 15 && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light">
                    How would you like Scout to interact with you? 🌸
                  </h1>

                  {/* Celebration preference */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">
                      Celebrate wins style
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        '🎉 Loud',
                        '🌸 Gentle',
                        '😊 Just Congratulations',
                        "🙈 Don't Celebrate",
                      ].map((style) => {
                        const isSelected = formData.companionPreferences.celebrationStyle === style;
                        return (
                          <button
                            key={style}
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                companionPreferences: {
                                  ...prev.companionPreferences,
                                  celebrationStyle: style,
                                },
                              }))
                            }
                            className={`p-2 border rounded-xl text-[10px] text-center transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-border bg-card hover:bg-accent text-secondary'
                            }`}
                          >
                            {style}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Language preference */}
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-secondary">
                      Language Natural Comfort
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'English',
                        'Hindi',
                        'Hinglish',
                        'Tamil',
                        'Telugu',
                        'Bengali',
                        'Marathi',
                        'Gujarati',
                        'Kannada',
                        'Malayalam',
                        'Punjabi',
                      ].map((lang) => {
                        const isSelected = formData.companionPreferences.preferredLanguage === lang;
                        return (
                          <button
                            key={lang}
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                companionPreferences: {
                                  ...prev.companionPreferences,
                                  preferredLanguage: lang,
                                },
                              }))
                            }
                            className={`px-3 py-1.5 border rounded-full text-xs transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground font-medium'
                                : 'border-border bg-card hover:bg-accent text-secondary'
                            }`}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 16: DONE */}
              {step === 16 && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h1 className="text-3xl font-light">
                    All Set, {formData.identity.preferredName}! ✨
                  </h1>
                  <p className="text-secondary font-light leading-relaxed max-w-md mx-auto">
                    Scout is now building your intelligence model and searching opportunities
                    tailored to your life.
                  </p>
                  <p className="text-xs text-secondary/60">
                    Welcome to the companion network. Let&apos;s make this year meaningful. 🌸
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Wizard Footer Navigation */}
        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur border-t border-border z-20">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            {step > 1 && step < 16 ? (
              <button
                onClick={handleBack}
                disabled={saving}
                className="flex items-center space-x-1 px-4 py-2 border border-border bg-card hover:bg-accent rounded-full text-sm font-medium transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step === 16 ? (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center space-x-2 px-8 py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-full text-sm font-semibold transition-all shadow-md"
              >
                <span>Go to Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={saving || (step === 2 && !formData.identity.preferredName)}
                className="flex items-center space-x-2 px-6 py-2.5 bg-primary hover:opacity-90 text-primary-foreground disabled:opacity-50 rounded-full text-sm font-semibold transition-all shadow-sm"
              >
                <span>{step === 1 ? "Let's Begin" : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
