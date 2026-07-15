# 1. Vision & Product Philosophy

---

# 1.1 Purpose

Scout exists to solve a problem that almost every college student experiences but rarely talks about:

> **The biggest barrier to getting career opportunities isn't a lack of talent—it's a lack of discovery, confidence, and guidance.**

Thousands of internships, hackathons, scholarships, student programs, fellowships, competitions, research opportunities, and early-career initiatives are published every week across company career portals, government websites, university pages, foundations, startups, newsletters, and niche communities.

The opportunities already exist.

The problem is that students never discover most of them.

Even when they do, they often hesitate to apply because they believe they are "not good enough."

Scout exists to bridge this gap.

Not by becoming another job portal.

But by becoming the student's career companion.

---

# 1.2 The Problem

Today's student career ecosystem is fragmented.

A student searching for internships might simultaneously check:

- LinkedIn
- Internshala
- Unstop
- Company career pages
- Google Careers
- Microsoft Careers
- GitHub repositories
- Telegram groups
- WhatsApp communities
- College placement cells
- Reddit
- Discord communities
- Twitter/X
- University websites

Every platform contains only a fraction of available opportunities.

This creates three major problems.

## Problem 1 — Discovery

Students don't know where opportunities exist.

The opportunity may already be live.

They simply never discover it.

---

## Problem 2 — Confidence

Students constantly underestimate themselves.

Typical thoughts include:

> "I probably don't have enough skills."

> "Google won't select someone like me."

> "Everyone else is better."

As a result, many students reject themselves before companies ever get the chance.

---

## Problem 3 — Guidance

Even when students know about an opportunity, they don't know:

- whether they are eligible
- how competitive it is
- whether they should apply
- what skill they should learn next
- whether spending time preparing is worth it

Most platforms simply display opportunities.

Very few help students make decisions.

---

# 1.3 Why Scout Exists

Scout is built around one simple belief:

> **Talent should never depend on who you know or what platform you happen to follow.**

The internet already contains incredible opportunities.

The challenge is making the right opportunity reach the right student at the right time.

Scout's mission is to dramatically reduce the distance between students and opportunities.

---

# 1.4 Why Another Job Portal Isn't Enough

Most existing platforms are marketplaces.

Their primary goal is to collect listings.

Students are expected to search.

Filter.

Scroll.

Compare.

Repeat.

Every day.

Scout deliberately rejects this model.

Students shouldn't have to search every morning.

Instead,

Scout searches for them.

The Discovery Engine continuously scans hundreds of trusted sources.

The Personalization Engine determines which opportunities matter.

The student receives only what deserves their attention.

The experience shifts from

> "Search until you find something."

to

> "Here's what changed since yesterday."

This changes Scout from a search platform into an intelligent career assistant.

---

# 1.5 Product Philosophy

Scout follows six fundamental principles.

## Principle 1 — Reduce Anxiety

Career building is already stressful.

Scout should never increase stress.

Instead of overwhelming users with hundreds of opportunities,

Scout should provide clarity.

Instead of saying

> "Here are 500 internships."

Scout should say

> "These are the five opportunities you should care about today."

---

## Principle 2 — Build Confidence

Many students never apply because they assume rejection.

Scout should actively encourage action.

Recommendations should explain:

- why an opportunity matches
- why the student is eligible
- why they should still apply even if they don't meet every requirement

Confidence should be based on evidence, not generic motivation.

---

## Principle 3 — Recommend Action, Not Information

Information alone doesn't change outcomes.

Action does.

Every recommendation should answer:

- What should I apply to?
- What should I learn?
- What should I improve?
- What should I do today?

If Scout cannot recommend an action,

it has not completed its job.

---

## Principle 4 — Progress Over Perfection

Students don't need to become perfect before applying.

Instead,

Scout should help them continuously improve.

Every recommendation should answer one of two questions:

> What can you apply for today?

or

> What can you unlock tomorrow?

---

## Principle 5 — Every Student Deserves Hidden Opportunities

Many students only discover opportunities after deadlines pass.

Others only hear about them through seniors or private communities.

Scout believes opportunity discovery should be democratized.

Whether the opportunity comes from a Fortune 500 company or a small nonprofit,

if it's valuable,

students deserve to know about it.

---

## Principle 6 — AI Should Explain, Not Decide

Artificial Intelligence should support decisions,

not replace them.

Scout deliberately separates deterministic logic from AI.

Recommendation ranking remains deterministic.

AI is responsible for:

- explaining recommendations
- summarizing opportunities
- generating daily guidance
- generating weekly reports
- encouraging students

This keeps recommendations transparent, reproducible, affordable, and trustworthy.

---

# 1.6 The Career Operating System

Scout is not designed to become another job board.

It aims to become the student's **Career Operating System**.

A Career Operating System continuously answers questions like:

- What changed today?
- What should I focus on?
- Which opportunities fit me?
- What am I missing?
- What skill should I learn next?
- Am I improving?
- Where should I spend my time?

Unlike traditional platforms,

Scout maintains an ongoing understanding of the student's career journey rather than individual job searches.

---

# 1.7 The Career Loop

Every Scout feature ultimately supports one stage of a continuous career loop.

```text
Discover
     ↓
Understand
     ↓
Become Eligible
     ↓
Apply
     ↓
Track
     ↓
Improve
     ↓
Repeat
```

### Discover

Scout continuously discovers opportunities from across the web using the Discovery Engine.

---

### Understand

The Personalization Engine explains:

- why an opportunity matters
- why it matches
- what makes it valuable

---

### Become Eligible

If the student isn't ready,

Scout identifies the smallest possible improvement that unlocks additional opportunities.

---

### Apply

Scout encourages students to apply rather than self-reject.

---

### Track

Students monitor applications, deadlines, and career progress from a single dashboard.

---

### Improve

Every week Scout recommends the highest-impact improvements.

This creates continuous momentum instead of one-time job searching.

---

# 1.8 Target User

Scout V2 intentionally narrows its audience.

Instead of trying to solve career discovery for everyone,

Scout focuses on one specific group.

## Primary User

Indian undergraduate college girls.

Particularly students in:

- Computer Science
- Information Technology
- Electronics
- AI / Data Science
- Related technical programs

These students actively seek:

- internships
- hackathons
- scholarships
- student programs
- coding competitions
- campus opportunities
- beginner-friendly off-campus experiences

This focused audience allows Scout to deliver significantly better recommendations than a generic platform.

Support for additional user groups can be introduced in future versions without changing the architecture.

---

# 1.9 What Success Looks Like

Scout is successful when students stop asking:

> "Where should I search today?"

and instead ask:

> "What did Scout find for me today?"

The long-term goal is not maximizing clicks or page views.

The goal is maximizing **career breakthroughs**.

Every recommendation, every notification, every AI explanation, and every product decision should ultimately increase the probability that a student achieves meaningful career progress.

That philosophy drives every architectural decision made throughout the Personalization Engine.

# 2. High-Level Architecture

---

# 2.1 Overview

The Personalization Engine is Scout's intelligence layer.

The Discovery Engine is responsible for answering:

> **"What opportunities exist?"**

The Personalization Engine answers:

> **"What should this particular student do next?"**

It transforms thousands of discovered opportunities into a personalized career plan for every student.

Unlike conventional recommendation systems that simply rank items based on historical clicks, Scout continuously reasons about the student's current abilities, goals, eligibility, confidence, progress, and recent market changes.

The output is not merely a ranked list.

