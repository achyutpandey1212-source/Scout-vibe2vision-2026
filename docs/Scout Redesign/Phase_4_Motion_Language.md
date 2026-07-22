# MOTION_LANGUAGE.md

> **Version:** Scout V1 Brand System
>
> This document defines Scout's complete motion philosophy, interaction language, animation principles, timing system, and transition behaviors.
>
> Motion is not decoration.
>
> Motion is communication.
>
> Every animation should help users understand the interface rather than attract attention.

---

# 1. Philosophy

Motion is one of Scout's strongest quality signals.

Good motion creates confidence.

Poor motion creates distraction.

Scout should never feel animated.

Scout should feel responsive.

Users should remember how effortless Scout feels—not the animations themselves.

The objective is to create motion that becomes invisible through consistency.

---

# 2. Motion Personality

Every animation should reinforce Scout's brand.

Scout's motion language is:

- Calm
- Responsive
- Purposeful
- Lightweight
- Confident

These five principles should guide every interaction.

---

# 3. Design Principles

## Calm

Nothing should rush.

Nothing should bounce aggressively.

Nothing should surprise the user.

Motion should reduce cognitive load rather than increase it.

---

## Responsive

Every interaction deserves acknowledgement.

Hovering, clicking, dragging, selecting, filtering, and loading should all provide immediate feedback.

The interface should always feel alive.

---

## Purposeful

Every animation must answer one question:

> Why does this animation exist?

If the answer is "because it looks cool," it should be removed.

Motion exists to improve usability.

---

## Lightweight

Animations should almost disappear.

If users consciously notice animations during normal usage, they are probably too strong.

---

## Confident

Scout moves deliberately.

No exaggerated elasticity.

No cartoon physics.

No playful bouncing.

Everything feels measured and intentional.

---

# 4. Motion Principles

Scout follows four universal motion principles.

---

## Motion Follows Hierarchy

The most important element moves first.

Supporting content follows.

Avoid animating everything simultaneously.

Hierarchy should remain clear during movement.

---

## Motion Reveals

Content should never teleport.

Elements should naturally emerge into view.

Motion creates continuity.

---

## Motion Explains

Animations communicate:

- Loading
- Success
- Navigation
- Progress
- State changes
- Context transitions

Motion should reduce the need for explanation.

---

## Motion Respects Attention

Animations should guide attention—not steal it.

The user is here to discover opportunities.

The interface should never compete with the content.

---

# 5. Timing System

Scout follows a small timing scale.

| Token | Duration | Usage |
|--------|---------:|------|
| Instant | 100ms | Tooltips, hover |
| Fast | 150ms | Buttons, hover states |
| Normal | 200ms | Dropdowns, inputs |
| Medium | 250ms | Cards, page content |
| Slow | 350ms | Complex transitions |
| Hero | 600ms | Landing page storytelling only |

Avoid longer durations inside the product experience.

---

# 6. Easing System

Consistent easing creates a recognizable motion identity.

## Primary

```
easeOutCubic
```

Default easing for most interactions.

Natural and responsive.

---

## Entrance

```
easeOutQuart
```

Used for introducing content.

Feels smooth and intentional.

---

## Exit

```
easeInQuad
```

Fast, clean removal.

Users rarely watch elements leaving.

---

## Layout

Use spring animations with minimal bounce.

Motion should settle quickly.

Avoid exaggerated elasticity.

---

# 7. Hover States

Hover should communicate interactivity—not entertainment.

Recommended duration:

```
150ms
```

---

## Buttons

Hover includes:

- Slight brightness adjustment
- Slight shadow increase
- Optional 1–2% scale

Avoid dramatic movement.

---

## Cards

Cards should not lift dramatically.

Instead:

- Slight border emphasis
- Small shadow increase
- Optional translateY(-2px)

Movement should remain subtle.

---

## Icons

Icons may slightly increase opacity or rotate a few degrees only when appropriate.

Avoid unnecessary icon animations.

---

# 8. Page Transitions

Pages should never abruptly change.

Recommended transition:

- 8px upward movement
- Fade from 0 → 100%
- Duration: 250ms

This creates continuity without slowing navigation.

---

# 9. Card Appearance

Cards should appear through staggered animation.

Recommended stagger:

```
30–40ms
```

Cards should never fly in individually with dramatic effects.

The objective is a calm visual cascade.

---

