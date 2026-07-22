# COLOR_PHILOSOPHY.md

> **Version:** Scout V1 Brand System
>
> This document defines Scout's complete color philosophy, design intent, and foundational color system. These decisions are intentionally conservative and timeless, prioritizing trust, readability, and long-term brand recognition over trend-driven aesthetics.

---

# 1. Design Philosophy

Scout is not an AI toy.

Scout is not a government portal.

Scout is not another generic SaaS dashboard.

Scout should feel like a product that students trust every day.

The colors should communicate:

- Calm
- Trust
- Intelligence
- Clarity
- Professionalism
- Quiet confidence
- Editorial craftsmanship

The objective is to create a visual identity that feels premium without trying to look futuristic.

Restraint is a design feature.

---

# 2. Color Philosophy

The interface should never feel colorful.

Instead, it should feel carefully composed.

Most of Scout's personality should come from:

- Typography
- Whitespace
- Layout
- Motion
- Content hierarchy

Color should only reinforce important actions and information.

The interface should feel calm rather than stimulating.

---

# 3. Core Brand Colors

## Primary Brand

Deep Forest Green

```css
#174C44
```

Represents:

- Discovery
- Trust
- Exploration
- Guidance
- Growth
- Confidence

This is Scout's primary identity color.

It should never dominate the interface.

---

## Accent

Warm Amber

```css
#C98A2E
```

Represents:

- Discovery
- Hidden opportunities
- AI insights
- Recommendations
- Small moments of delight

Amber is intentionally rare.

Its value comes from restraint.

---

# 4. Light Theme

## Background

Paper White

```css
#FAF8F5
```

Pure white was intentionally avoided.

The paper tone creates a softer, more editorial experience.

---

## Surface

```css
#FFFFFF
```

Cards remain pure white to create subtle visual depth.

---

## Primary Text

```css
#171717
```

---

## Secondary Text

```css
#5F5F5F
```

---

## Muted Text

```css
#8D8D8D
```

---

## Borders

```css
#E7E1D8
```

Borders should be almost invisible.

Their purpose is structure—not decoration.

---

# 5. Dark Theme

Dark mode should not simply invert the light theme.

Its emotional tone is different.

Light mode represents:

- Morning
- Curiosity
- Discovery
- Freshness

Dark mode represents:

- Focus
- Research
- Deep work
- Quiet confidence

---

## Background

Charcoal Black

```css
#0A0A0A
```

Dark navy was intentionally rejected.

Charcoal creates a more timeless and neutral foundation.

---

## Surface

```css
#151515
```

---

## Elevated Surface

```css
#1E1E1E
```

---

## Borders

```css
#2A2A2A
```

---

## Primary Text

```css
#FAFAFA
```

---

## Secondary Text

```css
#CFCFCF
```

---

## Muted Text

```css
#A3A3A3
```

---

# 6. Theme-Specific Brand Color

The brand color should not use identical hex values across both themes.

Instead, Scout uses theme-specific brand tokens.

## Light Theme Brand

```css
#174C44
```

Used throughout the light interface.

---

## Dark Theme Brand

A slightly lighter variant of the forest green should be used.

Suggested direction:

```css
#2F7366
```

(or an equivalent value after final visual testing)

The objective is not higher saturation.

The objective is improved contrast against the charcoal background while preserving Scout's identity.

---

# 7. Suggested Brand Scale

Although Scout primarily uses one brand color, maintaining a small green scale provides consistency for components.

```css
Green 50   #EAF3F0

Green 100  #D5E8E2

Green 200  #B6D3CA

Green 300  #8EB8AB

Green 400  #5F9788

Green 500  #2F7366

Green 600  #174C44

Green 700  #123B35

Green 800  #0E2E29
```

Most applications should only require Green 500 and Green 600.

The remaining shades exist for component states such as hover, selected, subtle backgrounds, or progress indicators.

---

# 8. Semantic Colors

These colors communicate application state only.

They are **not** part of Scout's branding.

## Success

```css
#16A34A
```

---

## Warning

```css
#D97706
```

---

## Error

```css
#DC2626
```

---

## Information

```css
#2563EB
```

Used sparingly.

---

# 9. Color Budget

Every screen has a limited amount of color available.

Scout follows the principle:

- 90% Neutral
- 8% Brand Green
- 2% Amber

This ratio intentionally prevents visual clutter.

Color should guide attention—not compete for it.

---

# 10. Usage Guidelines

## Brand Green

Use for:

- Primary buttons
- Active navigation
- Selected states
- Important metrics
- Brand identity
- Key actions

Avoid using green for decorative purposes.

---

## Amber

Use only for:

- AI insights
- Recommended opportunities
- Hidden gems
- Featured content
- Small highlights
- Special indicators

Amber should never become the dominant interface color.

---

## Neutrals

Neutrals carry most of the interface.

Whitespace, typography, and spacing should remain the primary design language.

---

# 11. Colors Intentionally Rejected

Scout deliberately avoids several common SaaS color trends.

Rejected directions include:

- Bright AI Purple
- Neon Cyan
- Corporate Blue
- Bright Emerald
- Heavy gradients
- Aurora effects
- Glow
- Glassmorphism
- Excessive saturation

These styles often age quickly and reduce perceived trust.

Scout aims for longevity over novelty.

---

# 12. Emotional Outcome

When a user opens Scout, the interface should feel:

- Calm
- Professional
- Trustworthy
- Beautiful
- Thoughtfully designed
- Focused
- Human

The colors should quietly support the experience rather than become its defining feature.

A student should immediately feel that Scout is a product built with care, precision, and intention.

---

# 13. Final Decision

The overall color philosophy is locked for Scout V1.

The only remaining refinement is the exact dark-theme brand green, which may be adjusted slightly after implementation to achieve optimal contrast against the charcoal background.

Beyond this refinement, the color system should remain stable.

Future design efforts should focus on typography, spacing, motion, and interaction design rather than revisiting the color palette.