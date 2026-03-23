# Competitor Analysis Tool — Claude Code Instructions

## What This Tool Does
This is a multi-agent healthcare technology competitive intelligence tool. When a user asks you to analyze competitors for a product, you orchestrate a pipeline of specialist AI agents that:

1. **Discover** the top competitors in the space (Discovery Agent)
2. **Validate** and score each competitor with confidence ratings (Validator Agent)
3. **Analyze** selected competitors in parallel — one dedicated agent per competitor (Analysis Agents)
4. **Synthesize** a full report with citations (Synthesis Agent)

Results are saved to `reports/` as JSON + Markdown. Open `.md` files with `Ctrl+Shift+V` in VSCode for formatted preview.

---

## Triggering an Analysis

Respond to any of these (and similar phrasings):
- "Analyze competitors for [product]"
- "Run competitor analysis on [product]"
- "Research competitors for [product name]"
- "Who are the competitors to [product]?"
- "Do a competitive analysis of [market/product]"

---

## The 7 Healthcare Product Categories

When the user mentions a product, identify which category it belongs to. If unclear, ask:

| Category ID | Label |
|---|---|
| `revenue-cycle-management` | Revenue Cycle Management |
| `contracting-strategy-yield` | Contracting Strategy & Yield |
| `supply-chain-pharmacy` | Supply Chain & Pharmacy |
| `care-model-operations` | Care Model Operations |
| `clinical-decision-support` | Clinical Decision Support |
| `patient-engagement` | Patient Engagement |
| `clinical-applications` | Clinical Applications |

---

## Step-by-Step Workflow

### Step 1 — Collect Information
Before running anything, make sure you have:
- **Product description** (1-3 sentences about what it does and who uses it)
- **Category** (one of the 7 IDs above)

If the user hasn't provided all three, ask for them before proceeding.

### Step 2 — Run Phase 1: Discovery + Validation
```bash
node --env-file=.env node_modules/.bin/tsx src/orchestrate.ts \
  --phase discover \
  --description "PRODUCT DESCRIPTION" \
  --category "CATEGORY-ID"
```

This runs two agents sequentially:
- **Discovery Agent** (~5 min): Finds top 10 competitors via web search
- **Validator Agent** (~3 min): Scores each competitor and ★ marks the top 5

The output will print a numbered list like:
```
  ★ 1. Competitor A (Company X) [High  ]
     Direct competitor with identical buyer profile.
     → Must-analyze because it leads the KLAS rankings in this space.

    2. Competitor B (Company Y) [Medium]
     Overlaps on 3 of 5 key features but targets a different buyer.
```

### Step 3 — Ask the User Which Competitors to Analyze
After showing the list, tell the user:

> "Discovery is complete. I found [N] competitors. The ★ starred ones are recommended by the validator. Which would you like to deep-analyze? You can say:
> - **'use starred'** — analyze the ★ recommended ones
> - **'1, 3, 5, 7'** — specify by number
> - **'all'** — analyze all of them (slower)"

### Step 4 — Run Phase 2: Deep Analysis + Synthesis

Once the user responds, run:
```bash
node --env-file=.env node_modules/.bin/tsx src/orchestrate.ts \
  --phase analyze \
  --name "PRODUCT NAME" \
  --description "PRODUCT DESCRIPTION" \
  --category "CATEGORY-ID" \
  --select "SELECTION" \
  --session "reports/SLUG/session.json"
```

Replace `SELECTION` with:
- `"starred"` if user said "use starred"
- `"1,3,5"` if user gave numbers
- `"all"` if user said all

The `--session` path uses the slug printed during Phase 1 (e.g. `reports/epic-mychart-2026-03-15/session.json`).

Analysis agents run **in parallel** — one per competitor — then the Synthesis Agent merges everything.

### Step 5 — Show Results
After Phase 2 completes, the terminal prints the executive summary. Relay it to the user in chat, then say:

> "The full report is saved at `reports/[slug]/report.md`. Open it in VSCode and press `Ctrl+Shift+V` (Mac: `Cmd+Shift+V`) for the formatted feature matrix and citations."

---

## Resuming a Previous Session

If Phase 1 already ran, skip it by pointing to the existing session file:
```bash
node --env-file=.env node_modules/.bin/tsx src/orchestrate.ts \
  --phase analyze \
  --name "..." --description "..." --category "..." \
  --select "starred" \
  --session "reports/epic-mychart-2026-03-15/session.json"
```

List previous sessions:
```bash
ls reports/
```

---

## Environment Setup

Requires `ANTHROPIC_API_KEY` in a `.env` file at the project root:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Missing required argument` | Ensure `--phase`, `--name`, `--description`, `--category` are all provided |
| `Cannot find module` | Run `npm install` in the project root |
| `ANTHROPIC_API_KEY` error | Check `.env` exists with a valid key |
| `Run --phase discover first` | Phase 1 hasn't completed — run discover before analyze |
| JSON parse error | AI returned malformed JSON — retry the same command |
