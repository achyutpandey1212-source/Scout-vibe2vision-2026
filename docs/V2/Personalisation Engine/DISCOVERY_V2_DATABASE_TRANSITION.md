# DISCOVERY_V2_DATABASE_TRANSITION.md

> **Version:** Scout MVP V2
>
> This document captures the architectural decisions made before beginning Discovery Engine V2. The goal is to align the database, crawler, and discovery strategy with Scout's refined mission.
>
> This is **not** an implementation document. It explains **why** these decisions were made so future development remains consistent.

---

# 1. Context

Scout originally began with a broader objective:

> Discover opportunities for women in technology.

As the product matured, the MVP became significantly more focused.

The current target audience is:

> **Indian engineering college girls (primarily 1st–4th year students, with slight flexibility for adjacent early-career students).**

This changes the philosophy of Discovery.

Discovery is no longer trying to find "women opportunities."

Instead, Discovery must find **the best opportunities for engineering students**, while additionally discovering opportunities specifically encouraging women.

This distinction influences every part of the discovery pipeline.

---

# 2. Discovery Philosophy

## Old Philosophy

```
Women

↓

Search women internships

↓

Search women scholarships

↓

Search women jobs
```

This naturally limits coverage because most student opportunities are **not explicitly labeled for women**, even though women are fully eligible to apply.

---

## New Philosophy

```
Student Opportunities

↓

Internships

Hackathons

Competitions

Scholarships

Government Programs

Research

Campus Ambassador

Open Source

↓

+

Women-specific opportunities
```

The user's gender is part of the recommendation context—not the primary discovery constraint.

This produces much broader and more useful discovery.

---

# 3. Student-First Discovery

The Discovery Engine should continuously search for opportunities relevant to Indian engineering students.

Primary categories include:

- Internships
- Hackathons
- Student Competitions
- Fellowships
- Scholarships
- Campus Ambassador Programs
- Bootcamps
- Workshops
- Open Source Programs
- Research Internships
- Summer Schools
- Government Student Programs

Women-focused programs become an additional discovery stream rather than replacing the primary search.

Examples include:

- Google Women Techmakers
- Outreachy
- Adobe Women
- Grace Hopper Celebration
- Women-only Hackathons
- Microsoft Women initiatives

---

# 4. Government Opportunities

Government opportunities are explicitly included.

This does **not** mean government jobs such as:

- UPSC
- SSC
- State PSCs

Instead, Scout should discover opportunities designed for students and early-career candidates.

Examples:

- ISRO Internships
- DRDO Internships
- BARC Internships
- NIC Programs
- MeitY Programs
- AICTE Internships
- C-DAC Programs
- RBI Student Internships
- SEBI Internships
- PSU Internships
- Smart India Hackathon
- Toycathon
- Ministry Innovation Challenges

These opportunities align perfectly with Scout's mission because they are frequently missed despite being highly valuable.

---

# 5. Vertical Discovery Strategy

Discovery should intentionally explore opportunity categories individually.

Instead of one large crawl, categories become independent discovery targets.

Example:

```
Internships

↓

Hackathons

↓

Scholarships

↓

Government Programs

↓

Campus Ambassador

↓

Research

↓

Open Source

↓

Women Programs
```

This prevents one category from dominating the crawl budget.

---

# 6. Manual Category Crawling

The Scout Admin Portal already contains category selection.

Rather than immediately automating every category crawl, Discovery V2 will initially be operated manually.

Reasons:

- Easier debugging
- Better visibility
- Immediate quality inspection
- Faster iteration

Running categories individually allows quick identification of problems such as:

- Weak sources
- Poor extraction
- Incorrect classification
- Category imbalance

Automation can be introduced later once Discovery quality becomes stable.

---

# 7. Source Registry Strategy

## Decision

The Source Registry should **NOT** be deleted.

Instead, it becomes one of Scout's permanent assets.

Reason:

The registry represents accumulated knowledge rather than generated data.

It contains:

- Organization information
- Crawl strategies
- Crawl frequency
- Trust scores
- Priorities
- Discovery metadata

This information remains valuable regardless of future product evolution.

---

## Existing Sources

Current trusted sources remain useful, including:

- Google
- Microsoft
- Amazon
- NVIDIA
- Devfolio
- MLH
- Women Techmakers
- AnitaB
- ISRO

These should remain unless proven irrelevant.

---

## Registry Evolution

Instead of rebuilding the registry, Discovery V2 expands it.

