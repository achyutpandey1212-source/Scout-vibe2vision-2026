# Onboarding Flow Audit

## Overview

Onboarding V2 is a **7-step wizard** implemented as a single monolithic page at `apps/web/src/app/onboarding/page.tsx`. It is explicitly marked `ONBOARDING V2 FROZEN` — changing onboarding flow requires coordinated updates across Personalization, Discovery, and Recommendation engines.

**Entry points** into onboarding:

- `/signup` (email) → `/onboarding` after successful signup
- `/login` (any auth method) → `/dashboard`, then `ProtectedRoute` redirects to `/onboarding` if `onboardingCompleted = false`
- Root `/` → `/login` if not authenticated

**Exit point**: `/onboarding` → `/dashboard` on completion. `handleComplete()` calls `profileApi.completeOnboarding()`, clears localStorage step, syncs auth with backend, then navigates to `/dashboard`.

**Routing guard**: `ProtectedRoute` (client-side only). No server-side middleware guard exists for `/onboarding`.

---

## Global Elements (All Steps)

| Element                 | Details                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Progress Bar Header** | Sticky top bar showing `Step X of 7`, `XX% Progress`, progress bar fill, `Saving...` indicator during autosave, `ThemeToggle` button                                           |
| **Wizard Footer**       | Fixed bottom navigation. `Back` button (hidden on Step 1). `Next` / `Let's Begin` / `Go to Dashboard` button.                                                                  |
| **Autosave**            | Every `handleNext`/`handleBack` triggers `saveProgress()`, which saves to `localStorage` (`scout_onboarding_v2_step`) and calls `profileApi.updateV2()` to persist to backend. |
| **Loading State**       | On mount, fetches existing V2 profile via `profileApi.getV2()` and shows a centering spinner with "Loading your profile..." until data is restored or fails.                   |

---

## Step-by-Step Breakdown

### Step 1: Welcome

| Field         | Type                | Purpose                                                                     |
| ------------- | ------------------- | --------------------------------------------------------------------------- |
| Sparkles icon | Animated icon       | Brand context                                                               |
| Heading       | Static text         | "Welcome to Scout V2"                                                       |
| Description   | Static text         | Explains personalization purpose; mentions engineering studies, internships |
| Time estimate | Static text (small) | "Takes under 5 minutes. Your progress is saved automatically."              |

**UI Elements**:

- Centered `Sparkles` icon in `bg-primary/10 rounded-full` with `animate-pulse`
- `h1` heading: "Welcome to **Scout V2**"
- `p` description in `text-secondary font-light`
- Small subtext in `text-secondary/60`
- No data input. Pure intro/expectation-setting.

**Navigation**:

- Next button: `"Let's Begin"` with ChevronRight

---

### Step 2: Basic Info

| Field     | Type                           | Options / Validation                               | Purpose                                |
| --------- | ------------------------------ | -------------------------------------------------- | -------------------------------------- |
| Full Name | Text input                     | Required for Next                                  | Identity verification                  |
| Gender    | 3-button selector (3-col grid) | Female (active), Male (disabled), Other (disabled) | Demographics for opportunity filtering |
| Age       | Number input                   | Optional                                           | Age-based filtering                    |
| State     | Text input                     | Optional                                           | Location-based opportunities           |
| City      | Text input                     | Optional                                           | Location-based opportunities           |

**UI Elements**:

- Heading: "Introduce yourself 🌸"
- Subtext: "We use this to verify identity and location-based opportunities."
- Full Name: w-full `px-4 py-2.5 bg-card border border-border rounded-xl`
- Gender: `grid grid-cols-3 gap-2`
  - **Female**: Active. `border-primary bg-primary/5 text-primary font-medium` when selected.
  - **Male**: Disabled. Shows `🚧 Coming Soon` sub-label. `disabled cursor-not-allowed`
  - **Other**: Disabled. Shows `🚧 Coming Soon` sub-label. `disabled cursor-not-allowed`
