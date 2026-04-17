---
name: report-writing
description: Structure and writing guidelines for every section of the competitive analysis report
user-invocable: false
---

# Report Writing Guide

## File Format
Save as `report.md`. Start with:
```
# Competitive Analysis: [Product Name]
*Generated [YYYY-MM-DD]*
```

---

## Section 1: Executive Summary
**Length:** 4–6 sentences

Structure:
1. State the market direction (consolidation, AI disruption, platform wars, fragmentation)
2. Name the dominant 2–3 players and what they own
3. Identify the key tension buyers face (e.g., "best-of-breed vs. all-in-one", "build vs. buy")
4. State the most important strategic takeaway for the product team

---

## Section 2: Competitive Products
Markdown table:

| Product | Company | Description | Target User |
|---|---|---|---|
| Name | Company | 1-sentence description | Role/persona |

---

## Section 3: Feature Comparison Matrix
Markdown table with:
- **Rows** = features
- **Columns** = competitors (product names only, not company names)
- **Symbols**: ✅ Yes / ⚡ Partial / ❌ No / ❓ Unknown
- **Coverage indicator** per row (rightmost column):
  - 🟢 ≥70% of competitors have this feature (table stake)
  - 🟡 40–69% coverage
  - 🔴 <40% coverage (potential differentiator)

Example:
```
| Feature | Competitor A | Competitor B | Competitor C | Coverage |
|---|---|---|---|---|
| SSO / SAML | ✅ | ✅ | ❌ | 🟡 |
| API access | ✅ | ⚡ | ✅ | 🟢 |
| Offline mode | ❌ | ❓ | ❌ | 🔴 |
```

---

## Section 4: Competitor Profiles
For each competitor, two lines:
- **Target customer:** [1 sentence on ICP — company size, industry, buyer role]
- **Deployment & GTM:** [1 sentence on how it's sold and deployed — self-serve vs. sales-led, cloud vs. on-prem, typical deal size if known]

---

## Section 5: Table Stakes
Bullet list. Each item:
```
- **[Feature Name]** — WHY expected: [reason buyers assume this]. WHO provides it: Competitor A, Competitor B, Competitor C.
```

---

## Section 6: Differentiation Opportunities
Each item:
```
### [Opportunity Name]
**Gap:** [What competitors lack or do poorly]
**Advantage:** [One sentence on how the product being analyzed can own this, grounded in its description]
```

---

## Section 7: Key Market Differentiators
Three items, each:
```
### [Differentiator Name]
[2–3 sentence strategic description of why this matters in this market right now]
```

---

## Section 8: Sources
Group by competitor. For each:
```
### [Competitor Name]
- [Title](url) — product-page
- [Title](url) — review-site
```
