# SEARCH_INTELLIGENCE_ARCHITECTURE.md

> **Version:** Scout MVP V2
>
> **Phase:** Sprint 2 — Search Intelligence
>
> **Purpose:**
>
> Transform Scout from a generic web crawler into a deterministic discovery engine that actively hunts engineering internships and career-building opportunities exactly where engineering students actually discover them.

---

# 1. Philosophy

Discovery quality does **not** start with AI.

It starts with **where Scout searches.**

The extraction engine can only extract opportunities that are actually discovered.

Therefore Search Intelligence is responsible for maximizing:

- Recall
- Relevance
- Diversity
- Freshness

while minimizing:

- Generic pages
- Blogs
- Landing pages
- Duplicate discoveries
- Irrelevant opportunities

---

# 2. Mission

Scout is **NOT** a generic opportunity search engine.

Scout's mission is:

> Find every meaningful technical career-building opportunity for undergraduate engineering students.

During MVP the search engine optimizes for only five Discovery Missions.

---

# 3. Discovery Missions

Each daily discovery run executes **exactly one mission.**

Every mission owns its own:

- Search strategy
- Query planner
- Crawl budget
- Source priorities
- Detector thresholds
- Quality expectations

---

## Mission 1 — Engineering Internships

Highest priority.

Goal:

Find software engineering internships from companies, universities and official career portals.

Examples

- SWE Internship
- Backend Internship
- Frontend Internship
- Mobile Internship
- DevOps Internship
- Cloud Internship
- AI Internship
- ML Internship
- Cybersecurity Internship
- Embedded Internship

---

## Mission 2 — Startup Internships

Goal:

Discover internships from startups before they appear on LinkedIn.

Focus

- YC
- Techstars
- T-Hub
- Antler
- Peak XV
- Blume
- Accel
- Sequoia
- NSRCEL
- Startup India
- Bangalore startups
- Hyderabad startups
- Pune startups
- NCR startups

---

## Mission 3 — Government Tech Internships

Goal

Find internships from

- ISRO
- DRDO
- CDAC
- NIC
- IIT research labs
- Government innovation labs
- Smart India programs

---

## Mission 4 — Research Internships

Goal

Find

- Research labs
- University internships
- AI research
- Robotics
- Computer Vision
- Systems
- HCI
- Security
- Open research programs

---

## Mission 5 — Hackathons

Goal

Aggressively discover

- Large prize pools
- Hidden gems
- Company hackathons
- Student hackathons
- AI competitions
- ML competitions
- Cyber competitions

---

# 4. Search Intelligence Pipeline

Discovery Mission

↓

Mission Configuration

↓

Query Planner

↓

Search Orchestrator

↓

Company Discovery

↓

Career Discovery

↓

Opportunity Discovery

↓

Crawler

↓

Opportunity Detector

↓

Extraction

↓

Mission Guard

↓

Quality

↓

Database

---

# 5. Query Planner

The Query Planner is responsible for generating diverse search intents.

It does NOT generate random keywords.

It generates targeted discovery strategies.

Example

Instead of

```
software internship
```

Generate

```
backend internship startup

remote software internship

engineering intern hiring

AI internship India

React internship

Node internship

Summer software internship

Computer Science internship

student developer internship

cloud engineering internship
```

Each mission owns its own query templates.

---

# 6. Ecosystem-aware Search

Scout searches ecosystems before companies.

Example

Y Combinator

↓

Portfolio

↓

Company

↓

Career Page

↓

Internship

Instead of

```
software internship
```

Scout asks

```
Who is hiring?
```

---

# 7. Startup Ecosystem Registry

The registry includes

International

- Y Combinator
- Techstars
- Antler
- Entrepreneur First

India

- T-Hub
- Startup India
- Peak XV
- Accel
- Blume
- 100X.VC
- CIIE
- NSRCEL
- Kerala Startup Mission
- StartupTN
- iCreate

Every ecosystem stores

- Homepage
- Portfolio pages
- Startup listings
- RSS feeds
- News pages

---

# 8. Geographic Intelligence

Scout prioritizes startup ecosystems in

- Bengaluru
- Hyderabad
- Pune
- Gurgaon
- Noida
- Chennai
- Mumbai
- Ahmedabad
- Kochi

These cities receive additional crawl budget.

---

# 9. Company Discovery

Scout prefers discovering companies before opportunities.

Search

↓

Company

↓

Career page

↓

Opportunity

Advantages

- Higher recall
- Fresh postings
- Better organization metadata
- Better trust

---

# 10. ATS Discovery

Scout directly searches Applicant Tracking Systems.

Supported

- Greenhouse
- Lever
- Ashby
- SmartRecruiters
- Workable
- BambooHR
- Rippling
- Comeet

Example

site:boards.greenhouse.io internship

site:jobs.lever.co intern

site:jobs.ashbyhq.com software engineer intern

---

# 11. Multi-hop Discovery

Instead of

Google Search

↓

Opportunity

Scout performs

Google Search

↓

Organization

↓

Official Careers

↓

ATS

↓

Internship

↓

Application

This greatly improves discovery quality.

---

# 12. Search Budget Allocation

Daily crawl budget

Engineering Internships

40%

Startup Internships

25%

Government Tech

15%

Research

10%

Hackathons

10%

Unused budget rolls over within the same mission.

---

# 13. Crawl Priorities

Priority 1

Official career pages

Priority 2

ATS systems

Priority 3

University portals

Priority 4

Incubator portfolio companies

Priority 5

Official announcements

Priority 6

Community listings

Priority 7

Search engine results

---

# 14. Mission Guard

Mission Guard executes immediately after extraction.

Purpose

Determine

Does this belong in Scout?

NOT

Is it high quality?

NOT

Is it trustworthy?

Only

Is this relevant?

Reject

- HR internships
- MBA programs
- Marketing internships
- Sales internships
- Finance internships
- Leadership fellowships
- Rural development schemes

Accept

- SWE internships
- Backend internships
- AI internships
- Research internships
- Open Source programs
- Technical fellowships
- Government tech internships
- Engineering hackathons

---

# 15. Metrics

Each mission reports

Companies Found

Career Pages Found

ATS Pages Found

Opportunity Pages Found

Detector Pass Rate

Extraction Success

Mission Guard Acceptance

Quality Acceptance

Final Opportunities

Engineering Domains

Organization Diversity

City Diversity

Trust Distribution

Hidden Gem Distribution

---

# 16. Success Criteria

Engineering Internship Mission

Target

Companies Found

100+

Career Pages

80+

Valid Opportunities

30+

Quality Score

90+

Unknown Organizations

<5%

Duplicate Rate

<10%

Mission Purity

95%+

---

# 17. Out of Scope

Scout deliberately ignores

- MBA programs
- HR internships
- Finance internships
- Sales internships
- General scholarships unrelated to engineering
- Executive fellowships
- Rural schemes unrelated to engineering

These may be supported in future versions.

---

# 18. Future Expansion

Once the five Discovery Missions are stable, Scout can expand into

- Women in Tech
- Scholarships
- Open Source Programs
- Campus Ambassador Programs
- Summer Schools
- Student Developer Programs
- Fellowships
- International Opportunities

without changing the underlying architecture.

---

# 19. Guiding Principle

Search smarter.

Not harder.

Every additional search should increase the probability of discovering a meaningful opportunity for an engineering student.