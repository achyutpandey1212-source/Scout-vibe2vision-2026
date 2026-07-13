# Stage 1 Remaster — Opportunity Intelligence Network (OIN)

> **Version:** v2
> **Status:** Planned
> **Priority:** Critical
> **Goal:** Transform Stage 1 from a simple Tavily-powered search into Scout's own Opportunity Intelligence Network.

---

# Why are we rebuilding Stage 1?

The current Discovery Engine relies heavily on Tavily.

Current flow:

```
Tavily
    ↓
~60 URLs
    ↓
Crawler
    ↓
AI Extraction
    ↓
5 Opportunities
```

Problems:

- Limited by Tavily's search results.
- Lots of noisy URLs.
- Discovery quality depends on search engine luck.
- Same searches may repeatedly return the same domains.
- Cannot scale into thousands of opportunities.
- No proprietary asset is being built.

The crawler behaves like a search engine instead of an intelligence system.

---

# Vision

Scout should NOT depend on Tavily to discover opportunities forever.

Instead:

Scout should gradually build its own map of the internet.

Instead of asking

> "Find opportunities"

Scout should know

> "These are the best websites on Earth for opportunities."

That list becomes one of Scout's biggest competitive advantages.

---

# Architecture

```
                    Opportunity Intelligence Network

                 ┌──────────────────────────────┐
                 │ Source Discovery Engine      │
                 │ (weekly)                     │
                 └──────────────┬───────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ Source Registry              │
                 │ (our database)               │
                 └──────────────┬───────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ Crawl Scheduler              │
                 └──────────────┬───────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ Raw Page Collector           │
                 └──────────────┬───────────────┘
                                │
                                ▼
                        Existing DE Pipeline
```

---

# System A — Source Discovery Engine

Purpose:

Find **new trusted opportunity sources**, NOT opportunities.

Runs:

- Weekly

Possible discovery queries:

- women in tech fellowships
- internships for students
- AI scholarships
- open source programs
- hackathons
- developer communities
- government internships
- STEM NGOs
- coding competitions
- women communities
- startup accelerators
- university career pages

Output:

A list of websites.

NOT opportunities.

Example:

```
Women Techmakers
MLH
GirlScript
Google Careers
Adobe Careers
Microsoft Careers
Hack2Skill
Devfolio
Devpost
GitHub Education
Outreachy
UNICEF
WHO
Startup India
AICTE
ISRO
DRDO
```

---

# Source Registry

This becomes Scout's knowledge base.

Each document represents ONE trusted source.

Example schema

```ts
Source

id

name

domain

category

subcategories

trustScore

sourceType

country

tags

rssFeed

crawlFrequency

lastDiscovered

lastCrawled

lastSuccessfulExtraction

totalPagesVisited

totalOpportunitiesFound

qualityScore

status
```

Example

```
Women Techmakers

trustScore = 96

category = Community

crawlFrequency = Daily

qualityScore = High
```

---

# Categories

Every source belongs to one or more categories.

Examples

- Internship
- Scholarship
- Fellowship
- Hackathon
- Competition
- Conference
- Community
- Bootcamp
- Ambassador Program
- Open Source
- Research
- Mentorship
- NGO
- Government
- Startup
- University

Future recommendation quality depends on this.

---

# Trust Score

Every source receives a trust score.

Factors:

- Official organization
- Domain reputation
- Historical extraction quality
- Duplicate rate
- Opportunity success rate
- AI confidence
- Manual verification (optional)

Example

```
Google Careers

99
```

```
Unknown Blog

32
```

Crawler prioritizes high-trust sources.

---

# Crawl Frequency

Not every website needs daily crawling.

Examples

High Frequency

- Careers
- Hackathons
- Event sites

Daily

---

Medium Frequency

- NGOs

Every 3 days

---

Low Frequency

- Government portals

Weekly

---

Very Low

Annual programs

Monthly

---

Scheduler decides automatically.

---

# Source Types

Scout should know what kind of source it is.

Examples

Career Portal

Community

University

NGO

Government

Startup

Hackathon Platform

Scholarship Portal

Conference

Open Source Program

Company

This helps future ranking.

---

# Stage 1 Responsibilities

Stage 1 is now responsible for

✅ Discovering sources

✅ Storing sources

✅ Trust scoring

✅ Categorization

✅ Crawl scheduling

✅ Source health

NOT

❌ Opportunity extraction

That remains in later stages.

---

# Tavily's New Role

Current

```
Tavily

↓

Find opportunities
```

New

```
Tavily

↓

Find NEW sources
```

Huge difference.

Scout slowly becomes independent.

---

# Future Discovery Loop

Weekly

```
Tavily

↓

Find new websites

↓

AI validates

↓

Store in Source Registry

↓

Crawler begins monitoring them forever
```

Knowledge compounds over time.

---

# Daily Pipeline

Daily

```
Source Registry

↓

Scheduler

↓

Crawler

↓

Raw Pages

↓

Existing DE

↓

RE
```

No dependency on search every day.

---

# Auto Expansion

Suppose crawler discovers

```
iitb.ac.in
```

AI can automatically search

```
site:iitb.ac.in internships

site:iitb.ac.in scholarships

site:iitb.ac.in fellowships
```

Result:

Scout expands the source graph automatically.

---

# Long-Term Goal

```
500+

Trusted Sources

↓

Thousands of monitored pages

↓

Fresh opportunities every day
```

Eventually

```
5000+

Sources
```

without changing architecture.

---

# Why this is a Competitive Advantage

Anyone can:

- call Tavily
- call GPT
- scrape a few websites

Very few products invest in building a curated Opportunity Source Graph.

Over time Scout owns:

- trusted domains
- trust scores
- categories
- crawl history
- extraction quality
- freshness
- update frequency

This becomes proprietary infrastructure.

---

# Expected Impact

Current

```
~60 pages

↓

5 opportunities
```

Target

```
500+ trusted sources

↓

Thousands of monitored pages

↓

Hundreds of quality opportunities

↓

Personalized recommendations
```

---

# Success Criteria

- Stage 1 is no longer search-dependent.
- Scout owns a growing Source Registry.
- Tavily is only used for weekly discovery.
- Daily crawling uses Scout's own intelligence.
- Source quality improves over time.
- Architecture scales from hundreds to thousands of trusted sources without redesign.