# 10. Loading States

Skeleton screens should replace traditional loading spinners wherever possible.

Skeletons create a stronger perception of speed.

---

## Skeleton Animation

Avoid shimmer effects.

Instead use a subtle breathing animation.

Opacity:

```
95%

↓

100%

↓

95%
```

Duration:

```
2 seconds
```

The animation should be almost invisible.

---

# 11. AI Recommendation Experience

Generating recommendations is Scout's signature interaction.

The experience should feel deliberate.

Recommended sequence:

1. Loading skeleton appears.
2. Recommendation cards slide upward slightly.
3. Cards fade into view.
4. AI insight badges appear last.

This sequence reinforces the feeling of thoughtful recommendation rather than instant generation.

---

# 12. Search

Search interactions should prioritize speed.

Results should:

- Fade quickly
- Replace existing results smoothly

Avoid dramatic transitions.

Search is a high-frequency interaction.

---

# 13. Filtering

Filters should update results without full page reloads.

Recommended behavior:

- Existing cards fade out
- New cards fade in
- Preserve layout whenever possible

Filtering should feel continuous.

---

# 14. Success States

Success feedback should remain understated.

Recommended behavior:

- Small check icon
- Fade animation
- Brief confirmation

Avoid confetti or celebration animations.

Scout is professional software.

---

# 15. Error States

Errors should remain calm.

Avoid:

- Shake animations
- Flashing elements
- Aggressive color changes

Instead:

- Border changes to error color
- Error message fades in
- Focus moves to the relevant field when appropriate

---

# 16. Modals

Modal appearance:

Backdrop:

Fade in.

Modal:

- Scale 98% → 100%
- Fade in
- Duration 180ms

Dismiss using the reverse animation.

---

# 17. Dropdowns

Dropdown behavior:

- Slide downward 4px
- Fade in
- Duration 120ms

Menus should feel attached to their trigger.

---

# 18. Tooltips

Tooltips require minimal motion.

Fade only.

Duration:

```
100ms
```

No sliding or bouncing.

---

# 19. Toast Notifications

Recommended behavior:

- Slide downward from the top
- Fade in
- Auto-dismiss with reverse animation

Toasts should never interrupt user flow.

---

# 20. Numerical Animations

When values change, animate the numbers rather than replacing them instantly.

Examples:

- Match Score
- Opportunity Count
- Analytics
- Dashboard Statistics

Counting animations should complete within:

```
200ms
```

This creates a polished and informative experience.

---

# 21. Progress Indicators

Progress should feel smooth.

Avoid linear robotic movement.

Use easing to create natural progression.

Progress bars should communicate advancement—not speed.

---

# 22. Landing Page Motion

Marketing pages allow for slightly richer motion than the product itself.

Examples include:

- Hero text fade with slight upward movement
- Dashboard preview entering with subtle scale
- Gentle parallax effects
- Slow floating decorative elements

Movement should remain restrained.

Avoid creating an "award website."

Scout is a product first.

---

# 23. Motion Budget

Every screen has a limited animation budget.

Only animate:

- New content
- User interactions
- State changes
- Navigation
- Progress

Avoid animating static decorative elements.

If everything moves, nothing feels important.

---

# 24. Accessibility

Respect user preferences.

Support reduced motion wherever possible.

Animations should never:

- Cause discomfort
- Delay interactions
- Obscure information

Motion should enhance usability—not become a dependency.

---

# 25. Technical Guidelines

Animations should remain performant.

Prefer:

- Transform
- Opacity

Avoid animating:

- Width
- Height
- Position using layout recalculations
- Expensive paint operations

Maintain smooth performance across modern devices.

---

# 26. Motion Checklist

Before adding an animation, ask:

- Does it improve usability?
- Does it reinforce hierarchy?
- Does it communicate state?
- Does it respect the user's attention?
- Is it subtle enough?
- Does it match Scout's motion personality?

If the answer to any of these is "no," reconsider the animation.

---

# 27. Final Decision

Scout's motion language is intentionally restrained.

The objective is not to impress users with animation.

The objective is to make every interaction feel effortless.

Users should describe Scout as:

- Smooth
- Responsive
- Thoughtful
- Fast
- Polished

They should rarely notice the animations themselves.

That is the hallmark of excellent motion design.

Scout's motion identity can be summarized in one sentence:

> **Everything responds. Nothing distracts.**