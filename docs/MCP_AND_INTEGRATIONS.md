# MCP_AND_INTEGRATIONS.md

# Scout Integration Matrix
### Build Intelligence. Integrate Everything Else.

---

# Philosophy

Scout should NOT reinvent existing technologies.

Every engineering decision should follow this order:

1. Is there an official API?
2. Is there an MCP Server?
3. Is there a mature open-source solution?
4. Is there a reliable free SaaS?
5. Only then should we build it ourselves.

Our competitive advantage is NOT scraping.

Our competitive advantage is Intelligence.

---

# Integration Decision Matrix

| Capability | Preferred | Alternatives | Priority | Build Ourselves |
|------------|-----------|--------------|----------|-----------------|
| Authentication | Firebase Auth | Clerk, Supabase | ⭐⭐⭐⭐⭐ | ❌ |
| Database | MongoDB Atlas | Supabase | ⭐⭐⭐⭐⭐ | ❌ |
| Cache | Redis Cloud | Upstash Redis | ⭐⭐⭐⭐ | ❌ |
| LLM | Gemini 2.5 Flash | OpenRouter, Groq | ⭐⭐⭐⭐⭐ | ❌ |
| Web Search | Brave Search API / MCP | Tavily, Serper | ⭐⭐⭐⭐⭐ | ❌ |
| Crawling | Firecrawl | Crawl4AI | ⭐⭐⭐⭐⭐ | ❌ |
| Browser Automation | Playwright | Browser Use | ⭐⭐⭐⭐ | ❌ |
| HTML Parsing | Firecrawl | Trafilatura, Readability | ⭐⭐⭐⭐ | ❌ |
| Scheduling | GitHub Actions | Inngest | ⭐⭐⭐⭐ | ❌ |
| Queue | Redis + BullMQ | Inngest | ⭐⭐⭐⭐ | ❌ |
| Embeddings | Gemini | OpenAI | ⭐⭐⭐ | ❌ |
| Deployment | Vercel + Railway | Render | ⭐⭐⭐⭐⭐ | ❌ |
| Analytics | PostHog | Firebase Analytics | ⭐⭐⭐ | ❌ |

---

# Discovery Engine Integrations

## Search Layer

Purpose

Find relevant opportunity pages before crawling.

Preferred

Brave Search API / MCP

Reason

- Fast
- Good free tier
- Fresh indexing
- Search operators supported

Example Queries

- Women internships India
- AI internships remote
- Scholarship for women engineers
- Site:careers.microsoft.com internship
- Women hackathon registrations

Alternatives

- Tavily
- Serper

---

## Content Extraction

Preferred

Firecrawl

Responsibilities

- Crawl webpage
- Remove ads
- Remove navigation
- Return markdown
- Metadata extraction

Fallback

Trafilatura

Stretch

Playwright

Use only when JavaScript rendering is required.

---

## Browser Automation

Preferred

Playwright MCP

Use Cases

- Dynamic pages
- Infinite scroll
- Login-protected content
- Lazy-loaded listings

Do NOT use Playwright by default.

It is slower than Firecrawl.

---

## Queue System

Preferred

Redis + BullMQ

Purpose

Every discovered URL becomes a queue job.

Benefits

- Retry support
- Parallel workers
- Better scalability
- Fault isolation

---

## Scheduler

Preferred

GitHub Actions

Runs

Every 6 Hours

Tasks

- Trigger discovery
- Cleanup expired opportunities
- Generate logs

Alternative

Inngest

---

# Personalization Engine Integrations

## Authentication

Firebase Authentication

Methods

- Google
- Email

Future

GitHub

Microsoft

---

## LLM Gateway

All LLM requests go through Scout's Unified LLM Layer.

Never import provider SDKs directly.

Supported Providers

- Gemini
- Groq
- OpenRouter
- OpenAI
- Ollama

Every provider implements

- generate()
- structuredOutput()
- embeddings()

---

## Recommendation Cache

Redis

Stores

- Personalized feeds
- AI explanations
- Recommendation history

