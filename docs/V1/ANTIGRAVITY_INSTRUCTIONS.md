# ANTIGRAVITY_INSTRUCTIONS.md

# Scout Engineering Constitution

> This document defines the engineering principles that MUST be followed while implementing Scout.
>
> These rules override convenience.
>
> Every architectural decision should respect this document.

---

# Mission

Scout is **not** another opportunity portal.

Scout is an **AI Opportunity Intelligence Platform**.

Our goal is not to display opportunities.

Our goal is to discover, understand, rank and explain opportunities better than anyone else.

Every feature should strengthen this mission.

---

# Core Philosophy

Optimize for

- Product Quality
- Maintainability
- Scalability
- Simplicity
- User Experience

Never optimize for

- Number of features
- Number of dependencies
- Clever code
- Premature optimization

---

# Product First

Every engineering decision should improve the product.

Before implementing anything ask

> Does this make Scout more useful for the user?

If not,

don't build it.

---

# Build Vertical Slices

Never build

Frontend

↓

Backend

↓

Database

↓

AI

Instead build

Feature

↓

Complete feature

↓

Commit

↓

Next feature

Every few hours,

Scout should remain demoable.

---

# Read Before Building

Before generating code,

understand

- PRD
- System Architecture
- Discovery Engine
- Personalization Engine
- Database Schema
- API Design
- UI Design Principles
- Tech Stack

Never make assumptions when documentation already exists.

---

# Single Source of Truth

Documentation is the source of truth.

If implementation conflicts with documentation,

documentation wins.

---

# One Tool. One Responsibility.

Never introduce overlapping technologies.

Example

Correct

Zod → Validation

Redis → Cache

MongoDB → Storage

LangGraph → Workflow

Wrong

Multiple validation libraries

Multiple state managers

Multiple ORMs

Multiple HTTP clients

---

# Unified AI Layer

Never call an LLM directly.

Always

Capability

↓

Gateway

↓

Provider

↓

LLM

Every provider must be replaceable without changing business logic.

---

# AI Capability Layer

Business logic must never contain prompts.

Prompts belong only inside AI Capabilities.

Example

Correct

GenerateRecommendationsCapability

Wrong

Prompt inside Controller

---

# Provider Independence

Never write Gemini-specific business logic.

Every provider must support

generate()

stream()

structuredOutput()

Future providers

Claude

Groq

OpenAI

Mistral

OpenRouter

Ollama

should require only provider implementation.

Nothing else.

---

# Discovery & Personalization Separation

Maintain two independent AI workflows.

Discovery Workflow

Purpose

Global opportunity intelligence.

Personalization Workflow

Purpose

User-specific reasoning.

Never mix responsibilities.

Never reuse API keys.

Never reuse provider configuration.

---

# Business Logic

Business logic belongs only inside Use Cases.

Controllers orchestrate.

Services provide reusable capabilities.

Repositories access data.

Never mix these responsibilities.

---

# Controllers

Controllers should

- Validate requests
- Call one Use Case
- Return responses

Controllers should never

- Query databases
- Call AI
- Contain business logic
- Build prompts

Aim for fewer than 50 lines.

---

# Use Cases

Each Use Case represents exactly one business action.

Examples

CompleteOnboarding

GenerateRecommendations

BookmarkOpportunity

SearchOpportunities

RefreshRecommendations

Do not combine multiple user actions into one Use Case.

---

# Services

Services expose reusable functionality.

Examples

OpportunityService

RecommendationService

ProfileService

NotificationService

AIService

Services should not orchestrate workflows.

---

# Repositories

Repositories only communicate with MongoDB.

No business logic.

No AI.

No caching.

---

# Validation

Everything is validated.

API Requests

↓

Zod

AI Responses

↓

Zod

Environment Variables

↓

Zod

Shared Types

↓

Zod

Never trust external input.

---

# TypeScript

Avoid

any

Prefer

strict typing

Type inference

Shared interfaces

Shared schemas

---

# Code Style

Readable code beats clever code.

Small functions.

Descriptive names.

Early returns.

Minimal nesting.

Maximum clarity.

---

# Error Handling

Fail gracefully.

Every API should return meaningful errors.

Never expose internal stack traces.

Never silently ignore failures.

---

# Logging

Log

Workflow start

Workflow completion

Errors

Provider failures

Retries

Never log API keys.

Never log sensitive user information.

---

# Caching

Cache expensive operations.

Examples

Recommendations

AI summaries

Discovery results

Never cache mutable user data unnecessarily.

---

# AI Usage

Only use reasoning where intelligence is required.

Examples

Opportunity extraction

Recommendation ranking

Explanation generation

Do NOT use AI for

Filtering

Sorting

Pagination

Simple calculations

Database queries

Eligibility checks that code can perform

Code first.

Reasoning second.

---

# External Integrations

Prefer existing tools before writing custom implementations.

Use

Firecrawl

Brave Search

Firebase

Redis

MongoDB

before writing custom systems.

---

# UI Principles

Follow UI_UX_DESIGN_PRINCIPLES.md.

Do not invent a different design language.

Scout should feel

Calm

Editorial

Premium

Intelligent

Never clutter the interface.

---

# Component Philosophy

Build reusable components.

Avoid duplicate UI.

If similar components exist,

extend them.

---

# Naming

Prefer descriptive names.

Examples

GenerateRecommendationsUseCase

OpportunityRepository

DiscoveryWorkflow

Avoid

Helper1

Utils2

DataService

Manager

Processor

Generic names reduce readability.

---

# Commits

Every completed milestone deserves a commit.

Write meaningful commit messages.

Do not combine unrelated work.

---

# Performance

Measure before optimizing.

Avoid premature optimization.

Optimize only where it improves user experience.

---

# Security

Never hardcode secrets.

Never expose API keys.

Validate every request.

Sanitize every external input.

Use least privilege.

---

# Accessibility

Keyboard navigation.

Semantic HTML.

Visible focus states.

Proper contrast.

Accessibility is required.

---

# Documentation

When introducing

Architecture

Workflow

Integration

Complex logic

Update documentation.

Documentation should evolve with implementation.

---

# When Unsure

Prefer

Simpler

Cleaner

More maintainable

solution.

Do not build speculative abstractions.

---

# Non-Negotiables

Never bypass the Unified AI Gateway.

Never bypass the AI Capability Layer.

Never write prompts inside controllers.

Never duplicate business logic.

Never bypass validation.

Never ignore documentation.

Never introduce unnecessary dependencies.

Never sacrifice readability for cleverness.

---

# Definition of Success

Scout succeeds when a woman can

1. Sign in.
2. Complete onboarding.
3. Receive highly relevant opportunities.
4. Understand why they were recommended.
5. Feel that Scout genuinely saved her time.

If a feature does not contribute toward that journey,

it is not a priority.

---

# Engineering Mindset

Write code as if Scout will become a real product after the hackathon.

Ship practical solutions.

Prefer quality over quantity.

Build with intention.

Every line of code should make Scout more trustworthy, more intelligent, and more helpful.

---

# Final Principle

Don't ask

> "How can I implement this?"

Ask

> "What is the smallest, cleanest implementation that delivers a premium product experience?"

That is how Scout should be built.