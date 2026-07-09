# PERSONALIZATION_ENGINE.md

# Scout Personalization Engine
### Delivering the Right Opportunity to the Right Woman at the Right Time

> "The Discovery Engine finds opportunities.
>
> The Personalization Engine finds YOUR opportunities."

---

# Overview

The Personalization Engine is Scout's user intelligence layer.

Unlike the Discovery Engine, it never searches the internet.

Instead, it reasons over Scout's Opportunity Intelligence Database to understand each user's goals, skills, experience and aspirations.

Its responsibility is not to recommend the most opportunities.

Its responsibility is to recommend the most meaningful opportunities.

---

# Core Mission

Transform

One Global Opportunity Database

↓

into

Thousands of Personalized Opportunity Feeds.

Every user should feel like Scout searched the internet specifically for them.

---

# Philosophy

The internet should be searched once.

Personalization should happen infinitely.

---

# Engineering Philosophy

Personalization should improve over time.

Every interaction teaches Scout more about the user.

The better Scout understands the user,

the better Scout becomes.

---

# High Level Flow

User

↓

Authentication

↓

Onboarding

↓

Profile Creation

↓

AI Profile Understanding

↓

Retrieve Opportunities

↓

AI Ranking

↓

Explanation Generation

↓

Dashboard

---

# User Journey

## Step 1

Authentication

Firebase Authentication

Supported Methods

- Google
- Email

---

## Step 2

First Time Onboarding

The onboarding should be conversational.

Instead of a boring form,

Scout should make users feel understood.

---

# User Profile

Basic Information

- Name
- Age (Optional)
- Country
- State
- City

Education

- Degree
- Branch
- Year
- College
- Graduation Year

Career

- Current Status

Examples

Student

Working Professional

Career Break

Homemaker

Freelancer

Job Seeker

Self-Taught

---

Skills

Examples

React

Python

AI

Figma

Marketing

Sales

Teaching

Design

etc.

---

Interests

Examples

Web Development

AI

Finance

Research

Healthcare

Cloud

Robotics

Government Jobs

Product Management

Design

Startup

Content Creation

---

Preferences

Remote

Hybrid

Offline

Preferred Location

Preferred Salary

Preferred Internship

Preferred Job

Preferred Fellowship

Preferred Scholarship

Preferred Hackathons

Preferred Competitions

---

Availability

Hours Per Week

Immediate Joining

Looking within

30 days

60 days

90 days

---

# AI Profile Understanding

The onboarding data is not enough.

Scout should create an internal AI Profile.

Example

Instead of

Skills

React

Node

MongoDB

Scout understands

"Full Stack Developer interested in AI startups with preference for remote internships."

This AI Profile should be stored.

---

# Recommendation Pipeline

User Profile

↓

Retrieve Opportunities

↓

Eligibility Filter

↓

Preference Filter

↓

Reasoning

↓

Ranking

↓

Explanation

↓

Recommendation Feed

---

# Stage 1

Candidate Retrieval

The database may contain

10,000+

opportunities.

Scout first retrieves

Top 300 candidates

using

- Tags
- Skills
- Category
- Degree
- Location
- Career Status

No LLM yet.

Fast retrieval only.

---

# Stage 2

Eligibility Filtering

Remove

Expired

Not Eligible

Wrong Country

Wrong Education

Wrong Experience

Wrong Degree

Wrong Age

etc.

This should mostly be rule-based.

LLMs should not waste tokens here.

---

# Stage 3

AI Reasoning

This is Scout's intelligence.

Gemini receives

User Profile

+

Candidate Opportunities

↓

Reasons about

- Goals
- Career Stage
- Skills
- Interests
- Growth Potential
- Deadlines
- Opportunity Quality

Output

Top Recommendations

---

# Stage 4

Opportunity Ranking

Each recommendation should include

Overall Score

Match Score

Career Growth Score

Skill Alignment

Urgency

Freshness

Trust Score

Hidden Gem Score

Scout Score

---

# Stage 5

Explanation Generation

Every recommendation should explain

Why this opportunity?

Example

96% Match

Because

✓ Python

✓ MERN

✓ Women Preferred

✓ Remote

✓ Deadline in 4 Days

✓ Strong Portfolio Match

Users should trust Scout.

Explainability builds trust.

---

# Stage 6

Dashboard Generation

Instead of showing

100 cards,

Scout generates

A daily intelligence report.

Example

Today's Brief

New Opportunities

12

Closing Soon

3

Highly Recommended

5

Hidden Gems

2

Trending in AI

4

Recommended Today

6

---

# Personalization Strategy

Scout should prioritize

1.

Quality

over

Quantity

---

2.

Relevance

over

Popularity

---

3.

Potential Impact

over

Random Matching

---

# User Actions

Users may

Bookmark

Dismiss

Applied

Ignore

Interested

Not Interested

These actions become feedback.

---

# Feedback Learning

Every interaction improves recommendations.

Example

User repeatedly bookmarks

Research Internships

↓

Increase Research opportunities.

User dismisses

Government Jobs

↓

Reduce Government recommendations.

---

Future

Implicit learning

- Clicks
- Time spent
- Applications
- Bookmarks

---

# Daily Recommendation Refresh

Recommendations should update

When

- New opportunities arrive
- User edits profile
- User gains new skills
- Opportunities expire
- Discovery Engine completes

---

# Notifications

Examples

A new AI internship matches your profile.

Deadline tomorrow.

A scholarship matching your profile was just discovered.

Only 3 days left.

You became eligible for an opportunity after updating your skills.

---

# Collections

Users

Profiles

Bookmarks

Applications

Notifications

User Activity

Recommendation Cache

---

# Caching Strategy

Redis

Store

Recently generated recommendations.

Avoid repeated reasoning for identical requests.

Cache expires

After

Discovery Engine refresh

or

User profile changes.

---

# AI Responsibilities

The Personalization LLM should NOT

Search

Scrape

Browse

Visit websites

It should ONLY

Understand

Reason

Rank

Explain

Recommend

---

# LangGraph Workflow

Profile

↓

Retrieve Candidates

↓

Eligibility Check

↓

Reasoning

↓

Ranking

↓

Explanation

↓

Recommendation Feed

---

# Future Memory

Scout should eventually remember

Skills learned

Career goals

Applied opportunities

Rejected opportunities

Career progression

Long-term aspirations

This enables lifelong personalization.

---

# Future Features

Opportunity Prediction

"If you continue learning React and TypeScript,
you'll likely qualify for these internships in 60 days."

Career Readiness Score

Skill Gap Analysis

Application Success Prediction

Weekly Intelligence Reports

Monthly Opportunity Digest

AI Career Timeline

---

# Success Metrics

Average Match Score

Recommendation CTR

Bookmark Rate

Application Rate

Dismiss Rate

Returning Users

Recommendation Refresh Time

Average LLM Latency

---

# Design Principles

1.

Never recommend everything.

Recommend the best.

---

2.

Never recommend without explanation.

Trust requires transparency.

---

3.

Personalization should become smarter every day.

---

4.

Reason over structured data.

Never scrape the web.

---

5.

Use LLMs only where intelligence is required.

Everything else should be deterministic.

---

# Long-Term Vision

The Discovery Engine understands opportunities.

The Personalization Engine understands people.

Together they create an intelligence system capable of matching the right opportunity to the right person at the right moment.

---

# North Star

Every recommendation should answer one question:

"If Scout could recommend only ONE opportunity today, which one would most improve this user's future?"