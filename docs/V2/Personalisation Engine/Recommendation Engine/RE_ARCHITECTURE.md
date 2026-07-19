# RE_ARCHITECTURE.md

> **Version:** Scout MVP V2
>
> This document describes the complete architecture of Scout's Recommendation Engine.
>
> The Recommendation Engine transforms a large database of verified opportunities into a small set of highly personalized recommendations for each user.
>
> Every stage has a single responsibility.
>
> AI is used only where it adds genuine value.
>
> Everything else remains deterministic.

---

# 1. High-Level Architecture

```
                  User Login
                       │
                       ▼
            Recommendation Trigger
                       │
                       ▼
             Recommendation Cache
             │                 │
             │ HIT             │ MISS
             ▼                 ▼
        Return Cached      Generate Pack
                                │
                                ▼
                     Candidate Retrieval
                                │
                                ▼
                        Hard Filtering
                                │
                                ▼
                    Deterministic Scoring
                                │
                                ▼
                        Diversification
                                │
                                ▼
                      Top Candidate Selection
                                │
                                ▼
                     AI Personalization Layer
                                │
                                ▼
                  Recommendation Pack Builder
                                │
                                ▼
                    Recommendation Cache Store
                                │
                                ▼
                           Dashboard API
                                │
                                ▼
                           Scout Dashboard
```

---

# 2. Design Principles

The architecture follows five principles.

## Deterministic before AI

Everything measurable should remain deterministic.

---

## Explainable

Every recommendation must be explainable.

---

## Cost Efficient

Generate recommendations only when necessary.

---

## Modular

Every stage performs exactly one responsibility.

---

## Cache Everything

Never regenerate recommendations unnecessarily.

---

# 3. Recommendation Lifecycle

Recommendations are generated only under specific conditions.

## Trigger Events

### Event 1

User finishes onboarding.

```
Onboarding Complete

↓

Generate Recommendation Pack
```

---

### Event 2

User logs in.

```
Login

↓

Recommendation exists?

↓

No

↓

Generate

↓

Yes

↓

Generated today?

↓

Yes

↓

Return Cache

↓

No

↓

Regenerate
```

---

### Event 3

Manual Admin Refresh

Allows admins to regenerate recommendation packs.

Useful for testing.

---

### Event 4 (Future)

Large Discovery Update

Example:

500 new opportunities added.

System may invalidate affected recommendation packs.

---

# 4. Recommendation Cache

Recommendation generation is expensive.

Therefore recommendations are cached.

Each cache stores:

```
User ID

Recommendation Pack

Generated At

Expiry

Model Version

Engine Version

Opportunity Count

Recommendation IDs
```

Default cache lifetime:

```
24 Hours
```

---

# 5. Stage 1 — Candidate Retrieval

## Purpose

Collect every opportunity that could potentially match.

No ranking.

No filtering.

Only retrieval.

---

## Inputs

User Profile

Resume

Opportunity Collection

---

## Query

Retrieve only:

```
status = ACTIVE

archived = false
```

Everything else enters filtering.

---

## Output

```
Raw Candidate List

≈20–200 opportunities
```

---

# 6. Stage 2 — Hard Filters

Purpose:

Remove opportunities that should never reach scoring.

These are objective eliminations.

---

## Deadline Filter

Remove

```
Expired

Closed

Archived
```

---

## Country Filter

Reject opportunities when:

```
US Citizens Only

UK Citizens Only

Europe Only

Visa Required

Nationality Restricted
```

unless user matches.

---

## Education Filter

Example:

Masters only

PhD only

MBA only

Medical only

---

## Graduation Year Filter

Example:

Only Final Year

Only Graduates

Only Experienced Professionals

---

## Branch Filter

Compare:

```
Eligible Branches

vs

User Branch
```

---

## Opportunity Type Filter

If user explicitly dislikes

Hackathons

do not recommend Hackathons.

---

## Availability Filter

Example:

Full-time onsite internship

User:

Only weekends

Remove.

---

## Work Mode Filter

Remote

Hybrid

Onsite

Compare with user preferences.

---

## Language Filter (Future)

Reject if opportunity language mismatches.

---

## Output

```
Filtered Candidates

≈15–80
```

---

# 7. Stage 3 — Deterministic Scoring

This is the heart of Recommendation Engine.

Every opportunity receives a recommendation score.

No AI.

Only mathematics.

---

## Score Components

### Profile Match

Does it fit:

- education

- year

- branch

- experience

---

Weight

```
30%
```

---

### Goal Match

Compare with onboarding goals.

Example

Find first internship

↓

Internship

High score

---

Weight

```
20%
```

---

### Interest Match

Compare

Skills

Technologies

Domains

Projects

Resume

---

Weight

```
15%
```

---

### Readiness

