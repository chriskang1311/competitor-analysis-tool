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

---

## Triggering an Analysis

Respond to any of these phrasings:
- "Analyze competitors for [product description]"
- "Who competes with [product]?"
- "Research competitors for [product]"
- "Do a competitive analysis of [product]"
- "Run a competitive analysis on [product]"

**You only need a product description** — 1–3 sentences about what it does and who uses it. No category selection, no flags.

---

## Phase 1 — Discovery

### Create an Agent Team with 2 teammates running in parallel:

**Discovery Teammate**
- Infer the competitive category from the product description (per `research-playbook` and `competitor-discovery` skills)
- Issue 4+ parallel searches in the first turn
- Fetch G2 and Capterra category pages; follow promising leads
- Return 10–15 candidate competitors as structured JSON with fields: `id`, `name`, `company`, `website`, `description`, `targetUser`, `keyStrength`

**Validation Teammate**
- Validate each candidate against the product's market (per `competitor-validation` skill)
- Assign `confidence`: `"High"` | `"Medium"` | `"Low"`
- Mark exactly 5 as `recommended: true`
- Write `validatorNote` and `recommendationReason` for each

### After Both Teammates Finish:

1. Generate a slug: `[product-name-slugified]-[YYYY-MM-DD]`
2. Create the directory `reports/[slug]/`
3. Write `reports/[slug]/session.json`:
   ```json
   {
     "productName": "...",
     "productDescription": "...",
     "slug": "...",
     "createdAt": "...",
     "phase1Complete": true
   }
   ```
4. Write `reports/[slug]/competitors.json` with the full validated competitor list
5. Print a numbered list in this format:
   ```
     ★ 1. Competitor A (Company X) [High  ]
          Direct competitor with identical buyer profile.
          → Must-analyze because it leads the G2 category rankings.

       2. Competitor B (Company Y) [Medium]
          Overlaps on core features but targets a different segment.
   ```
6. Tell the user:

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

### Setup:
1. Read `reports/[slug]/session.json` and `reports/[slug]/competitors.json`
2. Identify selected competitors (starred = `recommended: true`, or user-specified numbers)
3. Confirm selection with user if ambiguous

### Create an Agent Team:

**One Analyzer Teammate per selected competitor (all run in parallel)**

Each analyzer:
- Is assigned exactly one competitor to research
- Uses `feature-evaluation`, `source-management`, and `research-playbook` skills
- Issues parallel searches for features, pricing, G2 profile, and recent news
- Infers the relevant features to evaluate from the product description and what competitors highlight
- Saves results to `reports/[slug]/competitor-[id].json` with structure:
  ```json
  {
    "id": "...",
    "name": "...",
    "company": "...",
    "targetCustomer": "...",
    "deploymentModel": "...",
    "features": {
      "[featureName]": {
        "value": "Yes | Partial | No | Unknown",
        "description": "...",
        "sourceUrl": "..."
      }
    },
    "sources": [
      { "url": "...", "type": "...", "title": "...", "accessedDate": "..." }
    ]
  }
  ```

**Synthesis Teammate (starts after analyzers complete)**

- Reads all `reports/[slug]/competitor-[id].json` files
- Reads `reports/[slug]/competitors.json` for validator notes
- Applies `market-analysis` and `report-writing` skills
- Writes `reports/[slug]/report.md` following the report-writing skill exactly

### After All Complete:

1. Print the executive summary from `report.md`
2. Tell the user:

> "Full report saved at `reports/[slug]/report.md`. Open it in VSCode and press `Cmd+Shift+V` for the formatted feature matrix and citations."

---

## Resuming a Previous Session

If Phase 1 already ran, start Phase 2 directly:
> "Continue from reports/[slug]/"

List previous sessions:
> "List my previous analyses" → list contents of `reports/` directory

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Team doesn't spin up | Ensure `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in `.claude/settings.json` |
| Teammates can't find competitors | Try a more specific product description with the buyer role and core problem |
| Report missing sections | Ask the synthesis teammate to re-read the `report-writing` skill and regenerate |
| Session files missing | Check `reports/` directory; if empty, re-run Phase 1 |
