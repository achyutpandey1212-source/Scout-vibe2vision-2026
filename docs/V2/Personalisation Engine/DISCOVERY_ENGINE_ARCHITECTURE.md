# 📄 DISCOVERY_ENGINE_ARCHITECTURE.md

---

# 1. Vision

## Purpose

Scout's Discovery Engine exists to continuously discover, verify, enrich, and maintain the highest-quality early-career opportunities for Indian college women.

Rather than functioning as a generic web crawler or job aggregator, Scout is designed to become the infrastructure that powers opportunity discovery.

The goal is not to crawl the internet.

The goal is to ensure that the right opportunity reaches the right student before it becomes difficult to discover.

---

## Mission

> Discover opportunities students don't know exist.

Most students repeatedly visit the same few websites:

- LinkedIn
- Internshala
- Unstop
- Company career pages

Yet thousands of internships, scholarships, hackathons, research programs, campus initiatives, and women-focused opportunities remain hidden across university websites, nonprofit organizations, foundations, government portals, and niche communities.

Scout's Discovery Engine exists to surface those hidden opportunities automatically.

---

## Product Responsibility

The Discovery Engine is responsible for:

- Discovering new opportunities
- Keeping existing opportunities fresh
- Removing expired opportunities
- Normalizing data
- Enriching opportunity metadata
- Eliminating duplicates
- Providing trusted opportunity data to the Recommendation Engine

It is **not** responsible for personalization.

It builds the opportunity universe.

The Personalization Engine decides which opportunities matter to each student.

---

# 2. Discovery Philosophy

Scout follows a student-first discovery philosophy.

---

## Discover Before Competitors

Finding opportunities early creates more value than listing thousands of popular opportunities after everyone already knows about them.

---

## Quality Over Quantity

A small number of verified, relevant opportunities is more valuable than an enormous database filled with duplicates and low-quality listings.

---

## Official Sources First

Whenever possible, Scout prefers:

- Official company portals
- Government websites
- University pages
- Foundation websites
- Research organizations

over reposted aggregators.

---

## Freshness Matters

An internship that closed yesterday has zero value.

Discovery is continuous, not one-time.

---

## Hidden Opportunities Matter Most

The greatest value comes from opportunities students were unlikely to discover themselves.

Examples include:

- Research internships
- Foundation scholarships
- Women-only initiatives
- Startup internships
- University innovation programs
- Early career talent programs

---

## Free Opportunities First

Scout prioritizes opportunities with no mandatory upfront fee.

Students should never have to pay merely to apply.

---

# 3. Opportunity Universe

The Discovery Engine focuses on opportunities relevant to undergraduate students.

---

## Primary Categories

- Internships
- Hackathons
- Scholarships
- Open Source Programs
- Student Competitions
- Undergraduate Fellowships
- Bootcamps
- Workshops
- Student Conferences
- Campus Ambassador Programs
- Early Career Programs
- Women-only Initiatives

---

## Secondary Categories

- Research Programs
- Innovation Challenges
- Startup Incubation Programs
- Grants
- Student Exchanges

---

## Explicitly Out of Scope

Scout intentionally avoids:

- Generic full-time jobs
- Affiliate marketing content
- Paid certification promotions
- Recruitment spam
- Blog articles without actionable opportunities

---

# 4. Discovery Pipeline

The Discovery Engine consists of multiple deterministic stages.

```text
Source Registry
        │
        ▼
Search Providers
        │
        ▼
Crawler Layer
        │
        ▼
Context Optimizer
        │
        ▼
AI Extraction
        │
        ▼
Opportunity Enrichment
        │
        ▼
Quality Evaluation
        │
        ▼
Deduplication
        │
        ▼
Persistence
        │
        ▼
Recommendation Engine
```

Each stage has one responsibility and produces structured output for the next stage.

---

# 5. Source Registry

Scout maintains a registry of trusted opportunity sources instead of relying on ad-hoc web searches.

Example source categories include:

- Company career portals
- Government opportunity portals
- Universities
- NGOs
- Research labs
- Open-source foundations
- Women-focused organizations
- Hackathon platforms
- Scholarship databases
- Innovation ecosystems
- Startup communities

Each source includes metadata such as:

- Priority
- Crawl frequency
- Trust score
- Supported opportunity types
- Crawl strategy

---

# 6. Crawl Strategy

Scout separates discovery from refresh.

## Weekly Discovery

Searches for new URLs and expands the opportunity universe.

Examples:

- Newly launched programs
- Newly published internships
- New university initiatives

---

## Daily Refresh

Refreshes existing opportunity pages to detect:

- Deadline updates
- Eligibility changes
- New application links
- Status changes

---

## Priority Refresh

High-value opportunities may be refreshed immediately when:

- Deadlines are near
- Content changes frequently
- Source trust is high

---

# 7. Context Optimization

One of Scout's biggest competitive advantages is minimizing AI input without sacrificing extraction quality.

