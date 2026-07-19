# RECOMMENDATION_PACK.md

> **Version:** Scout MVP V2
>
> The Recommendation Pack is the final product produced by the Recommendation Engine.
>
> It is **not** a ranked list of opportunity IDs.
>
> It is a carefully curated daily career plan generated specifically for one student.
>
> The dashboard never computes recommendations.
>
> It simply renders today's Recommendation Pack.

---

# 1. Philosophy

Traditional job platforms return this:

```
Jobs

↓

Sorted by Date

↓

Page 1
```

Scout returns this:

```
Today's Mission

↓

Perfect Match

↓

Hidden Gem

↓

Stretch Goal

↓

Quick Win

↓

Confidence Builder
```

This changes the user experience from

> "Search for opportunities."

to

> "Scout already searched for you."

---

# 2. Purpose

The Recommendation Pack has three goals.

## Reduce decision fatigue

Students should never need to compare 50 opportunities.

Scout already did that.

---

## Encourage action

The pack should make students want to apply today.

---

## Feel personal

The dashboard should feel like

> "Scout understands me."

not

> "Scout searched a database."

---

# 3. Lifecycle

```
User Logs In

↓

Recommendation Cache

↓

Exists?

↓

YES

↓

Return Pack

↓

Dashboard
```

---

If not

```
Generate Recommendation Pack

↓

Store

↓

Return

↓

Dashboard
```

---

# 4. Lifetime

Recommendation Pack

```
Valid

24 Hours
```

After

```
24 Hours

↓

Regenerate
```

---

# 5. Structure

```
Recommendation Pack

├── Today's Mission
├── Perfect Match
├── Hidden Gem
├── Stretch Goal
├── Quick Win
├── Confidence Builder
├── AI Summary
├── Generated At
├── Version
└── Metadata
```

---

# 6. Today's Mission

One sentence.

The student's focus for today.

Examples

> Apply to two startup internships before 9 PM.

---

> Build one React project and apply to the IISc internship.

---

> Finish your resume today and submit the fellowship application.

---

Length

```
1 sentence
```

---

# 7. Perfect Match ⭐

The single highest-quality recommendation.

Not merely the highest score.

It must satisfy:

- strongest deterministic score
- excellent AI confidence
- highly actionable
- realistic
- aligned with user goals

Example

```
Google STEP Internship

Score

96
```

---

Displayed as

```
⭐ Perfect Match
```

---

Fields

```
Opportunity

AI Reason

Why Now

Missing Skills

First Action
```

---

# 8. Hidden Gem 💎

A valuable opportunity with low visibility.

Chosen using

```
Hidden Gem Score

+

Recommendation Score
```

Purpose

Help students discover opportunities they would probably never find themselves.

Examples

- IISc Lab Internship
- State Innovation Fellowship
- Small startup internship
- University research assistantship

---

Displayed as

```
💎 Hidden Gem
```

---

# 9. Stretch Goal 🚀

A recommendation slightly above the student's current level.

Purpose

Inspire ambition.

Examples

- Google Summer of Code
- YC Startup Internship
- Competitive Fellowship

It should feel difficult

but

possible.

---

Displayed as

```
🚀 Stretch Goal
```

---

# 10. Quick Win ⚡

Low application effort.

High potential value.

Examples

- Rolling internship
- Easy application
- Beginner hackathon
- Workshop

Purpose

Build momentum.

Students who apply once are much more likely to apply again.

---

Displayed as

```
⚡ Quick Win
```

---

# 11. Confidence Builder 🌱

A safe recommendation.

Something the student is highly likely to qualify for.

Purpose

Reduce fear of rejection.

Examples

- Beginner internship
- College competition
- Open fellowship
- Student ambassador role

---

Displayed as

```
🌱 Confidence Builder
```

---

# 12. AI Summary

One short paragraph.

Example

> Today Scout focused on opportunities that match your React interests, beginner-friendly internships, and startup exposure. One recommendation pushes you slightly beyond your comfort zone, while another is an easy application to build confidence.

Length

```
60–100 words
```

---

# 13. Metadata

Stored for debugging.

```
Generated At

Model

Provider

Recommendation Version

Pipeline Version

Generation Time

Total Candidates

Filtered Candidates
```

---

Example

```json
{
  "generatedAt": "...",

  "provider": "gemini",

  "model": "gemini-3.5-flash",

  "version": "RE-v1",

  "candidateCount": 30,

  "generationTimeMs": 2840
}
```

---

# 14. Internal Opportunity Object

Every recommendation stores:

```json
{
  "opportunityId": "...",

  "score": 93,

  "confidence": 0.95,

  "explanation": "...",

  "whyNow": "...",

  "missingSkills": [],

  "firstAction": "...",

  "scoreBreakdown": {

  }
}
```

The dashboard never recomputes anything.

---

# 15. Example Recommendation Pack

```text
Today's Mission
──────────────────────────────

Apply to one startup internship today and one hidden research opportunity before the weekend.

──────────────────────────────

⭐ Perfect Match

Frontend Internship — Razorpay

──────────────────────────────

💎 Hidden Gem

Research Internship — IISc

──────────────────────────────

🚀 Stretch Goal

Founder Intern — YC Startup

──────────────────────────────

⚡ Quick Win

Hackathon — HackerEarth

──────────────────────────────

🌱 Confidence Builder

Campus Ambassador Program

──────────────────────────────

Scout Summary

Today your strongest opportunities combine frontend development with startup exposure. You also have one ambitious recommendation to push your limits and one easy application to help you gain confidence.

Generated
18 July 2026
```

---

# 16. Database Schema

```json
{
  "_id": "...",

  "userId": "...",

  "generatedAt": "...",

  "expiresAt": "...",

  "version": "RE-v1",

  "todayMission": "...",

  "perfectMatch": {

  },

  "hiddenGem": {

  },

  "stretchGoal": {

  },

  "quickWin": {

  },

  "confidenceBuilder": {

  },

  "aiSummary": "...",

  "metadata": {

  }
}
```

---

# 17. Dashboard Rendering

The frontend never asks

```
Give me recommendations.
```

Instead

```
GET

/recommendation-pack
```

Response

↓

Render

```
Mission

↓

Perfect Match

↓

Hidden Gem

↓

Stretch Goal

↓

Quick Win

↓

Confidence Builder
```

No sorting.

No scoring.

No AI.

No business logic.

The dashboard becomes a pure presentation layer.

---

# 18. Why This Architecture?

Traditional systems store

```
Opportunity IDs
```

Scout stores

```
A Story
```

Every login should feel like opening today's personalized career briefing, not scrolling another job board.

---

# 19. Future Extensions

The Recommendation Pack is intentionally extensible.

Future additions may include:

- 📚 Learn This Week
- 🎯 Skill Gap Focus
- 🔥 Trending Opportunity
- 🧠 Resume Improvement Tip
- 🎤 Interview Preparation
- 📈 Weekly Progress
- 🏆 Application Streak
- ❤️ Saved Opportunity Reminder
- 👭 Friend Recommendation
- 🤖 Scout Mentor Insight

These can be added without changing the Recommendation Engine pipeline.

---

# 20. Guiding Principle

The Recommendation Pack is Scout's promise to every student.

> **"You don't need to spend hours searching anymore. We already did the hard work. Here's what deserves your attention today."**

That single object should be enough to power the entire dashboard experience.