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
- `"analyst-report"` — Gartner Magic Quadrant, Forrester Wave, KLAS, IDC
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
  "accessedDate": "2026-04-17"
}
```

## Reliability Ranking
When sources conflict, trust in this order:
1. `product-page` — the vendor says so directly
2. `analyst-report` — independent expert verification
3. `review-site` — aggregated user experience
4. `news` — announced but may not reflect current state
5. `company-overview` — high-level, not feature-specific
6. `blog` — often marketing, verify with primary source

## Conflict Handling
If two sources disagree on a feature:
- Cite both sources
- Note the discrepancy in the feature `description` field: *"Vendor page claims X, but G2 reviews from 2025 suggest Y — verify directly."*
- Keep the score as `"Partial"` if the reality is genuinely unclear

## Deduplication
If the same URL appears in multiple feature citations across the same competitor, list it once in the competitor's `sources` array and reference it by URL in each feature. Don't repeat full source objects.

## The "No Source = Unknown" Rule
Never score a feature as `"No"` based solely on the absence of evidence. Absence of documentation ≠ absence of the feature. If you can't find evidence, score `"Unknown"`.

Only score `"No"` if:
- The vendor explicitly says they don't offer it, OR
- Their positioning makes it structurally impossible (e.g., a read-only analytics tool scored "No" on write-back capability)
