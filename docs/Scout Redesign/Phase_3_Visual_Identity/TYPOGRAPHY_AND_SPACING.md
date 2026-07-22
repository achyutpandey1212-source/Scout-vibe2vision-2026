# TYPOGRAPHY_AND_SPACING.md

> **Version:** Scout V1 Brand System
>
> This document defines Scout's typography, spacing system, layout rhythm, and visual hierarchy. Typography is one of Scout's strongest branding assets and works together with whitespace to create a calm, premium, and editorial experience.

---

# 1. Philosophy

Scout's visual identity is intentionally restrained.

The interface should never rely on loud colors, heavy graphics, or excessive decoration to appear premium.

Instead, Scout derives its personality from:

- Typography
- Whitespace
- Rhythm
- Alignment
- Composition
- Content hierarchy

Good typography creates trust.

Good spacing creates calm.

Together, they define the product experience.

---

# 2. Typography Philosophy

Typography is not decoration.

Typography is navigation.

Every heading, paragraph, label, and number should naturally guide the user's eyes through the interface.

A user should never have to wonder where to look next.

Good typography reduces cognitive load.

---

# 3. Dual Typography System

Scout intentionally uses two font families.

Each serves a different purpose.

---

## Display Font

### Newsreader

Used for:

- Hero headlines
- Marketing pages
- Landing page headings
- Storytelling
- Editorial sections
- Large feature titles

Why Newsreader?

- Elegant
- Editorial
- Human
- Warm
- Timeless
- Premium
- Excellent readability
- Creates a memorable brand identity

Newsreader gives Scout its emotional voice.

---

## UI Font

### Geist

Used for:

- Product dashboard
- Navigation
- Cards
- Forms
- Buttons
- Tables
- Lists
- Settings
- Documentation
- Body text
- Labels

Why Geist?

- Designed for software interfaces
- Neutral
- Highly readable
- Modern
- Excellent spacing
- Beautiful numerals
- Open source
- Fast loading

Geist gives Scout its functional voice.

---

# 4. Marketing vs Product

## Marketing Experience

Marketing pages should feel:

- Editorial
- Spacious
- Inspiring
- Calm
- Human

Large typography is encouraged.

Whitespace is generous.

The objective is emotional engagement.

---

## Product Experience

The application should feel:

- Efficient
- Clean
- Organized
- Scan-friendly
- Functional

Typography exists to improve usability rather than attract attention.

The objective is speed and clarity.

---

# 5. Typography Scale

Scout follows a fixed type scale.

Avoid introducing arbitrary font sizes.

| Token | Size | Weight | Usage |
|--------|------|--------|-------|
| Display XL | 72px | Medium | Hero headlines |
| Display L | 56px | Medium | Landing sections |
| H1 | 48px | Medium | Major page titles |
| H2 | 36px | Medium | Section headings |
| H3 | 30px | Medium | Card headings |
| H4 | 24px | Medium | Large cards |
| H5 | 20px | Medium | Subsections |
| Body Large | 18px | Regular | Intro paragraphs |
| Body | 16px | Regular | Default content |
| Small | 14px | Regular | Labels |
| Caption | 12px | Medium | Metadata |

---

# 6. Font Weights

Scout intentionally avoids heavy typography.

Recommended usage:

| Weight | Usage |
|---------|------|
| Regular (400) | Body text |
| Medium (500) | Headings |
| SemiBold (600) | Buttons, important labels |
| Bold (700) | Rarely used |

The interface should feel confident without shouting.

---

# 7. Line Heights

Proper line height contributes more to readability than font size alone.

| Element | Line Height |
|----------|------------|
| Display | 110% |
| Headings | 120% |
| Body | 160% |
| Small Text | 150% |

Generous line height reinforces Scout's calm and editorial personality.

---

# 8. Letter Spacing

Letter spacing should remain subtle.

| Element | Tracking |
|----------|---------|
| Display | -2% |
| Headings | -1% |
| Body | 0% |
| Captions | +2% |

Avoid exaggerated tracking.

Typography should feel natural.

---

# 9. Numerals

Scout frequently displays:

- Match scores
- Deadlines
- Counts
- Analytics
- Statistics

Use tabular numerals wherever numerical alignment matters.

Numbers should align vertically across cards and tables.

---

# 10. Text Width

Readable content requires controlled line length.

