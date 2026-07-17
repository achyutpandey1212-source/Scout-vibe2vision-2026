# PR5.7 — Discovery Engine Mission Audit & Cleanup

**Date:** 2026-07-17  
**Scope:** Complete architectural audit of the Discovery Engine for MVP mission alignment  
**Status:** Audit only — no code changes made

---

## 1. Executive Summary

Scout is **not** a generic careers platform. It is **not** LinkedIn, Indeed, or a professional hiring engine. The current MVP serves one audience: **engineering undergraduate students (primarily women) looking for internships and portfolio-building opportunities.**

This audit found that **every major layer of the Discovery Engine still carries remnants of the original generic careers crawler**. The system extracts and scores opportunities using broad career signals rather than engineering-internship relevance. High-quality irrelevant opportunities (e.g., finance internships, marketing programs, founder accelerators, executive leadership residencies) can still pass validation and score 90+ on quality and hidden-gem metrics.

**Bottom line:** The engine optimizes for "is this a well-formed, trusted opportunity page?" instead of "is this useful for a 1st–4th year engineering undergrad?" Incremental fixes are no longer sufficient. A coordinated cleanup is required across all layers.

---

## 2. Mission Mismatches

### CRITICAL — Hardcoded generic audience in runtime execution paths

- **`apps/server/src/discovery/routes/discovery-dashboard.routes.ts:102`**  
  `targetAudience: 'Women Tech Professionals & Students'`  
  The word **"Professionals"** directly contradicts the MVP audience (students only). This is the default context for every automated daily run.

- **`apps/server/src/discovery/routes/admin.routes.ts:139`**  
  Identical hardcoded generic context. Every manually triggered discovery run also records a non-MVP audience.

### CRITICAL — Hardcoded non-MVP categories in runtime execution paths

- **`apps/server/src/discovery/routes/discovery-dashboard.routes.ts:103`**  
  `categories: ['Engineering', 'Scholarships', 'Tech Workshops']`  
  None of these are valid `SearchCategory` or `SourceCategory` enum values in the active category registry. They are free strings that silently produce empty query buckets, causing the query planner to fall back to **ALL** buckets (including non-engineering ones).

- **`apps/server/src/discovery/routes/admin.routes.ts:140`**  
  Same hardcoded invalid categories as above.

### HIGH — `DiscoveryRun.targetAudience` is unconstrained

- **`apps/server/src/discovery/persistence/discovery-run.model.ts:6,44`**  
  `targetAudience: string` with no enum or default validation. Combined with the hardcoded dashboard/admin contexts above, persisted run records can carry any audience string, including non-MVP ones.

---

## 3. Pipeline Mismatches

### CRITICAL — Query Planner allocates 45% of search budget to non-engineering/generic buckets

- **`apps/server/src/discovery/query-planner/query-planner.ts:196-203`**  
  Budget ratios:
  - `GENERAL_INTERNSHIPS: 0.2` (20%) — "General" implies all internships including non-engineering
  - `GOVERNMENT: 0.15` (15%) — includes non-engineering government schemes (RBI, SEBI)
  - `RESEARCH: 0.1` (10%) — includes non-internship research programs  
    Only `STARTUP_INTERNSHIPS` gets 30%. The remaining 45% actively targets non-engineering content.

### HIGH — Query Planner bucket labels are generic

- **`apps/server/src/discovery/query-planner/query-planner.ts:9-12`**
  ```ts
  INTERNSHIPS: 'GENERAL_INTERNSHIPS';
  GOVERNMENT_INTERNSHIP: 'GOVERNMENT';
  RESEARCH_INTERNSHIP: 'RESEARCH';
  ```
  The `INTERNSHIPS` bucket maps to "GENERAL_INTERNSHIPS" — a label that contradicts the engineering focus.

### HIGH — Query Planner generates generic, non-engineering queries

- **`apps/server/src/discovery/query-planner/query-planner.ts:137-150`**  
  Generated queries include:
  - `` `${domain} internship ${loc}` `` — no engineering qualifier
  - `` `${domain} developer intern ${targetCountry}` `` — "developer" is generic
  - `` `software engineering student internship ${loc}` `` — "software engineering" is a broad category, not a specific branch
  - `` `${agency} student internship` `` — no engineering context
  - `` `${agency} technology training internship program` `` — "technology training" is vague

### HIGH — Stage 1 generates site-scoped queries with generic terms

- **`apps/server/src/discovery/stages/stage1.ts:222-233`**  
  Site queries include:
  - `` `site:${domain} intern startup careers 2026` `` — "careers" is generic
  - `` `site:${domain} intern student program fellowship scholarship 2026` `` — includes "fellowship" and "scholarship" which are not engineering-internship-specific
  - `` `site:${domain} campus hiring graduate program recruitment ${country}` `` — "campus hiring", "graduate program", "recruitment" are generic HR terms

### HIGH — Candidate expansion into non-engineering pages

