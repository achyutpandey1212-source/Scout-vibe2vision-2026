# RE_PRD.md

> **Version:** Scout MVP V2
>
> **Module:** Recommendation Engine (RE)
>
> The Recommendation Engine is Scout's intelligence layer.
>
> While the Discovery Engine answers **"What opportunities exist?"**, the Recommendation Engine answers **"Which opportunities matter most to this specific student, and why?"**
>
> Discovery collects opportunities.
>
> Recommendation creates trust.

---

# 1. Vision

Scout should never feel like another job portal.

Students already have LinkedIn.

Students already have Internshala.

Students already have Unstop.

Those platforms primarily organize opportunities.

Scout should **understand the student first**, then surface only the opportunities that genuinely deserve their attention.

The Recommendation Engine exists to transform a growing database of opportunities into a small number of highly relevant, personalized recommendations that reduce decision fatigue and increase confidence.

The goal is not to maximize the number of recommendations.

The goal is to maximize the quality of each recommendation.

---

# 2. Problem Statement

Today's students face several problems simultaneously.

## Information Overload

Students must search across dozens of websites every week.

Even after finding opportunities, they still need to manually decide:

- Is this suitable?
- Am I eligible?
- Is it worth applying?
- Should I spend time on this?

---

## Generic Recommendations

Most platforms recommend opportunities using only:

- keywords
- popularity
- recent activity

They rarely understand:

- career stage
- current skill level
- confidence
- available time
- personal goals
- emotional barriers

---

## Fear of Missing Out

Students constantly wonder:

> "What if I'm missing a better opportunity somewhere else?"

This causes endless searching instead of focused action.

---

## Decision Fatigue

After opening 50 internship listings, almost everything looks the same.

Instead of applying,

students keep scrolling.

---

# 3. Product Goal

The Recommendation Engine should make students feel:

> "Scout understands me."

Instead of showing 100 opportunities,

Scout should confidently say

> "Start with these five."

Each recommendation should have a clear explanation.

Every recommendation should answer:

- Why this?
- Why now?
- Why me?

---

# 4. Product Philosophy

The Recommendation Engine follows one simple principle.

> Every recommendation should earn the user's trust.

That means:

- fewer recommendations
- higher quality
- clear reasoning
- transparent decisions

We optimize for confidence rather than quantity.

---

# 5. Design Principles

## 5.1 Deterministic First

Recommendation quality should never depend entirely on an LLM.

Everything objectively measurable should be calculated using deterministic logic.

Examples:

- eligibility
- graduation year
- branch
- work mode
- location
- opportunity type
- deadlines
- career stage
- hidden gem score
- quality score
- trust score

These calculations are predictable, reproducible, cheap, and easy to debug.

---

## 5.2 AI Second

AI should never decide *what* to recommend.

AI explains *why* something deserves attention.

The LLM acts as an intelligent career mentor rather than a ranking algorithm.

Its responsibilities include:

- personalized explanations
- actionable advice
- identifying potential gaps
- suggesting next steps
- improving readability

AI enhances recommendations.

It does not replace the scoring engine.

---

## 5.3 Human-Centered

Recommendations should feel supportive.

Not overwhelming.

Not robotic.

The experience should resemble guidance from a trusted senior rather than search results.

---

## 5.4 Cost Conscious

Recommendation generation must remain sustainable on free-tier APIs.

Scout prioritizes:

- caching
- deterministic computation
- minimal AI calls

The system should comfortably support active users without unnecessary token usage.

---

# 6. Recommendation Philosophy

Scout is not trying to answer:

> "What opportunities exist?"

Scout answers:

> "If you only had time to apply to a few opportunities today, which ones should they be?"

That is a fundamentally different problem.

---

# 7. Core Objectives

The Recommendation Engine should:

- reduce information overload
- increase application confidence
- improve opportunity quality
- minimize irrelevant opportunities
- encourage consistent progress
- surface hidden opportunities
- explain recommendations clearly

---

# 8. Inputs

The Recommendation Engine combines information from multiple systems.

## Discovery Engine

Provides:

- verified opportunities
- trust scores
- hidden gem scores
- deadlines
- quality scores
- categories
- eligibility
- organization data
- metadata

---

## Onboarding

Provides:

- education
- branch
- graduation year
- motivations
- preferred opportunity types
- availability
- interests
- work preferences
- communication style
- goals
- obstacles

---

## Resume Intelligence

Provides:

- skills
- projects
- technologies
- certifications
- strengths
- experience
- resume quality

---

## User Activity

Future versions may also consider:

- bookmarks
- applications
- ignored recommendations
- clicked opportunities
- recommendation feedback

---

# 9. Outputs

The Recommendation Engine produces a Recommendation Pack.

Instead of returning a list of opportunities,

it returns a curated experience.

The recommendation pack contains:

- recommended opportunities
- recommendation scores
- AI explanations
- reasoning
- action priorities
- confidence indicators
- generated timestamp
- version metadata

---

# 10. Recommendation Journey

The user journey is intentionally simple.

```
User logs in

↓

Recommendation cache exists?

↓

Yes

↓

Generated today?

↓

Yes

↓

Load immediately

↓

No

↓

Generate Recommendation Pack

↓

Cache

↓

Display dashboard
```

For new users:

```
Finish onboarding

↓

Generate Recommendation Pack

↓

Show progress

↓

Display personalized dashboard
```

---

# 11. Recommendation Pipeline

The Recommendation Engine consists of seven stages.

```
Candidate Retrieval

↓

Hard Filtering

↓

Deterministic Scoring

↓

Diversification

↓

AI Personalization

↓

Recommendation Pack Generation

↓

Caching
```

Each stage has a single responsibility.

---

# 12. What the User Experiences

The user should never feel like recommendations appear magically.

Instead,

Scout briefly explains what is happening.

Example progress:

```
Understanding your profile...

Finding matching opportunities...

Filtering irrelevant ones...

Ranking your best matches...

Preparing personalized insights...

Almost ready...
```

Every step reflects actual backend work.

No fake loading animations.

---

# 13. Why Scout Feels Different

Traditional platforms say:

> "Here are 300 internships."

Scout says:

> "These five deserve your attention today."

Traditional platforms optimize for browsing.

Scout optimizes for decision-making.

---

# 14. Success Metrics

The Recommendation Engine is successful if users consistently interact with and trust its recommendations.

Primary metrics include:

## Recommendation Quality

- Average recommendation score
- User relevance score
- Recommendation acceptance rate

---

## User Engagement

- Opportunity clicks
- Application conversions
- Bookmark rate
- Return visits

---

## Recommendation Accuracy

- Low irrelevant recommendation rate
- High eligibility match
- Low expired opportunity exposure

---

## Cost Efficiency

- One AI generation per active user per day
- High cache hit rate
- Minimal token usage

---

## Trust Metrics

- Users understand why recommendations exist
- Recommendations feel personalized
- Users discover opportunities they would otherwise miss

---

# 15. Non-Goals (MVP)

The Recommendation Engine will **not**:

- continuously re-rank opportunities every page refresh
- generate recommendations for inactive users
- rely entirely on AI
- recommend hundreds of opportunities
- optimize for engagement over usefulness

---

# 16. Guiding Principle

The Recommendation Engine exists for one purpose:

> Help every student spend less time searching and more time applying to opportunities that genuinely fit their journey.

Discovery finds opportunities.

Recommendation finds the right opportunity.

That difference defines Scout.