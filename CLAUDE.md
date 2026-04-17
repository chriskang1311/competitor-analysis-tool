# Competitive Intelligence Tool — Claude Code Instructions

## What This Tool Does

This is a multi-agent competitive intelligence tool. Describe any B2B product and this tool will:
1. **Discover** the top competitors in the market (Discovery + Validation teammates, parallel)
2. **Analyze** selected competitors in depth — one dedicated teammate per competitor (parallel)
3. **Synthesize** a full competitive report with a feature matrix, differentiation opportunities, and citations

No category required. No CLI commands. Works for any B2B software market. Just describe the product.

Results are saved to `reports/` as JSON + Markdown. Open `.md` files with `Cmd+Shift+V` in VSCode for formatted preview.

---

## Skills Available to All Agents

Domain expertise lives in `.claude/skills/`. All teammates load these automatically:

| Skill | Purpose |
|---|---|
| `competitor-discovery` | Search strategies for finding real B2B competitors |
| `competitor-validation` | Confidence scoring rubric and top-5 selection criteria |
| `feature-evaluation` | Yes/Partial/No/Unknown framework with evidence requirements |
| `market-analysis` | Table stakes, differentiation gaps, strategic opportunity framing |
| `source-management` | Citation format, source types, conflict handling |
| `report-writing` | Structure and writing guide for every report section |
| `research-playbook` | Step-by-step research workflow and gap-handling techniques |
| `healthcare-context` | Optional: load this skill if the product is in healthcare |

---

## Triggering an Analysis

Respond to any of these phrasings:
- "Analyze competitors for [product description]"
- "Who competes with [product]?"
- "Research competitors for [product]"
- "Do a competitive analysis of [product]"
- "Run a competitive analysis on [product]"

**You only need a product description** — 1–3 sentences about what it does and who uses it. No category selection, no flags.

If the description is fewer than 2 sentences or lacks a buyer persona, ask one clarifying question: *"Who is the primary buyer for this product (role/title and company type)?"*

If the product is in healthcare (mentions hospitals, health systems, EHR, patients, clinical, payers, providers, or similar), proactively load the `healthcare-context` skill for all teammates.

---

## Phase 1 — Discovery

### Step 0 — Infer and Announce Market Context
Before creating the team, **you** (the team lead) infer and state aloud:
- **Competitive category**: what this product would be called on G2/Gartner (e.g., "patient scheduling software")
- **Buyer persona**: who pays for it (e.g., "VP Patient Access at mid-size health systems")
- **Market segment**: enterprise / mid-market / SMB (infer from description cues)
- **Feature dimensions**: the 8–10 most important capabilities to evaluate for this category

Write these out as a brief "Market Context" block before spawning teammates. Both teammates will use this context — do not let them infer independently.

Example:
```
Market Context:
- Category: patient scheduling software
- Buyer: VP Patient Access / Director of Patient Experience at health systems (200+ beds)
- Segment: enterprise
- Feature dimensions to evaluate: EHR integration, autonomous scheduling, provider matching,
  waitlist management, multi-channel booking, staff-facing tools, analytics dashboard,
  patient notifications, referral intake, API/configurability
```

### Step 1 — Create an Agent Team with 2 Teammates Running in Parallel

Pass the **Market Context block** to both teammates so they work from the same definition.

**Discovery Teammate**
- Use the market context (do not re-infer)
- Issue 4+ parallel searches per the `competitor-discovery` skill
- Fetch G2 and Capterra category pages for the identified category; follow all promising leads
- Return 10–15 candidate competitors as JSON using this exact schema:
```json
[
  {
    "id": "slugified-product-name",
    "name": "Product Name",
    "company": "Company Name",
    "website": "https://...",
    "description": "1-2 sentence description of what they do",
    "targetUser": "Who buys this product",
    "keyStrength": "The one thing they are best known for"
  }
]
```

**Validation Teammate**
- Use the market context (do not re-infer)
- For each candidate, validate using the `competitor-validation` skill
- Check for duplicates: if two entries are the same product under different names, keep only one
- Return the validated list as JSON using this exact schema:
```json
[
  {
    "id": "slugified-product-name",
    "name": "Product Name",
    "company": "Company Name",
    "website": "https://...",
    "description": "1-2 sentence description",
    "targetUser": "Who buys this product",
    "keyStrength": "Best known for",
    "confidence": "High | Medium | Low",
    "recommended": true,
    "validatorNote": "1-2 sentences citing evidence for this confidence score",
    "recommendationReason": "1 sentence on why this is must-analyze (only for recommended: true)"
  }
]
```
- Mark `recommended: true` for the top competitors per the `competitor-validation` skill (up to 5; fewer if fewer high-quality candidates exist)
- For non-recommended competitors, set `recommendationReason` to `null`

### Step 2 — After Both Teammates Finish

**Validate before saving:**
- Confirm the validated list is not empty. If empty, tell the user: *"No competitors found — try a more specific product description including the buyer role and core problem."*
- Confirm at least 1 competitor is `recommended: true`. If none, mark the top 2 by confidence as recommended.
- Check for duplicate `id` values — deduplicate if found.

**Save:**
1. Generate slug: `[product-name-slugified]-[YYYY-MM-DD]`
2. Create directory `reports/[slug]/`
3. Write `reports/[slug]/session.json`:
```json
{
  "productName": "...",
  "productDescription": "...",
  "inferredCategory": "...",
  "inferredBuyerPersona": "...",
  "inferredSegment": "enterprise | mid-market | SMB",
  "canonicalFeatures": ["feature1", "feature2", "..."],
  "slug": "...",
  "createdAt": "ISO timestamp",
  "phase1Complete": true,
  "phase2Complete": false
}
```
4. Write `reports/[slug]/competitors.json` with the full validated competitor array