- **`apps/server/src/discovery/search/search-orchestrator.ts:39-49`**  
  `MEDIUM_TRUST_DOMAINS` includes generic job aggregators: `linkedin.com`, `internshala.com`, `indeed.com`, `naukri.com`, `foundit.in`. These are not engineering-internship-specific sources.

### HIGH — Source Discovery fallback queries are overwhelmingly non-engineering

- **`apps/server/src/discovery/sources/source-discovery.engine.ts:354-376`**  
  `getFallbackQueries()` returns 19 generic queries including:
  - `women scholarship program 2026 apply`
  - `women fellowship leadership social impact organization`
  - `government scheme women skill development training india 2026`
  - `NGO women education livelihood program india`
  - `women microfinance self help group loan india`
  - `international fellowship women developing countries 2026`
  - `social entrepreneurship grant women impact india`
  - `UN women program india opportunity apply`
  - `tribal rural women education opportunity government`  
    Only ~3 of 19 queries mention engineering. The engine is explicitly directed to discover non-engineering sources.

### HIGH — Query Planner budget allocation favors non-engineering categories when categories are empty

- **`apps/server/src/discovery/query-planner/query-planner.ts:223-225`**  
  When `context.categories` is empty (which happens when the dashboard/admin routes pass invalid category strings), ALL buckets run. The detector's category-aware penalties are skipped entirely.

---

## 4. Prompt Mismatches

### CRITICAL — Extraction prompt extracts generic opportunity types instead of engineering internships

- **`apps/server/src/discovery/extraction/prompts/extract-opportunity.prompt.ts:16`**  
  The prompt explicitly lists: `jobs, internships, fellowships, scholarships, hiring programs/challenges, graduate trainee schemes, apprenticeships, research schemes, competitions, hackathons, grants, startup accelerators, incubators, bootcamps with applications, or conferences accepting registrations`  
  This is a **generic careers crawler prompt**. It does not say "extract engineering internships suitable for undergraduate students."

### HIGH — Extraction prompt prefers extraction over rejection for any opportunity

- **`apps/server/src/discovery/extraction/prompts/extract-opportunity.prompt.ts:17`**  
  `"If there is reasonable evidence that this page represents an active opportunity, PREFER EXTRACTION rather than rejection."`  
  Combined with the broad examples above, this guarantees that marketing internships, finance fellowships, and leadership programs will be extracted.

### HIGH — Extraction prompt enum includes generic opportunity verticals

- **`apps/server/src/discovery/extraction/prompts/extract-opportunity.prompt.ts:24-28`**  
  `opportunityVertical` enum: `CAREERS, SCHOLARSHIPS, FELLOWSHIPS, GOVERNMENT_SCHEMES, COMPETITIONS, COURSES, TRAINING, ENTREPRENEURSHIP, FINANCIAL_AID, EVENTS, OTHER`  
  `CAREERS`, `TRAINING`, `FINANCIAL_AID`, `EVENTS` are not engineering-internship verticals.

### HIGH — Source Discovery prompt explicitly asks AI to find non-engineering verticals

- **`apps/server/src/discovery/sources/source-discovery.prompt.ts:17-32`**  
  The prompt instructs the source discovery agent to find sources across:
  - `Scholarships` (undergraduate, postgraduate, research, merit-based, need-based)
  - `Fellowships` (leadership, social impact, technology, journalism, arts)
  - `Internships and apprenticeships` (corporate, government, NGO, research labs)
  - `Hackathons and innovation challenges` (tech, non-tech, student, professional)
  - `Grants and funding programs` (research grants, small business grants, social impact)
  - `Accelerators and incubators` (women entrepreneur-focused, early-stage, regional)
  - `Government schemes` (central government, state government, rural development, skill mission)
  - `Skill development and vocational training` (PMKVY, digital literacy, trade skills)
  - `Career returnship programs` (women returning after career break)
  - `NGOs supporting women` (education, livelihood, microfinance, health)
  - `International programs` (UN Women, World Bank)

  This is the **antithesis** of the MVP mission. The engine is told to find sources for women entrepreneurs, rural development, microfinance, UN programs, and career returnships.

### HIGH — Source Discovery AI category enum includes inactive/generic categories

- **`apps/server/src/discovery/sources/source-discovery.prompt.ts:70`**  
  `suggestedCategory` enum includes `TECH_CAREERS`, `GENERAL`, `ENTREPRENEURSHIP`, `SKILL_DEVELOPMENT`, `GOVERNMENT`, `RESEARCH` — all of which are inactive/generic in the authoritative `CATEGORY_REGISTRY`.

### MEDIUM — User prompt in extraction is generic

- **`apps/server/src/discovery/extraction/prompts/extract-opportunity.prompt.ts:37`**  
  `"Please extract the opportunity from the page below:"`  
  Does not specify engineering-internship relevance or student suitability.

---

## 5. Schema Mismatches

### HIGH — `OpportunityType` includes non-MVP types

- **`apps/server/src/discovery/extraction/types/opportunity.types.ts:1-14`**  
  `JOB, FREELANCE, VOLUNTEER, EVENT, COURSE, PROGRAM, OTHER`  
  MVP is internships + scholarships + fellowships + hackathons/competitions. `JOB` (full-time employment), `FREELANCE`, `VOLUNTEER`, `EVENT`, `COURSE`, `PROGRAM`, `OTHER` are out of scope.

