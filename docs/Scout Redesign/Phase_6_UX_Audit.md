# UX_AUDIT.md

> **Version:** Scout V1
>
> This document defines Scout's UX auditing framework.
>
> It is not a redesign document.
>
> It is a decision framework used while redesigning every client-facing screen.
>
> Every page, section, interaction, and component should be evaluated against these principles before implementation.

---

# 1. Philosophy

Great UX is rarely created by adding more.

It is created by removing friction.

Scout's UX should feel:

- Obvious
- Calm
- Focused
- Predictable
- Fast
- Human

The goal is for users to spend their time discovering opportunities—not learning how to use Scout.

---

# 2. UX Principles

Scout follows six universal UX principles.

---

## Understandable

Every screen should communicate its purpose immediately.

Users should never ask:

> "What am I supposed to do here?"

---

## Focused

Every page exists for one primary reason.

Secondary actions should support the primary goal—not compete with it.

---

## Progressive

Information should appear only when needed.

Avoid overwhelming users with excessive controls or data.

---

## Consistent

Navigation, interactions, terminology, layouts, and behaviors should remain predictable throughout the product.

Users should never need to relearn the interface.

---

## Forgiving

Users should never lose their work, context, or progress because of navigation.

Scout should preserve momentum wherever possible.

---

## Quiet

The interface should never fight for attention.

Content remains the hero.

Everything else quietly supports it.

---

# 3. The Three-Second Rule

Every page must answer its purpose within three seconds.

If a first-time user cannot understand the page almost immediately, the page should be simplified.

---

## Dashboard

Should instantly communicate:

- Today's recommended opportunities
- Where to discover more
- Where saved opportunities live
- Profile access

---

## Discover

Should immediately answer:

> "Where can I browse all opportunities?"

---

## Opportunity Details

Should immediately answer:

- What is this opportunity?
- Why should I care?
- Why did Scout recommend it?
- Should I apply?

---

## Saved

Should immediately communicate:

> "These are the opportunities you've saved."

---

## Profile

Should immediately communicate:

> "Manage your account and recommendation preferences."

---

# 4. One Primary CTA

Every page must have one dominant action.

Examples:

| Page | Primary CTA |
|--------|-------------|
| Landing | Get Started |
| Dashboard | Open Opportunity |
| Discover | Discover Opportunities |
| Opportunity Details | Apply Now |
| Saved | Continue Exploring |
| Profile | Save Changes |

Avoid multiple competing CTAs.

Users should never wonder what to do next.

---

# 5. Progressive Disclosure

Do not reveal everything at once.

Information should unfold naturally.

Instead of displaying every detail immediately, prioritize what users need first.

Examples:

Opportunity

↓

AI Insights

↓

Eligibility Analysis

↓

Application Tips

↓

Source Information

Users stay in control of information density.

---

# 6. Visual Hierarchy

Every screen should establish a clear reading order.

Users should naturally know:

1. Where to look first
2. What matters most
3. What actions are available
4. What can wait

Hierarchy should never rely solely on color.

Spacing, typography, and layout should guide attention.

---

# 7. Reduce Cognitive Load

Every element should justify its existence.

Before keeping any component, ask:

- Does this help users?
- Does this reduce effort?
- Does this improve decisions?

If not, remove it.

Premium interfaces are designed through subtraction.

---

# 8. Respect User Momentum

This is one of Scout's defining UX principles.

Whenever users leave a page and return, preserve their context.

Restore:

- Scroll position
- Search query
- Filters
- Sorting
- Pagination chunk
- Navigation origin

Users should continue exactly where they left off.

Navigation should feel uninterrupted.

---

# 9. Predictable Navigation

Users should always know:

- Where they are
- Where they came from
- Where they can go next

Back navigation should behave naturally throughout the application.

Avoid unexpected redirects.

---

# 10. Minimize User Decisions

Reduce unnecessary choices.

Examples:

Prefer:

One primary button

Over:

