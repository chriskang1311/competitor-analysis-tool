import type { CompetitorCard, ValidatedCompetitor, CompetitorAnalysis } from "./types.js";

// ── Category feature hints ───────────────────────────────────────

export const CATEGORY_FEATURE_HINTS: Record<string, string[]> = {
  "revenue-cycle-management": [
    "Real-time 270/271 EDI Eligibility Verification",
    "Automated Prior Authorization",
    "Claims Scrubbing & Editing",
    "Denial Management & Appeals Workflow",
    "Payment Posting Automation",
    "Patient Responsibility Estimation",
    "EHR/PM System Integrations",
    "Clearinghouse Connectivity",
    "Analytics & Reporting Dashboard",
    "AI-Powered Coding Assistance",
    "Contract Management & Modeling",
    "Collections & Bad Debt Management",
  ],
  "contracting-strategy-yield": [
    "Payer Contract Modeling & Simulation",
    "Rate Benchmarking vs. Market",
    "Contract Performance Analytics",
    "Underpayment Detection",
    "Value-Based Care Contract Support",
    "Multi-Site / Health System Support",
    "Negotiation Playbook Generation",
    "Real-Time Remittance Analysis",
    "Custom Fee Schedule Management",
    "Integration with EHR/PM Systems",
  ],
  "supply-chain-pharmacy": [
    "340B Program Management",
    "Drug Diversion Detection",
    "Automated Medication Dispensing",
    "Inventory Optimization & Forecasting",
    "GPO Contract Management",
    "Clinical Decision Support (Formulary)",
    "EHR Integration (CPOE)",
    "Regulatory Compliance Reporting",
    "Sterile Compounding Support",
    "Controlled Substance Tracking (DEA)",
    "Specialty Pharmacy Management",
  ],
  "care-model-operations": [
    "Population Health Management",
    "Care Coordination Workflows",
    "Risk Stratification & Attribution",
    "Chronic Disease Management Programs",
    "Care Gap Identification & Closure",
    "Social Determinants of Health (SDOH) Screening",
    "Transitional Care Management",
    "Utilization Management",
    "Quality Measure Tracking (HEDIS, Stars)",
    "EHR Integration & Data Ingestion",
    "Provider Network Management",
  ],
  "clinical-decision-support": [
    "Evidence-Based Order Sets",
    "Drug-Drug / Drug-Allergy Interaction Alerts",
    "Sepsis Early Warning & Alerts",
    "Predictive Analytics & Risk Scoring",
    "Diagnostic Decision Support",
    "Antimicrobial Stewardship",
    "Clinical Documentation Improvement (CDI)",
    "Real-Time Surveillance & Outbreak Detection",
    "Integration with EHR Workflow",
    "Custom Alert Authoring",
    "Regulatory & Quality Measure Alignment",
  ],
  "patient-engagement": [
    "Patient Portal (Scheduling, Messaging, Results)",
    "Mobile App (iOS + Android)",
    "Automated Appointment Reminders (SMS/Email/Voice)",
    "Online Bill Pay",
    "Telehealth / Virtual Visit Integration",
    "Post-Visit Surveys & CAHPS",
    "Patient Education Content Library",
    "Secure Messaging with Care Team",
    "EHR Integration & Single Sign-On",
    "Multilingual Support",
    "Self-Service Check-In & Registration",
    "Chronic Disease Remote Monitoring",
  ],
  "clinical-applications": [
    "Specialty-Specific Workflow Support",
    "CPOE & Clinical Documentation",
    "Interoperability (HL7 FHIR, CDA)",
    "Mobile / Tablet-First Design",
    "AI-Assisted Diagnosis or Documentation",
    "Regulatory Certification (ONC, HIPAA)",
    "Patient Data & Imaging Integration",
    "Real-Time Collaboration Tools",
    "Custom Workflow Builder",
    "Analytics & Outcome Tracking",
    "Cloud-Based vs. On-Premise Deployment",
  ],
};

// ── Discovery prompt ─────────────────────────────────────────────

