# ONBOARDING_V2_ARCHITECTURE.md

# 1. Purpose & Design Philosophy

---

## Overview

For Scout, onboarding is **not an account creation flow**.

It is the foundation of the entire personalization ecosystem.

Every recommendation, every Daily Delta, every unlock suggestion, every confidence boost, and every opportunity Scout surfaces depends on the quality of information collected during onboarding.

Unlike traditional job portals that ask users to complete lengthy forms before showing any value, Scout follows a different philosophy:

> **Collect only what creates immediate value, infer everything else over time.**

The objective is not to build the most detailed profile.

The objective is to understand enough about a student to begin helping her from the very first session.

---

## Why Onboarding Exists

The onboarding process has six primary objectives.

### 1. Understand the Student

Scout must understand who the student is.

Not merely academically, but professionally.

Examples include:

- Current education
- Career aspirations
- Technical background
- Interests
- Preferred opportunity types
- Current confidence level

---

### 2. Personalize Discovery

Discovery itself should eventually become personalized.

Rather than crawling everything equally,

Scout should gradually prioritize opportunities aligned with user demand.

Examples:

- More frontend internships
- More hackathons
- Women-only programs
- Remote internships

---

### 3. Enable Better Recommendations

Recommendations should never rely solely on AI.

They should be generated using structured profile information.

Good onboarding enables:

- Better ranking
- Better eligibility matching
- Better opportunity explanations
- Better confidence coaching

---

### 4. Reduce Decision Fatigue

Students are overwhelmed.

Scout should remove uncertainty rather than create more.

Instead of asking dozens of unnecessary questions,

every interaction should simplify future decisions.

---

### 5. Build Long-Term Personalization

The profile is not static.

Scout continuously learns through:

- User actions
- Resume uploads
- Saved opportunities
- Applications
- Feedback

The onboarding simply establishes the initial foundation.

---

### 6. Establish Trust

Students are sharing personal information.

Scout should clearly communicate:

- Why information is collected
- How it improves recommendations
- Which questions are optional
- What can be changed later

Trust should be earned before requesting deeper information.

---

# Design Philosophy

The onboarding experience follows several fundamental principles.

---

## Principle 1 — Value Before Questions

Users should immediately feel that Scout is helping them.

Questions are asked only when they unlock meaningful personalization.

Never ask for information simply because other platforms ask for it.

---

## Principle 2 — Every Question Must Have a Purpose

Every field must answer one of these questions:

- Does it improve recommendations?
- Does it improve opportunity discovery?
- Does it reduce user anxiety?
- Does it help future personalization?

If the answer is "no,"

the question should not exist.

---

## Principle 3 — Progressive Profiling

The student should never be forced to provide everything during the first session.

Instead:

```text
Day 1

↓

Enough information to recommend

↓

Week 1

↓

Learn more

↓

Month 1

↓

Continue improving profile
```

Scout earns additional information over time.

---

## Principle 4 — Infer Whenever Possible

If information can be extracted automatically,

Scout should avoid asking for it.

Examples:

Resume

↓

Projects

↓

Skills

↓

Technologies

↓

Achievements

instead of asking the student to manually enter everything.

---

## Principle 5 — Encourage, Never Judge

Many students—especially early-year college girls—feel they are "not good enough."

The onboarding should never reinforce this feeling.

Questions should sound encouraging rather than evaluative.

Instead of:

> "How many projects do you have?"

Prefer:

> "We'll use your projects to find opportunities where you'll have the best chance of success."

Language matters.

---

## Principle 6 — Reduce Friction

Every screen should require minimal effort.

Examples:

- One decision at a time
- Large tap targets
- Smart defaults
- Searchable selections
- Minimal typing
- Resume-assisted autofill

---

## Principle 7 — Build Confidence

Scout should begin increasing confidence from the very first interaction.

The onboarding is not merely information collection.

It is the beginning of mentorship.

Students should finish onboarding feeling:

> "Maybe I have more opportunities than I thought."

---

# Progressive Profiling Strategy

Scout intentionally separates information into three categories.

## Immediate

Required to generate useful recommendations.

Examples:

- College year
- Branch
- Career interests
- Opportunity preferences

---

## Soon

Collected after trust is established.

Examples:

- Resume
- GitHub
- Portfolio
- Preferred companies

---

## Eventually

Learned automatically over time.

Examples:

- Interests
- Preferred domains
- Application behavior
- Skills growth
- Recommendation feedback

This significantly reduces onboarding abandonment.

---

# Don't Overwhelm the User

Traditional onboarding often looks like this:

```text
Step 1

↓

Step 2

↓

Step 3

↓

Step 14

↓

Complete
```

Scout avoids long multi-step forms.

Instead,

questions should feel like a natural conversation.

