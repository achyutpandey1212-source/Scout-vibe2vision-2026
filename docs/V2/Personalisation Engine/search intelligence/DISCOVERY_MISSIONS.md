# DISCOVERY_MISSIONS.md

> **Version:** Scout MVP V2
>
> **Purpose**
>
> This document defines the five Discovery Missions that power Scout's daily discovery engine.
>
> Every daily discovery run executes exactly **one mission**.
>
> A mission owns:
>
> - Search strategy
> - Query generation
> - Crawl budget
> - Source priorities
> - Validation rules
> - Success metrics
>
> This makes Scout deterministic, measurable, and continuously improvable.

---

# 1. Design Principles

Every Discovery Mission must satisfy five principles.

## 1. Mission-first

Scout does not search for "everything."

Every search has one objective.

---

## 2. Official-first

Official sources always outrank aggregators.

Priority:

Official Career Page

↓

Official ATS

↓

Official University Portal

↓

Incubator

↓

Community Listings

↓

Search Results

---

## 3. Company-first

Whenever possible Scout discovers

Company

↓

Career Page

↓

Opportunity

instead of

Search

↓

Opportunity

---

## 4. High Precision

Finding 40 excellent internships is better than indexing 5,000 mediocre listings.

---

## 5. Engineering Only

Every mission serves undergraduate engineering students.

Non-engineering opportunities are rejected by Mission Guard.

---

# Discovery Pipeline

Mission

↓

Query Planner

↓

Search APIs

↓

Company Discovery

↓

Career Discovery

↓

Crawler

↓

Opportunity Detector

↓

Extraction

↓

Mission Guard

↓

Quality

↓

Database

---

# Mission 1 — Engineering Internships

## Objective

Become the best internship discovery engine for engineering students.

This is Scout's highest priority mission.

---

## Target Opportunities

Software Engineering

Backend

Frontend

Full Stack

AI

Machine Learning

Cybersecurity

Cloud

DevOps

Data Engineering

Data Science

Mobile

Embedded

Robotics

Systems

Game Development

Platform Engineering

SRE

---

## Primary Sources

Official Company Careers

University Career Portals

Greenhouse

Lever

Ashby

SmartRecruiters

Workable

BambooHR

Rippling

Company Blogs (Hiring)

Engineering Teams

---

## Search Intent Categories

General SWE

Backend

Frontend

AI

ML

Cloud

Security

Data

Remote

Freshers

Summer

Winter

Fall

Off-cycle

---

## Example Query Templates

software engineer internship

backend internship

frontend internship

engineering intern hiring

summer software internship

remote software internship

AI internship

ML internship

data engineering internship

cloud internship

cybersecurity internship

computer science internship

student developer internship

---

## Target Companies

Google

Microsoft

Amazon

Meta

Apple

NVIDIA

Adobe

Oracle

Salesforce

Atlassian

Uber

Stripe

Databricks

Cloudflare

OpenAI

Anthropic

Perplexity

Mistral

---

## Success Metrics

Companies Found

Career Pages Found

Internships Found

Quality Accepted

Average Trust

Engineering Relevance

---

# Mission 2 — Startup Internships

## Objective

Discover startup internships before they become widely known.

Scout should surface hidden startup opportunities.

---

## Startup Ecosystems

### International

Y Combinator

Techstars

Antler

Entrepreneur First

500 Global

---

### India

Startup India

T-Hub

NSRCEL

CIIE

Kerala Startup Mission

StartupTN

iCreate

NASSCOM

100X.VC

Peak XV

Accel

Blume

Surge

---

## Geographic Focus

Bengaluru

Hyderabad

Pune

Gurugram

Noida

Chennai

Mumbai

Ahmedabad

Kochi

Indore

---

## Discovery Strategy

Search Ecosystem

↓

Portfolio Companies

↓

Company Website

↓

Career Page

↓

ATS

↓

Internship

---

## Search Queries

YC companies hiring interns

startup software internship

AI startup internship

seed startup internship

Series A internship

GenAI internship

remote startup internship

backend startup internship

startup careers intern

engineering intern startup

---

## Crawl Priorities

Portfolio pages

↓

Company homepages

↓

Careers

↓

Jobs

↓

Engineering blogs

↓

ATS

---

## Hidden Gem Indicators

Recently funded startup

Small engineering team

No LinkedIn posting

Official career page only

Open-source startup

Engineering-first company

---

## Success Metrics

