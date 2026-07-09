# OPPORTUNITY_INGESTION_LAYER.md

# Scout Opportunity Ingestion Layer
### One Pipeline. Unlimited Sources.

> "Scout shouldn't care where an opportunity comes from.
>
> Every opportunity should enter the system through the same gateway."

---

# Why This Layer Exists

Without an ingestion layer, the Discovery Engine must understand every source individually.

Example

Discovery Engine

↓

Brave Search

↓

Firecrawl

↓

RSS

↓

LinkedIn

↓

Devpost

↓

AICTE

↓

Devfolio

↓

Wellfound

Every new source increases complexity.

Instead,

all sources should first become

**Opportunity Candidates**

Only then should they enter the Discovery Engine.

---

# Core Philosophy

Separate

Data Collection

from

Data Understanding.

Scout should first collect.

Scout should later understand.

---

# High Level Architecture

```
                   Internet

                        │

        ┌───────────────┼────────────────┐
        │               │                │
        │               │                │
        ▼               ▼                ▼

   Search APIs     Official APIs      RSS Feeds

        │               │                │

        └───────────────┬────────────────┘

                        │

                        ▼

            Opportunity Ingestion Layer

                        │

              Source Normalization

                        │

              Opportunity Candidate

                        │

                        ▼

              Discovery Intelligence

                        │

                        ▼

          Opportunity Intelligence DB
```

---

# Responsibilities

The Ingestion Layer is responsible for

- Discovering sources
- Collecting raw opportunity data
- Standardizing source formats
- Removing obvious duplicates
- Assigning metadata
- Passing normalized candidates to the Discovery Engine

It should NEVER

- Personalize
- Rank
- Recommend
- Score
- Reason deeply

Those belong to later stages.

---

# Opportunity Candidate

Every source must be converted into one standard object.

Example

```
{
    source,

    sourceType,

    discoveredAt,

    url,

    title,

    rawContent,

    metadata,

    crawlMethod
}
```

The Discovery Engine only consumes this object.

It never consumes raw webpages directly.

---

# Source Connectors

Every data source should implement the same interface.

```
discover()

collect()

normalize()

validate()
```

This allows any future source to plug into Scout.

---

# Source Categories

## Search APIs

Purpose

Find opportunity webpages.

Preferred

- Brave Search
- Tavily

Output

URLs

---

## Official APIs

Whenever available.

Examples

Career APIs

Scholarship APIs

Event APIs

Advantages

- Structured
- Reliable
- No scraping

Highest priority.

---

## Crawlers

Purpose

Read webpage content.

Preferred

Firecrawl

Fallback

Playwright

Output

Markdown

Metadata

---

## RSS Connectors

Many organizations publish opportunities through RSS.

RSS should always be preferred over crawling.

Advantages

- Lightweight
- Fast
- Reliable

---

## Event Platforms

Examples

Devpost

Devfolio

Unstop

MLH

GDG

IEEE

Future

Dedicated connectors.

---

## Career Platforms

Examples

Wellfound

Internshala

Company Career Pages

Government Portals

---

## Scholarship Sources

Examples

Google

Microsoft

Adobe

NSP

AICTE

Foundations

---

## Future Connectors

Email newsletters

CSV uploads

Google Sheets

Partner organizations

NGOs

Universities

Webhook integrations

Community submissions

---

# Connector Architecture

Every connector should expose

```
initialize()

discover()

collect()

normalize()

healthCheck()
```

This keeps every integration interchangeable.

---

# Source Registry

Scout maintains a registry of connectors.

Example

```
Brave Search

Enabled

✓
```

```
Firecrawl

Enabled

✓
```

```
RSS

Enabled

✓
```

```
LinkedIn

Disabled

```

The Discovery Engine simply loops over enabled connectors.

---

# Source Priority

Scout should always choose

Official API

↓

RSS

↓

Search API

↓

Crawler

↓

Browser Automation

Browser automation should always be the last option.

It is the slowest.

---

# Opportunity Candidate Lifecycle

Source

↓

Collect

↓

Normalize

↓

Validate

↓

Redis Queue

↓

Discovery Engine

↓

AI Structuring

↓

Database

---

# Queue Strategy

Every collected opportunity becomes a queue job.

Redis Queue

```
Candidate

↓

Pending

↓

Processing

↓

Completed

↓

Archived
```

This allows thousands of opportunities to be processed independently.

---

# Validation

Basic validation before entering Discovery.

Required

- URL
- Source
- Timestamp

Optional

Title

Description

Metadata

Anything invalid gets discarded early.

---

# Metadata

Every candidate should contain

Source Name

Source Type

Collection Method

Discovery Time

Connector Version

Retry Count

Processing Status

Language

Country (if known)

This helps debugging and analytics.

---

# Failure Isolation

If one connector fails

Example

Firecrawl

↓

Only Firecrawl fails.

The rest of Scout continues operating.

Every connector should fail independently.

---

# Monitoring

Track

URLs discovered

Candidates generated

Success rate

Failure rate

Average processing time

Top-performing connectors

Inactive connectors

Duplicate percentage

---

# Future Intelligence

The Ingestion Layer should eventually become self-improving.

Examples

Scout notices

Google Careers

produces high-quality opportunities.

↓

Increase crawl frequency.

---

RSS Feed inactive.

↓

Reduce priority.

---

Connector frequently fails.

↓

Alert developers.

---

# Long-Term Vision

Eventually Scout should support dozens of connectors without changing the Discovery Engine.

Adding a new opportunity source should feel like installing a plugin.

No changes to the AI pipeline.

No changes to personalization.

Only register a new connector.

---

# Engineering Principles

1.

Every source becomes the same object.

---

2.

Discovery Intelligence never depends on the source.

---

3.

Every connector should be replaceable.

---

4.

Prefer structured APIs over scraping.

---

5.

Prefer RSS over crawling.

---

6.

Prefer crawling over browser automation.

---

7.

Connectors should be stateless.

---

# North Star

The Ingestion Layer exists to answer one question:

"How can Scout continuously collect opportunities from anywhere on the internet without the rest of the system needing to know where they came from?"