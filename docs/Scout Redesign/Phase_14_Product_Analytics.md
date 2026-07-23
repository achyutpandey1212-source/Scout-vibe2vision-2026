# Phase 14: Scout Product Analytics Audit & Specification

> **Document Status**: Complete Product Analytics Specification & Event Taxonomy  
> **Target Application**: Scout — AI-Powered Opportunity Intelligence Platform  
> **Author**: Antigravity AI Engineering Team  
> **Date**: July 23, 2026  

---

## 1. Analytics Philosophy

Scout does **not** track page views for vanity. Scout tracks **user success and intent**.

Traditional analytics platforms overwhelm teams with vanity metrics like raw pageviews, bounce rates, and session durations. In an AI-powered opportunity intelligence platform like Scout, standard web analytics fail to measure what actually matters: **Did Scout help a student find a life-changing opportunity today?**

### Core Questions Scout Analytics Must Answer:
1. **Onboarding Efficiency**: Are users completing the 7-step onboarding flow, or are specific steps causing drop-offs?
2. **Recommendation Relevance**: Are users clicking, bookmarking, and applying to the 5 daily recommendations generated for them?
3. **Intent & Action**: Which categories (Internships, Fellowships, Hackathons, Scholarships) drive real application clicks?
4. **Resume Impact**: Does uploading a resume increase match confidence, recommendation engagement, and application rate?
5. **Feature Adoption**: Are users engaging with the AI Career Report (Strengths, Skill Gap Guidance, Interview Topics) or bypassing it?
6. **Retention Drivers**: What behaviors on Day 1 correlate with Day 7 and Day 30 retention?

### Guiding Principles:
- **Track Intent Over Volume**: Capturing a single `opportunity_applied` event is 100x more valuable than tracking 50 scroll events.
- **Privacy First (Zero PII)**: Never record resume text, phone numbers, exact addresses, or personal credentials.
- **Actionable Telemetry**: Every event defined in this specification maps directly to a business decision, product iteration, or conversion funnel.

---

## 2. User Journey Map

The following map illustrates every user flow and screen transition within Scout, from initial landing to daily active retention:

```
[Unauthenticated Visitor]
   │
   ├─► Landing Page (/) 
   │    ├── Opening Splash Sequence (ScoutOpeningSequence)
   │    ├── Hero CTA ("Get Started")
   │    ├── Source Marquee & Live Stats
   │    ├── Dashboard Preview Mockup
   │    └── Founder Card / Feedback Prompts
   │
   ├─► Authentication (/login & /signup)
   │    ├── Google OAuth / Password Sign-In
   │    ├── Email/Password Sign-Up
   │    └── Guest Sign-In Mode
   │
[Authenticated User]
   │
   ├─► Onboarding Flow (/onboarding)
   │    ├── Step 1: Basic Profile (Name, Gender, Location)
   │    ├── Step 2: Academic Status (College, Degree, Branch, Year, Graduation)
   │    ├── Step 3: Target Roles & Aspirations (Role preferences)
   │    ├── Step 4: Technical Skills Selection (Taxonomy selection)
   │    ├── Step 5: Confidence & Matching Preferences (Behavioral traits)
   │    ├── Step 6: Opportunity Types Selection (Types preferences)
   │    └── Step 7: Resume Upload & Extraction Review
   │         ├── File Selection & Upload (PDF/DOCX)
   │         └── Rich Parsed Review (Education, Experience, Projects, Skills)
   │
   ├─► Recommendation Generation Transition (/onboarding -> rec gen screen)
   │    ├── Polling Recommendation Status (recommendationsApi.list())
   │    ├── Rotating Informational Status Messages
   │    └── Success Confirmation Screen (1.8s delay -> READY)
   │
   └─► Main Product Experience (/dashboard)
        │
        ├─► Dashboard (/dashboard)
        │    ├── TodaysMissionCard (Greeting & Match Summary)
        │    ├── Featured Match Card (Today's Best Match)
        │    ├── Hidden Gem Card
        │    ├── More Opportunities Grid (Stretch Goal, Quick Win, Confidence Builder)
        │    ├── Bookmark Toggle (Optimistic)
        │    └── Discover CTA -> Navigate to Explore
        │
        ├─► Opportunity Details (/opportunity/[id])
        │    ├── Opportunity Metadata & Description
        │    ├── Bookmark & Official Application Link ("Apply Now")
        │    └── Scout AI Career Report Sidebar
        │         ├── Executive Summary & Why Scout Picked This
        │         ├── Strongest Strengths
        │         ├── Dynamic Skill Gap Guidance
        │         ├── Resume Improvements & Interview Prep
        │         └── Verdict & Next Action
        │
        ├─► Discover / Explore (/explore)
        │    ├── Debounced Search Bar (400ms)
        │    ├── Category Filter Pills (All, Internship, Fellowship, etc.)
        │    ├── Sort Dropdown (Best Match, Deadline, Newest)
        │    ├── Infinite Scroll Opportunity Grid
        │    └── Clear Filters & Empty Search State
        │
        ├─► Saved Opportunities (/bookmarks)
        │    ├── Bookmarked Opportunity Grid
        │    ├── Optimistic Bookmark Removal
        │    └── Empty State CTA -> Navigate to Explore
        │
        ├─► Profile & Settings (/profile)
        │    ├── Real User Identity & Academic Card
        │    ├── Rich Resume Extraction Summary
        │    ├── Inline Resume Upload & Re-Parsing Modal (Upload Dropzone & Progress)
        │    ├── Companion Preferences Card (Coming Soon & Real-time Feature Vote)
        │    └── Sign Out Action
        │
        └─► System Pages (Global Error Handling)
             ├── 404 Not Found Page (not-found.tsx) -> Go to Dashboard / Discover
             └── Application Error Page (error.tsx) -> Try Again (reset) / Go to Dashboard
```