Portfolio Companies

Career Pages

Internships

Hidden Gem Score

Startup Diversity

Funding Stage Diversity

---

# Mission 3 — Government Tech Internships

## Objective

Discover technical internships offered by government organizations.

---

## Organizations

ISRO

DRDO

CDAC

NIC

BISAG-N

BEL

BHEL

HAL

ECIL

MeitY

Digital India

AICTE

DST

IISc

IITs

IIITs

NITs

Research Centres

---

## Search Queries

government internship engineering

ISRO internship

DRDO internship

CDAC internship

NIC internship

AICTE internship

MeitY internship

research internship government

cybersecurity government internship

---

## Priority Sources

Official portals

Government announcements

Institute portals

Research labs

---

## Success Metrics

Government Organizations

Research Labs

Internships

Application Windows

---

# Mission 4 — Research Internships

## Objective

Discover technical research opportunities.

---

## Focus Areas

Artificial Intelligence

Machine Learning

Computer Vision

NLP

Robotics

Cybersecurity

Distributed Systems

Operating Systems

Databases

Quantum Computing

Human Computer Interaction

Embedded Systems

---

## Target Organizations

IITs

IIITs

IISc

Microsoft Research

Google Research

DeepMind

FAIR

OpenAI

Anthropic

NVIDIA Research

Adobe Research

IBM Research

---

## Search Queries

research internship AI

ML research internship

computer vision internship

robotics internship

summer research program

research assistant engineering

NLP internship

systems internship

---

## Priority Sources

Lab websites

Faculty pages

Research groups

University portals

---

## Success Metrics

Labs Found

Research Programs

Research Internships

University Diversity

---

# Mission 5 — Hackathons

## Objective

Become the best engineering hackathon discovery engine.

---

## Target Types

AI

ML

Blockchain

Cybersecurity

Cloud

Open Source

College

International

Company

University

---

## Target Platforms

Devpost

Unstop

MLH

Devfolio

Hack2Skill

AngelHack

ETHGlobal

Google

Microsoft

AWS

NVIDIA

GitHub

---

## Search Queries

AI hackathon

engineering hackathon

student hackathon

cybersecurity CTF

cloud hackathon

ML competition

coding competition

open source hackathon

---

## Prioritization Signals

Prize Pool

Registration Count

Student Friendly

Remote

Resume Value

Company Sponsored

Hiring Potential

---

## Success Metrics

Hackathons

Prize Pool

Participants

Company Sponsors

Remote Events

---

# Mission Budgets

| Mission | Budget |
|----------|--------|
| Engineering Internships | 40% |
| Startup Internships | 25% |
| Government Tech | 15% |
| Research | 10% |
| Hackathons | 10% |

Unused budget stays within the mission.

---

# Common Discovery Sources

All missions may use:

Google Search

Brave Search

Serper

Tavily

Firecrawl

RSS

Official APIs

Sitemaps

Robots.txt

Career feeds

---

# ATS Discovery

Every mission searches ATS platforms directly.

Supported ATS

Greenhouse

Lever

Ashby

SmartRecruiters

Workable

Rippling

BambooHR

Comeet

---

# Mission Guard Rules

Immediately reject:

HR

Marketing

Finance

MBA

Sales

Leadership Fellowships

Executive Programs

General NGO Programs

Accept:

Engineering internships

Technical fellowships

Research internships

Open-source programs

Government tech internships

Hackathons

Student developer programs

---

# Universal KPIs

Every mission reports:

Searches Executed

Sources Discovered

Companies Found

Career Pages Found

ATS Pages Found

Pages Crawled

Detector Pass Rate

Extraction Success

Mission Guard Acceptance

Quality Acceptance

Duplicates Merged

Average Trust Score

Average Hidden Gem Score

Average Readiness Score

Average Quality Score

Engineering Domain Distribution

Organization Diversity

Location Diversity

Freshness Score

---

# Long-Term Vision

These five Discovery Missions are the foundation of Scout.

Future missions may include:

- Scholarships
- Open Source Programs
- Campus Ambassador Programs
- Women in Tech Programs
- Summer Schools
- Technical Fellowships
- International Exchange Programs

These will plug into the same Discovery Engine without changing its architecture.

---

# Final Principle

> **Scout does not search the web randomly.**
>
> **Every search is intentional.**
>
> **Every mission has a measurable objective.**
>
> **Every discovered opportunity should meaningfully improve an engineering student's career.**