- Age/State/City: 3-column grid. `col-span-1` each. Number or text input with same styling.

**Navigation**:

- Back button
- Next button: Must have `formData.fullName` non-empty (disabled otherwise). Label: `"Next"`

**State shape**: `gender: 'MALE' | 'FEMALE' | 'UNKNOWN'` (UNKNOWN is default/initial)

---

### Step 3: Academic Context

| Field               | Type                    | Options / Validation                     | Purpose                     |
| ------------------- | ----------------------- | ---------------------------------------- | --------------------------- |
| College / Institute | Text input              | No explicit validation                   | Institution identification  |
| Degree              | Text input (2-col grid) | e.g. B.Tech                              | Eligibility filtering       |
| Branch / Major      | Text input (2-col grid) | e.g. CSE                                 | Eligibility filtering       |
| Current Year        | Select dropdown         | Year 1 through 6 (empty = "Select Year") | Graduation window filtering |
| Expected Graduation | Number input            | e.g. 2027                                | Graduation window filtering |

**UI Elements**:

- Heading: "Your Academic Context 🎓"
- Subtext: "Helps us filter opportunities requiring specific graduation windows or degrees."
- College: Full-width text input
- Degree + Branch: 2-column grid. Both text inputs.
- Current Year + Expected Graduation: 2-column grid. Select dropdown for year (1-6 options), number input for graduation year.

**Navigation**:

- Back button
- Next button: No field-level validation. Label: `"Next"`

---

### Step 4: Skills

| Field           | Type                        | Options / Validation                        | Purpose                       |
| --------------- | --------------------------- | ------------------------------------------- | ----------------------------- |
| Search input    | Text input with search icon | Filters SKILLS_TAXONOMY in real-time        | Skill discovery               |
| Selected skills | Removable tags              | None                                        | Visual feedback on selections |
| Skill grid      | 3-column button grid        | Multi-select toggles. Scrollable (max-h-48) | Skill selection               |

**UI Elements**:

- Heading: "What are your skills? 💻"
- Subtext: "Search and select the technical skills you know or are currently learning."
- Search bar: `relative` with absolute-positioned `Search` icon from lucide-react. `pl-10 pr-4 py-2.5`
- Selected skill tags: `flex flex-wrap gap-1.5 p-2 bg-accent/20 rounded-xl`. Each tag has the skill name and an `X` button for removal. Styled as "pill" buttons in `bg-primary text-primary-foreground rounded-full text-xs`.
- Skill grid: `grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-card border border-border rounded-xl`
  - **Selected**: `border-primary bg-primary/5 text-primary font-medium`
  - **Unselected**: `border-border bg-card hover:bg-accent text-secondary`
  - Empty state: "No skills match your query" in `col-span-3 py-6 text-center`

**Data source**: `SKILLS_TAXONOMY` from `@scout/shared`. Filtering matches `skill.name` **or** `skill.aliases` (case-insensitive includes).

**Navigation**:

- Back button
- Next button: No min-skill validation. User can proceed with 0 skills. Label: `"Next"`

**State shape**: `technicalSkills: string[]` (array of skill IDs)

---

### Step 5: Career Direction

This step has two sub-sections:

#### 5a: Career Goals (Single-select)

| Field       | Type               | Options   | Purpose              |
| ----------- | ------------------ | --------- | -------------------- |
| Career Goal | Single-select chip | 7 options | Primary career focus |

**Options**:

1. "Get my first internship"
2. "Build my resume"
3. "Prepare for placements"
4. "Learn through hackathons"
5. "Explore opportunities"
6. "Win scholarships"
7. "I'm still exploring"

**UI elements**:

- Heading: "What is your biggest goal right now? 🎯"
- Subtext: "Choose the main focus that dominates your career efforts currently."
- Button chips in `flex flex-wrap gap-2`
- Selected: `border-primary bg-primary text-primary-foreground font-medium`
- Unselected: `border-border bg-card hover:bg-accent text-secondary`

