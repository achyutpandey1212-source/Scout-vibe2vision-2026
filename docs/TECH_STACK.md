# TECH_STACK.md

# Scout Technology Stack
### One Tool. One Responsibility.

> "Every dependency must earn its place."

---

# Philosophy

Scout prioritizes

- Simplicity
- Maintainability
- Product quality
- Development speed
- Long-term scalability

When choosing technologies

Prefer

- Mature
- Well documented
- Production proven
- TypeScript friendly
- Open source
- Free tier friendly

Avoid unnecessary dependencies.

If existing code can solve the problem cleanly,

do not install another package.

---

# Core Stack

## Frontend

Framework

Next.js (App Router)

Language

TypeScript

Styling

Tailwind CSS

Component Library

shadcn/ui

Icons

Lucide React

Animations

Framer Motion

Theme Management

next-themes

Forms

React Hook Form

Validation

Zod

State Management

Zustand

API Client

Native Fetch

Image Optimization

Next.js Image

---

# Backend

Runtime

Node.js

Framework

Express.js

Language

TypeScript

Validation

Zod

Authentication Middleware

Firebase Admin SDK

Environment Variables

dotenv

Logging

Pino

File Uploads

Not required for MVP

Future

UploadThing

---

# Database

Primary Database

MongoDB Atlas

ODM

Mongoose

Reason

Developer familiarity

Excellent TypeScript support

Flexible schema evolution

No ORM required.

Scout does NOT use Prisma.

---

# Cache

Redis

Purpose

- Recommendation cache
- AI response cache
- Session cache
- Background job coordination
- Rate limiting
- Temporary workflow state

---

# Authentication

Firebase Authentication

Provider

Google Sign-In

Future

Email

GitHub

Apple

---

# AI Infrastructure

Framework

LangChain

Workflow Engine

LangGraph

Structured Output

Zod Schemas

Unified AI Layer

Custom Implementation

AI Capability Layer

Custom Implementation

Provider Gateway

Custom Implementation

Prompt Management

Local prompt files

---

# LLM Providers

Scout separates providers by workflow.

Discovery Workflow

Provider

Configurable

Default

Gemini

Dedicated API Key

DISCOVERY_API_KEY

---

Personalization Workflow

Provider

Configurable

Default

Gemini

Dedicated API Key

PERSONALIZATION_API_KEY

---

Future Providers

Claude

Groq

OpenRouter

Ollama

OpenAI

Mistral

Cohere

The application should never depend on a specific provider.

All providers are accessed only through the Unified LLM Gateway.

---

# Opportunity Discovery

Internet Search

Brave Search API

Purpose

Discover new opportunities.

---

Website Crawling

Firecrawl

Purpose

Extract clean markdown from webpages.

Firecrawl replaces

HTML parsing

Cheerio

Puppeteer

Manual scraping

whenever possible.

---

Future Sources

Google Search API

LinkedIn

GitHub Jobs

Wellfound

Devfolio

Hack2Skill

Unstop

Google Scholarships

Official Government Websites

University Opportunity Portals

NGOs

Women-focused communities

---

# AI Processing

Discovery Workflow

LangGraph

↓

Firecrawl Output

↓

AI Extraction

↓

Structured JSON

↓

Validation

↓

MongoDB

---

Personalization Workflow

User Profile

↓

Candidate Retrieval

↓

Eligibility Filtering

↓

AI Ranking

↓

Explanation Generation

↓

Redis Cache

---

# Validation

Zod

Used Everywhere

API Requests

AI Responses

Environment Variables

Database Objects

Shared Types

No validation library other than Zod.

---

# Background Processing

Current

Node Cron

Future

BullMQ

Redis Queue

Reason

Keep MVP simple.

Upgrade only if needed.

---

# Deployment

Frontend

Vercel

Backend

Railway

Alternative

Render

Database

MongoDB Atlas

Redis

Upstash Redis

Authentication

Firebase

---

# Monitoring

Development

Console

Pino

Future

Sentry

OpenTelemetry

PostHog

Only integrate if required.

---

# API Testing

Postman

Future

Bruno

---

# Design System

Tailwind CSS

shadcn/ui

Lucide

Framer Motion

next-themes

No Bootstrap.

No Material UI.

No Chakra UI.

No Ant Design.

---

# Fonts

Primary

Geist

Fallback

Inter

Typography should remain clean and editorial.

---

# Charts

Recharts

Only if required.

Avoid chart-heavy dashboards.

---

# Search

MongoDB Indexes

Native Search

Future

Atlas Search

Avoid introducing Elasticsearch for the MVP.

---

# Storage

Current

No user file storage required.

Future

UploadThing

Cloudinary

ImageKit

---

# Notifications

Current

In-App Notifications

Future

Resend

Firebase Cloud Messaging

Email

Push Notifications

---

# Configuration

Environment Variables

```
MONGODB_URI

REDIS_URL

FIREBASE_PROJECT_ID

FIREBASE_CLIENT_EMAIL

FIREBASE_PRIVATE_KEY

DISCOVERY_PROVIDER

DISCOVERY_MODEL

DISCOVERY_API_KEY

PERSONALIZATION_PROVIDER

PERSONALIZATION_MODEL

PERSONALIZATION_API_KEY

BRAVE_API_KEY

FIRECRAWL_API_KEY
```

Never hardcode secrets.

---

# Folder Architecture

Frontend

```
apps/web
```

Backend

```
apps/server
```

Shared Types

```
packages/shared
```

Documentation

```
docs
```

---

# Package Management

pnpm

Reason

Fast

Disk efficient

Monorepo friendly

---

# Code Quality

Formatting

Prettier

Linting

ESLint

Git Hooks

Husky

Lint Staged

Every commit should pass lint checks.

---

# Dependency Rules

Before installing a dependency,

ask

Can existing tools already solve this?

If yes,

do not install another package.

Every library should have exactly one responsibility.

Avoid overlapping tools.

---

# Technologies Explicitly Avoided

Prisma

Reason

Mongo + Mongoose is sufficient.

---

Redux

Reason

Zustand is enough.

---

Axios

Reason

Native Fetch is sufficient.

---

Cheerio

Reason

Firecrawl already extracts structured content.

---

Puppeteer

Reason

Too heavy for MVP.

---

Material UI

Reason

Scout requires a custom premium design language.

---

Bootstrap

Reason

Not aligned with product vision.

---

Multiple Validation Libraries

Reason

Zod already solves validation.

---

# Engineering Principles

1.

One responsibility per technology.

---

2.

Prefer composition over additional dependencies.

---

3.

Never bypass the Unified AI Layer.

---

4.

Never bypass the AI Capability Layer.

---

5.

Never couple business logic to provider SDKs.

---

6.

Every dependency must improve either

Developer Experience

or

User Experience.

Otherwise,

don't install it.

---

# North Star

Scout should feel like a carefully crafted product—not a collection of libraries.

Every technology should exist because it solves a specific problem, not because it is popular.