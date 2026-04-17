// ── Category feature hints ───────────────────────────────────────
export const CATEGORY_FEATURE_HINTS = {
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
    "ai-healthcare-scheduling": [
        "Epic Integration Depth (read-only / read-write / real-time bidirectional)",
        "Epic Integration Method (App Orchard certified / native API / workaround-RPA-screen-scraping)",
        "Autonomous Booking in Epic (book-modify-cancel without human confirmation)",
        "Automation Level (fully autonomous / human-in-loop / configurable)",
        "AI Copilot for Scheduling Staff (worker-facing, handles phone-in patients)",
        "Inbound Patient Voice Agent (answers patient calls autonomously)",
        "Outbound Patient Voice Agent (calls patients to schedule or remind)",
        "Referral Intake & Batching (fax/electronic referral processing, scheduling worklist)",
        "Guideline & Constraint Ingestion (PDFs, flowcharts, provider tables, visit types, insurance panels)",
        "Self-Serve Configuration (vs. requires vendor implementation)",
        "Deployment Model & Go-to-Market (standalone vs. EHR-dependent, implementation timeline, sales motion)",
    ],
};
// ── Segment language helper ───────────────────────────────────────
function segmentFilter(segment) {
    if (!segment)
        return "";
    if (segment === "enterprise") {
        return `\nSEGMENT FILTER — ENTERPRISE ONLY: Focus exclusively on established, mature vendors — publicly traded companies, private equity-backed firms, or companies with Series D+ funding, 200+ employees, and at least 5 years in the market. Exclude early-stage startups, companies founded after 2020, and companies with fewer than 50 employees.\n`;
    }
    if (segment === "startup") {
        return `\nSEGMENT FILTER — STARTUPS ONLY: Focus exclusively on emerging, early-stage companies — startups founded within the last 7 years, seed through Series C funded, typically fewer than 200 employees. Exclude large established vendors, publicly traded companies, legacy EHR/HIS systems, and any company with more than 500 employees.\n`;
    }
    return `\nSEGMENT FILTER: ${segment}\n`;
}
// ── Discovery prompt ─────────────────────────────────────────────
export function buildDiscoveryPrompt(productName, productDescription, category, tavilyContext, segment) {
    const tavilySection = tavilyContext
        ? `\nPRE-FETCHED SEARCH RESULTS (use these as your primary source — do not repeat these searches):\n${tavilyContext}\n`
        : "";
    const segmentSection = segmentFilter(segment);
    const searchInstruction = tavilyContext
        ? `1. The pre-fetched results above are your starting point — extract competitors from them first\n2. Use WebSearch only to fill gaps or verify details not covered above`
        : `1. Search for competitors using queries like: "best ${category} software healthcare", "top ${category} solutions", "${productName} alternatives", "${category} vendors KLAS"\n2. Check G2, Capterra, KLAS Research, Black Book Research, and vendor websites`;
    const currentYear = new Date().getFullYear();
    return `You are a healthcare technology competitive intelligence analyst. Your task is to identify the top 10 direct competitors to the product described below.

PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
CATEGORY: ${category}
CURRENT DATE: ${currentYear}
${segmentSection}${tavilySection}
INSTRUCTIONS:
${searchInstruction}
3. A competitor must be a DIRECT competitor — same category, same buyer (health systems, hospitals, or physician groups)
4. Do NOT include consulting firms, staffing companies, or tangentially related products
5. IMPORTANT: Strictly apply the SEGMENT FILTER above — only include competitors that match the specified company size/stage
6. RECENCY: Actively seek recent information (last 12 months preferred). For each competitor, note any recent developments such as new product launches, funding rounds, acquisitions, or leadership changes. Older foundational information (feature sets, company background) is still valuable — include it, but supplement with the latest available data.
7. For each competitor, capture:
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
export function buildTavilyDiscoveryPrompt(productName, productDescription, category, tavilyContext, segment) {
    const segmentSection = segmentFilter(segment);
    return `You are a healthcare technology competitive intelligence analyst. Your task is to identify direct competitors to the product described below.

IMPORTANT: You do NOT have access to a web browser. Work ONLY from the pre-fetched search results provided below. Do not attempt to search the web.

PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
CATEGORY: ${category}
${segmentSection}
PRE-FETCHED SEARCH RESULTS:
${tavilyContext}

INSTRUCTIONS:
1. Read every search result above carefully — results include both recent news (last 90 days) and older evergreen sources
2. Extract every product or platform mentioned that is a direct competitor to ${productName}
3. A competitor must be: same category (${category}), same buyer (health systems, hospitals, or physician groups)
4. Do NOT include: consulting firms, staffing agencies, or tangentially related products
5. IMPORTANT: Strictly apply the SEGMENT FILTER above — only include competitors that match the specified company size/stage
6. For each competitor, note any recent developments visible in the search results (funding, launches, acquisitions) alongside their core product information
7. For each competitor, extract or infer from the search results:
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
export function buildConsensusPrompt(productName, category, claudeList, tavilyList, segment) {
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
    const segmentSection = segmentFilter(segment);
    return `You are a senior healthcare technology analyst. Two independent research agents searched for competitors to ${productName} in the ${category} category. They worked separately and produced different lists. Your job is to review both lists and produce a final authoritative top 10.
${segmentSection}

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
7. IMPORTANT: Strictly enforce the SEGMENT FILTER — remove any competitor from either list that does not match the required company size/stage

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
export function buildValidatorPrompt(productName, category, competitors, segment) {
    const competitorList = competitors
        .map((c, i) => `${i + 1}. ${c.name} (${c.company}) — ${c.website}\n   ${c.description}`)
        .join("\n\n");
    const segmentSection = segmentFilter(segment);
    return `You are a senior healthcare technology analyst tasked with validating and quality-scoring a list of competitors identified for ${productName} in the ${category} category.
${segmentSection}

DISCOVERED COMPETITORS:
${competitorList}

YOUR TASKS:

1. VALIDATE each competitor:
   - Is this truly a direct competitor to ${productName} in the ${category} space?
   - Is the description accurate? Do a quick search to verify if needed.
   - Does this competitor match the SEGMENT FILTER? If not, assign confidence "Low" and note the mismatch.
   - Assign confidence: "High" (definitely a direct competitor matching the segment), "Medium" (overlaps but not a perfect match), or "Low" (questionable fit or wrong segment)
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
export function buildSingleCompetitorAnalysisPrompt(productName, category, competitor, featureHints, tavilyContext, segment) {
    const featureList = featureHints.map((f, i) => `${i + 1}. ${f}`).join("\n");
    const tavilySection = tavilyContext
        ? `\nPRE-FETCHED SEARCH RESULTS FOR ${competitor.name.toUpperCase()} (use these as your primary source):\n${tavilyContext}\n`
        : "";
    const searchInstruction = tavilyContext
        ? `1. The pre-fetched results above are your primary source — extract feature evidence from them first\n2. Visit ${competitor.website} and use WebSearch only to fill gaps not covered above`
        : `1. Visit ${competitor.website} — explore the product pages, feature lists, and integrations\n2. Search for "${competitor.name} features", "${competitor.name} ${category}", "${competitor.name} G2 reviews", "${competitor.name} KLAS"`;
    const currentYear = new Date().getFullYear();
    const segmentFocusHint = segment === "enterprise"
        ? `\nSEGMENT FOCUS — ENTERPRISE: When evaluating features, pay particular attention to: integration depth with major EHRs (Epic, Cerner, Oracle Health), multi-site / health system scalability, compliance certifications (SOC 2, HIPAA BAA, FedRAMP), enterprise SLA guarantees, and professional services / implementation support. These matter most to enterprise buyers.\n`
        : segment === "startup"
            ? `\nSEGMENT FOCUS — STARTUP: When evaluating features, pay particular attention to: ease and speed of deployment (time-to-value), self-serve configuration vs. professional services dependency, transparent pricing / usage-based models, modern API-first architecture, and product-led growth motion. These matter most to innovation-forward buyers evaluating emerging vendors.\n`
            : "";
    const schedulingGuidance = category === "ai-healthcare-scheduling" ? `
SCHEDULING CATEGORY GUIDANCE — apply these interpretations when evaluating each feature:
- "Epic Integration Depth": Look for explicit vendor claims about read-only access (view schedules only), read-write (can book on behalf of a patient), or real-time bidirectional sync (two-way live updates). Check their Epic App Orchard listing if one exists.
- "Epic Integration Method": Distinguish between (a) App Orchard certified — the vendor is listed at fhir.epic.com/Gallery; (b) native API — direct FHIR/HL7 connection but not App Orchard listed; (c) workaround — RPA, screen scraping, or browser automation against the Epic UI.
- "Autonomous Booking in Epic": Does the AI complete the full booking transaction in Epic without a human scheduler confirming each step? Look for language like "lights-out scheduling", "fully automated", or "zero-touch booking". Human-review steps (even lightweight) = Partial.
- "Automation Level": Fully autonomous = AI handles the entire scheduling workflow end-to-end with no human in the loop. Human-in-loop = a scheduler reviews or approves before completion. Configurable = the customer can set the automation threshold.
- "AI Copilot for Scheduling Staff": A tool used by scheduling staff (not patients) to handle inbound calls more efficiently — the AI assists the human agent in real time. Look for "copilot", "agent assist", or "scheduling assistant" positioning.
- "Inbound Patient Voice Agent": An AI that answers patient phone calls autonomously and can complete scheduling tasks without routing to a human agent. Distinguish from basic IVR (touch-tone menus = No) or live-agent-assist (= Partial).
- "Outbound Patient Voice Agent": The system proactively calls patients — for appointment reminders, scheduling follow-ups, or recall. Look for "automated outbound calls", "patient outreach", or "proactive scheduling". SMS-only outreach = Partial.
- "Referral Intake & Batching": The system ingests referral documents (fax, eFax, Direct message, HL7 ADT) and creates a scheduling worklist or queue for coordinators. Look for "referral management", "fax-to-digital", "OCR referral intake", or "scheduling queue".
- "Guideline & Constraint Ingestion": Can a health system upload PDFs, flowcharts, or Excel tables of provider scheduling rules (visit types, insurance panels, time slots, preparation requirements) and have the system apply them — without engineering work? Self-serve config vs. vendor-implemented = Partial.
- "Self-Serve Configuration": Can the customer configure the product themselves (scheduling rules, voice scripts, provider panels) through a UI, or does every change require the vendor's professional services team?
- "Deployment Model & Go-to-Market": Is the product sold standalone (EHR-agnostic) or only as an add-on to a specific EHR? What is the typical go-live timeline? Is it sold direct enterprise, via EHR marketplace (e.g., Epic App Orchard), or through channel partners?
${segmentFilter(segment)}` : segmentFilter(segment) ? `\n${segmentFilter(segment)}` : "";
    return `You are a healthcare technology analyst conducting a deep competitive analysis of ONE specific product.

YOUR SUBJECT: ${competitor.name} by ${competitor.company}
WEBSITE: ${competitor.website}
CURRENT DATE: ${currentYear}

CONTEXT: You are analyzing this product as a competitor to ${productName} in the ${category} category.
${tavilySection}${segmentFocusHint}${schedulingGuidance}
FEATURE DIMENSIONS TO EVALUATE:
${featureList}

INSTRUCTIONS:
${searchInstruction}
3. Actively look for BOTH recent developments AND established product information:
   - Recent (last 12 months): new features, funding rounds, acquisitions, pricing changes, executive changes, partnerships
   - Evergreen: core feature set, integrations, customer base, certifications, published case studies
4. For each feature dimension above, determine:
   - "Yes" — product clearly supports this
   - "Partial" — product has limited or partial support
   - "No" — product does not support this
   - "Unknown" — cannot determine from available sources
5. For any "Yes" or "Partial" finding, capture evidence with the source URL and — where visible — the publication date or year
6. If a source appears to be more than 2 years old and no newer source confirms it, note this in the claim (e.g., "as of 2022 — verify current status")

Return ONLY valid JSON in this exact format (no markdown, no prose):
{
  "id": "${competitor.id}",
  "name": "${competitor.name}",
  "company": "${competitor.company}",
  "values": {
    "Feature Name": "Yes"
  },
  "descriptions": {
    "Feature Name": "1-2 sentences describing HOW this feature is (or is not) supported. For Yes/Partial: explain the mechanism, product name, or specific capability. For No: briefly state the absence. For Unknown: state what was searched and not found."
  },
  "evidence": [
    {
      "feature": "Feature Name",
      "claim": "Exact quote or specific factual claim from the source",
      "url": "https://source-url.com/page"
    }
  ],
  "competitorSources": [
    { "type": "product-page", "url": "https://competitor.com/product" },
    { "type": "g2-reviews", "url": "https://g2.com/products/competitor" },
    { "type": "klas-research", "url": "https://klasresearch.com/vendor/competitor" },
    { "type": "company-overview", "url": "https://competitor.com/about" }
  ]
}

Use the EXACT feature names from the numbered list above as the keys in "values" and "descriptions".

For "competitorSources": collect the most important URLs you visited. Classify each by type:
- "product-page": the competitor's main product/features page
- "g2-reviews": G2.com reviews page
- "klas-research": KLAS Research vendor entry
- "company-overview": About/company page
- "news": press release, news article, or funding announcement
- "blog": vendor blog post or case study
- "other": any other relevant source`;
}
// ── Synthesis prompt ─────────────────────────────────────────────
export function buildSynthesisPrompt(productName, productDescription, category, competitorAnalyses, validatedCompetitors, segment) {
    const analysisJson = JSON.stringify(competitorAnalyses, null, 2);
    const validatorJson = JSON.stringify(validatedCompetitors.map(c => ({
        name: c.name,
        keyStrength: c.keyStrength,
        targetUser: c.targetUser,
        validatorNotes: c.validatorNotes,
    })), null, 2);
    const now = new Date().toISOString();
    const segmentBlock = segment
        ? `\nSEGMENT: ${segment}\n`
        : "";
    const segmentFraming = segment === "enterprise"
        ? `\nFRAMING: This is the ENTERPRISE SEGMENT report. Frame all findings in terms of large health systems (200+ beds), integrated delivery networks (IDNs), academic medical centers, and enterprise physician groups. Competitors are evaluated as replacements or augmentations to existing call center / patient access center infrastructure. Buyers are Patient Access Directors and VPs of Operations at large health systems.\n`
        : segment === "startup"
            ? `\nFRAMING: This is the STARTUP SEGMENT report. Frame all findings in terms of AI-native scheduling vendors targeting mid-size health systems, specialty practices (orthopedics, cardiology, primary care), and ambulatory networks. Evaluate their ability to displace or co-exist with legacy patient access platforms. Buyers may be innovation-forward CMOs, COOs, or VP Patient Experience at mid-market health systems.\n`
            : "";
    const schedulingExtraOutputs = category === "ai-healthcare-scheduling" ? `
7. featureSelectionRationale: A 3-5 sentence explanation of WHY these specific ≤12 features were chosen as the comparison dimensions for this segment. Note what other features were considered but excluded, and why. Write for a product strategy audience, not a technical one.
8. For each competitor in comparisonTable, also populate:
   - targetCustomerProfile: Health system size, specialty focus, and typical buyer title — 1 concise sentence (e.g., "Large IDNs (500+ beds), horizontally focused, sold to VP Patient Access.")
   - deploymentGTMSummary: Standalone vs. EHR-dependent, typical go-live timeline, and primary sales motion — 1-2 sentences.
` : "";
    const schedulingJsonAdditions = category === "ai-healthcare-scheduling" ? `
  "featureSelectionRationale": "3-5 sentences explaining why these features were chosen and what was excluded.",
  "segment": "${segment ?? ""}",` : (segment ? `\n  "segment": "${segment}",` : "");
    const competitorJsonExample = category === "ai-healthcare-scheduling"
        ? `      {
        "name": "Competitor Name",
        "company": "Company",
        "targetCustomerProfile": "Large IDNs, 500+ beds, VP Patient Access.",
        "deploymentGTMSummary": "EHR-agnostic standalone, 90-day implementation, direct enterprise sales.",
        "values": { "Feature 1": "Yes", "Feature 2": "No" }
      }`
        : `      {
        "name": "Competitor Name",
        "company": "Company",
        "values": { "Feature 1": "Yes", "Feature 2": "No" }
      }`;
    return `You are a strategic analyst writing a competitive intelligence report for a product team.

OUR PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
CATEGORY: ${category}
${segmentBlock}${segmentFraming}
COMPETITOR ANALYSIS DATA:
${analysisJson}

VALIDATOR NOTES ON EACH COMPETITOR:
${validatorJson}

YOUR TASK: Synthesize all this data into a structured competitive intelligence report.

Produce:
1. executiveSummary: 4-6 sentences (not bullet fragments) summarizing the competitive landscape, dominant players, and market direction
2. topDifferentiators: The 3 most important ways competitors differentiate (title + 1-2 sentence description)
3. tableStakes: Features that EVERY (or nearly every) competitor has — the minimum capability floor. For each: name the feature, explain WHY buyers expect it (1-2 sentences), and list which competitors support it.
4. differentiationOpportunities: Gaps where NO competitor excels. For each gap: name it, describe the gap in competitor capabilities (1-2 sentences), and write a specific advantage statement for ${productName} based on its description above — what could ${productName} do here that competitors cannot?
5. comparisonTable: A clean feature matrix with all competitors and features
6. sources: All evidence collected, for citation in the final report${schedulingExtraOutputs}

Return ONLY valid JSON in this exact format (no markdown, no prose):
{
  "productName": "${productName}",
  "category": "${category}",
  "generatedAt": "${now}",${schedulingJsonAdditions}
  "executiveSummary": [
    "Sentence 1 about the landscape.",
    "Sentence 2 about dominant players.",
    "Sentence 3 about market direction."
  ],
  "topDifferentiators": [
    { "title": "Differentiator name", "description": "Explanation of why this matters competitively." }
  ],
  "tableStakes": [
    {
      "feature": "Feature name customers expect as a baseline",
      "whyExpected": "1-2 sentences on why buyers assume any product in this space has this.",
      "supportedBy": ["Competitor A", "Competitor B"]
    }
  ],
  "differentiationOpportunities": [
    {
      "opportunity": "Short name for the gap",
      "gapDescription": "1-2 sentences describing what competitors do NOT do or do poorly.",
      "advantage": "1-2 sentences on how ${productName} could exploit this gap, grounded in its product description."
    }
  ],
  "comparisonTable": {
    "features": ["Feature 1", "Feature 2"],
    "competitors": [
${competitorJsonExample}
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
