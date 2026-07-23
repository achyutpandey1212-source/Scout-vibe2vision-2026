'use client';

/**
 * ==========================================
 *          ONBOARDING FLOW REDESIGN
 * ==========================================
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/auth-context';
import { profileApi, recommendationsApi } from '@/lib/api';
import { SKILLS_TAXONOMY } from '@scout/shared';
import { track, setUserProperties } from '@/lib/analytics';
import {
  FormLayout,
  ProgressIndicator,
  MultiSelect,
  FileUpload,
  FormNavigationControls,
  TextInput,
  Select,
} from '@/components/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Sparkles,
  Check,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Briefcase,
  FolderGit2,
  Code2,
  GraduationCap,
  AlertCircle,
  Link2,
  Loader2,
} from 'lucide-react';

const TOTAL_STEPS = 8;

const INFORMATIONAL_MESSAGES = [
  "Looking through today's opportunities...",
  'Comparing your profile with each opportunity...',
  'Writing personalized insights...',
  'Double-checking recommendation quality...',
];

export default function OnboardingPage() {
  const { syncWithBackend } = useAuth();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Recommendation Generation & Polling State
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [isRecsReady, setIsRecsReady] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  // Resume upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Collapsible section state for resume review
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    education: true,
    skills: true,
    projects: true,
    experience: true,
    links: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Resume Review Screen State
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
  const [reviewFields, setReviewFields] = useState<any>({
    fullName: '',
    college: '',
    degree: '',
    branch: '',
    expectedGraduation: '',
    technicalSkills: [] as string[],
    detectedProjects: [] as any[],
    detectedExperience: [] as any[],
    detectedLinks: [] as any[],
    certifications: [] as string[],
    achievements: [] as string[],
  });

  // Readiness Score states
  const [readinessData, setReadinessData] = useState({
    careerReadinessScore: 0,
    completionPercentage: 0,
    missingFields: [] as string[],
  });

  // Profile V2 state matching ProfileModel
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'FEMALE' as 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN',
    age: '' as string | number,
    state: '',
    city: '',
    college: '',
    degree: '',
    branch: '',
    currentYear: '' as string | number,
    expectedGraduation: '' as string | number,
    technicalSkills: [] as string[],
    careerGoals: [] as string[],
    biggestChallenge: '',
    confidenceProfile: {
      applyIfNoMeet: '',
      avoidCompetitive: '',
      preferSafer: '',
    },
    opportunityPreferences: {
      internships: true,
      hackathons: true,
      scholarships: true,
      research: false,
      events: false,
      bootcamps: false,
      opensource: false,
      competitions: true,
      training: false,
      volunteer: false,
      earlyCareerPrograms: false,
      partTime: false,
    },
    resumeUploaded: false,
  });

  // Fetch V2 profile state on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileApi.getV2();
        if (res.data && res.data.success) {
          const profile = res.data.data.profile;
          const readiness = res.data.data.readiness;

          if (profile) {
            setFormData((prev) => ({
              ...prev,
              fullName: profile.fullName || '',
              gender: profile.gender || 'FEMALE',
              age: profile.age || '',
              state: profile.state || '',
              city: profile.city || '',
              college: profile.college || '',
              degree: profile.degree || '',
              branch: profile.branch || '',
              currentYear: profile.currentYear || '',
              expectedGraduation: profile.expectedGraduation || '',
              technicalSkills: profile.technicalSkills || [],
              careerGoals: profile.careerGoals || [],
              biggestChallenge: profile.biggestChallenge || '',
              confidenceProfile: {
                applyIfNoMeet: profile.confidenceProfile?.applyIfNoMeet || '',
                avoidCompetitive: profile.confidenceProfile?.avoidCompetitive || '',
                preferSafer: profile.confidenceProfile?.preferSafer || '',
              },
              opportunityPreferences: {
                internships: profile.opportunityPreferences?.internships ?? true,
                hackathons: profile.opportunityPreferences?.hackathons ?? true,
                scholarships: profile.opportunityPreferences?.scholarships ?? true,
                research: profile.opportunityPreferences?.research ?? false,
                events: profile.opportunityPreferences?.events ?? false,
                bootcamps: profile.opportunityPreferences?.bootcamps ?? false,
                opensource: profile.opportunityPreferences?.opensource ?? false,
                competitions: profile.opportunityPreferences?.competitions ?? true,
                training: profile.opportunityPreferences?.training ?? false,
                volunteer: profile.opportunityPreferences?.volunteer ?? false,
                earlyCareerPrograms: profile.opportunityPreferences?.earlyCareerPrograms ?? false,
                partTime: profile.opportunityPreferences?.partTime ?? false,
              },
              resumeUploaded: profile.resumeUploaded || false,
            }));
          }

          if (readiness) {
            setReadinessData(readiness);
          }

          const urlParams = new URLSearchParams(window.location.search);
          const queryStep = urlParams.get('step');
          const savedStep = queryStep || localStorage.getItem('scout_onboarding_v2_step');
          if (savedStep) {
            const parsedStep = parseInt(savedStep, 10);
            if (parsedStep >= 1 && parsedStep <= TOTAL_STEPS) {
              setStep(parsedStep);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load onboarding V2 profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Message rotation during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingRecs && !isRecsReady) {
      interval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % INFORMATIONAL_MESSAGES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isGeneratingRecs, isRecsReady]);

  // Save progress helper
  const saveProgress = async (nextStep: number) => {
    setSaving(true);
    localStorage.setItem('scout_onboarding_v2_step', nextStep.toString());
    try {
      const payload = {
        ...formData,
        age: formData.age !== '' ? Number(formData.age) : null,
        currentYear: formData.currentYear !== '' ? Number(formData.currentYear) : null,
        expectedGraduation:
          formData.expectedGraduation !== '' ? Number(formData.expectedGraduation) : null,
      };

      const res = await profileApi.updateV2(payload);
      if (res.data && res.data.success && res.data.data.readiness) {
        setReadinessData(res.data.data.readiness);
      }
    } catch (err) {
      console.error('Autosave failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const isStepValid = (currentStep: number) => {
    if (currentStep === 1) return true;
    if (currentStep === 2) {
      return formData.fullName.trim().length > 0 && formData.gender !== 'UNKNOWN';
    }
    if (currentStep === 3) {
      return (
        formData.college.trim().length > 0 &&
        formData.degree.trim().length > 0 &&
        formData.expectedGraduation !== ''
      );
    }
    if (currentStep === 5) {
      return formData.technicalSkills.length > 0;
    }
    return true;
  };

  const handleNext = async () => {
    if (!isStepValid(step)) return;
    const nextStep = step + 1;
    if (nextStep <= TOTAL_STEPS) {
      setStep(nextStep);
      await saveProgress(nextStep);
    }
  };

  const handleBack = async () => {
    const prevStep = step - 1;
    if (prevStep >= 1) {
      setStep(prevStep);
      await saveProgress(prevStep);
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGeneratingRecs(true);
    try {
      localStorage.removeItem('scout_onboarding_v2_step');
      await saveProgress(8);
      await profileApi.completeOnboarding();
      await syncWithBackend();
      track('onboarding_completed', {
        resumeUploaded: Boolean(formData.resumeUploaded || uploadedFile),
        skillsCount: formData.technicalSkills?.length || 0,
      });

      setUserProperties({
        fullName: formData.fullName,
        college: formData.college,
        degree: formData.degree,
        branch: formData.branch,
        currentYear: formData.currentYear,
        expectedGraduation: formData.expectedGraduation,
        targetRoles: formData.careerGoals,
        skillsCount: formData.technicalSkills?.length || 0,
        hasResume: Boolean(formData.resumeUploaded || uploadedFile),
        onboardingCompleted: true,
      });

      // Poll recommendations status
      const pollTimer = setInterval(async () => {
        try {
          const res = await recommendationsApi.list();
          const status = res.data?.status || 'READY';
          if (status === 'READY' || res.data?.data) {
            clearInterval(pollTimer);
            setIsRecsReady(true);
            track('recommendations_ready', {
              recommendationCount: Array.isArray(res.data?.data) ? res.data.data.length : 5,
              generationTimeMs: 2000,
            });
            // 1.8 second satisfying success confirmation pause
            setTimeout(() => {
              router.replace('/dashboard');
            }, 1800);
          }
        } catch (err) {
          console.error('Status poll error:', err);
          // Graceful fallback navigation if offline/error
          clearInterval(pollTimer);
          setIsRecsReady(true);
          setTimeout(() => {
            router.replace('/dashboard');
          }, 1800);
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to complete onboarding V2:', err);
      setIsGeneratingRecs(false);
    }
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadedFile(null);
      setUploadedFileName('');
      return;
    }

    setUploadedFile(file);
    setUploadingFile(true);
    setUploadedFileName(file.name);
    track('resume_uploaded', {
      fileType: file.name.split('.').pop() || '',
      fileSizeKb: Math.round(file.size / 1024),
    });

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('fileName', file.name);

      const res = await profileApi.uploadResumeV2(formDataObj);

      if (res.data && res.data.success) {
        const data = res.data.data;
        const parsed = data.parsedFields || {};
        const resumeObj = data.resume || {};

        track('resume_parsed', {
          extractedSkills: (parsed.technicalSkills || resumeObj.skills || []).length,
          extractedProjects: (parsed.detectedProjects || resumeObj.projects || []).length,
          extractedExperience: (parsed.detectedExperience || resumeObj.experience || []).length,
          extractedEducation: parsed.college ? 1 : 0,
        });

        setUserProperties({
          hasResume: true,
          skillsCount: (parsed.technicalSkills || resumeObj.skills || []).length,
          projectsCount: (parsed.detectedProjects || resumeObj.projects || []).length,
          experienceCount: (parsed.detectedExperience || resumeObj.experience || []).length,
        });

        setParsedResumeData(data);
        setReviewFields({
          fullName: parsed.fullName || formData.fullName,
          college: parsed.college || formData.college,
          degree: parsed.degree || formData.degree,
          branch: parsed.branch || formData.branch,
          expectedGraduation: parsed.expectedGraduation || formData.expectedGraduation,
          technicalSkills: parsed.technicalSkills || resumeObj.skills || formData.technicalSkills,
          detectedProjects: parsed.detectedProjects || resumeObj.projects || [],
          detectedExperience: parsed.detectedExperience || resumeObj.experience || [],
          detectedLinks: parsed.detectedLinks || resumeObj.links || [],
          certifications: parsed.detectedCertifications || resumeObj.certifications || [],
          achievements: parsed.detectedAchievements || resumeObj.achievements || [],
        });
      }
    } catch (err) {
      console.error('Failed to upload/parse resume:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleMergeConfirm = async () => {
    setSaving(true);
    try {
      const res = await profileApi.mergeProfileV2(reviewFields);
      if (res.data && res.data.success) {
        const profile = res.data.data.profile;
        const readiness = res.data.data.readiness;

        setFormData((prev) => ({
          ...prev,
          fullName: profile.fullName || prev.fullName,
          college: profile.college || prev.college,
          degree: profile.degree || prev.degree,
          branch: profile.branch || prev.branch,
          expectedGraduation: profile.expectedGraduation || prev.expectedGraduation,
          technicalSkills: profile.technicalSkills || prev.technicalSkills,
          resumeUploaded: true,
        }));

        if (readiness) {
          setReadinessData(readiness);
        }
        setParsedResumeData(null);
      }
    } catch (err) {
      console.error('Merge confirmation failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof typeof formData.opportunityPreferences) => {
    setFormData((prev) => ({
      ...prev,
      opportunityPreferences: {
        ...prev.opportunityPreferences,
        [key]: !prev.opportunityPreferences[key],
      },
    }));
  };

  const toggleReviewSkill = (skillId: string) => {
    setReviewFields((prev: any) => {
      const skills = prev.technicalSkills.includes(skillId)
        ? prev.technicalSkills.filter((s: string) => s !== skillId)
        : [...prev.technicalSkills, skillId];
      return { ...prev, technicalSkills: skills };
    });
  };

  const getStepTitle = (s: number) => {
    switch (s) {
      case 1:
        return 'Welcome';
      case 2:
        return 'Basic Info';
      case 3:
        return 'Career Stage';
      case 4:
        return 'Goals';
      case 5:
        return 'Skills';
      case 6:
        return 'Preferences';
      case 7:
        return 'Resume';
      case 8:
        return 'Review & Finish';
      default:
        return '';
    }
  };

  const slideVariants = {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-3 select-none">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-light text-muted-foreground tracking-wide">
          Loading profile...
        </span>
      </div>
    );
  }

  // ── RECOMMENDATION GENERATION EXPERIENCE & SUCCESS CONFIRMATION ──
  if (isGeneratingRecs) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center select-none space-y-8">
        {isRecsReady ? (
          /* SUCCESS CONFIRMATION SCREEN (1.8s Pause) */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 max-w-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-display font-medium text-foreground">
                ✓ Today&apos;s recommendations are ready.
              </h1>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                We found five opportunities worth your attention based on your profile.
              </p>
            </div>

            <p className="text-xs font-mono text-primary animate-pulse">
              Opening your dashboard...
            </p>
          </motion.div>
        ) : (
          /* BACKEND-DRIVEN GENERATION SCREEN */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 max-w-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-display font-medium text-foreground">
                Preparing today&apos;s recommendations
              </h1>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Scout is matching your profile against today&apos;s opportunity database.
              </p>
            </div>

            <div className="p-5 border border-border/80 bg-card rounded-2xl space-y-3 text-left shadow-sm text-xs font-light">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Profile saved</span>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                  <span>{INFORMATIONAL_MESSAGES[msgIndex]}</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                  This usually takes around 20–40 seconds depending on AI response time.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground select-none">
        {/* Sticky Header with Progress */}
        <header className="sticky top-0 bg-background/90 backdrop-blur-md z-20 w-full px-4 py-3 border-b border-border/60">
          <div className="max-w-[580px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground font-sans">
                Scout
              </span>
            </div>
            <div className="flex items-center gap-3">
              {saving && (
                <span className="text-xs text-primary/80 font-mono animate-pulse">✓ Saved</span>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Wizard Form Layout */}
        <main className="flex-1 flex flex-col justify-center">
          <FormLayout
            heading={
              step === 1
                ? 'Welcome to Scout.'
                : step === 2
                  ? 'Tell us about yourself.'
                  : step === 3
                    ? 'Where are you in your journey?'
                    : step === 4
                      ? 'What are you aiming for?'
                      : step === 5
                        ? 'What are you already good at?'
                        : step === 6
                          ? 'What should Scout discover for you?'
                          : step === 7
                            ? 'Give Scout a head start.'
                            : 'Review & Confirm'
            }
            subheading={
              step === 1
                ? 'Usually takes about 2–3 minutes. You can update everything later in Profile.'
                : step === 2
                  ? 'These basics help Scout recommend opportunities relevant to your current stage.'
                  : step === 3
                    ? 'Your academic background helps filter opportunities you are eligible for.'
                    : step === 4
                      ? 'Knowing your goals helps Scout prioritize opportunities aligning with your ambitions.'
                      : step === 5
                        ? 'Start with the skills you are most confident about.'
                        : step === 6
                          ? 'Tell Scout what opportunity types matter most to you.'
                          : step === 7
                            ? 'Uploading your resume helps Scout understand your background and refine match scores.'
                            : 'Confirm your profile details below before generating recommendations.'
            }
            stepIndicator={
              <ProgressIndicator
                currentStep={step}
                totalSteps={TOTAL_STEPS}
                stepTitle={getStepTitle(step)}
              />
            }
            footerActions={
              <FormNavigationControls
                isFirstStep={step === 1}
                isLastStep={step === TOTAL_STEPS}
                onBack={handleBack}
                onNext={step === TOTAL_STEPS ? handleGenerateRecommendations : handleNext}
                nextLabel={
                  step === 1
                    ? "Let's Begin"
                    : step === TOTAL_STEPS
                      ? 'Generate My Recommendations'
                      : 'Continue'
                }
                isLoading={saving}
                isDisabled={!isStepValid(step)}
              />
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* ── STEP 1: WELCOME ── */}
                {step === 1 && (
                  <div className="space-y-6 pt-4 text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="p-4 border border-border/80 bg-card rounded-2xl space-y-2 text-xs text-muted-foreground font-light leading-relaxed max-w-md mx-auto text-left">
                      <div className="flex items-center gap-2 text-foreground font-medium text-sm pb-1 border-b border-border/60">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span>How Scout protects your privacy</span>
                      </div>
                      <p>• Scout only uses your information to personalize recommendations.</p>
                      <p>• Applications are completed directly on official opportunity pages.</p>
                      <p>• Everything you enter can be updated later from Profile.</p>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: BASIC INFORMATION ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <TextInput
                      label="Full Name *"
                      placeholder="e.g. Alex Morgan"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      error={!formData.fullName && step > 2 ? 'Full name is required' : undefined}
                    />

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-secondary/80">
                        Gender *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'FEMALE', label: 'Female' },
                          { id: 'MALE', label: 'Male' },
                          { id: 'OTHER', label: 'Other' },
                        ].map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                gender: g.id as any,
                              }))
                            }
                            className={`
                              py-2.5 px-3 border rounded-xl text-xs font-medium text-center transition-all duration-150
                              ${
                                formData.gender === g.id
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border/80 bg-card text-muted-foreground hover:bg-muted/40'
                              }
                            `}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <TextInput
                        label="Age"
                        type="number"
                        placeholder="e.g. 20"
                        value={formData.age}
                        onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                      />
                      <TextInput
                        label="State"
                        placeholder="e.g. Karnataka"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, state: e.target.value }))
                        }
                      />
                      <TextInput
                        label="City"
                        placeholder="e.g. Bangalore"
                        value={formData.city}
                        onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* ── STEP 3: CAREER STAGE & ACADEMICS ── */}
                {step === 3 && (
                  <div className="space-y-4">
                    <TextInput
                      label="College / Institution *"
                      placeholder="e.g. Indian Institute of Technology"
                      value={formData.college}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, college: e.target.value }))
                      }
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <TextInput
                        label="Degree *"
                        placeholder="e.g. B.Tech"
                        value={formData.degree}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, degree: e.target.value }))
                        }
                      />
                      <TextInput
                        label="Branch / Major"
                        placeholder="e.g. Computer Science"
                        value={formData.branch}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, branch: e.target.value }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label="Current Year"
                        value={formData.currentYear}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, currentYear: e.target.value }))
                        }
                      >
                        <option value="">Select Current Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year / Final</option>
                        <option value="5">Graduate / Alumni</option>
                      </Select>

                      <TextInput
                        label="Expected Graduation *"
                        type="number"
                        placeholder="e.g. 2027"
                        value={formData.expectedGraduation}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, expectedGraduation: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                )}

                {/* ── STEP 4: CAREER GOALS ── */}
                {step === 4 && (
                  <div className="space-y-4">
                    <MultiSelect
                      label="Career Goals & Target Roles"
                      placeholder="Select your target roles..."
                      options={[
                        'Software Engineering',
                        'Backend Engineering',
                        'Frontend Engineering',
                        'Full Stack Engineering',
                        'AI / ML Engineering',
                        'DevOps & Cloud',
                        'Cybersecurity',
                        'Data Science',
                      ]}
                      value={formData.careerGoals}
                      onChange={(selected) =>
                        setFormData((prev) => ({ ...prev, careerGoals: selected }))
                      }
                    />

                    <div className="space-y-1.5 pt-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-secondary/80">
                        What&apos;s your biggest goal or challenge right now?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          'Get my first internship',
                          'Build strong project portfolio',
                          'Find relevant student scholarships',
                          'Prepare for technical interviews',
                        ].map((goal) => {
                          const isSelected = formData.biggestChallenge === goal;
                          return (
                            <button
                              key={goal}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, biggestChallenge: goal }))
                              }
                              className={`
                                p-3 border rounded-xl text-xs text-left transition-all duration-150
                                ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary font-medium'
                                    : 'border-border/80 bg-card text-muted-foreground hover:bg-muted/40'
                                }
                              `}
                            >
                              {goal}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 5: SKILLS ── */}
                {step === 5 && (
                  <div className="space-y-4">
                    <MultiSelect
                      label="Technical Skills & Technologies *"
                      placeholder="Type or search skills (e.g. Python, React)..."
                      options={SKILLS_TAXONOMY.map((s) => s.name)}
                      value={formData.technicalSkills.map(
                        (id) => SKILLS_TAXONOMY.find((s) => s.id === id)?.name || id,
                      )}
                      onChange={(selectedNames) => {
                        const selectedIds = selectedNames.map((name) => {
                          const matched = SKILLS_TAXONOMY.find(
                            (s) => s.name.toLowerCase() === name.toLowerCase(),
                          );
                          return matched ? matched.id : name;
                        });
                        setFormData((prev) => ({ ...prev, technicalSkills: selectedIds }));
                      }}
                    />
                  </div>
                )}

                {/* ── STEP 6: PREFERENCES ── */}
                {step === 6 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-secondary/80">
                        Opportunity Types
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { key: 'internships', label: 'Internships' },
                          { key: 'hackathons', label: 'Hackathons' },
                          { key: 'scholarships', label: 'Scholarships' },
                          { key: 'competitions', label: 'Competitions' },
                          { key: 'research', label: 'Research Programs' },
                          { key: 'events', label: 'Workshops & Events' },
                        ].map((item) => {
                          const isSelected =
                            formData.opportunityPreferences[
                              item.key as keyof typeof formData.opportunityPreferences
                            ];
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() =>
                                togglePreference(
                                  item.key as keyof typeof formData.opportunityPreferences,
                                )
                              }
                              className={`
                                p-3 rounded-xl border text-xs flex items-center justify-between transition-all duration-150
                                ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary font-medium'
                                    : 'border-border/80 bg-card text-muted-foreground hover:bg-muted/40'
                                }
                              `}
                            >
                              <span>{item.label}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 7: REDESIGNED RICH RESUME EXTRACTION & REVIEW ── */}
                {step === 7 && (
                  <div className="space-y-6">
                    {parsedResumeData ? (
                      <div className="space-y-5 select-none">
                        {/* Quick Scan Summary Banner */}
                        <div className="p-5 border border-primary/30 bg-primary/[0.03] rounded-2xl space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-base font-display font-medium text-foreground">
                                Scout understood your resume
                              </h3>
                              <p className="text-xs text-muted-foreground font-light">
                                Review the extracted highlights below before saving.
                              </p>
                            </div>
                          </div>

                          {/* Quick Summary Chips */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-card border border-primary/20 text-primary shadow-sm">
                              ✓ {reviewFields.technicalSkills?.length || 0} Skills
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-card border border-primary/20 text-primary shadow-sm">
                              ✓ {reviewFields.detectedProjects?.length || 0} Projects
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-card border border-primary/20 text-primary shadow-sm">
                              ✓ {reviewFields.detectedExperience?.length || 0} Experiences
                            </span>
                            {reviewFields.detectedLinks?.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-card border border-primary/20 text-primary shadow-sm">
                                ✓ {reviewFields.detectedLinks.length} Links
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-card border border-primary/20 text-primary shadow-sm">
                              ✓ Education
                            </span>
                          </div>
                        </div>

                        {/* Warm Honest Beta Disclaimer */}
                        <div className="p-4 border border-border/80 bg-card rounded-2xl flex items-start gap-3 text-xs text-muted-foreground font-light leading-relaxed">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-medium text-foreground">
                              Resume extraction is still improving.
                            </strong>
                            <p className="mt-0.5">
                              Scout automatically extracts skills, projects, education, and
                              experience, but complex resume layouts may not parse perfectly yet.
                              You can edit anything now or update it later from your Profile.
                            </p>
                          </div>
                        </div>

                        {/* Collapsible Sections */}
                        <div className="space-y-3">
                          {/* 1. Basic Info & Education Section */}
                          <div className="border border-border/80 bg-card rounded-2xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSection('education')}
                              className="w-full p-4 flex items-center justify-between text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-primary" />
                                <span>Basic Information & Education</span>
                              </div>
                              {openSections.education ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>

                            {openSections.education && (
                              <div className="p-4 pt-0 border-t border-border/40 space-y-3">
                                <TextInput
                                  label="Full Name"
                                  value={reviewFields.fullName}
                                  onChange={(e) =>
                                    setReviewFields({ ...reviewFields, fullName: e.target.value })
                                  }
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <TextInput
                                    label="College"
                                    value={reviewFields.college}
                                    onChange={(e) =>
                                      setReviewFields({ ...reviewFields, college: e.target.value })
                                    }
                                  />
                                  <TextInput
                                    label="Degree"
                                    value={reviewFields.degree}
                                    onChange={(e) =>
                                      setReviewFields({ ...reviewFields, degree: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <TextInput
                                    label="Branch"
                                    value={reviewFields.branch}
                                    onChange={(e) =>
                                      setReviewFields({ ...reviewFields, branch: e.target.value })
                                    }
                                  />
                                  <TextInput
                                    label="Graduation Year"
                                    type="number"
                                    value={reviewFields.expectedGraduation}
                                    onChange={(e) =>
                                      setReviewFields({
                                        ...reviewFields,
                                        expectedGraduation: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. Technical Skills Section */}
                          <div className="border border-border/80 bg-card rounded-2xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSection('skills')}
                              className="w-full p-4 flex items-center justify-between text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-primary" />
                                <span>
                                  Extracted Skills ({reviewFields.technicalSkills?.length || 0})
                                </span>
                              </div>
                              {openSections.skills ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>

                            {openSections.skills && (
                              <div className="p-4 pt-0 border-t border-border/40 space-y-2">
                                <p className="text-[11px] text-muted-foreground font-light">
                                  Click any skill chip to toggle inclusion:
                                </p>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {SKILLS_TAXONOMY.map((skill) => {
                                    const isSelected = reviewFields.technicalSkills?.includes(
                                      skill.id,
                                    );
                                    return (
                                      <button
                                        key={skill.id}
                                        type="button"
                                        onClick={() => toggleReviewSkill(skill.id)}
                                        className={`
                                          px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150
                                          ${
                                            isSelected
                                              ? 'bg-primary/10 border-primary/30 text-primary'
                                              : 'bg-card border-border/60 text-muted-foreground/60 hover:text-foreground'
                                          }
                                        `}
                                      >
                                        {skill.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Projects Section */}
                          <div className="border border-border/80 bg-card rounded-2xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSection('projects')}
                              className="w-full p-4 flex items-center justify-between text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FolderGit2 className="w-4 h-4 text-primary" />
                                <span>
                                  Extracted Projects ({reviewFields.detectedProjects?.length || 0})
                                </span>
                              </div>
                              {openSections.projects ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>

                            {openSections.projects && (
                              <div className="p-4 pt-0 border-t border-border/40 space-y-3">
                                {reviewFields.detectedProjects &&
                                reviewFields.detectedProjects.length > 0 ? (
                                  reviewFields.detectedProjects.map((p: any, i: number) => (
                                    <div
                                      key={i}
                                      className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-foreground">
                                          {p.title || `Project #${i + 1}`}
                                        </span>
                                        {p.url && (
                                          <a
                                            href={p.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1 text-[10px]"
                                          >
                                            <span>Link</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        )}
                                      </div>
                                      {p.description && (
                                        <p className="text-muted-foreground font-light text-[11px] leading-relaxed">
                                          {p.description}
                                        </p>
                                      )}
                                      {p.technologies && p.technologies.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                          {p.technologies.map((tech: string, tIdx: number) => (
                                            <span
                                              key={tIdx}
                                              className="px-2 py-0.5 rounded-md bg-card border text-[10px] text-muted-foreground"
                                            >
                                              {tech}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground/60 font-light italic">
                                    None detected in resume
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 4. Experience Section */}
                          <div className="border border-border/80 bg-card rounded-2xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSection('experience')}
                              className="w-full p-4 flex items-center justify-between text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" />
                                <span>
                                  Experience & Leadership (
                                  {reviewFields.detectedExperience?.length || 0})
                                </span>
                              </div>
                              {openSections.experience ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>

                            {openSections.experience && (
                              <div className="p-4 pt-0 border-t border-border/40 space-y-3">
                                {reviewFields.detectedExperience &&
                                reviewFields.detectedExperience.length > 0 ? (
                                  reviewFields.detectedExperience.map((exp: any, i: number) => (
                                    <div
                                      key={i}
                                      className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-foreground">
                                          {exp.role || exp.company || `Role #${i + 1}`}
                                        </span>
                                        {exp.company && (
                                          <span className="text-muted-foreground text-[11px]">
                                            {exp.company}
                                          </span>
                                        )}
                                      </div>
                                      {exp.description && (
                                        <p className="text-muted-foreground font-light text-[11px] leading-relaxed">
                                          {exp.description}
                                        </p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground/60 font-light italic">
                                    None detected in resume
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 5. Detected Links & Portfolio Section */}
                          {reviewFields.detectedLinks && reviewFields.detectedLinks.length > 0 && (
                            <div className="border border-border/80 bg-card rounded-2xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() => toggleSection('links')}
                                className="w-full p-4 flex items-center justify-between text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Link2 className="w-4 h-4 text-primary" />
                                  <span>Portfolio Links ({reviewFields.detectedLinks.length})</span>
                                </div>
                                {openSections.links ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>

                              {openSections.links && (
                                <div className="p-4 pt-0 border-t border-border/40 flex flex-wrap gap-2">
                                  {reviewFields.detectedLinks.map((l: any, i: number) => (
                                    <a
                                      key={i}
                                      href={l.url || l}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-primary hover:underline"
                                    >
                                      <span>{l.label || l.url || l}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                          <button
                            type="button"
                            onClick={() => setParsedResumeData(null)}
                            className="px-4 py-2.5 border border-border/80 text-xs text-muted-foreground rounded-xl hover:bg-muted/40 font-medium"
                          >
                            Upload Different Resume
                          </button>
                          <button
                            type="button"
                            onClick={handleMergeConfirm}
                            className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 shadow-sm flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Use Extracted Data</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <FileUpload
                        label="Upload Resume (Optional)"
                        helperText="PDF up to 5MB. Scout parses your resume to refine recommendations."
                        value={
                          uploadedFile
                            ? { name: uploadedFileName }
                            : formData.resumeUploaded
                              ? { name: 'resume.pdf' }
                              : null
                        }
                        isUploading={uploadingFile}
                        onChange={handleFileUpload}
                        onRemove={() => {
                          setUploadedFile(null);
                          setUploadedFileName('');
                          setFormData((prev) => ({ ...prev, resumeUploaded: false }));
                        }}
                      />
                    )}
                  </div>
                )}

                {/* ── STEP 8: REVIEW & FINISH ── */}
                {step === 8 && (
                  <div className="space-y-4 border border-border/80 bg-card p-5 rounded-2xl text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="font-semibold uppercase tracking-wider text-primary">
                        Profile Summary
                      </span>
                      <span className="text-muted-foreground font-mono">Ready to Generate</span>
                    </div>

                    <div className="space-y-2 font-light text-muted-foreground">
                      <p>
                        <strong className="text-foreground font-medium">Name:</strong>{' '}
                        {formData.fullName} ({formData.gender})
                      </p>
                      <p>
                        <strong className="text-foreground font-medium">Academic:</strong>{' '}
                        {formData.college} • {formData.degree} ({formData.expectedGraduation})
                      </p>
                      <p>
                        <strong className="text-foreground font-medium">Skills:</strong>{' '}
                        {formData.technicalSkills.length} selected
                      </p>
                      <p>
                        <strong className="text-foreground font-medium">Target Roles:</strong>{' '}
                        {formData.careerGoals.join(', ') || 'Exploring'}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </FormLayout>
        </main>
      </div>
    </ProtectedRoute>
  );
}