### HIGH — `SearchCategory` includes generic/non-MVP buckets

- **`apps/server/src/discovery/extraction/schemas/opportunity.schema.ts:82-95`** / **`opportunity.types.ts:94-106`**  
  `Government Scheme, Scholarship, Fellowship, Grant, Internship, Job, Competition, Training, Entrepreneurship, Volunteer, Event, Other`  
  `Job`, `Training`, `Entrepreneurship`, `Volunteer`, `Event`, `Other` are generic categories outside the MVP scope.

### HIGH — `OpportunityVertical` includes generic buckets

- **`apps/server/src/discovery/extraction/schemas/opportunity.schema.ts:97-109`** / **`opportunity.types.ts:112-123`**  
  `CAREERS, SCHOLARSHIPS, FELLOWSHIPS, GOVERNMENT_SCHEMES, COMPETITIONS, COURSES, TRAINING, ENTREPRENEURSHIP, FINANCIAL_AID, EVENTS, OTHER`  
  `CAREERS`, `TRAINING`, `FINANCIAL_AID`, `EVENTS` target jobs/general aid, not student internships.

### HIGH — `AudiencePersona` includes non-student personas

- **`apps/server/src/discovery/extraction/types/opportunity.types.ts:47-64`**  
  `working-professional, fresher, entrepreneur, self-employed, homemaker, rural, disabled, minority, veteran, career-break, career-returner`  
  The MVP is strictly undergraduate students. `working-professional`, `career-returner`, `entrepreneur`, etc. are generic careers-platform personas.

### MEDIUM — `SourceRegistry.category` enum permits inactive/generic categories

- **`apps/server/src/discovery/sources/source-registry.model.ts:47-68`**  
  Enum includes `GENERAL`, `TECH_CAREERS`, `GOVERNMENT`, `RESEARCH`, `SKILL_DEVELOPMENT` — all marked `isActive:false` in `CATEGORY_REGISTRY` but still accepted by the DB schema.

### MEDIUM — `SourceType` enum includes generic types

- **`apps/server/src/discovery/sources/source-registry.types.ts:8-20`**  
  `Job Board, Conference, Research Lab, Other` — generic careers platform types.

### MEDIUM — `OpportunitySchema` does not validate engineering relevance, audience, or experience

- **`apps/server/src/discovery/extraction/schemas/opportunity.schema.ts:119-232`**  
  The schema only enforces presence/shape (`title.min(1)`, `description.min(1)`, `summary.min(1)`, enums, URL format). It **never** rejects non-engineering internships, women-only programs unrelated to engineering, founder-only accelerators, or programs for experienced professionals.

### MEDIUM — Normalizers default to permissive values

- **`apps/server/src/discovery/extraction/utils/normalizers.ts:353,388,401`**
  - `experienceRequired` defaults to `'SOME'` (not `'NONE'`)
  - `opportunityVertical` defaults to `'OTHER'`
  - `genderEligibility` defaults to `'ALL'` (silently loses women-only relevance)

---

## 6. Dashboard Mismatches

### HIGH — Dashboard `/metrics` groups by raw `$category` including inactive/generic buckets

- **`apps/server/src/discovery/routes/discovery-dashboard.routes.ts:204-220`**
  ```ts
  const byCategory = await mongoose.connection.db
    ?.collection('opportunities').aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]...
  ```
  Opportunities are grouped by `$category` (free string) and can include generic values like `Training`, `Event`, `Other`, `Job`, `Scholarship` from the extraction schema. The dashboard chart will display non-MVP buckets with no filtering to active MVP categories.

### HIGH — Dashboard metrics label "Engineering Internships Found" with overly broad definition

- **`apps/server/src/discovery/orchestrator/discovery-orchestrator.ts:414-419`**
  ```ts
  const engineeringInternships = acceptedOpps.filter(
    (o) =>
      o.opportunityType === 'INTERNSHIP' &&
      (['engineer', 'developer', 'software', 'programmer', 'coder', 'sde', 'tech'].some((kw) =>
        o.title.toLowerCase().includes(kw),
      ) ||
        o.skills.length > 0),
  ).length;
  ```
  The keyword list (`engineer, developer, software, programmer, coder, sde, tech`) catches **generic SWE roles**, not specifically student internships. A "Marketing Developer" internship would match. The `skills.length > 0` condition catches virtually any internship with any skills listed.

### MEDIUM — Orchestrator "Hidden Gem" metrics are actually qualityScore buckets (mislabeled)

- **`apps/server/src/discovery/orchestrator/discovery-orchestrator.ts:293-298`**  
  `hiddenGemCounts.Excellent/High/Medium/Low` are computed from `opp.qualityScore`, NOT `opp.hiddenGemScore`. The two concepts are conflated in reporting.

### MEDIUM — `topGemsList` can surface irrelevant items

