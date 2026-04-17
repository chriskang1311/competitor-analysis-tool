---
name: research-playbook
description: Step-by-step research workflow for competitive analysis — market identification through evidence gap handling
user-invocable: false
---

# Research Playbook

## Step 1 — Use Provided Market Context
Do not re-infer the market. Use the market context provided by the team lead:
- Competitive category name
- Buyer persona
- Market segment
- Canonical feature list

If no context was provided, infer it from the product description before searching, then announce your inference.

## Step 2 — Broad Discovery (First Turn: Parallel Searches)
Issue 4–5 searches simultaneously using the provided category name:
1. `"best [category] software 2025"`
2. `"top [category] vendors"`
3. `"[product name] alternatives"`
4. `"[category] G2 top rated"`
5. `"[category] market leaders [current year]"`

**G2 URL pattern:** `https://www.g2.com/categories/[category-slug]` (e.g., `g2.com/categories/patient-scheduling`)
**Capterra URL pattern:** `https://www.capterra.com/[category-slug]-software/` (e.g., `capterra.com/patient-scheduling-software/`)

If the exact category slug doesn't work, search `site:g2.com [category]` to find the correct page.

## Step 3 — Deep Competitor Research (Per Competitor)
For each competitor, fetch in this order:
1. **Product/features page** — what capabilities do they list?
2. **Pricing page** — tier structure, enterprise vs. self-serve signals
3. **G2 or Capterra profile** — reviews reveal real usage and buyer frustrations
4. **Recent news or funding** — material changes in the last 12 months?

**When pricing is not public, look for signals:**
- "Contact sales" = enterprise, likely $50K+ ACV
- Tiered pricing with seat counts = mid-market
- Free tier + paid plans = PLG motion
- Job listings for "Enterprise Account Executive" or "Solution Engineer" = moving upmarket
- Case studies mentioning Fortune 500 clients = enterprise positioning

## Step 4 — Evaluate Each Canonical Feature
For each feature in your assigned canonical list:
1. Look for evidence on the competitor's product/features page first
2. If not found there, check G2/Capterra reviews
3. If still not found, run one targeted search: `"[competitor name] [feature name]"`
4. Also try: `site:[competitor-domain] [feature name]`
5. If still nothing → score `Unknown`, note what you searched

Never skip a feature. Every canonical feature must appear in your output.

## Step 5 — Staleness Check
**Before citing any source:**
- If the source is older than 18 months, run a quick search for newer information
- If a newer source contradicts the old one: use the newer source, update the score, note the old source in description
- If no newer source found: cite the old source with note *"Source from [date] — verify current state"*
- Pricing pages change frequently — treat any price data older than 6 months as unverified

**Conflict resolution when sources disagree:**
- Prefer newer source over older
- Prefer higher-reliability source (product-page > analyst-report > review-site > blog) when equally recent
- When unsure: score Partial (not Yes), and note the discrepancy

## Step 6 — All Searches Return Nothing
If multiple searches return no useful results for a competitor:
1. Try the company name instead of product name: `"[company name] [feature]"`
2. Check if the company has changed names or been acquired — search for the new name
3. Check LinkedIn for the company to confirm they're still active
4. If the company/product cannot be confirmed as active, note this in `targetCustomer`: *"Limited public information available — may be small/early-stage or poorly documented."*
5. Score all features Unknown, but document what you searched

Do not fabricate information. Unknown with documented search effort is always the correct fallback.
