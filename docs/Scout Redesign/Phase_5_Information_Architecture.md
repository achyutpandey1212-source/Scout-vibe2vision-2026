# INFORMATION_ARCHITECTURE.md

> **Version:** Scout V1
>
> This document defines Scout's complete information architecture, navigation philosophy, primary user flows, interaction principles, product hierarchy, and user journey.
>
> Information Architecture is not about pages.
>
> It is about helping users accomplish their goals with as little thinking as possible.

---

# 1. Philosophy

Scout exists for one purpose:

> **Help students discover opportunities worth applying to.**

Everything else supports this objective.

The product should never feel like a job portal.

It should feel like a curated opportunity companion.

Whenever there is uncertainty during design, always ask:

> **Does this help users discover and apply faster?**

If not, reconsider it.

---

# 2. Product Principles

Scout follows six core product principles.

## Discover First

Discovery is Scout's primary value proposition.

Recommendations deserve more attention than browsing.

---

## Reduce Decisions

Do not overwhelm users.

Prefer fewer, higher-quality options.

---

## Respect Context

Users should never lose their place.

Filters, scroll position, search state, and navigation history should always be preserved whenever possible.

---

## Be Transparent

Never fake functionality.

Never hide unfinished features.

Features that are not yet available should be clearly marked as **Coming Soon**.

---

## Everything Has A Purpose

Every page, component, button, and interaction should exist for a clear reason.

Nothing decorative should interrupt the primary workflow.

---

## Founder-Led Product

Scout is an independent product.

Users should occasionally feel there are real humans building it.

Not through intrusive marketing.

Through thoughtful interactions.

---

# 3. Core User Intentions

Scout revolves around only five user intentions.

---

## 1. Discover Opportunities

The primary purpose of Scout.

Includes:

- Dashboard recommendations
- Discover page
- Search
- Filters
- Opportunity Details

---

## 2. Save Opportunities

Allows users to revisit opportunities later.

Includes:

- Save button
- Saved page

Terminology:

Use **Saved** instead of **Bookmarks** throughout the product.

---

## 3. Manage Profile

Everything related to the user.

Includes:

- Profile
- Resume
- Preferences
- Account Settings

Resume should be treated as a first-class element rather than hidden inside settings.

---

## 4. Stay Updated

Future communication hub.

Current version:

Placeholder page.

Marked as **Coming Soon**.

Future features include:

- Notifications
- Email Briefs
- Deadline reminders
- Recommendation updates

---

## 5. Apply

Scout never submits applications.

Scout prepares students.

Users are redirected to the official opportunity portal to complete applications.

This handoff is Scout's success moment.

---

# 4. Navigation Structure

Scout intentionally keeps navigation minimal.

```
Dashboard
│
├── Discover
│      └── Opportunity Details
│
├── Saved
│      └── Opportunity Details
│
├── Notifications (Coming Soon)
│
└── Profile
```

No unnecessary nesting.

No clutter.

Navigation should remain stable across the entire product.

---

# 5. Primary User Journey

## Landing

↓

Landing Page

↓

Authentication

↓

Onboarding

↓

Recommendation Engine Processing

↓

Dashboard

---

## Recommendation Processing

After onboarding, Scout prepares personalized recommendations.

Instead of fake loading screens, Scout communicates exactly what is happening.

Example messages:

- Finding opportunities matching your profile...
- Comparing your skills with current openings...
- Looking for hidden opportunities...
- Ranking your strongest matches...
- Preparing your dashboard...

Users should understand what Scout is doing.

Never pretend the AI is "thinking."

---

# 6. Dashboard Philosophy

The Dashboard answers one question:

> **What's worth looking at today?**

It should not display everything.

Current structure:

- Featured Match
- Hidden Gem
- Three additional recommendations

Total:

Five carefully selected opportunities.

Everything else belongs in Discover.

Dashboard is Scout's home.

It deserves the highest design priority.

---

# 7. Dashboard User Flow

Dashboard

↓

View Recommendation

↓

Open Opportunity Details

↓

Read AI insights

↓

Apply Now / Visit Official Portal

↓

Return to Dashboard

↓

Original scroll position restored

↓

Continue exploring

---

# 8. Discover Flow

Dashboard

↓

Discover

↓

Browse all opportunities

↓

Search

↓

Apply filters

↓

Open Opportunity

↓

Opportunity Details

↓

Return

↓

Everything restored

State restoration includes:

- Scroll position
- Filters
- Search query
- Selected category
- Sort order

Users should continue exactly where they left.

---

# 9. Saved Flow

Dashboard

↓

Save Opportunity

↓

Saved Page

↓

Opportunity Details

↓

Apply

↓

Return

↓

Saved list remains unchanged

---

# 10. Profile Flow

Dashboard

↓

Profile

Users can:

- Edit profile
- Update resume
- Modify onboarding preferences
- Manage account

Unavailable functionality remains visible with **Coming Soon** labels.

---

# 11. Notifications

Notifications will not exist in V1.

Instead, provide a dedicated placeholder page.

Purpose:

Communicate upcoming functionality without misleading users.

Example future items:

- New matching opportunity
- Deadline reminder
- Weekly Brief
- Recommendation refresh

Every unavailable option should display:

**Coming Soon**

---

# 12. Coming Soon Philosophy