export function buildDiscoveryPrompt(
  productName: string,
  productDescription: string,
  category: string,
  tavilyContext?: string
): string {
  const tavilySection = tavilyContext
    ? `\nPRE-FETCHED SEARCH RESULTS (use these as your primary source — do not repeat these searches):\n${tavilyContext}\n`
    : "";

  const searchInstruction = tavilyContext
    ? `1. The pre-fetched results above are your starting point — extract competitors from them first\n2. Use WebSearch only to fill gaps or verify details not covered above`
    : `1. Search for competitors using queries like: "best ${category} software healthcare", "top ${category} solutions", "${productName} alternatives", "${category} vendors KLAS"\n2. Check G2, Capterra, KLAS Research, Black Book Research, and vendor websites`;

  return `You are a healthcare technology competitive intelligence analyst. Your task is to identify the top 10 direct competitors to the product described below.

PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
CATEGORY: ${category}
${tavilySection}
INSTRUCTIONS:
${searchInstruction}
3. A competitor must be a DIRECT competitor — same category, same buyer (health systems, hospitals, or physician groups)
4. Do NOT include consulting firms, staffing companies, or tangentially related products
5. For each competitor, capture:
   - A unique slug ID (lowercase, hyphenated, e.g. "waystar-rcm")
   - Product name
   - Parent company name
   - Website URL
   - 2-3 sentence description of what it does
   - Primary target user (e.g. "Hospital billing teams at large IDNs")
   - Single most important competitive differentiator

Return ONLY valid JSON in this exact format (no markdown, no prose):
{
  "competitors": [
    {
      "id": "unique-slug",
      "name": "Product Name",
      "company": "Company Inc.",
      "website": "https://example.com",
      "description": "What it does in 2-3 sentences.",
      "targetUser": "Who uses it.",
      "keyStrength": "Its single most important advantage."
    }
  ]
}`;
}

// ── Tavily-only discovery prompt ─────────────────────────────────

export function buildTavilyDiscoveryPrompt(
  productName: string,
  productDescription: string,
  category: string,
  tavilyContext: string
): string {
  return `You are a healthcare technology competitive intelligence analyst. Your task is to identify direct competitors to the product described below.

IMPORTANT: You do NOT have access to a web browser. Work ONLY from the pre-fetched search results provided below. Do not attempt to search the web.

PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
CATEGORY: ${category}

PRE-FETCHED SEARCH RESULTS:
${tavilyContext}

INSTRUCTIONS:
1. Read every search result above carefully
2. Extract every product or platform mentioned that is a direct competitor to ${productName}
3. A competitor must be: same category (${category}), same buyer (health systems, hospitals, or physician groups)
4. Do NOT include: consulting firms, staffing agencies, or tangentially related products
5. For each competitor, extract or infer from the search results:
   - A unique slug ID (lowercase, hyphenated, e.g. "waystar-rcm")
   - Product name
   - Parent company name
   - Website URL (pull from the search results — do not guess)
   - 2-3 sentence description of what it does
   - Primary target user
   - Single most important competitive differentiator

Return ONLY valid JSON in this exact format (no markdown, no prose):
{
  "competitors": [
    {
      "id": "unique-slug",
      "name": "Product Name",
      "company": "Company Inc.",
      "website": "https://example.com",
      "description": "What it does in 2-3 sentences.",
      "targetUser": "Who uses it.",
      "keyStrength": "Its single most important advantage."
    }
  ]
}`;
}

// ── Consensus prompt ──────────────────────────────────────────────

