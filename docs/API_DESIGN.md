# API_DESIGN.md

# Scout API Design
### Business APIs, Not Database APIs

> "An API should expose what Scout does, not how Scout stores data."

---

# Philosophy

Scout follows a capability-driven API architecture.

Clients should never know

- MongoDB collections
- Internal AI workflows
- Discovery Engine
- LLM providers

The frontend simply requests capabilities.

---

# High Level Architecture

```
Frontend

↓

REST API

↓

Controllers

↓

Services

↓

AI Capability Layer

↓

Database

↓

Response
```

Controllers should be extremely thin.

Business logic belongs inside services.

---

# API Version

```
/api/v1/
```

Future

```
/api/v2/
```

No breaking frontend changes.

---

# Authentication

Firebase Authentication

Every protected endpoint requires

```
Authorization

Bearer Firebase_ID_Token
```

Backend verifies token.

Creates user session.

---

# API Modules

```
Authentication

Onboarding

Dashboard

Opportunities

Recommendations

Bookmarks

Applications

Profile

Notifications

Admin

System
```

---

# AUTH APIs

## Verify User

```
POST

/api/v1/auth/verify
```

Purpose

Verify Firebase token.

Create user if first login.

Response

```
User

JWT (optional)

Profile Exists?
```

---

# ONBOARDING APIs

## Submit Onboarding

```
POST

/api/v1/onboarding
```

Purpose

Complete onboarding.

Flow

Receive form

↓

Save profile

↓

Generate AI Profile

↓

Queue recommendation generation

↓

Return success

---

## Get Onboarding Status

```
GET

/api/v1/onboarding/status
```

Returns

Completed?

Missing fields?

---

# DASHBOARD APIs

## Dashboard

```
GET

/api/v1/dashboard
```

Returns

Today's recommendations

Bookmarked

Applied

Closing Soon

Hidden Gems

Notification Count

This should become

ONE API

to reduce frontend requests.

---

# PROFILE APIs

## Get Profile

```
GET

/api/v1/profile
```

---

## Update Profile

```
PATCH

/api/v1/profile
```

Flow

Update profile

↓

Regenerate AI Profile

↓

Invalidate Redis Cache

↓

Queue recommendation refresh

---

# OPPORTUNITY APIs

## Discover

```
GET

/api/v1/opportunities
```

Supports

Search

Filters

Pagination

Category

Location

Remote

Women Only

Deadline

Example

```
?page=1

&limit=20

&category=internship

&remote=true
```

---

## Opportunity Details

```
GET

/api/v1/opportunities/:id
```

Returns

Complete opportunity.

AI explanation.

Organization.

Related opportunities.

---

# RECOMMENDATION APIs

## Personalized Feed

```
GET

/api/v1/recommendations
```

Flow

Redis?

↓

Yes

↓

Return

No

↓

Generate

↓

Cache

↓

Return

---

## Refresh Recommendations

```
POST

/api/v1/recommendations/refresh
```

Force regeneration.

Used after

Profile updates.

---

# BOOKMARK APIs

## Bookmark

```
POST

/api/v1/bookmarks
```

Body

Opportunity ID

---

## Remove Bookmark

```
DELETE

/api/v1/bookmarks/:id
```

---

## List Bookmarks

```
GET

/api/v1/bookmarks
```

---

# APPLICATION APIs

## Mark Applied

```
POST

/api/v1/applications
```

Body

Opportunity ID

Status

Notes

---

## Update Application

```
PATCH

/api/v1/applications/:id
```

---

## List Applications

```
GET

/api/v1/applications
```

---

# NOTIFICATION APIs

## Get Notifications

```
GET

/api/v1/notifications
```

---

## Mark Read

```
PATCH

/api/v1/notifications/:id
```

---

# SEARCH API

## Search

```
GET

/api/v1/search
```

Supports

Keyword

Tags

Skills

Category

Organization

Remote

Location

Should NOT call AI.

MongoDB only.

---

# ADMIN APIs

