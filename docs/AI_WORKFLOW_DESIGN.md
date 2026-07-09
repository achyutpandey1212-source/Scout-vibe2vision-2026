# AI_WORKFLOW_DESIGN.md

# Scout AI Workflow Design
### Intelligence Only Where Intelligence Is Required

> "Code computes.
>
> AI judges."

---

# Philosophy

Scout is not an AI-first application.

Scout is an Intelligence-first application.

Artificial Intelligence should only be used when deterministic code cannot reliably solve the problem.

Every AI call must justify its existence.

---

# Core Engineering Principle

Before introducing an LLM, ask

Can deterministic code solve this?

If

YES

↓

Write code.

If

NO

↓

Use AI.

---

# Intelligence Boundary

Scout consists of two kinds of work.

## Deterministic Work

Things computers already do perfectly.

Examples

Searching

Filtering

Sorting

Parsing JSON

Validation

Authentication

Caching

Database Queries

Scheduling

Deduplication

HTTP Requests

Queue Management

Indexes

These should NEVER involve AI.

---

## Intelligence Work

Things requiring understanding, reasoning or judgment.

Examples

Understanding webpages

Categorizing opportunities

Understanding career intent

Ranking opportunities

Generating explanations

Summarizing information

Skill inference

Eligibility interpretation

These SHOULD use AI.

---

# AI Workflows

Scout contains two independent AI workflows.

1.

Discovery Intelligence

2.

Personalization Intelligence

These workflows should never share prompts or responsibilities.

---

# Workflow 1

Discovery Intelligence

Purpose

Understand opportunities.

Input

Raw webpage content.

Output

Structured Opportunity Object.

---

Pipeline

Search APIs

↓

Firecrawl

↓

Markdown

↓

AI

↓

Structured JSON

↓

Validation

↓

MongoDB

---

# Discovery Workflow

Stage 1

Search

AI?

❌ NO

Reason

Search APIs already perform this.

---

Stage 2

Collect URLs

AI?

❌ NO

Reason

Simple code.

---

Stage 3

Download webpage

AI?

❌ NO

Reason

Firecrawl.

---

Stage 4

Clean webpage

AI?

❌ NO

Reason

Firecrawl already returns clean markdown.

---

Stage 5

Determine

"Is this actually an opportunity?"

AI?

✅ YES

Reason

Requires contextual understanding.

---

Stage 6

Extract structured fields

AI?

✅ YES

Reason

Deadlines

Eligibility

Benefits

Requirements

Location

cannot be extracted reliably using rules.

---

Stage 7

JSON Validation

AI?

❌ NO

Reason

Use Zod.

---

Stage 8

Duplicate Detection

AI?

❌ NO

Reason

Hashes

URLs

Title similarity

Code is enough.

Future

Embedding similarity.

---

Stage 9

Store

AI?

❌ NO

Reason

Database operation.

---

# Discovery Prompt Responsibilities

AI should ONLY answer

What is this?

Who is it for?

What are the eligibility requirements?

Which skills are needed?

Which category does it belong to?

Is it trustworthy?

Never ask AI to

Insert into database.

Validate URLs.

Generate IDs.

Compute hashes.

---

# Workflow 2

Personalization Intelligence

Purpose

Understand people.

Input

User Profile

+

Candidate Opportunities

Output

Ranked Opportunity Feed.

---

Pipeline

User

↓

Profile

↓

Retrieve Candidates

↓

Eligibility Filter

↓

AI Ranking

↓

Explanation

↓

Dashboard

---

Stage 1

Retrieve Candidate Opportunities

AI?

❌ NO

Reason

MongoDB query.

---

Stage 2

Eligibility Filtering

AI?

❌ NO

Reason

Rule-based.

Examples

Country

Degree

Age

Deadline

Experience

---

Stage 3

Ranking

AI?

✅ YES

Reason

Requires understanding of

Career goals

Skill overlap

Potential

Growth

Future value

---

Stage 4

Generate Explanation

AI?

✅ YES

Reason

Requires natural language reasoning.

---

Stage 5

Sort

AI?

❌ NO

Reason

Sort by score.

Simple code.

---

Stage 6

Cache

AI?

❌ NO

Reason

Redis.

---

# AI Decision Matrix

| Task | AI | Code | Why |
|------|----|------|-----|
| Authentication | ❌ | ✅ | Firebase |
| Search Internet | ❌ | ✅ | Brave Search |
| Crawl Website | ❌ | ✅ | Firecrawl |
| Parse HTML | ❌ | ✅ | Firecrawl |
| JSON Validation | ❌ | ✅ | Zod |
| Duplicate Detection | ❌ | ✅ | Deterministic |
| Opportunity Classification | ✅ | ❌ | Requires understanding |
| Skill Extraction | ✅ | ❌ | Semantic |
| Eligibility Understanding | ✅ | ❌ | Contextual |
| Opportunity Ranking | ✅ | ❌ | Judgment |
| Recommendation Explanation | ✅ | ❌ | Natural language |
| Database Queries | ❌ | ✅ | MongoDB |
| Sorting Results | ❌ | ✅ | Native sort |
| Cache | ❌ | ✅ | Redis |

---

# Structured Outputs

Every AI call must return structured JSON.

Never accept free-form text.

Preferred

Zod Schemas

LangChain Structured Output

Every response should validate before entering the application.

---

# Prompt Engineering

Every workflow owns its own prompts.

Discovery

Prompt Set

Personalization

Prompt Set

Never reuse prompts between workflows.

---

# AI Metadata

Every AI response should store

Provider

Model

Prompt Version

Workflow Version

Latency

Confidence

Generated Time

This improves debugging.

---

# Cost Optimization

AI is expensive.

Scout should minimize calls.

Strategies

Only reason over

Top Candidate Opportunities

Instead of

Entire Database.

Example

Database

↓

10,000 Opportunities

↓

Mongo Filters

↓

250 Candidates

↓

AI

↓

Top 10

---

# Batch Processing

Whenever possible

One AI call

↓

Multiple opportunities

instead of

100 individual AI calls.

---

# Retry Strategy

AI failures

↓

Retry once

↓

Fallback Provider

↓

Log Failure

↓

Continue

Never crash a workflow.

---

# Provider Routing

Discovery Workflow

↓

Discovery API Key

↓

Preferred Provider

↓

Fallback Provider

---

Personalization Workflow

↓

Personalization API Key

↓

Preferred Provider

↓

Fallback Provider

---

The workflows remain completely isolated.

---

# Future Routing

Future versions may route based on

Latency

Cost

Context Window

Reasoning Quality

Availability

No business logic should change.

---

# AI Safety

Never trust raw AI output.

Every response must

Validate

Sanitize

Normalize

Only then

Store.

---

# Engineering Principles

1.

Use code whenever possible.

---

2.

Use AI only for understanding.

---

3.

Validate every AI response.

---

4.

AI never directly modifies the database.

---

5.

AI produces structured intelligence.

Code performs actions.

---

6.

Every AI call should save more work than it costs.

If an AI call replaces only a few lines of deterministic code, it probably shouldn't exist.

---

# Long-Term Vision

Eventually Scout may use multiple specialized models.

Examples

Discovery

↓

Fast extraction model

Ranking

↓

Reasoning model

Embeddings

↓

Embedding model

Summaries

↓

Small inexpensive model

Every model should perform only the task it is best suited for.

---

# North Star

Scout should spend intelligence only where intelligence creates value.

Everything else should be deterministic, testable, scalable and fast.

Code executes.

AI understands.