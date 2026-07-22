# Scout Web — UI/UX Audit

> **Project:** Scout | Opportunity Intelligence Platform  
> **Frontend Path:** `apps/web`  
> **Framework:** Next.js 14+ (App Router) + React + TypeScript  
> **Styling:** Tailwind CSS + Custom Design Tokens  
> **Animation:** Framer Motion  
> **Date:** 2026-07-21

---

## 1. PAGES / ROUTES

### 1.1 Public Pages (Unauthenticated)

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | **Home / Landing Page.** Editorial hero, problem statement, how Scout works (4 blocks), what Scout finds (tag wall), emotional typography section, live system metrics, final CTA, footer. Includes animated splash sequence on first visit. |
| `/login` | `src/app/login/page.tsx` | **Sign In Page.** Email/password form, Google sign-in, Guest exploration option. Centered card layout with decorative crane background. |
| `/signup` | `src/app/signup/page.tsx` | **Register Page.** Name, email, password, confirm password fields. Centered card layout with decorative butterfly background. Redirects to `/onboarding` after success. |

### 1.2 Authenticated User Pages

| Route | File | Description |
|-------|------|-------------|
| `/onboarding` | `src/app/onboarding/page.tsx` | **Onboarding Wizard (7 Steps).** Welcome, Basic Info (name/gender/age/location), Education (college/degree/branch/year), Skills (searchable taxonomy), Career Direction (goals/worries), Preferences & Confidence (opportunity types + self-belief check), Resume & Career Readiness (upload + review). Protected route. |
| `/dashboard` | `src/app/dashboard/page.tsx` | **Dashboard.** Greeting hero, Scout Intelligence Panel, tabbed view (Dashboard Curated vs Explore Catalog). Curated tab shows Featured Match, Hidden Gem, More Recommended opportunities. Explore tab shows full catalog with search, category filter, sort. |
| `/explore` | `src/app/explore/page.tsx` | **Explore Catalog.** Full opportunity catalog with search input, category pill filters (All, Internship, Fellowship, Scholarship, Competition, Bootcamp, Grant, Job, Program, Event, Course, Volunteer), sort dropdown (Best Match, Deadline, Newest), infinite scroll pagination. |
| `/profile` | `src/app/profile/page.tsx` | **User Profile.** Editable identity (name, location, career stage), Dreams & Aspirations list, Interests tags, Scout Settings (notifications, explore frequency, minimum match score slider). |
| `/bookmarks` | `src/app/bookmarks/page.tsx` | **Saved Opportunities.** Grid of bookmarked opportunity cards. Empty state with butterfly decoration. |
| `/notifications` | `src/app/notifications/page.tsx` | **Updates & Alerts.** Currently shows graceful empty state ("No updates yet"). Bell icon decoration. |
| `/opportunity/[id]` | `src/app/opportunity/[id]/page.tsx` | **Opportunity Details.** Full description, eligibility, application requirements, deadline, source links. Right sidebar: Scout AI Career Report with executive summary, strengths, skill gaps, resume improvements, interview topics, application confidence, next action. Bookmark and Apply buttons. |

### 1.3 Design System / Internal

| Route | File | Description |
|-------|------|-------------|
| `/design-system` | `src/app/design-system/page.tsx` | **Design System Playground.** Showcases all typography variants, button systems, input controls, overlays (Dialog, Drawer, Bottom Sheet), feedback systems (Alerts, Toasts, Skeleton, HonestLoading), dashboard components, opportunity cards, profile card, origami assets showcase. |

### 1.4 Admin Panel (Operations Control Center)

