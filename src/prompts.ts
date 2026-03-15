export function buildDiscoveryPrompt(
  productName: string,
  productDescription: string,
  category: string
): string {
  return `You are a senior healthcare technology market analyst. Find the top 10 direct competitors for the following product.

Product Name: ${productName}
Description: ${productDescription}
Category: ${category}

Instructions:
1. Search the web using queries like "best ${category} software healthcare", "top ${category} solutions", "${productName} alternatives", and check G2, Capterra, KLAS Research, and vendor websites.
2. Only include direct competitors — same category, same buyers.
3. For each competitor, find: product name, parent company, website URL, 2-3 sentence description, primary target user, and single most important key strength.
4. Return ONLY valid JSON. No markdown, no prose, no code fences.
5. Do not fabricate — if you cannot find 10, return fewer.

Return EXACTLY this JSON structure:
{
  "competitors": [
    {
      "id": "unique-slug-lowercase-hyphenated",
      "name": "Product Name",
      "company": "Company Inc.",
      "website": "https://example.com",
      "description": "2-3 sentences about what the product does.",
      "targetUser": "Who primarily uses this product.",
      "keyStrength": "The single most important competitive advantage."
    }
  ]
}`;
}

export function buildDeepAnalysisPrompt(
  productName: string,
  productDescription: string,
  category: string,
  competitors: Array<{ name: string; website: string; company: string }>
): string {
  const competitorList = competitors
    .map(c => `- ${c.name} (${c.company}) — ${c.website}`)
    .join("\n");
  return `You are a senior healthcare technology market analyst. Produce a detailed feature comparison for these competitors in the ${category} space.

Our product: ${productName} — ${productDescription}

Competitors to research:
${competitorList}

Instructions:
1. For each competitor, visit their website, check G2/Capterra/KLAS, and look for feature documentation.
2. Identify 10-15 features/capabilities that are most meaningful and differentiating for the ${category} space. Use specific feature names, not generic categories.
   Good: "Real-time 270/271 EDI Eligibility Checks"
   Bad: "Customer Support"
3. For each competitor and feature, assign exactly one value: "Yes", "Partial", "No", or "Unknown".
4. Return ONLY valid JSON. No markdown, no prose, no code fences.

Return EXACTLY this JSON structure:
{
  "features": ["Feature Name 1", "Feature Name 2"],
  "competitors": [
    {
      "name": "Product Name",
      "company": "Company Inc.",
      "values": {
        "Feature Name 1": "Yes",
        "Feature Name 2": "No"
      }
    }
  ]
}`;
}

export function buildFeatureResearchPrompt(
  productName: string,
  productDescription: string,
  category: string,
  featuresToResearch: string[],
  competitors: Array<{ name: string; website: string; company: string }>
): string {
  const featureList = featuresToResearch.map(f => `- ${f}`).join("\n");
  const competitorList = competitors
    .map(c => `- ${c.name} (${c.company}) — ${c.website}`)
    .join("\n");
  return `You are a senior healthcare technology market analyst. Research ONLY the following specific features for each competitor.

Our product: ${productName} — ${productDescription}
Category: ${category}

Features to research (ONLY these, no others):
${featureList}

Competitors:
${competitorList}

Instructions:
1. For each competitor and each listed feature, visit their website and check G2/Capterra/KLAS.
2. For each feature assign exactly one: "Yes", "Partial", "No", or "Unknown".
3. Return ONLY valid JSON. No markdown, no prose, no code fences.

Return EXACTLY this structure (include ONLY the features listed above):
{
  "features": ["Feature Name"],
  "competitors": [
    {
      "name": "Product Name",
      "values": { "Feature Name": "Yes" }
    }
  ]
}`;
}

export function buildAnalysisPrompt(
  productName: string,
  productDescription: string,
  maxCompetitors: number
): string {
  return `You are a senior healthcare technology market analyst. Your task is to produce a comprehensive competitor analysis report for the following product.

**Product Being Analyzed:**
Name: ${productName}
Description: ${productDescription}

---

Your research process:

1. **Find competitors**: Search the web for the top ${maxCompetitors} competitors in this space. Use queries like "best [product type] software healthcare", "top [product category] alternatives", and search G2, Capterra, and Software Advice. Look for direct competitors (same category, same users).

2. **Generate a feature list**: Based on your research, identify up to 15 features/capabilities that are most meaningful and differentiating for this specific product space. These must be SPECIFIC to the category (e.g., for eligibility verification: "Real-time 270/271 EDI Transactions", "Batch Eligibility Checks" — NOT generic features like "Customer Support").

3. **Research each competitor**: For each competitor, search for:
   - What the product does and who it serves
   - Features (check their website, G2 reviews, Capterra listings, product docs)
   - Rate each feature from your list as: Has / Partial / No / Unknown

4. **Write the report**: Produce all 5 sections below based on your research.

---

Write the complete report with EXACTLY these 5 sections:

## Section 1: Competitor Profiles

For each competitor:
**[Product Name]** — [Company Name]
- **Description:** [2-3 sentences]
- **Target User:** [Primary persona]
- **Key Differentiator:** [What makes it distinct]

---

## Section 2: Feature Comparison Matrix

A markdown table where:
- First row: competitor product names as columns
- Second row: parent company names
- Remaining rows: each feature from your feature list
- Cells: ✅ Has | 🔶 Partial | ❌ No | ❓ Unknown

---

## Section 3: Table Stakes Features

Features that EVERY competitive product in this space must have. Base this on what most competitors have marked ✅.

Format:
- **[Feature Name]:** [1-2 sentence explanation of why it's non-negotiable]

---

## Section 4: Sources & Evidence

All URLs found during research, grouped by competitor.

Format:
### [Competitor Name]
- [1-4 word description](URL)

---

## Section 5: Differentiation Opportunities

Specific, actionable opportunities for **${productName}** to stand out. Cover:

### Feature Gaps
Capabilities most or all competitors lack — potential areas to lead.

### Underserved User Segments
Personas or organizations competitors address poorly.

### Positioning Angles
Specific messaging angles where ${productName} could stand apart — name specific competitor weaknesses.

---

Search thoroughly before writing. Aim for accuracy over speed. Do not fabricate competitor information.`;
}