It is a continuously evolving action plan.

---

# 2.2 Responsibilities

The Personalization Engine has three primary responsibilities.

## 1. Prioritize

Thousands of opportunities may exist.

Students should only see the few that matter most.

The engine determines:

- What deserves attention today
- What can wait
- What should never be shown
- Which opportunity has the highest expected impact

---

## 2. Guide

Finding opportunities is only half the problem.

Students also need guidance.

Scout continuously answers questions such as:

- Why does this opportunity match me?
- Am I actually eligible?
- What am I missing?
- What should I improve next?
- Is it worth applying?

---

## 3. Retain

Scout should become a habit rather than a search tool.

Instead of requiring students to remember checking opportunities,

Scout gives them reasons to return.

Examples include:

- Daily Delta
- Today's Mission
- New opportunities unlocked
- Weekly progress
- Application reminders
- Deadline alerts

---

# 2.3 Architectural Position

The Personalization Engine sits between the Discovery Engine and the User Interface.

```text
                   External Sources
                          │
                          ▼
                Discovery Engine
                          │
                          ▼
               Opportunity Database
                          │
                          ▼
              Personalization Engine
        ┌────────────┬──────────────┐
        │            │              │
        ▼            ▼              ▼
 Recommendation   Career Logic    AI Layer
        │            │              │
        └────────────┴──────────────┘
                     │
                     ▼
                Dashboard API
                     │
                     ▼
                  Frontend
```

The Discovery Engine discovers opportunities.

The Personalization Engine understands the student.

Together they create personalized recommendations.

---

# 2.4 Inputs

The Personalization Engine consumes information from multiple sources.

## User Profile

Collected during onboarding.

Includes:

- Degree
- Branch
- Graduation year
- Skills
- Interests
- Career goals
- Resume
- Preferred work mode
- Preferred locations
- Weekly availability

---

## Discovery Engine

Provides enriched opportunities.

Each opportunity includes metadata such as:

- Category
- Skills required
- Deadline
- Remote status
- Organization
- Hidden Gem Score
- Trust Score
- Beginner friendliness
- Estimated difficulty
- Opportunity quality score

---

## User Activity

Generated automatically.

Examples include:

- Saved opportunities
- Applications
- Profile updates
- Resume uploads
- Skills added
- Opportunities dismissed
- Opportunities viewed

---

## Historical Recommendations

The engine remembers previously shown recommendations.

This prevents:

- repetitive feeds
- recommendation loops
- recommendation fatigue

---

# 2.5 Outputs

The Personalization Engine produces several independent outputs.

## Ranked Opportunity Feed

The primary dashboard feed.

Ordered according to the student's current situation.

---

## Today's Mission

One or more small actionable tasks.

Examples:

- Apply to one internship.
- Complete your profile.
- Add Git.
- Upload resume.
- Finish one pending application.

---

## Daily Delta

Everything that changed since the user's previous visit.

Examples:

- Three new internships discovered.
- Two deadlines approaching.
- One opportunity expired.
- Four new hackathons matched.

---

## Unlock Suggestions

Recommendations that increase future opportunities.

Example:

> Learn SQL.

> Unlock 19 additional internships.

---

## Confidence Messages

Evidence-based encouragement.

Example:

> You satisfy 8 of 10 requirements.

> Apply anyway.

---

## Weekly Report

A summary containing:

- profile growth
- applications
- new discoveries
- opportunities unlocked
- suggested improvements

---

# 2.6 Internal Modules

The engine is composed of several independent modules.

## Opportunity Ranking

Determines recommendation order.

---

## Opportunity Explanation

Explains every recommendation.

---

## Daily Delta Generator

Compares today's database against yesterday's recommendations.

Produces personalized changes.

---

## Unlock Engine

Calculates which small improvements unlock the largest number of future opportunities.

---

## Confidence Engine

Generates personalized encouragement.

---

## Why Not Engine

Explains why an opportunity was not recommended.

---

## Career Readiness Analyzer

Measures overall readiness.

Highlights missing skills.

---

## Resume Intelligence

Extracts structured information from resumes.

Stores reusable metadata.

---

## Application Tracker

Tracks application lifecycle.

Generates reminders.

---

## Weekly Report Generator

Summarizes weekly progress.

---

# 2.7 Personalization Lifecycle

Every student follows the same daily lifecycle.

```text
Student opens Scout
          │
          ▼
Load Profile
          │
          ▼
Fetch Today's Opportunities
          │
          ▼
Apply Deterministic Ranking
          │
          ▼
Generate Daily Delta
          │
          ▼
Generate Today's Mission
          │
          ▼
Attach Cached AI Explanations
          │
          ▼
Render Dashboard
```

Notice that AI does **not** participate in ranking.

Ranking always happens first.

---

# 2.8 Daily Background Workflow

Even while the student is offline, Scout continues working.

```text
Discovery Engine finishes crawl
             │
             ▼
Opportunity Database updated
             │
             ▼
Personalization Queue
             │
             ▼
Recalculate rankings
             │
             ▼
Generate Daily Delta
             │
             ▼
Run scheduled AI enrichment
             │
             ▼
Cache recommendations
```

This means recommendations are largely prepared before the student logs in.

The dashboard loads quickly without waiting for expensive AI inference.

---

# 2.9 Interaction with the Discovery Engine

The Personalization Engine deliberately does **not** crawl websites.

Its only responsibility is understanding users.

The Discovery Engine remains responsible for:

- crawling
- enrichment
- deduplication
- normalization
- trust scoring
- hidden gem scoring
- deadline extraction

The Personalization Engine consumes these outputs as structured inputs.

This separation keeps both systems independently scalable.

---

# 2.10 AI Position in the Architecture

Scout intentionally limits AI usage.

AI never decides:

- ranking
- eligibility
- recommendation order
- scoring

Those decisions remain deterministic.

Instead, AI operates after ranking.

Its responsibilities include:

- explaining recommendations
- summarizing opportunities
- generating encouragement
- creating weekly reports
- generating Daily Delta narratives

This dramatically reduces cost while improving transparency.

---

# 2.11 Scalability Philosophy

The architecture is designed around independent modules.

Each module can evolve without affecting the others.

For example:

- A better recommendation algorithm should not require Discovery Engine changes.
- Resume Intelligence can improve independently.
- AI providers can be replaced without changing business logic.
- New personalization modules can be introduced without rewriting the ranking engine.

This modular architecture ensures Scout can grow from an MVP into a production-scale platform while keeping individual components simple, testable, and maintainable.

# 3. Core Personalization Modules

---

# Overview

The Personalization Engine is composed of independent modules, each responsible for solving one specific problem in a student's career journey.

Instead of building one large recommendation algorithm that tries to solve everything, Scout separates personalization into focused services.

Each module has:

- A clear responsibility
- Well-defined inputs
- Deterministic outputs
- Independent implementation
- Minimal coupling with other modules

This architecture makes Scout easier to test, extend, and evolve.

---

# 3.1 Opportunity Ranking Engine

## Purpose

Determine which opportunities deserve the student's attention today.

Rather than showing every matching opportunity, the Ranking Engine identifies those most likely to create meaningful career progress.

This is the heart of Scout.

---

## Responsibilities

- Filter irrelevant opportunities
- Rank opportunities deterministically
- Remove duplicates
- Balance diversity
- Prioritize deadlines
- Promote Hidden Gems
- Avoid repetitive feeds

---

## Inputs

