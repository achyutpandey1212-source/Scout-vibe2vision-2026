# PERSONALIZATION_ENGINE.md

> **Version:** Scout MVP V2
>
> The Personalization Engine is Scout's AI layer.
>
> Unlike the Scoring Engine, it does **not** decide *which* opportunities are best.
>
> That decision has already been made deterministically.
>
> Instead, the Personalization Engine answers:
>
> > **"Why is this opportunity perfect for this specific student, and what should she do next?"**

---

# 1. Philosophy

Scout separates intelligence into two layers.

## Layer 1

Deterministic

```
1000 Opportunities

↓

Hard Filters

↓

Scoring

↓

Top Candidates
```

---

## Layer 2

AI

```
Top Candidates

↓

Gemini

↓

Human-like Guidance
```

---

This separation has several benefits.

- predictable ranking
- explainable recommendations
- lower cost
- reproducibility
- easier debugging

---

# 2. Responsibilities

The Personalization Engine is responsible for:

- explaining recommendations
- highlighting hidden opportunities
- identifying risks
- encouraging applications
- pointing out missing skills
- generating action plans
- generating concise summaries

It never:

- changes rankings
- invents opportunities
- fabricates eligibility
- overrides deterministic filters

---

# 3. Overall Pipeline

```
User Logs In

↓

Recommendation Cache Check

↓

Needs Refresh?

↓

YES

↓

Retrieve Top Candidates

↓

Gemini Personalization

↓

Recommendation Pack

↓

Save to Cache

↓

Dashboard
```

---

# 4. When Does AI Run?

AI is intentionally expensive.

Therefore it runs very rarely.

---

## Trigger 1

Immediately after onboarding.

```
One time
```

Purpose:

Generate first impression.

---

## Trigger 2

First login each day.

```
Once per user every 24 hours
```

If recommendations already exist today:

```
Return cached version.
```

---

## Trigger 3

Manual Refresh (Future)

Premium feature.

---

## Trigger 4

Major profile change

Example

- uploaded resume
- changed interests
- changed career stage

Old cache becomes invalid.

---

# 5. Recommendation Cache

Every user has

```
Recommendation Pack
```

Example

```
User

↓

Top 5

↓

AI

↓

Stored
```

Next login

↓

Instant.

---

Cache expires

```
24 hours
```

---

# 6. Why Only Once Per Day?

Reasons

- saves Gemini quota
- deterministic experience
- stable recommendations
- avoids unnecessary API calls

If a user logs in

```
9 AM

2 PM

8 PM
```

All receive

the same recommendation pack.

---

# 7. Candidate Selection

The Personalization Engine never sees the full database.

It only receives

Top deterministic candidates.

```
Database

↓

Hard Filters

↓

Scoring

↓

Diversification

↓

Top 5

↓

Gemini
```

---

# 8. Why Only Top Five?

Quality over quantity.

Five opportunities allow Gemini to deeply understand

- user profile
- motivations
- fears
- career goals

instead of spreading context thinly.

The dashboard may still display additional opportunities below the personalized section, but AI only reasons about the top recommendations.

---

# 9. AI Input

Gemini receives only structured information.

## User

- onboarding profile
- resume summary
- interests
- preferred technologies
- availability
- career stage
- motivations
- obstacles

---

## Opportunity

For each of the top 5:

- title
- organization
- summary
- skills
- benefits
- gold reasons
- difficulty
- hidden gem score
- portfolio value
- deadline
- work mode
- location
- organization type
- recommendation score
- score breakdown

No raw HTML.

No crawl content.

No unnecessary metadata.

---

# 10. Context Size

The prompt intentionally stays small.

```
User

+

Top 5

≈

8k–12k tokens
```

Far below model limits.

---

# 11. AI Outputs

Each opportunity receives AI enrichment.

Example

```json
{
  "personalizedReason": "...",

  "whyNow": "...",

  "missingSkills": [

  ],

  "firstAction": "...",

  "confidence": 0.93
}
```