These are not exposed publicly.

---

## Trigger Discovery

```
POST

/api/v1/admin/discovery/run
```

Runs Discovery Workflow.

---

## Source Status

```
GET

/api/v1/admin/sources
```

Shows

Connector health.

---

## Queue Status

```
GET

/api/v1/admin/queue
```

---

## System Metrics

```
GET

/api/v1/admin/metrics
```

Shows

Jobs

Errors

Discovery statistics

---

# SYSTEM APIs

## Health Check

```
GET

/api/v1/health
```

Returns

API

Mongo

Redis

LLM

Status

---

# Request Lifecycle

```
Frontend

↓

Route

↓

Controller

↓

Service

↓

AI Capability Layer (only if needed)

↓

Repository

↓

MongoDB

↓

Response
```

Controllers should never contain business logic.

---

# Standard Response Format

Success

```json
{
  "success": true,
  "data": {},
  "message": "Profile updated successfully"
}
```

Error

```json
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Profile not found"
  }
}
```

Every endpoint follows the same format.

---

# Pagination

Standard

```
?page=1

&limit=20
```

Response

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 253,
    "hasNext": true
  }
}
```

---

# Error Codes

Examples

```
UNAUTHORIZED

PROFILE_NOT_FOUND

INVALID_REQUEST

OPPORTUNITY_NOT_FOUND

CACHE_ERROR

AI_ERROR

DATABASE_ERROR

VALIDATION_ERROR
```

---

# Security

- Firebase Authentication
- Zod Validation
- Rate Limiting
- Helmet
- CORS
- Input Sanitization

---

# Future APIs

Career GPS

```
POST

/api/v1/career-roadmap
```

Skill Gap

```
GET

/api/v1/skill-gap
```

Career Timeline

```
GET

/api/v1/career-timeline
```

AI Mentor

```
POST

/api/v1/mentor/chat
```

Because of the current architecture, these fit naturally without redesigning existing APIs.

---

# Engineering Principles

1.

Expose business capabilities.

Never expose collections.

---

2.

Controllers should orchestrate.

Services should decide.

---

3.

One dashboard request should populate the entire home screen.

Avoid unnecessary frontend round trips.

---

4.

AI should only execute through the AI Capability Layer.

Controllers and services should never directly invoke providers.

---

5.

Every endpoint should have a single responsibility.

---

# North Star

Scout's APIs should feel like conversations with a product, not queries against a database.

The frontend asks,

"Help this user discover opportunities."

It should never have to ask,

"Give me rows from the opportunities collection."

---

# Architecture Improvement
## Introducing the Use Case Layer

### Why?

As Scout grows, traditional Controller → Service architectures become difficult to maintain.

Example

```
Controller

↓

Service

↓

Repository
```

Initially this looks simple.

However, over time Service files become responsible for multiple business operations and often grow into large files containing hundreds of lines of code.

Example

```
ProfileService.ts

- Create Profile
- Update Profile
- Delete Profile
- Generate AI Profile
- Refresh Recommendations
- Invalidate Cache
- Update Activity
- Send Notification
```

Eventually the service no longer has a single responsibility.

---

# Proposed Architecture

Scout introduces one additional layer.

```
Route

↓

Controller

↓

Use Case

↓

Service

↓

Repository
```

---

# Layer Responsibilities

## Route

Responsibilities

- API Endpoint
- Authentication Middleware
- Validation Middleware

No business logic.

---

## Controller

Responsibilities

- Read Request
- Call appropriate Use Case
- Return Response

Controllers should remain extremely thin.

Example

```
Request

↓

Controller

↓

Use Case.execute()

↓

Response
```

---

## Use Case

This layer represents Scout's business actions.

Each use case performs exactly one user action.

Examples

```
CompleteOnboardingUseCase

GenerateRecommendationsUseCase

BookmarkOpportunityUseCase

RefreshRecommendationsUseCase

UpdateProfileUseCase

MarkOpportunityAppliedUseCase

