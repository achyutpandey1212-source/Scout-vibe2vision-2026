# DISCOVERY_ENGINE.md

# Scout Discovery Engine

### The Heart of Scout

> "The quality of Scout is directly proportional to the quality of opportunities it discovers."

---

# Overview

The Discovery Engine is Scout's continuously running intelligence pipeline responsible for discovering, collecting, understanding, verifying and storing opportunities from across the internet.

Unlike traditional job portals that depend on manual listings, Scout actively searches the internet for relevant + newly published opportunities.

The Discovery Engine runs independently of users.

Users never wait for Scout to search.

Scout is always searching.

---

# Core Mission

Transform the chaotic internet into a structured Opportunity Intelligence Database.

Input

↓

Millions of webpages

↓

Output

↓

Verified Opportunity Objects

---

# Engineering Philosophy

The Discovery Engine should NOT try to build technologies that already exist.

Instead

Scout integrates best-in-class tools for

- Search
- Crawling
- Parsing
- Browser Automation

while building its own intelligence layer on top.

Custom code should only exist where Scout creates unique value.

---

# Discovery Pipeline

Internet

↓

Search Sources

↓

URL Collection

↓

Content Extraction

↓

Opportunity Parsing

↓

AI Structuring

↓

Validation

↓

Duplicate Detection

↓

Scoring

↓

Classification

↓

Embedding

↓

MongoDB

---

# Pipeline Overview

The Discovery Engine consists of ten independent stages.

Each stage performs exactly one responsibility.

This makes the system modular, testable and replaceable.

---

# Stage 1

## Source Discovery

Goal

Find webpages that potentially contain opportunities.

Scout should never depend on a single platform.

Instead, it continuously collects opportunities from multiple ecosystems.

---

## Discovery Sources

### Category A

Search APIs

Preferred

- Brave Search API / MCP

Alternatives

- Tavily
- Serper

Purpose

Search using intelligent queries like

Women Internship AI India

Scholarship for Women Computer Science

Remote Frontend Internship

Google Careers Women

Site-specific searches

Latest Fellowships

Categories Scout should cover
🎓 Education
Scholarships
Fellowships
Grants
Exchange Programs
Research Programs
Olympiads
Certifications
💼 Employment
Full-time Jobs
Part-time Jobs
Internships
Apprenticeships
Traineeships
Returnships
Government Jobs
💻 Freelancing
Remote Work
Freelance Platforms
Gig Work
Project-based Opportunities
🎨 Creative
Design
Illustration
Photography
Video Editing
Writing
Music
Dance
Theatre
🛠 Skilled Trades
Tailoring
Beauty
Makeup
Mehendi
Craft
Food Business
Baking
Fashion
Boutique
Handicrafts
🏭 Vocational
Electrician
Technician
Machine Operator
Healthcare Assistant
Nursing
Hospitality
Retail
🌱 Entrepreneurship
Startup Grants
Incubators
Government Schemes
MSME Programs
Business Competitions
🏛 Government
State Schemes
Central Schemes
Skill India
NSDC
PMKVY
Women Development Programs
🌍 International
Erasmus
DAAD
Chevening
Fulbright
UN Women
UNICEF
WHO
UNESCO

---

### Category B

## Official Sources

Scout prioritizes official sources over third-party aggregators whenever possible.

### Corporate Career Portals

- Company Career Pages
- Startup Career Pages
- MSME Hiring Portals
- Remote-first Companies

Examples

- Google Careers
- Microsoft Careers
- Adobe Careers
- Tata Careers
- Reliance Careers
- Infosys Careers
- TCS Careers
- Accenture Careers
- Local Businesses
- Startups

---

### Government Opportunities

National

- Skill India
- NSDC
- NCS (National Career Service)
- PMKVY
- Ministry of Skill Development
- Women & Child Development Schemes

State Government Portals

Employment Exchanges

District Employment Portals

Government Recruitment Boards

Public Sector Undertakings

---

### Educational Institutions

Universities

Colleges

Open Universities

ITI Institutes

Polytechnics

Community Colleges

Official Scholarship Portals

Exchange Programs

Research Programs

---

### NGOs & Foundations

Women Empowerment NGOs

Social Impact Organizations

International Foundations

Non-Profit Organizations

Skill Development Organizations

Community Development Programs

---

### International Organizations

UN Women

UNICEF

UNESCO

WHO

World Bank

ADB

International Scholarship Providers

Global Fellowship Programs

---

### Category C

## Opportunity Platforms

Scout aggregates opportunities from trusted platforms without becoming another job board.

Employment

- LinkedIn Jobs
- Indeed
- Wellfound
- Foundit
- Naukri

Students

- Unstop
- Internshala
- Devfolio
- Devpost

Freelancing

- Fiverr
- Upwork
- Freelancer
- Contra
- Toptal (where applicable)

Creative

- Behance Jobs
- Dribbble Jobs

Remote Work

- RemoteOK
- We Work Remotely
- FlexJobs (public opportunities only)

Volunteering & Social Impact

- UN Volunteers
- VolunteerMatch
- Idealist

---

### Category D

## Communities & Opportunity Networks

Professional Communities

- IEEE
- ACM
- GDG
- Women Techmakers

Open Source

- GitHub
- GitLab
- GSoC
- Outreachy

Creative Communities

- Behance
- Dribbble
- ArtStation

Research Communities

- Kaggle
- Hugging Face
- Open Science Communities

Entrepreneurship

- Startup India
- Incubators
- Accelerators
- Startup Communities

Local Communities

- College Communities
- District Skill Centers
- Community Organizations
- Women's Self Help Groups (SHGs)

