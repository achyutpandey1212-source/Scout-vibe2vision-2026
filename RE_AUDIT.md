# Recommendation Engine — RE_AUDIT

**Status:** READ-ONLY AUDIT. No files modified.
**Scope:** End-to-end data pipeline for personalization, from DB read → prompt assembly → LLM call → response extraction → DB persistence.
**Focus:** Schema bottleneck, data truncation, and the "5 AI calls" misconception.

---

## 1. HIGH-LEVEL SUMMARY

The Recommendation Engine runs **one** LLM call per pack that personalizes **all five slots in a single JSON response**. However, the **persistence schema** (`RecommendationItemSchema`) only stores ~4–5 fields per slot. The LLM is generating a rich mentor dossier (~10,000 chars), but **~95% of that intelligence is silently discarded** during mapping into the database. This is the root cause of the UI rendering only "executive summary + bullet skimmings" instead of a true career report.

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────┐   ┌──────────────┐   ┌───────────────┐   ┌───────────────┐
│   Profile   │   │    Resume    │   │OpportunityPool│   │  (User Prefs) │
└──────┬──────┘   └──────┬──────┘   └──────┬────────┘   └──────┬────────┘
       │                 │                 │                  │
       └─────────────────┴─────────────────┴──────────────────┘
                         │
              ┌──────────▼───────────┐
              │  CandidateSnapshot   │
              │   Builder (once)     │
              └──────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐   ┌──────▼──────┐   ┌────▼─────┐
   │ Hard     │   │ Deterministic│   │Portfolio │
   │ Filter   │   │ Scoring      │   │ Builder  │
   │ (7 rules)│   │(0-100 score) │   │(top5)    │
   └────┬─────┘   └──────┬──────┘   └────┬─────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
              ┌──────────▼───────────┐
              │  PromptManager       │
              │  (5 personas → 1    │
              │   concatenated      │
              │   prompt string)    │
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  AIGateway           │
              │  (Gemini/Flash)      │
              │  1 LLM call          │
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  ResponseValidator   │
              │  (Zod + sanitize)    │
              └──────────┬───────────┘
                         │
           ┌─────────────┴──────────────┐
           │                            │
   ┌───────▼──────┐            ┌────────▼───────┐
   │ RepairService │            │ Fallback gen   │
   │ (2nd LLM call│            │ (no LLM,       │
   │  if needed)  │            │  deterministic)│
   └───────┬──────┘            └────────┬───────┘
           │                            │
           └─────────────┬──────────────┘
                         │
              ┌──────────▼───────────┐
              │ PackBuilder (maps    │
              │ rich report → thin   │
              │ Mongoose doc)        │
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  RecommendationPack  │
              │  (MongoDB)           │
              └──────────────────────┘
