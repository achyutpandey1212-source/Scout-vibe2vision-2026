# Opportunity Details

## Purpose

The Opportunity Details page exists to help users make an informed decision before applying.

The Dashboard answers:

> "What should I look at?"

The Details page answers:

> "Should I actually apply?"

This page should remove uncertainty, explain *why* Scout recommended the opportunity, and confidently guide the user toward the official application page.

---

# Page Goal

By the time users leave this page, they should:

- Understand the opportunity.
- Understand why Scout recommended it.
- Know whether they're eligible.
- Know what skills they may still need.
- Feel confident enough to apply.

---

# Layout

Two-column desktop layout.

### Left Column

Opportunity information.

Contents:

- Opportunity Title
- Organization
- Opportunity Type
- Location
- Work Mode
- Stipend / Salary
- Duration
- Deadline
- Eligibility
- Tags
- Description
- Responsibilities
- Requirements
- Benefits
- About Organization

This column remains content-focused.

---

### Right Column

Scout Intelligence Panel.

Sticky while scrolling.

Contents:

- Match Score
- Recommendation Category
- Personalized Recommendation
- Why Now
- Skills Worth Building
- First Action
- Save Opportunity
- Apply Now

This panel is Scout's unique value proposition.

It should remain visible while users explore the opportunity.

---

# Recommendation Section

Instead of overwhelming users with technical explanations, keep recommendations concise and actionable.

Display:

### Why Scout Recommended This

Personalized recommendation.

---

### Why Now

Why this opportunity is timely for the user.

---

### Skills Worth Building

Positive wording.

Avoid:

Missing Skills

Instead:

Skills Worth Building

Display as lightweight chips.

---

### First Action

Small actionable suggestion before applying.

Example:

> Review the eligibility criteria before submitting your application.

---

# CTA Hierarchy

Primary:

Apply Now

Secondary:

Save Opportunity

Apply Now always redirects users to the official opportunity source.

Scout never hosts applications.

---

# Navigation

Top breadcrumb:

Dashboard / Discover

↓

Opportunity

Back navigation should restore:

- Previous page
- Previous filters
- Previous scroll position

Never reset users back to the beginning of the list.

---

# Related Opportunities

Optional section near the bottom.

Display:

You may also like

Maximum:

Three opportunities.

Never compete visually with the current opportunity.

---

# Design Principles

- Reading focused.
- Large typography.
- Comfortable line lengths.
- Sticky recommendation panel.
- Calm spacing.
- Clear hierarchy.

The Details page should feel like reading a thoughtfully prepared recommendation—not a database entry.

---

# Saved

## Purpose

The Saved page gives users a personal collection of opportunities they intend to revisit.

It should function as a lightweight shortlist rather than another browsing page.

---

# Page Goal

Help users quickly return to opportunities they've already shown interest in.

---

# Layout

Page title:

## Saved Opportunities

Supporting copy:

> Keep track of opportunities you don't want to lose.

Display saved opportunities using the exact same card component used throughout Scout.

No separate design language.

---

# Empty State

Illustration (minimal).

Title:

Nothing saved yet.

Supporting copy:

> Bookmark opportunities while exploring and they'll appear here.

CTA:

Discover Opportunities

---

# Interaction

Users should be able to:

- Open opportunity
- Remove bookmark
- Apply after opening details

No bulk management features in V1.

Keep the experience intentionally simple.

---

# Profile

## Purpose

The Profile page allows users to manage everything Scout knows about them.

This is where users refine their recommendations over time.

---

# Page Goal

Give users confidence and control over their profile.

Everything entered during onboarding should remain editable.

---

# Layout

Organize content into logical sections.

---

## Personal Information

- Name
- Date of Birth
- Gender
- Location

---

## Education

- Institution
- Degree
- Branch
- Current Year
- Graduation Year
- CGPA

---

## Skills

Current selected skills.

Search and add more.

Remove existing skills.

---

## Career Goals

Editable.

---

## Discovery Preferences