- User Profile
- Skills
- Resume metadata
- Career goals
- Discovery Engine opportunity metadata
- Previous recommendations
- Saved opportunities
- User preferences

---

## Outputs

A ranked list of opportunities.

Each recommendation contains:

- Opportunity
- Match Score
- Rank
- Recommendation Reason ID
- AI Explanation ID (cached)

---

## AI Usage

None.

Ranking is fully deterministic.

---

---

# 3.2 Opportunity Explanation Engine

## Purpose

Help students understand *why* Scout recommended an opportunity.

Transparency builds trust.

Instead of saying

> Recommended

Scout explains

> Recommended because...

---

## Responsibilities

Generate human-readable explanations.

Example:

> You already know React and JavaScript.
>
> This internship requires both.
>
> You're also graduating in 2028, making you eligible.

---

## Inputs

- Ranked opportunity
- User profile
- Matching factors

---

## Outputs

A short explanation.

Approximately 2–4 sentences.

---

## AI Usage

Yes.

One cached explanation per opportunity-user pair.

---

---

# 3.3 Daily Delta Engine

## Purpose

Answer one simple question:

> What changed since yesterday?

This creates a daily reason to open Scout.

---

## Responsibilities

Compare today's opportunity graph against yesterday.

Detect:

- new opportunities
- expired opportunities
- deadline updates
- newly eligible opportunities
- profile changes affecting recommendations

---

## Example

```text
Since your last visit:

• 4 new internships match you.
• 2 deadlines are tomorrow.
• You unlocked 7 new opportunities.
```

---

## Inputs

- Previous recommendation snapshot
- Current recommendation snapshot
- User profile

---

## Outputs

Daily summary.

---

## AI Usage

Optional.

AI converts deterministic changes into natural language.

---

---

# 3.4 Today's Mission Engine

## Purpose

Reduce decision fatigue.

Students shouldn't wonder:

> What should I do today?

Scout should answer.

---

## Responsibilities

Generate one or two high-impact tasks.

Examples

- Apply to Microsoft Explore.
- Upload your resume.
- Add SQL to your profile.
- Finish your pending application.

---

## Selection Rules

Highest impact

↓

Lowest effort

↓

Most urgent

---

## Inputs

- Current recommendations
- Missing profile fields
- Resume status
- Pending applications

---

## Outputs

One primary mission.

Optional secondary mission.

---

## AI Usage

Optional.

Used only to phrase missions naturally.

---

---

# 3.5 Unlock Engine

## Purpose

Show students how to unlock more opportunities.

Instead of focusing on rejection,

focus on progress.

---

## Responsibilities

Estimate

"If you improve X,

how many opportunities become available?"

---

## Example

```text
Learn SQL

↓

Unlock 23 internships
```

---

Another example

```text
Complete one React project

↓

Become eligible for 11 hackathons
```

---

## Inputs

- Skills graph
- Opportunity requirements
- User profile

---

## Outputs

Ranked unlock suggestions.

---

## AI Usage

No.

Entirely deterministic.

---

---

# 3.6 Confidence Engine

## Purpose

Reduce self-rejection.

Many students reject themselves before companies do.

Scout encourages action using evidence.

---

## Responsibilities

Generate confidence signals.

Examples

```text
You satisfy 8 of 10 requirements.

Apply anyway.
```

```text
Students from your year have previously been eligible.

Don't miss this opportunity.
```

```text
This opportunity welcomes beginners.
```

---

## Inputs

- Match score
- Missing skills
- Opportunity metadata

---

## Outputs

Confidence message.

---

## AI Usage

Yes.

Small, inexpensive prompt.

---

---

# 3.7 Why Not Engine

## Purpose

Increase trust.

Explain why opportunities weren't recommended.

---

## Example

Instead of hiding Google STEP,

Scout says

```text
Currently hidden.

Reason:

Requires graduation year 2027.

Update your graduation year if incorrect.
```

Another example

```text
Hidden because

Python is required.

Learning Python unlocks this.
```

---

## Responsibilities

Generate deterministic explanations.

---

## Inputs

Filtering decisions.

---

## Outputs

Reason.

Unlock suggestion.

---

## AI Usage

No.

---

---

# 3.8 Career Readiness Engine

## Purpose

Estimate overall preparedness.

Instead of a meaningless score,

Scout measures readiness.

---

## Components

- Resume
- Projects
- Skills
- Experience
- Applications
- Profile completeness

---

## Example

```text
Career Readiness

74%

Strong areas

✔ Git

✔ React

Needs improvement

• Resume

• SQL

• One backend project
```

---

## Outputs

Readiness Score.

Improvement suggestions.

---

## AI Usage

No.

---

---

# 3.9 Resume Intelligence

## Purpose

Extract useful information once.

Reuse forever.

---

## Responsibilities

Extract

- skills
- technologies
- projects
- certifications
- education
- achievements

Store structured metadata.

Never repeatedly analyze the same resume.

---

## Inputs

Uploaded PDF.

---

## Outputs

Structured profile.

---

## AI Usage

Yes.

Exactly once per resume version.

Future recommendation requests reuse stored metadata.

---

---

# 3.10 Application Tracker

## Purpose

Help students manage applications.

Scout becomes their career dashboard.

---

## Responsibilities

Track

- Applied
- Saved
- Interview
- Assessment
- Rejected
- Offer

Track dates.

Generate reminders.

---

## Inputs

User actions.

---

## Outputs

Timeline.

Upcoming reminders.

Application statistics.

---

## AI Usage

None.

---

---

# 3.11 Weekly Report Engine

## Purpose

Summarize career progress.

Students often underestimate their own improvement.

Weekly reports make progress visible.

---

## Example

```text
This Week

Applied:
4

Saved:
12

New Opportunities:
19

Unlocked:
8

Resume Strength:
+12%

Career Readiness:
74 → 81
```

---

## Responsibilities

Summarize

- applications
- profile improvements
- new opportunities
- recommendation changes
- upcoming deadlines

---

## Outputs

Weekly report.

---

## AI Usage

Yes.

Only for narrative generation.

Statistics remain deterministic.

---

# 3.12 Module Interaction

The modules work together but remain independent.

```text
                 User Profile
                       │
                       ▼
            Opportunity Ranking Engine
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
Explanation      Confidence      Why Not
        │
        ▼
Today's Feed
        │
        ▼
Daily Mission
        │
        ▼
Unlock Engine
        │
        ▼
Career Readiness
        │
        ▼
Weekly Report
```

This modular architecture ensures that each component has a single responsibility.

A failure in one module should never prevent the others from functioning.

For example:

- If AI explanations fail, recommendations still work.
- If Resume Intelligence is unavailable, ranking still operates using profile data.
- If Weekly Reports are delayed, the dashboard remains fully functional.

This separation keeps Scout resilient, scalable, and easy to evolve as new personalization capabilities are introduced.

# 4. Recommendation Pipeline

---

# Overview

The Recommendation Pipeline is the execution engine of Scout's Personalization Engine.

Its responsibility is straightforward:

> Given one user and thousands of discovered opportunities, determine **the best opportunities to show right now.**

Unlike traditional recommendation systems that rely heavily on machine learning or LLMs, Scout deliberately adopts a **deterministic ranking architecture**.

Every recommendation should be:

- Explainable
- Reproducible
- Fast
- Cost-efficient
- Easy to debug

Artificial Intelligence is intentionally **not** responsible for deciding what to recommend.