**Behavior**: `single-select`. Stored as `careerGoals: [goal]` — an array with exactly one string. `careerGoals[0]` is the selected goal.

#### 5b: Biggest Worry (Single-select)

| Field             | Type               | Options   | Purpose                        |
| ----------------- | ------------------ | --------- | ------------------------------ |
| Biggest Challenge | Single-select chip | 7 options | Motivation / confidence signal |

**Options**:

1. "I don't know where to apply."
2. "I don't think I'm good enough."
3. "My resume is weak."
4. "I don't have enough projects."
5. "I don't know which skills to learn."
6. "I'm preparing for placements."
7. "I'm just exploring."

**UI elements**:

- Heading: "What is worrying you the most right now? 🌸"
- Subtext: "Let us know what roadblock is on your mind so we can help clear it first."
- Same button chip styling as career goals
- Section divider: `pt-3 border-t border-border/40`

**Behavior**: `single-select`. Stored as `biggestChallenge: string` (direct string value, not array).

**Navigation**:

- Back button
- Next button: No field-level validation. Both sections are selectable but not required. Label: `"Next"`

---

### Step 6: Preferences & Confidence

This step has two sub-sections:

#### 6a: Opportunity Preferences (Multi-select toggles)

| Field                   | Type                        | Options                          | Purpose                    |
| ----------------------- | --------------------------- | -------------------------------- | -------------------------- |
| Opportunity preferences | Toggle buttons (2-col grid) | 8 active options + 3 Coming Soon | Opportunity type filtering |

**Active Options** (available, toggleable):

1. Internships (`internships`)
2. Hackathons (`hackathons`)
3. Scholarships (`scholarships`)
4. Open Source (`opensource`)
5. Workshops (`events`) — labeled "Workshops" in UI but key is `events`
6. Bootcamps (`bootcamps`)
7. Competitions (`competitions`)
8. Learning Programs (`training`) — labeled "Learning Programs" in UI but key is `training`

**Coming Soon Options** (disabled, display-only):

- Full-time Jobs (`🚧 Coming Soon`)
- Freelancing Clients (`🚧 Coming Soon`)
- Startup Funding (`🚧 Coming Soon`)

**UI elements**:

- Heading: "What should Scout hunt for? 🌸"
- Subtext: "Select the types of student opportunities you want recommendations for."
- Grid: `grid grid-cols-2 gap-2`
- Button: `p-2.5 rounded-xl border text-left flex items-center justify-between`
  - Selected: `border-primary bg-primary/5 text-primary font-medium` with `Check` icon
  - Unselected: `border-border bg-card hover:bg-accent text-secondary`
- Coming Soon badges: `px-2 py-0.5 bg-card border border-border text-secondary/40 rounded-full text-[9px] cursor-not-allowed`

**Note**: The `opportunityPreferences` form state also contains `research`, `volunteer`, `earlyCareerPrograms`, and `partTime` — keys that exist in the state shape but have no corresponding UI toggle buttons in Step 6.

#### 6b: Self-Belief Check (Confidence Signals)

| Field                                               | Type                               | Options                    | Purpose              |
| --------------------------------------------------- | ---------------------------------- | -------------------------- | -------------------- |
| "I apply even if I don't meet every requirement."   | Agree/Neutral/Disagree (3 buttons) | Single-select per question | Confidence profiling |
| "I avoid competitive opportunities."                | Agree/Neutral/Disagree (3 buttons) | Single-select per question | Confidence profiling |
| "I prefer safer opportunities over ambitious ones." | Agree/Neutral/Disagree (3 buttons) | Single-select per question | Confidence profiling |

**UI elements**:

