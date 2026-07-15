# DATABASE_SCHEMA.md

> **Version:** V2 (MVP)
>
> This document defines Scout's conceptual database schema. It is intentionally implementation-oriented while remaining independent of MongoDB models or Mongoose syntax.
>
> It serves as the single source of truth for all persistent data used across Discovery, Personalization, Onboarding, and Recommendation.

---

# 1. Design Philosophy

Scout stores only information that directly improves one or more of these:

- Discovery quality
- Personalization
- Recommendation quality
- Career progress
- Product analytics

Every stored field must answer at least one question:

> "How does this make Scout more helpful?"

If it doesn't, it shouldn't exist.

---

# 2. Collections Overview

Scout V2 consists of the following primary collections.

```
Users
Profiles
Resumes
Opportunities
Recommendations
Bookmarks
DiscoveryRuns
Sources
Notifications
CareerGPS
```

---

# 3. User Collection

Represents authentication identity.

The User document should remain lightweight.

## Fields

```
_id

firebaseUid

email

displayName

photoURL

provider

createdAt

lastLogin

status
```

---

## Relationships

```
User

↓

Profile (1:1)

↓

Resume (0:1)

↓

Bookmarks (1:N)

↓

Recommendations (1:N)

↓

Career GPS (1:1)
```

---

# 4. Profile Collection

This becomes Scout's personalization brain.

## Identity

```
userId

fullName

gender

age (optional)

state

city

college

university
```

---

## Education

```
degree

branch

currentYear

expectedGraduation

cgpa (optional)
```

---

## Skills

```
technicalSkills[]

softSkills[]

tools[]

languages[]
```

---

## Interests

```
interestDomains[]

preferredRoles[]

careerGoals[]
```

Examples

```
Frontend

AI

Cybersecurity

Research

UI/UX

Cloud
```

---

## Motivation Signals

```
primaryMotivation

secondaryMotivations[]
```

Examples

```
Earn Money

Gain Experience

Placements

Research

Startup

Freelancing

Higher Studies
```

---

## Confidence Signals

```
confidenceProfile

hesitationLevel

stretchPreference

applicationConfidence
```

These are derived from onboarding answers.

---

## Preferences

```
preferredLocations[]

remotePreference

relocationPreference

preferredCompanySize

womenOnlyPreference

governmentPreference

startupPreference
```

---

## Opportunity Preferences

```
internships

hackathons

scholarships

research

events

bootcamps

opensource

competitions

training

volunteer

earlyCareerPrograms

partTime
```

Boolean or preference weights.

---

## Career Readiness

```
careerReadinessScore

profileCompleteness

resumeUploaded

githubConnected

linkedinConnected

portfolioConnected
```

---

## Metadata

```
createdAt

updatedAt

lastRecommendationRefresh
```

---

# 5. Resume Collection

Stores uploaded resume information.

Never store only the raw PDF.

Store structured extraction.

---

## Original

```
userId

fileUrl

fileName

uploadedAt
```

---

## Parsed Data

```
education[]

experience[]

projects[]

skills[]

certifications[]

achievements[]

links[]
```

---

## AI Extraction Metadata

```
provider

model

confidence

version

parsedAt
```

Supports future reprocessing.

---

# 6. Opportunity Collection

The most important collection in Scout.

Every opportunity is normalized regardless of source.

---

## Identity

```
_id

canonicalId

title

slug

type
```

---

## Organization

```
organization

organizationType

organizationWebsite
```

---

## Opportunity

```
category

subCategory

description

summary

benefits

stipend

salary

duration
```

---

## Eligibility

```
eligibleBranches[]

eligibleYears[]

minimumEducation

skills[]

requirements[]

experienceRequired
```

---

## Location

```
country

state

city

remote

hybrid

onsite
```

---

## Dates

```
publishedAt

deadline

startDate

endDate
```

---

## URLs

```
applicationUrl

sourceUrl

officialPage
```

---

## Discovery Metadata

```
source

crawlDate

crawlMethod

provider

contentHash

lastSeen

lastUpdated
```

---

## AI Enrichment

```
summary

keywords[]

tags[]

categoryPrediction

eligibilitySummary

confidence
```

---

## Quality

