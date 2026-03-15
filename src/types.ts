import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Request } from "express";

export interface SourceLink {
  url: string;
  description: string;
}

export interface CompetitorProfile {
  name: string;
  company: string;
  description: string;
  targetUser: string;
  sources: SourceLink[];
}

export interface AnalysisResult {
  productName: string;
  generatedAt: string;
  markdown: string;
}

export interface AnalysisEvent {
  type: "progress" | "result" | "error";
  text: string;
  data?: unknown;
}

export interface CompetitorCard {
  id: string;
  name: string;
  company: string;
  website: string;
  description: string;
  targetUser: string;
  keyStrength: string;
}

export interface ComparisonTable {
  features: string[];
  competitors: Array<{
    name: string;
    company: string;
    values: Record<string, string>;
  }>;
}

export interface AuthRequest extends Request {
  user: User;
  db: SupabaseClient;
}