Each screen should contain only one meaningful decision.

The student should never feel like she is filling government paperwork.

---

# Every Question Must Justify Itself

Every onboarding field should be traceable.

Each field must explicitly answer:

```text
Question

↓

Why are we asking this?

↓

Which recommendation improves?

↓

Can AI infer it later?

↓

Is it mandatory?
```

This simple rule prevents unnecessary complexity.

---

# Success Metrics

A successful onboarding should achieve the following:

- Students complete onboarding without fatigue.
- Scout gathers enough information for useful recommendations.
- Resume upload remains optional but valuable.
- Users understand why information is requested.
- Students leave feeling optimistic rather than evaluated.
- The Recommendation Engine can immediately generate personalized opportunities.

The onboarding should never feel like a prerequisite.

It should feel like the first helpful conversation with a career mentor.

---

# 2. Product Goals

---

## Overview

The objective of Scout's onboarding is **not** to build the most complete student profile.

Its objective is to collect the minimum high-value information required to deliver meaningful personalization from the very first session while laying the foundation for continuous improvement.

Every product goal should directly support Scout's long-term vision:

> **Helping college girls discover, prepare for, and confidently apply to opportunities they would otherwise miss.**

---

## Goal 1 — Build Enough Profile for High-Quality Recommendations

The first responsibility of onboarding is to collect enough structured information to generate useful recommendations immediately.

Scout should understand:

- Who the student is
- What she is studying
- What she wants
- What opportunities she is looking for

This information becomes the starting point for the Recommendation Engine.

The profile does not need to be complete.

It only needs to be useful.

---

## Goal 2 — Understand Career Intent

Two students in the same college and branch may have completely different goals.

Examples:

Student A

- Wants internships
- Wants placement preparation
- Interested in frontend development

Student B

- Wants scholarships
- Interested in research
- Plans for higher studies

Scout should understand **intent**, not merely demographics.

Career intent influences:

- Discovery priorities
- Recommendation ranking
- Unlock suggestions
- Future guidance

---

## Goal 3 — Reduce Analysis Paralysis

Many students face hundreds of opportunities but struggle to decide where to begin.

Instead of overwhelming users,

Scout should narrow the search space.

The onboarding enables Scout to answer:

- Which opportunities matter?
- Which opportunities should be ignored?
- Which opportunities fit the student's current stage?

Reducing options is often more valuable than increasing them.

---

## Goal 4 — Build Confidence

One of Scout's biggest differentiators is reducing self-doubt.

Many students underestimate their eligibility and avoid applying to opportunities they could realistically secure.

The onboarding should help Scout identify confidence-related signals so recommendations can include encouraging guidance where appropriate.

The goal is not to persuade students to apply indiscriminately.

The goal is to reduce unnecessary hesitation.

---

## Goal 5 — Personalize the Entire Experience

Personalization extends far beyond recommendation ranking.

Information collected during onboarding should influence:

- Dashboard content
- Daily Delta
- Opportunity explanations
- Career readiness
- Unlock suggestions
- Notification relevance
- Future onboarding questions

Personalization should be visible throughout the product.

---

## Goal 6 — Minimize User Effort

Students should spend their time exploring opportunities rather than filling forms.

Scout should:

- Ask only necessary questions.
- Infer information wherever possible.
- Use resume extraction when available.
- Continue learning after onboarding.

The system should become smarter while requiring less manual input.

---

## Goal 7 — Establish Long-Term Personalization

The first session is only the beginning.

The onboarding creates the initial profile.

Subsequent interactions continuously improve it.

Examples include:

- Resume upload
- Saved opportunities
- Applications
- Recommendation feedback
- Behavioral signals

This allows personalization to evolve naturally without requiring repeated form filling.

---

## Goal 8 — Build Trust Early

Students should understand that Scout is working for them.

Every question should have a clear purpose.

Users should know:

- Why information is requested
- How it improves recommendations
- What is optional
- What can be changed later

Trust is a prerequisite for meaningful personalization.

---

## Product Success Criteria

The onboarding is considered successful if it enables Scout to:

- Generate useful recommendations immediately after completion.
- Reduce irrelevant opportunities shown to users.
- Identify the student's primary career direction.
- Build an initial personalization profile with minimal friction.
- Leave students feeling supported rather than evaluated.
- Create a foundation that improves automatically over time.

Ultimately, onboarding succeeds when the student feels that Scout already understands her well enough to start helping—even though she answered only a small number of carefully chosen questions.

---

# 3. Target User

---

## Overview

Scout V2 intentionally narrows its focus.

Rather than attempting to serve every job seeker,

the product is optimized for a specific audience.

This narrower focus allows Scout to:

