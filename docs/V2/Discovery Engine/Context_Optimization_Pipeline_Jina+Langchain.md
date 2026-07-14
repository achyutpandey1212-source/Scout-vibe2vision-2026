# Stage 4.2 — Context Optimization Pipeline
## Jina Reader + LangChain Preprocessing Architecture

**Status:** Planned  
**Phase:** Discovery Engine  
**Objective:** Reduce LLM token consumption while improving extraction accuracy by introducing a dedicated Context Optimization Layer between content acquisition and AI extraction.

---

# Overview

Stage 4.1 focused on making extraction reliable.

Stage 4.2 focuses on making extraction **efficient**.

Today, Gemini receives nearly the entire crawled page. Although Firecrawl already returns clean markdown compared to raw HTML, the content still contains significant amounts of irrelevant information:

- Navigation menus
- Footer links
- Cookie banners
- Share buttons
- Related articles
- Image captions
- Promotional blocks
- Platform boilerplate
- Repeated headings
- Miscellaneous UI content

This unnecessary context increases:

- LLM token usage
- API cost
- Latency
- False negatives
- Hallucination risk

The goal of Stage 4.2 is to ensure Gemini receives **only the information that contributes to opportunity extraction.**

---

# Design Philosophy

Firecrawl is **not** being replaced.

Firecrawl and Jina solve different problems.

## Firecrawl

Responsible for:

- Crawling
- Rendering JavaScript
- Metadata extraction
- Content acquisition
- Link discovery

## Jina Reader

Responsible for:

- Converting webpages into high-quality readable content
- Removing unnecessary webpage elements
- Producing extraction-friendly text

## LangChain

Responsible for orchestrating the preprocessing pipeline.

LangChain is **not** introduced to wrap Gemini.

Instead, it becomes Scout's document processing framework.

---

# New Discovery Flow

Current architecture:

```
Crawler

↓

Firecrawl

↓

Gemini Extraction
```

New architecture:

```
Crawler

↓

Firecrawl

↓

LangChain Document Loader

↓

Jina Reader

↓

LangChain Processing Pipeline

↓

Context Compression

↓

Gemini Extraction
```

---

# Why LangChain Comes First

Instead of passing raw strings between every stage, the Discovery Engine should operate on structured **Document** objects.

The proposed pipeline becomes:

```
Raw Firecrawl Response

↓

Document Loader

↓

Document

↓

Jina Reader

↓

Document

↓

Cleaner

↓

Chunker

↓

Relevance Scorer

↓

Context Compressor

↓

Optimized Context

↓

Gemini
```

This provides:

- clean separation of responsibilities
- reusable processing pipeline
- provider independence
- future extensibility

---

# Context Optimization Layer

Create a new module:

```
src/discovery/context/
```

Suggested structure:

```
context/

    optimizer.ts

    providers/

        jina-reader.ts

    langchain/

        loader.ts

        cleaner.ts

        chunker.ts

        scorer.ts

        compressor.ts

    metrics.ts

    index.ts
```

---

# Public API

The rest of Scout should interact only with:

```ts
optimizeContext(rawPage)
```

It returns:

```ts
{
    optimizedContent,

    metadata,

    compressionMetrics
}
```

No other module should communicate directly with Jina.

---

# Stage Responsibilities

## 1. Document Loader

Convert Firecrawl output into LangChain Document objects.

Responsibilities:

- preserve metadata
- preserve source URL
- preserve crawl metadata
- preserve timestamps

No business logic.

---

## 2. Jina Reader

Pass the document content through Jina Reader.

Purpose:

- simplify webpage
- remove rendering noise
- produce readable content

Jina should never know anything about:

- opportunities
- scholarships
- jobs
- hackathons

Its only responsibility is cleaning webpages.

---

## 3. Cleaner

Remove boilerplate content that survives Jina.

Examples:

- Cookie banners
- Privacy policy
- Terms
- Contact us
- Login prompts
- Newsletter signup
- Related posts
- Recommended articles
- Footer navigation
- Social links
- Empty sections
- Repeated separators
- Duplicate paragraphs

---