- **`apps/server/src/discovery/orchestrator/discovery-orchestrator.ts:408-411`**  
  `topGemsList` sorts accepted opps by `hiddenGemScore` desc and shows top 3. Because hidden-gem scoring rewards source type (startup, university, government) over relevance, the "top gems" can be founder accelerators or executive programs, not student engineering internships.

### MEDIUM — Orchestrator metrics log generic targetAudience and categories

- **`apps/server/src/discovery/orchestrator/discovery-orchestrator.ts:523-525`**
  ```ts
  targetAudience: context.targetAudience,
  categories: context.categories,
  totalQueries: TRUSTED_SOURCES.length,
  ```
  The run record persists whatever invalid `targetAudience` and `categories` were passed by the dashboard/admin routes. `totalQueries` is set to `TRUSTED_SOURCES.length` (a source count), not the number of generated queries — a misleading metric.

### MEDIUM — Student Programs metric uses overly broad keywords

- **`apps/server/src/discovery/orchestrator/discovery-orchestrator.ts:429-434`**
  ```ts
  const studentPrograms = acceptedOpps.filter((o) =>
    ['program', 'fellowship', 'scholarship', 'camp', 'academy'].some(
      (t) => o.title.toLowerCase().includes(t) || (o.opportunityType as string) === t.toUpperCase(),
    ),
  ).length;
  ```
  `camp`, `academy`, `fellowship`, `scholarship` match non-engineering programs.

---

## 7. Source Registry Mismatches

### CRITICAL — 9 VC-portfolio sources are VC blogs, not internship producers

- **`apps/server/src/discovery/sources/registry.ts:407-469`**  
  Y Combinator, Peak XV Partners, Accel India, Blume Ventures, Antler India, 100X.VC, Nexus Venture Partners, Elevation Capital.  
  These are VC firm homepages/blogs. They do not post student internships; they list portfolio companies. The MVP question — _"Do startup ecosystem sources point to internship-producing companies or VC blogs?"_ — is answered: **they point to VC blogs.** These sources yield ~0 student internships but are classified as `VC_PORTFOLIO` / Tier A with high crawl priority.

### HIGH — Tech-company seeds lack `internship` tag, causing deactivation

- **`apps/server/src/discovery/sources/registry.ts:32,40,48`**  
  Google, Microsoft, Amazon default tags: `['technology', 'software engineering', 'tech']`  
  `inferCategoryFromTags` maps these to `TECH_CAREERS` (inactive) rather than `INTERNSHIPS` (active). `clean-db.ts` later deactivates them, shrinking MVP coverage.

### HIGH — Source Registry seeds include non-engineering scholarship/fellowship sources

- **`apps/server/src/discovery/sources/registry.ts:138-171`**
  - `DAAD` — general scholarships, not engineering-specific
  - `Erasmus+` — general European scholarships
  - `Obama Foundation` — leadership/social impact fellowship, not engineering
  - `Mozilla Foundation` — tech policy/open-source fellowship, not student internship

### HIGH — `inferCategoryFromTags` falls back to `GENERAL` (inactive category)

- **`apps/server/src/discovery/sources/source-registry.service.ts:395-414`**
  ```ts
  if (tagStr.includes('technology') || tagStr.includes('tech')) return 'TECH_CAREERS';
  return 'GENERAL';
  ```
  `GENERAL` is inactive. Seeds that don't match a specific rule land in `TECH_CAREERS` (also inactive) → later deactivated. Net effect: top tech companies are seeded into inactive categories and deactivated.

### MEDIUM — `ecosystemType` default is `'BIG_TECH'`

- **`apps/server/src/discovery/sources/source-registry.model.ts:141`**  
  For a student-internship engine, the sensible default would be `STARTUP` or `UNIVERSITY`. New AI-discovered sources inherit `BIG_TECH`, skewing `metricsByEcosystem` and `highlights.topEcosystems`.

### MEDIUM — Generic seed tags are not MVP branch-specific

- **`apps/server/src/discovery/sources/registry.ts:25-57`**  
  Tags like `'technology'`, `'tech'`, `'software engineering'` are too coarse to drive MVP-targeted discovery (CSE, AI/ML, DS, Cyber, ECE, IT, BCA, MCA, Web, Cloud, DevOps, Mobile).

### LOW — Government sources include non-engineering finance regulators

- **`apps/server/src/discovery/sources/registry.ts:255-269`**  
  `RBI` and `SEBI` are tagged `['government', 'finance', 'internship']`. These are finance regulators. Any "internship" they publish is likely finance/economic policy, not engineering.

---

## 8. Search Planner Mismatches

### HIGH — Query Planner generates queries for non-engineering startup domains

- **`apps/server/src/discovery/query-planner/query-planner.ts:49-66`**  
  `startupDomains` includes: `Fintech, HealthTech, EdTech, ClimateTech, Robotics, Semiconductor, IoT, DeepTech, Embedded Systems, Frontend, Backend`  
  `Fintech`, `HealthTech`, `EdTech`, `ClimateTech` are non-engineering domains. `DeepTech` is vague. `Frontend`/`Backend` are generic web dev roles.