---

## 3. Screen-by-Screen Event Audit

### Screen 1: Landing Page (`/`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `landing_page_viewed` | Page mounted | `referrer`, `is_authenticated`, `has_played_splash` | P0 | Measure top-of-funnel traffic and return visits. |
| `landing_splash_completed` | Opening animation finished or skipped | `duration_ms`, `skipped` | P2 | Track splash animation completion vs skip rates. |
| `landing_hero_cta_clicked` | "Get Started" clicked | `user_state` (auth/guest), `target_url` | P0 | Measure primary landing conversion intent. |
| `landing_secondary_cta_clicked` | "See How Scout Works" clicked | `scroll_target` | P1 | Measure feature exploration intent. |
| `landing_login_clicked` | Top nav "Sign In" clicked | `target_url` | P1 | Measure returning user sign-in intent. |
| `landing_dashboard_preview_interacted` | Preview mockup card clicked | `card_id`, `card_title` | P2 | Measure interactive preview engagement. |
| `landing_theme_switched` | Dark/Light mode toggle clicked | `theme` (light/dark) | P2 | Track visual mode preference on landing. |
| `landing_founder_card_opened` | Founder card expanded | `time_on_page_seconds` | P2 | Measure brand trust engagement. |
| `landing_founder_card_dismissed` | Founder card closed | `time_visible_seconds` | P2 | Track prompt dismissal rate. |
| `landing_founder_linkedin_clicked` | Founder LinkedIn link clicked | `source` | P2 | Track social trust links. |
| `landing_founder_whatsapp_clicked` | Founder WhatsApp link clicked | `source` | P2 | Track direct user feedback outreach. |

---