| Route | File | Description |
|-------|------|-------------|
| `/admin` | `src/app/admin/page.tsx` | **Redirect** → `/admin/overview` |
| `/admin/login` | `src/app/admin/login/page.tsx` | **Admin Authentication.** Password-only form. Dark theme. |
| `/admin/overview` | `src/app/admin/overview/page.tsx` | **Operations Overview.** Platform health status (Core Server, Database, Redis, Scheduler), database statistics (opportunities, users, runs, raw pages), quick actions. |
| `/admin/discovery` | `src/app/admin/discovery/page.tsx` | **Discovery Engine Control Center.** Tabbed interface: Daily Run Room (pipeline controller, bottleneck detector, mission control, opportunity quality, query intelligence, conversion funnel), Source Seeding, Intelligence & Diversity, API & Key Pools. Real-time polling and log streaming. |
| `/admin/recommendation` | `src/app/admin/recommendation/page.tsx` | **Recommendation Engine Operations.** Tabs: Overview (health bar, KPIs, scoring weights matrix, feature flags), Pipeline & DevTools (manual runner sandbox with dry-run), Pack Inspector (explainability & cache diagnostics), Playground Simulator (weight adjustment + rank shuffle), Configuration Settings (live feature flags, weights publisher), Event Logs. |
| `/admin/providers` | `src/app/admin/providers/page.tsx` | **Provider Pools.** API key pool telemetry tables for Discovery and Recommendation engines. Status badges (ACTIVE, DEGRADED, EXHAUSTED), success/failed requests, rotations, test pool button. |
| `/admin/jobs` | `src/app/admin/jobs/page.tsx` | **Jobs & Scheduler.** Table of scheduled backend jobs (Discovery Pipeline, Archive Expired, Recommendation Cache Refresh) with manual trigger buttons. |
| `/admin/database` | `src/app/admin/database/page.tsx` | **Database Stats.** MongoDB connection info, collection counts (Opportunities, Users, Discovery Runs, Scraped Pages). |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | **Admin Settings.** Quality threshold sliders, accept threshold, system maintenance mode toggle. |

> **Note:** The admin layout references `/admin/logs` but no `logs/page.tsx` file currently exists in the codebase.

---

## 2. REUSABLE COMPONENTS

### 2.1 UI Primitives (`src/components/ui/`)

#### Layout & Structure
| Component | File | Purpose |
|-----------|------|---------|
| `Container` | `layout.tsx` | Max-width wrapper with responsive padding (sm/md/lg/xl/wide). |
| `Section` | `layout.tsx` | Vertical spacing section with size variants (sm/md/lg). |
| `PageWrapper` | `layout.tsx` | Full-page flex container with background and text color. |
| `Stack` | `layout.tsx` | Flexbox wrapper with direction, alignment, justification, gap, wrap. |
| `Grid` | `layout.tsx` | CSS Grid wrapper with responsive column counts (1-6, 12) and gap. |
| `Spacer` | `layout.tsx` | Empty space utility with size and axis props. |
| `Divider` | `layout.tsx` | Horizontal rule with optional centered label. |

#### Typography
| Component | File | Purpose |
|-----------|------|---------|
| `Typography` | `typography.tsx` | Semantic typography with variants: display, hero, heading-xl/l/m/s, body-large, body, caption, label, button, code. |

#### Buttons
| Component | File | Purpose |
|-----------|------|---------|
| `Button` | `button.tsx` | Motion-enabled button with variants (primary, secondary, ghost, outline, text, danger, success), sizes (sm/md/lg), loading state, icon slots, square mode. |

#### Inputs & Forms
| Component | File | Purpose |
|-----------|------|---------|
| `FormLabel` | `input.tsx` | Accessible form label with uppercase tracking. |
| `HelperText` | `input.tsx` | Light helper text below inputs. |
| `ValidationMessage` | `input.tsx` | Error/success validation text. |
| `TextInput` | `input.tsx` | Text input with label, helper text, error state, icon slot, rounded-full styling. |
| `SearchInput` | `input.tsx` | Search input with search icon, clear button, rounded-full styling. |
| `Textarea` | `input.tsx` | Multi-line text input with label and validation. |
| `Switch` | `input.tsx` | Toggle switch with label. |
| `Checkbox` | `input.tsx` | Checkbox input with label. |
| `Radio` | `input.tsx` | Radio button input with label. |
| `Select` | `input.tsx` | Select dropdown with label, custom chevron, rounded-full styling. |
| `Chip` | `input.tsx` | Tag/chip component with selected state, onClick, onRemove. |
| `Slider` | `input.tsx` | Range input with label. |
| `ProgressStep` | `input.tsx` | Step indicator with active/completed states and connecting lines. |

