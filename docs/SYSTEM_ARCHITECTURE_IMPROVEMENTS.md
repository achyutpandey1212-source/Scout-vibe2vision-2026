# System Architecture Improvements

This document contains architectural improvements and design decisions made after the initial system architecture was drafted.

These decisions should take precedence over the original architecture wherever applicable.

---

# 1. Provider Agnostic LLM Layer

## Problem

The initial architecture tightly coupled the system to Gemini.

This makes future experimentation difficult.

Switching models should NOT require changing LangGraph nodes or application logic.

---

## Decision

Introduce a Unified LLM Gateway.

Every workflow should communicate with the gateway instead of directly calling any LLM provider.

```
LangGraph

↓

LLM Gateway

↓

Provider Adapter

↓

Actual Provider
```

The application should never know whether it's talking to

- Gemini
- Claude
- Groq
- OpenRouter
- Ollama
- DeepSeek
- OpenAI

Only the gateway knows.

---

# 2. Provider Adapter Pattern

Every provider must implement the same interface.

Example

```
generate()

stream()

structuredOutput()

embeddings()
```

Each provider becomes a plug-and-play module.

Folder Structure

```
src/

llm/

    config/

    gateway/

    providers/

        gemini/

        openai/

        groq/

        openrouter/

        ollama/

        deepseek/
```

Adding a new provider should only require

- API Key
- Provider Name
- Model Name
- Provider Adapter

Nothing else in the project should change.

---

# 3. Workflow Specific Models

Scout contains two completely different AI workloads.

These should be treated independently.

## Workflow A

Discovery Intelligence

Runs every 6-8 hours.

Responsibilities

- Read webpages
- Parse opportunities
- Categorize
- Extract metadata
- Clean content
- Generate structured JSON

Heavy token usage.

Background task.

---

## Workflow B

Personalization Intelligence

Runs on user request.

Responsibilities

- Read user profile
- Rank opportunities
- Explain recommendations
- Personalize feed

Low latency.

User facing.

---

Each workflow should independently choose

- Provider
- Model
- API Key

without affecting the other.

---

# 4. Independent API Keys

The Discovery Engine and Personalization Engine must use different API keys.

Example

```
Discovery

↓

Gemini Account A
```

```
Personalization

↓

Gemini Account B
```

Reasons

- Independent rate limits
- Separate quota usage
- Better scalability
- Isolation of failures

If Discovery consumes its quota,
the user-facing recommendation engine should continue functioning.

---

# 5. Environment Configuration

The system should support independent configuration for every workflow.

Example

DISCOVERY_PROVIDER

DISCOVERY_MODEL

DISCOVERY_API_KEY

PERSONALIZATION_PROVIDER

PERSONALIZATION_MODEL

PERSONALIZATION_API_KEY

No hardcoded providers anywhere in the codebase.

---

# 6. Provider Fallback (Stretch Goal)

Every workflow should optionally define

Primary Provider

Fallback Provider

If

- Rate limited
- Timeout
- API failure

Scout automatically switches to the fallback provider.

Example

Discovery

Primary

Gemini

Fallback

OpenRouter

---

Personalization

Primary

Gemini

Fallback

Groq

---

This should happen transparently.

The rest of the application should not know a provider switch occurred.

---

# 7. LangGraph Isolation

LangGraph nodes should NEVER import provider SDKs directly.

❌ Bad

```
import { GoogleGenerativeAI } from "@google/generative-ai";
```

Inside graph nodes.

---

✅ Correct

```
llm.discovery.extractOpportunity()

llm.discovery.categorize()

llm.personalization.rank()

llm.personalization.explain()
```

The graph only communicates with the LLM Gateway.

---

# 8. Engineering Principle

Scout should never be "built around Gemini."

Scout should be built around AI capabilities.

Providers are implementation details.

The system architecture should make switching between providers take minutes instead of days.

---

# 9. Long-Term Vision

The architecture should eventually support

- Different models for different workflows
- Multiple providers simultaneously
- Local models (Ollama)
- Cloud models
- Automatic fallback
- Cost-based routing
- Latency-based routing
- Future A/B testing of models

without requiring changes to business logic.

---

# Final Philosophy

The application's intelligence should be independent of its LLM provider.

Changing AI providers should feel like changing a database connection string, not rewriting the application.