AI only helps explain recommendations after they have already been selected.

---

# 4.1 Design Philosophy

Scout optimizes for one outcome:

> **Maximize career breakthroughs, not click-through rates.**

Traditional recommendation systems optimize metrics such as:

- Clicks
- Session time
- Advertisements
- Engagement

Scout instead optimizes:

- Applications submitted
- Opportunities discovered
- Skills unlocked
- Student confidence
- Career progress

This changes how the ranking system is designed.

---

# 4.2 High-Level Pipeline

```text
Load User
      │
      ▼
Load Eligible Opportunities
      │
      ▼
Basic Eligibility Filter
      │
      ▼
Hard Rule Filtering
      │
      ▼
Compute Deterministic Scores
      │
      ▼
Freshness Adjustment
      │
      ▼
Deadline Boost
      │
      ▼
Hidden Gem Boost
      │
      ▼
Diversity Pass
      │
      ▼
Deduplicate Feed
      │
      ▼
Top N Opportunities
      │
      ▼
AI Explanations (Cached)
      │
      ▼
Dashboard
```

Every stage has one responsibility.

No stage performs unnecessary work.

---

# 4.3 Step 1 — Candidate Retrieval

Retrieve opportunities from MongoDB.

This is **not** the full database.

Scout first performs lightweight filtering.

Examples:

- Active opportunities only
- Non-expired
- Verified
- Accepted quality level
- Matching broad category

This reduces thousands of records to a manageable candidate pool.

Example

```text
Database

↓

18,000 opportunities

↓

Candidate retrieval

↓

820 opportunities
```

---

# 4.4 Step 2 — Eligibility Filtering

Next, Scout removes opportunities that are impossible.

Examples

Wrong graduation year

Requires Master's degree

Country restricted

Women-only mismatch

Remote preference conflict

Already applied

Already expired

These are deterministic yes/no filters.

No ranking occurs yet.

Example

```text
820

↓

Eligibility

↓

390
```

---

# 4.5 Step 3 — Opportunity Scoring

Each remaining opportunity receives a deterministic score.

Example scoring model

| Component | Weight |
|------------|--------|
| Skill Match | 30 |
| Career Goal Match | 20 |
| Branch Match | 15 |
| Graduation Year | 10 |
| Interest Match | 10 |
| Hidden Gem Score | 5 |
| Trust Score | 5 |
| Freshness | 3 |
| Deadline Urgency | 2 |

Total

100 points.

The exact weights should remain configurable.

---

# 4.6 Skill Matching

Skills contribute the largest portion of the score.

Example

Opportunity requires

- React
- Git
- JavaScript

User has

- React
- Git

Skill Match

```text
2 / 3

=

66%
```

Weighted contribution is added to the final score.

Future versions may include semantic skill matching.

Example

React Native

≈

React

But MVP uses deterministic mappings.

---

# 4.7 Career Goal Matching

Scout asks during onboarding:

What are you currently looking for?

Examples

- Internship
- Hackathon
- Scholarship
- Research
- Open Source
- Beginner Experience

Matching opportunities receive additional score.

Example

Student

Internships

↓

Internship

+20

↓

Scholarship

+5

---

# 4.8 Branch Matching

Some opportunities explicitly target:

- CSE
- ECE
- AI
- IT

Branch compatibility increases ranking.

General opportunities remain visible but receive smaller bonuses.

---

# 4.9 Graduation Year Matching

Many student programs target:

- First year
- Second year
- Third year
- Final year

This is a deterministic filter.

Example

Google STEP

Eligible

↓

Second Year

User

↓

Second Year

↓

Full score.

---

# 4.10 Freshness Adjustment

Students should see newly discovered opportunities first.

Example

Today

+3

Yesterday

+2

Three days ago

+1

Older

0

Freshness should never dominate ranking.

It simply breaks ties.

---

# 4.11 Deadline Boost

Deadlines matter.

A perfect opportunity closing tonight deserves visibility.

Example

Closing today

+2

Tomorrow

+1.5

This week

+1

Later

0

Expired

Filtered earlier.

---

# 4.12 Hidden Gem Boost

One of Scout's biggest differentiators.

Discovery Engine computes Hidden Gem Score.

Recommendation Engine uses it.

Example

Excellent opportunity

Very low visibility

↓

Boost ranking.

Students should discover opportunities before everyone else.

---

# 4.13 Trust Score

Discovery Engine also computes Trust Score.

Official company portals receive higher confidence.

Examples

Google Careers

Microsoft Careers

Government websites

University websites

↓

Higher trust.

Random blogs

↓

Lower.

Trust never overrides relevance.

---

# 4.14 Diversity Pass

Without intervention,

feeds become repetitive.

Example

Top 20

↓

All Microsoft internships.

Instead,

Scout enforces diversity.

Possible constraints

Maximum

3 internships

from one organization.

Maximum

5 hackathons

in first 20.

Minimum

One scholarship

if relevant.

Minimum

One beginner-friendly opportunity.

This creates a healthier feed.

---

# 4.15 Cold Start Strategy

New users have little information.

Scout therefore falls back to:

Degree

↓

Branch

↓

Year

↓

Career Goal

↓

Popular opportunities

As onboarding improves,

ranking becomes increasingly personalized.

---

# 4.16 Caching Strategy

Ranking itself is inexpensive.

Still,

Scout caches recommendation feeds.

Cache key

```text
User

+

Profile Version

+

Opportunity Index Version
```

Cache invalidates when

- profile changes
- Discovery Engine updates
- resume changes

This dramatically reduces computation.

---

# 4.17 AI Integration

Only after ranking completes

does AI participate.

Pipeline becomes

```text
Rank

↓

Select Top 20

↓

Generate Explanation

↓

Generate Confidence

↓

Cache

↓

Serve
```

This prevents wasting tokens.

Never generate explanations

for opportunities the user never sees.

---

# 4.18 Failure Strategy

If AI becomes unavailable,

recommendations continue.

Example

Dashboard

Opportunity

Match Score

Confidence

Reason

instead of

Opportunity

AI Explanation

Everything still functions.

Scout gracefully degrades.

---

# 4.19 Recommendation Lifecycle

```text
Discovery Engine

↓

Opportunity Database Updated

↓

Recommendation Cache Invalidated

↓

Background Ranking

↓

Cache Top Recommendations

↓

User Opens Dashboard

↓

Serve Cached Feed

↓

Generate Missing AI

↓

Refresh Cache
```

The dashboard should rarely wait for expensive computation.

---

# 4.20 Performance Goals

Target performance

| Stage | Target |
|--------|---------|
| Candidate Retrieval | <100 ms |
| Filtering | <50 ms |
| Ranking | <150 ms |
| Cache Lookup | <20 ms |
| Dashboard Response | <500 ms |
| AI Explanation (Background) | Async |

The recommendation pipeline should remain fast even as Scout grows to tens of thousands of opportunities.

---

# 4.21 Guiding Principles

The Recommendation Pipeline follows five non-negotiable principles.

### 1. Deterministic First

Ranking must never depend on an LLM.

---

### 2. Explainable

Every recommendation should have a clear reason.

---

### 3. Fast

Students should never wait for recommendations.

---

### 4. Cost Efficient

AI is used only after ranking and only for visible opportunities.

---

### 5. Opportunity First

Scout does not optimize for engagement.

It optimizes for helping students discover opportunities they would otherwise miss.

Every stage of the pipeline exists to maximize that outcome.