#### Cards
| Component | File | Purpose |
|-----------|------|---------|
| `Card` | `card.tsx` | Container with rounded-3xl, border, shadow, optional hoverable state. |
| `CardHeader` | `card.tsx` | Card header padding wrapper. |
| `CardTitle` | `card.tsx` | Card title with heading styles. |
| `CardDescription` | `card.tsx` | Secondary text description. |
| `CardContent` | `card.tsx` | Card body padding wrapper. |
| `CardFooter` | `card.tsx` | Card footer with border and flex layout. |

#### Feedback & Overlays
| Component | File | Purpose |
|-----------|------|---------|
| `Alert` | `feedback.tsx` | Inline alert banner with variants (success, warning, error, info). |
| `Skeleton` | `feedback.tsx` | Pulse placeholder for loading states. |
| `Toast` | `feedback.tsx` | Floating notification pill with icon and close button. |
| `HonestLoadingState` | `feedback.tsx` | Step-by-step loading indicator with check/spinner states. |
| `Dialog` | `modal.tsx` | Centered modal with backdrop, close button, size variants (sm/md/lg). |
| `Drawer` | `modal.tsx` | Side panel (right) or bottom sheet with backdrop and close button. |

#### Decorations & Brand
| Component | File | Purpose |
|-----------|------|---------|
| `OrigamiDecoration` | `decorations.tsx` | Animated origami asset image with floating animation. Supports 18 asset names. |
| `CornerDecoration` | `decorations.tsx` | Positioned corner origami accent (top-left/right, bottom-left/right). |
| `BackgroundAccent` | `decorations.tsx` | Full-viewport subtle floating origami shapes background. |
| `TopNavigation` | `nav.tsx` | Authenticated top nav with logo, desktop links, search trigger, notifications, profile avatar, mobile hamburger drawer. |
| `ThemeToggle` | `theme-toggle.tsx` | Sun/Moon theme switcher with animated icon transition. |
| `ThemeProvider` | `theme-provider.tsx` | next-themes wrapper for dark/light mode. |

#### Motion & Transitions
| Component | File | Purpose |
|-----------|------|---------|
| `transitionNormal/Fast/Slow` | `motion.ts` | Framer Motion transition presets (0.15s-0.35s, easeOutExpo). |
| `transitionSpring` | `motion.ts` | Spring transition for modals/cards. |
| `fadeVariants` | `motion.ts` | Fade in/out variants. |
| `slideUpVariants` | `motion.ts` | Slide up with fade variants. |
| `slideDownVariants` | `motion.ts` | Slide down with fade variants. |
| `cardRevealVariants` | `motion.ts` | Card reveal animation. |
| `modalVariants` | `motion.ts` | Modal scale/fade variants. |
| `drawerVariants` | `motion.ts` | Right drawer slide variants. |
| `bottomSheetVariants` | `motion.ts` | Bottom sheet slide variants. |
| `listContainerVariants` | `motion.ts` | Staggered list container. |
| `listChildVariants` | `motion.ts` | Staggered list item. |
| `pressAnimation` | `motion.ts` | Micro-interaction tap/hover scale presets. |

#### Loaders & Sequences
| Component | File | Purpose |
|-----------|------|---------|
| `UniversalLoader` | `UniversalLoader.tsx` | Sequential message loader with floating crane animation. |
| `ScoutOpeningSequence` | `ScoutOpeningSequence.tsx` | Multi-scene splash intro (4 scenes: crane, butterfly, lotus, SCOUT logo) with skip button. |
| `PageTransition` | `PageTransition.tsx` | Page-level fade + slide transition wrapper. |