---

# 12. Personalized Reason

The answer to

> Why is Scout recommending this?

Example

> This internship matches your React and Node.js interests while giving early startup exposure. Since you're aiming for your first internship, it offers beginner-friendly responsibilities with strong portfolio value.

Length

```
50–80 words
```

---

# 13. Why Now?

Creates urgency.

Example

> Applications are rolling, but startup internships usually fill quickly. Applying this week significantly improves your chances.

---

# 14. Missing Skills

Gemini compares

Resume

↓

Opportunity

↓

Gap

Example

```
You already know

React

Node

Git

You may also want

Docker

REST API Testing
```

Maximum

```
3 skills
```

No hallucinations.

Only skills explicitly mentioned or strongly implied by the opportunity.

---

# 15. First Action

Every recommendation ends with one concrete action.

Examples

> Update your resume with your latest React project.

> Build one REST API before applying.

> Prepare a GitHub portfolio link.

One action only.

---

# 16. Recommendation Confidence

Gemini estimates

```
How confident am I that this opportunity fits the student?
```

Output

```
0

↓

1
```

Used only for display.

Not ranking.

---

# 17. Dashboard Structure

Example

```
Today's Best Match

⭐ AI Recommended

↓

Opportunity

↓

Why Scout picked this

↓

Missing Skills

↓

Apply Tip

↓

Apply
```

---

Second card

```
Hidden Gem

💎

↓

Opportunity

↓

Why nobody notices it

↓

Portfolio impact

↓

Apply
```

---

Third card

```
Stretch Opportunity

🚀

Slightly above your level.

Worth trying.
```

---

Fourth

```
Safe Choice
```

---

Fifth

```
Backup Option
```

---

# 18. AI Prompt Philosophy

The prompt is role-based.

Gemini is instructed to behave like

> a trusted senior mentor helping a female engineering student make smarter career decisions.

The prompt explicitly forbids:

- inventing facts
- changing rankings
- recommending unavailable opportunities
- exaggerating eligibility
- discouraging applications without evidence

---

# 19. Repair Strategy

If JSON fails

↓

Repair Prompt

```
Return ONLY valid JSON.

Do not add markdown.

Do not explain.

Preserve every field.

Repair invalid formatting only.
```

Maximum

```
3 attempts
```

---

If still invalid

↓

Return deterministic recommendation without AI enrichment.

Scout never blocks the user because AI failed.

---

# 20. Caching Strategy

Collection

```
recommendations
```

Structure

```
user

↓

recommendationPack

↓

generatedAt

↓

expiresAt

↓

provider

↓

model

↓

version
```

---

Cache Key

```
userId

+

recommendationVersion

+

profileHash
```

If the profile changes,

cache becomes invalid automatically.

---

# 21. Cost Optimization

AI runs

```
Once

Per User

Per Day
```

Everything else is deterministic.

Typical usage

```
1000 users

↓

1000 AI calls/day
```

instead of

```
Every page refresh

↓

Tens of thousands
```

---

# 22. Failure Handling

If Gemini fails

↓

Retry

↓

Different API key

↓

Retry

↓

Fallback provider

↓

Retry

↓

Return deterministic recommendations.

The user should never see an error page because AI is unavailable.

---

# 23. Future AI Capabilities

The architecture is designed to grow.

Future additions may include:

- Career GPS roadmaps
- Opportunity comparisons
- Resume improvement suggestions
- Interview preparation
- Personalized weekly digests
- Application strategy coaching
- "Why you were rejected" analysis
- Skill roadmap generation
- AI career companion chat

These all build on the same Recommendation Pack without changing the deterministic ranking engine.

---

# 24. Guiding Principle

The Scoring Engine decides:

> **"What should this student see?"**

The Personalization Engine explains:

> **"Why this matters to her, why now, and what she should do next."**

That separation keeps Scout fast, reliable, affordable, and deeply personal.