- Deliver significantly better recommendations.
- Build a more relevant Discovery Engine.
- Simplify onboarding.
- Increase product quality.
- Create stronger word-of-mouth within a well-defined community.

The long-term vision may expand to additional audiences, but the MVP is intentionally opinionated.

---

## Primary Persona

### Indian College Girls

Scout is designed primarily for girls currently pursuing undergraduate education in India.

Typical characteristics include:

- First-year to fourth-year students.
- Seeking internships, hackathons, scholarships, and early career opportunities.
- Interested in improving employability while studying.
- Looking for opportunities that align with their current skill level.
- Often unsure where to search.
- Frequently underestimating their own eligibility.

---

## Common Goals

Most students in this audience want one or more of the following:

- Gain practical experience.
- Build a stronger resume.
- Earn stipends through internships.
- Participate in hackathons.
- Win scholarships.
- Improve placement readiness.
- Explore career options.
- Build confidence before applying.

Scout should optimize around these goals.

---

## Common Challenges

The target audience often experiences several recurring problems.

### Information Overload

Opportunities are scattered across hundreds of websites.

Students struggle to know where to search.

---

### Fear of Rejection

Many avoid applying because they assume they are underqualified.

---

### Lack of Awareness

Students frequently discover opportunities only after deadlines have passed.

---

### Unclear Career Direction

Many early-year students are unsure which domains or opportunities suit them best.

---

### Limited Guidance

Students often rely on fragmented advice from seniors, social media, or peer groups.

Scout should become a trusted source of clarity.

---

## Behavioral Characteristics

Typical behaviors include:

- Searching only before deadlines.
- Forgetting bookmarked opportunities.
- Applying only to famous companies.
- Ignoring smaller but high-quality programs.
- Feeling overwhelmed by eligibility requirements.

These behaviors directly influence Scout's personalization strategy.

---

## Product Priorities for This Audience

The product should prioritize:

1. Internships
2. Hackathons
3. Scholarships
4. Early Career Programs
5. Research Opportunities
6. Open Source Programs
7. Competitions
8. Student Events
9. Learning Programs
10. Women-focused initiatives where relevant

These opportunity types align most closely with the current target audience.

---

## Future Personas

The architecture should remain extensible.

Potential future audiences include:

### Fresh Graduates

Seeking full-time employment after college.

---

### Return-to-Work Women

Re-entering the workforce after a career break.

---

### Career Switchers

Professionals transitioning into new domains.

---

These personas are intentionally excluded from the MVP to maintain focus.

---

## Design Implications

Because Scout serves college girls, the onboarding should:

- Use encouraging language.
- Avoid unnecessary technical jargon.
- Minimize lengthy forms.
- Focus on aspirations rather than deficiencies.
- Build confidence from the first interaction.

Every design decision should reinforce Scout's role as a supportive career companion rather than another job portal.

---

# 4. UX Principles

---

## Overview

Scout's onboarding should feel fundamentally different from traditional registration forms.

The experience should resemble a guided conversation rather than a checklist.

The objective is to help students feel understood, not evaluated.

---

## Principle 1 — Conversational Experience

Each screen should focus on a single meaningful question.

The interaction should resemble a mentor asking thoughtful questions rather than a platform collecting data.

---

## Principle 2 — One Decision at a Time

Avoid presenting multiple unrelated inputs simultaneously.

Breaking decisions into small steps reduces cognitive load and increases completion rates.

---

## Principle 3 — Mobile-First

Most students will access Scout from their phones.

Every onboarding interaction should be designed for:

- Thumb-friendly navigation.
- Minimal typing.
- Clear progress indicators.
- Fast completion.

---

## Principle 4 — Low Friction

The onboarding should require as little effort as possible.

Strategies include:

- Searchable selections.
- Smart defaults.
- Resume-assisted autofill.
- Optional fields where appropriate.

---

## Principle 5 — Never Feel Like Filling a Form

Students should not experience onboarding as administrative work.

Questions should be visually lightweight and conversational.

Progress should feel natural and continuous.

---

## Principle 6 — Encourage, Don't Interrogate

Language should always be supportive.

Instead of highlighting deficiencies,

Scout should emphasize possibilities and growth.

The tone should consistently reinforce confidence.

---

## Principle 7 — Autosave Everything

Every answer should be saved immediately.

Students should be able to leave and return without losing progress.

Autosave also enables progressive profiling in future sessions.

---

## UX Success Criteria

The onboarding experience should:

- Feel approachable.
- Finish quickly.
- Build trust.
- Reduce anxiety.
- Collect meaningful personalization signals.
- Leave students excited to explore their personalized dashboard.

---

# 5. Information Architecture

---

## Overview

The onboarding is organized into logical sections rather than isolated questions.

Each section contributes a different category of personalization signals.

---

## Section 1 — Basic Identity