# 5. Personalization Signals & User Profile

---

# Overview

The quality of Scout's recommendations depends entirely on the quality of the signals it receives.

Unlike traditional job portals that rely almost exclusively on resumes or keyword searches, Scout builds a **living career profile** for every student.

This profile is not static.

It continuously evolves through:

- onboarding
- resume uploads
- user interactions
- applications
- bookmarks
- profile updates
- discovery history

The goal is not to collect as much information as possible.

The goal is to collect only the information that meaningfully improves recommendations.

Every field in the user profile must answer one question:

> **"Will this help Scout recommend better opportunities?"**

If the answer is no, Scout should not ask for it.

---

# 5.1 Signal Categories

Scout organizes user information into six major signal groups.

```text
User Profile
│
├── Identity Signals
├── Academic Signals
├── Career Signals
├── Skill Signals
├── Behavioral Signals
└── Progress Signals
```

Each category contributes differently to personalization.

---

# 5.2 Identity Signals

These identify the student at a high level.

They rarely change.

## Examples

- Name
- Email
- Age (optional)
- Gender
- State
- Country

Identity signals are **not** used for ranking except where opportunities have explicit geographic restrictions.

They mainly support:

- authentication
- localization
- notifications
- analytics

---

# 5.3 Academic Signals

Academic information is one of Scout's strongest ranking signals.

Many student opportunities have strict academic eligibility.

## Fields

- College
- University
- Degree
- Branch
- Current Year
- Graduation Year
- CGPA (optional)
- Academic Backlogs (optional)

---

## Why They Matter

These signals immediately eliminate impossible opportunities.

Example

Google STEP

↓

Second-year undergraduate

↓

Student is fourth year

↓

Filtered instantly.

This avoids wasting recommendation space.

---

# 5.4 Career Signals

Career Signals represent **what the student wants**, not merely what they study.

These are among the most important onboarding fields.

## Career Goals

Examples

- Internship
- Hackathon
- Scholarship
- Research Program
- Student Ambassador
- Fellowship (where eligible)
- Open Source
- Competitions
- Early Career Programs

Students can select multiple goals.

Each receives a priority.

Example

```text
Primary

Internships

Secondary

Hackathons

Third

Scholarships
```

These priorities directly influence recommendation ranking.

---

# 5.5 Interest Signals

Students within the same branch often pursue completely different careers.

Interest Signals capture those preferences.

Examples

- Web Development
- Artificial Intelligence
- Cybersecurity
- Data Science
- UI/UX
- Cloud Computing
- Mobile Development
- Robotics
- Product Management
- Research

Interest matching increases recommendation relevance without requiring AI.

---

# 5.6 Skill Signals

Skills form the largest portion of the recommendation score.

Scout stores structured skills instead of free-form text whenever possible.

Example

```text
Java

Python

Git

SQL

React

Next.js

MongoDB

Figma
```

Every skill has metadata.

Example

```text
Skill

React

Confidence

Intermediate

Source

Resume
```

Sources may include:

- Resume
- Onboarding
- Manual edit
- GitHub
- Future integrations

---

# 5.7 Experience Signals

Students often underestimate their own experience.

Scout captures beginner-friendly indicators.

Examples

Projects

Open Source

Hackathons

Research

Freelancing

Part-time work

Leadership

Volunteering

Teaching

Even small experiences improve personalization.

---

# 5.8 Resume Signals

The resume becomes a structured knowledge source.

Scout does **not** repeatedly analyze PDFs.

Instead,

Resume Intelligence extracts:

- skills
- projects
- certifications
- education
- technologies
- achievements

The extracted metadata becomes part of the profile.

Whenever recommendations run,

Scout uses the structured metadata instead of reopening the resume.

This minimizes AI usage.

---

# 5.9 Behavioral Signals

Behavior often reveals more than onboarding.

Scout continuously learns from user interactions.

Examples

Saved opportunities

Applied opportunities

Dismissed opportunities

Viewed opportunities

Recently opened categories

Time spent

Repeated searches

Unlike recommendation algorithms that optimize engagement, Scout uses behavior to refine relevance—not to maximize screen time.

---

# 5.10 Progress Signals

One of Scout's unique concepts is measuring progress rather than activity.

Examples

New skill added

Resume uploaded

Projects increased

Career Readiness improved

Applications submitted

Profile completion

Progress Signals power:

- Weekly Reports
- Unlock Engine
- Career Readiness
- Confidence messages

---

# 5.11 Preference Signals

Students should control how opportunities are recommended.

Examples

Remote only

Hybrid

On-site

Preferred cities

Preferred countries

Internship duration

Paid only

Women-only opportunities

Beginner-friendly

Work authorization preferences

These preferences influence filtering before ranking.

---

# 5.12 Opportunity History

Scout remembers previous recommendations.

Examples

Already applied

Already saved

Already rejected

Already ignored

Already expired

This prevents repetitive feeds.

Students should rarely see identical recommendations day after day unless something meaningful changes.

---

# 5.13 Implicit vs Explicit Signals

Scout combines two types of signals.

## Explicit Signals

Information directly provided by the student.

Examples

Degree

Skills

Career goals

Preferred locations

Resume

---

## Implicit Signals

Information inferred from behavior.

Examples

Frequently saving hackathons

Ignoring scholarships

Opening frontend internships

Applying only to remote roles

Implicit signals help fine-tune recommendations without repeatedly asking questions.

---

# 5.14 Signal Freshness

Not every signal ages equally.

Some should rarely change.

Others should evolve continuously.

| Signal | Update Frequency |
|----------|----------------|
| Degree | Rare |
| Branch | Rare |
| Graduation Year | Rare |
| Skills | Frequent |
| Resume | Occasional |
| Interests | Occasional |
| Career Goals | Occasional |
| Behavior | Continuous |
| Applications | Continuous |

Scout should always use the freshest available information.

---

# 5.15 Profile Completeness

Rather than forcing users to complete lengthy onboarding, Scout tracks profile completeness.

Example

```text
Career Profile

82% Complete
```

Missing signals may include:

- Resume
- Skills
- Career goals
- Preferred work mode

Improving profile completeness directly improves recommendation quality.

---

# 5.16 Signal Importance

Not every signal contributes equally.

Approximate importance for MVP:

| Signal | Relative Importance |
|----------|--------------------|
| Skills | ⭐⭐⭐⭐⭐ |
| Career Goals | ⭐⭐⭐⭐⭐ |
| Graduation Year | ⭐⭐⭐⭐ |
| Degree & Branch | ⭐⭐⭐⭐ |
| Resume Metadata | ⭐⭐⭐⭐ |
| Interests | ⭐⭐⭐ |
| Preferences | ⭐⭐⭐ |
| Behavioral History | ⭐⭐⭐ |
| Progress Signals | ⭐⭐ |
| Identity Signals | ⭐ |

This ordering should guide onboarding.

Scout should ask the highest-impact questions first.

---

# 5.17 Profile Evolution

A student's profile is never considered complete.

Instead, it continuously evolves.

```text
Onboarding
      │
      ▼
Resume Upload
      │
      ▼
Recommendations
      │
      ▼
User Actions
      │
      ▼
Profile Updated
      │
      ▼
Better Recommendations
      │
      ▼
More Career Progress
      │
      ▼
Repeat
```

Each interaction makes Scout slightly smarter without increasing user effort.

---

# 5.18 Design Principles

The user profile follows five principles.

### 1. Ask Less

Only collect information that directly improves recommendations.

