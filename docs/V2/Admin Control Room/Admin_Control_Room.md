# Admin Control Room

> **Version:** V1  
> **Status:** Planned  
> **Owner:** Scout Backend  
> **Priority:** High  
> **Route:** `/admin`

---

# Vision

The **Admin Control Room** is Scout's internal operations center.

It exists for one purpose:

> To monitor, control, debug, and maintain every backend system powering Scout.

It is **not** a user-facing dashboard.

It is an internal engineering tool.

Initially, it will fully manage the **Discovery Engine**.

As Scout grows, every backend system should integrate into this single portal instead of creating separate dashboards.

---

# Core Philosophy

When opening `/admin`, an administrator should instantly know:

- Is Scout healthy?
- What is Scout doing right now?
- Is anything failing?
- Where should I intervene?

The dashboard should prioritize **clarity over aesthetics**.

---

# Design Principles

The interface should be:

- Clean
- Spacious
- Fast
- Minimal
- Easy to scan
- Information-first

Avoid:

- Fancy animations
- Heavy gradients
- Glassmorphism
- Decorative cards everywhere
- Complex visual effects

Inspired by:

- Linear
- Vercel
- GitHub Actions
- Railway

---

# Authentication

The Admin Control Room must be protected.

## Environment Variable

```env
ADMIN_PASSWORD=your_secure_password
```

## Requirements

- Password protected
- Server-side authentication
- HTTP-only session cookie
- No JWT required
- Automatic session timeout
- Logout button

Only one administrator exists.

No user management is required.

---

# Routes

```
/admin
```

If unauthenticated:

```
/admin/login
```

After login:

```
/admin
```

---

# Overall Layout

```
---------------------------------------------------

Scout

Admin Control Room

---------------------------------------------------

Sidebar

• Overview
• Discovery Engine
• Recommendation Engine
• Providers
• Jobs
• Database
• Logs
• Settings

---------------------------------------------------

Main Content

---------------------------------------------------
```

The sidebar remains fixed.

The content changes.

---

# Module 1 — Overview

Purpose:

Provide an immediate health check of the entire platform.

## System Status

Display:

- Overall Status
- Database Connection
- Discovery Engine
- Recommendation Engine
- Providers

Example

```
System

Healthy

Database

Connected

Discovery Engine

Running

Recommendation Engine

Idle

Providers

Healthy
```

---

## Today's Activity

Display

- Discovery Runs
- Opportunities Found
- Opportunities Inserted
- Recommendations Generated
- AI Calls
- Errors

Simple metrics.

No charts required here.

---

# Module 2 — Discovery Engine

This is the primary feature in Version 1.

---

## Controls

Provide buttons:

- Start Discovery
- Stop Discovery
- Pause
- Resume
- Dry Run
- Test Single URL

---

## Current Execution

Display

```
Status

Running

Current Stage

Stage 3

Elapsed Time

02:14

Current URL

https://...

Current Provider

Gemini

API Key Alias

gemini-key-2
```

---

## Pipeline Progress

Display every stage.

```
Stage 1

██████████

100%

Stage 2

██████░░░░

63%

Stage 3

████░░░░░░

41%

Stage 4

Waiting

Stage 5

Waiting
```

Progress updates live.

---

## Live Statistics

Display

- URLs Found
- Pages Crawled
- Detector Skipped
- AI Processed
- Accepted
- Review
- Rejected
- Inserted
- Updated
- Duplicates Merged
- Archived

Update continuously.

---

## Live Logs

Dedicated scrolling console.

Newest entries appear at the bottom.

Example

```
10:42

Crawler started

10:43

Google Careers discovered

10:44

Detector passed

10:44

Gemini extraction complete

10:45

Duplicate merged

10:46

Opportunity inserted
```

Should auto-scroll.

---

## Errors

Separate from logs.

Errors must never be mixed into the activity feed.

Example

```
Firecrawl timeout

Retrying...

Gemini quota exceeded

Switching provider...

Mongo connection lost

Recovered
```