Purpose:

Establish the student's basic profile.

Examples:

- Name
- Preferred name
- College
- Degree
- Branch
- Graduation year

---

## Section 2 — Education

Purpose:

Understand academic context.

Examples:

- Current year
- CGPA (optional)
- Current semester
- Major

---

## Section 3 — Career Direction

Purpose:

Understand long-term goals.

Examples:

- Placement
- Higher studies
- Research
- Entrepreneurship
- Freelancing

---

## Section 4 — Technical Background

Purpose:

Estimate current readiness.

Examples:

- Programming languages
- Domains
- Experience level

---

## Section 5 — Skills

Purpose:

Build structured recommendation signals.

Examples:

- Web Development
- AI/ML
- UI/UX
- Cybersecurity
- Data Science

---

## Section 6 — Interests

Purpose:

Capture preferences beyond formal skills.

Examples:

- Open Source
- Competitive Programming
- Product Design
- Community Building

---

## Section 7 — Opportunity Preferences

Purpose:

Determine which opportunity types should be prioritized.

Examples:

- Internships
- Hackathons
- Scholarships
- Competitions
- Research Programs

---

## Section 8 — Resume

Purpose:

Accelerate profile creation through AI-assisted extraction.

Resume upload remains optional but strongly encouraged.

---

## Section 9 — Notifications

Purpose:

Configure communication preferences.

Examples:

- Daily Delta
- Deadline reminders
- Weekly summaries

---

## Section 10 — Completion

Purpose:

Summarize the profile and transition into personalized recommendations.

Students should immediately experience the value of completing onboarding.

---

# 6. Question Flow

---

## Overview

Every onboarding question follows the same design framework.

```text
Question

↓

Purpose

↓

How Scout Uses It

↓

Mandatory?

↓

Can It Be Inferred Later?
```

This ensures every question has a clear justification and contributes directly to personalization.

---

## Benefits

Using a standardized question flow:

- Prevents unnecessary fields.
- Simplifies future maintenance.
- Keeps onboarding focused.
- Creates a direct connection between collected data and product value.

This framework serves as the blueprint for the detailed onboarding questions that will be defined in the next sections of the architecture.

# 7. Resume Intelligence

---

# Overview

The resume is the single richest source of structured career information a student can provide.

However, Scout should never treat the resume as the profile itself.

Instead, the resume acts as an accelerator for profile creation.

The goal is to reduce manual effort while improving recommendation quality.

The resume should enhance onboarding—not replace it.

---

# Resume Intelligence Pipeline

The complete workflow follows a deterministic pipeline.

```text
Resume Upload

↓

AI Extraction

↓

Confidence Validation

↓

Profile Merge

↓

User Review

↓

Structured Profile
```

The user remains in control throughout the process.

---

## Step 1 — Resume Upload

Resume upload is optional but highly encouraged.

Supported formats:

- PDF
- DOCX (future)
- Plain text (future)

The upload should happen only once during onboarding.

Users may replace their resume later.

---

## Step 2 — AI Extraction

Scout extracts structured information from the resume once.

Examples include:

### Education

- Degree
- College
- Graduation Year

### Skills

- Programming Languages
- Frameworks
- Tools
- Soft Skills

### Experience

- Internships
- Volunteer Work
- Leadership

### Projects

- Project Names
- Technologies Used
- Domains

### Certifications

- Course Certifications
- Professional Certifications

### Achievements

- Awards
- Scholarships
- Competitions

Only structured metadata is retained for personalization.

---

## Step 3 — Confidence Validation

Resume parsing is never assumed to be perfect.

Each extracted field receives a confidence score.

Example:

```text
React

98%

↓

Auto-fill

----------------

TensorFlow

63%

↓

Ask user to verify
```

High-confidence fields require no confirmation.

Low-confidence fields are surfaced during profile review.

---

## Step 4 — Fallback Strategy

If extraction partially fails,

Scout should never block onboarding.

Fallback hierarchy:

```text
Resume Extraction

↓

Partial Success

↓

Ask Remaining Questions

↓

Continue
```

Users should always be able to continue manually.

---

## Step 5 — Profile Merge

Resume data merges with onboarding answers.

Priority order:

```text
Manual User Input

↓

Verified Resume Data

↓

AI Inference
```

The user's explicit answers always take precedence.

---

## Step 6 — Editable Fields

Nothing extracted from the resume is permanently locked.

Students can edit:

- Skills
- Projects
- Experience
- Interests
- Certifications

The resume accelerates onboarding rather than dictating it.

---

# Design Principles

Resume Intelligence should:

- Minimize typing.
- Never overwrite user decisions.
- Ask for confirmation only when necessary.
- Reuse extracted information across Scout.
- Avoid repeated AI processing unless the resume changes.

