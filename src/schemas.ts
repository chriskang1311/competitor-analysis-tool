import { z } from "zod";

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

export const ComparisonTableSchema = z.object({
  features: z.array(z.string()),
  competitors: z.array(
    z.object({
      name: z.string(),
      company: z.string(),
      values: z.record(z.string(), z.string()),
    })
  ),
});

export type DiscoveryResult = z.infer<typeof DiscoveryResultSchema>;
export type ComparisonTableResult = z.infer<typeof ComparisonTableSchema>;