Three equally important buttons.

Prefer:

Five carefully chosen recommendations

Over:

Twenty competing suggestions.

Decision fatigue reduces engagement.

---

# 11. Reduce Interface Noise

Avoid unnecessary:

- Badges
- Labels
- Decorative icons
- Statistics
- Explanatory paragraphs

Whitespace is part of the interface.

Silence improves comprehension.

---

# 12. Empty States

Every empty state should guide users.

Never simply state that nothing exists.

Instead:

Explain why.

Suggest the next action.

Maintain optimism.

Example:

Saved

Instead of:

"No saved opportunities."

Prefer:

"You haven't saved any opportunities yet.

Explore Scout and save opportunities you'd like to revisit."

---

# 13. Loading States

Loading should communicate progress.

Avoid artificial delays.

Recommended behavior:

Under 150ms

→ No loading indicator.

150–400ms

→ Skeleton UI.

400ms+

→ Branded loading state with informative messaging.

Never pretend processing is happening when it is not.

---

# 14. Error States

Errors should remain calm and helpful.

Avoid generic messages.

Instead:

Explain what happened.

Explain what users can do next.

Maintain confidence.

---

# 15. Coming Soon Experience

Unavailable functionality should never be hidden.

Display it transparently.

Every unavailable feature should include:

- Short explanation
- Coming Soon badge
- Optional community voting

This validates demand while remaining honest.

---

# 16. Accessibility

Every screen should remain usable for everyone.

Audit:

- Keyboard navigation
- Focus visibility
- Contrast
- Readability
- Touch targets
- Motion preferences

Accessibility is part of quality—not an afterthought.

---

# 17. Performance Perception

Fast products feel faster than they measure.

Whenever possible:

- Prefetch navigation
- Preserve layouts
- Use skeletons
- Prevent layout shifts
- Avoid blocking interactions

Perceived performance is as important as actual performance.

---

# 18. Content Density

Scout should never overwhelm users.

Each screen should reveal only what users need at that stage.

If content feels crowded:

- Remove
- Collapse
- Group
- Delay

Do not shrink everything to fit more.

Whitespace is a design tool.

---

# 19. Trust Signals

Every page should reinforce trust.

Examples:

- Clear recommendation reasoning
- Official opportunity source
- Honest feature availability
- Transparent AI explanations
- Calm language
- Professional visuals

Trust compounds across small interactions.

---

# 20. Emotional State Audit

Every screen should consider the user's mindset.

| Screen | User Emotion |
|----------|--------------|
| Landing | Curious |
| Authentication | Hopeful |
| Onboarding | Engaged |
| Recommendation Processing | Anticipating |
| Dashboard | Excited |
| Discover | Exploring |
| Opportunity Details | Evaluating |
| Saved | Revisiting |
| Profile | Managing |
| 404 | Confused |
| Loading | Waiting |

The interface should support—not fight—these emotions.

---

# 21. Screen Audit Questions

Before approving any screen, ask:

- Can users understand this page within three seconds?
- Is the primary action obvious?
- Does anything distract from the primary goal?
- Can anything be removed?
- Is information progressively revealed?
- Is the hierarchy clear?
- Does navigation preserve user context?
- Does this page feel calm?
- Does this page build trust?
- Does this help users discover and apply faster?

If any answer is "No," revisit the design.

---

# 22. UX Checklist

Every redesigned screen should satisfy the following:

- Clear purpose
- One primary CTA
- Strong visual hierarchy
- Minimal cognitive load
- Preserved navigation context
- Responsive interactions
- Accessible interface
- Helpful empty states
- Honest loading and error handling
- Consistent terminology
- Calm visual experience

Only after satisfying this checklist should implementation begin.

---

# 23. Final Philosophy

Scout's UX should disappear into the background.

Users should never think about the interface.

They should think about the opportunities they discovered.

The highest compliment Scout can receive is not:

> "The interface looks beautiful."

It is:

> **"Everything just felt obvious."**