---

# Future Extensions

Future versions may additionally extract:

- GitHub repositories
- Portfolio links
- Research papers
- Competitive programming profiles
- Open-source contributions

These integrations are intentionally outside the MVP scope.

---

# 8. Profile Completeness Strategy

---

# Overview

Traditional platforms measure profile completion as:

> **Profile Complete: 100%**

This metric encourages users to fill fields but provides little practical meaning.

Scout replaces profile completion with:

> **Career Ready %**

The purpose is not to measure how much information has been entered.

It is to estimate how prepared the student is for discovering and applying to relevant opportunities.

---

# Why "Career Ready %"?

A percentage tied to employability is more meaningful than one tied to form completion.

It answers:

> "How prepared am I to make the most of Scout today?"

rather than:

> "How many boxes have I filled?"

---

# What Career Ready Represents

Career Ready is a composite indicator derived from profile completeness and recommendation quality.

It is **not** an employability score.

It should never imply that a student is "good" or "bad."

Instead, it indicates how effectively Scout can personalize opportunities.

---

# Components

Career Ready consists of several categories.

### Profile Foundation

Examples:

- Degree
- Branch
- Graduation Year
- Career Direction

---

### Skills

Examples:

- Technical Skills
- Domains
- Experience Level

---

### Resume Intelligence

Examples:

- Resume Uploaded
- Resume Successfully Parsed

---

### Opportunity Preferences

Examples:

- Internship Interest
- Hackathon Interest
- Scholarship Interest

---

### Confidence Signals

Examples:

- Application hesitation
- Preferred challenge level

---

### Motivation Signals

Examples:

- Placement
- Higher Studies
- Income
- Experience

---

# Calculation Philosophy

Career Ready should reward information that materially improves personalization.

The score should not increase simply because optional fields are completed.

Examples:

Adding:

- Graduation year

may increase readiness.

Adding:

- Favorite color

should not exist.

Every percentage increase must correspond to better recommendations.

---

# Dynamic Updates

Career Ready is continuously recalculated.

Examples:

Resume uploaded

↓

Career Ready increases.

---

New skills added

↓

Career Ready increases.

---

Career goal updated

↓

Recommendations improve

↓

Career Ready increases.

---

# User Experience

Career Ready should always communicate progress positively.

Example:

```text
Career Ready

72%

↓

Complete your resume to unlock even better recommendations.
```

The emphasis is on opportunity rather than deficiency.

---

# Future Use Cases

Career Ready may later influence:

- Unlock recommendations
- Daily Delta
- Weekly summaries
- Recommendation confidence
- Personalized guidance

---

# 9. Progressive Profiling

---

# Overview

Onboarding should not attempt to collect every piece of information during the first session.

Students join Scout to discover opportunities—not to complete lengthy profiles.

Progressive profiling spreads data collection naturally over time.

---

# Philosophy

Instead of asking everything immediately,

Scout earns additional information through continued engagement.

```text
Join

↓

Receive Value

↓

Build Trust

↓

Ask More

↓

Improve Personalization
```

---

# Initial Onboarding

The first session collects only essential information required for useful recommendations.

Examples:

- Education
- Career Goals
- Opportunity Preferences
- Basic Skills

This enables Scout to start delivering value immediately.

---

# Week 1

After the student begins using Scout,

additional prompts may request:

- Missing technical skills
- Resume upload (if skipped)
- Interest refinement

These questions appear only when beneficial.

---

# Week 2

Potential additions include:

- GitHub profile
- Portfolio
- LinkedIn (future)

Only relevant users should see these prompts.

---

# Week 3

Scout may learn:

- Preferred locations
- Remote preference
- Preferred work style

These preferences improve ranking.

---

# Week 4

Additional signals may include:

- Preferred companies
- Preferred industries
- Preferred technologies

These further refine recommendations.

---

# Behavior-Based Learning

Many preferences should never require explicit questions.

Scout can infer:

- Frequently viewed domains
- Frequently saved opportunities
- Preferred opportunity types
- Preferred difficulty levels

Behavior often provides stronger signals than forms.

---

# Benefits

Progressive profiling:

- Reduces onboarding abandonment.
- Builds trust.
- Improves long-term personalization.
- Keeps the experience lightweight.
- Allows Scout to become smarter over time.

---

# 10. Confidence Signals

---

# Overview

Confidence is one of Scout's most distinctive personalization signals.

Many students do not miss opportunities because they lack ability.

They miss opportunities because they underestimate themselves.

Scout should understand hesitation—not to evaluate personality, but to tailor recommendations.

---

# Purpose

Confidence signals help Scout decide:

- How aggressively to recommend opportunities.
- Which encouragement messages to display.
- Whether to suggest stretch opportunities.