### 2.2 Layout Components (`src/components/layout/`)

| Component | File | Purpose |
|-----------|------|---------|
| `AppLayout` | `AppLayout.tsx` | Root layout wrapper with background accents, corner decorations, main content slot. Used by public pages. |
| `DashboardLayout` | `DashboardLayout.tsx` | Authenticated layout with `TopNavigation`, content container, editorial footer. Wraps all dashboard-area pages. |

### 2.3 Dashboard Components (`src/components/dashboard/`)

| Component | File | Purpose |
|-----------|------|---------|
| `DashboardHero` | `DashboardHero.tsx` | Time-aware greeting header with match count, floating crane watermark. |
| `ScoutIntelligencePanel` | `ScoutIntelligencePanel.tsx` | Today's Scout Brief with narrative bullet points and 2x2 metrics grid (Crawled Sources, Discovered Items, Relevance Fit, Saved Items). |
| `RecommendationStrip` | `RecommendationStrip.tsx` | Horizontal scroll strip with title, description, and children slots. Used for Hidden Gems and similar sections. |

### 2.4 Opportunity Components (`src/components/opportunity/`)

| Component | File | Purpose |
|-----------|------|---------|
| `OpportunityCard` | `OpportunityCard.tsx` | Standard opportunity card with organization, title, bookmark button, match score, badges (women-only, stipend, tags), deadline, "View details" CTA. Hoverable. |
| `FeaturedOpportunityCard` | `FeaturedOpportunityCard.tsx` | Large featured card with 12-col grid layout (details left, CTAs right). Includes "Why Scout Recommends This" explanation block, match score, badges, Apply Now and Bookmark actions. |
| `HiddenGemCard` | `HiddenGemCard.tsx` | Compact horizontal card (300px fixed width) with amber/gold theme, Hidden Gem stamp, compass icon, match score, bookmark and action buttons. |
| `MatchScore` | `MatchScore.tsx` | Match score badge with percentage and "Match" label. Color-coded (primary for >=85%, accent for lower). |
| `OpportunityBadge` | `OpportunityBadge.tsx` | Small rounded pill badge with variants: default, women-only (pink), stipend (emerald), closing (rose, animated). |

### 2.5 Profile Components (`src/components/profile/`)

| Component | File | Purpose |
|-----------|------|---------|
| `ProfileCard` | `ProfileCard.tsx` | User summary card with avatar, name, email, location, career stage, skills chips, aspirations/goals list. |

### 2.6 Auth Components (`src/components/auth/`)

| Component | File | Purpose |
|-----------|------|---------|
| `ProtectedRoute` | `ProtectedRoute.tsx` | Route guard that redirects unauthenticated users to `/` and incomplete onboarding users to `/onboarding`. Shows spinner while loading. |

---

## 3. ASSETS

### 3.1 Origami / Illustration Assets (`public/assets/`)

All assets are `.webp` format, used via `OrigamiDecoration` or `CornerDecoration` components.

**Root Assets:**
| Asset | Used In |
|-------|---------|
| `crane.webp` | Home hero background, login page, dashboard hero watermark, UniversalLoader, design system showcase |
| `butterfly.webp` | Signup page background, design system showcase, BackgroundAccent |
| `lotus.webp` | Home "Why Scout Exists" section background, design system showcase |
| `compass.webp` | Design system showcase, BackgroundAccent |
| `constellation.webp` | Available but not observed in current page implementations |
| `blooming_seed.webp` | Home "How Scout Works" block 2 decoration |
| `paper_airplane.webp` | Home "How Scout Works" block 1 decoration |
| `envelope.webp` | Home "How Scout Works" block 4 decoration |
| `envelope_2.webp` | Available in assets folder |
| `flower_petals.webp` | Available in assets folder |
| `mountain.webp` | Available in assets folder |
| `ribbon_with_sparkles.webp` | Available in assets folder |
| `sparkle.webp` | Available in assets folder |
| `star.webp` | Available in assets folder |
| `bookmark_with_star.webp` | Available in assets folder |

