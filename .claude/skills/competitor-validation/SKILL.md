---
name: competitor-validation
description: Confidence scoring rubric and selection criteria for identifying must-analyze competitors
user-invocable: false
---

# Competitor Validation & Scoring

## Confidence Levels

### High Confidence
Assign **High** when ALL of:
- Product is actively sold and maintained (recent website updates, current pricing, active job listings)
- Confirmed by multiple independent sources (vendor site + at least one 3rd-party review site)
- Same buyer persona as the product being analyzed
- Directly solves the same core problem

### Medium Confidence
Assign **Medium** when ANY of:
- Found in some searches but limited 3rd-party review coverage
- May be a module within a larger platform rather than a standalone product
- Targets an adjacent problem or workflow (not identical)
- Company is smaller or newer with limited public information

### Low Confidence
Assign **Low** when ANY of:
- Only appeared in a single source
- Product appears to be sunset or minimally maintained
- Primarily serves a significantly different market (different geography, different buyer)
- Is a feature of another product, not a standalone offering

## Disqualification Criteria
Remove a competitor entirely if:
- Company is acquired and product is confirmed discontinued
- Product is clearly sunset (no updates in 3+ years, redirects to another product)
- Targets a fundamentally different buyer (e.g., consumer app vs. B2B enterprise tool)
- Different geography with no overlap (e.g., Europe-only product for a US-market analysis)

## Top-5 Selection
From the validated list, mark exactly 5 as `recommended: true`. Prioritize:
1. High-confidence competitors first
2. Highest market visibility (most reviews, most search results, most mentioned by prospects)
3. At least one **emerging player** (recent funding round, new entrant gaining traction)
4. At least one **established platform** (large company with this as a product line)

## Required Output Fields
For each competitor:
- `confidence`: `"High"` | `"Medium"` | `"Low"`
- `recommended`: `true` | `false` (true for top 5 only)
- `validatorNote`: 1–2 sentences citing the specific evidence for the confidence score (e.g., "Listed as a Leader in G2's Spring 2025 Grid with 800+ reviews; actively hiring sales reps targeting mid-market.")
- `recommendationReason`: 1 sentence on WHY this is must-analyze (only for `recommended: true` entries, e.g., "Leads the G2 category and frequently appears in win/loss reports for this buyer segment.")
