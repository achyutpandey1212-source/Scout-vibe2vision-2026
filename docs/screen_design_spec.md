# screen_design_spec.md

# Scout — Screen Design Specification
**Phase 8 • Product Experience**
Version: 1.0

---

# Purpose

This document is the single source of truth for Scout's product UI.

It defines how every major screen should look, feel and behave.

The objective is **not** to build beautiful screens.

The objective is to make Scout feel like a premium, calm, trustworthy companion built specifically for women.

Every design decision should support these three words:

> Calm.
> Intentional.
> Human.

---

# Global Product Principles

## Calm over Busy

Every screen should contain breathing room.

Never try to fill empty areas.

Negative space is a feature.

---

## Show only what matters

Never overwhelm users with information.

Always answer one question per screen.

---

## Honest UX

Never fake progress.

Never simulate loading.

Whenever backend work takes time,
show the actual process happening.

Example

Finding opportunities...

Checking eligibility...

Ranking recommendations...

Almost ready...

instead of

Loading...

---

## Motion Philosophy

Motion exists only to improve understanding.

Never animate for decoration.

Animations should feel like paper,
not like technology.

---

# Global Motion Language

Only these motion styles are allowed.

### Paper Wash

Primary transition.

Used for:

- Splash screens
- Major page transitions
- Landing → Dashboard
- Authentication completion
- Theme switching (optional)

Never use dramatic wipes or flashy effects.

---

### Fade + Lift

Cards

Lists

Sections

Dialogs

---

### Gentle Scale

Buttons

Chips

Cards on hover

Maximum scale:

1.02

---

### Slide

Drawers

Bottom sheets

Navigation

---

### Drift

Used only for origami assets.

Movement should be almost unnoticeable.

---

# Splash Experience

Duration

Approximately

4–5 seconds

---

## Screen 1

Background

Pure White

Text

Dark

Large editorial typography

Quote

> Not every opportunity is visible.

Small origami crane slowly glides.

---

Paper Wash Transition

White

↓

Lotus Pink

---

## Screen 2

Background

Lotus Pink

Text

White

Quote

> Some are simply waiting for someone to notice them.

Small butterfly drifts slowly.

---

Paper Wash Transition

Lotus Pink

↓

Warm Cream

---

## Screen 3

Background

Warm Cream

Text

Dark

Quote

> Every woman deserves to discover what's possible.

Origami lotus appears quietly.

---

Paper Wash Transition

Warm Cream

↓

Black

---

## Screen 4

Background

Black

Text

White

Very large typography

Quote

> Welcome to Scout.

Pause

Landing page appears.

---

# Landing Page

Purpose

Explain Scout.

Nothing else.

The landing page should feel like an editorial magazine.

Sections

Hero

Mission

How Scout Works

Testimonials

Footer

Navigation remains extremely minimal.

---

Hero

Large editorial heading.

One CTA.

One supporting CTA.

Origami decoration.

Nothing more.

---

# Dashboard

Purpose

Answer

"What should I do today?"

Priority

1

Greeting

Good morning, Maya.

---

Priority

2

Featured Opportunity

Large card.

---

Priority

3

Hidden Gems

Horizontal section.

---

Priority

4

Scout Intelligence

Explain recommendations.

Never use technical AI language.

---

Priority

5

Recent recommendations.

---

Never create dashboard clutter.

---

# Opportunity Details

Purpose

Answer

"Should I apply?"

Layout order

Company

↓

Opportunity Title

↓

Scout Recommendation

↓

Apply Button

↓

About

↓

Eligibility

↓

Benefits

↓

Requirements

↓

Deadline

↓

Source

Never begin with a wall of text.

---

# Saved Opportunities

Title

Saved for Later

Purpose

Remind users of opportunities they cared about.

Empty state

"When something feels right,
save it here.

We'll keep it waiting for you."

Very subtle butterfly decoration.

---

# Notifications

Purpose

Only notify when it genuinely helps.

Allowed notifications

New matching opportunity

Deadline approaching

Application update

Hidden opportunity discovered

Recommendation improved

No engagement spam.

---

# Profile

Purpose

Feel personal.

Not administrative.

Sections

Identity

Current Journey

Dreams

Interests

Goals

Preferences

Achievements (future)

Everything should feel editable.

---

# Global Loading Experience

Scout uses **one universal loading experience** throughout the entire product.

There should never be multiple loading screen styles.

Whether loading:

- Dashboard
- Recommendations
- Opportunities
- Profile
- Search
- AI features
- Authentication

the same loading philosophy is used.

---

## Visual Style

Background

Uses current theme.

Large amount of whitespace.

Centered layout.

Origami crane slowly drifting.

Very subtle.

No spinning loaders.

No bouncing dots.

---

Headline

Please wait...

or

Scout is working on it.

---

Progress

Backend should expose actual loading states whenever possible.

Examples

Finding opportunities...

Checking eligibility...

Ranking recommendations...

Looking for hidden gems...

Preparing your dashboard...

Almost ready...

Each message fades into the next.

Never fake percentages.

Never fake completion.

If backend genuinely takes 30 seconds,

let it take 30 seconds.

Trust is more important than speed.

---

# Origami Decorations

Decorations should never distract.

Maximum

2–3 decorations per screen.

Possible assets

Crane

Butterfly

Lotus

Stars

Paper Plane

Leaves

Corner Fold

Decorations always stay near edges.

Never overlap important content.

---

# Typography

Editorial.

Elegant.

Quiet.

Display

Hero

Heading XL

Heading L

Heading M

Heading S

Body Large

Body

Caption

Label

Avoid bold whenever possible.

Weight should communicate hierarchy.

Not thickness.

---

# Cards

Paper.

Not glass.

Rounded

18–24px

Soft shadow.

No glowing borders.

No glassmorphism.

No neon.

---

# Spacing

Whitespace is part of the design.

Prefer larger spacing over squeezing components.

Every section should feel like it has room to breathe.

---

# Responsiveness

Desktop

Editorial magazine layout.

Tablet

Adaptive grid.

Mobile

Single-column.

Nothing should feel like a desktop page squeezed into mobile.

---

# Accessibility

Respect

prefers-reduced-motion

Maintain AA contrast.

Large touch targets.

Keyboard accessible.

Readable typography.

---

# Design Goal

If someone opens Scout for the first time, they should feel:

"I've never used something that feels this calm."

Not

"This has amazing animations."

Not

"This looks AI generated."

Not

"This is fancy."

Just...

"This feels beautifully crafted."