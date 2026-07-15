# IMPLEMENTATION_PLAN.md

> **Version:** Scout MVP V2
>
> This document translates Scout's architecture into an implementation roadmap. Every phase builds on the previous one, ensuring that dependencies are satisfied before introducing higher-level intelligence.
>
> The goal is to reach a production-ready MVP for real student testing while avoiding unnecessary complexity.

---

# 1. Guiding Principles

The implementation follows four principles:

- Build foundations before intelligence.
- Ship working increments frequently.
- Keep recommendations deterministic.
- Use AI only where it creates real user value.

---

# 2. Overall Roadmap

```text
Phase 1
Foundation

↓

Phase 2
Onboarding V2

↓

Phase 3
Resume Intelligence

↓

Phase 4
Discovery Engine V2

↓

Phase 5
Recommendation Engine

↓

Phase 6
Career GPS

↓

Phase 7
Unlock System

↓

Phase 8
Daily Delta

↓

Phase 9
Testing & Optimization

↓

Phase 10
Production Launch
```

---

# Phase 1 — Foundation

## Objective

Prepare Scout for the second-generation architecture.

---

## Backend

- Update database schema
- Create new collections
- Add missing indexes
- Migrate existing data
- Version API contracts

---

## Frontend

- Update API clients
- Prepare onboarding state management
- Update authentication guards

---

## Deliverables

- Stable database
- Updated APIs
- Zero migration issues

---

# Phase 2 — Onboarding V2

## Objective

Collect the minimum information necessary for excellent recommendations without overwhelming students.

---

## Features

- Progressive onboarding
- Career direction
- Confidence signals
- Motivation signals
- Opportunity preferences
- Career Readiness score
- Autosave
- Resume upload placeholder

---

## Backend

- Profile APIs
- Autosave APIs
- Validation
- Career Readiness calculator

---

## Frontend

- Multi-step onboarding
- Progress indicator
- Autosave
- Completion screen

---

## Success Criteria

A new user can complete onboarding in under 5 minutes while creating a recommendation-ready profile.

---

# Phase 3 — Resume Intelligence

## Objective

Use uploaded resumes to enrich user profiles automatically.

---

## Features

- Resume upload
- Resume parsing
- Skill extraction
- Education extraction
- Project extraction
- Confidence score
- Editable results

---

## Backend

- Resume parser integration
- Resume storage
- Profile merge logic

---

## Frontend

- Upload interface
- Review extracted fields
- Manual corrections

---

## Success Criteria

Most profile fields can be populated automatically from a resume.

---

# Phase 4 — Discovery Engine V2

## Objective

Align Discovery with Scout's refined student-first focus.

---

## Features

- Internship-first discovery
- Hackathon discovery
- Scholarship discovery
- Women-focused opportunities
- Early career programs
- Student competitions
- Training programs
- Better source prioritization

---

## Improvements

- Persona-driven search generation
- Better university source coverage
- Improved filtering
- Enhanced hidden gem detection

---

## Backend

- Update search registry
- Expand source registry
- Adjust enrichment prompts
- Tune quality scoring

---

## Success Criteria

Discovery consistently finds relevant opportunities for Indian college students.

---

# Phase 5 — Recommendation Engine

## Objective

Generate meaningful recommendation feeds using deterministic scoring.

---

## Features

- Eligibility scoring
- Fit scoring
- Confidence adjustments
- Hidden Gem bonus
- Diversity balancing
- Daily recommendation package

---

## Backend

- Recommendation scorer
- Feed generation
- Recommendation cache
- Category assignment

---

## Frontend

- Recommendation dashboard
- Category cards
- Explanation cards

---

## Success Criteria

Students receive recommendations that feel relevant, understandable, and actionable.

---

# Phase 6 — Career GPS

## Objective

Guide students toward opportunities they are not yet eligible for.

---

## Features

- Skill gap detection
- Career roadmap
- Learning tasks
- Unlock estimation
- Progress tracking