---

### Category E

## Structured Feeds

Preferred whenever available.

Priority Order

1. RSS Feeds
2. Official APIs
3. Structured XML / JSON feeds
4. Public datasets
5. Website crawling (Firecrawl)
6. Search engine discovery

Scout should always prefer structured and official data over scraping whenever possible.

Scraping is the fallback, not the default.

---

Category F — Hidden Opportunities ⭐

These are opportunities that never trend because they're buried on obscure websites.

Examples:

Small NGOs hiring locally.
District-level government notices.
Local newspapers.
University department notice boards.
Incubator announcement pages.
Startup blogs.
Company "Careers" pages that aren't indexed well.
Women entrepreneur networks.
Telegram/Discord/Slack communities (where publicly accessible).
Local chambers of commerce.
Skill center announcements.
Apprenticeship notices.
Community WhatsApp invite pages (if publicly indexed).

---

Priority

API

↓

RSS

↓

Search

↓

Scraping

---

# Stage 2

## URL Collection

Goal

Collect candidate URLs.

Store

Source

Category

Discovered Time

Priority

Hash

Crawler Status

Retry Count

---

Redis Queue

Every URL enters a Redis Queue.

Workers consume URLs independently.

Benefits

- Parallel processing
- Retry support
- Scalable
- Faster

---

# Stage 3

## Content Extraction

Goal

Convert webpage into clean content.

Preferred

Firecrawl

Alternative

Trafilatura

Fallback

Playwright

Reason

Firecrawl removes navigation, ads, scripts and boilerplate automatically.

Output

Markdown

Clean HTML

Metadata

Title

Description

---

# Stage 4

## Opportunity Detection

Not every webpage contains an opportunity.

Gemini decides

Opportunity?

YES

↓

Continue

NO

↓

Discard

---

Output

Boolean

Confidence Score

Reason

---

# Stage 5

## Structured Extraction

If Opportunity == TRUE

Gemini converts webpage into structured JSON.

Fields

Title

Organization

Deadline

Description

Eligibility

Required Skills

Location

Remote

Women Only

Salary

Stipend

Application Link

Tags

Category

Duration

Benefits

---

Output

Strict JSON.

No free text.

---

# Stage 6

## Validation

Validate extracted data.

Checks

Required fields

Deadline exists

Apply link exists

Valid URL

Description length

Spam detection

Malformed JSON

If validation fails

Retry

Else

Discard

---

# Stage 7

## Duplicate Detection

Many sources publish identical opportunities.

Duplicate Detection should use

Primary

Application URL

Secondary

Title Similarity

Organization

Deadline

Embedding Similarity (future)

Never store duplicates.

---

# Stage 8

## Opportunity Intelligence

This is Scout's proprietary layer.

Scout calculates

Trust Score

Freshness Score

Relevance Score

Hidden Gem Score

Source Quality

Future Competition Estimate

---

## Hidden Gem Score

Goal

Surface opportunities users are unlikely to discover elsewhere.

Potential Signals

Less indexed

Smaller organization

Recently published

Rare source

Few reposts

Regional program

Not trending

Future

Estimated applicant count

---

## Trust Score

Signals

Official website

HTTPS

Known organization

Verified source

Duplicate across trusted sources

Fresh content

---

## Freshness Score

Based on

Publish Date

Discovery Date

Deadline

Recently updated

---

# Stage 9

## Classification

Assign categories.

Examples

Scholarship

Internship

Remote Job

Hackathon

Competition

Research

Grant

Returnship

Women Only

AI

Web

Cloud

Cybersecurity

Healthcare

Startup

---

Gemini generates

Category

Subcategory

Tags

Skills

Career Domains

---

# Stage 10

## Storage

Store Opportunity Object.

MongoDB Collections

Opportunities

Opportunity Logs

Discovery Logs

Failed Crawls

Source Metadata

---

# Scheduling

Preferred

GitHub Actions

or

Inngest

Runs

Every 6 Hours

Pipeline

Search

↓

Queue

↓

Workers

↓

Store

↓

Cleanup

↓

Done

---

# Expiration Policy

Every execution

Remove expired opportunities.

Archive old opportunities.

Keep historical data.

---

# Logging

Every stage logs

Execution Time

Source

Status

Error

Retry Count

LLM Tokens

Worker

This helps debugging.

---

# Failure Recovery

If

Search fails

Retry

If

Extraction fails

Retry

If

Gemini fails

Retry

If

Still fails

Move to Dead Letter Queue

Never crash the entire pipeline.

---

# Metrics

Monitor

URLs Found

URLs Processed

Success Rate

Duplicate %

Average Processing Time

LLM Cost

New Opportunities

Expired Opportunities

Top Sources

Failure Rate

---

# Long-Term Roadmap

Future Improvements

- Semantic duplicate detection
- Company reputation scoring
- Opportunity popularity prediction
- Applicant estimation
- Social signal analysis
- User feedback loop
- Auto source discovery
- AI-generated opportunity summaries

---

# Design Principles

1.

Scout searches continuously.

Users never wait.

---

2.

Never scrape if an API exists.

---

3.

Never parse HTML manually if a mature parser exists.

---

4.

Every stage should perform exactly one responsibility.

---

5.

Failures should isolate themselves.

Never stop the pipeline.

---

6.

Every discovered opportunity should become richer over time.

Not just stored.

Continuously improved.

---

# North Star

The Discovery Engine exists to answer one question:

"If a life-changing opportunity exists anywhere on the internet today, how can Scout ensure the right person discovers it before it's too late?"