If Stage 2 fails on the first Firecrawl request, the dashboard should clearly indicate:

```
Firecrawl failed on first request.
```

Include diagnostic details.

---

## Performance

Simple static charts.

No animation required.

Charts include:

- Opportunities/hour
- Crawl Speed
- Acceptance Rate
- Average Quality
- Duplicate Rate

---

## Run History

Every discovery run should be stored.

Example

```
Run #218

Status

SUCCESS

Started

10:14

Finished

10:29

Duration

15m

Accepted

183

Rejected

74

Merged

21

Archived

13

Errors

0
```

Selecting a run should open a detailed report containing:

- Stage timings
- Provider usage
- Errors
- Analytics
- Summary

This becomes invaluable for debugging and historical analysis.

---

# Module 3 — Recommendation Engine

**Version 1 Status**

Placeholder only.

Purpose:

Reserve the architecture for future integration.

Display:

```
Recommendation Engine

Coming Soon

This module will manage:

• Recommendation jobs
• Recommendation queue
• Embedding generation
• Similarity indexing
• Cache
• User recommendation analytics
```

No functionality is required yet.

---

# Module 4 — Providers

Display every external provider Scout depends on.

Example

```
Firecrawl

Healthy

Gemini

Healthy

Groq

Healthy

Browserbase

Idle
```

Each provider should expose:

- Status
- Last request
- Current usage
- Error count
- Quota (if available)

Actions:

- Enable
- Disable
- Test Connection

---

# Module 5 — Jobs

Displays all scheduled background jobs.

Example

```
Daily Discovery

Running

Archive Expired

Waiting

Recommendation Refresh

Idle

Embedding Rebuild

Idle
```

Administrator should be able to manually trigger jobs.

---

# Module 6 — Database

Simple health overview.

Display:

Collections

- Users
- Opportunities
- Recommendations
- Runs
- Logs
- Embeddings

Metrics

- Total Documents
- Connection Status
- Average Response Time
- Last Backup

No CRUD interface required.

---

# Module 7 — Logs

Unified backend logging.

Allow filtering by:

- Discovery
- Recommendation
- Database
- AI Providers
- Scheduler
- Authentication
- Server

Support:

- Search
- Severity filters
- Timestamp
- Export logs

---

# Module 8 — Settings

Only operational settings.

Examples

Discovery

- Quality Threshold
- Accept Threshold
- Review Threshold

Recommendation

- Reserved for future

System

- Maintenance Mode
- Feature Flags

Avoid making this page cluttered.

---

# Future Expansion

The architecture should support unlimited backend modules.

```
Admin Control Room

│

├── Overview

├── Discovery Engine

├── Recommendation Engine

├── Notification Engine

├── Providers

├── Jobs

├── Database

├── Logs

├── Analytics

├── Users

├── Billing

└── Settings
```

Adding a new backend system should require adding a new module only.

The rest of the dashboard should remain unchanged.

---

# Technical Architecture

```
/admin

│

├── login

├── layout

├── overview

├── discovery

├── recommendation

├── providers

├── jobs

├── database

├── logs

└── settings
```

Each module owns:

- Its own API calls
- Its own UI
- Its own components

Shared components include:

- Sidebar
- Header
- Status Badge
- Metric Cards
- Log Viewer
- Charts
- Tables

---

# Version 1 Scope

Included:

- Authentication
- Discovery Engine Control
- Live Monitoring
- Run History
- Providers
- Jobs
- Database Health
- Logs
- Settings
- Recommendation Placeholder

Not Included:

- User Management
- Billing
- Analytics Module
- Notification Module
- Recommendation Engine Controls

These will be introduced as Scout evolves.

---

# Success Criteria

The Admin Control Room is considered successful when an administrator can:

- Securely log in
- Start and stop the Discovery Engine
- Observe every stage live
- Monitor providers and background jobs
- Inspect logs and errors
- Review historical discovery runs
- Verify database health
- Expand the dashboard seamlessly as new backend systems are added