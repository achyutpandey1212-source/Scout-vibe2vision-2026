# Dashboard

## Purpose

The Dashboard is the heart of Scout.

It is the page users will visit the most.

It is where Scout proves its value every single day.

The Dashboard is **not** a homepage.

It is **not** a feed.

It is **not** another job board.

Scout's Dashboard is a **daily opportunity briefing**.

Every design decision should reinforce one simple feeling:

> *"I'm excited to see what Scout found for me today."*

---

# Dashboard Goal

Every dashboard visit should lead the user towards one of three actions:

- View an opportunity
- Save an opportunity
- Explore more opportunities

Everything else is secondary.

The Dashboard should never become a place for endless browsing.

Its purpose is focused discovery.

---

# Design Philosophy

The Dashboard should feel curated.

Not crowded.

Not overwhelming.

Not algorithmic.

Scout should feel like a trusted guide that has already done the difficult work of searching through hundreds of opportunities and selecting only the most relevant ones.

The page should feel calm, intentional, and highly personalized.

---

# Page Structure

---

# 1. Greeting

Rather than displaying a generic page title like "Dashboard", welcome users into their daily briefing.

Example:

**Good Morning, Achyut.**

or

**Welcome back.**

Supporting text:

> Here's what Scout found for you today.

This section should immediately communicate personalization.

---

# 2. Today's Brief

Directly beneath the greeting.

This section introduces today's recommendations.

The content comes directly from the Recommendation Engine.

Example:

## Today's Brief

> Explore internship opportunities to boost your career.

Below this, display the AI-generated summary.

Example:

> These recommendations are tailored to your skills and interests, focusing on opportunities that strengthen your portfolio while expanding your real-world experience.

This creates the feeling that today's recommendations were intentionally prepared rather than randomly selected.

---

# 3. Top Match ⭐

The Top Match is the hero of the Dashboard.

This should occupy the greatest visual attention.

Purpose:

Communicate confidence.

Instead of presenting five equal recommendations, Scout confidently highlights the single opportunity it believes deserves immediate attention.

The card should include:

- Top Match badge
- Opportunity title
- Organization
- Match Score
- Personalized recommendation reason
- Why Now
- Save button
- View Details button

Apply Now should **not** appear here.

The dashboard encourages exploration.

The details page encourages application.

---

# 4. Hidden Gem 💎

Purpose:

Highlight an opportunity the user might otherwise overlook.

Supporting text:

> A promising opportunity you probably wouldn't have discovered yourself.

Visual styling should remain consistent with other recommendation cards while using a unique badge and subtle identity.

---

# 5. Stretch Goal 🚀

Purpose:

Encourage ambition.

Supporting text:

> A challenging opportunity that could help you grow beyond your current comfort zone.

Missing skills should **not** be shown directly on the Dashboard.

Instead, encourage users to open the details page.

---

# 6. Quick Win ⚡

Purpose:

Present an opportunity that users can confidently pursue immediately.

Supporting text:

> A strong opportunity to build momentum and gain valuable experience.

---

# 7. Confidence Builder 🌱

Purpose:

Recommend an opportunity where the user already has a strong foundation.

Supporting text:

> An opportunity where your existing skills already make you a competitive candidate.

---

# Recommendation Card Philosophy

Although every recommendation has a unique identity, they should all share the same component structure.

Every recommendation card should communicate:

- Opportunity Title
- Organization
- Opportunity Type
- Match Score
- One-line Recommendation Reason
- Save Button
- View Details CTA

Cards should remain scannable within three seconds.

Avoid paragraphs.

Whitespace should remain generous.

---

# Recommendation Categories

The Recommendation Engine already generates different recommendation types.

The Dashboard should celebrate these instead of hiding them.

Approved recommendation categories:

⭐ Top Match

💎 Hidden Gem

🚀 Stretch Goal

⚡ Quick Win

🌱 Confidence Builder

Each category should have:

- Unique icon
- Small supporting description
- Consistent visual hierarchy

Avoid completely different card layouts.

Consistency remains more important than decoration.

---

# AI Content Visibility

The Dashboard should only surface concise AI insights.

Show:

- Personalized Recommendation Reason
- Why Now

Do **not** expose:

- Score breakdown
- Internal confidence calculations
- Backend reasoning
- Technical AI explanations

Detailed insights belong on the Opportunity Details page.

---

# Primary CTA Hierarchy

Dashboard actions should follow a clear hierarchy.

Primary:

View Details

Secondary:

Save Opportunity

The user journey should remain:

Dashboard

↓

Opportunity Details

↓

Apply

Avoid encouraging applications before users understand the opportunity.

---

# Discover More

After the five curated recommendations, introduce a lightweight exploration section.

Heading:

## Looking for something different?

Supporting copy:

> Scout has discovered hundreds of additional opportunities waiting to be explored.

Primary CTA:

Discover Everything →

Purpose:

Transition users naturally into the Discover page without competing with personalized recommendations.

---

# Navigation

The navigation should remain intentionally minimal.

Items:

- Dashboard
- Discover
- Saved
- Profile

Notifications should remain hidden until fully implemented.

Future features should appear as "Coming Soon" where appropriate.

---

# Personalization

Small personal touches create a stronger emotional connection.

Examples:

Good Morning, Achyut.

Today's Brief

Personalized Recommendation Reasons

Why Now

These subtle details make Scout feel handcrafted rather than automated.

---

# Information Hierarchy

Users should naturally read the page in this order:

Greeting

↓

Today's Brief

↓

Top Match

↓

Hidden Gem

↓

Stretch Goal

↓

Quick Win

↓

Confidence Builder

↓

Discover More

Every section should naturally guide users toward the next.

---

# Interaction Principles

Opportunity Cards

Hover:

- Slight elevation
- Border emphasis
- Smooth shadow transition

Click:

- Open Opportunity Details

Save:

- Optimistic UI update
- Immediate visual confirmation

Back Navigation:

Returning from the Opportunity Details page should restore the user's exact scroll position.

Users should never lose their place after exploring an opportunity.

This behavior should remain consistent across the entire platform.

---

# Empty State

If recommendations are unavailable:

Display a friendly explanation.

Example:

## Scout is still preparing today's recommendations.

Supporting copy:

> We're putting together opportunities that best match your profile. This shouldn't take long.

Provide access to:

Discover Opportunities

rather than leaving users on a blank page.

---

# Dashboard Principles

- Curated over comprehensive.
- Personalized over generic.
- Calm over crowded.
- Confident over flashy.
- Human over technical.

The Dashboard should feel like a thoughtfully prepared daily briefing—not an endless stream of listings.

---

# Final Philosophy

The Dashboard is Scout's promise made visible.

Everything on this page should communicate one simple message:

> **Scout has already done the searching.**

Instead of asking users to browse hundreds of opportunities, Scout presents five carefully selected recommendations, each serving a different purpose—from the strongest immediate match to opportunities that encourage exploration and growth.

The Dashboard should leave users with one lasting impression:

> **"Scout understands what I'm looking for, and every recommendation feels worth my attention."**