# Scout System Architecture

---

# Philosophy

Scout is NOT a search engine.

Scout is an Opportunity Intelligence Engine.

The internet is searched continuously in the background.

Users never wait while Scout searches.

Scout already knows.

---

# High Level Architecture

                    Internet
                        │
                        ▼
              Discovery Pipeline
                        │
        ┌───────────────┴───────────────┐
        │                               │
   Search APIs                   Website Crawlers
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
               Opportunity Extractor
                        │
                        ▼
                 AI Cleaning Pipeline
                        │
                        ▼
              Duplicate Detection
                        │
                        ▼
            Opportunity Classification
                        │
                        ▼
                 MongoDB Database
                        │
          ┌─────────────┴─────────────┐
          │                           │
    Embeddings                  Redis Cache
          │                           │
          └─────────────┬─────────────┘
                        │
                        ▼
            Personalization Engine
                        │
                        ▼
                 Next.js Frontend

---

# Main Systems

## 1. Discovery Engine

Runs every 6-8 hours.

Responsibilities

- Discover opportunities
- Crawl websites
- Read listings
- Parse data
- Clean content
- Remove duplicates
- Store results

---

## 2. Opportunity Database

Global database.

Shared by every user.

Collections

Users

Profiles

Opportunities

Bookmarks

Applications

Search Cache

---

## 3. Personalization Engine

Reads

User Profile

+

Opportunity Database

↓

Generates

Top Recommendations

---

# LangGraph Workflows

## Workflow 1

Discovery Graph

Search

↓

Extract

↓

Read Content

↓

Gemini

↓

JSON

↓

Store

---

## Workflow 2

Recommendation Graph

User

↓

Retrieve Opportunities

↓

Reasoning

↓

Ranking

↓

Explanation

↓

Return Feed

---

# AI Responsibilities

Gemini is NOT a chatbot.

Gemini is used for

- Parsing webpages
- Understanding eligibility
- Categorization
- Skill extraction
- Ranking
- Personalized reasoning
- Explanation generation

---

# Caching Strategy

Redis stores

- Recent searches
- Parsed webpages
- Frequently recommended opportunities
- Duplicate detection cache

---

# Database

MongoDB Atlas

Collections

Users

Profiles

Opportunities

Bookmarks

Notifications

Applications

Logs

---

# Scheduler

Every 6 hours

↓

Run Discovery Graph

↓

Update Opportunity Database

↓

Remove expired opportunities

↓

Recalculate rankings

---

# Authentication

Firebase Authentication

Google Login

Email Login

---

# Deployment

Frontend

Vercel

Backend

Railway or Render

MongoDB Atlas

Redis Cloud

---

# Engineering Principle

Before writing code ask

"Can this be solved with an existing service?"

If yes

Integrate it.

Write custom code only where Scout becomes uniquely intelligent.

---

# North Star

Every component should answer one question

"Will this help a talented woman discover an opportunity she would've otherwise missed?"