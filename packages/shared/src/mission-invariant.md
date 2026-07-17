# Mission Invariant

## Purpose

The Mission Invariant is a shared developer constant that defines the non-negotiable boundary of Scout's Discovery Engine.

**No component may broaden the mission. Only narrow it.**

## The Invariant

Scout discovers opportunities for **undergraduate engineering students (1st–4th year) in India, primarily women, seeking technical internships and portfolio-building opportunities.**

Every pipeline stage operates within this invariant:

```
Query Planner
    ↓
Detector
    ↓
Extractor
    ↓
Validator
    ↓
Storage
```

## Rules

1. **Every stage may reject.** No stage is forced to accept anything.
2. **No stage may reintroduce broader opportunities.** If a previous stage rejected an opportunity, a later stage cannot revive it.
3. **No stage may add opportunity types not in the canonical list.** The canonical list is defined in `packages/shared/src/opportunity-types.ts`.
4. **No stage may add categories not in the active SourceCategory set.** The active set is defined in `packages/shared/src/categories.ts`.
5. **No stage may add personas outside the canonical three.** The canonical personas are defined in `packages/shared/src/personas.ts`.
6. **No stage may relax target audience constraints.** The canonical audience is `UNDERGRAD_ENGINEERING_STUDENTS`.

## Enforcement

- **Query Planner** generates queries scoped to engineering student opportunities only.
- **Detector** penalizes senior/experienced/executive keywords.
- **Extractor** rejects pages that do not describe active, student-relevant technical opportunities.
- **Validator** enforces schema constraints: canonical opportunity types, active categories, canonical personas, engineering domains.
- **Storage** rejects documents that fail validation.

## Developer Note

If you are adding a new pipeline stage, feature, or optimization, ask:

> "Does this change broaden the mission?"

If the answer is yes, do not implement it. Scout is not LinkedIn, Indeed, or a generic careers platform.