### Screen 2: Authentication (`/login` & `/signup`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `auth_page_viewed` | Login or Signup page mounted | `mode` (`login` \| `signup`) | P0 | Measure auth landing traffic. |
| `auth_google_started` | "Sign in with Google" clicked | `mode` (`login` \| `signup`) | P0 | Measure OAuth adoption intent. |
| `auth_google_succeeded` | OAuth flow completed | `mode`, `is_new_user` | P0 | Measure Google OAuth conversion rate. |
| `auth_email_login_submitted` | Password login form submitted | `email_domain` | P0 | Measure email password login attempts. |
| `auth_email_signup_submitted` | Password signup form submitted | `email_domain` | P0 | Measure new email account registrations. |
| `auth_guest_login_clicked` | "Continue as Guest" clicked | `source` | P0 | Measure frictionless trial conversion. |
| `auth_failed` | Auth operation returned error | `mode`, `error_code`, `error_message` | P0 | Identify friction points & auth bugs. |
| `auth_signed_out` | Logout button clicked | `source_screen` (`profile` \| `sidebar`) | P1 | Measure session termination. |

---

### Screen 3: Onboarding Flow (`/onboarding`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `onboarding_started` | Onboarding Step 1 mounted | `user_id`, `version` (`2`) | P0 | Track onboarding funnel initiation. |
| `onboarding_step_completed` | "Next" button clicked on Step 1-6 | `step_number`, `step_name`, `time_spent_seconds` | P0 | Pinpoint step-by-step drop-off. |
| `onboarding_step_back_clicked` | "Back" button clicked | `from_step`, `to_step` | P1 | Measure user hesitation / edit behavior. |
| `onboarding_resume_upload_started` | File selected in Step 7 | `file_type` (`pdf` \| `docx`), `file_size_kb` | P0 | Measure resume upload initiation. |
| `onboarding_resume_upload_succeeded` | Resume parsed by backend | `file_size_kb`, `extracted_skills_count`, `extracted_projects_count` | P0 | Track parsing success and data yield. |
| `onboarding_resume_upload_failed` | Resume upload returned error | `error_message`, `file_type` | P0 | Detect document parsing failures. |
| `onboarding_resume_data_edited` | User edited extracted field | `field_type` (`skills` \| `projects` \| `education` \| `experience`) | P1 | Measure parser accuracy & manual correction. |
| `onboarding_completed` | Final step submitted | `total_time_seconds`, `resume_uploaded` (bool), `skills_count` | P0 | Primary onboarding conversion milestone. |
| `onboarding_abandoned` | User navigated away before completion | `last_step_completed`, `time_spent_seconds` | P0 | Identify friction and exit points. |

---

### Screen 4: Recommendation Generation Transition Screen

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `rec_gen_started` | Recommendation status polling starts | `profile_completeness_score` | P0 | Measure generation engine invocation. |
| `rec_gen_status_polled` | Status update received from backend | `status` (`SCORING` \| `FILTERING` \| `GENERATING` \| `READY`), `duration_seconds` | P1 | Monitor engine latency and phase timing. |
| `rec_gen_succeeded` | Status reaches `READY` | `total_wait_seconds`, `recommendations_count` | P0 | Confirm engine completion success. |
| `rec_gen_failed` | Polling timed out or returned error | `error_message`, `total_wait_seconds` | P0 | Detect engine generation bottlenecks. |
| `rec_gen_confirmation_shown` | 1.8s success banner displayed | `duration_ms` | P2 | Validate transition animation UX. |

---

### Screen 5: Dashboard Screen (`/dashboard`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `dashboard_viewed` | Dashboard page mounted | `recommendations_count`, `has_featured_match`, `freshness_minutes` | P0 | Track main product view. |
| `dashboard_mission_card_viewed` | TodaysMissionCard rendered | `user_name`, `match_count` | P1 | Confirm briefing header exposure. |
| `dashboard_featured_match_clicked` | "Today's Best Match" card clicked | `opportunity_id`, `title`, `company`, `match_score` | P0 | Measure engagement with #1 recommendation. |
| `dashboard_hidden_gem_clicked` | "Hidden Gem" card clicked | `opportunity_id`, `title`, `company`, `match_score` | P0 | Measure engagement with alternative match. |
| `dashboard_opportunity_card_clicked` | Card in "More Opportunities" grid clicked | `opportunity_id`, `slot`, `match_score` | P0 | Measure secondary recommendation clicks. |
| `dashboard_bookmark_toggled` | Bookmark icon clicked on card | `opportunity_id`, `is_bookmarked` (bool), `slot` | P0 | Measure immediate save intent. |
| `dashboard_discover_cta_clicked` | "Looking for more?" CTA clicked | `source` (`dashboard_footer`) | P1 | Track funnel transition from Dashboard to Explore. |
| `dashboard_refresh_clicked` | "Refresh Recommendations" clicked | `reason` | P1 | Measure user demand for fresh recs. |
| `dashboard_silent_retry_triggered` | Network retry executed silently | `retry_count`, `delay_ms` | P2 | Track network resilience events. |

