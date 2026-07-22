# COMPONENT_DESIGN_SYSTEM.md

> **Version:** Scout V1
>
> This document defines Scout's reusable component system.
>
> It is not a UI library.
>
> It is the design philosophy behind every reusable interface element in Scout.
>
> The objective is consistency, scalability, and a recognizable product identity.

---

# 1. Philosophy

Scout should never feel like a collection of unrelated components.

Every interaction should feel like it belongs to the same product.

The component system exists to achieve four goals:

- Consistency
- Simplicity
- Scalability
- Recognizable identity

Users should never consciously notice components.

They should simply feel that everything behaves exactly as expected.

---

# 2. Component Philosophy

Not every component deserves equal attention.

Scout's identity should come from a handful of signature components.

Everything else should quietly support them.

The component hierarchy is divided into four tiers.

---

# Tier 1 — Signature Components

These define Scout's visual identity.

Greatest design effort should be invested here.

They are unique to Scout and cannot simply be replaced by a generic UI library.

Components:

- Opportunity Card
- Featured Opportunity Card
- Opportunity Details Layout
- AI Insight Panel
- Match Score
- Skill Gap Panel
- Recommendation Reason
- Feature Vote Card

These components are Scout's competitive identity.

---

# Tier 2 — High Usage Components

Used frequently throughout the application.

Examples:

- Button
- Search Bar
- Filters
- Empty States
- Loading States
- Section Headers
- Navigation
- Page Header

These prioritize consistency over uniqueness.

---

# Tier 3 — Supporting Components

Supporting interactions.

Examples:

- Dialogs
- Drawers
- Dropdowns
- Toasts
- Forms
- Profile Cards
- Tabs
- Tooltips

These should remain visually quiet.

---

# Tier 4 — Utility Components

Foundation-level components.

Examples:

- Checkbox
- Radio
- Switch
- Divider
- Avatar
- Progress
- Skeleton

Minimal customization required.

They simply inherit Scout's design language.

---

# 3. Signature Components

## Opportunity Card

The Opportunity Card is Scout's most important reusable component.

It represents the product more than any other element.

Every card should immediately answer five questions:

- What is this opportunity?
- Should I care?
- Why did Scout recommend it?
- Am I likely to qualify?
- Can I act on it?

Recommended structure:

- Opportunity title
- Organization
- Opportunity type
- Match Score
- Recommendation reason (one sentence)
- Deadline
- Save button
- Quick metadata

The card should prioritize whitespace and readability.

Avoid visual clutter.

---

## Featured Opportunity Card

The Featured Opportunity is not simply a larger version of the normal card.

Its purpose is to communicate:

> Scout believes this deserves your attention.

Visual differences may include:

- Larger layout
- Stronger typography
- Slightly more spacing
- Subtle accent border
- "Top Match" badge

Avoid flashy gradients or exaggerated styling.

Premium through restraint.

---

## Opportunity Details Layout

The Opportunity Details page is the emotional peak of Scout.

Current architecture:

Two-column layout.

### Left Column

Opportunity information.

Includes:

- Description
- Eligibility
- Benefits
- Deadline
- Location
- Organization
- Metadata
- Official information

### Right Column

Scout intelligence.

Includes:

- Match Score
- Recommendation Reason
- AI Insight Panel
- Skill Gap
- Competitiveness Estimate
- Apply Now button
- Save button

The right column should remain sticky on desktop whenever practical.

This keeps Scout's insights and primary CTA visible throughout the reading experience.

On mobile, the layout should naturally collapse into a single column while preserving the information hierarchy.

---

## AI Insight Panel

This is Scout's strongest product differentiator.

It should never resemble raw LLM output.

Instead, present insights in structured, digestible sections.

Suggested sections:

- Why this matches you
- Your strengths
- Skill gaps
- Estimated competitiveness
- Application advice

Each section should be:

- Concise
- Human-written in tone
- Collapsible
- Easy to scan

Avoid long paragraphs.

---

## Match Score

Match Score should communicate confidence—not decoration.

Recommended structure:

```
94%

Excellent Match
```

Avoid circular progress indicators.

Avoid unnecessary graphics.

The explanation is more valuable than the percentage.

---

## Skill Gap Panel

The Skill Gap component should encourage improvement.

Never discourage users.

Avoid:

❌ Missing React

Prefer:

Learn React

Strengthening this skill could improve your chances for similar opportunities.

Every recommendation should feel actionable.

---

## Recommendation Reason

One sentence.

Maximum.

Examples:

Recommended because your backend experience closely matches this internship.

Recommended because you've shown strong interest in full-stack development.