### HIGH — Query Planner general domains are overly broad

- **`apps/server/src/discovery/query-planner/query-planner.ts:68-78`**  
  `generalDomains` includes: `Software Engineering, Full Stack, Cloud, SDE`  
  These imply all SWE roles, not just student internships.

### HIGH — Query Planner startup ecosystems include generic VC/incubator terms

- **`apps/server/src/discovery/query-planner/query-planner.ts:80-91`**  
  `startupEcosystems` includes `Y Combinator, Peak XV, Accel, Blume, Antler` — the same VC blogs that yield ~0 student internships.

### HIGH — Query Planner government agencies include non-engineering regulators

- **`apps/server/src/discovery/query-planner/query-planner.ts:93`**  
  `govAgencies` includes `RBI`, `SEBI` — finance regulators.

### MEDIUM — Search Orchestrator `OPPORTUNITY_KEYWORDS` includes generic terms

- **`apps/server/src/discovery/search/search-orchestrator.ts:51-86`**  
  `careers, jobs, fellowship, scholarship, grant, apprenticeship, competition, admissions, hiring, early-careers, young-professionals, new-grad, bootcamp, academy, talent-program, learning-program`  
  These are generic career/education terms. A page about "Marketing Fellowship" or "Executive Leadership Program" matches these keywords.

### MEDIUM — Search Orchestrator experienced-hire down-ranking list is incomplete

- **`apps/server/src/discovery/search/search-orchestrator.ts:239-242`**  
  Down-ranking keywords: `senior, lead, principal, manager, director, architect, experienced, 5+ years, mba, finance, hr, sales, marketing, faculty, professor, permanent position, full-time experienced`  
  **Missing:** `Founder`, `CEO`, `Residency`, `Resident`, `VP`, `Head Of`, `Principal`, `Architect` (partially covered), `returnship`, `return-to-work`, `mid-career`, `lateral`. The list is also title-based substring matching, so "ML Platform Lead" is caught but "Staff Engineer" is missed in some contexts.

### MEDIUM — Search Orchestrator scoring weights favor generic trust signals

- **`apps/server/src/discovery/search/search-orchestrator.ts:196-199,222-257`**  
  Base trust score is 0 (LOW). A page about "Senior Manager at Finance Corp" on a `.gov.in` domain scores: Trust(10) + Keyword(0) + Freshness(0) + URLQuality(1) = 11. The experienced-hire penalty is -60, so it would score -49 → clamped to 0. However, the **scoring architecture itself** is built around generic career signals, not engineering-internship signals.

---

## 9. Quality Engine Mismatches

### CRITICAL — Stage 4 Quality Scoring allows high-quality irrelevant opportunities to score 90+

- **`apps/server/src/discovery/stages/stage4.ts:105-190`**  
  Base = 30. Additions: trusted source +20, deadline +15, application link +20, rich description >100 chars +15, benefits/tags +10, stipend +10, student boost up to +20. Max before penalties ≈ 140 → capped 100.  
  An irrelevant-but-well-formatted "Women in Finance Fellowship" from a trusted domain with deadline, link, 300-char description, tags, and stipend = **100**, ACCEPT (threshold 75). No relevance dimension is required.

### CRITICAL — Stage 4 Experienced-hire penalty only fires for internship runs

- **`apps/server/src/discovery/stages/stage4.ts:207-239`**  
  The -50 "force REJECT" (`isDataValid = false`) only applies `if (runCategories.includes('INTERNSHIPS') || runCategories.includes('STARTUP_INTERNSHIPS'))`. For `WOMEN_PROGRAMS`, `SCHOLARSHIP`, `FELLOWSHIP`, `RESEARCH` runs, a "Senior Director" titled opportunity is not rejected.

### HIGH — Stage 4 Unrelated-domain penalty is narrow and bypassable

- **`apps/server/src/discovery/stages/stage4.ts:192-199`**  
  Only subtracts -25 for: `executive, leadership, corporate strategy, finance director, sales representative, operations lead, human resources manager, hr manager, marketing head, professor, faculty`.  
  **Missing:** `founder`, `CEO`, `resident` (CEO-in-Residence), `principal`, `head of`, `VP`, `director` (outside finance), `fellow` (non-tech), `consultant`, `partner`. Also the check is substring `includes`, so "Women Leadership Program" triggers it — but "Women in Public Policy Fellowship" would NOT trigger any penalty.

### HIGH — Student Boost rewards generic career content

- **`apps/server/src/discovery/stages/stage4.ts:174-190`**  
  `hasStudentKeywords` rewards the words `mentorship, portfolio, learning, training, guidance, learn, student-friendly, github`. These appear in virtually every fellowship/leadership/program page, so the +10 "student boost" is effectively granted to generic career content. `hasTechStack` checks generic substrings like `ai, ml, cloud, data science, python` — also commonly present in non-engineering AI-policy or data-journalism fellowships.

### HIGH — Trusted source boost favors prestige over relevance

