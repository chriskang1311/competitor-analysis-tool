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
*Generated [YYYY-MM-DD] · Category: [inferredCategory] · Segment: [inferredSegment]*
```

---

## Section 1: Executive Summary
**Length:** 4–6 sentences. Exactly 4 questions to answer, one sentence each (plus 1–2 for elaboration):

1. What is the market doing right now? (consolidation, AI disruption, platform wars, fragmentation)
2. Who are the dominant 2–3 players and what do they own?
3. What is the key tension buyers face? (e.g., "best-of-breed vs. all-in-one")
4. What is the most important strategic takeaway for the product team?

Do not write more than 6 sentences. Do not pad with background context.

---

## Section 2: Competitive Products
Markdown table:

| Product | Company | Description | Target User |
|---|---|---|---|
| Name | Company | 1-sentence description | Role/persona |

---

## Section 3: Feature Comparison Matrix
Markdown table:
- **Rows** = canonical feature dimensions (from session.json)
- **Columns** = competitor product names (not company names)
- **Symbols**: ✅ Yes / ⚡ Partial / ❌ No / ❓ Unknown
- **Coverage** column (rightmost): percentage of competitors with Yes or Partial, plus indicator:
  - 🟢 ≥70% → table stake (buyers assume this exists)
  - 🟡 40–69% → contested (worth watching)
  - 🔴 <40% → potential differentiator (rare in the market)

If a competitor's analysis was incomplete, include their column and mark all unresearched features ❓, with a `†` footnote below the table: *"† [Competitor name] analysis was incomplete."*

**Escape pipes:** If any cell value contains `|`, replace with a hyphen to avoid breaking the table.

Example:
```
| Feature              | Comp A | Comp B | Comp C | Coverage |
|----------------------|--------|--------|--------|----------|
| SSO / SAML           | ✅     | ✅     | ❌     | 67% 🟡   |
| API access           | ✅     | ⚡     | ✅     | 100% 🟢  |
| Offline mode         | ❌     | ❓     | ❌     | 0% 🔴    |
```

---

## Section 4: Competitor Profiles
For each competitor, two lines:
- **Target customer:** [ICP — company size, industry, buyer role]
- **Deployment & GTM:** [how it is sold and deployed — self-serve vs. sales-led, cloud vs. on-prem, typical deal size if known]

---

## Section 5: Table Stakes
Features with 🟢 coverage (≥70%). Bullet list:
```
- **[Feature Name]** — WHY expected: [reason buyers assume this]. WHO provides it: Comp A, Comp B, Comp C.
```

If fewer than 2 features qualify as table stakes, lower threshold to ≥50% and note: *"Table stakes defined at ≥50% coverage for this market."*

---

## Section 6: Contested Features
Features with 🟡 coverage (40–69%). These are neither assumed nor rare — they separate leaders from laggards.
```
- **[Feature Name]** — [1 sentence on why adoption is partial and what separates those who have it from those who don't]
```

Omit this section if no features fall in the 40–69% range.

---

## Section 7: Differentiation Opportunities
Features with 🔴 coverage (<40%) where the product being analyzed could credibly own the space.

**How many to include:** Include all features with 🔴 coverage, but group minor ones. Aim for 3–6 meaningful opportunities; if more than 6 qualify, pick the 6 with highest buyer impact.

Each item:
```
### [Opportunity Name]
**Gap:** [What competitors lack or do poorly — be specific, not "better UX"]
**Advantage:** [One sentence on how the product can own this, grounded in its description]
```

---

## Section 8: Key Market Differentiators
Three items — the most strategically important competitive edges in this market right now.

Ranked by: (1) buyer priority, (2) competitive gap, (3) defensibility.

```
### [Differentiator Name]
[2–3 sentence strategic description of why this matters now]
```

---

## Section 9: Market Dynamics
Include if any of the following were found during research:
- M&A activity in the last 12 months
- Significant funding rounds (>$20M) by competitors
- Large platform players expanding into this space
- Notable product launches or pivots

Format as a bullet list:
```
- **[Event]** ([Date if known]): [1–2 sentence description of strategic significance]
```

If no material dynamics were found, omit this section entirely. Do not fabricate or speculate.

---

## Section 10: Sources
Group by competitor. For each:
```
### [Competitor Name]
- [Title](url) — product-page
- [Title](url) — review-site
```

Sort within each competitor: product-page first, then analyst-report, then review-site, then others.
