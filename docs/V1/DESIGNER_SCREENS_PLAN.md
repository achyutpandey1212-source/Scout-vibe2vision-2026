# Designer Screens Plan

> **Document Version:** 1.0
>
> **Purpose**
>
> This document is the master blueprint for every screen in Scout.
>
> It defines:
>
> - Screen purpose
> - Information hierarchy
> - Component composition
> - Navigation
> - Empty states
> - Loading states
> - Error states
> - Responsive behavior
> - Motion guidelines
>
> This document intentionally contains **no visual styling** decisions. Those belong in `design_manifesto.md`.

---

# Product Navigation Map

```
Splash Philosophy

        ↓

Landing Page

        ↓

Google Login

        ↓

Onboarding (16 Steps)

        ↓

Dashboard

├── Opportunity Details
├── Bookmarks
├── Notifications
├── Profile
└── Settings
```

---

# Navigation Philosophy

Navigation should never feel crowded.

Maximum primary navigation items:

- Dashboard
- Saved
- Notifications
- Profile

Everything else belongs inside contextual pages.

---

# Screen 01 — Philosophy Splash

## Purpose

Introduce Scout emotionally before introducing the product.

Users should understand

> what Scout believes

before

> what Scout does.

---

## Duration

3–5 seconds

Skip automatically.

No Skip button.

---

## Content

Large editorial typography.

Sequence:

```
Every opportunity
changes someone's life.

↓

Maybe this one
changes yours.

↓

Built for women
who keep choosing tomorrow.

↓

SCOUT
```

---

## Components

Fullscreen background

Large centered typography

Fade transitions

---

## Loading

Immediately transitions to Landing.

---

## Motion

Cross fade only.

No scaling.

No rotation.

No particles.

---

## Responsive

Typography scales.

Always centered.

---

# Screen 02 — Landing Page

Purpose

Introduce Scout.

Not features.

Not AI.

The vision.

---

## Layout

Navigation

↓

Hero

↓

Why Scout

↓

How Scout Works

↓

Testimonials (future)

↓

Footer

---

## Hero

Large statement.

Supporting paragraph.

Primary CTA

Secondary CTA

Origami illustration

---

## Sections

### Hero

Headline

Supporting text

Buttons

Illustration

---

### Philosophy

Three pillars.

Opportunity

Growth

Support

---

### How Scout Works

Discover

Understand

Apply

Grow

---

### Why Women First

Explain product philosophy.

No stereotypes.

Simply explain why the product exists.

---

### Footer

Privacy

Terms

GitHub

Contact

---

## Loading

Skeleton only for dynamic sections.

---

## Empty State

N/A

---

# Screen 03 — Authentication

Purpose

Fastest possible login.

---

Layout

Logo

Welcome

Google Button

Privacy Note

---

No forms.

No passwords.

No clutter.

---

Loading

Signing in...

Verifying account...

Preparing Scout...

---

Errors

Friendly.

Retry.

---

# Screen 04 — Onboarding

Already defined separately.

---

# Screen 05 — Dashboard

Purpose

The user's daily home.

Question answered:

"What deserves my attention today?"

---

Layout

Top Navigation

↓

Welcome Header

↓

Scout Intelligence Panel

↓

Featured Opportunity

↓

Hidden Gems

↓

Recommended Opportunities

↓

Recently Added

↓

Footer

---

Component Hierarchy

Header

↓

Intelligence

↓

Featured

↓

Cards

---

Dashboard Sections

## Welcome

Good morning Maya.

Ready to discover something amazing?

---

## Scout Intelligence Panel

Summary

Applications Suggested

Saved

New Opportunities

Recommendation confidence

---

## Featured Opportunity

Large card.

Highest recommendation.

Single CTA.

---

## Hidden Gems

Horizontal scroll.

Rare opportunities.

---

## Recommended Feed

Card list.

---

## Recently Added

Newest opportunities.

---

Empty State

"We're still searching."

---

Loading

Skeleton cards.

Progress messages.

---

# Screen 06 — Opportunity Details

Purpose

Help users confidently decide.

---

Layout

Back

↓

Hero

↓

Quick Facts

↓

Description

↓

Eligibility

↓

Requirements

