---
name: competitor-validation
description: Confidence scoring rubric and selection criteria for identifying must-analyze competitors
user-invocable: false
---

# Competitor Validation & Scoring

## Duplicate Detection (Do First)
Before scoring, check for duplicates:
- Same product listed under different names (e.g., "Salesforce" and "Salesforce Health Cloud" — keep the more specific one)
- Same company listed with two different product names where both are the same product
- Acquired products that redirect to a new brand name — use the current active name

Merge or remove duplicates before scoring.

## Confidence Levels

### High Confidence
Assign **High** when ALL of:
- Product is actively sold and maintained (recent website activity, current pricing page or "contact sales" CTA, active job listings referencing the product)
- Confirmed by at least two independent sources (vendor site + one 3rd-party: G2, Capterra, analyst report, or credible news)
- Same buyer persona as the product being analyzed (similar role/title, similar company type/size)
- Directly solves the same core problem — not just an adjacent workflow

### Medium Confidence
Assign **Medium** when ANY of:
- Found in searches but limited 3rd-party review coverage (fewer than 10 reviews on G2/Capterra)
- May be a module within a larger platform rather than a standalone product
- Targets an adjacent problem or adjacent buyer (related but not identical)
- Company is smaller or newer with limited public information
- Product is from a large platform player where this is a secondary feature, not a primary offering

### Low Confidence
Assign **Low** when ANY of:
- Only appeared in a single source
- Product appears to be under-maintained (no website updates visible, stale blog, outdated pricing)
- Primarily serves a significantly different buyer (different role, different company size tier)
- Is a feature within another product, not a standalone offering
- Geography mismatch with no indication of overlap

## Disqualification (Remove Entirely)
Remove from the list if:
- Product is confirmed discontinued or acquired and shut down
- Company website is down or redirects to a competitor
- Product clearly serves consumers, not B2B buyers
- Targets a fundamentally different geography with no cross-market presence

## Top-N Selection
Mark `recommended: true` for the top competitors. Rules:
- **Target 5**, but never force 5 if fewer qualify
- If only 3 High-confidence competitors exist, mark those 3 — do not pad with Low-confidence entries
- Always include: highest market visibility (most reviews + search presence) + at least one emerging player (recent funding or new entrant gaining traction) if one exists
- Never mark a Low-confidence competitor as `recommended: true`

## Required Output Fields
For every competitor:
- `confidence`: `"High"` | `"Medium"` | `"Low"`
- `recommended`: `true` | `false`
- `validatorNote`: 1–2 sentences citing specific evidence (e.g., "Listed in G2's Spring 2025 Grid with 800+ reviews; actively hiring sales reps. Website shows recent product updates.")
- `recommendationReason`: For `recommended: true` only — 1 sentence on WHY must-analyze (e.g., "Leads the G2 category and is the most common competitor mentioned in this buyer segment."). Set to `null` for non-recommended entries.
