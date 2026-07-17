# PHASE_3_OPPORTUNITY_INTELLIGENCE_V2.md

> **Version:** Scout MVP V2
>
> This phase transforms Scout from an opportunity collector into an opportunity intelligence engine.
>
> By the end of this phase, every opportunity stored inside Scout should be deeply understood, scored, classified, and connected to the ecosystem it belongs to.
>
> The Recommendation Engine should consume enriched opportunity intelligence rather than raw scraped data.

---

# Objective

Discovery finds opportunities.

Opportunity Intelligence understands them.

Instead of storing only:

- title
- description
- organization
- deadline

Scout should answer questions like:

- Is this worth applying to?
- Who is this best suited for?
- Is this difficult to get?
- Does this help build a portfolio?
- Is this a hidden gem?
- What ecosystem produced this opportunity?

---

# Philosophy

Every opportunity should become an intelligent profile.

Think of it like creating a resume for the opportunity itself.

Instead of storing raw information, Scout should understand:

- value
- competitiveness
- relevance
- difficulty
- rarity
- student fit

---

# Core Intelligence Signals

Every Opportunity document should gradually accumulate intelligence.

---

## 1. Hidden Gem Score

Purpose:

Estimate how underrated an opportunity is.

High score examples:

- startup internship
- university lab
- research center
- government internship
- incubator startup
- niche fellowship

Low score examples:

- Google
- Microsoft
- Amazon
- Adobe
- Infosys
- TCS

Factors:

- organization popularity
- source popularity
- estimated applicant volume
- social visibility
- ecosystem reputation

---

## 2. Student Relevance Score

How suitable is this opportunity for Scout's MVP audience?

Target persona:

Indian engineering college girls
1st–4th year

Signals:

+ accepts undergraduates

+ internship

+ beginner friendly

+ engineering domain

+ portfolio building

+ learning opportunity

Penalty:

requires 3+ years experience

requires full-time employee

senior engineer

management hiring

---

## 3. Competition Estimate

Estimate:

LOW

MEDIUM

HIGH

VERY HIGH

Signals include:

- company popularity
- opportunity popularity
- public awareness
- ecosystem
- organization size
- remote/global availability

Example:

Google SWE Internship

↓

VERY HIGH

Small Gurgaon AI Startup

↓

LOW

---

## 4. Resume Strength Needed

Estimate required applicant strength.

Possible values:

BEGINNER

INTERMEDIATE

ADVANCED

ELITE

Estimated from:

required skills

project complexity

experience requirement

organization prestige

---

## 5. Skill Match Potential

Generate a normalized list of technical domains.

Example:

React

Node.js

LLMs

Python

Computer Vision

Embedded

Cybersecurity

Cloud

Data Science

Mobile

DevOps

These become searchable later.

---

## 6. Portfolio Value

How much will this strengthen a student's resume?

Scale:

1–10

High value:

Google Summer of Code

ISRO Internship

Outreachy

IISc Research

Hackathon Winner

Medium:

Startup Internship

Campus Ambassador

Workshop

Lower:

Short webinars

---

## 7. Early Career Friendliness

Estimate whether beginners have a realistic chance.

Values:

Excellent

Good

Moderate

Poor

Factors:

experience requirements

CGPA

interview difficulty

student focus

---

## 8. Remote Friendliness

Classify:

Remote

Hybrid

Onsite

Flexible

Unknown

---

## 9. Learning Potential

Estimate:

How much will a student actually learn?

Signals:

mentorship

research

real projects

modern technologies

internship duration

---

## 10. Career Impact

Estimate long-term value.

Example:

Startup internship

↓

Great experience

Moderate brand

Google internship

↓

Huge brand

Strong career signal

Research fellowship

↓

Strong academic signal

Different impact profile.

---

# Opportunity Graph

This is Scout's long-term competitive advantage.

Instead of storing isolated opportunities:

Company

↓

Opportunity

Scout builds:

Ecosystem

↓

Organization

↓

Opportunity

↓

Student Persona

Example:

Peak XV

↓

Atomicwork

↓

Frontend Internship

↓

2nd-year React students

---

Another example:

IIT Delhi Incubator

↓

Startup ABC

↓

ML Internship

↓

3rd-year AI students

---

Another example:

ISRO

↓

Student Internship

↓

Electronics Engineering

↓

2nd–4th year ECE students

---

Eventually Scout understands:

where opportunities originate

rather than simply

where opportunities are posted.

---

# Ecosystem Types

Examples:

Startup Accelerator

University

Government

Research Lab

Open Source Foundation

Big Tech

Incubator

VC Portfolio

Developer Community

Non-profit

International Organization

---

# Organization Intelligence

Every organization should slowly accumulate metadata.

Example:

Organization

Atomicwork

Type

Startup

Founded

2022

Stage

Series A

Industry

Developer Tools

Location

Bangalore

Hiring Frequency

High

Student Friendly

Yes

Internships Per Year

4

Hidden Gem Rating

9.2

---

# Opportunity Relationships

Scout should eventually know:

Organization

↓

Previous internships

↓

Current internships

↓

Hackathons

↓

Open source

↓

Scholarships

↓

Research

This creates a living graph rather than isolated documents.

---

# AI Enrichment Philosophy

LLMs should enrich opportunities.

They should not invent information.

If uncertain:

return Unknown

rather than hallucinating.

Confidence should accompany every inferred field.

---

# Recommendation Engine Preparation

By enriching opportunities first, the Recommendation Engine becomes simple.

Instead of asking:

"Analyze this opportunity"

it can ask:

"Rank opportunities where:

- Student Relevance > 90
- Hidden Gem > 80
- Resume Strength <= Student Skill Level
- Competition <= Medium
- Portfolio Value >= 8"

Opportunity Intelligence becomes the foundation of personalization.

---

# Success Criteria

Phase 3 is complete when:

✓ Every opportunity has intelligence scores.

✓ Student relevance is calculated.

✓ Hidden Gem scoring is reliable.

✓ Competition estimation is available.

✓ Resume strength requirements are inferred.

✓ Opportunity Graph entities are created.

✓ Organization metadata is accumulated.

✓ Recommendation Engine can consume enriched opportunities without performing expensive analysis.

---

# Guiding Principle

> Scout should not simply collect opportunities.

> Scout should understand every opportunity, the organization behind it, the ecosystem it comes from, and the type of student who is most likely to benefit from it.