```
qualityScore

qualitySignals[]

warnings[]
```

---

## Trust

```
trustScore

trustSignals[]
```

---

## Hidden Gem

```
hiddenGemScore

competitionEstimate

sourceAuthority
```

---

## Recommendation Features

```
recommendationTags[]

careerStages[]

domains[]

difficulty

womenFocused
```

---

## Status

```
ACTIVE

EXPIRED

ARCHIVED
```

---

# 7. Recommendation Collection

Stores daily generated recommendation packages.

Never compute everything live.

---

## Identity

```
userId

generatedAt
```

---

## Recommendation List

```
recommendations[]
```

Each recommendation contains

```
opportunityId

score

category

rank

reason

explanation

confidence
```

---

## Daily Summary

```
dailyDelta

careerGpsSummary

unlockedCount
```

---

## Metadata

```
modelVersion

refreshReason
```

---

# 8. Bookmark Collection

```
userId

opportunityId

bookmarkedAt

notes (future)
```

---

# 9. Career GPS Collection

Stores personalized roadmap.

---

## Current Goal

```
goal

targetOpportunity
```

---

## Missing Skills

```
missingSkills[]
```

---

## Tasks

```
tasks[]
```

Example

```
Build React Project

↓

Complete DSA Sheet

↓

Upload Resume

↓

Connect GitHub
```

---

## Progress

```
completedTasks

completionPercentage

estimatedUnlocks
```

---

## Last Refresh

```
generatedAt

modelVersion
```

---

# 10. Notification Collection

Stores user-facing updates.

Examples

```
Daily Delta

Deadline Reminder

Opportunity Unlocked

Recommendation Ready

Career GPS Updated
```

Fields

```
userId

type

title

body

read

createdAt
```

---

# 11. Discovery Run Collection

Stores Discovery execution history.

Useful for monitoring.

```
runId

startedAt

endedAt

sources

pagesDiscovered

pagesFetched

cacheHits

cacheMisses

crawlFailures

aiFailures

extracted

inserted

updated

duplicates

archived
```

---

# 12. Source Collection

Stores crawler configuration.

```
sourceName

baseUrl

type

crawlFrequency

priority

enabled

lastRun

trustScore
```

---

# 13. Relationships

```
User
 │
 ├────────────── Profile
 │                 │
 │                 ├──────── Resume
 │                 │
 │                 ├──────── Career GPS
 │                 │
 │                 └──────── Recommendation Package
 │
 ├────────────── Bookmarks
 │
 └────────────── Notifications

Opportunity
 │
 ├──────── Recommendation Package
 │
 ├──────── Discovery Runs
 │
 └──────── Source
```

---

# 14. Suggested Indexes

## Users

```
firebaseUid

email
```

---

## Profiles

```
userId
```

---

## Opportunities

```
applicationUrl

deadline

type

category

qualityScore

hiddenGemScore

trustScore

status

skills

eligibleBranches
```

---

## Recommendations

```
userId

generatedAt
```

---

## Bookmarks

```
userId

opportunityId
```

---

## Notifications

```
userId

createdAt

read
```

---

# 15. Data Lifecycle

## User

Created once.

Updated throughout career.

---

## Profile

Continuously enriched through onboarding, resume uploads, and progressive profiling.

---

## Resume

Updated only when new resume uploaded.

---

## Opportunity

Continuously refreshed by Discovery Engine.

Eventually becomes

```
ACTIVE

↓

EXPIRED

↓

ARCHIVED
```

---

## Recommendations

Regenerated daily.

Old recommendation packages may be retained temporarily for analytics before expiration.

---

## Discovery Runs

Immutable historical records.

Useful for debugging and performance monitoring.

---

# 16. Design Principles

The Scout database follows several guiding principles:

- Normalize opportunities regardless of source.
- Store structured data rather than raw AI outputs whenever possible.
- Separate user identity from personalization data.
- Precompute recommendation packages instead of generating them on demand.
- Preserve enrichment metadata to support future AI upgrades.
- Optimize for deterministic recommendation performance.
- Prefer incremental updates over full document rewrites.
- Design schemas that can evolve without breaking existing data.
- Every stored field should improve either Discovery, Personalization, Recommendations, or user experience.

---

# End of Document