```

---

## 3. DATABASE SCHEMA

### 3.1 Input Schemas

**Profile** — `apps/server/src/profile/models/profile.model.ts`

```
fullName, gender, age, state, city, college, university,
degree, branch, currentYear, expectedGraduation, cgpa,
technicalSkills: [], softSkills: [], tools: [], languages: [],
interestDomains: [], preferredRoles: [], careerGoals: [],
primaryMotivation, secondaryMotivations,
confidenceProfile, hesitationLevel, stretchPreference, applicationConfidence,
remotePreference, relocationPreference,
opportunityPreferences: { internships, hackathons, ... },
persona (COLLEGE_STUDENT|WORKING_PROFESSIONAL|...)
```

**Resume** — `apps/server/src/profile/models/resume.model.ts`

```
education: [{ institution, degree, fieldOfStudy, startDate, endDate, cgpa }],
experience: [{ company, role, startDate, endDate, description }],
projects: [{ title, description, technologies: [], url }],
skills: [], certifications: [], achievements: []
```

**Opportunity** — `apps/server/src/discovery/extraction/models/opportunity.model.ts`

```
title, description, organization, opportunityType, category, country, state, city,
remote, applicationUrl, deadline, startDate, endDate, salary, stipend, duration,
eligibility, skills: [], experienceLevel,
tags, sourceURL, status, visibility, workMode,
deadlineStatus, qualityScore, trustScore, opportunityScore,
relatedSimilar, suitableFirstYear, requirements, ...
```

### 3.2 Output Schema (Persisted)

**RecommendationPack** — `apps/server/src/modules/recommendation/schemas/recommendation-pack.schema.ts`

```
{
  userId: ObjectId,
  status: GENERATING|READY|FAILED|EXPIRED,
  generatedAt, expiresAt,
  recommendationVersion, profileHash, generationReason,
  todayMission: String (max 120),

  // 5 SLOTS — each is a RecommendationItemSchema
  perfectMatch: {
    opportunityId: ObjectId,
    score: Number,
    confidence: String,
    personalizedReason: String,   // <-- mapped from AI personalizedReason
    whyNow: String,               // <-- mapped from AI whyNow or confidenceMessage
    missingSkills: [String],      // <-- mapped from AI missingSkills
    firstAction: String,          // <-- mapped from AI firstAction
    scoreBreakdown: Mixed         // <-- deterministic, not AI
  },
  hiddenGem:  { same fields },
  stretchGoal:{ same fields },
  quickWin:   { same fields },
  confidenceBuilder: { same fields },

  aiSummary: String,
  metadata: { provider, model, promptVersion, schemaVersion, engineVersion, ... }
}
```

**Critical observation:** The `RecommendationItemSchema` only persists 4 AI-generated fields per slot. Everything else from the LLM is **lost**.

---

## 4. AI CALLS (Per Pack)

### 4.1 Myth: 5 AI Calls

The system does **NOT** make 5 separate LLM API calls. It makes **one single LLM call** that returns a JSON object containing all 5 slots.

### 4.2 Actual AI Calls

| Call                       | When                                            | Purpose                                                                | File                                                                 | Line    |
| -------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| **1. Primary**             | Always (if `enableAIPersonalization`)           | Generates `todayMission`, `aiSummary`, and all 5 slots in one response | `modules/recommendation/ai/recommendation.ai.ts`                     | 13      |
| **2. Repair**              | Only if Zod validation fails after primary      | Asks LLM to fix schema violations                                      | `modules/recommendation/ai/repair.service.ts`                        | 28      |
| **3. Fallback**            | If primary + repair fail, or AI disabled        | Deterministic template generation (no LLM)                             | `modules/recommendation/ai/fallback-personalization.ts`              | 10      |
| **4–5. Per-slot fallback** | If any slot key is missing in final AI response | Deterministic fill for missing slot only                               | `modules/recommendation/generation/background-generation.service.ts` | 333–351 |

**Total per pack:** 1 LLM call, optionally +1 repair LLM call. Max 2 LLM calls.

---

## 5. DATA FLOW TO LLM

### 5.1 Context Assembly

**File:** `intelligence/recommendation/context/recommendation-context-builder.ts`

For each top-5 candidate, a `IRecommendationContext` is built containing:

```
userProfile: { name, gender, educationLevel, degree, branch, college, graduationYear, currentStatus, location, preferredLocations }
careerGoals: { preferredRoles, interestedDomains, longTermGoals, opportunityPreferences, workModePreferences, internshipVsFullTimePreference }
technicalProfile: { languages, frameworks, backend, frontend, databases, cloud, aiMl, tools, other }
experienceSummary: { internships: [...], leadership: [...], research: [...] }
projects: [{ title, description, technologies, mostRelevantLearning }]
resumeStrength: { bulletPoints: [...] }
opportunity: { title, organization, opportunityType, domain, location, workMode, deadline, requiredSkills, preferredSkills, benefits, descriptionSummary, tags, qualityScore, trustLevel }
matchAnalysis: { overallMatch, scoreBreakdown, topMatchingSkills, missingSkills, matchingInterests, matchingPreferences, potentialGaps, relevantResumeProjects, relevantExperience }
insights: { careerStage, estimatedCompetitiveness, applicationUrgency, growthPotential, learningPotential, resumeFit, confidenceScore, priorityScore }
humanReadableSummary: string
```

**File:** `recommendation/engine/candidate-snapshot.ts`

A `CandidateSnapshot` is built once per user per generation, normalizing profile + resume into:

- `persona`, `education`, `goals`, `motivations`
- `technicalSkills`, `technologies`, `strongestTechnologies`
- `projects[]`, `experience[]`
- `strengths[]`
- `confidenceProfile`, `preferences`

### 5.2 Prompt Assembly

**File:** `modules/recommendation/ai/prompt-manager.ts`

The `buildPrompt` method creates a single string containing:

1. **Candidate Summary block** (~lines 123–155): Name, status, degree, career goals, technical profile (languages, frameworks, backend, frontend, databases, cloud, AI/ML, tools), experience summary, resume strength bullets, top 3 projects.
2. **Top Opportunities block** (~lines 157–166): Iterates over `topCandidates.slice(0,5)` and calls the appropriate persona builder for each:
   - `buildFeaturedPrompt` (perfectMatch)
   - `buildHiddenGemPrompt` (hiddenGem)
   - `buildStretchGoalPrompt` (stretchGoal)
   - `buildQuickWinPrompt` (fastApply)
   - `buildConfidenceBuilderPrompt` (resumeBuilder)
3. **System Instruction** (`getSystemInstructions`, lines 24–72): Scout persona, anti-hallucination rule, character length constraints, and the required JSON schema.

The 5 persona prompts are embedded as a JSON-stringified `opportunityContexts` array inside one prompt.

**Token volume:** ~4,000 tokens of structured context + ~2,000 tokens of response expected.

---

## 6. LLM RESPONSE SCHEMA

### 6.1 Expected JSON (per AI system instruction)

```json
{
  "todayMission": "string (max 120 chars)",
  "aiSummary": "string (max 500 chars)",
  "recommendationsBySlot": {
    "perfectMatch": {
      "executiveSummary": "string (max 500)",
      "whyScoutPickedThis": "string (max 950)",
      "strongestStrengths": ["string (max 500) x 5"],
      "missingSkills": ["string (max 120 per skill) x 5"],
      "resumeImprovements": ["string x 5"],
      "interviewPrep": ["string x 5"],
      "applicationConfidence": { "level": "string", "explanation": "string (max 380)" },
      "nextAction": "string (max 350)",
      "scoutVerdict": { "verdict": "string", "explanation": "string (max 380)" },
      "personalizedReason": "string (max 250)",
      "whyNow": "string (max 150)",
      "firstAction": "string (max 150)",
      "confidenceMessage": "string (max 150)",
      "projectEvidence": "string (max 300)?",
      "whyYou": "string (max 250)?",
      "whyCompany": "string (max 250)?",
      "strengths": ["string x 5]?",
      "challenges": ["string x 5]?",
      "applicationStrategy": "string (max 500)?",
      "preparationChecklist": ["string x 6]?"
    },
    "hiddenGem": { ... same structure ... },
    "fastApply": { ... },
    "resumeBuilder": { ... },
    "stretchGoal": { ... }
  }
}
```

### 6.2 Zod Validation Schema

**File:** `modules/recommendation/ai/ai.schemas.ts`

```ts
SingleCareerReportSchema = z.object({
  executiveSummary: z.string().max(500),
  whyScoutPickedThis: z.string().max(950),
  strongestStrengths: z.array(z.string()).max(5),
  missingSkills: z.array(z.string()).max(5),
  resumeImprovements: z.array(z.string()).max(5),
  interviewPrep: z.array(z.string()).max(5),
  applicationConfidence: z.object({ level: z.string(), explanation: z.string().max(380) }),
  nextAction: z.string().max(350),
  scoutVerdict: z.object({ verdict: z.string(), explanation: z.string().max(380) }),
  personalizedReason: z.string().max(250),
  whyNow: z.string().max(150),
  firstAction: z.string().max(150),
  confidenceMessage: z.string().max(150),
  projectEvidence: z.string().max(300).optional(),
  whyYou: z.string().max(250).optional(),
  whyCompany: z.string().max(250).optional(),
  strengths: z.array(z.string()).max(5).optional(),
  challenges: z.array(z.string()).max(5).optional(),
  applicationStrategy: z.string().max(500).optional(),
  preparationChecklist: z.array(z.string()).max(6).optional(),
});
```

This schema is **permissive enough** to accept the rich report. The problem is not the validation — it's what happens **after** validation.

---

## 7. RESPONSE EXTRACTION & TRUNCATION

### 7.1 Validator (Mild Truncation)

**File:** `modules/recommendation/ai/response-validator.ts`

After `JSON.parse`:

- Strips Markdown fences
- Truncates `todayMission` to 120 chars
- Truncates `aiSummary` to 400 chars
- For each slot, calls `sanitizeSingleReport` which:
  - Truncates strings but preserves the field
  - Fills defaults if fields are missing
  - Validates against `SingleCareerReportSchema`

**This is where the full report still exists. All 15+ fields per slot are present and validated.**

### 7.2 PackBuilder (The Bottleneck — Massive Data Loss)

**File:** `modules/recommendation/builder/recommendation-pack.builder.ts`

```ts
const aiItem = aiResponse?.recommendationsBySlot?.[slot];
return {
  opportunityId: validObjectId,
  score,
  confidence,
  personalizedReason: aiItem?.personalizedReason || 'Highly recommended based on your profile.',
  whyNow: aiItem?.whyNow || aiItem?.confidenceMessage || 'Applications are currently open for active review.',
  missingSkills: aiItem?.missingSkills || [],
  firstAction: aiItem?.firstAction || 'Read the official application page.',
  scoreBreakdown: candidate.scoreBreakdown || { ... }
};
```

**Fields silently dropped before saving to MongoDB:**

- `executiveSummary`
- `whyScoutPickedThis`
- `strongestStrengths`
- `resumeImprovements`
- `interviewPrep`
- `applicationConfidence`
- `nextAction`
- `scoutVerdict` (verdict + explanation)
- `projectEvidence`
- `whyYou`
- `whyCompany`
- `strengths`
- `challenges`
- `applicationStrategy`
- `preparationChecklist`

**This is the exact bottleneck.** The UI renders `personalizedReason` (250 chars max), `whyNow` (150 chars max), `missingSkills` (array), and `firstAction` (150 chars max). That's it. The full mentor report (~7,000+ characters of useful content per pack) is generated, validated, then thrown away.

---

## 8. HOW THE 5 SLOTS ARE HANDLED

### 8.1 Data Structure

All 5 slots travel as a single object:

```ts
aiResponse.recommendationsBySlot = {
  perfectMatch:    { ...rich report... },
  hiddenGem:       { ...rich report... },
  fastApply:       { ...rich report... },
  resumeBuilder:   { ...rich report... },
  stretchGoal:     { ...rich report... }
}
```

### 8.2 Slot Assignment

In `PromptManager.buildPrompt`:

```ts
const slotNames = ['perfectMatch', 'hiddenGem', 'fastApply', 'resumeBuilder', 'stretchGoal'];
```

The `top5Candidates` (from Portfolio Builder) are mapped 1-to-1 into these slots.

### 8.3 Missing Slot Fallback

**File:** `modules/recommendation/generation/background-generation.service.ts` (lines 333–351)

If `aiResponse.recommendationsBySlot[slotKey]` is missing for any required slot, the worker runs:

```ts
const fallbackGen = FallbackPersonalization.generate([cand], profile, resume, snapshot);
aiResponse.recommendationsBySlot[slotKey] =
  fallbackGen.recommendationsBySlot['perfectMatch'] ||
  Object.values(fallbackGen.recommendationsBySlot)[0];
```

The fallback generates ONLY these fields:

- `personalizedReason`, `projectEvidence`, `whyYou`, `whyCompany`, `whyNow`, `missingSkills`, `firstAction`, `confidenceMessage`

Again, the rich fields are never generated by fallback either.

---

## 9. FRONTEND CONSUMPTION

### 9.1 Current UI Fields Used

From `packStore` or API, the frontend reads:

- `pack.todayMission`
- `pack.perfectMatch.personalizedReason`
- `pack.perfectMatch.whyNow`
- `pack.perfectMatch.missingSkills`
- `pack.perfectMatch.firstAction`
- Same for `hiddenGem`, `stretchGoal`, `quickWin`, `confidenceBuilder`
- `pack.aiSummary`

### 9.2 What's Missing

The UI never gets:

- `executiveSummary` (best 2-3 sentence summary)
- `whyScoutPickedThis` (evidence-driven explanation)
- `scoutVerdict` (mentor verdict paragraph)
- `applicationStrategy` (how to apply)
- `preparationChecklist` (actionable prep items)
- `strengths` / `challenges` (with context)
- `projectEvidence` (which project proves which skill)
- `interviewPrep` (specific to this role)

---

## 10. ROOT-CAUSE ANALYSIS

### Symptom

- UI shows "executive summary" of 2 lines + skill gap of 3 bullets per recommendation.
- User feels Scout provides "metadata, not intelligence."

### Cause Chain

1. **LLM generates a comprehensive dossier** (correctly following system instructions).
2. **ResponseValidator accepts and preserves the full dossier**.
3. **PackBuilder truncates to ~4 fields per slot** before MongoDB save.
4. **Frontend can only render what's in MongoDB** — 4 text fields.
5. **Backend generates ~10,000 chars, DB stores ~500 chars per slot.**

### Evidence

- Logs show: `Response Length: 9807 chars`, `Average Recommendation Len: 127 chars` (only `personalizedReason` is averaged).
- The 127-char average aligns with `personalizedReason` being capped at 250 chars and the model outputting ~127 chars on average — because that's the **only field the map extracts**.
- The rich fields (`executiveSummary`, `whyScoutPickedThis`, `scoutVerdict`, `applicationStrategy`, `preparationChecklist`) are generated but never persisted.

---

## 11. RECOMMENDATION

### Immediate Fix (Schema Expansion)

Expand `RecommendationItemSchema` to persist the full report fields:

```
perfectMatch: {
  opportunityId, score, confidence,
  personalizedReason,
  whyNow,
  missingSkills,
  firstAction,
  scoreBreakdown,

  // ADD THESE:
  executiveSummary: String,
  whyScoutPickedThis: String,
  scoutVerdict: { verdict: String, explanation: String },
  applicationStrategy: String,
  preparationChecklist: [String],
  strengths: [String],
  challenges: [String],
  projectEvidence: String,
  interviewPrep: [String]
}
```

### Mapping Fix (PackBuilder)

Update `recommendation-pack.builder.ts` to map ALL fields:

```ts
const aiItem = aiResponse?.recommendationsBySlot?.[slot];
return {
  ...existing fields,
  executiveSummary: aiItem?.executiveSummary || '',
  whyScoutPickedThis: aiItem?.whyScoutPickedThis || '',
  scoutVerdict: aiItem?.scoutVerdict || { verdict: '', explanation: '' },
  applicationStrategy: aiItem?.applicationStrategy || '',
  preparationChecklist: aiItem?.preparationChecklist || [],
  strengths: aiItem?.strongestStrengths || aiItem?.strengths || [],
  challenges: aiItem?.challenges || [],
  projectEvidence: aiItem?.projectEvidence || '',
  interviewPrep: aiItem?.interviewPrep || []
};
```

### Frontend Fix

Update card components to show:

- **Card:** `executiveSummary` + `whyNow` + `firstAction`
- **Detail Page:** Full `whyScoutPickedThis` + `strengths` + `challenges` + `applicationStrategy` + `preparationChecklist` + `scoutVerdict`
- **Dashboard:** `scoutVerdict.verdict` + `applicationConfidence.level`

### Prompt Fix (Secondary)

The current system instruction enforces strict character limits that force the model to compress. Consider:

- Removing or raising `executiveSummary` cap (currently max 500 chars in Zod, but prompt says "2-3 sentences").
- Adding explicit section headers in the prompt XML/JSON structure to reduce hallucination.
- Ensuring `recommendationsBySlot` keys are fixed (`perfectMatch`, `hiddenGem`, `fastApply`, `resumeBuilder`, `stretchGoal`) — currently `top5Candidates` uses `fastApply` but `slotNames` array in `PromptManager` uses `fastApply` too (line 87). This is consistent, but the fallback uses `resumeBuilder` while the portfolio builder uses `resumeBuilder` — consistent. No issue here.

---

## 12. FILES IN AUDIT SCOPE

| File                                                                                    | Role                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `apps/server/src/profile/models/profile.model.ts`                                       | User profile schema                              |
| `apps/server/src/profile/models/resume.model.ts`                                        | Resume schema                                    |
| `apps/server/src/discovery/extraction/models/opportunity.model.ts`                      | Opportunity schema                               |
| `apps/server/src/modules/recommendation/schemas/recommendation-pack.schema.ts`          | **Pack persistence schema**                      |
| `apps/server/src/modules/recommendation/types/recommendation.types.ts`                  | Pack TypeScript interface                        |
| `apps/server/src/modules/recommendation/ai/ai.schemas.ts`                               | LLM response Zod schema                          |
| `apps/server/src/modules/recommendation/ai/ai.types.ts`                                 | LLM response TypeScript interface                |
| `apps/server/src/modules/recommendation/ai/ai.constants.ts`                             | Version & timeout constants                      |
| `apps/server/src/modules/recommendation/ai/prompt-manager.ts`                           | Single-call prompt assembler                     |
| `apps/server/src/modules/recommendation/ai/personalization.service.ts`                  | Orchestrator (call → validate → repair/fallback) |
| `apps/server/src/modules/recommendation/ai/recommendation.ai.ts`                        | AIGateway wrapper                                |
| `apps/server/src/modules/recommendation/ai/response-validator.ts`                       | JSON parse + Zod validation + sanitization       |
| `apps/server/src/modules/recommendation/ai/repair.service.ts`                           | 1 optional repair LLM call                       |
| `apps/server/src/modules/recommendation/ai/fallback-personalization.ts`                 | Deterministic non-LLM fallback                   |
| `apps/server/src/modules/recommendation/builder/recommendation-pack.builder.ts`         | **Drops 11+ fields per slot**                    |
| `apps/server/src/modules/recommendation/generation/background-generation.service.ts`    | Multi-stage worker pipeline                      |
| `apps/server/src/intelligence/recommendation/context/recommendation-context-builder.ts` | Context → LLM payload builder                    |
| `apps/server/src/intelligence/recommendation/context/context.types.ts`                  | Context TypeScript interfaces                    |
| `apps/server/src/recommendation/engine/candidate-snapshot.ts`                           | Profile+Resume → normalized snapshot             |
| `apps/server/src/intelligence/recommendation/prompts/featured.prompt.ts`                | Perfect Match persona                            |
| `apps/server/src/intelligence/recommendation/prompts/hidden-gem.prompt.ts`              | Hidden Gem persona                               |
| `apps/server/src/intelligence/recommendation/prompts/stretch-goal.prompt.ts`            | Stretch Goal persona                             |
| `apps/server/src/intelligence/recommendation/prompts/quick-win.prompt.ts`               | Quick Win persona                                |
| `apps/server/src/intelligence/recommendation/prompts/confidence-builder.prompt.ts`      | Confidence Builder persona                       |
| `apps/web/src/components/dashboard/RecommendationStrip.tsx`                             | UI wrapper (thin)                                |

---

## 13. CONCLUSION

The pipeline is architecturally sound: deterministic filtering → portfolio diversification → single rich LLM personalization. The LLM is working. The validator is working. The breakdown happens in `RecommendationPackBuilder.build`, where the rich `ICareerReport` object is collapsed into ~4 thumbnail fields before MongoDB persistence. The frontend renders exactly what it's given.

**Fix path:** Expand the persistence schema, update `PackBuilder` to map all fields, and update the UI to consume them. The LLM output and validator already support the full dossier.
