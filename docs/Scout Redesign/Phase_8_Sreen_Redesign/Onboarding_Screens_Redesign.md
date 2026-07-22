# Onboarding

## Purpose

Onboarding is where Scout transitions from being a discovery platform into a personalized career companion.

Its purpose is not to collect user data.

Its purpose is to understand enough about the user to deliver meaningful recommendations from day one.

The experience should feel conversational, lightweight, and reassuring—not like filling out a long application form.

---

# Onboarding Goal

By the end of onboarding, users should feel:

- Scout understands them.
- The questions asked were meaningful.
- Their time was respected.
- Better recommendations are worth the small upfront investment.
- They're excited to see what Scout has found.

---

# Design Philosophy

The onboarding should never feel like a traditional multi-step form.

Instead, every screen should answer one simple question.

Each step should explain *why* Scout needs that information.

Every interaction should reinforce that the user is investing a couple of minutes to save countless hours of searching later.

---

# General Principles

- One clear objective per screen.
- Generous whitespace.
- Minimal distractions.
- Large, readable typography.
- Calm animations between steps.
- Autosave throughout the flow.
- Users can edit everything later from Profile.
- Never overwhelm users with too many fields at once.

---

# Progress Indicator

Avoid displaying:

```
Step 3 of 7
```

Instead, use a subtle progress bar.

Example:

```
██████░░░░░

About halfway there
```

This feels less transactional and reduces perceived effort.

---

# Step 1 — Welcome

## Purpose

Introduce Scout and set expectations.

---

### Title

**Welcome to Scout.**

### Supporting Copy

> Before we start discovering opportunities, let's spend a couple of minutes getting to know what you're looking for.

Small reassurance below:

> Everything you enter can be updated later.

Primary CTA:

**Let's Begin**

---

# Step 2 — Tell us about yourself

## Purpose

Help Scout understand who the user is.

---

### Title

**Tell us about yourself.**

### Supporting Copy

> These basics help Scout recommend opportunities that are relevant to your current stage.

Fields:

- Full Name
- Date of Birth
- Gender
- Country
- State
- City

Fields should be grouped naturally instead of appearing as one long form.

---

# Step 3 — Where are you in your journey?

## Purpose

Help Scout determine eligibility for opportunities.

---

### Title

**Where are you in your career journey?**

### Supporting Copy

> Your education helps Scout filter opportunities you're actually eligible for.

Fields include:

- College / University
- Degree
- Branch
- Current Year
- Graduation Year
- Current CGPA (optional)

Keep visual density low.

---

# Step 4 — What are you already good at?

## Purpose

Help Scout understand the user's strengths.

---

### Title

**What are you already good at?**

### Supporting Copy

> Don't worry about listing everything. Start with the skills you're most confident about.

Current searchable skill selector should remain.

Allow users to:

- Search
- Select multiple skills
- Remove easily

Avoid overwhelming users with huge skill lists.

---

# Step 5 — What are you aiming for?

## Purpose

Understand the user's career direction.

---

### Title

**What are you aiming for?**

### Supporting Copy

> Knowing your goals helps Scout prioritize opportunities that align with your ambitions.

Sections include:

### Career Goals

Examples:

- Software Engineering
- Backend
- Frontend
- Full Stack
- AI / ML
- DevOps

---

### Biggest Challenge

Rename internally from generic wording.

Prompt:

> What's slowing you down right now?

Examples:

- Lack of experience
- Finding relevant opportunities
- Resume quality
- Interview preparation

This should feel conversational rather than survey-like.

---

# Step 6 — What should Scout discover for you?

## Purpose

Personalize discovery preferences.

---

### Title

**What should Scout discover for you?**

### Supporting Copy

> Tell Scout what opportunities matter most so it knows what to prioritize.

Sections:

- Opportunity Types
- Preferred Locations
- Work Mode
- Preferred Industries

Additional personalization questions should be introduced as:

> A few quick questions.

Avoid making the experience resemble a personality assessment.

---

# Step 7 — Give Scout a head start

## Purpose

Improve recommendation quality using the user's resume.

---

### Title

**Give Scout a head start.**

### Supporting Copy

> Uploading your resume helps Scout understand your background and improve recommendations. You'll always be able to review and edit extracted information before using it.

Resume upload should remain optional but strongly encouraged.

Clearly communicate:

- Supported file formats
- Secure handling
- Ability to replace the resume later

---

# Autosave

Every step should automatically save progress.

Instead of showing:

Saving...

Display:

✓ Saved

Briefly.

Then fade away.

The interaction should remain almost invisible.

---

# Navigation

Each screen contains:

Back

Next

The primary CTA should always remain in the same location throughout onboarding.

Consistency reduces cognitive load.

---

# Transition to Recommendation Generation

After the final onboarding step:

Do **not** immediately navigate to the dashboard.

Instead, transition into Scout's recommendation generation experience.

This creates anticipation and communicates that Scout is actively working for the user.

---

# Recommendation Generation Experience

This is the user's first interaction with Scout's intelligence.

It should feel exciting, transparent, and trustworthy.

Avoid fake loading animations.

Only display stages representing real backend work.

---

## Title

**Scout is exploring the web for you.**

### Supporting Copy

> This usually takes less than a minute while Scout prepares your first personalized recommendations.

---

# Generation Stages

Each backend stage should have a human-friendly description.

### Discovering Opportunities

> Searching trusted platforms and niche communities.

---

### Filtering Results

> Removing opportunities that aren't relevant to your profile.

---

### Finding Your Best Matches

> Looking for opportunities where you're most likely to succeed.

---

### Looking Beyond the Obvious

> Searching for hidden opportunities you may not have discovered yourself.

---

### Preparing AI Insights

> Understanding why each recommendation matches your profile.

---

### Building Your Dashboard

> Putting everything together for your first Scout experience.

---

# Completion

When processing finishes:

Display:

✓ Your first recommendations are ready.

Pause briefly before transitioning.

Approximately one second is sufficient.

Then smoothly navigate to the Dashboard.

Avoid abrupt page changes.

---

# Onboarding Principles

Every onboarding screen should answer three questions:

- Why is Scout asking me this?
- How does this improve my recommendations?
- What happens next?

If users understand the purpose behind every question, onboarding no longer feels like filling out forms.

It feels like teaching Scout how to discover better opportunities for them.

---

# Final Philosophy

Scout's onboarding should leave users with one lasting impression:

> Scout isn't collecting information.

> Scout is learning how to discover opportunities that matter to me.

That subtle shift transforms onboarding from a required setup process into the beginning of a personalized career discovery journey.