---

### Screen 6: Opportunity Details Page (`/opportunity/[id]`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `opportunity_details_viewed` | Details page loaded | `opportunity_id`, `title`, `company`, `match_score`, `is_bookmarked` | P0 | Core opportunity impression event. |
| `opportunity_apply_clicked` | "Apply Now" or "Apply on Official Portal" clicked | `opportunity_id`, `title`, `company`, `application_url` | P0 | **Primary Business Metric**: High-intent job application click. |
| `opportunity_bookmark_toggled` | Bookmark button clicked | `opportunity_id`, `is_bookmarked` (bool) | P0 | Measure save intent on details view. |
| `opportunity_original_source_clicked` | "Visit official source portal" clicked | `opportunity_id`, `source_url` | P1 | Measure source verification intent. |
| `opportunity_report_section_viewed` | AI Career Report section scrolled into view | `opportunity_id`, `section_name` (`strengths` \| `skill_gaps` \| `resume_tips` \| `interview_topics` \| `verdict`) | P1 | Measure AI report section readership. |
| `opportunity_back_clicked` | "Back" button clicked | `opportunity_id`, `referrer` | P2 | Track navigation flow back to origin. |

---

### Screen 7: Explore / Discover Page (`/explore`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `explore_page_viewed` | Explore page mounted | `total_count` | P0 | Track catalog discovery traffic. |
| `explore_search_performed` | Search query debounced (400ms) | `search_query_length`, `results_count` | P0 | Measure search intent (query string omitted for privacy if sensitive). |
| `explore_category_filter_selected` | Category pill clicked | `category` (`INTERNSHIP` \| `FELLOWSHIP` \| `SCHOLARSHIP` \| etc.) | P0 | Track category interest distribution. |
| `explore_sort_changed` | Sort dropdown changed | `sort_by` (`match` \| `deadline` \| `newest`) | P1 | Measure sorting preferences. |
| `explore_infinite_scroll_loaded` | Next page fetched via scroll | `page_number`, `items_loaded_count` | P1 | Track catalog depth exploration. |
| `explore_card_clicked` | Opportunity card clicked | `opportunity_id`, `title`, `position_index` | P0 | Measure search result click-through rate. |
| `explore_bookmark_toggled` | Bookmark icon clicked | `opportunity_id`, `is_bookmarked` (bool) | P0 | Measure saving while exploring. |
| `explore_filters_cleared` | "Clear Filters" clicked | `previous_category`, `had_search_query` | P1 | Track filter reset rate. |
| `explore_empty_state_shown` | Search/filter yielded 0 results | `category`, `has_search_query` | P0 | Detect content gaps in catalog. |

---

### Screen 8: Saved / Bookmarks Page (`/bookmarks`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `bookmarks_page_viewed` | Saved page mounted | `total_saved_count` | P0 | Track saved portfolio engagement. |
| `bookmarks_item_removed` | Bookmark icon toggled off | `opportunity_id`, `remaining_count` | P0 | Track item removal/cleanup rate. |
| `bookmarks_card_clicked` | Saved opportunity card clicked | `opportunity_id`, `title` | P0 | Measure revisit-to-detail rate. |
| `bookmarks_empty_state_cta_clicked` | "Discover Opportunities" clicked on empty state | `source` (`bookmarks_empty`) | P1 | Measure empty state recovery. |

---