Cache Invalidates

- Profile update
- Discovery refresh
- Manual refresh

---

# Unified LLM Gateway

## Philosophy

Scout should never depend on one AI provider.

The rest of the application should never know which provider generated the response.

---

## Discovery Workflow

Purpose

Understand opportunities.

Default

Gemini Account A

Future

OpenRouter

DeepSeek

Claude

---

## Personalization Workflow

Purpose

Understand people.

Default

Gemini Account B

Future

Groq

Claude

OpenAI

---

## Environment Variables

DISCOVERY_PROVIDER

DISCOVERY_MODEL

DISCOVERY_API_KEY

PERSONALIZATION_PROVIDER

PERSONALIZATION_MODEL

PERSONALIZATION_API_KEY

---

# MCP Opportunities

## Brave Search MCP

Purpose

Search the web.

Use Cases

- Fresh opportunity discovery
- Company search
- Scholarship search

---

## Playwright MCP

Purpose

Browser automation.

Use Cases

- Dynamic websites
- Infinite scrolling
- Login flows

---

## GitHub MCP

Future

Discover

- Open source programs
- GSOC organizations
- GitHub internships
- Student programs

---

## Filesystem MCP

Purpose

Development utility.

Not used in production.

---

## Sequential Thinking MCP

Future

Can improve reasoning for

- Opportunity ranking
- Long-form recommendations
- Career explanations

---

# Open Source Libraries

## BullMQ

Purpose

Background queues.

---

## Mongoose

MongoDB ODM.

---

## LangGraph (TypeScript)

Responsible for

Discovery Workflow

Recommendation Workflow

Future AI Agents

---

## LangChain

Responsible for

- Prompt management
- Structured outputs
- LLM abstraction

---

## Zod

Purpose

Validate structured outputs.

Every LLM JSON response should be validated before database insertion.

---

## Axios

HTTP client.

---

## Cheerio

Emergency fallback parser.

Only if Firecrawl fails.

---

# APIs Worth Exploring

## Opportunity Platforms

- Devpost
- Devfolio
- Unstop
- Wellfound
- Internshala

---

## Company Careers

- Google
- Microsoft
- Adobe
- NVIDIA
- Atlassian
- Canonical

---

## Government

- AICTE
- ISRO
- DRDO
- MeitY

---

## Communities

- MLH
- IEEE
- GDG
- Kaggle

---

## Scholarship Sources

- Google Women Techmakers
- Adobe Women
- Tata Scholarships
- National Scholarship Portal
- Microsoft Learn
- Women Who Code

---

# Things We Will NOT Build

❌ Authentication

❌ Search Engine

❌ Browser Automation

❌ Queue System

❌ Scheduler

❌ HTML Parser

❌ Markdown Cleaner

❌ Deployment Infrastructure

❌ UI Components

---

# Things We WILL Build

✅ Discovery Intelligence

✅ Opportunity Intelligence Database

✅ Hidden Gem Detection

✅ Opportunity Classification

✅ AI Ranking

✅ Personalized Recommendations

✅ Explainable Recommendations

✅ Scout LLM Gateway

---

# Stretch Integrations (Only If Time Permits)

- Resend (Email Digests)
- OneSignal / Firebase Cloud Messaging (Push Notifications)
- PostHog (Product Analytics)
- Sentry (Error Monitoring)
- Cloudinary (Image Storage)
- Trigger.dev (Advanced Background Jobs)

---

# Decision Framework

Before implementing any feature, ask:

1. Does a production-ready solution already exist?
2. Can it be integrated in under 30 minutes?
3. Does it have a free tier or open-source alternative?
4. Will building it ourselves improve Scout's core intelligence?

If the answer to Question 4 is **No**,

Integrate.

Do not build.

---

# Final Engineering Philosophy

Scout should write code only where intelligence is created.

Everything else should be delegated to proven tools, open-source libraries, APIs, MCP servers, or managed services.

Every line of custom code should move Scout closer to its mission:

> Talent shouldn't depend on who you know.