**Bird Assets (`public/assets/Birds/`):**
| Asset | Used In |
|-------|---------|
| `career_growth_bird.webp` | Available in assets folder |
| `freedom_bird.webp` | Available in assets folder |
| `dreams_bird.webp` | Home "How Scout Works" block 3 decoration |

### 3.2 Design Tokens (`src/lib/design-tokens.ts`)

Centralized design system values:
- **Spacing Scale:** xxs (4px) through xxxl (64px)
- **Border Radius:** none through full (9999px), with lg (20px) and xl (24px) as manifesto defaults
- **Shadow System:** none through xl (6-tier)
- **Transitions:** fast (0.15s), normal (0.25s), slow (0.35s) with cubic-bezier curve
- **Container Widths:** sm (640px) through wide (1440px)
- **Z-Index Scale:** hide (-1) through toast (90)
- **Breakpoints:** sm (640), md (768), lg (1024), xl (1280)

---

## 4. ARCHITECTURE NOTES

### 4.1 Routing Structure
- **App Router** (`src/app/`) with parallel routes and intercepting routes not currently in use.
- **Public routes:** `/`, `/login`, `/signup`
- **Protected routes:** All under `/dashboard`, `/explore`, `/profile`, `/bookmarks`, `/notifications`, `/opportunity/[id]`, `/onboarding`
- **Admin routes:** `/admin/*` with separate `AdminLayout` and independent authentication (password-based, not Firebase).

### 4.2 Layout Hierarchy
```
RootLayout (ThemeProvider + AuthProvider)
├── AppLayout (public pages: Home, Login, Signup)
│   ├── BackgroundAccent
│   ├── CornerDecoration (crane, butterfly)
│   └── <page content>
└── DashboardLayout (authenticated pages)
    ├── AppLayout
    │   ├── BackgroundAccent
    │   ├── CornerDecoration
    │   └── <children>
    ├── TopNavigation
    ├── <page content in Container>
    └── Footer
```

### 4.3 State Management
- **Auth:** React Context (`src/context/auth-context.tsx`) with Firebase integration.
- **API:** Centralized API layer (`src/lib/api/`) with typed services for auth, profile, opportunities, recommendations, bookmarks.
- **Mock Data:** `src/lib/mock/` provides fallback data for dev sessions.

### 4.4 Key Libraries
- **next-themes:** Dark/light mode switching
- **framer-motion:** Page transitions, scroll animations, modal/drawer animations, splash sequence
- **lucide-react:** Icon system throughout
- **firebase:** Authentication backend
- **axios:** HTTP client (admin panel)

---

## 5. UI/UX REDESIGN CONSIDERATIONS

1. **Dual Design Systems:** The admin panel uses a completely separate dark/neutral design system (`neutral-950`, `neutral-900`, monospace fonts) vs the user-facing editorial warm design (`bg-background`, `text-foreground`, serif headings, origami decorations). Any redesign should clarify if these should converge or remain distinct.

2. **Page Complexity Range:** Pages vary from simple empty states (notifications) to extremely complex admin dashboards (discovery control center with real-time polling, log streaming, multiple tabs). The onboarding wizard alone is 7 steps with multiple sub-states.

3. **Component Maturity:** The user-facing component library is well-structured with design tokens, motion presets, and consistent patterns. The admin panel, however, uses mostly raw HTML/Tailwind without the shared component library.

4. **Asset Strategy:** All illustration assets are `.webp` origami-style decorations. The `OrigamiDecoration` component provides a consistent abstraction with floating animation.

5. **Loading Patterns:** Multiple loading strategies exist: `UniversalLoader` (sequential messages), `HonestLoadingState` (step tracker), `ScoutOpeningSequence` (splash intro), and simple spinners.

6. **Empty States:** Most content pages have thoughtful empty states (bookmarks, notifications, explore no-results) with decorative elements and CTAs.