- Section divider: `pt-3 border-t border-border/40`
- Heading: "Self-Belief check" (`text-sm font-medium text-secondary`)
- Each question: `flex items-center justify-between`
  - Left: Question text in `text-[11px] text-secondary font-light`
  - Right: 3 buttons in `flex space-x-1`
  - Button size: `px-2 py-0.5 border rounded text-[9px]`
  - Selected: `border-primary bg-primary/5 text-primary`
  - Unselected: `border-border text-secondary`

**State shape**:

```ts
confidenceProfile: {
  applyIfNoMeet: string,   // 'Agree' | 'Neutral' | 'Disagree' | ''
  avoidCompetitive: string,
  preferSafer: string,
}
```

**Navigation**:

- Back button
- Next button: No validation required. Label: `"Next"`

---

### Step 7: Resume & Career Readiness

This is the most complex step. It has **two mutually exclusive sub-states**:

#### 7a: Resume Upload & Career Readiness (Default state)

| Field                | Type                                            | Options / Validation                              | Purpose                        |
| -------------------- | ----------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| Resume upload        | File input (PDF only, hidden behind a dropzone) | Accepts `.pdf`. Optional for MVP                  | Resume intelligence            |
| Career Ready score   | Circular/boxed percentage display               | Dynamic from `readinessData.careerReadinessScore` | Motivation / progress feedback |
| Completeness         | Small text below score                          | `readinessData.completionPercentage%`             | Progress visibility            |
| Suggestion checklist | Dynamic bullet list                             | Generated from missing fields                     | Actionable improvement hints   |

**UI Elements**:

- **Resume upload zone**: `grid grid-cols-2 gap-4`
  - Left panel: `flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-2xl bg-card hover:bg-accent/10 cursor-pointer relative min-h-[120px]`
    - Hidden `<input type="file" accept=".pdf">` at `absolute inset-0 opacity-0 cursor-pointer`
    - **Uploading state**: Spinner + "Uploading & Parsing..."
    - **Uploaded state**: Check icon + "Resume registered!" + filename
    - **Default state**: `Upload` icon + "Click to upload resume (PDF)" + "Optional for MVP" microtext
  - Right panel: "Career Ready" score display
    - Label: "Career Ready" in `uppercase tracking-wider`
    - Score: `careerReadinessScore` in `text-2xl font-bold text-primary` (e.g. "45%")
    - Completeness: `Completion: XX%` in `text-[9px] text-secondary/50`

- **Suggestion checklist**: Visible only when `suggestionsList.length > 0`
  - Container: `p-4 bg-accent/20 border border-border rounded-xl`
  - Label: "Complete these to improve recommendations:" with `AlertCircle` icon
  - Dynamic items (3 possible):
  1. "Upload your resume" (if `resumeUploaded = false`)
  2. "Add at least 3 skills" (if `technicalSkills.length < 3`)
  3. "Select opportunity preferences" (if no preference toggles are true)
  - Styled as `list-disc list-inside text-xs text-secondary font-light`

- **Completion CTA**: Centered text block
  - Heading: "All Set! ✨"
  - Description: "Click the button below to land on your personalized dashboard and discover opportunities."

**Navigation**:

- Back button
- Go to Dashboard button: `disabled` if `parsedResumeData !== null` (resume review panel is active and must be confirmed/cancelled first).

---

#### 7b: Resume Review Panel (Appears after PDF upload)

Triggered when `handleFileUpload` returns successful parsed data. `parsedResumeData` is set to the API response, and Step 7 switches to the review panel.