### Screen 9: Profile & Settings Page (`/profile`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `profile_page_viewed` | Profile page mounted | `has_resume`, `skills_count`, `career_goals_count` | P0 | Track profile page traffic. |
| `profile_resume_update_modal_opened` | "Update Resume" button clicked | `source` (`profile_page`) | P0 | Track resume refresh intent. |
| `profile_resume_file_selected` | File picked in modal | `file_type`, `file_size_kb` | P1 | Measure file selection in modal. |
| `profile_resume_upload_succeeded` | Modal resume upload parsed | `file_size_kb`, `extracted_skills_count`, `extracted_projects_count` | P0 | Track inline resume re-parsing success. |
| `profile_resume_modal_done_clicked` | "Done" button clicked on summary modal | `extracted_skills_count` | P1 | Track modal completion dismissal. |
| `profile_feature_voted` | "Vote for this feature" clicked | `feature_name` (`companion_preferences`), `vote_count` | P0 | **Key Product Signal**: Measure feature demand. |
| `profile_signout_clicked` | "Logout" button clicked | `source` (`profile_header`) | P1 | Track intentional user sign-out. |

---

### Screen 10: System & Error Pages (`not-found.tsx` & `error.tsx`)

| Event Name | Trigger | Properties | Priority | Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `system_404_viewed` | 404 page rendered | `attempted_url`, `is_authenticated` | P0 | Identify broken links & missing routes. |
| `system_404_dashboard_clicked` | "Go to Dashboard" clicked | `is_authenticated` | P1 | Track 404 recovery to Dashboard. |
| `system_404_explore_clicked` | "Discover Opportunities" clicked | `is_authenticated` | P1 | Track 404 recovery to Explore. |
| `system_error_viewed` | Error boundary page rendered | `error_message`, `error_digest`, `is_authenticated` | P0 | Detect runtime crashes & unhandled exceptions. |
| `system_error_try_again_clicked` | "Try Again" (`reset()`) clicked | `error_digest` | P0 | Track error recovery attempts. |
| `system_error_dashboard_clicked` | "Go to Dashboard" clicked | `is_authenticated` | P1 | Track error recovery to Dashboard. |

---

## 4. Authentication Audit

All authentication methods must be tracked with strict security (zero passwords or tokens recorded):

```typescript
// Auth Event Specification
auth_signed_in {
  method: 'google' | 'email' | 'guest';
  is_new_user: boolean;
  user_id: string;
}

auth_signed_up {
  method: 'email' | 'google';
  email_domain: string; // e.g. "gmail.com", "msit.in"
}

auth_guest_converted {
  converted_to: 'google' | 'email';
  onboarding_completed: boolean;
}

auth_session_restored {
  user_id: string;
  onboarding_version: number;
}
```

---

## 5. Onboarding Audit

Step-by-step breakdown of telemetry collected during onboarding:

```typescript
// Onboarding Step Events
onboarding_step_viewed { step: 1..7, step_name: string }
onboarding_step_next_clicked { step: 1..7, duration_seconds: number }
onboarding_step_back_clicked { step: 1..7 }
onboarding_skills_selected { skills_count: number, categories_touched: string[] }
onboarding_resume_uploaded { file_format: 'pdf' | 'docx', size_bytes: number }
onboarding_resume_parsed { 
  success: boolean;
  skills_found: number;
  projects_found: number;
  experience_found: number;
  education_found: number;
  latency_ms: number;
}
onboarding_completed {
  total_duration_seconds: number;
  gender: string;
  career_stage: string;
  college_provided: boolean;
  degree_provided: boolean;
  resume_uploaded: boolean;
}
```

---

## 6. Dashboard Audit

```typescript
// Dashboard Engagement Events
dashboard_rendered {
  recommendations_total: number;
  has_perfect_match: boolean;
  has_hidden_gem: boolean;
  freshness_minutes: number;
}

dashboard_card_interacted {
  card_type: 'perfect_match' | 'hidden_gem' | 'stretch_goal' | 'quick_win' | 'confidence_builder';
  opportunity_id: string;
  action: 'click' | 'bookmark';
}
```

---

## 7. Opportunity Details Audit