Additional source categories should include:

### Government

- DRDO
- NIC
- MeitY
- AICTE
- C-DAC
- BEL
- BHEL
- NTPC
- GAIL
- ONGC
- RBI
- SEBI

---

### Universities

- IIT Career Portals
- NIT Career Portals
- IIIT Career Portals
- State Universities
- University Internship Portals

---

### Communities

- IEEE
- ACM
- GDG
- GDSC
- Mozilla
- Linux Foundation

---

### Hackathons

- Devfolio
- MLH
- Unstop
- HackerEarth
- HackerRank
- Kaggle

---

### Research

- CERN
- DAAD
- IISc
- CSIR
- DST

---

# 8. Existing Sources

Existing sources should generally **not be deleted.**

Instead:

- Update categories
- Improve metadata
- Adjust priorities
- Disable irrelevant sources

Example:

```
isActive = false
```

for sources that primarily publish:

- Mid-level jobs
- Senior jobs
- Experienced hiring

Reasons:

- Reversible
- Preserves historical metadata
- Easier future expansion

Deletion is unnecessary.

---

# 9. Opportunity Collection

## Decision

Delete all Opportunity documents.

Reason:

The Opportunity collection is generated data.

It currently contains many entries that no longer align with Scout's mission, such as:

- Mid-level jobs
- Senior hiring
- Generic employment listings
- Government welfare schemes
- Articles
- Non-student opportunities

Keeping these introduces unnecessary noise into:

- Recommendations
- Analytics
- Similarity
- Ranking
- Search

Discovery V2 should generate a completely fresh Opportunity dataset.

---

# 10. Discovery Runs

## Decision

Delete Discovery Run history.

Reason:

Existing runs represent an obsolete discovery strategy.

Examples include:

- Women
- Women Tech Professionals
- Broad Women Opportunities

These statistics are no longer representative of Discovery V2.

Keeping them provides little long-term value while polluting analytics.

Discovery V2 should begin with a clean operational history.

---

# 11. Categories

Existing categories should **not** be deleted.

Instead:

- Update existing categories
- Rename where necessary
- Add missing student-focused categories

This approach preserves backward compatibility while aligning the system with the MVP.

Potential additions include:

- Government Internships
- Research
- Campus Ambassador
- Open Source
- Fellowships
- Student Competitions
- Summer Schools
- Bootcamps

---

# 12. Search Strategy

Discovery should not primarily search:

```
engineering internships for girls
```

Instead:

```
Software Internship India

AI Internship

ML Internship

Cybersecurity Internship

Research Internship

Hackathon

Campus Ambassador

Scholarship

Government Internship
```

Alongside dedicated searches such as:

```
Women Techmakers

Outreachy

Grace Hopper

Adobe Women

Microsoft Women

Women Hackathons
```

Women-focused searches increase coverage but do not replace general student opportunity discovery.

---

# 13. Database Transition Summary

| Collection | Decision | Reason |
|------------|----------|--------|
| Source Registry | Keep | Represents accumulated discovery knowledge |
| Opportunities | Delete All Documents | Generated data based on outdated discovery philosophy |
| Discovery Runs | Delete All Documents | Historical logs from obsolete strategy |
| Categories | Update & Expand | Align with student-first discovery without losing compatibility |

---

# 14. Immediate Actions Before Discovery V2

1. Update and expand opportunity categories.
2. Expand the Source Registry with additional student-focused sources.
3. Disable irrelevant sources using `isActive = false` rather than deleting them.
4. Delete all Opportunity documents.
5. Delete all Discovery Run documents.
6. Begin Discovery V2 with a clean database.
7. Crawl categories manually using the Admin Portal.
8. Inspect quality after every category crawl before proceeding to the next.

---

# 15. Guiding Principle

The database should distinguish between:

### Institutional Knowledge

Information that improves over time and should be preserved.

Examples:

- Source Registry
- Trust Scores
- Crawl Configuration
- Source Metadata

---

### Generated Data

Information that can always be recreated.

Examples:

- Opportunities
- Discovery Runs
- Recommendation Cache
- Temporary Crawl Results

Generated data should never become an obstacle when Scout's discovery philosophy changes.

Institutional knowledge should continue evolving across versions.

---

# Final Principle

> **Discovery should discover everything relevant to Indian engineering college students first, then additionally discover opportunities specifically designed for women.**
>
> **The user persona guides recommendation quality—not discovery limitations.**