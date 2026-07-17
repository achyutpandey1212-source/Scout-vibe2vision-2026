# Opportunity Acceptance Principle

## Purpose

The Opportunity Acceptance Principle defines the universal criteria that every opportunity must satisfy to enter the Scout database.

Future validation layers should reference this principle.

## The Principle

An opportunity must satisfy **ALL** of the following criteria to be accepted:

### 1. Technically Relevant

The opportunity must involve engineering, technology, or technical skills. Non-engineering programs (finance, marketing, HR, sales, operations, consulting, design, content, education, policy) are rejected.

### 2. Student Accessible

The opportunity must be realistically accessible to a 1st–4th year engineering student. Executive, senior, lead, principal, director, manager, VP, or experienced-hire positions are rejected. Programs requiring PhD, postdoc, or 3+ years of experience are rejected unless explicitly tagged as student-eligible.

### 3. Currently Active

The opportunity must have an active application process or be currently accepting participants. Expired, archived, or inactive opportunities are rejected.

### 4. Actionable

The opportunity must have a clear application process, deadline, or registration mechanism. Generic information pages, news articles, or landing hubs without actionable next steps are rejected.

### 5. Trusted

The opportunity must come from a legitimate source. Unknown or untrusted domains without verifiable organizational backing are flagged for review or rejected.

### 6. Valuable

The opportunity must provide genuine value to a student's technical career: skill development, portfolio building, networking, mentorship, certification, or financial support.

## Rejection Rule

If **ANY** criterion fails, the opportunity is **REJECTED**.

There is no partial acceptance. An opportunity that is technically relevant but not student accessible is rejected. An opportunity that is actionable but not trusted is rejected.

## Canonical Opportunity Types

Only the following types are accepted:

- INTERNSHIP
- STARTUP_INTERNSHIP
- GOVERNMENT_INTERNSHIP
- RESEARCH_INTERNSHIP
- HACKATHON
- COMPETITION
- OPEN_SOURCE_PROGRAM
- CAMPUS_AMBASSADOR
- SCHOLARSHIP
- SUMMER_SCHOOL
- BOOTCAMP
- FELLOWSHIP
- WOMEN_IN_TECH

## Canonical Categories

Only the active SourceCategory IDs are accepted:

- INTERNSHIPS
- STARTUP_INTERNSHIPS
- HACKATHONS
- SCHOLARSHIPS
- FELLOWSHIPS
- GOVERNMENT_INTERNSHIP
- RESEARCH_INTERNSHIP
- CAMPUS_AMBASSADOR
- STUDENT_COMPETITION
- OPEN_SOURCE_PROGRAM
- SUMMER_SCHOOL
- BOOTCAMP
- WOMEN_IN_TECH

## Canonical Personas

Only the following personas are accepted:

- college-student
- postgraduate
- fresher

## Engineering Domain Requirement

Every accepted opportunity must contain at least one engineering domain from the canonical taxonomy.

## Defaults

- `experienceRequired`: NONE (must be explicitly extracted as SOME or EXPERIENCED)
- `genderEligibility`: null (must be explicitly extracted)
- `category`: required (no default)
- `womenFocused`: required boolean
- `eligibleYears`: required array
- `eligibleBranches`: required array
- `ecosystemType`: UNIVERSITY
