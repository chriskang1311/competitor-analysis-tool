---
name: source-management
description: Citation format, source type taxonomy, and evidence tracking for all competitive claims
user-invocable: false
---

# Source Management

## Source Type Taxonomy
Use these exact strings for `type`:
- `"product-page"` — vendor's own product or features page
- `"review-site"` — G2, Capterra, TrustRadius, Gartner Peer Insights
- `"analyst-report"` — Gartner Magic Quadrant, Forrester Wave, IDC, or industry-specific analyst firms
- `"news"` — press release, TechCrunch, Bloomberg, industry news
- `"company-overview"` — About page, LinkedIn, Crunchbase, investor page
- `"blog"` — vendor blog, partner blog, industry blog
- `"other"` — anything that doesn't fit above

## Required Fields Per Source
```json
{
  "url": "https://...",
  "type": "product-page",
  "title": "Short descriptive title of the page",
  "accessedDate": "YYYY-MM-DD"
}
```

## Reliability Ranking
When sources conflict, trust in this order:
1. `product-page` — vendor says so directly
2. `analyst-report` — independent expert verification
3. `review-site` — aggregated user experience
4. `news` — announced but may not reflect current state
5. `company-overview` — high-level, not feature-specific
6. `blog` — often marketing; verify with primary source when possible

## Conflict Handling
If two sources disagree on a feature:
- Cite both sources in the `sources` array
- Note the discrepancy in the feature `description` field: *"Vendor page claims Yes, but G2 reviews from [date] suggest limited/unreliable — scored Partial."*
- Apply conflict resolution rules from the `feature-evaluation` skill to determine final score

## Deduplication
List each URL once in the `sources` array, even if it supports multiple feature claims. The `sourceUrl` in each feature entry points to the URL directly.

## The Unknown Entry (No Source Required)
When a feature is scored `Unknown` because you could not find evidence:
- Set `sourceUrl` to `null` in the feature entry
- Do NOT add a source entry for "I searched but found nothing" — just leave it out
- Document your search effort in the feature's `description` field instead

This prevents cluttering the sources array with non-sources.

## The "No Source ≠ No Feature" Rule
Never score a feature `"No"` based solely on absence of documentation. Absence of evidence is `"Unknown"`, not `"No"`.

Only score `"No"` if:
- The vendor explicitly states they don't offer it, OR
- Their product category makes the feature structurally impossible (e.g., a reporting tool scored "No" on data ingestion)

## keyStrength Verification
The `keyStrength` field from Phase 1 discovery is a marketing claim, not verified evidence. Do not cite it as a source for feature scores. Verify all feature claims independently during analysis.