---

### 2. Learn Continuously

User behavior should gradually replace repeated questioning.

---

### 3. Never Waste AI

Resume parsing happens once per resume version.

Structured data is reused everywhere.

---

### 4. Progressive Profiling

Students should not face a long onboarding form.

Scout can request additional information naturally over time when it unlocks better recommendations.

---

### 5. Every Signal Must Have a Purpose

Every field stored in the database should be traceable to a personalization decision.

If a signal never affects recommendations, filtering, confidence, or guidance, it should not exist in the MVP schema.

This philosophy keeps Scout lightweight for users while ensuring every piece of information contributes to a better career experience.

# 6. Recommendation Intelligence

---

# Overview

Recommendation Intelligence is the reasoning layer of Scout.

The Recommendation Pipeline determines:

> **"Which opportunities should be shown?"**

Recommendation Intelligence answers:

> **"Why these opportunities, why now, and what should the student do next?"**

This is where Scout stops behaving like a recommendation engine and starts behaving like a career mentor.

Importantly, Recommendation Intelligence does **not** change rankings.

It adds context, confidence, explanations, guidance, and actionable insights around already-ranked opportunities.

---

# 6.1 Philosophy

Traditional job portals stop after listing opportunities.

Scout goes one step further.

Instead of showing

> Google STEP Internship

Scout tells the student

- Why it was recommended
- Whether they are eligible
- Which requirements they already satisfy
- Which requirements are missing
- Whether they should apply anyway
- What they should improve next

The recommendation itself becomes actionable.

---

# 6.2 Recommendation Card

Every recommendation should answer six questions.

```text
What is this?

↓

Why am I seeing this?

↓

Am I eligible?

↓

How strong is my profile?

↓

Should I apply?

↓

What should I improve?
```

A recommendation is therefore much richer than simply displaying an opportunity title.

---

# 6.3 Match Explanation

Every recommendation contains a short explanation.

Example

```text
Recommended because

• Matches your interest in Web Development
• Requires React and Git, both found in your profile
• Open to second-year students
```

The explanation should be concise and immediately understandable.

---

## Inputs

- User profile
- Opportunity metadata
- Matching signals

---

## AI Usage

Yes.

Generated once and cached.

---

# 6.4 Eligibility Analysis

Students often skip opportunities because they assume they are not eligible.

Scout instead performs an eligibility breakdown.

Example

```text
Eligibility

✔ Second-year student

✔ CSE branch

✔ React

✔ Git

❌ SQL

Overall Eligibility

80%
```

Rather than simply saying "Eligible" or "Not Eligible", Scout explains why.

---

## Deterministic

Eligibility is computed using structured metadata.

No AI reasoning is required.

---

# 6.5 Confidence Layer

One of Scout's primary goals is reducing self-rejection.

Many students never apply because they underestimate themselves.

Confidence messages should always be evidence-based.

Examples

```text
You satisfy 8 of the 10 listed requirements.

Apply anyway.
```

```text
This internship explicitly welcomes beginners.
```

```text
Previous applicants often had similar profiles.
```

The objective is encouragement without making unrealistic promises.

---

# 6.6 Missing Skills

Rather than simply rejecting opportunities,

Scout identifies the smallest gap preventing success.

Example

```text
Missing

• SQL

Estimated learning time

1–2 weeks

Unlocks

19 internships
```

Students immediately know what to improve.

---

# 6.7 Unlock Opportunities

Recommendation Intelligence continuously asks

> "What is the highest-return improvement?"

Example

```text
Complete one React project

↓

Unlock

14 internships

6 hackathons

2 open-source programs
```

The recommendation engine becomes future-oriented instead of only present-oriented.

---

# 6.8 Opportunity Priority Labels

Each recommendation receives a simple action label.

Examples

```text
Apply Today
```

```text
Highly Recommended
```

```text
Good Backup Option
```

```text
Hidden Gem
```

```text
Deadline Soon
```

These labels help students prioritize quickly.

---

# 6.9 Hidden Gem Highlight

One of Scout's strongest differentiators.

When Discovery Engine identifies an opportunity with a high Hidden Gem Score,

Recommendation Intelligence explains why.

Example

```text
Hidden Gem

Low competition

Official company portal

Strong profile match
```

Students immediately understand why Scout surfaced something they likely hadn't seen elsewhere.

---

# 6.10 Deadline Intelligence

Deadlines are more than dates.

Recommendation Intelligence converts them into urgency.

Example

```text
Deadline

Tomorrow
```

```text
3 days remaining
```

```text
Applications just opened
```

Urgency is much easier to process than raw timestamps.

---

# 6.11 Opportunity Fit

Every recommendation includes an approximate fit score.

Example

```text
Overall Fit

92%
```

This score is derived from deterministic ranking signals.

It is not an AI-generated confidence score.

---

## Fit Components

Example

```text
Skills

95%

Eligibility

100%

Interests

90%

Career Goal

100%

Freshness

High
```

Students understand where the score comes from.

---

# 6.12 Why Not?

Some attractive opportunities may not appear in the feed.

Scout should explain why.

Example

```text
Currently Hidden

Reason

Requires final-year students.
```

Another example

```text
Hidden

Requires Python.

Learning Python unlocks this.
```

Transparency builds trust.

---

# 6.13 Alternative Recommendations

If a student is not yet ready,

Scout suggests nearby alternatives.

Example

```text
Instead of

Google STEP

Try

Microsoft Discovery

Adobe Career Essentials

Amazon Future Builders
```

The student never reaches a dead end.

---

# 6.14 Opportunity Comparison

Students often struggle to choose between similar opportunities.

Scout should eventually support side-by-side comparison.

Example

```text
Microsoft Explore

vs

Google STEP

Eligibility

Skills

Deadline

Difficulty

Benefits

Competition
```

For MVP, this can remain a future enhancement.

---

# 6.15 AI Responsibilities

AI performs language generation only.

Examples

- Recommendation explanations
- Confidence messages
- Weekly summaries
- Daily Delta narrative

AI never decides

- Rankings
- Eligibility
- Match scores
- Filters
- Hidden Gem scores
- Trust scores

Those remain deterministic.

---

# 6.16 Caching Strategy

Recommendation Intelligence is relatively expensive.

Outputs should therefore be cached.

Cache examples

```text
Recommendation Explanation

(User + Opportunity)
```

```text
Confidence Message

(User + Opportunity)
```

```text
Weekly Report

(User + Week)
```

Caches expire when

- Profile changes
- Resume changes
- Opportunity changes

This minimizes repeated AI calls.

---

# 6.17 Failure Handling

If AI is unavailable,

Scout should still function.

Example

Instead of

```text
Recommended because...

(Generated explanation)
```

Fallback to

```text
Matched

• React
• JavaScript
• Second Year
```

Users should never lose access to opportunities because an LLM failed.

---

# 6.18 User Experience Goals

Every recommendation should make the student feel:

✔ I understand why this is here.

✔ I know whether I'm eligible.

✔ I know what I'm missing.

✔ I know what to do next.

✔ I feel confident enough to apply.

If Recommendation Intelligence achieves these five outcomes, Scout becomes much more than a recommendation engine—it becomes a trusted career guide.

---

# 6.19 Design Principles

Recommendation Intelligence follows six principles.

### 1. Explain Every Recommendation

Never recommend silently.

---

### 2. Build Confidence, Not False Hope

Encourage students using evidence, never guarantees.

---

