---
name: feature-evaluation
description: Framework for assessing competitor features with Yes/Partial/No/Unknown scores and evidence-backed citations
user-invocable: false
---

# Feature Evaluation Framework

## Scoring Values
- **`"Yes"`** — Feature clearly exists, confirmed by a primary source (vendor product page, official docs, or help center). The competitor actively markets this capability.
- **`"Partial"`** — Feature exists but is limited, requires an add-on, only available on higher tiers, or requires professional services to implement.
- **`"No"`** — Explicitly confirmed absent, OR competitor's positioning makes clear they don't offer this (e.g., a data warehouse tool that doesn't do ETL).
- **`"Unknown"`** — Could not determine from available sources. Do NOT guess. Mark Unknown and note what you looked for.

## Feature Selection (When No List Is Given)
If the task doesn't specify features to evaluate, infer the 8–12 most important capabilities for this market by:
1. Reading what the product being analyzed claims as its core capabilities
2. Checking what competitors highlight on their own feature pages
3. Looking at G2/Capterra review categories for this product type
4. Including at least: core workflow features, integration depth, deployment model, and AI/automation capabilities

## Evidence Requirements
Every feature score requires a `sourceUrl`. If you cannot find a source:
- Try one additional targeted search: `"[competitor name] [feature name]"`
- If still not found → score as `"Unknown"` with note `"not documented in available sources"`
- Never score `"No"` based solely on absence of evidence — that's `"Unknown"`

## Evidence Quality Hierarchy
1. **Vendor product page** — strongest; competitor explicitly claims this feature
2. **Official docs or help center** — strong; feature is documented for customers
3. **G2 or Capterra review quotes** — good; real users mention the feature
4. **Analyst report** (Gartner, Forrester) — good; independent confirmation
5. **Press release or news article** — moderate; announced but may not be shipping
6. **Blog post or case study** — weak; often marketing, verify with primary source

## Staleness Rule
Any source older than 18 months: add note `"verify current state — source from [date]"`. The feature may have changed.

## Integration Depth
When evaluating integrations, distinguish:
- **Native / built-in** — works out of the box with no setup
- **API** — requires developer work to connect
- **Bidirectional sync** — data flows both ways in real time
- **Read-only** — can pull data but not push back
- **Zapier/webhook** — lightweight, limited to basic triggers

"Has Salesforce integration" is not enough — specify which type.

## Required Output Fields Per Feature
```json
{
  "value": "Yes | Partial | No | Unknown",
  "description": "1-2 sentences on HOW this feature works, not just whether it exists",
  "sourceUrl": "https://..."
}
```
