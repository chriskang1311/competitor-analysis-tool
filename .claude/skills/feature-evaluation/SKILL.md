---
name: feature-evaluation
description: Framework for assessing competitor features with Yes/Partial/No/Unknown scores and evidence-backed citations
user-invocable: false
---

# Feature Evaluation Framework

## Important: Use the Canonical Feature List
Always evaluate the **canonical features** provided in your task assignment (from session.json). Do not substitute or add your own features. Every canonical feature must appear in your output, even if scored Unknown.

## Scoring Values
- **`"Yes"`** — Feature clearly exists, confirmed by a primary or secondary source. The competitor actively markets this capability or users confirm it in reviews.
- **`"Partial"`** — Feature exists but is limited in scope, requires an add-on or upgrade, only available on higher tiers, requires professional services to configure, or is mentioned in reviews as incomplete.
- **`"No"`** — Explicitly confirmed absent: vendor says they don't offer it, OR their positioning makes it structurally impossible (e.g., a read-only analytics tool scored "No" on write-back). Do NOT use this if you simply couldn't find evidence.
- **`"Unknown"`** — You searched and could not find enough evidence to score the feature. This is the correct score when evidence is absent — not `"No"`.

## The Unknown Rule (Critical)
`"Unknown"` does NOT require a `sourceUrl`. If you mark a feature Unknown:
- Set `sourceUrl` to `null`
- Write in `description`: `"Not documented in available sources. Searched: [brief list of what you tried, e.g., 'vendor features page, G2 profile, targeted search for [competitor] [feature]']"`

This makes it clear you made a genuine effort, not that you skipped it.

## Evidence Hierarchy (Strongest to Weakest)
1. **Vendor product or features page** — competitor explicitly claims this feature
2. **Official docs or help center** — feature is documented for customers
3. **G2 or Capterra review quotes** — real users describe the feature
4. **Analyst report** (Gartner, Forrester, etc.) — independent confirmation
5. **Press release or news article** — announced but may not be shipping yet
6. **Blog post or case study** — often marketing; use only if nothing better exists

## Conflict Resolution
When two sources disagree on a feature (e.g., vendor page says Yes, but G2 reviews say it's broken/missing):
1. Prefer the **more recent** source
2. If equally recent, prefer the **higher-reliability** source (per hierarchy above)
3. Note the conflict in `description`: *"Vendor page claims Yes, but G2 reviews from [date] suggest the feature is unreliable/limited — scored Partial."*
4. When in genuine doubt between Yes and Partial, prefer `"Partial"` (more conservative)
5. When in genuine doubt between No and Unknown, always prefer `"Unknown"`

## Staleness Rule
Any source older than 18 months:
- Add to `description`: *"Source from [date] — verify current state."*
- Do a quick follow-up search for newer information before finalizing the score
- If a newer source contradicts: use the newer source and update the score; note the older source in description

## Integration Depth
When evaluating integrations, always specify the type — "has integration" is not enough:
- **Native / built-in** — works out of the box, no setup required
- **Bidirectional sync** — data flows both ways, in real time
- **Read-only** — can pull data but not push back
- **API** — requires developer work to connect
- **Zapier / webhook** — lightweight, limited to basic triggers

Score as `"Partial"` if the integration is API-only (requires developer work) when the canonical feature implies native/turnkey.

## Required Output Per Feature
```json
{
  "value": "Yes | Partial | No | Unknown",
  "description": "1-2 sentences on HOW this feature works (or why it is Unknown)",
  "sourceUrl": "https://... or null (null only for Unknown)"
}
```