### 3. Focus on Action

Every recommendation should lead to a clear next step.

---

### 4. Stay Deterministic

AI explains decisions; it never makes them.

---

### 5. Reuse Intelligence

Cache explanations wherever possible to minimize AI costs.

---

### 6. Turn Information into Guidance

The best recommendation is not the one with the highest score.

It is the one that leaves the student thinking:

> **"I know exactly what I should do next."**

# 7. AI Strategy

---

# Overview

Artificial Intelligence is an important part of Scout, but it is **not the decision maker**.

One of Scout's core architectural principles is:

> **AI should generate language, never business logic.**

This keeps recommendations explainable, reproducible, inexpensive, and resilient.

Whenever deterministic logic can solve a problem, Scout uses deterministic logic.

AI is introduced only where human-like reasoning or natural communication adds clear value.

---

# 7.1 Design Philosophy

Most AI-powered career platforms follow this approach:

```text
User

↓

LLM

↓

Recommendations
```

This architecture has several problems:

- Expensive
- Slow
- Difficult to debug
- Inconsistent
- Impossible to reproduce
- Hallucination risk

Scout instead follows a layered architecture.

```text
User

↓

Deterministic Engine

↓

AI Enhancement Layer

↓

Final Experience
```

The recommendation already exists before AI is ever invoked.

---

# 7.2 Responsibilities of AI

AI is responsible for communication.

Not decision making.

Its role is to make deterministic outputs feel human.

Examples include:

- Explaining recommendations
- Encouraging hesitant students
- Summarizing progress
- Generating weekly reports
- Creating Daily Delta summaries
- Parsing resumes

Everything else should remain deterministic.

---

# 7.3 Responsibilities of Deterministic Logic

The following must never depend on an LLM.

- Opportunity ranking
- Eligibility calculation
- Recommendation score
- Match score
- Hidden Gem score
- Trust score
- Deadline urgency
- Opportunity filtering
- Duplicate detection
- Career readiness calculations
- Unlock calculations

These are business rules.

Business rules belong in code.

---

# 7.4 AI Capability Layer

Scout should never expose raw LLM calls throughout the codebase.

Instead of writing:

```typescript
await model.generate(...)
```

the application interacts with AI through capabilities.

Example

```text
AI Layer

├── explainRecommendation()

├── generateConfidenceMessage()

├── summarizeWeeklyProgress()

├── summarizeDailyDelta()

├── extractResume()

└── generateMission()
```

The rest of Scout never knows which provider or model is being used.

This abstraction makes the system easier to maintain and allows providers to be replaced without changing application logic.

---

# 7.5 AI Workflow

The general workflow is:

```text
Deterministic Decision

↓

AI Context

↓

Prompt

↓

Provider

↓

Structured Response

↓

Validation

↓

Cache

↓

User
```

Every AI output passes through validation before reaching the user.

---

# 7.6 AI Usage Across Modules

| Module | Uses AI | Purpose |
|---------|---------|---------|
| Opportunity Ranking | No | Fully deterministic |
| Eligibility | No | Rule-based |
| Opportunity Explanation | Yes | Explain recommendation |
| Confidence Engine | Yes | Encourage application |
| Daily Delta | Yes | Summarize changes |
| Today's Mission | Optional | Natural wording |
| Unlock Engine | No | Deterministic calculations |
| Career Readiness | No | Score calculation |
| Resume Intelligence | Yes | Metadata extraction |
| Weekly Report | Yes | Narrative generation |
| Application Tracker | No | CRUD operations |

This keeps AI usage intentional and predictable.

---

# 7.7 One AI Call Philosophy

Scout is designed around an aggressive cost optimization strategy.

The goal is:

> **One meaningful AI interaction per user, per day.**

Instead of invoking an LLM every time a student opens the dashboard, Scout performs background processing and reuses cached intelligence.

Typical daily flow:

```text
Discovery Engine Updates

↓

Recommendation Pipeline

↓

Generate AI Insights

↓

Cache

↓

Serve to User Instantly
```

The student receives AI-enhanced recommendations without waiting for inference.

---

# 7.8 Background AI Generation

Most AI work should happen asynchronously.

Examples:

- Recommendation explanations
- Confidence messages
- Daily Delta
- Weekly reports

These are generated after recommendations are computed and stored in cache.

When the student opens Scout, the response is immediate.

---

# 7.9 Resume Intelligence

Resume parsing is one of the few unavoidable AI tasks.

However, Scout performs it only once per resume version.

Workflow:

```text
Upload Resume

↓

AI Extraction

↓

Structured Metadata

↓

Database

↓

Reuse Forever
```

If the resume does not change, AI is never called again.

---

# 7.10 Prompt Design Principles

All prompts should follow several principles.

### Structured Input

Provide only the information required.

---

### Structured Output

Require JSON or predefined schemas whenever possible.

---

### Small Context

Avoid sending unnecessary information.

Context optimization from the Discovery Engine should also be applied wherever appropriate.

---

### Deterministic Framing

AI should explain deterministic decisions rather than invent new ones.

---

### Validation

Every response must pass schema validation before use.

---

# 7.11 Provider Independence

Scout should never depend on one provider.

Instead, providers are interchangeable.

```text
AI Capability

↓

Provider Manager

↓

Gemini

Claude

OpenAI

Groq

Future Providers
```

Switching providers should not require application code changes.

---

# 7.12 Budget Management

AI resources are limited.

Scout therefore includes a shared Budget Manager.

Responsibilities include:

- Provider selection
- API key rotation
- Rate-limit handling
- Retry strategy
- Usage tracking
- Cost optimization

Every AI request passes through this infrastructure layer.

---

# 7.13 Caching Strategy

Every expensive AI response should be cached.

Examples:

```text
Recommendation Explanation

↓

User + Opportunity
```

```text
Confidence Message

↓

User + Opportunity
```

```text
Weekly Report

↓

User + Week
```

```text
Resume Intelligence

↓

Resume Hash
```

This minimizes repeated inference.

---

# 7.14 Failure Strategy

Scout must continue operating even if every AI provider fails.

Examples:

Instead of

```text
Recommended because...

You already know React...
```

Fallback to

```text
Matched Skills

• React

• Git

• JavaScript
```

Instead of

```text
Confidence Message
```

Fallback to

```text
8 of 10 requirements matched.
```

Students should never lose access to opportunities because AI is unavailable.

---

# 7.15 Performance Goals

| Task | Target |
|------|---------|
| Recommendation Explanation | <5 s (background) |
| Resume Parsing | <10 s |
| Daily Delta | <3 s |
| Weekly Report | <10 s |
| Dashboard Load | No AI blocking |

The dashboard should never wait for live AI responses.

---

# 7.16 Security & Privacy

Scout treats user data carefully.

AI providers should receive only the minimum information required.

Examples:

Resume parsing receives only resume content.

Recommendation explanations receive only:

- relevant profile signals
- opportunity metadata
- deterministic match reasons

Sensitive personal information should never be transmitted unnecessarily.

---

# 7.17 Future AI Capabilities

As Scout grows, additional capabilities may include:

- Interview preparation
- Resume rewriting
- Cover letter generation
- Mock interviews
- Skill roadmap generation
- Personalized learning plans

These should be implemented as new AI capabilities rather than modifying existing business logic.

---

# 7.18 Design Principles

Scout's AI strategy follows seven principles.

### 1. AI Explains

It does not decide.

---

### 2. Deterministic First

