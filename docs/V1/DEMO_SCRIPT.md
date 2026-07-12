# DEMO_SCRIPT.md
## Scout Hackathon Live Presentation & Demo Script

This script balances live visual interactions with natural mentions of Scout's technical architecture.

---

### Phase 1: The Hook & Introduction (30 seconds)
**Visual Action**: Show the Landing Page of Scout. Keep it clean and premium.
**What to Say**:
> "Good morning judges. Meet Scout. Scout is NOT an AI chatbot. It is an Opportunity Intelligence Platform designed to eliminate informational asymmetry for early-career candidates, with a special focus on high-impact diversity initiatives. 
> 
> Traditional platforms require manual search and are filled with noise. Scout operates on a fundamental philosophy: *Code computes, AI judges.* The internet is searched continuously in the background so that when a user logs in, Scout already knows what opportunities exist."

---

### Phase 2: Onboarding & User Intent (45 seconds)
**Visual Action**: Click "Get Started" and navigate through the Onboarding Flow. Select a few skills (e.g., React, Python, UI Design) and set career preferences.
**What to Say**:
> "We'll begin by creating a candidate profile. Onboarding is a progressive profiling funnel that collects explicit career vectors: location boundaries, educational milestones, skill tags, and career goals. 
>
> Behind the scenes, these inputs are validated using schema models at our API layer. These properties are synchronized securely using Firebase Auth to generate a matching candidate document in our database. Once onboarding is complete, the dashboard loads instantly."

---

### Phase 3: The Dashboard & Recommendation Engine (1 minute)
**Visual Action**: Transition to the User Dashboard. Show the personalized cards loading, click on one opportunity, and highlight the "Why you should apply" section.
**What to Say**:
> "This is the active User Dashboard. What you see is a personalized feed, not a generic search list. The system leverages a decoupled two-stage recommendation pipeline:
>
> 1. **Deterministic database filtering** runs query parameters on MongoDB (indexing location, degrees, and active deadlines) to narrow down thousands of listings into a small, relevant candidate pool.
> 2. **AI semantic ranking** passes this pool to our custom AI Gateway. Gemini compares user goals and skills against the listings, returning a score from 1 to 10 and generating this personalized explanation: *'Why you should apply.'*
> 
> Because AI calls can add latency, we cache these ranked feeds in Redis. This reduces subsequent feed page loads to milliseconds, making our system highly scalable."

---

### Phase 4: Behind the Scenes – The Six-Stage Pipeline (1 minute 15 seconds)
**Visual Action**: Show the "How Scout Works" architecture diagram (matching the slide image).
**What to Say**:
> "To understand how these opportunities get here, let's look at our Six-Stage Ingestion Pipeline running asynchronously in the background:
> 
> 1. **Discover**: Background schedulers query Search APIs, university portals, and government listings.
> 2. **Crawl**: We run URLs through Firecrawl to handle dynamic rendering and bypass anti-scraping blocks, returning clean markdown.
> 3. **Extract**: Raw markdown goes to our AI Gateway where Gemini extracts unstructured parameters into structured objects.
> 4. **Filter**: We run automated quality scoring, filtering out low-quality listings or potential scams.
> 5. **Merge**: We run deduplication algorithms using title hashes and semantic matching to merge duplicate roles.
> 6. **Recommend**: The final structured, cleaned listings are saved to MongoDB, ready to be matched to user dashboards."

---

### Phase 5: Technical Defense – The Unified AI Layer (30 seconds)
**Visual Action**: (Optional) Open the IDE or show the unified AI layer file layout (`src/ai/gateway/`).
**What to Say**:
> "The architectural mastery of Scout lies in our **Unified, Provider-Agnostic AI Gateway**. The core application never calls LLM SDKs directly. Instead, we call capabilities like `generateStructuredResponse` using Zod.
> 
> Our gateway dynamically resolves configurations based on context:
> - User-facing personalization tasks run on fast, low-cost models.
> - Background extraction tasks use deeper reasoning models.
> 
> If our primary provider (Gemini) encounters rate limits or API outages, our gateway catches the error, runs exponential retries, and automatically switches to our fallback provider (Groq) transparently. This means we can swap AI models in minutes simply by editing environment variables, without modifying any business logic.
> 
> This decoupled design ensures Scout is secure, cost-optimized, and built to scale."

---

### Phase 6: Conclusion (15 seconds)
**Visual Action**: Return to the main dashboard.
**What to Say**:
> "Scout combines clean system design with targeted AI intelligence, saving candidates hundreds of hours of manual search. Thank you, and we are now open to your technical questions."