```typescript
// Opportunity Details Engagement Events
opportunity_details_opened {
  opportunity_id: string;
  match_score: number;
  organization: string;
  source: 'dashboard' | 'explore' | 'bookmarks';
}

opportunity_application_started {
  opportunity_id: string;
  application_url: string;
  time_spent_on_page_seconds: number;
}

opportunity_ai_report_read {
  opportunity_id: string;
  sections_viewed: ('strengths' | 'skill_gaps' | 'resume_tips' | 'interview_topics')[];
}
```

---

## 8. Explore (Discover) Audit

```typescript
// Explore Search & Filter Events
explore_search_executed {
  query_length: number;
  results_count: number;
  has_results: boolean;
}

explore_filter_applied {
  category: string; // 'INTERNSHIP', 'FELLOWSHIP', etc.
  sort_by: 'match' | 'deadline' | 'newest';
}

explore_infinite_scroll_triggered {
  page_number: number;
  items_returned: number;
}
```

---

## 9. Saved (Bookmarks) Audit

```typescript
// Bookmarks Events
bookmark_added {
  opportunity_id: string;
  source_screen: 'dashboard' | 'explore' | 'opportunity_details';
}

bookmark_removed {
  opportunity_id: string;
  source_screen: 'bookmarks_page' | 'explore' | 'dashboard';
  time_saved_days: number;
}
```

---

## 10. Profile Audit

```typescript
// Profile & Resume Update Events
profile_updated {
  fields_changed: string[];
}

profile_resume_reparsed {
  new_skills_count: number;
  new_projects_count: number;
}

profile_feature_voted {
  feature_key: 'companion_preferences';
  total_votes_shown: number;
}
```

---

## 11. Landing Engagement Audit

```typescript
// Landing Interaction Events
landing_hero_button_clicked { button_text: 'Get Started' | 'See How Scout Works' }
landing_stats_viewed { live_opportunities: number, live_sources: number }
landing_founder_card_action { action: 'open' | 'dismiss' | 'linkedin' | 'whatsapp' }
```

---

## 12. Global Events

```typescript
// Global Telemetry Events
global_theme_changed { theme: 'light' | 'dark' }
global_error_caught { error_name: string, location: string }
global_network_retried { endpoint: string, retry_attempt: number }
```

---

## 13. Recommended Event Properties Schema

### Standard Super-Properties (Attached to EVERY Event):
```typescript
interface ScoutSuperProperties {
  app_version: string;             // e.g. "2.0.0"
  environment: string;             // "production" | "staging" | "development"
  user_id: string | null;          // Obfuscated user ID
  user_role: string;               // "student" | "admin" | "guest"
  is_authenticated: boolean;       // true | false
  device_type: 'mobile' | 'tablet' | 'desktop';
  theme: 'light' | 'dark';
  current_path: string;            // e.g. "/dashboard"
}
```

### Specific Event Payload Example: `opportunity_applied`
```typescript
interface OpportunityAppliedProperties extends ScoutSuperProperties {
  opportunity_id: string;
  opportunity_title: string;
  organization: string;
  category: string;                // "INTERNSHIP", "FELLOWSHIP", etc.
  match_score: number;             // e.g. 92
  is_women_only: boolean;
  stipend_amount: number | null;
  source_screen: 'dashboard' | 'explore' | 'opportunity_details';
  time_spent_seconds: number;
}
```

### 🔒 STRICT PRIVACY RULE (Zero PII):
**NEVER** record the following in any event property:
- Raw resume document text or file binaries
- User phone numbers, passwords, auth tokens
- User home addresses or precise GPS coordinates
- Full user email addresses (only send anonymized domain if needed for institutional analytics e.g. `@msit.in`)

---

## 14. User Properties (Persistent Persona Traits)

PostHog user properties allow cohort segmentation without inspecting event history.