| Field                   | Type                                 | Options / Validation                   | Purpose                      |
| ----------------------- | ------------------------------------ | -------------------------------------- | ---------------------------- |
| Match Confidence        | Percentage display                   | `Math.round(overallConfidence * 100)%` | Trust indicator              |
| Attention Areas         | Warning list                         | Up to 3 warnings from backend          | Parsing quality signal       |
| Full Name               | Editable text input                  | Pre-filled from parsed data            | User verification/correction |
| College                 | Editable text input                  | Pre-filled                             | User verification/correction |
| Degree                  | Editable text input                  | Pre-filled                             | User verification/correction |
| Branch                  | Editable text input                  | Pre-filled                             | User verification/correction |
| Graduation Year         | Editable number input                | Pre-filled                             | User verification/correction |
| Extracted Skills        | Toggle buttons (all SKILLS_TAXONOMY) | Multi-select, toggleable               | Skill verification           |
| Projects Found          | Read-only checklist                  | If `detectedProjects.length > 0`       | Verification/inspection      |
| Leadership & Experience | Read-only checklist                  | If `detectedExperience.length > 0`     | Verification/inspection      |

**UI Elements**:

- **Panel container**: `p-5 border border-border bg-card rounded-2xl space-y-4 shadow-lg`
- **Header**: `flex items-center space-x-2 border-b border-border/60 pb-3`
  - `FileText` icon
  - Heading: "Review Extracted Information"
  - Subtext: "Confirm or correct these fields before saving them to your profile."

- **Score/Warnings grid**: `grid grid-cols-3 gap-3 bg-accent/15 p-3 rounded-xl`
  - Left (col-span-1): "Match Confidence" label + percentage
  - Right (col-span-2): "Attention Areas" label + warning list (or "Perfect match!" if no warnings)

- **Editable fields**: `grid` layout
  - Full Name: `w-full px-3 py-2`
  - College + Degree: `grid-cols-2 gap-2`
  - Branch + Graduation Year: `grid-cols-2 gap-2`
  - All editable inputs in `bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-xs font-light`

- **Extracted Skills**: `flex flex-wrap gap-1 bg-background p-2 border border-border rounded-lg`
  - All `SKILLS_TAXONOMY` items rendered as toggle pills
  - Selected pills: `border-primary bg-primary text-primary-foreground`
  - Unselected: `border-border bg-card text-secondary/60 hover:bg-accent`

- **Projects Found** (if present): `space-y-1 p-2 border border-border bg-background rounded-lg`
  - Lists detected project titles with `✓` bullet
  - Not interactive; read-only display

- **Leadership & Experience** (if present): Same layout as projects
  - Lists detected roles + organizations with `✓` bullet
  - Not interactive; read-only display

- **Action buttons**: `flex items-center space-x-2 pt-2 border-t border-border/40`
  - **Cancel** (`w-1/3`): Sets `parsedResumeData` to `null`, returning to default upload state
  - **Use this information** (`w-2/3`): Calls `handleMergeConfirm()` → merges review fields into profile via `profileApi.mergeProfileV2()`

**Navigation**: Disabled. The user must **Cancel** or **Use this information** before any navigation is possible. "Go to Dashboard" button is disabled during this state.

---

## Career Readiness Calculator

Located at `apps/server/src/profile/utils/readiness-calculator.ts`.

The score is computed server-side on every profile update and returned in `readiness` payload.

| Field                              | Points  | Notes                                                  |
| ---------------------------------- | ------- | ------------------------------------------------------ |
| Full Name                          | 5       | Must be non-empty                                      |
| Gender                             | 5       | Must not be `UNKNOWN`                                  |
| State + City                       | 5       | Both required                                          |
| College                            | 5       | Non-empty                                              |
| Degree + Branch                    | 10      | Both required                                          |
| Current Year + Expected Graduation | 10      | Both required                                          |
| Technical Skills                   | 15 max  | 5 pts per skill, up to 3 skills                        |
| Career Goals                       | 10      | `careerGoals[0]` non-empty                             |
| Biggest Challenge                  | 5       | Non-empty                                              |
| Confidence Signals                 | 10      | 3.33 pts per answered question, all 3 required for max |
| Resume Upload                      | 20      | `resumeUploaded = true`                                |
| **Total**                          | **100** | Score is clamped 0–100                                 |

