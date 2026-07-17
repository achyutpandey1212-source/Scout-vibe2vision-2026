# Migration Notes — Mission Lock Phase 1

## Purpose

Document every required migration for the Mission Lock implementation. Do not execute migrations. Only document them.

---

## 1. DiscoveryRun Migration

**Collection:** `discoveryruns`

**Change:** `targetAudience` field now accepts only `UNDERGRAD_ENGINEERING_STUDENTS`.

**Action:**

- Identify all existing DiscoveryRun documents with non-canonical `targetAudience` strings.
- Options:
  - **Archive:** Set `archived: true` on legacy runs.
  - **Backfill:** Update `targetAudience` to `UNDERGRAD_ENGINEERING_STUDENTS` if the run was for the same audience.
  - **Delete:** Remove runs that are clearly for different audiences (e.g., professional careers).

**Risk:** High. Existing documents will fail Mongoose validation if strict enum is applied.

---

## 2. SourceRegistry Migration

**Collection:** `sources`

**Changes:**

- `category` enum now only accepts active SourceCategory IDs. Inactive categories (GENERAL, TECH_CAREERS, ENTREPRENEURSHIP, SKILL_DEVELOPMENT, GOVERNMENT, RESEARCH) are rejected.
- `ecosystemType` enum no longer accepts `VC_PORTFOLIO` or `AGGREGATOR`. Default changed from `BIG_TECH` to `UNIVERSITY`.
- `sourceType` enum trimmed (removed Job Board, Conference, Research Lab, Other).

**Action:**

- Identify sources with inactive categories and either:
  - Re-categorize to the nearest active category.
  - Deactivate the source (`isActive: false`).
- Identify sources with `VC_PORTFOLIO` or `AGGREGATOR` ecosystemType and update to valid values.
- Update `BIG_TECH` defaults to `UNIVERSITY` for new sources.

**Risk:** Medium. Existing sources in MongoDB are not affected unless a migration script is run.

---

## 3. Opportunity Migration

**Collection:** `opportunities`

**Changes:**

- `opportunityType` enum trimmed to 13 canonical types. Banned types (JOB, FREELANCE, VOLUNTEER, EVENT, COURSE, PROGRAM, GRANT, OTHER) are rejected.
- `category` must be an active SourceCategory ID. Inactive categories are rejected.
- `searchCategory` field removed.
- `opportunityVertical` field removed.
- `audiencePersonas` must contain at least one of: college-student, postgraduate, fresher.
- `experienceRequired` default changed from null/SOME to `NONE`.
- `genderEligibility` default changed from `ALL` to `null`.
- `professionalDomains` must contain at least one engineering domain.
- `eligibleBranches` and `eligibleYears` are now required.
- `womenFocused` is now required.

**Action:**

- Identify opportunities with banned `opportunityType` values and either:
  - Reclassify to nearest canonical type.
  - Archive the opportunity.
- Identify opportunities with inactive `category` values and re-categorize or archive.
- Backfill `searchCategory` and `opportunityVertical` removals (these are soft deletes — data is preserved in existing documents but not in new schemas).
- Backfill `audiencePersonas` arrays that contain non-canonical personas.
- Backfill `experienceRequired: null` to `NONE`.
- Backfill `genderEligibility: 'ALL'` to `null` (or extract true value from page text).
- Backfill `professionalDomains` with at least one engineering domain.
- Backfill `eligibleBranches` and `eligibleYears` from eligibility text.

**Risk:** High. Schema validation tightening will cause existing documents to fail Zod validation in Stage 3 and Mongoose validation in Stage 5.

---

## 4. Category Migration

**Source:** All collections storing category strings.

**Change:** Inactive categories removed from the SourceCategory union type.

**Inactive categories to migrate:**

- `GENERAL` → `INTERNSHIPS` or archive
- `TECH_CAREERS` → `INTERNSHIPS` or archive
- `ENTREPRENEURSHIP` → `STARTUP_INTERNSHIPS` or archive
- `SKILL_DEVELOPMENT` → `BOOTCAMP` or archive
- `GOVERNMENT` → `GOVERNMENT_INTERNSHIP` or archive
- `RESEARCH` → `RESEARCH_INTERNSHIP` or archive

**Action:**

- Run a one-time migration script to update or archive documents with inactive category strings.

---

## 5. Persona Migration

**Source:** `opportunities` collection, `audiencePersonas` field.

**Change:** Only 3 personas accepted. All others removed.

**Personas to migrate:**

- `school-student` → remove or archive
- `dropout` → remove or archive
- `career-break` → remove or archive
- `career-returner` → remove or archive
- `working-professional` → remove or archive
- `entrepreneur` → remove or archive
- `self-employed` → remove or archive
- `homemaker` → remove or archive
- `rural` → remove (demographic tag, not persona)
- `disabled` → remove (accessibility tag, not persona)
- `minority` → remove (demographic tag, not persona)
- `veteran` → remove or archive
- `graduate` → remove (redundant with postgraduate and fresher)
- `phd` → remove or archive

**Action:**

- Filter `audiencePersonas` arrays to keep only canonical personas.
- If the resulting array is empty, flag the opportunity for re-extraction or archive.

---

## 6. Opportunity Type Migration

**Source:** `opportunities` collection, `opportunityType` field.

**Change:** Only 13 canonical types accepted.

**Banned types to migrate:**

- `JOB` → archive (full-time employment, out of scope)
- `FREELANCE` → archive (gig work, out of scope)
- `VOLUNTEER` → archive (unpaid service, out of scope)
- `EVENT` → archive (conference/meetup, out of scope)
- `COURSE` → archive (generic online course, out of scope)
- `PROGRAM` → archive (vague catch-all, out of scope)
- `GRANT` → reclassify as `SCHOLARSHIP` or `FELLOWSHIP` if student-relevant, otherwise archive
- `OTHER` → archive (if cannot be classified, it should be rejected)

---

## 7. Registry Seed Data Migration

**Source:** `packages/shared/src/registry.ts` (TRUSTED_SOURCES)

**Changes:**

- Removed non-engineering scholarship sources (DAAD, Erasmus+, Obama Foundation, Mozilla Foundation).
- Added `internship` tag to Google, Microsoft, Amazon seeds.
- Removed VC portfolio sources (Y Combinator, Peak XV, Accel, Blume, Antler, 100X.VC, Nexus Venture Partners, Elevation Capital).

**Action:**

- These changes affect only new seed data. Existing MongoDB documents are not affected unless `seedIfEmpty()` is re-run on an empty database.

---

## 8. Prompt Behavior Migration

**Source:** LLM extraction behavior.

**Change:** Extraction prompt now says "PREFER REJECTION when uncertain" instead of "PREFER EXTRACTION".

**Impact:**

- Existing opportunities in the database may not match the new prompt's classification.
- A re-extraction or re-validation pass is recommended for all existing opportunities.

**Action:**

- Run a one-time re-validation pass on all existing opportunities.
- Flag opportunities that would fail the new prompt for manual review.

---

## Migration Execution Order

1. **Backup** all collections.
2. Run **Category Migration** (Step 4).
3. Run **Persona Migration** (Step 5).
4. Run **Opportunity Type Migration** (Step 6).
5. Run **DiscoveryRun Migration** (Step 1).
6. Run **SourceRegistry Migration** (Step 2).
7. Run **Opportunity Migration** (Step 3) — this is the riskiest step.
8. Run **Re-validation Pass** (Step 8).
9. Deploy code changes.
10. Monitor logs for validation failures.