- **`apps/server/src/discovery/stages/stage4.ts:108-112`**  
  `opp.organization.toLowerCase() === src.organization.toLowerCase()` gives +20 for exact matches to trusted seed orgs. The trusted seed includes high-prestige orgs: Obama Foundation (95), CERN (95), DAAD (95), Grace Hopper (100), Google/Microsoft/Amazon (95). These get automatic +20 quality regardless of relevance. A niche-but-perfect student SWE internship from an unknown startup gets 0 for trusted source.

### HIGH — Detector threshold is low and generic keyword-driven

- **`apps/server/src/discovery/utils/opportunity-detector.ts:9-25,319`**  
  `STRONG_KEYWORDS` includes `apply, register, vacancy, position, scholarship, fellowship, submit application, application deadline`. Default threshold = 40. Positive signals stack heavily (up to +25 per title keyword, +25 per heading, +20 per URL term, +20 body cap). It is easy to exceed 40 on generic career pages.

### HIGH — Detector experienced-hire penalties only apply in internship runs

- **`apps/server/src/discovery/utils/opportunity-detector.ts:214-227,256-264`**  
  The experienced-hire penalties (`hasExperiencedTerm`, `bodyExperiencedKeywords`) only trigger when `isInternshipRun` is true. For other run types, a page titled "Senior Engineering Manager" passes the detector.

### HIGH — Detector does not require "internship" or "student" globally

- **`apps/server/src/discovery/utils/opportunity-detector.ts:242-254`**  
  The `+35` bonus for `isInternshipRun` is a bonus, not a requirement. For non-internship runs (`SCHOLARSHIP, FELLOWSHIP, GENERAL, WOMEN_PROGRAMS`), there is **no requirement** that the page mention "internship" or "student". `fellowship` and `scholarship` are themselves `STRONG_KEYWORDS` that guarantee the "positive hits" path.

### HIGH — Hidden Gem Scoring ignores relevance entirely

- **`apps/server/src/discovery/stages/enrichment-pipeline.ts:376-383`**  
  `hgScore` starts at 50 and adds:
  - STARTUP +25
  - UNIVERSITY or RESEARCH ecosystem +20
  - GOVERNMENT +15
  - competitionEstimate LOW +15
  - competitionEstimate VERY_HIGH -25  
    `competitionEstimate` comes from stage4CareerValueIntelligence (lines 281-289) which sets `LOW` for **any STARTUP**, `VERY_HIGH` only for MNC/trust≥95. So a STARTUP + LOW competition = +25 +15 = **hgScore 90** minimum, capped 100, with **zero relevance, audience, or engineering checks**.

### HIGH — Hidden Gem Scoring has no penalty for irrelevance/non-student/experienced

- **`apps/server/src/discovery/stages/enrichment-pipeline.ts:376-383`** and **`apps/server/src/intelligence/scoring/utils/hidden-score.ts:50-107`**  
  The hidden-gem formula has no term for `experienceRequired`, `audiencePersonas`, `professionalDomains`, or engineering `domains`. It rewards uniqueness (startup, university, low competition, government) over usefulness. An Iran-only founder accelerator, CEO residency, or executive leadership program run by a startup scores ~90 "hidden gem" automatically.

### HIGH — `hidden-score.ts` gives +25 women boost with no engineering requirement

- **`apps/server/src/intelligence/scoring/config/scoring.config.ts:56`**  
  `womenFocusedBoost` = +25 for any title containing "women"/"female"/"girl" or `category === 'Women Empowerment'` — with no engineering tie-in.

### MEDIUM — Standalone `quality-scorer.ts` is dead code but documents dangerous assumptions

- **`apps/server/src/discovery/utils/quality-scorer.ts`**  
  Not used by stage4 (which re-implements scoring). Gives +20 for `womenFocused` with **NO relevance check at all** — pure bonus for the word "women"/"girl" anywhere in title. Represents the same generic-assumption design.

### MEDIUM — `experienceRequired` defaults to `'SOME'` masks senior roles

- **`apps/server/src/discovery/extraction/utils/normalizers.ts:353`**  
  Defaults missing experience to `'SOME'`, and stage3/validation never reject `EXPERIENCED`. So an extracted "Senior" role with blank experience field silently becomes a plausible student opportunity.

### MEDIUM — `genderEligibility` defaults to `'ALL'`

- **`apps/server/src/discovery/extraction/utils/normalizers.ts:401`**  
  Defaults null gender to `'ALL'`, so women-only relevance (a core MVP feature) is lost when the LLM omits the field, and conversely a non-women program is never flagged as off-target.

---

## 10. Priority Fix List

