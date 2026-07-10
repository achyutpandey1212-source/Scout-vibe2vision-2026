'use client';

import React, { useState } from 'react';
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
import { mockProfile, UserProfileDetails } from '@/lib/mock';
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
} from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfileDetails>(mockProfile);

  // Intermediate form states
  const [locationVal, setLocationVal] = useState(profile.location);
  const [stageVal, setStageVal] = useState(profile.stage);
  const [newDreamVal, setNewDreamVal] = useState('');
  const [newInterestVal, setNewInterestVal] = useState('');

  const handleSave = () => {
    setProfile((prev) => ({
      ...prev,
      location: locationVal,
      stage: stageVal,
    }));
    setIsEditing(false);
  };

  const handleAddDream = () => {
    if (!newDreamVal.trim()) return;
    setProfile((prev) => ({
      ...prev,
      dreams: [...prev.dreams, newDreamVal.trim()],
    }));
    setNewDreamVal('');
  };

  const handleRemoveDream = (idx: number) => {
    setProfile((prev) => ({
      ...prev,
      dreams: prev.dreams.filter((_, i) => i !== idx),
    }));
  };

  const handleAddInterest = () => {
    if (!newInterestVal.trim()) return;
    setProfile((prev) => ({
      ...prev,
      interests: [...prev.interests, newInterestVal.trim()],
    }));
    setNewInterestVal('');
  };

  const handleRemoveInterest = (item: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.filter((x) => x !== item),
    }));
  };

  const loadingMessages = ['Opening profile vaults...', 'Assembling your preferences...', 'Ready.'];

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <UniversalLoader
            messages={loadingMessages}
            intervalMs={300}
            onComplete={() => setLoading(false)}
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    iconLeft={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              <Grid cols={1} colsMd={12} gap="lg" className="items-start">
                {/* Left Column: Identity & Situation Profile (8 cols) */}
                <div className="md:col-span-8 space-y-6">
                  <Card>
                    <CardContent className="p-6 md:p-8 space-y-6">
                      {/* Identification header */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-b border-border/40 pb-6 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-normal text-2xl border-2 border-primary/20 select-none shrink-0">
                          {profile.name.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <Typography variant="heading-m" className="font-medium">
                            {profile.name}
                          </Typography>
                          <div className="flex items-center gap-2 text-xs text-secondary/70">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{profile.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Situation Fields */}
                      <Grid cols={1} colsSm={2} gap="lg">
                        <Stack gap="xs">
                          <div className="flex items-center gap-2 text-secondary/65 select-none">
                            <MapPin className="w-4 h-4 text-primary" />
                            <Typography variant="label" className="text-[10px]">
                              Location
                            </Typography>
                          </div>
                          {isEditing ? (
                            <TextInput
                              value={locationVal}
                              onChange={(e) => setLocationVal(e.target.value)}
                              placeholder="Enter your location..."
                            />
                          ) : (
                            <Typography variant="body" className="font-normal pl-6">
                              {profile.location}
                            </Typography>
                          )}
                        </Stack>

                        <Stack gap="xs">
                          <div className="flex items-center gap-2 text-secondary/65 select-none">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <Typography variant="label" className="text-[10px]">
                              Career Stage
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
                              {profile.stage}
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
                          {profile.dreams.map((dream, idx) => (
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
                          {profile.interests.map((item) => (
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
                          checked={profile.companionPreferences.dailyBrief}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              companionPreferences: {
                                ...prev.companionPreferences,
                                dailyBrief: !prev.companionPreferences.dailyBrief,
                              },
                            }))
                          }
                        />
                        <Switch
                          label="Weekly digest newsletter"
                          checked={profile.companionPreferences.weeklyDigest}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              companionPreferences: {
                                ...prev.companionPreferences,
                                weeklyDigest: !prev.companionPreferences.weeklyDigest,
                              },
                            }))
                          }
                        />
                      </Stack>

                      <Divider />

                      <Stack gap="sm">
                        <Select
                          label="Scout Explore Frequency"
                          value={profile.companionPreferences.exploreFrequency}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              companionPreferences: {
                                ...prev.companionPreferences,
                                exploreFrequency: e.target.value as any,
                              },
                            }))
                          }
                        >
                          <option value="6h">Every 6 Hours (Recommended)</option>
                          <option value="12h">Every 12 Hours</option>
                          <option value="24h">Daily (24 Hours)</option>
                        </Select>
                      </Stack>

                      <Divider />

                      <Stack gap="sm">
                        <Slider
                          label={`Minimum Match Confidence Score: ${profile.companionPreferences.minimumMatchScore}%`}
                          value={profile.companionPreferences.minimumMatchScore.toString()}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              companionPreferences: {
                                ...prev.companionPreferences,
                                minimumMatchScore: parseInt(e.target.value),
                              },
                            }))
                          }
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