Business rules always live in code.

---

### 3. Background Before Interactive

Generate intelligence before the user asks for it.

---

### 4. Cache Aggressively

Never regenerate information unnecessarily.

---

### 5. Provider Agnostic

The application should not depend on any specific model.

---

### 6. Graceful Degradation

Scout remains fully functional without AI.

---

### 7. Every Token Must Create Value

AI should only be used when it provides a meaningful improvement to the student's experience.

If deterministic logic can solve a problem equally well, deterministic logic should always be preferred.

# 8. Data Models & Personalization State

---

# Overview

The Recommendation Engine is only as good as the data it maintains.

This document intentionally separates **business logic** from **data representation**.

The Recommendation Pipeline decides:

> What should be recommended?

The Recommendation Intelligence decides:

> How should it be explained?

The Data Models answer:

> **What information must Scout remember to make increasingly better recommendations over time?**

The purpose of this section is **not** to define MongoDB schemas.

Those belong in the Database Architecture document.

Instead, this section defines the conceptual data models that power personalization.

---

# 8.1 Personalization State

Unlike traditional job portals that simply store a resume,

Scout maintains a continuously evolving personalization state.

Think of it as the student's career memory.

```text
Student

↓

Profile

↓

Behavior

↓

Recommendations

↓

Feedback

↓

Updated Profile

↓

Better Recommendations
```

The profile continuously improves without repeatedly asking the student for information.

---

# 8.2 Core Personalization Objects

The Recommendation Engine works with six conceptual objects.

```text
User Profile

↓

Resume Intelligence

↓

Opportunity

↓

Recommendation

↓

Application History

↓

Behavior History
```

Each object contributes different signals.

---

# 8.3 User Profile

The User Profile represents stable information.

Examples

- Degree
- Branch
- Graduation year
- Career goals
- Interests
- Skills
- Preferences

These change occasionally.

They form the foundation of recommendation quality.

---

# 8.4 Resume Intelligence

The uploaded resume is **not** used directly.

Instead,

AI extracts structured metadata once.

Example

```text
Resume

↓

Projects

Skills

Technologies

Experience

Achievements

↓

Structured Metadata
```

The structured representation is reused throughout Scout.

---

# 8.5 Opportunity Object

Every discovered opportunity already contains enrichment from the Discovery Engine.

Examples

- Opportunity Type
- Skills Required
- Deadline
- Trust Score
- Hidden Gem Score
- Eligibility
- Organization
- Category

Recommendation Engine consumes these fields.

It does not regenerate them.

---

# 8.6 Recommendation Object

A recommendation is not simply an opportunity.

It is an opportunity viewed from the perspective of one student.

Example

```text
Opportunity

+

User

↓

Recommendation
```

It contains

- Match score
- Fit score
- Eligibility
- Recommendation reason
- Confidence message
- Unlock suggestions
- AI explanation

This object is generated dynamically and cached.

---

# 8.7 Behavioral History

Scout continuously records user interactions.

Examples

Viewed

Saved

Applied

Dismissed

Ignored

Clicked

These interactions help refine future recommendations.

Behavior should influence recommendations gradually, never dominate them.

---

# 8.8 Application History

Applications are different from behavior.

Behavior describes browsing.

Applications represent commitment.

Scout tracks

Applied

Application date

Application status (future)

Application outcome (future)

Application history prevents repeatedly recommending already-applied opportunities.

---

# 8.9 Recommendation Cache

Recommendations should not be recomputed every page load.

Instead,

Scout maintains a recommendation cache.

Example

```text
User

↓

Top Recommendations

↓

Cached

↓

Dashboard
```

The cache contains

- Opportunity IDs
- Match scores
- Explanation IDs
- Generated timestamps

This keeps dashboard loading extremely fast.

---

# 8.10 AI Cache

Every AI-generated artifact should have its own cache.

Examples

Recommendation explanation

Confidence message

Daily Delta

Weekly summary

Resume extraction

Each cache entry is versioned and reusable.

---

# 8.11 Unlock State

One of Scout's differentiators is helping students unlock more opportunities.

Instead of recomputing every improvement every time,

Scout stores the current unlock state.

Example

```text
Current

Eligible

42 opportunities

↓

After SQL

61 opportunities

↓

Delta

+19
```

Only changes need recalculation.

---

# 8.12 Career Readiness Snapshot

Career Readiness is a calculated metric.

It should not be manually stored.

However,

periodic snapshots may be useful.

Example

```text
Week 1

48%

↓

Week 2

55%

↓

Week 3

63%
```

These snapshots power future progress visualizations.

---

# 8.13 Daily Delta Snapshot

Each Daily Delta represents changes since the user's last visit.

Example

```text
Yesterday

41 recommendations

↓

Today

44 recommendations

↓

Delta

+3 new

1 closing today

2 newly eligible
```

Rather than rescanning everything,

Scout stores the computed delta.

---

# 8.14 Weekly Summary Snapshot

Weekly reports summarize longer-term progress.

Examples

Applications submitted

New opportunities discovered

Skills added

Career readiness increase

Unlocked opportunities

Weekly summaries should be generated once and cached.

---

# 8.15 Versioning

Every derived artifact should include version metadata.

Examples

Recommendation Version

Resume Intelligence Version

Prompt Version

AI Model Version

Generated Timestamp

This enables future improvements without breaking historical data.

---

# 8.16 Cache Invalidation

Caches should only refresh when necessary.

Recommendation cache invalidates when

- Profile changes
- Resume changes
- Discovery Engine adds relevant opportunities
- Opportunity expires

AI explanation cache invalidates when

- Recommendation changes
- Prompt changes
- AI model changes

Resume Intelligence invalidates only when

- Resume hash changes

This minimizes unnecessary computation.

---

# 8.17 Data Flow

The complete personalization data flow is:

```text
Onboarding

↓

User Profile

↓

Resume Intelligence

↓

Discovery Engine

↓

Recommendation Pipeline

↓

Recommendation Intelligence

↓

Recommendation Cache

↓

Dashboard

↓

Behavior Tracking

↓

Updated Personalization State
```

Every interaction enriches future recommendations.

---

# 8.18 Data Ownership

Each subsystem owns specific information.

| Component | Owns |
|------------|------|
| Discovery Engine | Opportunity metadata |
| Resume Intelligence | Resume metadata |
| Recommendation Engine | Match scores |
| Recommendation Intelligence | Explanations |
| Unlock Engine | Unlock calculations |
| Daily Delta Engine | Daily summaries |
| Weekly Report Engine | Weekly summaries |
| User Profile | Stable user information |

No component should duplicate another's responsibility.

---

# 8.19 Design Principles

The personalization data layer follows six principles.

### 1. Store Facts, Not Opinions

Persist structured information rather than AI-generated interpretations wherever possible.

---

### 2. Separate Raw Data from Derived Data

Profiles, resumes, and opportunities are raw inputs.

Recommendations, explanations, and summaries are derived artifacts.

---

### 3. Cache Expensive Computation

Anything requiring AI or complex ranking should be cached and reused.

---

### 4. Keep Ownership Clear

Every piece of information should have exactly one authoritative source.

---

### 5. Version Derived Intelligence

Generated outputs should carry version metadata to support future improvements and auditing.

---

### 6. Build a Living Career Memory

Scout should remember how a student's journey evolves over time.

The goal is not simply to recommend opportunities today, but to continuously learn from each interaction and provide increasingly personalized guidance throughout the student's career journey.