RunDiscoveryWorkflowUseCase
```

A Use Case coordinates multiple services if required.

It becomes the "brain" of a single business operation.

---

## Service

Services contain reusable domain logic.

Examples

```
UserService

ProfileService

OpportunityService

RecommendationService

DiscoveryService

NotificationService

AIService
```

Unlike Use Cases,

Services should not represent user actions.

They expose reusable capabilities.

Example

```
ProfileService

↓

generateAIProfile()

saveProfile()

updateProfile()

invalidateCache()
```

These methods may be used by multiple Use Cases.

---

## Repository

Repositories communicate with MongoDB.

Responsibilities

- Queries
- Inserts
- Updates
- Deletes

Repositories never contain business logic.

---

# Example Flow

## User Completes Onboarding

```
POST /onboarding

↓

OnboardingController

↓

CompleteOnboardingUseCase

↓

ProfileService

↓

AI Capability Layer

↓

RecommendationService

↓

Redis

↓

ProfileRepository

↓

MongoDB
```

Notice

The Controller never knows

- how AI works
- how recommendations are generated
- how Redis is updated

It only delegates to the Use Case.

---

# Example Responsibilities

## CompleteOnboardingUseCase

Responsible for

- Validate profile
- Save profile
- Generate AI Profile
- Generate recommendations
- Cache recommendations
- Return dashboard

Everything required for onboarding exists in one place.

---

## UpdateProfileUseCase

Responsible for

- Update profile
- Rebuild AI profile
- Clear recommendation cache
- Trigger recommendation regeneration

Again

One business action.

One file.

---

## BookmarkOpportunityUseCase

Responsible for

- Save bookmark
- Log activity
- Update recommendation signals

---

# Folder Structure

```
src/

use-cases/

│

├── onboarding/

│   └── CompleteOnboarding.usecase.ts

│

├── profile/

│   ├── UpdateProfile.usecase.ts

│   └── GetProfile.usecase.ts

│

├── recommendations/

│   ├── GenerateRecommendations.usecase.ts

│   └── RefreshRecommendations.usecase.ts

│

├── opportunities/

│   ├── BookmarkOpportunity.usecase.ts

│   ├── ApplyOpportunity.usecase.ts

│   └── SearchOpportunities.usecase.ts
```

Every file represents one business capability.

---

# Benefits

Compared to a Controller → Service architecture

Scout gains

✅ Better separation of concerns

✅ Smaller service files

✅ One business action per file

✅ Easier debugging

✅ Easier testing

✅ Easier onboarding for contributors

✅ Better scalability as the product grows

---

# Design Principles

1.

Controllers orchestrate.

They never make business decisions.

---

2.

Use Cases represent business workflows.

One workflow.

One file.

---

3.

Services provide reusable capabilities.

They should remain independent of specific user actions.

---

4.

Repositories only communicate with the database.

No business logic.

---

5.

Use Cases are the only layer allowed to coordinate multiple services.

This keeps orchestration centralized and predictable.

---

# Engineering Philosophy

Scout is built around business capabilities rather than technical layers.

Instead of asking

> "Which service should handle this?"

Scout asks

> "Which business action is being performed?"

Every business action becomes a dedicated Use Case.

This keeps the architecture modular, testable, and easy to extend as Scout evolves beyond the hackathon.---

# Architecture Improvement
## Introducing the Use Case Layer

### Why?

As Scout grows, traditional Controller → Service architectures become difficult to maintain.

Example

```
Controller

↓

Service

↓

Repository
```

Initially this looks simple.

However, over time Service files become responsible for multiple business operations and often grow into large files containing hundreds of lines of code.

Example

```
ProfileService.ts

- Create Profile
- Update Profile
- Delete Profile
- Generate AI Profile
- Refresh Recommendations
- Invalidate Cache
- Update Activity
- Send Notification
```

Eventually the service no longer has a single responsibility.

---

# Proposed Architecture

Scout introduces one additional layer.

```
Route

↓

Controller

↓

Use Case

↓

Service

↓

