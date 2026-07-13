# Scout Discovery Engine — Stage 1
# Massive Opportunity Discovery

> Status: Planned
> Priority: Highest
> Objective: Build a discovery system capable of continuously finding high-quality opportunities from across the internet before any crawling or AI extraction begins.

---

# Vision

Scout should become the **Opportunity Intelligence Layer of the Internet.**

Its first responsibility is **not** understanding opportunities.

Its first responsibility is simply **finding them.**

If Stage 1 is successful, Scout should be capable of discovering opportunities from hundreds of trusted and hidden sources without depending on users to search manually.

The output of this stage is **candidate URLs only.**

Nothing gets scraped.

Nothing gets extracted.

Nothing gets stored as an opportunity yet.

---

# Problem Statement

Today, opportunities are scattered everywhere.

Some exist on:

- Government portals
- Company career pages
- NGO websites
- Fellowship websites
- Universities
- Startup hiring pages
- Hackathon organizers
- Scholarship websites

Some appear only on

- LinkedIn
- Unstop
- Internshala

Many are never indexed well by search engines.

Users currently have to check dozens of websites manually.

Scout's first mission is to remove this burden.

---

# Responsibilities

Stage 1 is responsible for exactly one thing:

> Find as many relevant opportunity URLs as possible.

It is NOT responsible for:

- Crawling
- Firecrawl
- Gemini
- Quality Scoring
- Deduplication
- Recommendations
- User Personalization

Those belong to later stages.

---

# High-Level Pipeline

```mermaid
flowchart LR

A[Discovery Context]
--> B[Query Planner]

B
--> C[Search Sources]

C
--> D[Candidate URLs]

D
--> E[URL Validation]

E
--> F[Discovery Output]
```

---

# Inputs

Stage 1 receives a Discovery Context.

Example

```json
{
  "country": "India",
  "categories": [
    "Internship",
    "Scholarship",
    "Hackathon",
    "Competition",
    "Fellowship"
  ],
  "audience": "General",
  "maxCandidates": 1000
}
```

Notice

There is **no user profile** involved.

Discovery is independent of users.

---

# Stage 1 Components

---

## Component 1 — Query Planner

Purpose

Generate intelligent search queries instead of relying on static keywords.

Example

Instead of

```
internships
```

Generate

```
software internship india 2026

women fellowship india

government internship portal

cybersecurity internship

research fellowship india

paid internship

machine learning internship

startup hiring graduate

AI fellowship

summer internship

hackathon registrations

scholarship applications

career opportunity

graduate trainee

open applications

```

The planner should continuously generate diverse queries to maximize discovery.

---

## Component 2 — Source Registry

The registry defines where Scout searches.

Initially this can remain code-based.

Later it can become database driven.

Each source should contain

```
Source Name

Homepage

Search Strategy

Trust Score

Category

Country

Enabled

Priority
```

Example

```
Google Search

Tavily

Microsoft Careers

Google Careers

Amazon Jobs

LinkedIn

Internshala

Unstop

Wellfound

Y Combinator Jobs

AICTE

NCS

Ministry websites

University opportunity pages

NGO opportunity pages

```

The registry should be easily extendable.

Adding a new source should require minimal code changes.

---

## Component 3 — Search Orchestrator

This is the heart of Stage 1.

Responsibilities

For every generated query

↓

Search all configured sources

↓

Collect candidate URLs

↓

Normalize URLs

↓

Attach metadata

↓

Pass forward

Example metadata

```
URL

Source

Search Query

Snippet

Search Score

Discovered At

```

Nothing else.

---

## Component 4 — URL Validation

Before leaving Stage 1

Every URL must pass validation.

Example checks

✔ HTTPS

✔ Valid hostname

✔ Not blacklisted

✔ Not javascript:

✔ Not mailto:

✔ Not duplicate inside current run

Invalid URLs should be discarded immediately.

---

# Discovery Sources

The engine should be capable of discovering opportunities from multiple categories.

---

## Search APIs

Primary

- Tavily

Future

- Brave Search
- SerpAPI

---

## Career Platforms

- LinkedIn Jobs
- Wellfound
- Internshala
- Unstop
- YC Jobs

---

## Government

Examples

- AICTE

- NCS

- Ministry portals

- State Government recruitment

- Apprenticeship portals

---

## Company Careers

Examples

Microsoft

Google

Amazon

Adobe

Intel

Qualcomm

Samsung

NVIDIA

Oracle

Atlassian

and many more.

---

## Universities

Examples

IIT

NIT

IIIT

State Universities

Research Institutes

---

## NGOs

Examples

UNICEF

UN Women

Teach For India

Fellowship organizations

Foundations

---

## Scholarships

Domestic

International

Government

Private

Corporate

---

## Competitions

Hackathons

Innovation Challenges

Research Competitions

Case Competitions

Startup Grants

---

# Discovery Strategy

Scout should not rely on one search query.

Instead

```
Category

↓

Generate Multiple Queries

↓

Search Multiple Sources

↓

Merge Results

↓

Normalize

↓

Validate

↓

Output
```

The larger the search surface,

the better the database becomes.

---

# Expected Output

Stage 1 produces only Candidate URLs.

Example

```json
{
  "url": "...",
  "source": "Microsoft Careers",
  "query": "software internship india",
  "snippet": "...",
  "score": 19,
  "discoveredAt": "..."
}
```

No opportunity extraction happens yet.

---

# Success Criteria

A successful Stage 1 should:

✔ Discover opportunities from diverse domains

✔ Avoid duplicate URLs

✔ Produce normalized candidate URLs

✔ Generate meaningful search diversity

✔ Remain independent of user profiles

✔ Be easily extensible

---

# Non-Goals

Stage 1 should NOT

❌ Call Firecrawl

❌ Call Gemini

❌ Score opportunities

❌ Merge duplicates in MongoDB

❌ Archive expired entries

❌ Personalize results

❌ Recommend anything

---

# Deliverables

By the end of Stage 1 we should have

- Intelligent Query Planner
- Expandable Source Registry
- Search Orchestrator
- URL Validation
- Candidate URL Output

Nothing more.

If Stage 1 is functioning correctly, Scout should consistently discover hundreds to thousands of candidate opportunity URLs that are ready for Stage 2 (Intelligent Crawling).