export function buildConsensusPrompt(
  productName: string,
  category: string,
  claudeList: CompetitorCard[],
  tavilyList: CompetitorCard[]
): string {
  const claudeJson = JSON.stringify(claudeList, null, 2);
  const tavilyJson = JSON.stringify(tavilyList, null, 2);

  // Find name overlaps to surface in the prompt
  const claudeNames = new Set(claudeList.map(c => c.name.toLowerCase()));
  const tavilyNames = new Set(tavilyList.map(c => c.name.toLowerCase()));
  const overlap = claudeList
    .filter(c => tavilyNames.has(c.name.toLowerCase()))
    .map(c => c.name);
  const onlyInClaude = claudeList
    .filter(c => !tavilyNames.has(c.name.toLowerCase()))
    .map(c => c.name);
  const onlyInTavily = tavilyList
    .filter(c => !claudeNames.has(c.name.toLowerCase()))
    .map(c => c.name);

  return `You are a senior healthcare technology analyst. Two independent research agents searched for competitors to ${productName} in the ${category} category. They worked separately and produced different lists. Your job is to review both lists and produce a final authoritative top 10.

AGENT A — Claude WebSearch Agent found ${claudeList.length} competitors:
${claudeJson}

AGENT B — Tavily Search Agent found ${tavilyList.length} competitors:
${tavilyJson}

OVERLAP ANALYSIS (pre-computed to help you):
- Found by BOTH agents (high confidence): ${overlap.length > 0 ? overlap.join(", ") : "none detected"}
- Found only by Agent A (Claude): ${onlyInClaude.length > 0 ? onlyInClaude.join(", ") : "none"}
- Found only by Agent B (Tavily): ${onlyInTavily.length > 0 ? onlyInTavily.join(", ") : "none"}

CONSENSUS RULES:
1. Competitors found by BOTH agents are high-confidence — include them unless there is a clear reason not to
2. Competitors found by only one agent require more judgment — include them only if they are clearly a direct ${category} competitor to ${productName}
3. If both agents found the same company but with slightly different details (name, website, description), merge them using the most accurate and specific information from either source
4. You may add 1-2 obvious competitors that BOTH agents missed, if you are confident they belong
5. Rank by strategic importance — the most direct, highest-stakes competitors come first
6. Output exactly 10 competitors

Return ONLY valid JSON in this exact format (no markdown, no prose):
{
  "competitors": [
    {
      "id": "unique-slug",
      "name": "Product Name",
      "company": "Company Inc.",
      "website": "https://example.com",
      "description": "What it does in 2-3 sentences.",
      "targetUser": "Who uses it.",
      "keyStrength": "Its single most important advantage."
    }
  ]
}`;
}

// ── Validator prompt ─────────────────────────────────────────────

export function buildValidatorPrompt(
  productName: string,
  category: string,
  competitors: CompetitorCard[]
): string {
  const competitorList = competitors
    .map((c, i) => `${i + 1}. ${c.name} (${c.company}) — ${c.website}\n   ${c.description}`)
    .join("\n\n");

  return `You are a senior healthcare technology analyst tasked with validating and quality-scoring a list of competitors identified for ${productName} in the ${category} category.

DISCOVERED COMPETITORS:
${competitorList}

YOUR TASKS:

1. VALIDATE each competitor:
   - Is this truly a direct competitor to ${productName} in the ${category} space?
   - Is the description accurate? Do a quick search to verify if needed.
   - Assign confidence: "High" (definitely a direct competitor), "Medium" (overlaps but not a perfect match), or "Low" (questionable fit)
   - Write a brief validatorNotes (1-2 sentences) explaining your assessment

2. RECOMMEND top 5:
   - Mark the 5 most strategically important competitors as recommended: true
   - Provide a recommendationReason (1 sentence) explaining why each is a must-analyze

3. SUGGEST additional competitors (optional):
   - If you identify 1-2 obvious direct competitors that were missed, add them to the list
   - Set confidence: "High" and recommended: true for any additions you suggest

Return ONLY valid JSON in this exact format (no markdown, no prose):
{
  "competitors": [
    {
      "id": "unique-slug",
      "name": "Product Name",
      "company": "Company Inc.",
      "website": "https://example.com",
      "description": "Description.",
      "targetUser": "Target user.",
      "keyStrength": "Key strength.",
      "confidence": "High",
      "validatorNotes": "This is a direct competitor because...",
      "recommended": true,
      "recommendationReason": "Must-analyze because..."
    }
  ]
}`;
}

// ── Single-competitor analysis prompt ────────────────────────────