---

## Backend

- Career GPS generator
- Task storage
- Progress calculation

---

## Frontend

- Career roadmap page
- Task checklist
- Progress visualization

---

## Success Criteria

Students clearly understand what they should do next.

---

# Phase 7 — Unlock System

## Objective

Turn career growth into visible progress.

---

## Features

- Locked opportunities
- Unlock counter
- Career milestones
- Progress badges
- Opportunity previews

---

## Backend

- Unlock calculations
- Opportunity eligibility simulator

---

## Frontend

- Locked cards
- Unlock indicators
- Growth widgets

---

## Success Criteria

Students feel motivated to improve their profiles.

---

# Phase 8 — Daily Delta

## Objective

Give students a reason to return every day.

---

## Features

- New opportunities
- Closing deadlines
- Newly unlocked opportunities
- Better recommendations
- Daily summary
- Morning dashboard

---

## Backend

- Daily recommendation refresh
- Delta generator
- Notification creation

---

## Frontend

- Daily Delta card
- Notifications
- Morning summary

---

## Success Criteria

Students immediately see what changed since yesterday.

---

# Phase 9 — Testing & Optimization

## Objective

Validate Scout before public testing.

---

## Testing Areas

### Functional

- Authentication
- Onboarding
- Resume upload
- Discovery
- Recommendations
- Bookmarks
- Daily Delta

---

### Performance

- Recommendation latency
- Cache efficiency
- API costs
- Discovery duration

---

### Recommendation Quality

Manual review of:

- recommendation relevance
- diversity
- Career GPS
- explanations
- unlock accuracy

---

### User Testing

Conduct real testing with Indian college students.

Observe:

- onboarding completion
- recommendation quality
- return behavior
- feedback

---

## Success Criteria

Users consistently understand Scout and successfully discover useful opportunities.

---

# Phase 10 — Production Launch

## Objective

Prepare Scout for real-world deployment.

---

## Tasks

- Production deployment
- Monitoring
- Error tracking
- Logging
- Analytics
- Backup strategy
- Rate limiting
- API monitoring

---

## Metrics Dashboard

Track:

- Daily active users
- Recommendation CTR
- Bookmark rate
- Apply rate
- Daily return rate
- Career GPS completion
- Opportunity unlocks
- Discovery success
- API usage
- Infrastructure costs

---

# Development Workflow

Every feature should follow the same lifecycle.

```text
Design

↓

Database

↓

Backend APIs

↓

Frontend

↓

Testing

↓

Manual Review

↓

Deployment
```

---

# Git Milestones

Suggested milestone structure:

```text
v2.1
Foundation

v2.2
Onboarding

v2.3
Resume Intelligence

v2.4
Discovery Updates

v2.5
Recommendation Engine

v2.6
Career GPS

v2.7
Unlock System

v2.8
Daily Delta

v2.9
Testing

v3.0
Production MVP
```

---

# MVP Success Criteria

Scout V2 is considered successful when a student can:

- Create an account.
- Complete onboarding in a few minutes.
- Upload a resume.
- Receive personalized recommendations.
- Understand why each recommendation was made.
- Discover hidden opportunities.
- See what skills unlock additional opportunities.
- Receive meaningful daily updates.
- Feel encouraged to apply instead of overwhelmed.

---

# Out of Scope (Post-MVP)

The following ideas are intentionally deferred:

- AI mock interviews
- Resume tailoring
- Mentor marketplace
- Referral graph
- Salary prediction
- LinkedIn automation
- Company review system
- Community discussions
- Interview experience sharing
- Mobile applications
- Paid premium features

These can be revisited after validating product-market fit.

---

# Final Principle

Scout should never become another job board.

Every implementation decision should move the product closer to becoming a **career companion** that helps students:

- discover hidden opportunities,
- become eligible,
- apply confidently,
- and continuously grow throughout their college journey.