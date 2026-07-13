# Scout Discovery Engine V2
# Stage 2 — Intelligent Crawling & Content Acquisition

---

# Objective

Stage 2 is responsible for transforming validated candidate URLs into high-quality crawl results.

It receives clean candidate URLs from Stage 1 and decides how each page should be fetched while respecting free-tier API limits.

Stage 2 is the ONLY stage allowed to interact with Firecrawl.

It does NOT:

- call Gemini
- extract opportunities
- score opportunities
- save anything to MongoDB
- deduplicate opportunities
- recommend opportunities

Its only responsibility is acquiring the richest possible page content.

---

# Philosophy

Not every discovered URL deserves an expensive crawl.

Scout should behave like an intelligent crawler rather than a brute-force scraper.

Every crawl must be deliberate.

The objective is to maximize information quality while minimizing API usage.

---

# Input

Stage 1 returns:

CandidateURL[]

Each CandidateURL contains:

- url
- title
- snippet
- source
- discoveredFrom
- searchScore
- queryUsed
- registrySource

---

# Output

Stage 2 returns

CrawledPage[]

Each CrawledPage contains

- url
- title
- markdown
- html (optional)
- metadata
- fetchMethod
- crawlStatus
- crawlTime
- tokenEstimate
- source
- crawlReason

No opportunity extraction happens here.

---

# Component 1
# Crawl Planner

Before crawling anything,
Scout first evaluates every candidate.

The planner determines

- should this page be crawled?
- should snippet be sufficient?
- should Firecrawl be used?
- should the page be skipped?

This decision should depend on:

- snippet quality
- search confidence
- URL pattern
- trusted domain
- opportunity likelihood

Every decision must include a reason.

Example

Decision:
USE_FIRECRAWL

Reason:
Trusted government source with incomplete snippet.

---

# Component 2
# Crawl Strategy Selection

Stage 2 supports multiple acquisition strategies.

Priority

1.
Firecrawl

↓

2.
Cached Crawl

↓

3.
Snippet Fallback

↓

4.
Failure

Never call Firecrawl if cached content is still fresh.

---

# Component 3
# Firecrawl Integration

Fix every weakness discovered during the audit.

Requirements

✓ Remove the aggressive snippet bypass.

✓ Firecrawl should genuinely execute.

✓ Handle

401

403

404

408

429

500

gracefully.

✓ Retry only retryable failures.

✓ Respect API rate limits.

✓ Store response metadata.

Do NOT silently fall back without logging why.

---

# Component 4
# Crawl Cache

If a page has already been crawled recently

↓

Reuse it.

Do not waste Firecrawl credits.

Cache key

Normalized URL

Cache stores

- markdown
- metadata
- timestamp
- fetch method

---

# Component 5
# Crawl Validation

Before forwarding pages to Stage 3

verify

✓ markdown exists

✓ content length acceptable

✓ page not blocked

✓ not login page

✓ not error page

✓ not captcha

✓ not cookie wall

✓ not navigation page

Reject invalid crawls.

---

# Component 6
# Crawl Analytics

Every run should produce statistics.

Example

Discovery Run

Candidates Received

182

Firecrawl Calls

54

Cache Hits

31

Snippet Fallback

82

Failed

15

Average Crawl Time

2.4 sec

Tokens Saved

Estimated Firecrawl Credits Saved

Reasons for Failure

401

429

Timeout

Blocked

This data powers Stage 5 Development Dashboard.

---

# Error Handling

Firecrawl failure must never crash the pipeline.

Instead return

crawlStatus

FAILED

with

reason

Example

INVALID_API_KEY

RATE_LIMIT

TIMEOUT

NETWORK

BLOCKED

CONTENT_TOO_SMALL

---

# Logging

Every crawl should be observable.

Example

[Stage2]

URL

Status

Method

Duration

Reason

This is mandatory.

---

# Backwards Compatibility

Do not modify

Stage 1

Do not implement

Stage 3

Do not modify

Recommendation Engine

Do not modify

MongoDB models

Stage 2 only prepares content for Stage 3.

---

# Success Criteria

✓ Firecrawl genuinely executes

✓ Snippet bypass removed

✓ Cache prevents duplicate crawls

✓ Failed pages don't stop the pipeline

✓ Rich markdown produced

✓ Crawl analytics generated

✓ Clean interface implementing

IPipelineStage<
CandidateURL[],
CrawledPage[]
>

---

# Out of Scope

Stage 2 does NOT

- use Gemini
- parse opportunities
- generate JSON
- calculate quality score
- merge duplicates
- archive records
- recommend opportunities

Those belong to later stages.

---

# Completion Checklist

Stage 2 is complete only if

□ Firecrawl executes correctly

□ Cache works

□ Retry logic works

□ Rate limits respected

□ Crawl planner implemented

□ Analytics generated

□ Logs generated

□ Pipeline remains backwards compatible

□ Existing APIs continue working

□ Stage 3 can directly consume CrawledPage[]