export function buildSingleCompetitorAnalysisPrompt(
  productName: string,
  category: string,
  competitor: ValidatedCompetitor,
  featureHints: string[],
  tavilyContext?: string
): string {
  const featureList = featureHints.map((f, i) => `${i + 1}. ${f}`).join("\n");

  const tavilySection = tavilyContext
    ? `\nPRE-FETCHED SEARCH RESULTS FOR ${competitor.name.toUpperCase()} (use these as your primary source):\n${tavilyContext}\n`
    : "";

  const searchInstruction = tavilyContext
    ? `1. The pre-fetched results above are your primary source — extract feature evidence from them first\n2. Visit ${competitor.website} and use WebSearch only to fill gaps not covered above`
    : `1. Visit ${competitor.website} — explore the product pages, feature lists, and integrations\n2. Search for "${competitor.name} features", "${competitor.name} ${category}", "${competitor.name} G2 reviews", "${competitor.name} KLAS"`;

  return `You are a healthcare technology analyst conducting a deep competitive analysis of ONE specific product.

YOUR SUBJECT: ${competitor.name} by ${competitor.company}
WEBSITE: ${competitor.website}

CONTEXT: You are analyzing this product as a competitor to ${productName} in the ${category} category.
${tavilySection}
FEATURE DIMENSIONS TO EVALUATE:
${featureList}

INSTRUCTIONS:
${searchInstruction}
3. For each feature dimension above, determine:
   - "Yes" — product clearly supports this
   - "Partial" — product has limited or partial support
   - "No" — product does not support this
   - "Unknown" — cannot determine from available sources
4. For any "Yes" or "Partial" finding, capture evidence: a specific claim and the URL where you found it

Return ONLY valid JSON in this exact format (no markdown, no prose):
{
  "id": "${competitor.id}",
  "name": "${competitor.name}",
  "company": "${competitor.company}",
  "values": {
    "Feature Name": "Yes"
  },
  "evidence": [
    {
      "feature": "Feature Name",
      "claim": "Exact quote or specific factual claim from the source",
      "url": "https://source-url.com/page"
    }
  ]
}

Use the EXACT feature names from the numbered list above as the keys in "values".`;
}

// ── Synthesis prompt ─────────────────────────────────────────────

export function buildSynthesisPrompt(
  productName: string,
  productDescription: string,
  category: string,
  competitorAnalyses: CompetitorAnalysis[],
  validatedCompetitors: ValidatedCompetitor[]
): string {
  const analysisJson = JSON.stringify(competitorAnalyses, null, 2);
  const validatorJson = JSON.stringify(
    validatedCompetitors.map(c => ({
      name: c.name,
      keyStrength: c.keyStrength,
      targetUser: c.targetUser,
      validatorNotes: c.validatorNotes,
    })),
    null, 2
  );
  const now = new Date().toISOString();

  return `You are a strategic analyst writing a competitive intelligence report for a product team.

OUR PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
CATEGORY: ${category}

COMPETITOR ANALYSIS DATA:
${analysisJson}

VALIDATOR NOTES ON EACH COMPETITOR:
${validatorJson}

YOUR TASK: Synthesize all this data into a structured competitive intelligence report.

Produce:
1. executiveSummary: 3-5 bullet points summarizing the competitive landscape
2. topDifferentiators: The 3 most important ways competitors differentiate (title + 1-2 sentence description)
3. tableStakes: Features that EVERY (or nearly every) competitor has — the baseline expectation
4. whitespaceOpportunities: Gaps where NO competitor excels — strategic opportunities for ${productName}
5. comparisonTable: A clean feature matrix with all competitors and features
6. sources: All evidence collected, for citation in the final report

Return ONLY valid JSON in this exact format (no markdown, no prose):
{
  "productName": "${productName}",
  "category": "${category}",
  "generatedAt": "${now}",
  "executiveSummary": [
    "Bullet point 1",
    "Bullet point 2"
  ],
  "topDifferentiators": [
    { "title": "Differentiator name", "description": "Explanation of why this matters competitively." }
  ],
  "tableStakes": ["Feature that every competitor has"],
  "whitespaceOpportunities": ["Gap in the market where no competitor excels"],
  "comparisonTable": {
    "features": ["Feature 1", "Feature 2"],
    "competitors": [
      {
        "name": "Competitor Name",
        "company": "Company",
        "values": { "Feature 1": "Yes", "Feature 2": "No" }
      }
    ]
  },
  "sources": [
    {
      "competitor": "Competitor Name",
      "feature": "Feature Name",
      "claim": "Specific claim from source",
      "url": "https://source-url.com"
    }
  ]
}`;
}
