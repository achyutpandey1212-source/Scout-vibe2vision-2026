# Scout — Opportunity Intelligence Engine

Scout is a personalized, AI-driven opportunity discovery platform designed to find, parse, clean, score, and recommend relevant career opportunities (scholarships, internships, fellowships, hackathons, and competitions) for women in technology.

Rather than acting as a static directory or job board, Scout aggregates data from trusted sources, performs structured AI extraction, filters opportunities against quality thresholds, merges duplicates, and scores listings based on individual user profiles.

---

## 1. Key Features

### 🕷️ Discovery Engine

- **Source Registry:** Maintains a clean registry of trusted organizations, homepage URLs, refresh intervals, and base trust scores.
- **Multichannel Aggregation:** Collects candidate links from search APIs, sitemaps, RSS feeds, and direct portals.

### 🧠 Opportunity Intelligence

- **AI Extraction:** Uses Gemini to extract structured JSON metadata directly from raw page content.
- **Quality Scorer & Thresholds:** Evaluates listings on completeness, source trust, and relevance. Opportunities scoring `< 60` are rejected.
- **Smart Deduplication:** Merges records on source URL, application link, or title-organization similarity to preserve the richest details.
- **Deadline Archiver:** Background routines scan and mark expired opportunities as archived.

### 🎯 Personalization & Recommendations

- **Real-Time Evaluations:** Computes personalized scores based on interests, readiness, availability, and obstacles.
- **Explainability:** Generates explanations highlighting why each opportunity is a high-relevance match.

### 🛡️ Core Infrastructure

- **Firebase Auth:** Google, email/password, and guest sign-in flows.
- **Fail-safe Sync:** Automatically syncs auth state with MongoDB records.

---

## 2. Tech Stack

- **Frontend:** Next.js (React), Vanilla CSS (design-token based, custom styling), Tailwind-free.
- **Backend:** Node.js (Express), TypeScript.
- **Database:** MongoDB (Mongoose), Redis (Caching layer).
- **Authentication:** Firebase Client & Admin SDK.
- **AI Engine:** Google Gemini SDK, Zod structured output schemas.

---

## 3. Project Architecture

### 🔄 Data Flow

```
User
  ↓
Frontend (Next.js)
  ↓
Backend API (Express)
  ↓ [requireAuth Middleware]
Firebase Token Verify
  ↓
MongoDB User Profile
  ↓
Recommendation Engine (Weighted Scoring)
  ↓
Personalized Feed Rendering
```

### ⚙️ Discovery Pipeline Stages

```
Registry/Search
  ↓
URL Validation (Protocol and Domain integrity)
  ↓
Firecrawl / Scraping (Raw content fetch)
  ↓
AI Extraction (Gemini Structured JSON parse)
  ↓
Normalization (Standardize dates, stipends)
  ↓
Quality Score & Filtering (Reject < 60)
  ↓
Deduplicate & Merge (Title/Org/URL checks)
  ↓
Storage (Persist to MongoDB)
```

---

## 4. Folder Structure

- `/apps/web/`: Next.js frontend code (pages, components, UI primitives, auth contexts, API integrations).
- `/apps/server/`: Express backend API.
  - `src/auth/`: Session sync, token verify, bookmarks.
  - `src/discovery/`: Sources registry, crawling, extraction schemas, and deduplication.
  - `src/intelligence/`: Recommendation scoring algorithms.
- `/packages/shared/`: Shared TypeScript type definitions and validator utilities.

---

## 5. Local Development

### Prerequisites

- Node.js 18+
- MongoDB instance
- Redis instance
- Firebase Project setup

### Environment Variables (.env)

Create `.env` inside `/apps/server/` and `/apps/web/` following templates:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/scout
REDIS_URL=redis://localhost:6379
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"
TAVILY_API_KEY=your-tavily-key
FIRECRAWL_API_KEY=your-firecrawl-key
DISCOVERY_API_KEY=your-gemini-key
PERSONALIZATION_API_KEY=your-gemini-key
```

### Setup Commands

```bash
# Install workspace dependencies
npm install

# Build shared package
npm run build -w @scout/shared

# Run server and web app in dev mode
npm run dev
```

---

## 6. License

This project is licensed under the MIT License.
