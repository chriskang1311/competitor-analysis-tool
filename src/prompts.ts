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
