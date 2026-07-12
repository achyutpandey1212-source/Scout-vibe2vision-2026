initial commit

starting with the prroject now... coz i was busy doing something else

Talent shouldn't depend on who you know.


-----------------------------------------------------------------------------------------
✅ PRD
✅ System Architecture
⏳ Discovery Engine (deep dive)
⏳ Personalization Engine (deep dive)
📄 Phase 2 — Engineering Blueprint
MCP & Integrations Matrix
Database Schema
AI Workflow Design
API Design
Folder Structure
📄 Phase 3 — Build Plan
36-hour implementation roadmap
Task breakdown
Git commit milestones
Demo flow
Pitch storyline

-----------------------------------------------------------------------------------------

🔵 Global Context (Read Every Phase)
docs/



/SCOUT_PRD.md



SYSTEM_ARCHITECTURE.md



SYSTEM_ARCHITECTURE_IMPROVEMENTS.md



UI_UX_DESIGN_PRINCIPLES.md



TECH_STACK.md



ANTIGRAVITY_INSTRUCTIONS.md

------------------------------------------------------------------------

Stage 1 — Opportunity Enrichment

This should enrich every Opportunity document.

Tasks:

Deadline parsing
Source normalization
Metadata generation
Opportunity categorization

Example

Before

{
  "organization": "Google LLC",
  "deadline": "Applications close Aug 15th",
  "category": "General"
}

After

{
  "organization": "Google",
  "sourceType": "COMPANY",
  "deadline": "2026-08-15",
  "daysRemaining": 36,
  "category": "Software Engineering",
  "metadata": {
      "country":"India",
      "remote":true,
      "paid":true
  }
}

Mostly deterministic.

Low AI usage.

Cheap.

Stage 2 — Trust & Quality Engine

This becomes a scoring engine.

This is where the intelligence starts.

Example

Trust Score

Government      100

Google Careers   98

Microsoft        98

Internshala      84

LinkedIn Jobs    80

Random Blog      18

Then

Hidden Opportunity Score

Imagine

Google SWE Internship

Trust 99

Popularity 100

Hidden Score 10

vs

Women in STEM NGO Fellowship

Trust 86

Popularity 12

Hidden Score 95

Guess which Scout recommends.

This becomes your differentiator.

Stage 3 — Deduplication & Eligibility Intelligence

This is where AI shines.

Instead of

Google Internship

Google SWE Internship

Google Software Intern

Google Careers Summer Intern

AI realizes

same opportunity

Merge.

Also

Eligibility Extraction

Instead of

Eligibility:

Students in final year pursuing B.Tech with 7.5 CGPA...

becomes

{
  "cgpa":7.5,
  "degree":"B.Tech",
  "branch":["CSE","ECE"],
  "graduationYear":2027
}

Now personalization becomes trivial.

--------------------------------------------------------------------------------------------

# Phase 8 — Dashboard (Mock Data)

## Goal

Build the product experience before wiring AI.

### Pages

Landing

Dashboard

Opportunity Details

Bookmarks

Notifications

Profile

### Components

Featured Opportunity

Hidden Gems

Scout Intelligence Panel

Opportunity Cards

Top Navigation

Theme Toggle

Origami decorative assets

### Deliverables

Entire product UI working with mock data.