Repository
```

---

# Layer Responsibilities

## Route

Responsibilities

- API Endpoint
- Authentication Middleware
- Validation Middleware

No business logic.

---

## Controller

Responsibilities

- Read Request
- Call appropriate Use Case
- Return Response

Controllers should remain extremely thin.

Example

```
Request

↓

Controller

↓

Use Case.execute()

↓

Response
```

---

## Use Case

This layer represents Scout's business actions.

Each use case performs exactly one user action.

Examples

```
CompleteOnboardingUseCase

GenerateRecommendationsUseCase

BookmarkOpportunityUseCase

RefreshRecommendationsUseCase

UpdateProfileUseCase

MarkOpportunityAppliedUseCase

RunDiscoveryWorkflowUseCase
```

A Use Case coordinates multiple services if required.

It becomes the "brain" of a single business operation.

---

## Service

Services contain reusable domain logic.

Examples

```
UserService

ProfileService

OpportunityService

RecommendationService

DiscoveryService

NotificationService

AIService
```

Unlike Use Cases,

Services should not represent user actions.

They expose reusable capabilities.

Example

```
ProfileService

↓

generateAIProfile()

saveProfile()

updateProfile()

invalidateCache()
```

These methods may be used by multiple Use Cases.

---

## Repository

Repositories communicate with MongoDB.

Responsibilities

- Queries
- Inserts
- Updates
- Deletes

Repositories never contain business logic.

---

# Example Flow

## User Completes Onboarding

```
POST /onboarding

↓

OnboardingController

↓

CompleteOnboardingUseCase

↓

ProfileService

↓

AI Capability Layer

↓

RecommendationService

↓

Redis

↓

ProfileRepository

↓

MongoDB
```

Notice

The Controller never knows

- how AI works
- how recommendations are generated
- how Redis is updated

It only delegates to the Use Case.

---

# Example Responsibilities

## CompleteOnboardingUseCase

Responsible for

- Validate profile
- Save profile
- Generate AI Profile
- Generate recommendations
- Cache recommendations
- Return dashboard

Everything required for onboarding exists in one place.

---

## UpdateProfileUseCase

Responsible for

- Update profile
- Rebuild AI profile
- Clear recommendation cache
- Trigger recommendation regeneration

Again

One business action.

One file.

---

## BookmarkOpportunityUseCase

Responsible for

- Save bookmark
- Log activity
- Update recommendation signals

---

# Folder Structure

```
src/

use-cases/

│

├── onboarding/

│   └── CompleteOnboarding.usecase.ts

│

├── profile/

│   ├── UpdateProfile.usecase.ts

│   └── GetProfile.usecase.ts

│

├── recommendations/

│   ├── GenerateRecommendations.usecase.ts

│   └── RefreshRecommendations.usecase.ts

│

├── opportunities/

│   ├── BookmarkOpportunity.usecase.ts

│   ├── ApplyOpportunity.usecase.ts

│   └── SearchOpportunities.usecase.ts
```

Every file represents one business capability.

---

# Benefits

Compared to a Controller → Service architecture

Scout gains

✅ Better separation of concerns

✅ Smaller service files

✅ One business action per file

✅ Easier debugging

✅ Easier testing

✅ Easier onboarding for contributors

✅ Better scalability as the product grows

---

# Design Principles

1.

Controllers orchestrate.

They never make business decisions.

---

2.

Use Cases represent business workflows.

One workflow.

One file.

---

3.

Services provide reusable capabilities.

They should remain independent of specific user actions.

---

4.

Repositories only communicate with the database.

No business logic.

---

5.

Use Cases are the only layer allowed to coordinate multiple services.

This keeps orchestration centralized and predictable.

---

# Engineering Philosophy

Scout is built around business capabilities rather than technical layers.

Instead of asking

> "Which service should handle this?"

Scout asks

> "Which business action is being performed?"

Every business action becomes a dedicated Use Case.

This keeps the architecture modular, testable, and easy to extend as Scout evolves beyond the hackathon.