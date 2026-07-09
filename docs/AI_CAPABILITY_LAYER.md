# AI_CAPABILITY_LAYER.md

# Scout AI Capability Layer
### Business Capabilities, Not Model Calls

> "The application should never ask an LLM to generate text.
>
> It should ask Scout to perform a business capability."

---

# Why This Layer Exists

Large Language Models are infrastructure.

They are NOT business logic.

The rest of Scout should never know

- which provider is used
- which model is used
- how prompts are written
- how structured outputs are validated

Those responsibilities belong to the AI Layer.

---

# Philosophy

❌ Bad

Application

↓

Gemini

↓

Response

---

✅ Good

Application

↓

AI Capability

↓

LLM Gateway

↓

Provider

↓

Response

---

The application thinks in business capabilities.

The AI Layer thinks in prompts.

The LLM Gateway thinks in providers.

---

# High-Level Architecture

```
                    Application

                         │

        ┌────────────────┴────────────────┐

        │                                 │

        ▼                                 ▼

 Discovery Capabilities         Personalization Capabilities

        │                                 │

        └────────────────┬────────────────┘

                         ▼

                  Unified AI Layer

                         ▼

                  Unified LLM Gateway

                         ▼

       Gemini / Claude / Groq / OpenRouter
```

---

# Layer Responsibilities

Application

↓

Business logic

Controllers

Routes

Workers

Jobs

Should NEVER import an LLM SDK.

---

AI Capability Layer

↓

Business Intelligence

Responsibilities

- Prepare prompts
- Select schemas
- Call the LLM Gateway
- Validate responses
- Return typed objects

---

LLM Gateway

↓

Provider abstraction

Responsibilities

- Select provider
- Select model
- Retry
- Fallback
- Token logging
- Cost logging

---

Provider

↓

Gemini

Groq

Claude

OpenRouter

Ollama

---

# Discovery Capabilities

The Discovery Engine should never write prompts.

Instead it should call capabilities.

Examples

```
extractOpportunity()

detectOpportunity()

classifyOpportunity()

calculateTrustSignals()

generateOpportunitySummary()
```

These functions return structured objects.

---

# Personalization Capabilities

```
buildAIProfile()

rankOpportunities()

generateRecommendationReason()

summarizeCareerProfile()

suggestSkillFocus()
```

Again,

No prompts outside this layer.

---

# Folder Structure

```
src/

ai/

│

├── capabilities/

│   ├── discovery/

│   │

│   ├── personalization/

│   │

│   └── shared/

│

├── gateway/

│

├── prompts/

│

├── schemas/

│

├── providers/

│

└── utils/
```

---

# Discovery Capability Example

Application

```
Discovery Worker
```

calls

```
extractOpportunity(page)
```

NOT

```
gemini.generate(...)
```

---

Inside

extractOpportunity()

Scout

- loads prompt
- loads schema
- calls gateway
- validates JSON
- returns typed object

The worker never sees prompts.

---

# Personalization Example

Dashboard

↓

```
rankOpportunities(profile, candidates)
```

↓

Capability

↓

Gateway

↓

Gemini

↓

Typed Recommendation[]

The Dashboard never knows which model was used.

---

# Prompt Ownership

Each capability owns its prompt.

Example

```
extractOpportunity()

↓

extractOpportunity.prompt.ts
```

```
rankOpportunities()

↓

rankOpportunities.prompt.ts
```

No shared giant prompt file.

Every capability owns

- prompt
- schema
- parser

---

# Schema Ownership

Every capability owns

```
Input

↓

Prompt

↓

Output Schema
```

Example

```
ExtractOpportunitySchema

RecommendationSchema

ProfileSchema
```

Validation happens immediately.

---

# Error Handling

Capability

↓

Gateway

↓

Retry

↓

Fallback

↓

Return Typed Error

The application should never receive raw provider errors.

---

# Logging

Every capability automatically logs

Provider

Model

Latency

Token Usage

Workflow

Cost Estimate

Prompt Version

Application code writes zero logging.

---

# Future Model Routing

Today

```
extractOpportunity()

↓

Gemini
```

Tomorrow

```
extractOpportunity()

↓

Claude
```

No application code changes.

---

Today

```
rankOpportunities()

↓

Gemini
```

Tomorrow

```
rankOpportunities()

↓

Reasoning Model
```

Again

No application changes.

---

# Testing

Capabilities should be testable independently.

Mock

Gateway

↓

Test

Capability

No internet required.

---

# Benefits

Application becomes

Cleaner

More readable

Typed

Model agnostic

Prompt agnostic

Provider agnostic

Future proof

---

# Engineering Rules

1.

Never import an AI SDK outside the Gateway.

---

2.

Never write prompts outside Capabilities.

---

3.

Never expose raw LLM responses.

---

4.

Always validate structured outputs.

---

5.

Every capability should perform exactly one business task.

---

6.

The application should think in business language.

Not AI language.

---

# Example API

Discovery

```
detectOpportunity()

extractOpportunity()

classifyOpportunity()

generateSummary()
```

Personalization

```
buildAIProfile()

rankOpportunities()

generateRecommendationReason()

suggestNextSteps()
```

Shared

```
generateEmbeddings()

summarize()

translate()

moderate()
```

---

# Long-Term Vision

As Scout grows, dozens of AI capabilities may exist.

The application will continue calling simple business functions.

No route, controller, service or worker will ever know

- which prompt exists
- which model answered
- which provider was used

That responsibility belongs entirely to the AI Layer.

---

# North Star

Scout should not be built around Large Language Models.

It should be built around business intelligence capabilities.

Models will change.

Capabilities will remain.