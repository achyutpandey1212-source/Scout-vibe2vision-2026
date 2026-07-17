# DISCOVERY_INTELLIGENCE_V2.md

> **Version:** Scout MVP V2
>
> This document defines the evolution of Scout's Discovery Intelligence layer.
>
> Discovery Intelligence is responsible for deciding **what Scout searches**, **where it searches**, and **how it balances discovery across different opportunity ecosystems.**
>
> The objective is not simply to discover more opportunities, but to discover **better**, **more diverse**, and **harder-to-find** opportunities for Indian engineering college students.

---

# 1. Vision

Discovery should no longer behave like a traditional search engine.

Instead of asking:

> "What internships exist?"

Scout should ask:

> **"Which valuable opportunities are least likely to be discovered by talented students?"**

That philosophy drives every discovery decision.

---

# 2. Objectives

Discovery Intelligence V2 aims to:

- Increase opportunity diversity
- Improve startup discovery
- Reduce dependence on SEO-heavy companies
- Improve hidden gem discovery
- Discover opportunities earlier
- Reduce duplicate opportunity sources
- Balance discovery across multiple ecosystems

---

# 3. Discovery Philosophy

Traditional search:

```
Keyword

↓

Google Results

↓

Largest Companies

↓

Popular Opportunities
```

Scout Discovery:

```
Student Persona

↓

Opportunity Category

↓

Relevant Ecosystems

↓

Organizations

↓

Official Opportunity Pages
```

Discovery begins from ecosystems rather than companies.

---

# 4. Discovery Categories

Discovery should intentionally search each category independently.

Core categories include:

- Internships
- Startup Opportunities
- Government Internships
- Research Internships
- Scholarships
- Hackathons
- Student Competitions
- Campus Ambassador Programs
- Open Source Programs
- Summer Schools
- Bootcamps
- Fellowships
- Women in Tech

Each category owns its own search strategy.

---

# 5. Narrow Search Strategy

Broad searches should be avoided whenever possible.

Instead of:

```
Software Internship India
```

Scout should generate focused searches such as:

```
React internship Bangalore startup

Backend internship Gurgaon

AI internship Hyderabad

Embedded internship Pune

Cybersecurity internship Bengaluru

Computer vision internship Noida

Remote ML internship India

Startup hiring engineering interns

Developer internship IIT incubator

Seed funded startup internship

Series A software internship

Campus ambassador SaaS startup

Research internship IISc AI lab

Frontend internship YC startup
```

Narrow searches reduce noise and increase discovery quality.

---

# 6. Ecosystem-First Discovery

Scout should prioritize discovering ecosystems instead of individual companies.

Examples include:

---

## Startup Ecosystems

- Startup India
- Startup Portals
- Incubators
- Accelerators
- VC Portfolios

---

## University Ecosystems

- IIT Innovation Cells
- IIIT Innovation Centres
- University Incubators
- Entrepreneurship Cells
- Research Labs

---

## Government Ecosystems

- ISRO
- DRDO
- AICTE
- MeitY
- NIC
- CDAC
- DST
- CSIR

---

## Student Communities

- Devfolio
- MLH
- IEEE
- ACM
- GDSC
- GDG
- Linux Foundation

---

## Open Source Ecosystems

- Google Summer of Code
- Outreachy
- LFX Mentorship
- Season of KDE
- Apache Programs

These ecosystems naturally expose hundreds of opportunities.

---

# 7. Multi-Layer Discovery

Discovery should operate in layers.

```
Layer 1

Search Queries

↓

Layer 2

Opportunity Ecosystems

↓

Layer 3

Organizations

↓

Layer 4

Official Opportunity Pages

↓

Layer 5

Opportunity Extraction
```

This approach is significantly more scalable than crawling isolated websites.

---

# 8. Query Diversity

Every discovery run should intentionally mix search intent.

Example distribution:

| Discovery Focus | Target |
|-----------------|-------:|
| Startup Opportunities | 30% |
| Large Technology Companies | 20% |
| Government | 20% |
| Universities & Research | 15% |
| Communities & Open Source | 15% |

This prevents discovery from becoming biased toward well-known companies.

---

# 9. Geographic Intelligence

Discovery should intentionally search technology hubs.

Primary locations:

- Bengaluru
- Gurugram
- Hyderabad
- Pune
- Chennai
- Noida
- Delhi NCR
- Mumbai
- Ahmedabad

Secondary searches should include:

- Remote
- Hybrid
- India-wide

Location-aware searches produce significantly better startup discovery.

---

# 10. Search Intent Templates

Each category should maintain its own deterministic search templates.

Example:

---

## Internships

```
software engineering internship

frontend internship

backend internship

AI internship

ML internship

cloud internship

embedded internship

cybersecurity internship
```

---

## Startup Opportunities

```
startup hiring interns

seed startup internship

series A engineering internship

early stage startup careers

SaaS startup internship

AI startup internship

founding engineer intern
```

---

## Research

```
research internship

summer research fellowship

IISc internship

DRDO internship

CSIR internship
```

---

## Government

```
student government internship

AICTE internship

MeitY internship

ISRO internship

NIC internship

RBI internship
```

Every category evolves independently.

---

# 11. Discovery Diversity Metrics

Every discovery run should produce diversity statistics.

Example:

```
Organizations

Large Tech.............4

Startups...............8

Government.............3

Universities...........2

Research Labs..........2

Communities............3
```

Location distribution:

```
Bangalore..............5

Gurugram...............3

Hyderabad..............2

Remote.................4

Pune...................2

Delhi NCR..............2
```

Category distribution:

```
Internships............40%

Startup.................25%

Hackathons.............10%

Research...............10%

Government..............8%

Others..................7%
```

These metrics ensure discovery remains balanced.

---

# 12. Crawl Budget Allocation

Not every category deserves equal crawl budget.

Suggested allocation:

| Category | Crawl Budget |
|----------|-------------:|
| Internships | 25% |
| Startup Opportunities | 20% |
| Government Internships | 10% |
| Research | 10% |
| Hackathons | 10% |
| Scholarships | 8% |
| Campus Ambassador | 5% |
| Open Source | 5% |
| Women in Tech | 4% |
| Summer Schools | 2% |
| Bootcamps | 1% |

Budgets should remain configurable.

---

# 13. Continuous Learning

Discovery Intelligence should continuously improve using historical data.

Signals include:

- Opportunity acceptance rate
- Hidden Gem Score
- User engagement
- Bookmark rate
- Application rate
- Opportunity freshness
- Source success rate

These signals help Discovery prioritize better searches over time.

---

# 14. Future Evolution

Discovery Intelligence may later support:

- AI-generated search plans
- Seasonal search planning
- Academic calendar awareness
- Hiring season prediction
- Startup funding event detection
- University placement cycle awareness
- Event-driven discovery
- Adaptive crawl budgets

These are intentionally outside the MVP but influence the overall architecture.

---

# Guiding Principle

> **Discovery should not chase the loudest opportunities.**
>
> **It should intentionally search where talented students rarely look, uncovering internships, startup roles, research programs, government initiatives, and innovation opportunities before they become widely known.**
>
> **The strength of Scout is not how many opportunities it finds—it is how many meaningful opportunities it helps students discover that they would have otherwise missed.**