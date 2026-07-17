# SOURCE_INTELLIGENCE_V2.md

> **Version:** Scout MVP V2
>
> This document defines the evolution of Scout's Source Intelligence layer. Rather than maximizing the number of sources, Scout should maximize the quality, diversity, and discovery value of its source ecosystem.
>
> The Source Registry is one of Scout's most valuable long-term assets. Every improvement made here improves every future discovery run.

---

# 1. Vision

Scout should not crawl the internet randomly.

It should know **where meaningful opportunities are most likely to appear.**

The goal is not to maintain the largest source registry.

The goal is to maintain **the smartest source registry.**

---

# 2. Philosophy

Traditional job platforms rely on highly visible organizations.

Scout should intentionally prioritize sources that surface opportunities students are least likely to discover on their own.

Instead of asking:

> "Is this a trustworthy website?"

Scout should ask:

> "Does this website consistently help students discover valuable opportunities?"

This subtle distinction changes how sources are evaluated.

---

# 3. Objectives

Source Intelligence V2 has five primary objectives.

- Improve discovery quality
- Improve discovery diversity
- Reduce crawl budget waste
- Discover hidden opportunities
- Continuously improve the registry over time

---

# 4. Registry Philosophy

The Source Registry represents **institutional knowledge**.

Unlike Opportunities, which are generated data, the registry becomes more valuable every week.

It stores:

- Trusted organizations
- Discovery metadata
- Crawl strategies
- Historical performance
- Crawl frequency
- Discovery statistics
- Source quality

The registry should almost never be rebuilt.

Instead, it should continuously evolve.

---

# 5. Source Audit

Every source should periodically answer one simple question:

> Does this source consistently publish opportunities relevant to Indian engineering students?

If the answer is **No**, the source should not be deleted.

Instead:

```text
isActive = false
```

This preserves historical knowledge while removing unnecessary crawl budget consumption.

---

# 6. Source Quality Principles

A good source should satisfy several characteristics.

## Student Relevance

Does it regularly publish opportunities suitable for:

- 1st year students
- 2nd year students
- 3rd year students
- Final year students
- Fresh graduates

---

## Technical Relevance

Priority should be given to opportunities involving:

- Software Engineering
- AI / ML
- Data Science
- Cybersecurity
- Cloud
- DevOps
- Mobile Development
- Embedded Systems
- Open Source

---

## Opportunity Frequency

Sources that publish opportunities weekly deserve higher priority than sources updated once every few months.

---

## Opportunity Quality

Preference should be given to sources publishing:

- internships
- hackathons
- scholarships
- research programs
- campus ambassador programs
- fellowships
- student competitions

rather than generic hiring pages.

---

# 7. Source Tier System

Not every source contributes equally.

Source Intelligence introduces three discovery tiers.

---

## Tier A — Opportunity Ecosystems

These are Scout's highest-value sources.

Rather than representing a single organization, they expose entire ecosystems of opportunities.

Examples:

- Startup India
- Devfolio
- Unstop
- Wellfound
- IIT Incubators
- IIIT Incubators
- T-Hub
- NSRCEL
- Y Combinator Portfolio
- Peak XV Portfolio
- Accel Portfolio
- Blume Ventures
- Antler India
- Research Labs
- University Innovation Centers

These should receive the highest crawl priority.

---

## Tier B — Official Organizations

These represent trusted organizations directly publishing opportunities.

Examples:

- Google
- Microsoft
- Adobe
- NVIDIA
- ISRO
- DRDO
- AICTE
- MeitY
- RBI
- SEBI
- CDAC
- IISc

These remain extremely important but should not dominate every discovery run.

---

## Tier C — Aggregators

Aggregators help Scout discover new organizations.

However, they should rarely be the final source of an opportunity.

Examples:

- Internshala
- LinkedIn Jobs
- Indeed
- Naukri

Their primary role is:

```
Discover

↓

Extract organization

↓

Find official careers page

↓

Prefer official source
```

---

# 8. Discovery Value Score

Today Scout primarily ranks sources using Trust Score.

Source Intelligence V2 expands this.

Each source receives four independent scores.

---

## Trust Score

Measures reliability.

Signals include:

- official organization
- verified domain
- HTTPS
- historical accuracy

---

## Discovery Value

Measures how likely the source is to publish opportunities students cannot easily discover elsewhere.

Examples:

High

- Startup incubator
- Research lab
- Accelerator

Low

- Generic job portal

---

## Freshness Score

Measures update frequency.

Factors:

- last opportunity published
- average posting interval
- recent crawl activity

---

## Student Relevance Score

Measures alignment with Scout's MVP.

Positive signals include:

- internships
- hackathons
- scholarships
- research
- ambassador programs

Negative signals include:

- senior hiring
- experienced positions
- non-engineering jobs

---

## Composite Priority

Overall crawl priority becomes:

```
Priority =
Trust Score
+
Discovery Value
+
Freshness
+
Student Relevance
```

This determines crawl ordering.

---

# 9. Source Diversity

A healthy registry should not be dominated by large technology companies.

Target diversity should resemble:

| Category | Target Share |
|-----------|-------------:|
| Startup Ecosystems | 30% |
| Official Companies | 25% |
| Government Organizations | 15% |
| Universities & Research | 15% |
| Student Communities | 10% |
| Aggregators | 5% |

This ensures balanced discovery.

---

# 10. Source Metadata Evolution

Every registry entry should gradually accumulate intelligence.

Recommended metadata:

```text
Organization

Domain

Tier

Trust Score

Discovery Value

Freshness

Student Relevance

Opportunity Categories

Primary Audience

Average Opportunities Per Month

Last Opportunity Date

Historical Success Rate

Average Quality Score

Average Hidden Gem Score

isActive
```

This enables smarter scheduling and prioritization.

---

# 11. Registry Growth Strategy

New sources should originate from:

- Startup portfolios
- Accelerator portfolios
- University ecosystems
- Government organizations
- Research institutes
- Student communities
- Open-source foundations
- Existing trusted sources through outbound links

Growth should prioritize relevance over volume.

---

# 12. Success Metrics

Source Intelligence should be evaluated using measurable outcomes.

Examples:

- Active source count
- Tier A source percentage
- Average discovery value
- Average student relevance
- Opportunities discovered per source
- Opportunity acceptance rate
- Hidden gem opportunities discovered
- New organizations discovered each week

Success is not measured by registry size.

Success is measured by the quality of opportunities the registry enables.

---

# 13. Future Evolution

Source Intelligence will eventually support:

- Automatic source quality decay
- Discovery Value recalibration
- Organization relationship graphs
- Ecosystem-aware crawling
- Portfolio expansion
- Source recommendation AI
- Autonomous registry maintenance

These capabilities are intentionally out of scope for the MVP but influence the architecture today.

---

# Guiding Principle

> **The Source Registry should become Scout's competitive advantage.**
>
> It should not simply know which organizations exist.
>
> It should know **which organizations consistently surface the most valuable opportunities for Indian engineering students—and prioritize them accordingly.**