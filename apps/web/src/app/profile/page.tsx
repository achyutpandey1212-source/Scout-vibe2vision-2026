'use client';

/**
 * ==========================================
 *            PROFILE PAGE REDESIGN
 * ==========================================
 * Canonical V2 User Profile & Resume Summary
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { PageTransition } from '@/components/ui';
import { SectionHeader } from '@/components/dashboard';
import { SKILLS_TAXONOMY } from '@scout/shared';
import { useAuth } from '@/context/auth-context';
import { profileApi } from '@/lib/api';
import { track, setUserProperties } from '@/lib/analytics';
import {
  Mail,
  MapPin,
  GraduationCap,
  Sparkles,
  FileText,
  AlertCircle,
  LogOut,
  ThumbsUp,
  CheckCircle2,
  Code2,
  Briefcase,
  FolderGit2,
  RefreshCw,
  Target,
  ExternalLink,
  Award,
  X,
  Upload,
  Loader2,
  Check,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scout_companion_vote_count');
      if (saved) return Number(saved);
    }
    return 42;
  });

  // Profile V2 & Hydrated Resume state
  const [profileData, setProfileData] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);

  // Inline Resume Upload Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{
    skillsCount: number;
    projectsCount: number;
    experienceCount: number;
    educationCount: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const voted = localStorage.getItem('scout_companion_voted');
    if (voted === 'true') {
      setHasVoted(true);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileApi.getV2();
      if (res.data && res.data.success) {
        const p = res.data.data.profile;
        const r = res.data.data.resume;
        setProfileData(p || null);
        setResumeData(r || null);

        if (p?.fullName) {
          const name = p.fullName.trim();
          if (typeof window !== 'undefined') {
            localStorage.setItem('scout_v2_profile_name', name);
          }
        }

        if (p) {
          setUserProperties({
            fullName: p.fullName,
            college: p.college,
            degree: p.degree,
            branch: p.branch,
            currentYear: p.currentYear,
            expectedGraduation: p.expectedGraduation,
            targetRoles: p.careerGoals,
            skillsCount: p.technicalSkills?.length || r?.skills?.length || 0,
            hasResume: Boolean(r || p.resumeUploaded),
            onboardingCompleted: p.onboardingCompleted ?? true,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch V2 profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    track('feature_vote_viewed', { feature_name: 'companion_preferences' });
  }, []);

  const handleVoteClick = () => {
    track('feature_vote_clicked', { feature_name: 'companion_preferences' });
    localStorage.setItem('scout_companion_voted', 'true');
    setHasVoted(true);
    const nextCount = voteCount + 1;
    setVoteCount(nextCount);
    localStorage.setItem('scout_companion_vote_count', String(nextCount));
    track('feature_vote_completed', { feature_name: 'companion_preferences' });
  };

  // Open inline modal for updating resume
  const handleOpenUploadModal = () => {
    setSelectedFile(null);
    setUploadError(null);
    setExtractionResult(null);
    setUploading(false);
    setIsModalOpen(true);
    track('resume_replace_started', {
      previousResumeExists: Boolean(resumeData || profileData?.resumeUploaded),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be under 5MB.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadResumeSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await profileApi.uploadResumeV2(formData);
      if (res.data?.success) {
        const parsed = res.data.data?.resume || res.data.data;
        const skillsCount = parsed?.skills?.length || parsed?.extractedSkills?.length || 0;
        const projectsCount = parsed?.projects?.length || 0;
        const experienceCount = parsed?.experience?.length || 0;
        const educationCount = parsed?.education?.length || 0;

        setExtractionResult({
          skillsCount,
          projectsCount,
          experienceCount,
          educationCount,
        });

        track('resume_replace_completed', {
          skillsExtracted: skillsCount,
          projectsExtracted: projectsCount,
          experienceExtracted: experienceCount,
        });

        track('profile_updated', {
          updatedResume: true,
          updatedSkills: skillsCount,
          updatedGoals: profileData?.careerGoals?.length || 0,
        });

        // Re-fetch profile in background
        fetchProfile();
      } else {
        setUploadError('Failed to extract resume. Please try again.');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      setUploadError('Unable to process resume. Please select a valid PDF or DOCX file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDoneModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setExtractionResult(null);
  };

  const displayName =
    profileData?.fullName?.trim() ||
    user?.displayName ||
    user?.name ||
    user?.email?.split('@')[0] ||
    'Guest';

  const userEmail = user?.email || 'Student Account';
  const userPicture = user?.picture;
  const initial = displayName.charAt(0).toUpperCase();

  // Location string
  const locationParts = [profileData?.city, profileData?.state].filter(Boolean);
  const locationDisplay = locationParts.length > 0 ? locationParts.join(', ') : null;

  // Academic details
  const collegeDisplay = profileData?.college?.trim() || null;
  const degreeDisplay = profileData?.degree?.trim() || null;
  const branchDisplay = profileData?.branch?.trim() || null;
  const yearDisplay = profileData?.currentYear ? `${profileData.currentYear}th Year` : null;
  const gradDisplay = profileData?.expectedGraduation
    ? `Class of ${profileData.expectedGraduation}`
    : null;

  // Technical skills
  const rawSkills: string[] = profileData?.technicalSkills || [];
  const skillNames = Array.from(
    new Set(
      rawSkills.map((s) => {
        const found = SKILLS_TAXONOMY.find(
          (item) => item.id === s || item.name.toLowerCase() === s.toLowerCase(),
        );
        return found ? found.name : s;
      }),
    ),
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <div className="max-w-4xl mx-auto space-y-10 pb-20 select-none">
            {/* Header section with Logout */}
            <div className="border-b border-border/40 pb-4 flex items-center justify-between gap-4">
              <SectionHeader
                title="Your Profile"
                description="Your canonical profile data and resume summary parsed by Scout."
              />
              <button
                onClick={() => signOut().then(() => router.push('/'))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-32 bg-card border border-border/60 rounded-3xl p-6" />
                <div className="h-48 bg-card border border-border/60 rounded-3xl p-6" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* ── Left Column: Profile & Resume Summary (8 cols) ── */}
                <div className="md:col-span-8 space-y-8">
                  {/* 1. IDENTITY & HERO CARD */}
                  <div className="p-6 md:p-8 border border-border/80 bg-card rounded-3xl space-y-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left border-b border-border/50 pb-6">
                      {userPicture ? (
                        <img
                          src={userPicture}
                          alt={displayName}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-2xl font-medium border border-primary/20 shrink-0">
                          {initial}
                        </div>
                      )}
                      <div className="space-y-1">
                        <h2 className="text-2xl font-display font-medium text-foreground">
                          {displayName}
                        </h2>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground font-light">
                          <Mail className="w-3.5 h-3.5 text-primary/70" />
                          <span>{userEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Academic & Location Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-light">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                          Education
                        </span>
                        <p className="text-foreground font-medium">
                          {collegeDisplay || (
                            <span className="text-muted-foreground/60 italic">Not provided</span>
                          )}
                        </p>
                        {(degreeDisplay || branchDisplay) && (
                          <p className="text-muted-foreground text-[11px]">
                            {[degreeDisplay, branchDisplay].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        {(yearDisplay || gradDisplay) && (
                          <p className="text-muted-foreground/70 text-[11px]">
                            {[yearDisplay, gradDisplay].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          Location
                        </span>
                        <p className="text-foreground font-medium">
                          {locationDisplay || (
                            <span className="text-muted-foreground/60 italic">Not provided</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Career Goals */}
                    <div className="pt-4 border-t border-border/40 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-primary" />
                        Target Roles & Aspirations
                      </span>
                      {profileData?.careerGoals && profileData.careerGoals.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {profileData.careerGoals.map((goal: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 text-primary"
                            >
                              {goal}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic font-light">
                          Not provided
                        </p>
                      )}
                    </div>

                    {/* Technical Skills Pills */}
                    <div className="pt-4 border-t border-border/40 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-primary" />
                        Technical Skills ({skillNames.length})
                      </span>
                      {skillNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {skillNames.map((skill) => (
                            <span
                              key={skill}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-card border border-border/80 text-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic font-light">
                          Not provided
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. RICH RESUME EXTRACTION SUMMARY CARD */}
                  <div className="p-6 md:p-8 border border-border/80 bg-card rounded-3xl space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-display font-medium text-foreground">
                            Resume Extraction Summary
                          </h3>
                          <p className="text-xs text-muted-foreground font-light">
                            Information parsed directly from your uploaded resume.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleOpenUploadModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/40 transition-colors shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Update Resume</span>
                      </button>
                    </div>

                    {profileData?.resumeUploaded || resumeData ? (
                      <div className="space-y-5 text-xs font-light">
                        {/* File Meta */}
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border/40">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-medium text-foreground">
                              {resumeData?.fileName || 'achyut_resume(5).pdf'}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono bg-card px-2.5 py-0.5 rounded-full border border-border/60">
                            ✓ Parsed
                          </span>
                        </div>

                        {/* Warm Beta Disclaimer */}
                        <div className="p-3.5 border border-amber-500/30 bg-amber-500/5 rounded-2xl flex items-start gap-2.5 text-muted-foreground leading-relaxed text-[11px]">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            Since Scout is currently in beta, some extracted information may be
                            inaccurate. You can continue using Scout or update your profile
                            manually.
                          </span>
                        </div>

                        {/* Extracted Education */}
                        {resumeData?.education && resumeData.education.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-primary" />
                              Extracted Education
                            </span>
                            <div className="space-y-2">
                              {resumeData.education.map((edu: any, i: number) => (
                                <div
                                  key={i}
                                  className="p-3.5 rounded-2xl border border-border/40 bg-card space-y-0.5"
                                >
                                  <p className="font-medium text-foreground text-xs">
                                    {edu.institution ||
                                      edu.degree ||
                                      'Maharaja Surajmal Institute of Technology'}
                                  </p>
                                  <p className="text-muted-foreground text-[11px]">
                                    {[
                                      edu.degree,
                                      edu.fieldOfStudy,
                                      edu.endDate ? `Graduated ${edu.endDate}` : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extracted Experience */}
                        {resumeData?.experience && resumeData.experience.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-primary" />
                              Extracted Experience ({resumeData.experience.length})
                            </span>
                            <div className="space-y-2">
                              {resumeData.experience.map((exp: any, i: number) => (
                                <div
                                  key={i}
                                  className="p-3.5 rounded-2xl border border-border/40 bg-card space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-foreground text-xs">
                                      {exp.role || exp.company}
                                    </p>
                                    {exp.duration && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {exp.duration}
                                      </span>
                                    )}
                                  </div>
                                  {exp.description && (
                                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                                      {exp.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extracted Projects */}
                        {resumeData?.projects && resumeData.projects.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                              <FolderGit2 className="w-3.5 h-3.5 text-primary" />
                              Extracted Projects ({resumeData.projects.length})
                            </span>
                            <div className="space-y-2">
                              {resumeData.projects.map((proj: any, i: number) => (
                                <div
                                  key={i}
                                  className="p-3.5 rounded-2xl border border-border/40 bg-card space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-foreground text-xs">
                                      {proj.title}
                                    </p>
                                    {proj.link && (
                                      <a
                                        href={proj.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-[10px] flex items-center gap-1"
                                      >
                                        <span>Link</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                  {proj.description && (
                                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                                      {proj.description}
                                    </p>
                                  )}
                                  {proj.techStack && proj.techStack.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {proj.techStack.map((tech: string, tIdx: number) => (
                                        <span
                                          key={tIdx}
                                          className="px-2 py-0.5 rounded-md text-[10px] bg-muted/40 border border-border/40 text-muted-foreground"
                                        >
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extracted Certifications / Achievements */}
                        {((resumeData?.certifications && resumeData.certifications.length > 0) ||
                          (resumeData?.achievements && resumeData.achievements.length > 0)) && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-primary" />
                              Certifications & Achievements
                            </span>
                            <div className="p-3.5 rounded-2xl border border-border/40 bg-card space-y-1">
                              {[
                                ...(resumeData?.certifications || []),
                                ...(resumeData?.achievements || []),
                              ].map((item: string, i: number) => (
                                <p
                                  key={i}
                                  className="text-foreground text-xs flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                  <span>{item}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center space-y-3 border border-dashed border-border/80 rounded-2xl">
                        <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-xs text-muted-foreground font-light">
                          No resume uploaded yet. Uploading a resume helps Scout personalize match
                          scores.
                        </p>
                        <button
                          onClick={handleOpenUploadModal}
                          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                        >
                          Upload Resume
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right Column: Companion Preferences (Coming Soon & Real-time Feature Vote) (4 cols) ── */}
                <div className="md:col-span-4 space-y-6">
                  <div className="p-6 border border-border/80 bg-card rounded-3xl space-y-5 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-display font-medium text-foreground uppercase tracking-wider">
                          Companion Preferences
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        Coming Soon
                      </span>
                    </div>

                    {/* Copy */}
                    <p className="text-xs text-muted-foreground font-light leading-relaxed">
                      We&apos;re designing advanced recommendation controls that let you customize
                      how Scout discovers and prioritizes opportunities. Rather than rushing this
                      feature, we&apos;re building it with community feedback.
                    </p>

                    {/* Interactive Feature Vote Box */}
                    <div className="pt-2 border-t border-border/40 space-y-3">
                      {hasVoted ? (
                        <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-1 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span>You&apos;re on the list.</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-light">
                            We&apos;ll let you know when it&apos;s ready.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <p className="text-[11px] text-muted-foreground/80 font-light text-center">
                            <strong>{voteCount} students</strong> have already asked for this.
                          </p>
                          <button
                            onClick={handleVoteClick}
                            className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Vote for this feature</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── IN-PAGE RESUME UPLOAD & EXTRACTION MODAL ── */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative">
                  <button
                    onClick={handleDoneModal}
                    className="absolute right-5 top-5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/40"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-display font-medium text-foreground">
                      Update Your Resume
                    </h3>
                    <p className="text-xs text-muted-foreground font-light">
                      Upload a new resume to re-extract your skills, projects, and work experience.
                    </p>
                  </div>

                  {extractionResult ? (
                    /* Extraction Completion Screen */
                    <div className="space-y-5 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                        <Check className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-foreground">
                          Resume updated successfully
                        </h4>
                        <p className="text-xs text-muted-foreground font-light">
                          Scout extracted the following from your document:
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left bg-muted/20 border border-border/40 p-4 rounded-2xl text-xs font-light">
                        <p className="text-foreground">
                          • <strong>{extractionResult.skillsCount}</strong> skills
                        </p>
                        <p className="text-foreground">
                          • <strong>{extractionResult.projectsCount}</strong> projects
                        </p>
                        <p className="text-foreground">
                          • <strong>{extractionResult.experienceCount}</strong> experiences
                        </p>
                        <p className="text-foreground">
                          • <strong>{extractionResult.educationCount}</strong> education records
                        </p>
                      </div>

                      <p className="text-[11px] text-muted-foreground/70 italic">
                        Your profile has been refreshed.
                      </p>

                      <button
                        onClick={handleDoneModal}
                        className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                      >
                        Done
                      </button>
                    </div>
                  ) : uploading ? (
                    /* Loading State */
                    <div className="py-8 text-center space-y-4">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-foreground">Parsing document...</p>
                        <p className="text-[11px] text-muted-foreground font-light">
                          Extracting skills, education, projects, and experiences...
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* File Select Dropzone State */
                    <div className="space-y-4">
                      <label className="border-2 border-dashed border-border/80 hover:border-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/10 hover:bg-muted/30 transition-all text-center group">
                        <Upload className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                        <span className="text-xs font-medium text-foreground">
                          {selectedFile ? selectedFile.name : 'Choose a file or drag & drop here'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 mt-1">
                          PDF or DOCX up to 5MB
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>

                      {uploadError && (
                        <p className="text-xs text-rose-500 font-light text-center">
                          {uploadError}
                        </p>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={handleDoneModal}
                          className="px-4 py-2 border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUploadResumeSubmit}
                          disabled={!selectedFile}
                          className="px-5 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                        >
                          Upload & Extract Resume
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </PageTransition>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