Never expose AI reasoning directly.

Translate it into human language.

---

## Feature Vote Card

Used for upcoming functionality.

Structure:

Feature Name

Short description

Coming Soon

Community Interest

Vote button

After voting:

- Count updates instantly
- Button becomes non-clickable
- User receives confirmation

Purpose:

Collect feature demand while communicating product roadmap.

---

# 4. High Usage Components

## Buttons

Scout supports four button variants only.

- Primary
- Secondary
- Ghost
- Danger

Primary buttons should remain rare.

Every section should have only one visually dominant action.

---

## Search Bar

Search is one of Scout's highest-frequency interactions.

Requirements:

- Large click target
- Instant search
- No dedicated search button
- Keyboard-friendly
- Fast feedback

Search should feel effortless.

---

## Filters

Keep filters intentionally simple.

Recommended presentation:

Horizontal chips or pills.

Focus on:

- Opportunity Type
- Category
- Remote
- Deadline
- Newest

Avoid enterprise-level filtering.

---

## Navigation

Navigation should remain minimal.

Users should always know:

- Where they are
- Where they came from
- Where they can go next

Navigation should never compete with content.

---

## Empty States

Every empty state should:

- Explain why
- Suggest the next action
- Maintain optimism

Never stop at:

"No results."

Guide users forward.

---

## Loading States

Default to skeleton screens.

Only display richer loading interfaces when operations take noticeable time.

Never rely on spinners as the primary loading experience.

---

## Section Headers

Every section header should contain:

Title

Optional supporting description

Example:

Today's Recommendations

Opportunities selected specifically for your profile.

Maintain calm visual hierarchy.

---

# 5. Supporting Components

Supporting components should remain understated.

Examples include:

- Dialogs
- Dropdowns
- Drawers
- Tooltips
- Toasts
- Forms
- Profile Cards

Their purpose is to support workflows—not attract attention.

---

# 6. Utility Components

Utility components should inherit Scout's design language.

Examples:

- Checkbox
- Switch
- Radio
- Divider
- Avatar
- Skeleton

Avoid unnecessary customization.

Consistency is more valuable than uniqueness.

---

# 7. Component Behaviors

Every reusable component should define behavior—not just appearance.

Example:

Opportunity Card

Hover

- Slight lift
- Border emphasis
- Shadow increase

Click

- Opens Opportunity Details

Save

- Optimistic UI update
- Immediate feedback

Keyboard

- Fully accessible

Mobile

- Entire card tappable except Save button

Behavior should remain consistent throughout the application.

---

# 8. Design Rules

## Border Radius

One unified radius system.

Suggested:

- 12px — Standard surfaces
- 16px — Feature cards
- Full — Pills and badges

---

## Shadows

Light Mode

Soft elevation.

Dark Mode

Minimal shadows.

Rely primarily on contrast.

---

## Icons

Single icon family.

Lucide React.

No mixing icon styles.

---

## Motion

Every component follows Scout's Motion Language.

No component-specific animations.

---

## Typography

Every component follows Scout's typography scale.

No arbitrary font sizes.

---

## Spacing

Entire component library follows the 8pt spacing system.

Avoid arbitrary padding values.

---

# 9. Component Ownership

Every component belongs to one of two categories.

## Design System Components

Reusable UI primitives.

Examples:

- Button
- Input
- Checkbox
- Modal
- Toast

These can evolve independently.

---

## Scout Components

Components unique to Scout's product experience.

Examples:

- Opportunity Card
- AI Insight Panel
- Match Score
- Skill Gap
- Recommendation Reason
- Feature Vote Card

These define Scout's identity.

Design effort should be concentrated here.

---

# 10. Component Checklist

Before approving any reusable component, ask:

- Is its purpose obvious?
- Is it visually consistent?
- Does it follow Scout's spacing system?
- Does it follow Scout's typography?
- Does it follow Scout's motion language?
- Is the interaction predictable?
- Is it accessible?
- Does it help users discover opportunities faster?
- Can it be reused elsewhere?
- Does it respect the user's attention?

If any answer is "No," refine the component before implementation.

---

# 11. Final Philosophy

Scout's design system should not be remembered because of beautiful buttons.

It should be remembered because every interaction feels intentional.

Most components should quietly disappear into the background.

Only a few should become unmistakably Scout.

Those signature components—especially the Opportunity Card and AI Insight Panel—are where Scout earns its identity.

The ultimate goal is a component library that feels cohesive, predictable, calm, and unmistakably premium without ever drawing attention away from what matters most:

> **Helping users discover opportunities worth pursuing.**