↓

Scout Analysis

↓

Organization

↓

Apply CTA

---

Hero

Title

Organization

Deadline

Score

Bookmark

---

Scout Analysis

Why this matches

Things to improve

Potential challenges

Estimated fit

---

Actions

Bookmark

Share

Apply

---

Empty

Opportunity removed.

---

Loading

Article skeleton.

---

# Screen 07 — Bookmarks

Purpose

Personal library.

---

Layout

Header

↓

Search

↓

Saved Cards

---

Sort

Newest

Deadline

Best Match

---

Empty

Nothing saved yet.

---

# Screen 08 — Notifications

Purpose

Important updates only.

---

Types

New recommendation

Deadline reminder

Application reminder

System updates

---

Never spam.

---

Empty

You're all caught up.

---

# Screen 09 — Profile

Purpose

User Intelligence overview.

---

Sections

Profile

↓

Current Situation

↓

Goals

↓

Skills

↓

Preferences

↓

Availability

↓

Companion Settings

---

Actions

Edit

Restart onboarding

Export profile

---

# Screen 10 — Settings

Purpose

Simple.

---

Categories

Appearance

Notifications

Language

Privacy

Security

Support

About

---

# Shared Components

---

## Top Navigation

Contains

Logo

Search

Notifications

Profile

Theme Toggle

---

Desktop

Horizontal

---

Mobile

Hamburger

Bottom navigation (future)

---

## Featured Opportunity

Large hero card.

One only.

---

## Opportunity Card

Contains

Organization

Title

Tags

Deadline

Recommendation Score

Bookmark

Apply

---

Sizes

Compact

Regular

Featured

---

## Hidden Gem Card

Smaller.

Editorial.

Unique styling.

---

## Scout Intelligence Panel

Contains

Today's opportunities

Best match

Application insights

Progress

---

## Bookmark Button

Animated.

Simple.

No confetti.

---

## Theme Toggle

Light

Dark

Remember preference.

---

# Responsive Rules

Desktop

1440+

Large whitespace.

---

Laptop

1200+

Balanced layout.

---

Tablet

768+

Single column sections.

---

Mobile

One column.

Large touch targets.

Cards become full width.

---

# Motion System

Page transitions

Fade + slight translate.

Cards

Soft lift.

Buttons

Subtle scale.

Dialogs

Fade.

Loading

Opacity pulse.

---

# Loading States

Every async action should explain itself.

Examples

Finding scholarships...

Checking deadlines...

Ranking opportunities...

Preparing recommendations...

---

Skeletons preferred.

Never blank screens.

---

# Empty States

Bookmarks

No saved opportunities.

Notifications

You're all caught up.

Dashboard

We're finding opportunities for you.

Profile

Let's complete your profile.

---

# Error States

Connection lost.

Retry.

No technical messages.

Always provide recovery.

---

# Accessibility

Keyboard friendly.

Readable typography.

ARIA labels.

Reduced motion.

High contrast.

Large click targets.

---

# Performance Targets

First Paint

<1.5 sec

Interactive

<3 sec

Page transitions

<300ms

Animations

60 FPS

Lazy load heavy assets.

---

# Design QA Checklist

Before approving any screen, verify:

✓ Follows Design Manifesto

✓ Clear hierarchy

✓ Plenty of negative space

✓ One primary action

✓ Honest loading state

✓ Helpful empty state

✓ Responsive

✓ Accessible

✓ Fast

✓ Calm

✓ Premium

✓ Women-first

✓ No visual clutter

✓ No unnecessary AI branding

✓ No glassmorphism

✓ Motion has purpose

✓ Every component earns its place

---

# Future Screens (Post-MVP)

- Opportunity Search
- Filters
- AI Mentor Chat
- Weekly Report
- Calendar
- Opportunity Timeline
- Community
- Learning Hub
- Resume Builder
- Application Tracker
- Achievements
- Streaks (if validated)
- Recruiter Profiles
- Mentor Profiles
- Referral Marketplace

---

# Final Principle

Every screen should answer one simple question:

> **"Does this make her next step clearer?"**

If the answer is yes, the screen is successful.

If it adds confusion, distraction, or unnecessary complexity, redesign it.s