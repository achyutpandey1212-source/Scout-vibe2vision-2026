'use client';

import React, { useState } from 'react';
import {
  Typography,
  Container,
  Section,
  PageWrapper,
  Stack,
  Grid,
  Divider,
  Button,
  TextInput,
  SearchInput,
  Textarea,
  Switch,
  Checkbox,
  Radio,
  Select,
  Chip,
  Slider,
  ProgressStep,
  Dialog,
  Drawer,
  Alert,
  Skeleton,
  Toast,
  HonestLoadingState,
  OrigamiDecoration,
  CornerDecoration,
  BackgroundAccent,
  TopNavigation,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui';

import {
  OpportunityCard,
  FeaturedOpportunityCard,
  HiddenGemCard,
  MatchScore,
  OpportunityBadge,
} from '@/components/opportunity';

import { DashboardHero, ScoutIntelligencePanel, RecommendationStrip } from '@/components/dashboard';

import { ProfileCard } from '@/components/profile';
import { Info, Send, Trash2, ArrowRight } from 'lucide-react';
import { tokens } from '@/lib/design-tokens';

export default function DesignSystemPlayground() {
  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Form input states
  const [searchValue, setSearchValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [switchChecked, setSwitchChecked] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioSelected, setRadioSelected] = useState('one');
  const [chipSelected, setChipSelected] = useState(true);
  const [sliderVal, setSliderVal] = useState('50');

  // Loading Simulation state
  const [simulatingLoading, setSimulatingLoading] = useState(false);

  // Toast simulations
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: any }[]>([]);

  const addToast = (msg: string, type: any) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const stepsList = [
    'Exploring newly updated web sources...',
    'Understanding profile aspirations...',
    'Filtering for target fit and preferences...',
    'Ranking high-relevance matches...',
    'Almost finished...',
  ];

  return (
    <PageWrapper>
      {/* Top Navbar layout */}
      <TopNavigation
        userName="Maya Sharma"
        isAuthenticated={true}
        onSearchClick={() => addToast('Search Palette trigger simulation', 'info')}
        onNotificationsClick={() => addToast('Notifications panel simulation', 'success')}
        onProfileClick={() => addToast('Profile overlay settings', 'info')}
      />

      <BackgroundAccent />
      <CornerDecoration name="crane" position="top-right" size={150} />
      <CornerDecoration name="butterfly" position="bottom-left" size={120} />

      <Container size="xl" className="py-12 relative z-10 space-y-16">
        {/* Intro Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-secondary/90 tracking-wide uppercase font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Styleguide & Component Library</span>
          </div>
          <Typography variant="display">
            Premium <span className="font-normal text-primary">UI Foundation</span>
          </Typography>
          <Typography variant="body-large" className="text-secondary/70">
            A production-ready design system built specifically for Zenkai Scout. Clean, quiet,
            responsive, and editorial.
          </Typography>
        </section>

        {/* 1. TYPOGRAPHY */}
        <Stack gap="md">
          <Typography variant="heading-l">1. Editorial Typography</Typography>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-1">
                <Typography variant="label">Display style</Typography>
                <Typography variant="display">Scout design system</Typography>
              </div>
              <Divider />
              <div className="space-y-1">
                <Typography variant="label">Hero style</Typography>
                <Typography variant="hero">Opportunities found while you sleep.</Typography>
              </div>
              <Divider />
              <div className="space-y-1">
                <Typography variant="label">Heading XL</Typography>
                <Typography variant="heading-xl">Empowering every talented woman.</Typography>
              </div>
              <Divider />
              <div className="space-y-1">
                <Typography variant="label">Heading L</Typography>
                <Typography variant="heading-l">A calm, trustworthy companion.</Typography>
              </div>
              <Divider />
              <div className="space-y-1">
                <Typography variant="label">Heading M</Typography>
                <Typography variant="heading-m">What deserves your attention today?</Typography>
              </div>
              <Divider />
              <div className="space-y-1">
                <Typography variant="label">Heading S</Typography>
                <Typography variant="heading-s">Featured Opportunity</Typography>
              </div>
              <Divider />
              <div className="space-y-1">
                <Typography variant="label">Body Large & Regular</Typography>
                <Typography variant="body-large">
                  This is large body copy used for introductions.
                </Typography>
                <Typography variant="body">
                  This is standard body copy used for descriptions, insights, and structural
                  paragraphs. It uses Inter with a light/normal font weight for optimal legibility.
                </Typography>
              </div>
              <Divider />
              <div className="space-y-1">
                <Typography variant="label">Caption, Label & Code</Typography>
                <div className="flex flex-wrap items-center gap-4">
                  <Typography variant="caption">Apply before October 24</Typography>
                  <Typography variant="label">Women Preferred</Typography>
                  <Typography variant="code">const scout = new OpportunityEngine();</Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Stack>

        {/* 2. BUTTONS */}
        <Stack gap="md">
          <Typography variant="heading-l">2. Button Systems</Typography>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <Stack gap="sm">
                <Typography variant="label">Standard Variants</Typography>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="text">Text Button</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="success">Success</Button>
                </div>
              </Stack>

              <Divider />

              <Stack gap="sm">
                <Typography variant="label">Interactive Button States</Typography>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary" loading>
                    Loading State
                  </Button>
                  <Button variant="secondary" disabled>
                    Disabled Button
                  </Button>
                  <Button variant="primary" iconLeft={<Send className="w-3.5 h-3.5" />}>
                    Left Icon
                  </Button>
                  <Button variant="secondary" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                    Right Icon
                  </Button>
                  <Button variant="outline" square aria-label="Delete">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* 3. INPUT SYSTEMS */}
        <Stack gap="md">
          <Typography variant="heading-l">3. Input Controls</Typography>
          <Card>
            <CardContent className="pt-6">
              <Grid cols={1} colsMd={2} gap="lg">
                <Stack gap="lg">
                  <TextInput
                    label="Full Name"
                    placeholder="Enter your name..."
                    helperText="We will address you by this name in your daily brief."
                  />

                  <TextInput
                    label="Email Address"
                    type="email"
                    value="invalid-email"
                    error="Please enter a valid email address."
                    onChange={() => {}}
                  />

                  <SearchInput
                    placeholder="Search query planner..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onClear={() => setSearchValue('')}
                  />

                  <Textarea
                    label="Tell us about your aspirations"
                    placeholder="Write a brief paragraph..."
                  />
                </Stack>

                <Stack gap="lg">
                  <Select label="Preferred Internship Type">
                    <option>Select work type...</option>
                    <option>Remote Work</option>
                    <option>On-site Office</option>
                    <option>Hybrid Schedule</option>
                  </Select>

                  <div className="space-y-3 pt-2">
                    <Typography variant="label" className="block mb-2">
                      Toggle switches
                    </Typography>
                    <div className="flex flex-col gap-3">
                      <Switch
                        label="Receive daily notification briefs"
                        checked={switchChecked}
                        onChange={() => setSwitchChecked(!switchChecked)}
                      />
                      <Checkbox
                        label="Agree to privacy policy details"
                        checked={checkboxChecked}
                        onChange={() => setCheckboxChecked(!checkboxChecked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Typography variant="label" className="block mb-2">
                      Radio Selection
                    </Typography>
                    <div className="flex gap-4">
                      <Radio
                        label="Option One"
                        name="test-radio"
                        checked={radioSelected === 'one'}
                        onChange={() => setRadioSelected('one')}
                      />
                      <Radio
                        label="Option Two"
                        name="test-radio"
                        checked={radioSelected === 'two'}
                        onChange={() => setRadioSelected('two')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Typography variant="label" className="block">
                      Interactive Chips
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        label="Python Programming"
                        selected={chipSelected}
                        onClick={() => setChipSelected(!chipSelected)}
                      />
                      <Chip label="UI Design" selected={false} />
                      <Chip
                        label="React Web"
                        selected={true}
                        onRemove={() => addToast('Removed tag', 'info')}
                      />
                    </div>
                  </div>

                  <Slider
                    label={`Recommendation Confidence Threshold: ${sliderVal}%`}
                    value={sliderVal}
                    onChange={(e) => setSliderVal(e.target.value)}
                  />
                </Stack>
              </Grid>

              <Divider label="Progress Tracker Steps" />
              <div className="py-2">
                <ProgressStep
                  steps={['Personal Profile', 'Interests Selection', 'Recommendations Feed']}
                  currentStep={1}
                />
              </div>
            </CardContent>
          </Card>
        </Stack>

        {/* 4. OVERLAYS & MODALS */}
        <Stack gap="md">
          <Typography variant="heading-l">4. Overlays & Overlay Panels</Typography>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
                  Open Dialog Modal
                </Button>
                <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                  Open Right Drawer
                </Button>
                <Button variant="secondary" onClick={() => setIsBottomSheetOpen(true)}>
                  Open Bottom Sheet
                </Button>
              </div>

              {/* Dialog Modal markup */}
              <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title="Scout Intelligence Matching Summary"
              >
                <div className="space-y-4">
                  <Typography variant="body">
                    We compare your profile variables (skills, preferences, availability, locations)
                    with extracted opportunity tags.
                  </Typography>
                  <Typography variant="body">
                    A match score above 85% is flagged as a Top Recommendation. Lower competition
                    items are highlighted as Hidden Gems.
                  </Typography>
                  <div className="pt-4 flex justify-end">
                    <Button variant="primary" onClick={() => setIsDialogOpen(false)}>
                      I understand
                    </Button>
                  </div>
                </div>
              </Dialog>

              {/* Right Drawer panel */}
              <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Filters Details"
                position="right"
              >
                <div className="space-y-6 pt-4">
                  <Select label="Filter by Type">
                    <option>All Types</option>
                    <option>Internships</option>
                    <option>Scholarships</option>
                  </Select>
                  <Select label="Filter by Target Audience">
                    <option>All Audiences</option>
                    <option>Engineering Students</option>
                    <option>Self-taught developers</option>
                  </Select>
                  <div className="pt-8 flex gap-3">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      Apply Filters
                    </Button>
                    <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Drawer>

              {/* Bottom Sheet panel */}
              <Drawer
                isOpen={isBottomSheetOpen}
                onClose={() => setIsBottomSheetOpen(false)}
                title="Quick Action"
                position="bottom"
              >
                <div className="space-y-4 pb-6">
                  <Typography variant="body">
                    Would you like to bookmark all matched opportunities found in this run?
                  </Typography>
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setIsBottomSheetOpen(false);
                        addToast('Saved all matches', 'success');
                      }}
                    >
                      Yes, Save All
                    </Button>
                    <Button variant="ghost" onClick={() => setIsBottomSheetOpen(false)}>
                      No, Cancel
                    </Button>
                  </div>
                </div>
              </Drawer>
            </CardContent>
          </Card>
        </Stack>

        {/* 5. FEEDBACK SYSTEMS */}
        <Stack gap="md">
          <Typography variant="heading-l">5. Feedback & Dynamic Loaders</Typography>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <Stack gap="sm">
                <Typography variant="label">Status Banner Messages</Typography>
                <Grid cols={1} colsMd={2} gap="md">
                  <Alert variant="info" title="System Notice">
                    Scout is currently indexing new scholarships from 14 global web sources. Your
                    dashboard will refresh automatically.
                  </Alert>
                  <Alert variant="success" title="Profile Saved">
                    Conversational onboarding is complete. AI has successfully formulated your
                    personal target criteria profile.
                  </Alert>
                  <Alert variant="warning" title="Closer Deadline">
                    The Adobe Women-in-Tech Scholarship closes applications in 3 days. We recommend
                    applying soon.
                  </Alert>
                  <Alert variant="error" title="Ingestion Failure">
                    Something went wrong while connecting to the verification API endpoint. Please
                    check your credentials and try again.
                  </Alert>
                </Grid>
              </Stack>

              <Divider />

              <Stack gap="sm">
                <Typography variant="label">Toast Notification triggers</Typography>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    onClick={() => addToast('Successfully bookmarked opportunity', 'success')}
                  >
                    Trigger Success Toast
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addToast('Network credentials missing', 'error')}
                  >
                    Trigger Error Toast
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addToast('Check application deadlines soon', 'warning')}
                  >
                    Trigger Warning Toast
                  </Button>
                </div>
              </Stack>

              <Divider />

              <Grid cols={1} colsMd={2} gap="lg">
                <Stack gap="sm">
                  <Typography variant="label">Shimmer skeleton mock items</Typography>
                  <div className="border border-border/60 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-1/4 rounded-full" />
                      <Skeleton className="h-8 w-1/3 rounded-full" />
                    </div>
                  </div>
                </Stack>

                <Stack gap="sm">
                  <Typography variant="label">Honest Loading simulator</Typography>
                  <div className="border border-border/60 p-6 rounded-3xl flex flex-col items-start min-h-[220px] justify-between">
                    {simulatingLoading ? (
                      <HonestLoadingState
                        steps={stepsList}
                        intervalMs={1000}
                        onComplete={() => {
                          setSimulatingLoading(false);
                          addToast('Discovery loading mock simulation finished', 'success');
                        }}
                      />
                    ) : (
                      <div className="space-y-4">
                        <Typography variant="body" className="text-secondary/70">
                          Click below to simulate how Scout provides transparency during heavy
                          database operations.
                        </Typography>
                        <Button variant="primary" onClick={() => setSimulatingLoading(true)}>
                          Start Load Simulator
                        </Button>
                      </div>
                    )}
                  </div>
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </Stack>

        {/* 6. BRANDED BUSINESS COMPONENTS */}
        <Stack gap="md">
          <Typography variant="heading-l">6. Presentational Business UI Components</Typography>

          <Stack gap="lg">
            {/* Dashboard blocks */}
            <Typography variant="label" className="text-secondary/50 block">
              Dashboard Headers & Summary stats
            </Typography>
            <DashboardHero userName="Maya" />

            <ScoutIntelligencePanel />

            {/* Featured and Opportunity Cards */}
            <Typography variant="label" className="text-secondary/50 block">
              Scout Opportunities cards layout
            </Typography>
            <FeaturedOpportunityCard
              title="Women Techmakers Scholars Program 2026"
              organization="Google India"
              description="Google WTM scholars are awarded financial support to cover tuition fees, participate in developer workshops, and receive mentorship from senior Google engineers to accelerate their programming careers."
              deadline="July 25, 2026"
              matchScore={96}
              tags={['Engineering', 'Scholarship', 'Mentorship']}
              isBookmarked={true}
              onBookmarkToggle={() => addToast('Bookmark Toggled', 'success')}
              onApplyClick={() => addToast('Apply Navigation Link', 'info')}
            />

            <RecommendationStrip
              title="Hidden Gems for You"
              description="High matches with lower application competition indices."
            >
              <HiddenGemCard
                title="Grace Hopper Travel Grant"
                organization="AnitaB.org"
                matchScore={91}
                isBookmarked={false}
                onBookmarkToggle={() => addToast('Bookmark Toggled', 'success')}
                onApplyClick={() => addToast('Apply navigation link', 'info')}
              />
              <HiddenGemCard
                title="WeTech Qualcomm Scholarship"
                organization="IIE Global"
                matchScore={88}
                isBookmarked={true}
                onBookmarkToggle={() => addToast('Bookmark Toggled', 'success')}
                onApplyClick={() => addToast('Apply navigation link', 'info')}
              />
              <HiddenGemCard
                title="Society of Women Engineers Grant"
                organization="SWE Headquarters"
                matchScore={85}
                isBookmarked={false}
                onBookmarkToggle={() => addToast('Bookmark Toggled', 'success')}
                onApplyClick={() => addToast('Apply navigation link', 'info')}
              />
            </RecommendationStrip>

            <Grid cols={1} colsMd={3} gap="md">
              <OpportunityCard
                title="Software Engineer Intern (MERN)"
                organization="Zenkai Labs"
                deadline="August 12, 2026"
                tags={['React', 'NodeJS']}
                matchScore={89}
                isWomenOnly={true}
                stipend="₹45,000/mo"
                onBookmarkToggle={() => addToast('Bookmark Toggled', 'success')}
                onApplyClick={() => addToast('Apply navigation link', 'info')}
              />
              <OpportunityCard
                title="Product Management Fellow"
                organization="Notion HQ"
                deadline="July 31, 2026"
                tags={['Product', 'Remote']}
                matchScore={82}
                isWomenOnly={false}
                stipend="$4,000/mo"
                onBookmarkToggle={() => addToast('Bookmark Toggled', 'success')}
                onApplyClick={() => addToast('Apply navigation link', 'info')}
              />
              <OpportunityCard
                title="Research Fellowship Program"
                organization="Microsoft Research"
                deadline="August 18, 2026"
                tags={['AI Research', 'Python']}
                matchScore={78}
                isWomenOnly={false}
                onBookmarkToggle={() => addToast('Bookmark Toggled', 'success')}
                onApplyClick={() => addToast('Apply navigation link', 'info')}
              />
            </Grid>

            {/* Profile UI Card */}
            <Typography variant="label" className="text-secondary/50 block">
              Profile settings and summary cards
            </Typography>
            <ProfileCard
              name="Maya Sharma"
              email="maya.sharma@tier3college.edu"
              location="New Delhi, India"
              stage="Final Year BCA Student"
              skills={['React JS', 'Node JS', 'Python', 'Tailwind CSS', 'Mongo DB', 'UI Design']}
              goals={[
                'Secure a full-time MERN software engineering internship by end of year.',
                'Discover mentorship opportunities focused on product engineering.',
                'Explore scholarships supporting women developers in Asia Pacific.',
              ]}
            />
          </Stack>
        </Stack>

        {/* 7. DECORATIVE ASSETS SHOWCASE */}
        <Stack gap="md">
          <Typography variant="heading-l">7. Origami Assets Showcase</Typography>
          <Card>
            <CardContent className="pt-6">
              <Grid cols={3} colsSm={6} gap="lg" className="text-center">
                <Stack align="center" gap="xs">
                  <OrigamiDecoration name="crane" size={60} floating />
                  <Typography variant="caption">Crane</Typography>
                </Stack>
                <Stack align="center" gap="xs">
                  <OrigamiDecoration name="butterfly" size={60} floating floatingDuration={5} />
                  <Typography variant="caption">Butterfly</Typography>
                </Stack>
                <Stack align="center" gap="xs">
                  <OrigamiDecoration name="lotus" size={60} floating floatingDuration={6} />
                  <Typography variant="caption">Lotus</Typography>
                </Stack>
                <Stack align="center" gap="xs">
                  <OrigamiDecoration name="compass" size={60} floating />
                  <Typography variant="caption">Compass</Typography>
                </Stack>
                <Stack align="center" gap="xs">
                  <OrigamiDecoration name="paper_airplane" size={60} floating floatingOffset={8} />
                  <Typography variant="caption">Plane</Typography>
                </Stack>
                <Stack align="center" gap="xs">
                  <OrigamiDecoration name="blooming_seed" size={60} floating />
                  <Typography variant="caption">Seed</Typography>
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Footer layout */}
      <footer className="w-full border-t border-border/80 py-8 bg-card text-center text-xs text-secondary/60 mt-20 relative z-10">
        <Container
          size="xl"
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <span>© {new Date().getFullYear()} Scout. All rights reserved.</span>
          <span className="tracking-widest uppercase text-[10px]">ZenKai Ecosystem</span>
        </Container>
      </footer>

      {/* Sticky toast overlay container */}
      <div
        className="fixed bottom-6 right-6 flex flex-col gap-3"
        style={{ zIndex: tokens.zIndex.toast }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.msg}
            type={t.type}
            onClose={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
          />
        ))}
      </div>
    </PageWrapper>
  );
}