Scout never hides future functionality.

Instead:

Display features transparently.

Example:

```
Weekly Email Brief

Personalized weekly opportunity summaries.

Coming Soon

[ Vote for this Feature ]
```

This communicates product direction while collecting demand.

---

# 13. Feature Voting

Upcoming features can collect community interest.

Example interaction:

```
🔥 28 people want this

[ Vote for this Feature ]
```

After voting:

```
🔥 29 people want this

✓ You're on the list.
```

Voting principles:

- One vote per user
- Button becomes non-clickable after voting
- Users cannot remove votes
- Immediate visual feedback
- Count updates instantly

Purpose:

Prioritize roadmap based on real user demand.

---

# 14. Community Signals

Feature demand should become visible.

Examples:

```
🔥 34 users waiting
```

```
⭐ Community Favorite
```

```
Popular Request
```

Social proof encourages engagement.

Initial launch may begin with genuine early supporters before growing organically.

---

# 15. State Restoration

State preservation is a core UX principle.

Whenever users return from an Opportunity Details page, restore:

- Scroll position
- Search
- Filters
- Sort
- Current pagination chunk

Users should never lose context.

---

# 16. Search Philosophy

Search should prioritize speed.

Results update instantly.

Avoid unnecessary page refreshes.

Search is one of the highest-frequency interactions.

---

# 17. Filters

V1 keeps filters intentionally simple.

Examples:

- Internship
- Scholarship
- Fellowship
- Hackathon
- Government
- Competition

Additional filters can evolve later.

Avoid overwhelming users.

---

# 18. Success Metric

Scout's primary success metric:

```
Recommendation

↓

Opportunity Details

↓

Apply Now
```

Everything should optimize this journey.

---

# 19. Post-Application Feedback

After users return from an external application page, Scout may display a subtle feedback prompt.

Example:

```
Were we able to help?

○ Yes, I applied

○ Not this time

○ I wasn't eligible

○ I couldn't find enough information
```

Purpose:

Measure whether Scout successfully helped users progress toward an opportunity.

This becomes Scout's most valuable product metric.

---

# 20. Product Analytics

Scout should track user intentions—not just page views.

Recommended events include:

- Landing Viewed
- Signup Started
- Signup Completed
- Onboarding Started
- Onboarding Completed
- Dashboard Viewed
- Recommendation Clicked
- Recommendation Expanded
- Discover Viewed
- Search Used
- Filter Changed
- Opportunity Opened
- Opportunity Saved
- Opportunity Unsaved
- Apply Now Clicked
- Profile Updated
- Resume Uploaded
- Resume Replaced

Additional metadata should include:

- Opportunity ID
- Opportunity Type
- Source
- Recommendation Position
- Match Score
- Time spent on details page

These events help improve recommendations and understand user behavior.

---

# 21. Analytics Platform

Do not build custom analytics.

Recommended stack:

- **PostHog** for product analytics, funnels, feature usage, retention, feature flags, and event tracking.
- **Microsoft Clarity** for session recordings and heatmaps.

This provides enterprise-grade product insights with minimal implementation effort.

---

# 22. Founder Introduction

Scout embraces being founder-led.

Instead of aggressive marketing, introduce the founder naturally.

Trigger conditions:

- Approximately 30 seconds on the landing page
- OR around 40% page scroll
- OR second visit

Avoid interrupting users immediately upon landing.

---

## Example

```
👋 Hey, I'm Achyut.

Thanks for trying Scout.

This is the first public version and I'm personally building it.

If you have an idea, find a bug, want to become a beta tester, collaborate, or simply say hello, I'd genuinely love to hear from you.

[ Connect on LinkedIn ]

[ Join Beta Testers ]

[ Maybe Later ]
```

Purpose:

Build trust.

Create meaningful founder-user relationships.

Avoid feeling like an advertisement.

---

# 23. Feedback Philosophy

Avoid traditional feedback forms whenever possible.

Instead, collect feedback contextually.

Examples:

After applying.

After long Discover sessions.

After repeated feature usage.

Feedback should feel like part of the experience—not additional work.

---

# 24. Custom System Pages

Scout should include branded versions of:

- 404
- Loading
- Empty States

Every system page should reinforce Scout's identity while remaining helpful and calm.

---

# 25. Naming Decisions

Final terminology:

| Old | Final |
|------|-------|
| Explore | Discover |
| Bookmark | Save |
| Bookmarks | Saved |
| AI Recommendations | Recommended for You |
| Dashboard | Dashboard |
| Notifications | Notifications (Coming Soon) |

Language should remain simple, human, and consistent.

---

# 26. Information Architecture Checklist

Before introducing any new page or feature, ask:

- Does this help users discover opportunities?
- Does this reduce friction?
- Does this preserve context?
- Is the navigation still simple?
- Does this respect user attention?
- Is unfinished functionality clearly labeled?
- Does this improve Scout's primary success metric?

If the answer is "No," the feature should be reconsidered.

---

# 27. Final Philosophy

Scout should never feel like a crowded job portal.

It should feel like a focused opportunity companion.

Users should spend less time navigating and more time discovering opportunities worth pursuing.

Every interaction should reinforce Scout's core promise:

> **Discover opportunities you might have otherwise missed—and act on them with confidence.**