| Priority     | Issue                                                                          | File(s)                                                                         | Description                                                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRITICAL** | Hardcoded generic audience + categories in daily run                           | `discovery-dashboard.routes.ts:101-103`, `admin.routes.ts:139-140`              | Replace with MVP values: `Women Undergraduate Engineering Students` and active `SearchCategory` enum values (`INTERNSHIPS, STARTUP_INTERNSHIPS, GOVERNMENT_INTERNSHIP, RESEARCH_INTERNSHIP, SCHOLARSHIP, FELLOWSHIP, HACKATHON`).                                                                          |
| **CRITICAL** | Extraction prompt extracts generic career opportunities                        | `extract-opportunity.prompt.ts:16-17`                                           | Change to: "extract engineering internships, scholarships, fellowships, hackathons, and competitions suitable for undergraduate engineering students (1st–4th year)." Remove generic examples (jobs, bootcamps, conferences, grants).                                                                      |
| **CRITICAL** | Source Discovery prompt asks for non-engineering verticals                     | `source-discovery.prompt.ts:17-32`                                              | Restrict to MVP verticals: engineering internships, hackathons, coding competitions, student research programs, engineering scholarships, women-in-tech fellowships. Remove: microfinance, UN programs, rural development, returnships, vocational training, general NGOs.                                 |
| **CRITICAL** | Hidden Gem Scoring ignores relevance                                           | `enrichment-pipeline.ts:376-383`, `hidden-score.ts:50-107`                      | Add relevance/audience/experience checks. Cap hidden-gem score if `experienceRequired === 'EXPERIENCED'`, `audiencePersonas` lacks student personas, or `professionalDomains` lacks engineering domains.                                                                                                   |
| **CRITICAL** | Stage 4 Quality Scoring allows irrelevant 90+ scores                           | `stage4.ts:105-190`                                                             | Add a mandatory "engineering relevance" dimension (e.g., +0–30 points based on branch/domain match). Cap max score if opportunity is non-engineering.                                                                                                                                                      |
| **HIGH**     | Detector allows generic career pages to pass                                   | `opportunity-detector.ts:9-25,319`                                              | Require "internship" or "student" keyword in title/body for non-fellowship/scholarship runs. Add engineering-domain keyword boost. Raise threshold for generic opportunity pages.                                                                                                                          |
| **HIGH**     | Experienced-hire penalty only applies to internship runs                       | `stage4.ts:207-239`, `opportunity-detector.ts:214-227`                          | Move experienced-hire penalties to a global validation layer that applies to ALL run types, not just `INTERNSHIPS`/`STARTUP_INTERNSHIPS`.                                                                                                                                                                  |
| **HIGH**     | Query Planner allocates 45% to non-engineering buckets                         | `query-planner.ts:196-203`                                                      | Reduce `GENERAL_INTERNSHIPS` to 10%, `GOVERNMENT` to 10% (only engineering government sources), `RESEARCH` to 10%. Shift saved 25% to `STARTUP_INTERNSHIPS` and `INTERNSHIPS`.                                                                                                                             |
| **HIGH**     | 9 VC-portfolio sources are not internship producers                            | `registry.ts:407-469`                                                           | Drop or re-target to portfolio company job pages (e.g., `ycombinator.com/jobs` instead of `ycombinator.com`).                                                                                                                                                                                              |
| **HIGH**     | Tech-company seeds lack `internship` tag                                       | `registry.ts:32,40,48`                                                          | Add `internship` to Google, Microsoft, Amazon default tags so `inferCategoryFromTags` maps them to active `INTERNSHIPS`.                                                                                                                                                                                   |
| **HIGH**     | `inferCategoryFromTags` falls back to inactive `GENERAL`                       | `source-registry.service.ts:395-414`                                            | Change fallback from `GENERAL` to an active MVP category (e.g., `INTERNSHIPS`) or throw / return `null` to require explicit tagging.                                                                                                                                                                       |
| **HIGH**     | `OpportunityType`/`SearchCategory`/`OpportunityVertical` include generic types | `opportunity.types.ts:1-14,94-106,112-123`, `opportunity.schema.ts:3-17,82-109` | Trim enums to MVP-relevant values. Remove `JOB, FREELANCE, VOLUNTEER, EVENT, COURSE, PROGRAM, OTHER` from `OpportunityType`. Remove `Job, Training, Entrepreneurship, Volunteer, Event, Other` from `SearchCategory`. Remove `CAREERS, TRAINING, FINANCIAL_AID, EVENTS, OTHER` from `OpportunityVertical`. |
| **HIGH**     | `AudiencePersona` includes non-student personas                                | `opportunity.types.ts:47-64`, `opportunity.schema.ts:45-63`                     | Remove `working-professional, career-break, career-returner, entrepreneur, self-employed, homemaker, veteran` from `AudiencePersona`. Keep only: `college-student, graduate, postgraduate, phd, school-student, dropout, fresher, rural, disabled, minority`.                                              |
| **MEDIUM**   | Dashboard `/metrics` shows generic categories                                  | `discovery-dashboard.routes.ts:204-220`                                         | Filter aggregation to active MVP `SearchCategory` values. Exclude `Job, Training, Volunteer, Event, Other`.                                                                                                                                                                                                |
| **MEDIUM**   | `DiscoveryRun.targetAudience` is unconstrained                                 | `discovery-run.model.ts:6,44`                                                   | Add enum validation: `Women Undergraduate Engineering Students`, `Women Postgraduate Engineering Students`, `Women Engineering Students (All Years)`.                                                                                                                                                      |
| **MEDIUM**   | `DiscoveryContext.categories` is unvalidated                                   | `pipeline.schema.ts:10`, `query.types.ts:2`                                     | Add `.refine()` against active `CATEGORY_REGISTRY` IDs. Reject `['Engineering', 'Tech Workshops']`.                                                                                                                                                                                                        |
| **MEDIUM**   | Enrichment config maps non-engineering keywords                                | `enrichment.config.ts:225-328`                                                  | Remove mappings for `Finance & Fintech`, `Marketing & Sales`, `Design & Creative`, `Content & Journalism`, `Business & Management`, `Education`, `Government & Public Policy` unless they are explicitly tagged as engineering-relevant (e.g., "fintech" for blockchain/security engineering).             |
| **MEDIUM**   | `SourceRegistry.category` enum permits inactive categories                     | `source-registry.model.ts:47-68`                                                | Remove `GENERAL, TECH_CAREERS, GOVERNMENT, RESEARCH, SKILL_DEVELOPMENT` from the DB enum, or mark them invalid and force migration to active categories.                                                                                                                                                   |
| **MEDIUM**   | `SourceType` enum includes generic types                                       | `source-registry.types.ts:8-20`                                                 | Remove `Job Board, Conference, Research Lab, Other`. Keep only MVP-relevant types.                                                                                                                                                                                                                         |
| **MEDIUM**   | `ecosystemType` default is `BIG_TECH`                                          | `source-registry.model.ts:141`                                                  | Change default to `STARTUP` for new auto-discovered sources.                                                                                                                                                                                                                                               |
| **MEDIUM**   | Normalizers default to permissive values                                       | `normalizers.ts:353,388,401`                                                    | Change `experienceRequired` default to `'NONE'`. Change `genderEligibility` default to `null` (force explicit extraction).                                                                                                                                                                                 |
| **MEDIUM**   | Government sources include non-engineering regulators                          | `registry.ts:255-269`                                                           | Remove `RBI` and `SEBI` or reclassify their tags to `finance` only (not engineering).                                                                                                                                                                                                                      |
| **LOW**      | `CAMPUS_AMBASSADOR` bucket generates generic queries                           | `query-planner.ts:177-180,201`                                                  | Reduce budget from 5% to 2%, or require ambassador roles to be explicitly engineering-student programs.                                                                                                                                                                                                    |
| **LOW**      | Orchestrator mislabels `totalQueries`                                          | `discovery-orchestrator.ts:525,550`                                             | Fix to actual query count from query planner output, not `TRUSTED_SOURCES.length`.                                                                                                                                                                                                                         |
| **LOW**      | Generic seed tags (tech/tech/software engineering)                             | `registry.ts:25-57`                                                             | Replace with MVP branch-specific tags: `cse, ai-ml, data-science, cybersecurity, ece, it, bca, mca, web-dev, cloud, devops, mobile`.                                                                                                                                                                       |
| **LOW**      | Dead `quality-scorer.ts` documents dangerous assumptions                       | `utils/quality-scorer.ts`                                                       | Delete or rewrite to align with Stage 4.                                                                                                                                                                                                                                                                   |

