'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import {
  Typography,
  Stack,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  UniversalLoader,
  Button,
  TextInput,
  Chip,
  Switch,
  Slider,
  Select,
  Divider,
  PageTransition,
} from '@/components/ui';
import {
  Mail,
  MapPin,
  Award,
  Edit2,
  Check,
  Plus,
  Trash2,
  Settings,
  ShieldCheck,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { profileApi } from '@/lib/api';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Full DB Profile State
  const [rawProfile, setRawProfile] = useState<any>(null);

  // Layout presentation bindings
  const [name, setName] = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [stageVal, setStageVal] = useState('');
  const [dreams, setDreams] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  // Companion Settings bindings
  const [dailyBrief, setDailyBrief] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [exploreFrequency, setExploreFrequency] = useState<'6h' | '12h' | '24h'>('6h');
  const [minimumMatchScore, setMinimumMatchScore] = useState(75);

  // Temporary Form additions
  const [newDreamVal, setNewDreamVal] = useState('');
  const [newInterestVal, setNewInterestVal] = useState('');

  const fetchProfile = async () => {
    try {
      setError(null);
      const res = await profileApi.get();
      if (res.data?.success) {
        const p = res.data.data;
        setRawProfile(p);

        // Map database fields to the UI schema
        setName(
          p.identity?.preferredName || user?.displayName || user?.email?.split('@')[0] || 'User',
        );
        setLocationVal(p.educationDetail?.college || 'New Delhi, India');
        setStageVal(p.educationDetail?.course || 'Final Year BCA Student');
        setDreams(
          p.whyHere && p.whyHere.length > 0
            ? p.whyHere
            : [
                'Secure a full-time product engineering role at a design-driven tech company.',
                'Build applications that solve real information inequality problems.',
              ],
        );
        setInterests(
          p.workPreferences && p.workPreferences.length > 0
            ? p.workPreferences
            : ['React JS', 'Node JS', 'UI Design'],
        );
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
      setError('Unable to synchronize profile parameters. Please retry.');
    }
  };

  const handleSave = async () => {
    if (!rawProfile) return;
    try {
      const updatedProfile = {
        ...rawProfile,
        identity: {
          ...rawProfile.identity,
          preferredName: name,
        },
        educationDetail: {
          ...rawProfile.educationDetail,
          college: locationVal,
          course: stageVal,
        },
        whyHere: dreams,
        workPreferences: interests,
      };

      const res = await profileApi.update(updatedProfile);
      if (res.data?.success) {
        setRawProfile(res.data.data);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile changes:', err);
      setError('Failed to update profile changes on backend. Retrying.');
    }
  };

  const handleAddDream = () => {
    if (!newDreamVal.trim()) return;
    setDreams((prev) => [...prev, newDreamVal.trim()]);
    setNewDreamVal('');
  };

  const handleRemoveDream = (idx: number) => {
    setDreams((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddInterest = () => {
    if (!newInterestVal.trim()) return;
    setInterests((prev) => [...prev, newInterestVal.trim()]);
    setNewInterestVal('');
  };

  const handleRemoveInterest = (item: string) => {
    setInterests((prev) => prev.filter((x) => x !== item));
  };

  const loadingMessages = ['Opening profile vaults...', 'Assembling your preferences...', 'Ready.'];

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={300}
            onComplete={() => {
              fetchProfile().then(() => setLoading(false));
            }}
          />
        </div>
      ) : (
        <DashboardLayout>
          <PageTransition>
            <Stack gap="lg" className="w-full">
              {/* Header section with Edit toggle */}
              <div className="border-b border-border/40 pb-3 flex items-center justify-between gap-4">
                <Stack gap="xxs">
                  <Typography variant="heading-l" className="font-normal">
                    Your Profile
                  </Typography>
                  <Typography variant="caption" className="text-secondary/60">
                    Scout parses these details to match high-relevance opportunities.
                  </Typography>
                </Stack>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      iconLeft={<Check className="w-3.5 h-3.5" />}
                    >
                      Save Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        iconLeft={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut().then(() => router.push('/'))}
                        iconLeft={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        Logout
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-6 rounded-3xl border border-rose-200/50 bg-rose-50/30 dark:bg-rose-950/10 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <Typography variant="heading-s" className="text-sm font-medium text-foreground">
                      Profile Sync Issue
                    </Typography>
                    <Typography variant="body" className="text-xs text-secondary/80 font-light">
                      {error}
                    </Typography>
                  </div>
                </div>
              )}

              <Grid cols={1} colsMd={12} gap="lg" className="items-start">
                {/* Left Column: Identity & Situation Profile (8 cols) */}
                <div className="md:col-span-8 space-y-6">
                  <Card>
                    <CardContent className="p-6 md:p-8 space-y-6">
                      {/* Identification header */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-b border-border/40 pb-6 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-normal text-2xl border-2 border-primary/20 select-none shrink-0">
                          {name.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          {isEditing ? (
                            <TextInput
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Name"
                            />
                          ) : (
                            <Typography variant="heading-m" className="font-medium">
                              {name}
                            </Typography>
                          )}
                          <div className="flex items-center gap-2 text-xs text-secondary/70">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{user?.email || 'email@example.com'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Situation Fields */}
                      <Grid cols={1} colsSm={2} gap="lg">
                        <Stack gap="xs">
                          <div className="flex items-center gap-2 text-secondary/65 select-none">
                            <MapPin className="w-4 h-4 text-primary" />
                            <Typography variant="label" className="text-[10px]">
                              Location (College)
                            </Typography>
                          </div>
                          {isEditing ? (
                            <TextInput
                              value={locationVal}
                              onChange={(e) => setLocationVal(e.target.value)}
                              placeholder="Enter your location/college..."
                            />
                          ) : (
                            <Typography variant="body" className="font-normal pl-6">
                              {locationVal}
                            </Typography>
                          )}
                        </Stack>

                        <Stack gap="xs">
                          <div className="flex items-center gap-2 text-secondary/65 select-none">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <Typography variant="label" className="text-[10px]">
                              Career Stage (Course)
                            </Typography>
                          </div>
                          {isEditing ? (
                            <TextInput
                              value={stageVal}
                              onChange={(e) => setStageVal(e.target.value)}
                              placeholder="BCA/MCA/Homemaker etc..."
                            />
                          ) : (
                            <Typography variant="body" className="font-normal pl-6">
                              {stageVal}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>

                      <Divider />

                      {/* Dreams & Aspirations */}
                      <Stack gap="sm">
                        <div className="flex items-center gap-1.5 text-secondary/65 select-none">
                          <Award className="w-4 h-4 text-primary" />
                          <Typography variant="label" className="text-[10px]">
                            Dreams & Aspirations
                          </Typography>
                        </div>

                        {/* Edit addition field */}
                        {isEditing && (
                          <Stack direction="row" gap="xs" align="center" className="w-full">
                            <TextInput
                              value={newDreamVal}
                              onChange={(e) => setNewDreamVal(e.target.value)}
                              placeholder="Add a new dream/aspiration statement..."
                              className="flex-1"
                            />
                            <Button
                              variant="secondary"
                              onClick={handleAddDream}
                              square
                              aria-label="Add dream"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </Stack>
                        )}

                        <ul className="space-y-3.5 pl-6 list-disc text-sm font-light text-foreground/80 leading-relaxed">
                          {dreams.map((dream, idx) => (
                            <li key={idx} className="relative group">
                              <span>{dream}</span>
                              {isEditing && (
                                <button
                                  onClick={() => handleRemoveDream(idx)}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-secondary/40 hover:text-destructive hover:bg-accent/40 rounded-full transition-colors"
                                  title="Remove dream"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </Stack>

                      <Divider />

                      {/* Interests tags list */}
                      <Stack gap="sm">
                        <Typography
                          variant="label"
                          className="text-[10px] text-secondary/60 block select-none"
                        >
                          Interests Tagged
                        </Typography>

                        {isEditing && (
                          <Stack
                            direction="row"
                            gap="xs"
                            align="center"
                            className="w-full max-w-sm"
                          >
                            <TextInput
                              value={newInterestVal}
                              onChange={(e) => setNewInterestVal(e.target.value)}
                              placeholder="Add interest tag..."
                              className="flex-1"
                            />
                            <Button
                              variant="secondary"
                              onClick={handleAddInterest}
                              square
                              aria-label="Add interest"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </Stack>
                        )}

                        <div className="flex flex-wrap gap-2.5">
                          {interests.map((item) => (
                            <Chip
                              key={item}
                              label={item}
                              selected
                              onRemove={isEditing ? () => handleRemoveInterest(item) : undefined}
                            />
                          ))}
                        </div>
                      </Stack>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Companion Settings (4 cols) */}
                <div className="md:col-span-4 space-y-6">
                  <Card>
                    <CardHeader className="border-b border-border/40 pb-4">
                      <Stack gap="xxs">
                        <div className="flex items-center gap-1.5 text-primary select-none">
                          <Settings className="w-4 h-4" />
                          <Typography variant="label" className="text-[10px] text-primary">
                            Companion preferences
                          </Typography>
                        </div>
                        <CardTitle className="text-base font-medium">Scout Settings</CardTitle>
                      </Stack>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <Stack gap="sm">
                        <Typography
                          variant="label"
                          className="text-[10px] text-secondary/50 block select-none"
                        >
                          Notifications Briefs
                        </Typography>
                        <Switch
                          label="Receive daily match summaries"
                          checked={dailyBrief}
                          onChange={() => setDailyBrief(!dailyBrief)}
                        />
                        <Switch
                          label="Weekly digest newsletter"
                          checked={weeklyDigest}
                          onChange={() => setWeeklyDigest(!weeklyDigest)}
                        />
                      </Stack>

                      <Divider />

                      <Stack gap="sm">
                        <Select
                          label="Scout Explore Frequency"
                          value={exploreFrequency}
                          onChange={(e) => setExploreFrequency(e.target.value as any)}
                        >
                          <option value="6h">Every 6 Hours (Recommended)</option>
                          <option value="12h">Every 12 Hours</option>
                          <option value="24h">Daily (24 Hours)</option>
                        </Select>
                      </Stack>

                      <Divider />

                      <Stack gap="sm">
                        <Slider
                          label={`Minimum Match Confidence Score: ${minimumMatchScore}%`}
                          value={minimumMatchScore.toString()}
                          onChange={(e) => setMinimumMatchScore(parseInt(e.target.value))}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </div>
              </Grid>
            </Stack>
          </PageTransition>
        </DashboardLayout>
      )}
    </ProtectedRoute>
  );
}
