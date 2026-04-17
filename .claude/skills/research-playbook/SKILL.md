---
name: research-playbook
description: Step-by-step research workflow for competitive analysis — market identification through evidence gap handling
user-invocable: false
---

# Research Playbook

## Step 1 — Identify the Market (Before Searching)
From the product description, determine:
- **(a) Core problem**: What does it solve? (e.g., "automates expense reporting", "manages patient scheduling")
- **(b) Buyer persona**: Who pays for it? (e.g., "CFO at mid-size companies", "VP Operations at hospitals")
- **(c) Category name**: What would this product be called on G2 or Gartner? (e.g., "expense management software", "patient access software")

Write out your inference before starting searches. This prevents wasted searches in the wrong category.

## Step 2 — Broad Discovery (First Turn: Parallel Searches)
Issue 4–5 searches simultaneously. Use the inferred category name from Step 1:
1. `"best [category] software 2025"`
2. `"top [category] vendors"`
3. `"[product name] alternatives"`
4. `"[category] G2 top rated"`
5. `"[category] market leaders [current year]"`

Fetch the top G2 category page and Capterra category page directly — these list all products in the space.

## Step 3 — Deep Competitor Research (Per Competitor)
For each competitor, fetch in this order:
1. **Product/features page** — what capabilities do they list?
2. **Pricing page** — tier structure, enterprise vs. self-serve signals (even if pricing is hidden, the page structure tells you a lot)
3. **G2 or Capterra profile** — reviews reveal real feature usage and buyer frustrations
4. **Recent news or funding** — has anything material changed in the last 12 months?

Pricing signals when pricing is not public:
- "Contact sales" = enterprise, likely $50K+ ACV
- Tiered pricing with seat counts = mid-market
- Free tier + paid plans = PLG motion
- Job listings for "Enterprise Account Executive" or "Solution Engineer" = moving upmarket
- Case studies mentioning Fortune 500 clients = enterprise positioning

## Step 4 — Handle Evidence Gaps
For any feature scored Unknown after initial research:
1. Try one more targeted search: `"[competitor name] [feature name]"`
2. Check their help center or documentation site (search `site:[competitor-domain] [feature name]`)
3. If still nothing → mark `Unknown`, note `"not documented in available sources"`

Never fill gaps by guessing. Unknown is always better than a wrong answer.

## Step 5 — Freshness Check
Before citing any source:
- If the source is **>18 months old**, do a quick search for newer information
- Flag stale sources in the `description` field: *"Based on [source] from [date] — verify current state"*
- Pricing pages change frequently — treat any price data older than 6 months as unverified

## Step 6 — Pricing Research Techniques
Even when pricing is not listed:
- Search `"[competitor name] pricing"` and `"[competitor name] cost"` — review sites often have user-reported pricing
- Check G2 reviews filtered by "pricing" — buyers mention what they paid
- Look for case studies: customer size × implied budget = pricing signal
- Check LinkedIn job listings: "quota-carrying AE targeting $X ARR" reveals deal size expectations