**Completion Percentage**: Count of 11 completed field groups / 11 * 100.

**Missing Fields**: Listed individually (e.g. "Skills (add at least 3)", "Resume Upload") and displayed on Step 7 or in API readiness payload.

---

## API Layer

### Profile APIs Used by Onboarding

| Endpoint                              | Method           | Usage                                                                                                                                           |
| ------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/profile/v2`                  | GET              | Load existing profile + readiness on onboarding mount                                                                                           |
| `/api/v1/profile/v2`                  | POST             | Autosave on every Next/Back transition                                                                                                          |
| `/api/v1/profile/v2/resume`           | POST (multipart) | Upload and parse PDF resume. Returns `parsedFields`, `overallConfidence`, `warnings`, `detectedProjects`, `detectedExperience`, `detectedLinks` |
| `/api/v1/profile/v2/merge`            | POST             | Merge user-reviewed resume fields into profile. Returns updated `profile` + `readiness`                                                         |
| `/api/v1/profile/onboarding/complete` | POST             | Marks onboarding complete. Triggers background recommendation generation                                                                        |

### Auth APIs

| Endpoint     | Usage                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `/auth/sync` | Called after `completeOnboarding()` to refresh `onboardingCompleted` and `onboardingStep` in client auth context |

---

## Post-Onboarding Transition: Dashboard Loading Workspace

After `handleComplete()` navigates to `/dashboard`, the following sequence occurs:

### Phase A: Initial Dashboard Load

`DashboardPage` (`apps/web/src/app/dashboard/page.tsx`) shows:

- **Loading state**: `UniversalLoader` with messages: "Accessing security credentials...", "Synchronizing local workspace...", "Logging in..."
- Simultaneously fires `loadDashboardData()` which calls:
  - `recommendationsApi.list()` → expects `ONBOARDING_REQUIRED` or `GENERATING` or `READY`
  - `opportunitiesApi.list({limit: 12})` → catalog feed (loaded but hidden during generation)
  - `bookmarksApi.list()` → user bookmarks
  - `profileApi.get()` → user profile

### Phase B: Generating Workspace State

If `engineStatus === 'GENERATING'`, the dashboard shows:

| Element             | Details                                                                             |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Heading**         | "Preparing your Scout Workspace" (`text-2xl md:text-3xl font-light tracking-tight`) |
| **Subtext**         | "We're building recommendations tailored specifically for you."                     |
| **Progress stages** | 7-stage animated list inside `bg-card border border-border/40 rounded-3xl p-6`      |

**Progress stages** (in order, each can be Completed / Current / Pending):

| Key             | Label                        | Visual State                |
| --------------- | ---------------------------- | --------------------------- |
| `RETRIEVING`    | Retrieving opportunities     | Pending dot or pulse        |
| `FILTERING`     | Filtering opportunities      | Pending dot or pulse        |
| `SCORING`       | Scoring matches              | Pending dot or pulse        |
| `DIVERSIFYING`  | Diversifying recommendations | Pending dot or pulse        |
| `PERSONALIZING` | Generating AI insights       | Pending dot or pulse        |
| `BUILDING_PACK` | Building recommendation pack | Pending dot or pulse        |
| `COMPLETED`     | Workspace Ready              | Emerald green completed dot |

Each stage has:

- **Completed** (idx < currentStageIndex): `h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20` with emerald pulse dot + `font-semibold text-emerald-500`
- **Current** (idx === currentStageIndex): `h-5 w-5 rounded-full bg-primary/10 border border-primary/20` with `animate-ping` primary dot + `font-bold text-foreground`
- **Pending**: `h-5 w-5 rounded-full bg-accent/20 border border-border/30` with dim dot + `text-secondary/40 font-light`

**Polling**: `setInterval` every 2 seconds on `recommendationsApi.list()` until `status === 'READY'`.

### Phase C: Ready Dashboard

Once `status === 'READY'`, the dashboard renders:

| Section                    | Component / Details                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **DashboardHero**          | Greeting with userName, match count                                                                                         |
| **ScoutIntelligencePanel** | Stats bar showing opportunity count, match count, bookmark count                                                            |
| **Tab Bar**                | Two pill tabs: "Dashboard Curated" / "Explore Catalog"                                                                      |
| **Featured Match**         | `FeaturedOpportunityCard` — top compatibility recommendation                                                                |
| **Hidden Gem**             | `HiddenGemCard` — low competition match                                                                                     |
| **More Recommended**       | `OpportunityCard` grid — remaining slot matches (e.g. Stretch Goal, Fast Apply, Resume Builder)                             |
| **Explore Catalog**        | Search + Filter (Category: ALL/SCHOLARSHIP/INTERNSHIP/FELLOWSHIP/GRANT) + Sort (match/deadline) + grid of all opportunities |

---

## Server-Side Background Generation Flow

```
handleComplete()
  → POST /api/v1/profile/onboarding/complete
      → UserIntelligenceRepository.completeOnboarding()
          → sets onboarding.completed = true, onboarding.completedAt = now
      → BackgroundGenerationService.trigger(userId, undefined, 'ONBOARDING_COMPLETE')
          → OnboardingGuard.isOnboardingCompleted(userId) [check 1]
          → Creates GENERATING pack with progressPhase: 'RETRIEVING'
          → Runs async worker (setImmediate)
              → Worker stages:
                  1. RETRIEVING → 2. FILTERING → 3. SCORING → 4. DIVERSIFYING
                  → 5. PERSONALIZING → 6. BUILDING_PACK → 7. READY
              → OnboardingGuard.isOnboardingCompleted(userId) [check 2 inside worker]
                  → if false: marks pack FAILED
                  → if true: proceeds to next stage
