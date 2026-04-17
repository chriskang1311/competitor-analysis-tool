import { z } from "zod";
// ── Discovery ────────────────────────────────────────────────────
export const CompetitorCardSchema = z.object({
    id: z.string(),
    name: z.string(),
    company: z.string(),
    website: z.string(),
    description: z.string(),
    targetUser: z.string(),
    keyStrength: z.string(),
});
export const DiscoveryResultSchema = z.object({
    competitors: z.array(CompetitorCardSchema),
});
// ── Validation ───────────────────────────────────────────────────
export const ValidatedCompetitorSchema = CompetitorCardSchema.extend({
    confidence: z.enum(["High", "Medium", "Low"]),
    validatorNotes: z.string(),
    recommended: z.boolean(),
    recommendationReason: z.string().nullable().optional().transform(v => v ?? ""),
});
export const ValidatorResultSchema = z.object({
    competitors: z.array(ValidatedCompetitorSchema),
});
// ── Single-competitor analysis ───────────────────────────────────
export const EvidenceSchema = z.object({
    feature: z.string(),
    claim: z.string(),
    url: z.string(),
});
export const CompetitorSourceSchema = z.object({
    type: z.enum(["product-page", "g2-reviews", "klas-research", "company-overview", "news", "blog", "other"]),
    url: z.string(),
});
export const CompetitorAnalysisSchema = z.object({
    id: z.string(),
    name: z.string(),
    company: z.string(),
    values: z.record(z.string(), z.string()),
    descriptions: z.record(z.string(), z.string()),
    evidence: z.array(EvidenceSchema),
    competitorSources: z.array(CompetitorSourceSchema),
});
// ── Synthesis report ─────────────────────────────────────────────
export const TableStakeSchema = z.object({
    feature: z.string(),
    whyExpected: z.string(),
    supportedBy: z.array(z.string()),
});
export const DifferentiationOpportunitySchema = z.object({
    opportunity: z.string(),
    gapDescription: z.string(),
    advantage: z.string(),
});
export const SynthesisReportSchema = z.object({
    productName: z.string(),
    category: z.string(),
    generatedAt: z.string(),
    executiveSummary: z.array(z.string()),
    topDifferentiators: z.array(z.object({
        title: z.string(),
        description: z.string(),
    })),
    tableStakes: z.array(TableStakeSchema),
    differentiationOpportunities: z.array(DifferentiationOpportunitySchema),
    comparisonTable: z.object({
        features: z.array(z.string()),
        competitors: z.array(z.object({
            name: z.string(),
            company: z.string(),
            targetCustomerProfile: z.string().optional(),
            deploymentGTMSummary: z.string().optional(),
            values: z.record(z.string(), z.string()),
        })),
    }),
    sources: z.array(z.object({
        competitor: z.string(),
        feature: z.string(),
        claim: z.string(),
        url: z.string(),
    })),
    segment: z.string().optional(),
    featureSelectionRationale: z.string().optional(),
});