| User Property Name | Type | Source | Business Value / Usage |
| :--- | :--- | :--- | :--- |
| `onboarding_completed` | `boolean` | Onboarding Step 7 | Segment active vs un-onboarded users. |
| `onboarding_version` | `number` | Onboarding | Identify onboarding cohort (v1 vs v2). |
| `career_stage` | `string` | Onboarding Step 2 | e.g. "3rd Year", "Final Year", "Recent Grad". |
| `degree` | `string` | Onboarding Step 2 | e.g. "B.Tech", "BCA", "MCA". |
| `branch` | `string` | Onboarding Step 2 | e.g. "Electronics and Communication", "CSE". |
| `college` | `string` | Onboarding Step 2 | Institutional cohort analysis. |
| `expected_graduation_year`| `number` | Onboarding Step 2 | Cohort segmentation by graduation class. |
| `resume_uploaded` | `boolean` | Onboarding Step 7 / Profile | Segment resume-backed vs manual profiles. |
| `technical_skills_count` | `number` | Profile | User profile depth score. |
| `target_roles_count` | `number` | Onboarding Step 3 | Measure breadth of career interest. |
| `total_bookmarks_saved` | `number` | Bookmarks API | High-intent engagement tier. |
| `total_applications_clicked`| `number` | Opportunity Details | Super-user conversion score. |
| `feature_voted_companion` | `boolean` | Profile Page | Feature interest cohort. |

---

## 15. Funnels

### Funnel 1: Acquisition to Recommendation Ready (Core Conversion)
```
Landing Page Viewed
  │
  ├─► Auth Started (Google / Email / Guest)
  │
  ├─► Onboarding Started (Step 1)
  │
  ├─► Resume Uploaded (Step 7)
  │
  ├─► Onboarding Completed
  │
  └─► Recommendations Ready (Status READY)
```

### Funnel 2: Daily Briefing to Application Click (Value Realization)
```
Dashboard Viewed
  │
  ├─► Opportunity Card Clicked (Featured / Hidden Gem / Grid)
  │
  ├─► Opportunity Details Opened
  │
  ├─► AI Report Section Read
  │
  └─► Official Application Clicked ("Apply Now")
```

### Funnel 3: Catalog Discovery to Save (Catalog Intent)
```
Explore Page Viewed
  │
  ├─► Search Executed OR Category Filter Applied
  │
  ├─► Opportunity Card Clicked
  │
  └─► Bookmark Toggled ON
```

---

## 16. Retention & Key Performance Indicators (KPIs)

| Metric | Target Goal | Calculation Formula | Business Significance |
| :--- | :--- | :--- | :--- |
| **Day 1 Retention** | > 45% | % of users returning 24h after onboarding | Validates initial dashboard impression. |
| **Day 7 Retention** | > 25% | % of users active on Day 7 | Measures weekly opportunity briefing habit. |
| **Day 30 Retention** | > 15% | % of users active on Day 30 | Measures long-term career platform value. |
| **Onboarding Completion Rate**| > 75% | `(Onboarding Completed / Onboarding Started) * 100` | Identifies setup friction. |
| **Resume Upload Rate** | > 60% | `(Users with Resume Uploaded / Total Onboarded) * 100` | Drives AI recommendation match quality. |
| **Recommendation Apply Rate** | > 20% | `(Users clicking Apply on Rec / Total Rec Views) * 100` | Core measure of AI recommendation quality. |
| **Bookmark-to-Apply Ratio** | > 35% | `(Total Apply Clicks / Total Bookmarks Saved) * 100` | Measures conversion from save to action. |

---

## 17. Feedback Triggers & Cooldown Rules

Scout must **never** interrupt onboarding or early usage with annoying feedback popups. Feedback prompts must trigger only after meaningful value realization.

### Trigger Rule 1: High-Intent Application Milestone
- **Trigger**: Display feedback modal immediately after user clicks `"Apply Now"` for the **3rd time**.
- **Message**: *"How are today's recommendations matching your goals?"*
- **Cooldown**: 14 days if dismissed. Never show again if submitted.

### Trigger Rule 2: Bookmarking Milestone
- **Trigger**: Display subtle toast feedback prompt when user bookmarks their **5th opportunity**.
- **Message**: *"Scout is learning your taste. Rate today's recommendations?"*
- **Cooldown**: 21 days if dismissed.