The Context Optimization Layer performs deterministic preprocessing before any LLM call.

Features include:

- Adaptive Firecrawl/Jina routing
- Dynamic context budgets
- HTML cleaning
- Boilerplate removal
- Navigation stripping
- Visual asset removal
- Logo removal
- UI noise filtering
- Markdown normalization
- Semantic chunking
- Priority chunk ranking
- Negative compression guard
- Dynamic page profiling
- Context compression reporting

Rather than sending entire webpages, Scout sends only the highest-value content required for extraction.

This dramatically reduces:

- Token usage
- API costs
- Latency

while maintaining extraction quality.

---

# 8. Opportunity Extraction

Only after optimization does Scout invoke an LLM.

Pipeline:

```text
Detector

↓

Optimized Context

↓

LLM Extraction

↓

Schema Validation

↓

Confidence Assessment

↓

Structured Opportunity
```

AI is responsible only for understanding opportunity content—not searching or crawling.

---

# 9. Opportunity Enrichment

After extraction, Scout enriches every opportunity with additional metadata.

Examples include:

- Canonical URL
- Organization
- Opportunity type
- Deadline normalization
- Application URL
- Skill extraction
- Eligibility parsing
- Location
- Compensation
- Duration
- Tags
- Women-only detection
- Difficulty estimation
- Target audience

Enrichment converts raw opportunity data into structured intelligence.

---

# 10. Quality Engine

Every extracted opportunity receives a quality score.

Signals include:

Positive:

- Trusted source
- Official application link
- Deadline present
- Rich description
- Structured eligibility
- Compensation information

Negative:

- Missing deadline
- Generic landing page
- Unknown organization
- Poor metadata
- Broken application link

Based on the score, opportunities are:

- Accepted
- Sent for review
- Rejected

---

# 11. Deduplication

Scout prevents duplicate opportunities before persistence.

Matching signals include:

- Canonical URL
- Application URL
- Similar titles
- Organization
- Deadline
- Opportunity fingerprint

Existing records are updated instead of duplicated.

Historical metadata is preserved wherever appropriate.

---

# 12. Persistence

Validated opportunities are stored in MongoDB.

Possible outcomes:

- New opportunity inserted
- Existing opportunity updated
- Duplicate merged
- Opportunity archived
- Opportunity expired

Bulk operations maximize efficiency.

---

# 13. Discovery Metrics

The Discovery Engine continuously reports operational metrics.

Examples:

- Sources crawled
- Pages discovered
- Pages fetched
- Successful extractions
- New opportunities
- Updated opportunities
- Duplicate merges
- Archive count
- Average quality score
- Compression ratio
- Tokens saved
- Cache hit rate
- Crawl latency
- AI latency
- Official source percentage
- Women-only opportunity count

These metrics help monitor both technical health and product quality.

---

# 14. Discovery ↔ Personalization Integration

Discovery remains global rather than user-specific, but onboarding insights help guide future source prioritization.

Examples:

If many students indicate interest in AI:

- Increase monitoring of AI labs
- Expand ML internship sources
- Track AI competitions

If many students prefer government opportunities:

- Expand government portal coverage

If interest in hackathons increases:

- Increase crawl frequency for hackathon platforms

Personalization informs strategic discovery without creating separate crawlers per user.

---

# 15. AI Usage Policy

Scout deliberately limits AI usage.

AI is **not** used for:

- Searching the web
- Crawling pages
- Cache management
- Deduplication
- Quality scoring logic

AI is used only for:

- Opportunity extraction
- Metadata generation
- Classification
- Eligibility understanding
- Summarization

All infrastructure decisions remain deterministic.

---

# 16. Cost Optimization

Scout is designed to maximize value from limited infrastructure.

Strategies include:

- Redis caching
- Firecrawl caching
- Adaptive provider routing
- Context optimization
- Dynamic budgets
- Compression
- Retry strategies
- Provider rotation
- Budget management
- Single extraction per page
- Batch crawling
- AI call minimization

Every optimization reduces operational cost while maintaining quality.

---

# 17. Future Discovery Roadmap

Potential future enhancements include:

- RSS ingestion
- Email/newsletter ingestion
- University bulletin crawling
- Partner submissions
- Telegram channel monitoring
- Discord community discovery
- Event APIs
- GitHub event monitoring
- LinkedIn event discovery
- Research publication feeds

The current architecture is intentionally modular to support these future connectors.

---

# 18. Design Principles

The Discovery Engine follows several foundational principles.

- Discover once, reuse many times.
- Prefer deterministic logic over AI.
- Every AI token must justify itself.
- Crawl intelligently, not exhaustively.
- Optimize for freshness over volume.
- Prefer trusted official sources.
- Surface hidden opportunities before popular ones.
- Free opportunities before paid offerings.
- Build infrastructure that scales with the community.
- Discovery is Scout's competitive moat.