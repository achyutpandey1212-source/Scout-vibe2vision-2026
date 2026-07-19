# SCORING_ENGINE.md

> **Version:** Scout MVP V2
>
> The Scoring Engine is the deterministic intelligence core of Scout.
>
> Its job is simple:
>
> **Given a user profile and an opportunity, calculate how well they match.**
>
> No Large Language Models.
>
> No prompts.
>
> No randomness.
>
> Every recommendation score can be explained, reproduced, and debugged.

---

# 1. Philosophy

Discovery answers:

> **"What opportunities exist?"**

The Recommendation Engine answers:

> **"Which opportunities deserve this student's attention?"**

The Scoring Engine answers:

> **"Exactly how good is this opportunity for THIS student?"**

---

# 2. Design Principles

The scoring engine follows six rules.

## Deterministic

Same input.

Same output.

Always.

---

## Explainable

Every point must have a reason.

---

## Modular

Every score is calculated independently.

---

## Reward Fit

A perfectly matched opportunity should naturally rise to the top.

---

## Penalize Mismatch

Wrong opportunities should disappear before AI.

---

## AI Never Changes Scores

AI only explains recommendations.

It never changes rankings.

---

# 3. Overall Formula

Every opportunity receives a final score:

```
Recommendation Score

=

Base Match

+

Interest Match

+

Career Stage

+

Availability

+

Difficulty Match

+

Remote Preference

+

Women Bonus

+

Hidden Gem Bonus

+

Deadline Urgency

+

Portfolio Value

+

Confidence Bonus

+

Quality Bonus

+

Trust Bonus

-

Penalty Score
```

Maximum:

```
100
```

---

# 4. Score Weights

| Component | Max Points |
|------------|-----------:|
| Base Match | 25 |
| Interest Match | 15 |
| Career Stage | 10 |
| Availability | 8 |
| Difficulty Match | 8 |
| Remote Preference | 5 |
| Women Focus Bonus | 4 |
| Hidden Gem Bonus | 5 |
| Deadline Urgency | 6 |
| Portfolio Value | 5 |
| Confidence Bonus | 3 |
| Quality Bonus | 3 |
| Trust Bonus | 3 |
| Penalties | -100 |

Total:

```
100 Points
```

---

# 5. Base Match Score (25)

The most important score.

Measures whether the opportunity objectively fits the student.

---

## Components

### Branch Match

Exact branch

```
+8
```

Related branch

```
+5
```

Open to all

```
+6
```

Not eligible

```
Reject
```

---

### Education Match

Matches qualification

```
+5
```

---

### Graduation Year

Correct year

```
+5
```

Flexible

```
+3
```

Wrong year

```
Reject
```

---

### Experience Match

Matches experience level

```
+4
```

---

### Opportunity Type

Matches onboarding goals

```
+3
```

---

Maximum

```
25
```

---

# 6. Interest Match (15)

Students should receive opportunities matching what they enjoy.

Compare against

- resume
- preferred technologies
- onboarding interests
- work preferences
- domains

---

Example

```
React

Node

Frontend
```

Opportunity

```
React Internship
```

Score

```
High
```

---

Scoring

Exact skill

```
+3
```

Related skill

```
+2
```

Technology overlap

```
+2
```

Career domain overlap

```
+2
```

Project relevance

```
+2
```

Maximum

```
15
```

---

# 7. Career Stage Score (10)

Different students need different opportunities.

---

Example

First Year

↓

Beginner Internship

```
+10
```

---

Fourth Year

↓

Research Internship

```
+9
```

---

Working Professional

↓

Campus Ambassador

```
0
```

---

Examples

| User | Opportunity | Score |
|------|-------------|------:|
| First Year | Internship | 10 |
| Second Year | Hackathon | 8 |
| Final Year | Internship | 10 |
| Professional | Returnship | 10 |

---

# 8. Availability Score (8)

Compare

User

↓

Hours

↓

Commitment

---

Example

User

```
15 hrs/week
```

Opportunity

```
Flexible
```

```
+8
```

---

Opportunity

```
Full-time
```

```
+2
```

---

Impossible

```
Reject
```

---

# 9. Difficulty Match (8)

