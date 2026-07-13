# Scout V2 — AI Budget & Provider Strategy

Version: 2.0
Status: Architecture Specification
Scope:
- Discovery Engine
- Recommendation Engine
- Future Learning Engine
- AI Infrastructure

---

# 1. Purpose

Scout is an early-stage product operating entirely on free-tier infrastructure.

Every API request has a real cost.

Unlike traditional SaaS products with unlimited infrastructure, Scout must maximize the value generated from every API call.

This document defines how Scout manages:

- AI providers
- API budgets
- Multiple API keys
- Rate limiting
- Quota exhaustion
- Provider fallback
- User experience during failures

This document is the single source of truth for every AI-powered component inside Scout.

---

# 2. Architectural Philosophy

Scout consists of independent systems.

Each system owns its own responsibilities.

## Discovery Engine

Purpose:

Find opportunities.

Collect opportunities.

Clean opportunities.

Store opportunities.

This engine belongs to Scout.

Users never interact with it.

---

## Recommendation Engine

Purpose:

Understand users.

Reason over opportunities.

Recommend opportunities.

This is the only engine users directly experience.

---

## Learning Engine (Future)

Purpose:

Learn user behaviour.

Improve recommendations.

Update long-term understanding.

---

## Shared Infrastructure

Infrastructure is shared.

Examples:

- MongoDB
- Redis
- Logging
- Analytics

Each engine owns its own Provider Manager.

Provider Managers are NOT shared.

---

# 3. Separation of AI Infrastructure

Discovery and Recommendation must never share API budgets.

Reason:

Discovery performs company work.

Recommendation performs user work.

One engine must never consume the other's resources.

Current architecture:

Discovery

↓

Discovery Provider Manager

↓

Discovery Providers


Recommendation

↓

Recommendation Provider Manager

↓

Recommendation Providers

---

# 4. Discovery Provider Stack

Discovery is expected to consume the largest amount of AI resources.

Its provider stack may evolve independently.

Example:

Gemini Discovery Key 1

↓

Gemini Discovery Key 2

↓

Gemini Discovery Key 3

↓

Groq Discovery Key 1

↓

Groq Discovery Key 2

↓

Discovery stops

The Discovery Engine should continue processing until every configured provider becomes unavailable.

---

# 5. Recommendation Provider Stack

Recommendation prioritizes user experience.

Example:

Gemini Personalization Key 1

↓

Gemini Personalization Key 2

↓

Groq Personalization Key 1

↓

Groq Personalization Key 2

↓

User notified of quota exhaustion

Recommendation quotas should remain protected from Discovery workloads.

---

# 6. Provider Manager

Every engine owns a Provider Manager.

Responsibilities:

- choose provider

- retry temporary failures

- rotate providers

- monitor provider health

- expose provider analytics

Provider Managers should contain no business logic.

They only decide which provider should execute the request.

---

# 7. API Key Strategy

The system should support multiple API keys per provider.

Avoid configurations like:

DISCOVERY_API_KEY_2

DISCOVERY_API_KEY_3

DISCOVERY_API_KEY_4

Instead maintain ordered provider pools.

Example:

Discovery Gemini Keys

- Key 1
- Key 2
- Key 3

Discovery Groq Keys

- Key 1
- Key 2

Recommendation Gemini Keys

- Key 1
- Key 2

Recommendation Groq Keys

- Key 1
- Key 2

The Provider Manager iterates through these pools when necessary.

---

# 8. Error Classification

Not every provider failure should trigger provider rotation.

Scout distinguishes between temporary failures and permanent failures.

---

## Temporary Failures

Examples:

- HTTP 429
- Timeout
- Network interruption
- HTTP 500
- HTTP 503

Meaning:

The provider is healthy.

The request arrived too quickly or temporarily failed.

Action:

Retry the SAME provider.

Never rotate immediately.

---

## Permanent Failures

Examples:

- Quota exhausted
- Invalid API key
- Disabled account
- Authentication failure

Meaning:

The provider cannot recover during this run.

Action:

Rotate to the next configured provider.

---

## Fatal Request Errors

Examples:

- Invalid prompt
- Invalid schema
- Request exceeds context window

Meaning:

The request itself is incorrect.

Action:

Fail immediately.

Do not retry.

Do not rotate providers.

---

# 9. Rate Limiting Strategy

429 responses must NOT trigger provider rotation.

Reason:

Changing API keys does not increase the provider's throughput.

It only wastes available providers.

Correct behaviour:

429

↓

Exponential Backoff

↓

Retry Same Provider

↓

Success

Only after repeated failures beyond configured retry limits should the provider be marked temporarily unavailable.

---

# 10. Quota Exhaustion Strategy

Quota exhaustion is fundamentally different.

Example:

RESOURCE_EXHAUSTED

or

Daily quota exceeded

Action:

Immediately rotate to the next configured API key.

Example:

Gemini Key 1

↓

Quota exhausted

↓

Gemini Key 2

↓

Quota exhausted

↓

Gemini Key 3

↓

Groq

↓

Failure

---

# 11. Discovery Engine Budget

Discovery exists to improve Scout's opportunity database.

Users never trigger Discovery directly.

Therefore Discovery may consume larger AI budgets.

The Discovery Engine should prioritise:

- completeness

- opportunity quality

- database freshness

rather than response latency.

---

# 12. Recommendation Budget

Recommendation exists for users.

Therefore recommendation AI usage must remain conservative.

For MVP:

Every user receives:

1 Premium AI Recommendation Request

per day.

Future versions may introduce dynamic quotas.

---

# 13. Graceful User Experience

If all recommendation providers become unavailable:

Never expose raw provider errors.

Instead show:

"Scout's AI capacity has been fully utilized today due to high demand.

We're currently operating on limited infrastructure while building Scout.

Please come back tomorrow after our daily quota resets."

Always be transparent.

Never fabricate AI responses.

---

# 14. Firecrawl Strategy

Firecrawl belongs exclusively to Discovery.

Recommendation must never invoke Firecrawl.

Firecrawl workflow:

Cache

↓

Fresh?

↓

Yes

↓

Reuse

↓

No

↓

Firecrawl

↓

Store cache

↓

Continue

The same URL should never be crawled repeatedly without reason.

---

# 15. Discovery Cost Optimisation

Discovery should avoid unnecessary AI usage.

Pipeline:

Candidate URLs

↓

Firecrawl

↓

Deterministic Validation

↓

Heuristic Filtering

↓

AI Extraction

↓

Quality Score

↓

Database

Only high-quality pages should reach AI extraction.

---

# 16. Observability

Every Provider Manager should expose:

Current Provider

Current API Key

Retry Count

Quota Status

429 Count

Failures

Latency

Provider Rotation History

These metrics feed the Discovery Dashboard during development.

---

# 17. Development Dashboard

Development builds may expose:

Run Discovery

Stop Discovery

Dry Run

Estimated API Usage

Current Provider

Current API Key

Current Stage

Current Queue Size

429 Counter

Quota Remaining

Provider Health

Live Logs

These controls must NEVER be included in production builds.

---

# 18. Future Expansion

This architecture should support adding providers without changing engine logic.

Possible additions:

Search

- Brave
- SerpAPI

Crawler

- Browserbase
- Jina AI

LLMs

- Claude
- OpenAI
- DeepSeek
- Mistral
- Llama

Only Provider Managers should require modification.

---

# 19. Success Criteria

The architecture is successful when:

✓ Discovery and Recommendation remain completely independent.

✓ Discovery never consumes Recommendation budgets.

✓ Users receive predictable AI behaviour.

✓ Temporary failures do not waste provider pools.

✓ Quota exhaustion automatically rotates providers.

✓ Every AI request is observable.

✓ Development provides complete visibility.

✓ Production remains stable on free-tier infrastructure.

---

# Final Principle

Scout is an intelligence platform.

Every API request is an investment.

Every investment should either:

- improve the Opportunity Database,
- improve the User Experience,
- or not be made at all.