---

## 11. Cross-Cutting Observations

1. **The authoritative category registry is correct.** `packages/shared/src/categories.ts` defines a clean, MVP-aligned `CATEGORY_REGISTRY` with active categories: `INTERNSHIPS, STARTUP_INTERNSHIPS, GOVERNMENT_INTERNSHIP, RESEARCH_INTERNSHIP, SCHOLARSHIP, FELLOWSHIP, HACKATHON, WOMEN_IN_TECH, OPEN_SOURCE_PROGRAM, SUMMER_SCHOOL, BOOTCAMP, CAMPUS_AMBASSADOR`. The problem is that schemas, prompts, and runtime code ignore this registry and use broader/generic enums instead.

2. **The break is at integration edges.** The core Stage 1–4 logic has been incrementally updated, but the schemas (`opportunity.schema.ts`, `source-registry.model.ts`), prompts (`extract-opportunity.prompt.ts`, `source-discovery.prompt.ts`), dashboard routes, and seed data (`registry.ts`) still carry the original generic assumptions.

3. **Women-focus is a keyword bonus, not a relevance filter.** Multiple layers (quality scorer, hidden-gem scorer, extraction prompt) grant bonus points for the word "women"/"female" with no engineering tie-in. This means "Women in Finance Fellowship" and "Women in Marketing Leadership Program" can score as highly as "Women in Machine Learning Internship."

4. **No layer encodes the MVP's defining constraint.** None of the four layers (detector, validation, quality, hidden-gem) enforce: _undergraduate engineering-student relevance_ (branch, year, technical domain, intern/student status, experience level ≤ early-career). Detection, validation, quality, and hidden-gem scoring all optimize for "is this a well-formed, trusted, low-competition opportunity page?" rather than "is this useful for a 1st–4th year engineering undergrad?"

---

_End of Audit. No code changes were made._
