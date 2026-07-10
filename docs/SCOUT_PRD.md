# Scout
### by Zenkai Ecosystem

> Talent shouldn't depend on who you know.

> Scout exists for every woman—not just women in tech, not just college students, not just graduates. Whether she's a Class 10 pass, a homemaker restarting her career, an MBA student, an artist, a tailor, a nurse, a freelancer, or an engineer, Scout's mission is to help her discover the next opportunity that moves her life forward. We don't want to become another Internshala or Unstop. We want to become the platform that helps a woman get her first opportunity, her first income, and with that, her first confidence.

---

# Product Overview

Scout is an AI-powered Opportunity Intelligence Engine built for women.

Instead of making users search through hundreds of websites every day, Scout continuously discovers, analyzes, filters and recommends opportunities best suited for each individual.

Scout works while the user sleeps.

Every few hours Scout explores the internet, discovers newly published opportunities and prepares personalized recommendations for every user.

The goal isn't to show more opportunities.

The goal is to show the RIGHT opportunities.

---

# Problem Statement

Thousands of internships, hackathons, scholarships, fellowships, remote jobs, grants and competitions are posted every single day.

Students with strong professional networks usually discover these opportunities through

- Seniors
- WhatsApp Groups
- Discord Servers
- LinkedIn Posts
- College Clubs
- Mentors
- Referrals

However, many talented women don't have access to these networks.

They miss opportunities not because they lack skills,
but because they never knew those opportunities existed.

Scout aims to eliminate this information inequality.

---

# Mission

Talent shouldn't depend on who you know.

---

# Vision

Become the world's most trusted Opportunity Intelligence Engine.

Scout shouldn't become another job board.

Scout should become the AI that continuously works on behalf of its users to discover opportunities they would've otherwise missed.

---

# Primary User Persona

## Ananya

Age
20

College
Tier-3 Engineering College

Degree
ECE

Skills

- Python
- MERN
- AI

Problem

- Introverted
- Doesn't attend networking events
- Doesn't know seniors
- Doesn't use LinkedIn consistently
- Doesn't know where opportunities get posted

Goal

Find internships, scholarships and hackathons relevant to her.

---

# Secondary Personas

- MBA Student
- BCA Student
- MCA Student
- Self-taught Developer
- Homemaker learning online
- Open University Student
- Women restarting careers
- Freelancers

---

# Core Product Philosophy

Scout does NOT help users search.

Scout searches FOR them.

---

# Product Flow

User

↓

Sign Up

↓

Onboarding

↓

AI understands profile

↓

Scout Intelligence Engine searches internet

↓

Opportunity Database

↓

AI filters opportunities

↓

Personalized Feed

↓

User applies

---

# Core Components

## 1. Discovery Engine

Runs every 6-8 hours.

Responsible for

- Crawling websites
- Reading new listings
- Extracting structured data
- Detecting duplicates
- Removing expired opportunities
- Storing data

---

## 2. Opportunity Intelligence Database

Global database.

Shared across every user.

Contains

- Scholarships
- Hackathons
- Fellowships
- Grants
- Competitions
- Jobs
- Remote Jobs
- Internships
- Women-only programs

This database is NOT user-specific.

---

## 3. AI Personalization Engine

Reads

User Profile

+

Opportunity Database

↓

Ranks opportunities

↓

Explains WHY they're relevant

↓

Suggests best opportunities

---

# Opportunity Object

Every opportunity should contain

- Title
- Organization
- Category
- Description
- Deadline
- Apply Link
- Source Website
- Location
- Remote / Offline
- Eligibility
- Required Skills
- Preferred Skills
- Experience Required
- Women Only
- Salary / Stipend
- Registration Fee
- Date Found
- Last Updated
- Tags
- Embedding
- Trust Score
- Hidden Gem Score
- Competition Estimate (future)

---

# AI Features

## Intelligent Ranking

Instead of showing

100 opportunities

Scout recommends

Top 10

---

## Explainability

Example

96% Match

Why?

✓ React

✓ Remote

✓ Women Preferred

✓ Final Year

✓ Deadline in 3 Days

---

## Hidden Gem Detection

Scout prioritizes opportunities that

- Few people know about
- Recently discovered
- Highly relevant
- Lower competition
- High quality

---

## Deadline Intelligence

Closing Soon

Freshly Posted

Long-term

---

## Personalized Daily Brief

Every morning

Scout tells the user

Today Scout explored

413 sources

Found

2,314 opportunities

Relevant to You

11

Hidden Gems

3

Closing Soon

2

---

# V1 Scope

Must Have

✅ Authentication

✅ User Onboarding

✅ Opportunity Collection

✅ Opportunity Database

✅ AI Ranking

✅ Personalized Dashboard

✅ Search

✅ Filters

✅ Opportunity Details

---

# NOT IN V1

❌ Resume Builder

❌ Career GPS

❌ Interview Preparation

❌ Mentor Marketplace

❌ Learning Platform

❌ Community

❌ Referral Marketplace

❌ Resume Scoring

These become future Zenkai products.

---

# Recommended Tech Stack

## Frontend

Preferred

- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion

---

## Backend

Preferred

- MongoDB

Alternative

- Express
- NestJS

---

## Database

Preferred

MongoDB Atlas

---

## Authentication

Firebase Auth



## AI

Unified LLM layer

---

## Embeddings

Gemini Embeddings

Alternative

Sentence Transformers

---



---

## Web Crawling

Primary

Firecrawl

Alternatives

Crawl4AI
Playwright
Browser Use

---

## HTML Parsing

BeautifulSoup

Trafilatura

Readability

---

## Search

Tavily API

Serper API

Brave Search API

DuckDuckGo Search

---

## AI Agent Framework

LangGraph

Alternative

PydanticAI

CrewAI

---

## Scheduling

Cron Jobs

GitHub Actions

Trigger.dev

Inngest

---

## File Storage

MongoDB

---

## Deployment

Frontend

Vercel

Backend

cloud run

---

# Potential MCP Servers

Use wherever possible instead of writing custom code.

- Brave Search MCP
- Tavily MCP
- GitHub MCP
- Filesystem MCP
- Playwright MCP
- Browser MCP
- Firecrawl MCP (if available)
- Sequential Thinking MCP
- Memory MCP

---

# APIs Worth Exploring

Opportunity Sources

- Devpost
- Devfolio
- Unstop
- Wellfound
- LinkedIn Jobs
- Google Careers
- Microsoft Careers
- GitHub Jobs mirrors
- Y Combinator Jobs
- Internshala
- AICTE
- IEEE
- GDG Events
- MLH
- HuggingFace
- Kaggle
- ISRO Careers
- DRDO Careers
- TCS Careers
- Infosys Careers
- Wipro Careers

Scholarships

- Google Women Techmakers
- Adobe Women
- Microsoft
- Tata Scholarships
- AICTE
- NSP

---

# Engineering Principle

If an excellent solution already exists

DO NOT BUILD IT.

Integrate it.

Only write code that creates Scout's unique intelligence.

---

# What Makes Scout Different?

We are NOT building another job portal.

We are NOT building another scholarship website.

We are building an Opportunity Intelligence Engine.

The internet already has opportunities.

Scout ensures the RIGHT opportunities reach the RIGHT woman at the RIGHT time.

---

# Future Roadmap

Scout

↓

Career GPS

↓

Interview AI

↓

Resume AI

↓

Mentor Matching

↓

Learning Roadmaps

↓

Opportunity Prediction

↓

Personal Career Operating System

---

# North Star

Every product decision should answer one question

"Will this help a talented woman discover an opportunity she would've otherwise missed?"