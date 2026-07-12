# IMPLEMENTATION_ROADMAP.md

# Scout 36-Hour Implementation Roadmap

> "Ship vertical slices.
>
> Not horizontal layers."

---

# Development Philosophy

Avoid building

Frontend

↓

Backend

↓

AI

↓

Database

↓

Deployment

This creates integration problems near the deadline.

Instead

Build one complete feature at a time.

Every few hours,

Scout should become more usable.

At any moment,

the project should be demoable.

---

# Overall Timeline

```
Hour 0–2
Project Setup

↓

Hour 2–6
Foundation

↓

Hour 6–14
Discovery Engine

↓

Hour 14–22
Personalization Engine

↓

Hour 22–28
Frontend Integration

↓

Hour 28–32
Polish

↓

Hour 32–36
Testing
Presentation
Deployment
```

---

# Phase 0
## Planning

Duration

30–60 Minutes

Goal

Freeze architecture.

Deliverables

- Final Folder Structure
- Environment Variables
- API Keys
- GitHub Repository
- Database Created
- Firebase Project
- MongoDB Atlas
- Redis

Success Criteria

Everyone should know

what is being built.

No coding yet.

---

# Phase 1
## Foundation

Duration

2 Hours

Goal

Scaffold the project.

Tasks

Backend

- Express
- TypeScript
- ESLint
- Prettier
- Environment Loader

Frontend

- Next.js / React
- Tailwind
- shadcn/ui

Infrastructure

- Firebase
- Mongo
- Redis

Success Criteria

Project runs locally.

Database connected.

Authentication works.

---

# Phase 2
## Unified AI Layer

Duration

2 Hours

Goal

Complete AI infrastructure before features.

Tasks

- Unified LLM Gateway
- Discovery Provider
- Personalization Provider
- AI Capability Layer
- Structured Outputs
- Zod Validation

Deliverables

```
ai/

gateway/

providers/

capabilities/

schemas/
```

Success Criteria

One function call

↓

Returns typed AI response.

---

# Phase 3
## Discovery Engine

Duration

6–8 Hours

Goal

Populate Scout with opportunities.

Tasks

Search

↓

Firecrawl

↓

Extraction

↓

Classification

↓

Validation

↓

Mongo

↓

Redis Queue

Deliverables

Working Discovery Pipeline.

Success Criteria

Database contains

real opportunities.

---

# Phase 4
## User Onboarding

Duration

2 Hours

Goal

Collect user profile.

Tasks

Authentication

Profile

Preferences

AI Profile Generation

Success Criteria

User profile stored.

AI profile generated.

---

# Phase 5
## Recommendation Engine

Duration

6 Hours

Goal

Generate personalized recommendations.

Tasks

Candidate Retrieval

↓

Eligibility Filtering

↓

AI Ranking

↓

Explanation

↓

Caching

↓

Dashboard API

Success Criteria

Different users receive different recommendations.

---

# Phase 6
## Dashboard

Duration

4 Hours

Goal

Create usable product.

Pages

Login

Onboarding

Dashboard

Opportunity Details

Bookmarks

Profile

Success Criteria

End-to-end flow works.

---

# Phase 7
## Polish

Duration

3 Hours

Tasks

Loading States

Animations

Empty States

Error Pages

Icons

Branding

Responsive Design

Performance

Success Criteria

Feels like a product.

Not a hackathon demo.

---

# Phase 8
## Deployment

Duration

2 Hours

Tasks

Deploy Backend

Deploy Frontend

Environment Variables

Mongo

Redis

Firebase

Testing

Success Criteria

Public URL works.

---

# Phase 9
## Demo Preparation

Duration

2 Hours

Tasks

Demo Script

Presentation

Backup Video

Seed Database

Example Accounts

Screenshots

Success Criteria

Everything demo-ready.

---

# Task Breakdown

## Backend

- Express Setup
- MongoDB
- Firebase
- Redis
- Unified AI Layer
- Discovery Engine
- Recommendation Engine
- API Development
- Background Workers

---

## AI

- Discovery Prompt
- Recommendation Prompt
- AI Profile Prompt
- Structured Outputs
- Gateway
- Provider Routing

---

## Database

- Collections
- Indexes
- Seed Data

---

## Frontend

- Authentication
- Onboarding
- Dashboard
- Opportunity Card
- Detail Page
- Profile
- Bookmarks

---

## Infrastructure

- GitHub
- Vercel
- Railway/Render
- Firebase
- Mongo
- Redis

---

# Git Commit Milestones

## Project Initialization

```
chore: initialize Scout project with frontend and backend setup
```

---

## Foundation

```
feat: configure Firebase, MongoDB and Redis infrastructure
```

---

## AI Infrastructure

```
feat: implement unified LLM gateway and AI capability layer
```

---

## Discovery Engine

```
feat: build opportunity ingestion and discovery pipeline
```

---

## AI Extraction

```
feat: implement AI-powered opportunity extraction workflow
```

---

## Database

```
feat: integrate opportunity intelligence database
```

---

## Authentication

```
feat: implement Firebase authentication and onboarding flow
```

---

## AI Profiles

```
feat: generate personalized AI user profiles
```

---

## Recommendation Engine

```
feat: implement personalized recommendation engine
```

---

## Dashboard

```
feat: build personalized opportunity dashboard
```

---

## Bookmarks

```
feat: add bookmark and application tracking
```

---

## API

```
feat: complete REST API for Scout platform
```

---

## UI Polish

```
style: polish dashboard experience and responsive interface
```

---

## Performance

```
perf: optimize caching and recommendation pipeline
```

---

## Deployment

```
chore: deploy Scout production infrastructure
```

---

## Final Submission

```
release: Scout v1 hackathon submission
```

---

# Non-Negotiables

Before submission, Scout MUST have

✅ Authentication

✅ User onboarding

✅ Discovery Engine

✅ Opportunity database

✅ AI recommendation engine

✅ Dashboard

✅ Bookmarking

✅ Deployment

Everything else is optional.

---

# Stretch Goals

If time remains

- Email notifications
- Push notifications
- Analytics
- Opportunity summaries
- Resume upload
- Admin dashboard
- Source monitoring
- Dark mode
- Career GPS preview

---

# Time Management Rules

1.

Never spend more than 45 minutes debugging one issue.

---

2.

Ship first.

Refactor later.

---

3.

If a feature isn't demo-critical, postpone it.

---

4.

Every 2–3 hours, deploy and verify the application still works.

---

5.

Always maintain a working main branch.

---

# Definition of Done

Scout is complete when a user can:

1. Sign in.
2. Complete onboarding.
3. Receive personalized opportunities.
4. Understand why they were recommended.
5. Bookmark and manage opportunities.
6. Access the application through a public URL.

At that point, Scout has successfully delivered on its core promise.

---

# Final Principle

Don't aim to build the biggest product in 36 hours.

Aim to build the smallest product that feels inevitable.

Every feature should strengthen one promise:

> "Helping deserving women discover opportunities they would otherwise never find."