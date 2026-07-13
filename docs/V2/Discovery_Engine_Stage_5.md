# Discovery Engine — Stage 5
# Persistence, Deduplication & Run Analytics

**Version:** V2  
**Status:** Planned  
**Purpose:** Final stage of the Discovery Engine

---

# Goal

Stage 5 is the final stage of the Discovery Engine.

Its responsibility is extremely simple:

> Take only high-quality opportunities from Stage 4 and safely merge them into Scout's Opportunity Database.

Nothing else.

No crawling.
No AI.
No recommendation.
No personalization.

Only database operations.

This stage is the bridge between the Discovery Engine and the Recommendation Engine.

---

# Inputs

```ts
QualityEvaluatedOpportunity[]
```

Output from Stage 4.

Each opportunity already contains

- quality score
- decision
- validation status
- extraction metadata

Stage 5 trusts Stage 4.

It never rescans quality.

---

# Outputs

1. MongoDB Opportunity Collection updated

2. Complete Run Report

3. Analytics for Dashboard

---

# Single Responsibility

Stage 5 is responsible for only five things:

1. Deduplicate opportunities
2. Merge updates into existing opportunities
3. Persist new opportunities
4. Archive expired opportunities
5. Produce final run analytics

Nothing more.

---

# Architecture

```text
Stage 4
      │
      ▼
QualityEvaluatedOpportunity[]
      │
      ▼
Duplicate Detector
      │
      ▼
Merge Engine
      │
      ▼
Persistence Engine
      │
      ▼
Archive Engine
      │
      ▼
Run Analytics
      │
      ▼
MongoDB
```

---

# Component 1
# Acceptance Filter

Only opportunities marked

```
ACCEPT
```

or

```
REVIEW
```

are allowed through.

Rejected opportunities never reach MongoDB.

---

# Component 2
# Duplicate Detection

This is one of the most important parts of Scout.

The goal is NOT merely avoiding duplicate URLs.

The goal is avoiding duplicate opportunities.

---

## Matching Signals

### 1. Application URL

Highest confidence.

If identical

→ Duplicate

---

### 2. Canonical URL

Normalize

- trailing slash
- query params
- tracking ids
- utm

before comparison.

---

### 3. Organization

Compare

```
Google

Google LLC

Google India
```

Should resolve correctly.

---

### 4. Opportunity Title

Example

```
Software Engineer Intern
```

vs

```
Software Engineering Internship
```

Should score very high similarity.

---

### 5. Deadline

Same title

Same company

Same deadline

Very likely duplicate.

---

### 6. Semantic Similarity

Future-ready.

Current MVP can skip embeddings.

Design architecture so embeddings can plug in later.

---

# Duplicate Confidence

Example

| Confidence | Action |
|------------|---------|
| >95% | Merge |
| 80–95% | Manual Review Flag |
| <80% | Treat as New |

Thresholds configurable.

---

# Component 3
# Merge Engine

When duplicate found:

DO NOT overwrite blindly.

Merge intelligently.

---

Example

Old DB

```
deadline:
August 20

stipend:
null

description:
short
```

New discovery

```
deadline:
August 20

stipend:
₹40,000

description:
long
```

Merged result

```
deadline:
August 20

stipend:
₹40,000

description:
long
```

Never lose information.

---

## Merge Rules

Prefer

- richer description
- newer deadline
- official URL
- official source
- non-null fields

Never replace populated fields with null.

---

# Version Metadata

Every merge stores

```
lastUpdated

lastDiscoveryRun

updatedAt

sourceCount

qualityScore
```

This helps future debugging.

---

# Component 4
# Persistence Engine

Handles MongoDB writes.

No business logic.

Only persistence.

---

Possible outcomes

```
Inserted

Updated

Skipped

Archived
```

---

# Bulk Operations

Must use

BulkWrite

instead of

```
insertOne
```

for every opportunity.

Reason

Much faster.

Lower Mongo overhead.

Better scaling.

---

# Component 5
# Archive Engine

Every run should automatically archive expired opportunities.

Rule

```
deadline < today
```

↓

```
status = archived
```

Never delete immediately.

Archived opportunities may still provide analytics.

---

# Component 6
# Discovery Run Analytics

At the end of every run produce one summary.

Example

```
======================================
DISCOVERY RUN SUMMARY
======================================

Candidates Found:
742

Successfully Crawled:
516

AI Extraction Passed:
441

Accepted:
318

Review:
61

Rejected:
62

Duplicates Merged:
47

New Opportunities:
271

Archived:
13

Average Quality:
84.7

Duration:
5h 41m

======================================
```

---

# Dashboard Metrics

Expose

```
Total URLs Found

Pages Crawled

Detector Skip %

AI Calls

Gemini Usage

Groq Usage

Average Crawl Time

Average AI Time

Duplicates

Inserted

Updated

Archived

Acceptance Rate

Failure Rate
```

Development dashboard uses these.

---

# Error Handling

Persistence failures should never crash the run.

If one insert fails

Continue.

Record failure.

Continue processing.

---

# Logging

Each persistence action logs

```
Opportunity ID

Decision

Inserted / Updated / Skipped

Duplicate Confidence

Execution Time
```

---

# Configuration

Everything configurable.

```
MERGE_THRESHOLD

REVIEW_THRESHOLD

BULK_SIZE

ARCHIVE_AFTER_DAYS

ENABLE_ARCHIVE

ENABLE_DUPLICATE_MERGE
```

No hardcoded numbers.

---

# Backwards Compatibility

Stage 5 must preserve

- Playground
- Existing Opportunity schema
- Existing Discovery Runner
- Existing Mongo collections

Only replace legacy persistence helper with Stage 5 implementation.

---

# Development Dashboard Integration

At the completion of every Discovery Run,

Stage 5 returns

```ts
RunAnalytics
```

containing

```ts
interface RunAnalytics {

    startedAt: Date;

    finishedAt: Date;

    durationMs: number;

    urlsFound: number;

    crawledPages: number;

    detectorSkipped: number;

    aiProcessed: number;

    accepted: number;

    review: number;

    rejected: number;

    inserted: number;

    updated: number;

    duplicatesMerged: number;

    archived: number;

    averageQuality: number;

    geminiCalls: number;

    groqCalls: number;

    cacheHits: number;

    failures: number;
}
```

This object powers the Development Discovery Dashboard.

---

# Success Criteria

Stage 5 is complete when:

✓ Only ACCEPT and REVIEW opportunities reach MongoDB.

✓ Duplicate opportunities merge correctly.

✓ Existing data is never degraded.

✓ Expired opportunities archive automatically.

✓ Bulk database writes are used.

✓ Complete run analytics are generated.

✓ Mongo persistence is fully isolated inside Stage 5.

✓ Discovery Engine ends with a clean Run Report.

---

# Discovery Engine Completion

After Stage 5 the Discovery Engine is considered complete.

Final pipeline:

Stage 1 → Opportunity Discovery

↓

Stage 2 → Intelligent Crawling

↓

Stage 3 → AI Extraction

↓

Stage 4 → Quality Validation & Decision

↓

Stage 5 → Persistence, Deduplication & Run Analytics

The Recommendation Engine begins only **after** Stage 5 has successfully populated the Opportunity Database.