Recommended widths:

| Content | Max Width |
|----------|----------|
| Long-form reading | 680px |
| Marketing paragraphs | 720px |
| Documentation | 760px |

Avoid extremely wide text blocks.

Reading comfort takes priority.

---

# 11. Spacing Philosophy

Whitespace is one of Scout's primary branding assets.

Spacing communicates confidence.

Premium interfaces rarely feel crowded.

Every important element should have room to breathe.

Nothing should feel compressed.

---

# 12. Grid System

Scout adopts a standard **8-point grid system**.

Every spacing decision should derive from multiples of 8.

Benefits:

- Consistency
- Faster implementation
- Predictable layouts
- Better rhythm
- Easier maintenance

---

# 13. Spacing Tokens

| Token | Value |
|--------|------:|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |
| 4xl | 96px |
| 5xl | 128px |

Avoid introducing custom spacing values unless absolutely necessary.

---

# 14. Layout Widths

## Landing Pages

Maximum container:

```text
1280px
```

Reading width:

```text
680px
```

Content width:

```text
720px
```

---

## Product Dashboard

Maximum content width:

```text
1440px
```

Dashboard layouts should prioritize information density without sacrificing breathing room.

---

# 15. Section Rhythm

Landing pages should breathe.

Recommended vertical spacing:

| Section | Spacing |
|----------|--------:|
| Hero → Next Section | 128px |
| Major Sections | 128px |
| Inside Sections | 64px |
| Card Groups | 32px |

Avoid stacking sections too closely.

Whitespace creates rhythm.

---

# 16. Component Spacing

Recommended internal padding:

| Component | Padding |
|-----------|--------:|
| Buttons | 12px × 20px |
| Inputs | 12px × 16px |
| Cards | 24px |
| Large Cards | 32px |
| Modals | 32px |
| Navigation | 24px |

Padding should never feel tight.

---

# 17. Border Radius

Scout uses restrained corner radii.

| Component | Radius |
|-----------|--------:|
| Buttons | 12px |
| Inputs | 12px |
| Cards | 20px |
| Modals | 24px |
| Badges | Full |
| Pills | Full |

Avoid arbitrary radius values.

Rounded corners should feel intentional and consistent.

---

# 18. Alignment Principles

Everything aligns to a clear grid.

Avoid optical randomness.

Maintain consistent:

- Margins
- Gutters
- Padding
- Vertical rhythm
- Baselines

Alignment should become invisible.

---

# 19. Visual Hierarchy

Every screen should answer these questions immediately:

1. What is the most important thing?
2. What should I read next?
3. What action should I take?

Hierarchy should emerge naturally through:

- Size
- Weight
- Spacing
- Position

Not through excessive color.

---

# 20. Design Principle — "Nothing Touches"

Scout follows a simple rule:

> Important elements deserve breathing room.

Text should never hug borders.

Buttons should never hug text.

Cards should never touch each other.

Sections should have generous separation.

Whitespace is an intentional design element—not empty space.

---

# 21. Motion & Typography

Animations should respect typography.

Avoid excessive movement.

Prefer:

- Fade
- Slide
- Scale (subtle)
- Opacity transitions

Typography should remain readable during every transition.

Motion should reinforce hierarchy—not distract from it.

---

# 22. Accessibility

Typography should always remain readable.

Guidelines:

- Minimum body size: 16px
- Sufficient color contrast
- Avoid long line lengths
- Maintain generous line height
- Never rely solely on font weight for emphasis

Readable interfaces are premium interfaces.

---

# 23. Future Expansion

Future additions may include:

- Responsive typography scale
- Data visualization typography
- Mobile-specific spacing adjustments
- Component density modes
- Internationalization support

These additions should extend the existing system—not replace it.

---

# 24. Final Decision

The typography and spacing system is locked for Scout V1.

### Display Font

**Newsreader**

Used for marketing, storytelling, and brand expression.

---

### UI Font

**Geist**

Used across the product interface for clarity, consistency, and usability.

---

### Grid System

8-point spacing system.

---

### Design Philosophy

Typography first.

Whitespace first.

Hierarchy over decoration.

Consistency over novelty.

Scout should feel premium not because it uses more visual elements—but because every element has been thoughtfully considered.

The ultimate goal is for users to describe Scout not as "beautiful," but as **effortlessly clear, calm, and trustworthy**.