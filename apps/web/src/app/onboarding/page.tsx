'use client';

/**
 * ==========================================
 *          ONBOARDING V2 FROZEN
 *
 * Changing onboarding requires updating:
 * - Personalization
 * - Discovery
 * - Recommendation
 * ==========================================
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/auth-context';
import { profileApi } from '@/lib/api';
import { SKILLS_TAXONOMY } from '@scout/shared';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Search,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const { syncWithBackend } = useAuth();
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');

  // Resume upload mock state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Career Readiness Score states (fetched dynamically)
  const [readinessData, setReadinessData] = useState({
    careerReadinessScore: 0,
    completionPercentage: 0,
    missingFields: [] as string[],
  });

  // Profile V2 state matching ProfileModel
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'UNKNOWN' as 'MALE' | 'FEMALE' | 'UNKNOWN',
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
      internships: false,
      hackathons: false,
      scholarships: false,
      research: false,
      events: false,
      bootcamps: false,
      opensource: false,
      competitions: false,
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
              gender: profile.gender || 'UNKNOWN',
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
                internships: profile.opportunityPreferences?.internships || false,
                hackathons: profile.opportunityPreferences?.hackathons || false,
                scholarships: profile.opportunityPreferences?.scholarships || false,
                research: profile.opportunityPreferences?.research || false,
                events: profile.opportunityPreferences?.events || false,
                bootcamps: profile.opportunityPreferences?.bootcamps || false,
                opensource: profile.opportunityPreferences?.opensource || false,
                competitions: profile.opportunityPreferences?.competitions || false,
                training: profile.opportunityPreferences?.training || false,
                volunteer: profile.opportunityPreferences?.volunteer || false,
                earlyCareerPrograms: profile.opportunityPreferences?.earlyCareerPrograms || false,
                partTime: profile.opportunityPreferences?.partTime || false,
              },
              resumeUploaded: profile.resumeUploaded || false,
            }));
          }

          if (readiness) {
            setReadinessData(readiness);
          }

          const savedStep = localStorage.getItem('scout_onboarding_v2_step');
          if (savedStep) {
            const parsedStep = parseInt(savedStep, 10);
            if (parsedStep <= TOTAL_STEPS) {
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

  // Autosave when transitioning steps
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

  const handleNext = async () => {
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

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Clear wizard steps from storage
      localStorage.removeItem('scout_onboarding_v2_step');
      await syncWithBackend();
      router.replace('/dashboard');
    } catch (err) {
      console.error('Failed to complete onboarding V2:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadedFileName(file.name);

    try {
      // Simulate small delay for file storage placeholder
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await profileApi.uploadResumeV2({
        fileName: file.name,
        fileUrl: `https://scout-resumes.storage.googleapis.com/${Date.now()}_${file.name}`,
      });

      if (res.data && res.data.success) {
        setFormData((prev) => ({ ...prev, resumeUploaded: true }));
        if (res.data.data.readiness) {
          setReadinessData(res.data.data.readiness);
        }
      }
    } catch (err) {
      console.error('Failed to upload resume metadata:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  // Multiple choice for checklists / arrays
  const togglePreference = (key: keyof typeof formData.opportunityPreferences) => {
    setFormData((prev) => ({
      ...prev,
      opportunityPreferences: {
        ...prev.opportunityPreferences,
        [key]: !prev.opportunityPreferences[key],
      },
    }));
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => {
      const skills = prev.technicalSkills.includes(skill)
        ? prev.technicalSkills.filter((s) => s !== skill)
        : [...prev.technicalSkills, skill];
      return { ...prev, technicalSkills: skills };
    });
  };

  // Slide Animation Config
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
          Loading your profile...
        </span>
      </div>
    );
  }

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  // Filter skills for searchable list
  const filteredSkills = SKILLS_TAXONOMY.filter(
    (skill) =>
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      skill.aliases.some((alias) => alias.toLowerCase().includes(skillSearch.toLowerCase())),
  );

  // Generate Career Readiness Suggestions deterministically from missing fields
  const getReadinessSuggestions = () => {
    const suggestions: string[] = [];
    if (!formData.resumeUploaded) {
      suggestions.push('Upload your resume');
    }
    if (formData.technicalSkills.length < 3) {
      suggestions.push('Add at least 3 skills');
    }
    const hasPrefs = Object.values(formData.opportunityPreferences).some((val) => val === true);
    if (!hasPrefs) {
      suggestions.push('Select opportunity preferences');
    }
    return suggestions;
  };

  const suggestionsList = getReadinessSuggestions();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans relative pb-28">
        {/* Progress Bar Header */}
        <header className="sticky top-0 bg-background/85 backdrop-blur z-20 w-full p-4 border-b border-border/80">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-light text-secondary">
                Step {step} of {TOTAL_STEPS}
              </span>
              <span className="text-xs font-medium text-primary">{progressPercent}% Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              {saving && (
                <span className="text-[10px] text-primary/80 animate-pulse font-light">
                  Saving...
                </span>
              )}
              <ThemeToggle />
            </div>
          </div>
          <div className="max-w-xl mx-auto mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>

        {/* Wizard Forms */}
        <main className="flex-1 max-w-xl mx-auto w-full px-6 pt-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* STEP 1: WELCOME */}
              {step === 1 && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Sparkles className="w-7 h-7 animate-pulse" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-light leading-tight">
                    Welcome to <span className="font-semibold text-primary">Scout V2</span>
                  </h1>
                  <p className="text-secondary font-light leading-relaxed max-w-md mx-auto">
                    Let&apos;s build your personalization profile. We will help you discover
                    internships, hackathons, and early career opportunities matching your
                    engineering studies. 🌸
                  </p>
                  <p className="text-xs text-secondary/60">
                    Takes under 5 minutes. Your progress is saved automatically.
                  </p>
                </div>
              )}

              {/* STEP 2: BASIC INFO */}
              {step === 2 && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-light">Introduce yourself 🌸</h1>
                  <p className="text-xs text-secondary font-light">
                    We use this to verify identity and location-based opportunities.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-secondary font-medium block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-secondary font-medium block mb-1">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setFormData((prev) => ({ ...prev, gender: 'FEMALE' }))}
                          className={`py-2 px-3 border rounded-xl text-xs font-light text-center transition-all ${
                            formData.gender === 'FEMALE'
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card text-secondary'
                          }`}
                        >
                          Female
                        </button>
                        <button
                          disabled
                          className="py-2 px-3 border border-border bg-card/50 text-secondary/40 rounded-xl text-xs font-light text-center relative cursor-not-allowed"
                        >
                          Male{' '}
                          <span className="block text-[8px] text-primary/60 font-medium">
                            🚧 Coming Soon
                          </span>
                        </button>
                        <button
                          disabled
                          className="py-2 px-3 border border-border bg-card/50 text-secondary/40 rounded-xl text-xs font-light text-center relative cursor-not-allowed"
                        >
                          Other{' '}
                          <span className="block text-[8px] text-primary/60 font-medium">
                            🚧 Coming Soon
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="col-span-1">
                        <label className="text-xs text-secondary font-medium block mb-1">
                          Age (Optional)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 20"
                          value={formData.age}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, age: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs text-secondary font-medium block mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Delhi"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, state: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs text-secondary font-medium block mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. New Delhi"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, city: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: EDUCATION */}
              {step === 3 && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-light">Your Academic Context 🎓</h1>
                  <p className="text-xs text-secondary font-light">
                    Helps us filter opportunities requiring specific graduation windows or degrees.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-secondary font-medium block mb-1">
                        College / Institute
                      </label>
                      <input
                        type="text"
                        placeholder="Name of your college"
                        value={formData.college}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, college: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-secondary font-medium block mb-1">
                          Degree
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. B.Tech"
                          value={formData.degree}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, degree: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-secondary font-medium block mb-1">
                          Branch / Major
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Computer Science"
                          value={formData.branch}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, branch: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-xs text-secondary font-medium block mb-1">
                          Current Year
                        </label>
                        <select
                          value={formData.currentYear}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, currentYear: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        >
                          <option value="">Select Year</option>
                          {[1, 2, 3, 4, 5, 6].map((yr) => (
                            <option key={yr} value={yr}>
                              Year {yr}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-secondary font-medium block mb-1">
                          Expected Graduation
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 2027"
                          value={formData.expectedGraduation}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, expectedGraduation: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: SKILLS */}
              {step === 4 && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-light">What are your skills? 💻</h1>
                  <p className="text-xs text-secondary font-light">
                    Search and select the technical skills you know or are currently learning.
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search skills..."
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-light"
                    />
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-secondary/60" />
                  </div>

                  {/* Selected skills tags */}
                  {formData.technicalSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-accent/20 rounded-xl">
                      {formData.technicalSkills.map((skillId) => {
                        const skillName =
                          SKILLS_TAXONOMY.find((s) => s.id === skillId)?.name || skillId;
                        return (
                          <span
                            key={skillId}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-full text-xs font-light"
                          >
                            <span>{skillName}</span>
                            <button
                              onClick={() => toggleSkill(skillId)}
                              className="hover:opacity-85 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Search results list */}
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-card border border-border rounded-xl">
                    {filteredSkills.map((skill) => {
                      const isSelected = formData.technicalSkills.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          onClick={() => toggleSkill(skill.id)}
                          className={`p-2 border rounded-xl text-center text-xs transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-card hover:bg-accent text-secondary'
                          }`}
                        >
                          {skill.name}
                        </button>
                      );
                    })}
                    {filteredSkills.length === 0 && (
                      <div className="col-span-3 py-6 text-center text-xs text-secondary font-light">
                        No skills match your query
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: CAREER DIRECTION */}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-light">What is your biggest goal right now? 🎯</h1>
                    <p className="text-xs text-secondary font-light">
                      Choose the main focus that dominates your career efforts currently.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {[
                        'Get my first internship',
                        'Build my resume',
                        'Prepare for placements',
                        'Learn through hackathons',
                        'Explore opportunities',
                        'Win scholarships',
                        "I'm still exploring",
                      ].map((goal) => {
                        const isSelected = formData.careerGoals[0] === goal;
                        return (
                          <button
                            key={goal}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, careerGoals: [goal] }))
                            }
                            className={`px-3 py-1.5 border rounded-full text-xs transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground font-medium'
                                : 'border-border bg-card hover:bg-accent text-secondary'
                            }`}
                          >
                            {goal}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border/40">
                    <h2 className="text-base font-light text-foreground">
                      What is worrying you the most right now? 🌸
                    </h2>
                    <p className="text-xs text-secondary font-light">
                      Let us know what roadblock is on your mind so we can help clear it first.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {[
                        "I don't know where to apply.",
                        "I don't think I'm good enough.",
                        'My resume is weak.',
                        "I don't have enough projects.",
                        "I don't know which skills to learn.",
                        "I'm preparing for placements.",
                        "I'm just exploring.",
                      ].map((worry) => {
                        const isSelected = formData.biggestChallenge === worry;
                        return (
                          <button
                            key={worry}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, biggestChallenge: worry }))
                            }
                            className={`px-3 py-1.5 border rounded-full text-xs transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground font-medium'
                                : 'border-border bg-card hover:bg-accent text-secondary'
                            }`}
                          >
                            {worry}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: PREFERENCES & CONFIDENCE */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-light">What should Scout hunt for? 🌸</h1>
                    <p className="text-xs text-secondary font-light">
                      Select the types of student opportunities you want recommendations for.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'internships', label: 'Internships' },
                        { key: 'hackathons', label: 'Hackathons' },
                        { key: 'scholarships', label: 'Scholarships' },
                        { key: 'opensource', label: 'Open Source' },
                        { key: 'events', label: 'Workshops' },
                        { key: 'bootcamps', label: 'Bootcamps' },
                        { key: 'competitions', label: 'Competitions' },
                        { key: 'training', label: 'Learning Programs' },
                      ].map((item) => {
                        const isSelected =
                          formData.opportunityPreferences[
                            item.key as keyof typeof formData.opportunityPreferences
                          ];
                        return (
                          <button
                            key={item.key}
                            onClick={() =>
                              togglePreference(
                                item.key as keyof typeof formData.opportunityPreferences,
                              )
                            }
                            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-border bg-card hover:bg-accent text-secondary'
                            }`}
                          >
                            <span className="text-xs font-light">{item.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Future Categories (Coming Soon) */}
                    <div className="pt-2">
                      <div className="flex flex-wrap gap-1.5">
                        {['Full-time Jobs', 'Freelancing Clients', 'Startup Funding'].map(
                          (soon) => (
                            <span
                              key={soon}
                              className="px-2 py-0.5 bg-card border border-border text-secondary/40 rounded-full text-[9px] font-light cursor-not-allowed"
                            >
                              {soon} 🚧 Coming Soon
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/40">
                    <h2 className="text-sm font-medium text-secondary">Self-Belief check</h2>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-secondary font-light">
                          &quot;I apply even if I don&apos;t meet every requirement.&quot;
                        </span>
                        <div className="flex space-x-1">
                          {['Agree', 'Neutral', 'Disagree'].map((o) => (
                            <button
                              key={o}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  confidenceProfile: {
                                    ...prev.confidenceProfile,
                                    applyIfNoMeet: o,
                                  },
                                }))
                              }
                              className={`px-2 py-0.5 border rounded text-[9px] ${formData.confidenceProfile.applyIfNoMeet === o ? 'border-primary bg-primary/5 text-primary' : 'border-border text-secondary'}`}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-secondary font-light">
                          &quot;I avoid competitive opportunities.&quot;
                        </span>
                        <div className="flex space-x-1">
                          {['Agree', 'Neutral', 'Disagree'].map((o) => (
                            <button
                              key={o}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  confidenceProfile: {
                                    ...prev.confidenceProfile,
                                    avoidCompetitive: o,
                                  },
                                }))
                              }
                              className={`px-2 py-0.5 border rounded text-[9px] ${formData.confidenceProfile.avoidCompetitive === o ? 'border-primary bg-primary/5 text-primary' : 'border-border text-secondary'}`}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-secondary font-light">
                          &quot;I prefer safer opportunities over ambitious ones.&quot;
                        </span>
                        <div className="flex space-x-1">
                          {['Agree', 'Neutral', 'Disagree'].map((o) => (
                            <button
                              key={o}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  confidenceProfile: { ...prev.confidenceProfile, preferSafer: o },
                                }))
                              }
                              className={`px-2 py-0.5 border rounded text-[9px] ${formData.confidenceProfile.preferSafer === o ? 'border-primary bg-primary/5 text-primary' : 'border-border text-secondary'}`}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: RESUME & CAREER READINESS */}
              {step === 7 && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-light">Resume & Career Readiness 📈</h1>
                  <p className="text-xs text-secondary font-light">
                    Completing your profile generates better recommendation match rates.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Resume container */}
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-2xl bg-card hover:bg-accent/10 transition-all cursor-pointer relative min-h-[120px]">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadingFile}
                      />
                      {uploadingFile ? (
                        <div className="text-center space-y-1">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-[10px] font-light text-secondary">Uploading...</p>
                        </div>
                      ) : formData.resumeUploaded ? (
                        <div className="text-center space-y-1">
                          <Check className="w-5 h-5 text-primary mx-auto" />
                          <p className="text-xs font-semibold text-primary">Resume registered!</p>
                          <p className="text-[9px] text-secondary truncate max-w-[120px] mx-auto">
                            {uploadedFileName || 'resume.pdf'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Upload className="w-5 h-5 text-secondary/60 mx-auto" />
                          <p className="text-xs font-light text-secondary">
                            Click to upload resume
                          </p>
                          <p className="text-[8px] text-secondary/40">Optional for MVP</p>
                        </div>
                      )}
                    </div>

                    {/* Readiness score circular indicator */}
                    <div className="flex flex-col items-center justify-center bg-card border border-border p-4 rounded-2xl min-h-[120px] text-center">
                      <span className="text-xs font-semibold text-secondary/80 block uppercase tracking-wider mb-1">
                        Career Ready
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {readinessData.careerReadinessScore}%
                      </span>
                      <span className="text-[9px] text-secondary/50 block mt-1">
                        Completeness: {readinessData.completionPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Dynamic checklist suggestions */}
                  {suggestionsList.length > 0 && (
                    <div className="p-4 bg-accent/20 border border-border rounded-xl space-y-2">
                      <label className="text-[10px] font-semibold text-secondary/60 uppercase tracking-wide flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 text-primary" />
                        <span>Complete these to improve recommendations:</span>
                      </label>
                      <ul className="space-y-1 text-xs text-secondary font-light pl-1.5 list-disc list-inside">
                        {suggestionsList.map((suggestion) => (
                          <li key={suggestion}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2 text-center pt-2">
                    <h2 className="text-xl font-light">All Set! ✨</h2>
                    <p className="text-xs text-secondary font-light max-w-xs mx-auto">
                      Click the button below to land on your personalized dashboard and discover
                      opportunities.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Wizard Footer Navigation */}
        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur border-t border-border z-20">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            {step > 1 ? (
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

            {step === TOTAL_STEPS ? (
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
                disabled={saving || (step === 2 && !formData.fullName)}
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
