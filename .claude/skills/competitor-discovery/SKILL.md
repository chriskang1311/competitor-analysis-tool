---
name: competitor-discovery
description: Search strategies and source evaluation for finding real B2B competitors in any market
user-invocable: false
---

# Competitor Discovery Methodology

## Step 1 — Infer the Market
From the product description, identify:
- The **core problem** the product solves
- The **buyer persona** (who pays for it, what their title is)
- The **competitive category name** used on analyst and review sites (e.g., "revenue cycle management software", "project management software", "HR onboarding software")

## Step 2 — Issue Parallel Searches
In your **first turn**, issue at least 4 searches simultaneously:
1. `"best [inferred-category] software 2025"`
2. `"top [inferred-category] vendors"`
3. `"[productName] alternatives"`
4. `"[inferred-category] G2 top rated"`

Add a 5th search if the category is niche or unfamiliar:
5. `"[inferred-category] market leaders"`

## Step 3 — Prioritize These Sources
Fetch results from:
- **G2** (g2.com) — most comprehensive for B2B SaaS; look for category pages, not just individual product pages
- **Capterra** (capterra.com) — strong for SMB-focused tools
- **Gartner Peer Insights** or **Gartner Magic Quadrant** — enterprise software
- **Product Hunt** — newer entrants, PLG products
- **VC portfolio pages** — find well-funded competitors
- **Comparison sites** — TrustRadius, SoftwareReviews, Software Advice

## Step 4 — Follow Promising Leads
If a review site lists 15+ products in a category, fetch the full page and scan all entries. Don't stop at the first 5.

## Step 5 — Confirm Genuine Competitors
A genuine competitor must have ALL of:
- Same **buyer persona** (similar title/role pays for it)
- Same **core problem** (solves the same business need)
- Overlapping **feature set** (at least 3 common capabilities)
- Similar **pricing tier** (enterprise vs. SMB vs. freemium)

## Segment Inference
Infer the target segment from cues in the product description:
- **Enterprise signals**: "health system", "Fortune 500", "compliance", "SOC 2", "enterprise", "100+ employees", "government"
- **SMB/startup signals**: "self-serve", "freemium", "PLG", "small team", "startup", "no credit card"

Include competitors from the same segment. Note if a competitor targets a different segment — it's still worth listing but flag it.

## What to Return
For each competitor, capture:
- `id`: slugified name (e.g., "salesforce-health-cloud")
- `name`: product name
- `company`: company name (may differ from product)
- `website`: homepage URL
- `description`: 1–2 sentences on what they do
- `targetUser`: who buys this product
- `keyStrength`: the one thing they are best known for