Editable.

Examples:

- Opportunity Types
- Locations
- Work Mode

---

## Resume

Display:

Current Resume

Options:

Replace Resume

Remove Resume

Uploading a new resume should automatically refresh extracted profile information where applicable.

---

## Account

Basic account settings.

Future settings that are not yet implemented should remain visible but clearly labeled:

**Coming Soon**

Examples:

- Weekly Email Briefs *(Coming Soon)*
- Smart Notifications *(Coming Soon)*
- Calendar Integration *(Coming Soon)*

Allow users to express interest.

Each Coming Soon feature includes:

**Notify Me**

or

**I'm Interested**

Once clicked:

- Increment public interest count.
- Disable further clicks from that user.

This creates lightweight product validation while keeping the interface honest.

---

# Save Changes

Changes should save automatically where practical.

Otherwise:

Single primary button.

Save Changes.

Display:

✓ Changes Saved

without interrupting workflow.

---

# Design Principles

- Calm.
- Organized.
- Editable.
- Transparent.
- User-controlled.

---

# System Pages

Scout's system pages should feel intentional rather than forgotten.

Every state communicates something.

---

# Loading

Loading should communicate real progress.

Avoid fake spinners.

Use Scout's established loading experience where appropriate.

Maintain consistency across all pages.

---

# 404

Purpose:

Transform an error into a friendly moment.

Title:

Looks like Scout couldn't find this page.

Supporting copy:

The opportunity may have expired, moved, or never existed.

Primary CTA:

Return to Dashboard

Secondary CTA:

Discover Opportunities

---

# Empty Search

Title:

No opportunities matched your search.

Supporting copy:

Try adjusting your filters or explore a broader category.

CTA:

Clear Filters

---

# No Recommendations

Title:

Scout is preparing today's recommendations.

Supporting copy:

We're putting together opportunities that best match your profile.

CTA:

Discover Opportunities

---

# Error State

Title:

Something went wrong.

Supporting copy:

We couldn't load this page right now.

Primary CTA:

Try Again

Secondary CTA:

Return Home

Avoid exposing technical errors to users.

---

# Coming Soon

Future features should never appear broken.

Instead, display a polished placeholder.

Title:

Coming Soon

Supporting copy:

We're actively building this feature and would love to know if it's something you'd use.

Primary CTA:

Notify Me

or

I'm Interested

Display public interest:

**128 people are waiting for this feature.**

The number should increase as users register interest.

Once clicked:

- Increment count.
- Disable interaction for that user.
- Show confirmation.

Example:

✓ You're on the list.

This creates subtle engagement and provides valuable product feedback without interrupting the experience.

---

# Success States

Whenever users complete meaningful actions:

Use lightweight confirmations.

Examples:

✓ Opportunity Saved

✓ Profile Updated

✓ Resume Uploaded

✓ Preferences Updated

Avoid intrusive modals.

Small toast notifications are sufficient.

---

# Accessibility

All system pages should support:

- Keyboard navigation.
- Proper focus states.
- Screen readers.
- Reduced motion preferences.
- High contrast compliance.

Accessibility should feel built-in rather than added later.

---

# Shared Design Principles

Every client-facing page in Scout should consistently follow the same design language.

- Large, intentional whitespace.
- Clear typography hierarchy.
- Consistent spacing rhythm.
- Calm animations.
- Minimal visual noise.
- Human-centered copywriting.
- Predictable interactions.
- Smooth navigation.
- Preserved scroll position.
- Fast perceived performance.

---

# Final Philosophy

Scout should never feel like a collection of unrelated pages.

Every screen—from Opportunity Details to Saved, Profile, and every system state—should feel like different chapters of the same thoughtfully designed product.

The interface should consistently reinforce Scout's core promise:

> **Discover better opportunities with less effort.**

Every interaction, every transition, and every page should quietly communicate that Scout has already done the hard work, allowing users to focus on what truly matters—finding and applying to opportunities that move their careers forward.