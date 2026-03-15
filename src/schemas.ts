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
  recommendationReason: z.string(),
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

export const CompetitorAnalysisSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string(),
  values: z.record(z.string(), z.string()),
  evidence: z.array(EvidenceSchema),
});

// ── Synthesis report ─────────────────────────────────────────────

export const SynthesisReportSchema = z.object({
  productName: z.string(),
  category: z.string(),
  generatedAt: z.string(),
  executiveSummary: z.array(z.string()),
  topDifferentiators: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })),
  tableStakes: z.array(z.string()),
  whitespaceOpportunities: z.array(z.string()),
  comparisonTable: z.object({
    features: z.array(z.string()),
    competitors: z.array(z.object({
      name: z.string(),
      company: z.string(),
      values: z.record(z.string(), z.string()),
    })),
  }),
  sources: z.array(z.object({
    competitor: z.string(),
    feature: z.string(),
    claim: z.string(),
    url: z.string(),
  })),
});

// ── Inferred types ───────────────────────────────────────────────

export type DiscoveryResult = z.infer<typeof DiscoveryResultSchema>;
export type ValidatorResult = z.infer<typeof ValidatorResultSchema>;
export type CompetitorAnalysisResult = z.infer<typeof CompetitorAnalysisSchema>;
export type SynthesisReportResult = z.infer<typeof SynthesisReportSchema>;