## 4. Chunking

Convert the cleaned document into logical sections.

Avoid splitting arbitrarily.

Prefer section-aware chunking around headings like:

- Eligibility
- Deadline
- Benefits
- Application Process
- Responsibilities
- Requirements
- Timeline
- Prize
- Stipend
- Compensation
- Selection Process

---

## 5. Relevance Scoring

Each chunk receives a relevance score.

Signals may include:

- apply
- application
- deadline
- eligibility
- fellowship
- internship
- scholarship
- hackathon
- challenge
- recruitment
- hiring
- prize
- stipend
- salary
- selection
- benefits
- qualification
- responsibilities
- registration

Low-value chunks are discarded.

---

## 6. Context Compression

Only the highest quality chunks should be merged.

Never simply truncate.

Compression order:

```
Rank

↓

Merge

↓

Compress

↓

Trim
```

---

# Context Budget

Introduce configurable limits.

Examples:

```
MAX_EXTRACTION_CHARS

or

MAX_EXTRACTION_TOKENS
```

If the optimized context exceeds the configured budget:

- keep highest ranked chunks
- compress further if necessary
- never remove critical sections first

---

# Preserve Important Sections

The optimizer should intentionally preserve sections discussing:

- Application deadline
- Eligibility
- Selection process
- Recruitment process
- Application process
- Registration
- Benefits
- Responsibilities
- Qualifications
- Compensation
- Stipend
- Salary
- Fellowship details
- Prize
- Timeline
- Duration
- Program overview

---

# Provider Abstraction

The rest of Scout should never know which optimization provider is being used.

Instead of:

```ts
await jinaReader(...)
```

Use:

```ts
await contextOptimizer.optimize(...)
```

Internally:

```
Context Optimizer

├── Jina Provider

├── Default Cleaner

└── Future Providers
```

Possible future providers:

- Browserbase
- Crawl4AI
- Mozilla Readability
- Custom ML cleaner

Switching providers should not affect the Discovery Engine.

---

# Metrics & Observability

Every optimization run should report:

```
Original Characters

↓

Characters After Jina

↓

Characters After Cleaning

↓

Characters Sent To Gemini

↓

Compression Ratio

↓

Estimated Tokens Saved
```

Also log:

- Number of chunks created
- Number of chunks selected
- Largest chunk
- Average chunk size
- Compression duration

Example:

```
==============================
Context Optimization Report
==============================

Original Characters:        18,450

After Jina:                 9,120

After Cleaning:             6,580

Sent To Gemini:             3,920

Compression Ratio:          78%

Estimated Tokens Saved:     3,600

Chunks Generated:           14

Chunks Selected:            5

Optimization Time:          320ms

==============================
```

---

# Failure Strategy

Optimization must never stop Discovery.

If Jina fails:

```
Firecrawl

↓

Cleaner

↓

Chunker

↓

Gemini
```

If compression fails:

```
Firecrawl

↓

Jina

↓

Gemini
```

If any optimization stage fails:

- log the error
- continue Discovery
- never abort extraction

---

# Architectural Principles

The optimization layer must remain:

- provider agnostic
- stateless
- independently testable
- reusable
- isolated from business logic

Gemini should never know whether Jina was used.

Likewise, Firecrawl should never know how context is optimized.

---

# Success Criteria

Stage 4.2 is considered complete only when:

- Jina Reader is integrated successfully.
- LangChain orchestrates preprocessing.
- Context optimization is isolated behind a single API.
- Gemini receives optimized context instead of raw crawled pages.
- Existing extraction behaviour remains unchanged.
- Token consumption is measurably reduced.
- Compression statistics are logged.
- Failure fallback works correctly.
- TypeScript compiles successfully.
- Existing Discovery Engine tests continue passing.

---

# Expected Outcomes

Compared to the current pipeline, this stage is expected to deliver:

- significantly lower Gemini token usage
- faster extraction latency
- improved extraction consistency
- fewer false negatives caused by noisy context
- lower API costs
- cleaner, extensible preprocessing architecture

This stage establishes the permanent Context Optimization Layer that all future extraction providers will use.