### Trigger Rule 3: Return Visit Engagement
- **Trigger**: Display feature feedback prompt on the **4th active day** (Day 4 return visit).
- **Dismissal Logic**: Single-tap "Dismiss" hides all prompts for 30 days.

---

## 18. Feature Flag Candidates

To enable safe canary releases, A/B testing, and phased rollouts, the following features must be wrapped in feature flags:

| Feature Flag Key | Default State | Target Audience | Purpose / Experiment |
| :--- | :--- | :--- | :--- |
| `ff_companion_preferences` | `false` | Beta Cohort / Feature Voters | Test advanced recommendation customization controls. |
| `ff_weekly_email_digest` | `false` | All Users | Phased rollout of weekly curated opportunity digests. |
| `ff_browser_extension_banner`| `false` | Desktop Users | Promotes upcoming Scout web clipping extension. |
| `ff_community_benchmarks` | `false` | Final Year Students | Displays peer application benchmarks on opportunity details. |
| `ff_instant_resume_reparse` | `true` | All Users | Controls real-time in-page resume re-parsing modal. |

---

## 19. Event Naming Convention

All Scout telemetry events must strictly adhere to the following naming specification:

### Naming Syntax Rules:
1. **Format**: `snake_case` (all lowercase, underscores separating words).
2. **Structure**: `[domain]_[object]_[action_past_tense]`
   - Example: `opportunity_card_clicked`
   - Example: `onboarding_step_completed`
   - Example: `profile_resume_uploaded`
3. **No Abbreviations**: Use `opportunity` (not `opp`), `recommendation` (not `rec`), `authentication` (not `auth_usr`).

### Examples:
- ✅ **Correct**: `opportunity_bookmark_added`, `explore_search_executed`, `landing_hero_cta_clicked`
- ❌ **Incorrect**: `clickCard`, `OppBookmark`, `search`, `onboardingStep2`

---

## 20. Analytics Event Priority Matrix

### Priority 0: P0 (Must Track Before Beta Launch)
- `landing_page_viewed`, `landing_hero_cta_clicked`
- `auth_google_succeeded`, `auth_email_signup_submitted`, `auth_failed`
- `onboarding_started`, `onboarding_step_completed`, `onboarding_resume_upload_succeeded`, `onboarding_completed`
- `rec_gen_started`, `rec_gen_succeeded`
- `dashboard_viewed`, `dashboard_featured_match_clicked`, `dashboard_bookmark_toggled`
- `opportunity_details_viewed`, `opportunity_apply_clicked`
- `explore_page_viewed`, `explore_search_performed`, `explore_category_filter_selected`
- `bookmarks_page_viewed`, `bookmarks_item_removed`
- `profile_page_viewed`, `profile_resume_upload_succeeded`, `profile_feature_voted`
- `system_404_viewed`, `system_error_viewed`

### Priority 1: P1 (Should Track for V1.1 Analytics)
- `landing_secondary_cta_clicked`, `landing_founder_card_opened`
- `onboarding_step_back_clicked`, `onboarding_resume_data_edited`
- `rec_gen_status_polled`
- `dashboard_hidden_gem_clicked`, `dashboard_discover_cta_clicked`, `dashboard_refresh_clicked`
- `opportunity_original_source_clicked`, `opportunity_report_section_viewed`
- `explore_sort_changed`, `explore_infinite_scroll_loaded`, `explore_filters_cleared`
- `profile_resume_update_modal_opened`, `profile_signout_clicked`
- `system_error_try_again_clicked`

### Priority 2: P2 (Nice to Have / Future Iterations)
- `landing_splash_completed`, `landing_theme_switched`, `landing_dashboard_preview_interacted`
- `dashboard_silent_retry_triggered`
- `opportunity_back_clicked`
- `global_theme_changed`

---

> **Specification Summary**: This document provides the complete, authoritative analytics audit and event taxonomy for Scout. It will serve as the exact blueprint when installing PostHog or any product analytics SDK in future releases.