Too easy

↓

Low value.

Too difficult

↓

Discouraging.

Perfect challenge

↓

Highest score.

---

Difference

```
0

+8
```

Difference

```
1

+6
```

Difference

```
2

+3
```

Difference

```
3+

0
```

---

# 10. Remote Preference (5)

Compare

User

↓

Remote preference

↓

Opportunity

---

Remote wanted

Remote available

```
+5
```

---

Hybrid

```
+3
```

---

Onsite only

```
0
```

unless user prefers onsite.

---

# 11. Women-Focused Bonus (4)

If

```
womenFocused == true
```

and

User

↓

interested

↓

```
+4
```

---

Examples

Google Women Techmakers

Grace Hopper

Women Fellowship

Women Scholarship

---

# 12. Hidden Gem Bonus (5)

Use Discovery Hidden Gem score.

Formula

```
hiddenGemScore

÷20
```

Example

Gem

100

↓

+5

---

Gem

80

↓

+4

---

Gem

20

↓

+1

---

# 13. Deadline Urgency (6)

Purpose

Reward opportunities that need immediate attention.

---

Days Remaining

0-3

```
+6
```

---

4-7

```
+5
```

---

8-15

```
+3
```

---

15+

```
+1
```

---

Expired

Reject.

---

Rolling

```
+2
```

---

# 14. Portfolio Value (5)

Discovery already estimates

Portfolio

Resume

Learning

Interview

Exposure

---

Average

↓

Portfolio Score

Maximum

```
5
```

---

Example

```
Google Summer of Code

5
```

---

Tiny workshop

```
1
```

---

# 15. Confidence Bonus (3)

Discovery confidence.

Formula

```
confidence

×3
```

Example

Confidence

0.95

↓

```
2.85
```

Rounded

↓

3

---

# 16. Quality Bonus (3)

Discovery Quality Score

90+

```
+3
```

80+

```
+2
```

70+

```
+1
```

Below

```
0
```

---

# 17. Trust Bonus (3)

Trust Level

HIGH

```
3
```

MEDIUM

```
2
```

LOW

```
1
```

---

# 18. Penalties

These reduce scores.

---

## US Only

```
-100

Reject
```

---

## Visa Required

```
-100

Reject
```

---

## Branch Mismatch

```
-100

Reject
```

---

## Expired

```
-100

Reject
```

---

## Archived

```
-100

Reject
```

---

## Closed Applications

```
-100

Reject
```

---

## Education Mismatch

```
-100

Reject
```

---

## Wrong Graduation Year

```
-100

Reject
```

---

## Zero Remaining Slots (Future)

Reject.

---

# 19. Final Score Interpretation

| Score | Meaning |
|--------|---------|
| 90-100 | Perfect Match |
| 80-89 | Excellent Recommendation |
| 70-79 | Strong Match |
| 60-69 | Good Backup |
| 50-59 | Worth Exploring |
| <50 | Not Recommended |

---

# 20. Explainability

Every recommendation stores its breakdown.

Example

```json
{
  "overallScore": 92,

  "breakdown": {
    "baseMatch": 24,
    "interestMatch": 13,
    "careerStage": 10,
    "availability": 8,
    "difficulty": 7,
    "remote": 5,
    "womenBonus": 0,
    "hiddenGem": 4,
    "deadline": 5,
    "portfolio": 5,
    "confidence": 3,
    "quality": 3,
    "trust": 3,
    "penalties": 0
  }
}
```

This enables Scout to explain exactly **why** something was recommended.

---

# 21. Future Scoring Signals

The architecture is intentionally extensible.

Future signals may include:

- Resume keyword alignment
- Application history
- Bookmark frequency
- Previously ignored opportunities
- Success rate predictions
- Organization preference
- Preferred work culture
- Compensation expectations
- Skill-gap distance
- User feedback learning

These can be introduced as additional scoring modules without changing the existing engine.

---

# 22. Guiding Principle

The Scoring Engine should answer one question:

> **"If this opportunity were shown to only one student today, how likely is it to help her take the next meaningful step in her career?"**

If the answer is "very likely," it belongs at the top.

If not, it should quietly disappear long before AI ever sees it.