**Print ranked list:**
```
  ★ 1. Competitor A (Company X) [High  ]
       Direct competitor with identical buyer profile.
       → Must-analyze because it leads the G2 category rankings.

    2. Competitor B (Company Y) [Medium]
       Overlaps on core features but targets a different segment.
```

**Tell the user:**
> "Discovery complete. I found [N] competitors. The ★ starred ones are recommended. Which would you like to deep-analyze?
> - **'use starred'** — analyze the ★ recommended ones
> - **'1, 3, 5'** — specify by number
> - **'all'** — analyze all of them (slower)"

---

## Phase 2 — Analysis

### Triggered by:
- "Use starred" / "Continue with starred"
- "Analyze 1, 3, 5" (numbers from the Phase 1 list)
- "All"
- "Continue from reports/[slug]/"
- "Continue the analysis"

### Step 0 — Load and Validate Session

1. Read `reports/[slug]/session.json`
   - If file missing: *"No session found. Run Phase 1 first by describing your product."*
   - If `phase1Complete` is not `true`: *"Phase 1 is incomplete for this session. Re-run discovery before analyzing."*
2. Read `reports/[slug]/competitors.json`
   - If file missing or empty array: *"Competitor list missing. Re-run Phase 1."*
3. Identify selected competitors:
   - "starred" → filter where `recommended: true`
   - Numbers (e.g., "1, 3, 5") → pick by 1-based position in the printed list order
   - "all" → all competitors
   - If ambiguous (multiple sessions exist), list them and ask user to confirm: *"Found [N] sessions: [list slugs with dates]. Which one?"*
4. Load `canonicalFeatures` from `session.json` — these are the exact features every analyzer must evaluate
5. Confirm selection aloud: *"I'll analyze [N] competitors: [names]. Starting now."*

### Step 1 — Create an Agent Team

Pass to every teammate:
- Product name, description, buyer persona, segment (from session.json)
- The **canonical feature list** from `session.json`
- The competitor's full entry from `competitors.json`

**One Analyzer Teammate per selected competitor (all run in parallel)**

Each analyzer:
- Researches exactly one competitor
- Evaluates **only the canonical features** from the session (not self-selected features)
- Follows `feature-evaluation`, `source-management`, and `research-playbook` skills
- Saves to `reports/[slug]/competitor-[id].json` using this exact schema:
```json
{
  "id": "slugified-product-name",
  "name": "Product Name",
  "company": "Company Name",
  "targetCustomer": "1 sentence on ICP — company size, industry, buyer role",
  "deploymentModel": "1 sentence on how it is sold and deployed",
  "features": {
    "feature-name": {
      "value": "Yes | Partial | No | Unknown",
      "description": "1-2 sentences on HOW this feature works",
      "sourceUrl": "https://... (required; use null only for Unknown with no source found)"
    }
  },
  "sources": [
    {
      "url": "https://...",
      "type": "product-page | review-site | analyst-report | news | company-overview | blog | other",
      "title": "Short descriptive title",
      "accessedDate": "YYYY-MM-DD"
    }
  ]
}
```
- Every canonical feature must appear in `features`, even if scored Unknown

**On analyzer failure:** If an analyzer cannot complete (timeout, no data found), it must still write the file with all features set to `"Unknown"` and a `targetCustomer` note: *"Analysis incomplete — [reason]"*. This prevents synthesis from failing on a missing file.

### Step 2 — Validate Before Synthesis

Before spawning the Synthesis Teammate, **you** (the team lead):
1. Check that every expected `competitor-[id].json` file exists
2. For any missing file: re-run that single analyzer before proceeding
3. For each file that exists, verify it has all canonical features present (even as Unknown)
4. If any file has fewer than 50% of features as actual Yes/Partial/No (too many Unknown), flag it: *"Analysis for [competitor] is thin — [N] of [total] features are Unknown. Proceeding, but results may be incomplete."*

### Step 3 — Synthesis Teammate

Starts only after Step 2 validation passes.

- Reads all `reports/[slug]/competitor-[id].json` files
- Reads `reports/[slug]/competitors.json` for validator notes
- Applies `market-analysis` and `report-writing` skills
- Writes `reports/[slug]/report.md`

The report must include all sections defined in the `report-writing` skill, including **Market Dynamics**.

If a competitor's file is incomplete (mostly Unknown), include them in the matrix with a footnote: *"† Analysis incomplete for this competitor."*

### Step 4 — After All Complete

1. Update `reports/[slug]/session.json`: set `"phase2Complete": true`
2. Print the executive summary from `report.md`
3. Tell the user:

> "Full report saved at `reports/[slug]/report.md`. Open it in VSCode and press `Cmd+Shift+V` for the formatted feature matrix and citations."

---

## Resuming a Previous Session

If Phase 1 already ran, start Phase 2 directly:
> "Continue from reports/[slug]/"

List previous sessions:
> "List my previous analyses" → list contents of `reports/` directory, showing slug + `createdAt` + `phase2Complete` status

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Team doesn't spin up | Ensure `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in `.claude/settings.json` |
| No competitors found | Provide a more specific description including buyer role and core problem |
| Report missing sections | Ask synthesis teammate to re-read the `report-writing` skill and regenerate |
| Session files missing | Check `reports/` directory; if empty, re-run Phase 1 |
| Analyzer incomplete | Re-run Phase 2 — the lead will detect missing files and retry the failed analyzer |
