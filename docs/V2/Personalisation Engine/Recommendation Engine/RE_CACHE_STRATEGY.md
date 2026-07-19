# RE_CACHE_STRATEGY.md

> **Version:** Scout MVP V2
>
> Recommendation generation is the most expensive operation in Scout after Discovery.
>
> The purpose of the cache is to ensure users always receive fast, consistent recommendations while minimizing AI usage.
>
> **Generate rarely. Serve instantly.**

---

# 1. Philosophy

Scout should never regenerate recommendations unnecessarily.

A student opening the app multiple times a day should see the same carefully prepared recommendation pack.

The Recommendation Engine is designed around one principle:

> **One user → One Recommendation Pack → One day.**

---

# 2. Cache Lifecycle

```
User Opens Scout

↓

Recommendation Pack Exists?

↓

YES

↓

Expired?

↓

NO

↓

Return Cached Pack

↓

Dashboard
```

---

If expired

```
Generate New Pack

↓

Store

↓

Return
```

---

# 3. Cache Duration

Recommendation Packs remain valid for

```
24 Hours
```

Example

```
Generated

18 July
09:30 AM

↓

Expires

19 July
09:30 AM
```

No additional AI calls occur during that period.

---

# 4. Cache Key

Each Recommendation Pack is uniquely identified by

```
userId

+

recommendationVersion

+

profileHash
```

This guarantees that recommendations always correspond to the latest version of both the user's profile and the Recommendation Engine.

---

# 5. Cache Invalidation Rules

A Recommendation Pack is regenerated only when one of the following occurs.

---

## 1. Daily Expiry

Condition

```
generatedAt + 24h < now
```

Action

```
Generate New Recommendation Pack
```

---

## 2. Onboarding Updated

Examples

- interests changed
- preferred domains changed
- availability changed
- work preferences changed
- career goals changed

Action

```
Invalidate Cache

↓

Generate New Pack
```

---

## 3. Resume Updated

Examples

- new resume uploaded
- resume parsed again
- new skills extracted
- experience changed

Action

```
Invalidate Cache
```

Reason

The student's capabilities have changed.

---

## 4. Bookmarks Changed

Examples

- bookmarked opportunity
- removed bookmark

Reason

Bookmarks reveal implicit preferences.

Future recommendations should learn from them.

Action

```
Invalidate Cache
```

> **Implementation Note:**  
> For MVP, bookmark invalidation may be deferred until the next daily refresh if desired to reduce AI usage. The architecture supports immediate invalidation when enabled.

---

## 5. Recommendation Engine Version Updated

Example

```
RE-v1

↓

RE-v2
```

Action

```
Invalidate All Existing Packs
```

Reason

The scoring logic or AI behavior has changed.

Old recommendation packs are no longer representative.

---

## 6. Manual Refresh

Future feature.

User taps

```
Refresh Recommendations
```

Action

```
Force Regeneration
```

Subject to rate limits or premium restrictions if introduced later.

---

# 6. Cache Does NOT Invalidate For

The following events should **not** regenerate recommendations.

- User logs in multiple times
- Dashboard refresh
- Opportunity card opened
- Opportunity details viewed
- User closes the app
- Browser refresh
- Session expiration

These events do not change recommendation quality.

---

# 7. Recommendation States

```
READY
```

Recommendation Pack exists and is valid.

---

```
GENERATING
```

Recommendation Engine is currently building today's pack.

Dashboard displays a friendly progress experience.

---

```
EXPIRED
```

Pack exists but has exceeded its lifetime.

A new pack should be generated before display.

---

```
FAILED
```

AI generation failed.

Fallback deterministic recommendations are served instead.

---

# 8. Fallback Strategy

If AI generation fails

```
↓

Return deterministic Top 5

↓

Generate simple Recommendation Pack

↓

Mark AI fields unavailable
```

The user should never experience a broken dashboard because of AI failures.

---

# 9. Recommended Collection Schema

```json
{
  "_id": "...",

  "userId": "...",

  "generatedAt": "...",

  "expiresAt": "...",

  "profileHash": "...",

  "recommendationVersion": "RE-v1",

  "status": "READY"
}
```

---

# 10. Future Improvements

The cache architecture is designed to support future enhancements such as:

- Incremental recommendation updates
- Partial AI regeneration
- Weekly recommendation digests
- Personalized notification triggers
- Multi-device synchronization
- Premium manual refresh limits

These features can be added without changing the core cache lifecycle.

---

# 11. Guiding Principle

Scout should never waste AI tokens regenerating identical recommendations.

A Recommendation Pack should only change when **the student changes, the opportunities change meaningfully, or the Recommendation Engine itself becomes smarter.**