They never influence eligibility itself.

---

# Example Questions

Examples include:

> "I usually apply only when I meet every requirement."

Responses:

- Agree
- Neutral
- Disagree

---

> "I hesitate to apply even when I am interested."

---

> "I prefer opportunities where I already feel fully prepared."

---

# Interpretation

These answers do not create psychological profiles.

Instead,

they help Scout determine how much encouragement a student may benefit from.

For example:

A hesitant student may receive:

> "Many successful applicants meet only part of the listed requirements. If this opportunity interests you, it's worth applying."

Whereas a confident student may receive fewer confidence prompts.

---

# Privacy

Confidence signals are used only to personalize recommendations.

They should never be displayed publicly or shared externally.

---

# Future Adaptation

Confidence may gradually shift based on behavior.

Examples:

Repeated applications

↓

Higher confidence

---

Repeated bookmarking without applying

↓

Suggest confidence-building guidance

The system should adapt naturally rather than relying solely on onboarding responses.

---

# 11. Motivation Signals

---

# Overview

Students pursue opportunities for different reasons.

Understanding motivation helps Scout recommend opportunities that align with personal goals.

Motivation should influence ranking—not restrict discovery.

---

# Example Motivations

Students may prioritize one or more of the following:

- Earn money
- Gain practical experience
- Prepare for placements
- Build a stronger resume
- Explore career interests
- Conduct research
- Participate in competitive programming
- Prepare for higher studies
- Build a startup
- Freelance
- Contribute to open source
- Learn new technologies

Multiple motivations may be selected.

---

# Recommendation Impact

Motivations influence ranking.

Examples:

Earn money

↓

Prioritize paid internships.

---

Research

↓

Prioritize research internships and student fellowships.

---

Higher Studies

↓

Prioritize scholarships and research opportunities.

---

Placements

↓

Prioritize internships with PPO potential.

---

# Future Adaptation

Motivations are expected to evolve.

Scout should periodically allow students to update them without repeating onboarding.

---

# 12. Opportunity Preferences

---

# Overview

Opportunity preferences define **what the student wants to discover first**.

They do not permanently exclude other opportunities.

Instead,

they guide recommendation priorities.

---

# Supported Opportunity Types

The MVP supports:

- Internships
- Hackathons
- Scholarships
- Research Opportunities
- Open Source Programs
- Competitions
- Student Events
- Bootcamps
- Training Programs
- Volunteer Opportunities
- Early Career Programs
- Part-time Opportunities

Internships remain the primary focus.

---

# Recommendation Strategy

Preferences determine ranking priority.

For example:

Student A

Internships

Hackathons

↓

Internships dominate recommendations.

---

Student B

Scholarships

Research

↓

Academic opportunities dominate recommendations.

---

# Exploration vs Personalization

Even if a student selects only internships,

Scout should occasionally surface high-quality adjacent opportunities.

Examples:

A student interested in internships may still benefit from:

- Prestigious hackathons
- Women-focused leadership programs
- Research initiatives

This balances personalization with discovery.

---

# Future Expansion

As Scout grows,

new opportunity categories can be added without redesigning onboarding.

The preference system is intentionally extensible.

# 13. Recommendation Inputs

---

# Overview

One of Scout's core architectural principles is that every onboarding question must directly improve recommendations.

There should never be data collected "just because it might be useful someday."

Every field should map to one or more recommendation signals.

This creates a clean separation between:

```text
User Profile

↓

Recommendation Features

↓

Ranking Engine

↓

Final Recommendations
```

The Recommendation Engine consumes structured features—not raw onboarding responses.

---

# Recommendation Mapping

| Onboarding Field | Recommendation Usage |
|------------------|----------------------|
| Degree | Filters opportunities by eligibility |
| Branch / Major | Matches domain-specific internships and programs |
| Graduation Year | Determines eligibility windows |
| Current Year | Filters by internship requirements |
| Preferred Opportunity Types | Primary ranking signal |
| Career Goal | Adjusts recommendation priorities |
| Technical Skills | Skill matching and eligibility estimation |
| Experience Level | Difficulty calibration |
| Resume Skills | Expands skill graph |
| Projects | Detects practical experience |
| Certifications | Improves relevance scoring |
| Interests | Domain preference weighting |
| Motivation Signals | Ranking strategy |
| Confidence Signals | Recommendation messaging style |
| Resume Upload | Rich feature extraction |
| Preferred Locations | Geographic ranking |
| Remote Preference | Opportunity filtering |
| Preferred Industries | Industry ranking |
| Preferred Companies | Boost preferred employers |

---

# Derived Features

Many recommendation signals are inferred rather than directly stored.

Examples include:

- Skill Count
- Skill Diversity
- Project Density
- Resume Completeness
- Technical Confidence
- Academic Progress
- Career Readiness
- Opportunity Diversity Preference

These derived features improve recommendation quality without increasing onboarding complexity.

---

# Confidence-Based Personalization

Confidence signals should influence *presentation*, not opportunity eligibility.

For example:

Student A (Low Confidence)

↓

Recommendation:

> "You already meet most of the listed requirements. Many successful applicants apply before feeling fully ready."

---

Student B (High Confidence)

↓

Recommendation:

> "Based on your profile, this is a strong match."

The opportunity remains the same.

Only the explanation changes.

---

# Motivation-Based Ranking

Motivation adjusts recommendation weights.

Examples:

Earn Money

↓

Paid internships ranked higher.

---

Build Resume

↓

Hackathons and open-source programs receive higher priority.

---

Higher Studies

↓

Research internships and scholarships move upward.

---

Placements

↓

PPO-oriented internships receive additional weight.

---

# Recommendation Pipeline

```text
Profile

↓

Feature Extraction

↓

Eligibility Filtering

↓

Opportunity Scoring

↓

Ranking

↓

Explanation Generation

↓

Dashboard
```

Only the final explanation may require AI.

Everything else remains deterministic.

---

# 14. Discovery Engine Inputs

---

# Overview

The Discovery Engine should not crawl the web blindly.

Over time, Scout's understanding of its users should influence **what it discovers more aggressively**.

Rather than crawling everything equally, onboarding data provides strategic signals for future discovery prioritization.

---

# Why This Matters

The internet contains millions of opportunities.

Scout's mission is not to collect everything.

It is to discover the opportunities most valuable to its community.

User preferences help guide this discovery.

---

# Discovery Mapping

| Onboarding Signal | Discovery Impact |
|-------------------|------------------|
| Preferred Opportunity Types | Prioritize relevant sources |
| Branch / Major | Boost branch-specific portals |
| Interests | Discover niche communities |
| Preferred Domains | Expand crawling around those topics |
| Preferred Industries | Add industry-specific sources |
| Preferred Companies | Monitor company career portals |
| Preferred Locations | Increase regional source coverage |
| Popular Skills | Discover skill-focused opportunities |

---

# Example

Suppose many students choose:

- AI
- Machine Learning
- Python

Scout may increase crawl frequency for:

- AI research labs
- ML competitions
- AI internships
- Open-source ML programs

without changing the recommendation engine.

---

# Community-Driven Discovery

As Scout grows,

aggregated (anonymous) onboarding signals can reveal trends.

Example:

Thousands of users suddenly indicate interest in:

- Cybersecurity

↓

Scout expands its discovery coverage for:

- Cybersecurity internships
- Capture-the-Flag competitions
- Security fellowships
- Bug bounty programs

The community helps Scout become smarter.

---

# MVP Scope

For the MVP,

Discovery Engine personalization remains lightweight.

Possible initial integrations:

- Company watchlists
- Opportunity type prioritization
- Domain-specific source expansion

Full adaptive crawling is a future enhancement.

---

# 15. Privacy & Trust

---

# Philosophy

Students trust Scout with sensitive career information.

That trust should never be taken for granted.

Every data decision should answer one question:

> "Does collecting this genuinely improve the student's experience?"

If not,

Scout should not collect it.

---

# Resume Privacy

Uploaded resumes are used solely to:

- Extract structured profile information.
- Improve recommendations.
- Reduce manual data entry.

Scout does not permanently rely on the uploaded file for personalization.

Only relevant structured metadata is retained.

---

# AI Usage

Scout uses AI only when it creates meaningful value.

Examples include:

- Resume extraction
- Opportunity extraction
- Personalized explanations

AI should never generate unnecessary profile data.

Users should always know when AI is being used.

---

# User Control

Students retain full ownership of their profile.

They can:

- Edit extracted information.
- Replace their resume.
- Update preferences.
- Disable notifications.
- Delete their account.

Nothing should be irreversible.

---

# Data Minimization

Scout intentionally stores the minimum information required.

Examples:

Store:

- Skills
- Education
- Interests

Avoid:

- Unnecessary demographic questions
- Irrelevant personal information

Every stored field should improve recommendations.

---

# Transparency

Whenever Scout makes a recommendation,

it should be explainable.

Students should understand:

- Why an opportunity was recommended.
- Which parts of their profile influenced it.
- How to improve future recommendations.

Trust increases when personalization is understandable.

---

# 16. Future Extensions

---

# Overview

The MVP intentionally keeps onboarding lightweight.

Future integrations can progressively enrich the profile without increasing manual effort.

---

# GitHub

Potential uses:

- Repository analysis
- Language detection
- Activity signals
- Project discovery

---

# LinkedIn

Potential uses:

- Experience import
- Education verification
- Skill synchronization

---

# LeetCode

Potential uses:

- Problem-solving indicators
- Competitive programming activity

---

# Codeforces

Potential uses:

- Contest participation
- Rating trends
- Algorithm proficiency

---

# HackerRank

Potential uses:

- Skill verification
- Badge synchronization

---

# Portfolio Website

Potential uses:

- Project extraction
- Technology detection
- Design portfolio discovery

---

# Google Drive Resume Sync

Potential uses:

- Automatic resume updates
- Version tracking
- Resume freshness monitoring

---

# Academic Platforms

Future integrations may include:

- Google Scholar
- ORCID
- Kaggle
- Behance
- Dribbble

depending on the student's domain.

---

# Design Philosophy

Future integrations should:

- Require explicit user consent.
- Improve recommendations automatically.
- Reduce repetitive profile updates.
- Never become mandatory.

---

# 17. Final Data Model

---

# Overview

This is a conceptual representation of the student profile.

It is **not** a MongoDB schema.

Instead, it illustrates the information architecture consumed by Scout's personalization systems.

```text
User Profile
│
├── Identity
│   ├── Name
│   ├── Email
│   └── Avatar
│
├── Education
│   ├── Degree
│   ├── Branch
│   ├── College
│   ├── Current Year
│   └── Graduation Year
│
├── Career Goals
│   ├── Primary Goal
│   ├── Motivation Signals
│   └── Confidence Signals
│
├── Skills
│   ├── Technical Skills
│   ├── Soft Skills
│   ├── Experience Level
│   └── Interests
│
├── Resume Intelligence
│   ├── Resume Uploaded
│   ├── Parsed Skills
│   ├── Projects
│   ├── Certifications
│   └── Achievements
│
├── Opportunity Preferences
│   ├── Internship
│   ├── Hackathon
│   ├── Scholarship
│   ├── Research
│   ├── Open Source
│   ├── Competition
│   ├── Bootcamp
│   ├── Volunteer
│   └── Part-time
│
├── Personal Preferences
│   ├── Locations
│   ├── Remote Preference
│   ├── Preferred Companies
│   └── Preferred Industries
│
├── Recommendation Features
│   ├── Career Ready %
│   ├── Skill Graph
│   ├── Eligibility Vector
│   ├── Recommendation History
│   └── Behavioral Signals
│
└── Metadata
    ├── Created At
    ├── Updated At
    ├── Profile Version
    └── Progressive Profiling State
```

This conceptual model acts as the bridge between onboarding, discovery, personalization, and future recommendation systems.

---

# 18. Design Principles

---

# Philosophy

The onboarding experience should feel like the beginning of a mentorship—not the start of filling out paperwork.

Every interaction should reduce uncertainty and help students move closer to discovering meaningful opportunities.

---

## 1. Every Question Must Earn Its Place

If a question does not improve:

- recommendations,
- discovery,
- or user experience,

it should not exist.

---

## 2. Reduce User Effort

Typing should be minimized wherever possible.

Prefer:

- Resume extraction
- Smart defaults
- Progressive profiling
- Behavioral inference

over repetitive manual input.

---

## 3. Infer Whenever Possible

Users should not repeatedly answer questions Scout can reasonably learn over time.

Examples include:

- Preferred opportunity types
- Favorite domains
- Skill interests
- Company preferences

Behavior is often a stronger signal than explicit forms.

---

## 4. Personalization Over Personalization Theatre

Scout should personalize outcomes—not merely greetings.

Real personalization means:

- Better recommendations.
- Better explanations.
- Better prioritization.

Changing a welcome message is not meaningful personalization.

---

## 5. Respect User Confidence

Many students underestimate themselves.

Scout should encourage action without making unrealistic promises.

Recommendations should inspire confidence while remaining honest about eligibility.

---

## 6. Start Small, Grow Naturally

Onboarding should collect only what is necessary to provide immediate value.

Additional information can be gathered over time through progressive profiling.

---

## 7. Transparency Builds Trust

Students should understand:

- why opportunities are recommended,
- how their profile influences results,
- and how they can improve future recommendations.

Explainability is a core product principle.

---

## 8. Privacy First

Scout collects only information that directly benefits the student.

Users should always have control over:

- their data,
- uploaded resumes,
- profile updates,
- and account deletion.

Trust is a competitive advantage.

---

## 9. Build Confidence Through Progress

The goal is not to remind students what they lack.

The goal is to help them see how close they are to new opportunities.

Progress should always feel achievable.

---

## 10. The Beginning of a Mentorship

By the end of onboarding, the student should feel:

> "Scout understands where I am today, where I want to go, and it's going to help me get there."

That feeling—not profile completion—is the true success metric of onboarding.