Existing Discovery score.

---

Weight

```
10%
```

---

### Trust

Discovery Trust Score

---

Weight

```
5%
```

---

### Quality

Discovery Quality Score

---

Weight

```
5%
```

---

### Hidden Gem

Discovery Hidden Gem

---

Weight

```
5%
```

---

### Availability Match

Time available

↓

Opportunity commitment

---

Weight

```
5%
```

---

### Career Stage

Fresh Graduate

↓

Beginner Internship

High score

---

Weight

```
5%
```

---

Final

```
Recommendation Score

0–100
```

---

# 8. Stage 4 — Diversification

Without diversification

top results become

```
Backend

Backend

Backend

Backend

Backend
```

Poor experience.

---

Diversification ensures variety.

Example:

```
Backend Internship

Research Internship

Hackathon

Fellowship

Startup Program
```

instead of duplicates.

---

Diversification dimensions

- category

- organization

- location

- ecosystem

- opportunity type

- hidden gems

---

Output

```
Top 5 Diverse Candidates
```

---

# 9. Stage 5 — AI Personalization

AI never decides rankings.

It explains rankings.

Only the final candidates reach AI.

---

Input

```
User Profile

Resume

Top 5 Opportunities
```

---

AI Tasks

For each opportunity generate:

---

## Personalized Why

Example

```
Why this matches YOU
```

---

## Missing Skills

Example

```
Before applying

learn REST APIs
```

---

## Confidence Boost

Example

```
You already meet
80% of requirements.
```

---

## Risks

Example

```
Highly competitive.

Apply early.
```

---

## Suggested Priority

```
Apply Today

Apply This Week

Save Later
```

---

## Personalized Summary

One concise paragraph.

---

Output

```
AI Recommendation Cards
```

---

# 10. Stage 6 — Recommendation Pack Builder

Collects:

```
Top Opportunities

AI Explanations

Metadata

Generated Time

Version

Recommendation Scores
```

Creates one Recommendation Pack.

---

Example

```
Pack

↓

Top Pick

Runner Up

Hidden Gem

Safe Choice

Stretch Goal
```

---

# 11. Recommendation Pack Schema

Contains

```
Pack ID

User ID

Generated At

Expiry

Recommendation Version

Top Recommendations

Summary

Statistics
```

Each recommendation stores:

```
Opportunity ID

Recommendation Score

Rank

Priority

Reason

AI Insight

Missing Skills

Suggested Action
```

---

# 12. Dashboard Layer

Dashboard never computes recommendations.

It only renders cached packs.

---

Flow

```
Dashboard

↓

Recommendation API

↓

Recommendation Cache

↓

Return Pack

↓

Render Cards
```

---

# 13. Recommendation Refresh Logic

Regenerate only when

```
24 hours elapsed

OR

No recommendation exists

OR

Admin refresh

OR

Future major discovery update
```

Otherwise

Return cache instantly.

---

# 14. Failure Handling

If AI fails

System still works.

Dashboard uses deterministic recommendations.

AI fields remain empty.

Never block recommendations because AI failed.

---

# 15. Cost Optimization

One Recommendation Pack generation

per

```
User

Per Day
```

Everything else comes from cache.

Advantages

- predictable costs

- excellent performance

- minimal latency

- free-tier friendly

---

# 16. Future Extensions

Architecture intentionally supports future capabilities without redesign.

Examples:

- Feedback-based learning
- Recommendation acceptance scoring
- Bookmark-aware ranking
- Application history
- Collaborative filtering
- Similar user recommendations
- Seasonal recommendation tuning
- Opportunity freshness weighting
- Multi-model AI explanations
- Resume improvement suggestions

---

# 17. End-to-End Flow

```
User Logs In
        │
        ▼
Recommendation Exists?
        │
 ┌──────┴────────┐
 │               │
Yes             No
 │               │
 ▼               ▼
Fresh?     Generate Pack
 │               │
 ▼               ▼
Return      Candidate Retrieval
Cache             │
                  ▼
           Hard Filters
                  │
                  ▼
       Deterministic Scoring
                  │
                  ▼
          Diversification
                  │
                  ▼
         Select Top 5 Matches
                  │
                  ▼
       AI Personalization Layer
                  │
                  ▼
      Recommendation Pack Builder
                  │
                  ▼
      Store Recommendation Cache
                  │
                  ▼
          Dashboard API
                  │
                  ▼
         Personalized Dashboard
```

---

# 18. Guiding Principle

The Discovery Engine answers:

> **"What opportunities exist?"**

The Recommendation Engine answers:

> **"Out of everything available today, which five opportunities deserve this student's attention the most—and exactly why?"**

Discovery collects.

Recommendation understands.

That distinction is what makes Scout feel like a career companion rather than another opportunity portal.