Page polls /api/v1/recommendations every 2s
  → returns { status: GENERATING, progressPhase } or { status: READY, data }
```

---

## Known Constraints / "Frozen" Nature

- The monorepo comment at the top of `page.tsx` warns that changing onboarding requires coordinated changes across multiple engine modules.
- Gender options are hardcoded with Male/Other disabled — these are not reactive feature flags.
- `opportunityPreferences` in formData has additional keys (`research`, `volunteer`, `earlyCareerPrograms`, `partTime`) that have **no corresponding UI toggles in Step 6**.
- Resume review panel (Step 7 parsed state) blocks navigation until Cancelled or Merged.
- Step 2 has no explicit re-validation — if user clears Full Name after passing, Next remains enabled.

---

## File References

| File                                                                                 | Purpose                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `apps/web/src/app/onboarding/page.tsx`                                               | Main 7-step onboarding wizard                           |
| `apps/web/src/app/dashboard/page.tsx`                                                | Post-onboarding dashboard with workspace loading states |
| `apps/web/src/components/auth/ProtectedRoute.tsx`                                    | Client-side routing guard                               |
| `apps/web/src/context/auth-context.tsx`                                              | Auth context with onboardingCompleted/onboardingStep    |
| `apps/web/src/lib/api/index.ts`                                                      | Client-side API functions                               |
| `apps/web/src/lib/constants/routes.ts`                                               | `/onboarding` route constant                            |
| `apps/server/src/modules/recommendation/guard/onboarding-guard.ts`                   | Server-side onboarding completion check                 |
| `apps/server/src/profile/controllers/profile.controller.ts`                          | completeOnboarding controller                           |
| `apps/server/src/profile/utils/readiness-calculator.ts`                              | Career Readiness score logic                            |
| `apps/server/src/modules/recommendation/generation/background-generation.service.ts` | Async recommendation generation worker                  |
| `docs/V2/Personalisation Engine/ONBOARDING_V2_ARCHITECTURE.md`                       | Detailed architecture documentation                     |
