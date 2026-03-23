import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { runDiscovery } from "./agents/discovery.js";
import { runValidator } from "./agents/validator.js";
import { runAllAnalyses } from "./agents/analysis.js";
import { runSynthesis } from "./agents/synthesis.js";
import type { SessionState, ValidatedCompetitor, CompetitorAnalysis, SynthesisReport } from "./types.js";

// ── CLI argument parsing ─────────────────────────────────────────

function getArg(name: string): string | undefined {
  const flag = `--${name}`;
  const args = process.argv.slice(2);
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function require(name: string): string {
  const val = getArg(name);
  if (!val) { console.error(`❌ Missing required argument: --${name}`); process.exit(1); }
  return val;
}

// ── Utilities ────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function log(msg: string) {
  console.log(msg);
}

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function formatCompetitorList(competitors: ValidatedCompetitor[]): string {
  return competitors.map((c, i) => {
    const star = c.recommended ? "★" : " ";
    const conf = c.confidence.padEnd(6);
    const reason = c.recommended ? `\n     → ${c.recommendationReason}` : "";
    return `  ${star} ${i + 1}. ${c.name} (${c.company}) [${conf}]\n     ${c.validatorNotes}${reason}`;
  }).join("\n\n");
}

type AnalysisQuality = Map<string, { evidenceCount: number; searchCoverage: "full" | "partial" | "minimal" }>;

// Human-readable labels for source types
const SOURCE_TYPE_LABELS: Record<string, string> = {
  "product-page": "Product page",
  "g2-reviews": "G2 user reviews",
  "klas-research": "KLAS Research",
  "company-overview": "Company overview",
  "news": "News / press release",
  "blog": "Blog / case study",
  "other": "Other source",
};

function statusIcon(val: string): string {
  if (val === "Yes") return "✅";
  if (val === "Partial") return "⚡";
  if (val === "No") return "❌";
  return "❓";
}

// Escape pipe characters in Markdown table cells
function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function formatReport(
  report: SynthesisReport,
  validatedCompetitors: ValidatedCompetitor[],
  analyses: CompetitorAnalysis[],
  segment?: string,
  analysisQuality?: AnalysisQuality
): string {
  const lines: string[] = [];

  const segmentLabel = segment
    ? ` — ${segment.charAt(0).toUpperCase() + segment.slice(1)} Segment`
    : "";
  lines.push(`# Competitive Product Review: ${report.productName}${segmentLabel}`);
  lines.push(`*Category: ${report.category} · Generated: ${new Date(report.generatedAt).toLocaleString()}*`);
  lines.push("");

  // ── Executive Summary (kept as preamble, not a PDF section) ────
  lines.push("## Executive Summary");
  for (const bullet of report.executiveSummary) {
    lines.push(`- ${bullet}`);
  }
  lines.push("");

  if (report.featureSelectionRationale) {
    lines.push("## Feature Selection Rationale");
    lines.push("*Why these dimensions were chosen and what was excluded:*");
    lines.push("");
    lines.push(report.featureSelectionRationale);
    lines.push("");
  }

  // ── Section 1: Competitive Products ────────────────────────────
  lines.push("## 1. Competitive Products");
  lines.push("");
  lines.push("*Direct and adjacent competitors. Focus on what each product does, not the company behind it.*");
  lines.push("");

  const segmentTag = segment
    ? ` [${segment.charAt(0).toUpperCase() + segment.slice(1)}]`
    : "";

  lines.push("| # | Product Name | Company | Product Description | Target User | How Discovered |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  validatedCompetitors.forEach((c, i) => {
    lines.push(
      `| ${i + 1} | ${escapeCell(c.name)} | ${escapeCell(c.company)}${segmentTag} | ${escapeCell(c.description)} | ${escapeCell(c.targetUser)} | AI-Assisted Research |`
    );
  });
  lines.push("");

  // ── Section 2: Feature Comparison Matrix ───────────────────────
  lines.push("## 2. Feature Comparison Matrix");
  lines.push("");
  lines.push("*✅ Supported · ⚡ Partial/Limited · ❌ Not Supported · ❓ Unknown*");
  if (analysisQuality && analysisQuality.size > 0) {
    lines.push("*🟢 Full coverage · 🟡 Partial coverage · 🔴 Minimal coverage (evidence quality per competitor)*");
  }
  lines.push("");

  // Build lookup: competitor name → analysis (for descriptions)
  const analysisByName = new Map(analyses.map(a => [a.name, a]));

  const { features, competitors } = report.comparisonTable;

  const competitorHeaders = competitors.map(c => {
    const quality = analysisQuality?.get(c.name);
    const icon = quality
      ? (quality.searchCoverage === "full" ? " 🟢" : quality.searchCoverage === "partial" ? " 🟡" : " 🔴")
      : "";
    return `${c.name}${icon}`;
  });

  lines.push(`| Feature / Capability | ${competitorHeaders.join(" | ")} |`);
  lines.push(`| --- | ${competitors.map(() => "---").join(" | ")} |`);

  for (const feature of features) {
    const cells = competitors.map(c => {
      const val = c.values[feature] ?? "Unknown";
      const icon = statusIcon(val);
      const analysis = analysisByName.get(c.name);
      const desc = analysis?.descriptions?.[feature] ?? "";
      return escapeCell(desc ? `${icon} ${desc}` : icon);
    });
    lines.push(`| ${escapeCell(feature)} | ${cells.join(" | ")} |`);
  }
  lines.push("");

  // Competitor profiles table (AI scheduling category)
  const hasProfiles = competitors.some(c => c.targetCustomerProfile || c.deploymentGTMSummary);
  if (hasProfiles) {
    lines.push("### Competitor Profiles");
    lines.push("");
    lines.push("| Competitor | Target Customer | Deployment & GTM |");
    lines.push("| --- | --- | --- |");
    for (const c of competitors) {
      lines.push(`| ${escapeCell(c.name)} | ${escapeCell(c.targetCustomerProfile ?? "—")} | ${escapeCell(c.deploymentGTMSummary ?? "—")} |`);
    }
    lines.push("");
  }

  // ── Section 3: Table-Stakes Functionality ──────────────────────
  lines.push("## 3. Table-Stakes Functionality");
  lines.push("");
  lines.push("*Capabilities customers already expect by default — failing to deliver these creates friction regardless of other strengths.*");
  lines.push("");
  lines.push("| # | Table-Stakes Feature | Why It's Expected | Supported by |");
  lines.push("| --- | --- | --- | --- |");
  report.tableStakes.forEach((ts, i) => {
    lines.push(
      `| ${i + 1} | ${escapeCell(ts.feature)} | ${escapeCell(ts.whyExpected)} | ${escapeCell(ts.supportedBy.join(", "))} |`
    );
  });
  lines.push("");

  // ── Section 4: Analysis Artifacts ─────────────────────────────
  lines.push("## 4. Analysis Artifacts");
  lines.push("");
  lines.push("*Source links gathered per competitor during the research.*");
  lines.push("");

  for (const analysis of analyses) {
    lines.push(`**${analysis.name} (${analysis.company})**`);
    lines.push("");
    if (analysis.competitorSources && analysis.competitorSources.length > 0) {
      analysis.competitorSources.forEach((src, i) => {
        const label = SOURCE_TYPE_LABELS[src.type] ?? src.type;
        lines.push(`${i + 1}. ${label}: [${src.url}](${src.url})`);
      });
    } else {
      lines.push("*No sources recorded.*");
    }
    lines.push("");
  }

  // ── Section 5: Differentiation Opportunities ──────────────────
  lines.push("## 5. Differentiation Opportunities");
  lines.push("");
  lines.push("*Areas where competitors leave gaps that our product could fill.*");
  lines.push("");
  lines.push("| # | Opportunity | Gap Description | Potential Advantage |");
  lines.push("| --- | --- | --- | --- |");
  report.differentiationOpportunities.forEach((opp, i) => {
    lines.push(
      `| ${i + 1} | ${escapeCell(opp.opportunity)} | ${escapeCell(opp.gapDescription)} | ${escapeCell(opp.advantage)} |`
    );
  });
  lines.push("");

  // ── Top Differentiators (appended for strategic context) ───────
  if (report.topDifferentiators.length > 0) {
    lines.push("## Key Market Differentiators");
    lines.push("");
    lines.push("*The most important ways competitors distinguish themselves in this market:*");
    lines.push("");
    for (const d of report.topDifferentiators) {
      lines.push(`### ${d.title}`);
      lines.push(d.description);
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Phase 1: Discover ────────────────────────────────────────────

async function phaseDiscover(
  productName: string,
  productDescription: string,
  category: string,
  reportDir: string,
  session: SessionState,
  segment?: string
) {
  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("🔎 PHASE 1a — Discovery Agent");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const rawCompetitors = await runDiscovery(
    productName, productDescription, category,
    text => log(`  ${text}`),
    segment
  );

  writeJson(join(reportDir, "competitors-raw.json"), rawCompetitors);
  log(`\n✅ Discovery complete — found ${rawCompetitors.length} competitors\n`);

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("🧐 PHASE 1b — Validator Agent");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const validated = await runValidator(
    productName, category, rawCompetitors,
    text => log(`  ${text}`),
    segment
  );

  writeJson(join(reportDir, "competitors.json"), validated);

  session.phases.discover = "done";
  writeJson(join(reportDir, "session.json"), session);

  log(`\n✅ Validation complete — ${validated.filter(c => c.recommended).length} competitors recommended\n`);

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("📋 VALIDATED COMPETITORS");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  log(formatCompetitorList(validated));
  log("\n★ = Recommended by validator\n");
  log(`📁 Full list saved to: ${join(reportDir, "competitors.json")}`);
  log("\n─────────────────────────────────────────────");
  log("➡️  NEXT STEP: Tell me which competitors to analyze deeply.");
  log('   Say "use starred" to use the recommendations, or specify numbers like "1, 3, 5, 7"');
  log("─────────────────────────────────────────────\n");
}

// ── Phase 2: Analyze ─────────────────────────────────────────────

async function phaseAnalyze(
  productName: string,
  productDescription: string,
  category: string,
  reportDir: string,
  session: SessionState,
  selectArg: string,
  segment?: string
) {
  const validated: ValidatedCompetitor[] = readJson(join(reportDir, "competitors.json"));

  // Parse selection
  let selectedCompetitors: ValidatedCompetitor[];
  if (selectArg.toLowerCase() === "all") {
    selectedCompetitors = validated;
  } else if (selectArg.toLowerCase() === "starred" || selectArg.toLowerCase() === "recommended") {
    selectedCompetitors = validated.filter(c => c.recommended);
  } else {
    const indices = selectArg.split(",").map(s => parseInt(s.trim(), 10) - 1);
    selectedCompetitors = indices.map(i => {
      if (i < 0 || i >= validated.length) {
        console.error(`❌ Invalid competitor number: ${i + 1}`); process.exit(1);
      }
      return validated[i];
    });
  }

  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(`🔬 PHASE 2a — Analysis Agents (${selectedCompetitors.length} running in parallel)`);
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  log(`Analyzing: ${selectedCompetitors.map(c => c.name).join(", ")}\n`);

  const analyses = await runAllAnalyses(
    productName, category, selectedCompetitors,
    text => log(`  ${text}`),
    segment
  );

  // Write per-competitor files
  for (const analysis of analyses) {
    writeJson(join(reportDir, `competitor-${analysis.id}.json`), analysis);
  }
  writeJson(join(reportDir, "analysis-raw.json"), analyses);

  log(`\n✅ Analysis complete — ${analyses.length} competitors analyzed\n`);

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("✍️  PHASE 2b — Synthesis Agent");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const report: SynthesisReport = await runSynthesis(
    productName, productDescription, category,
    analyses as CompetitorAnalysis[],
    selectedCompetitors,
    text => log(`  ${text}`),
    segment
  );

  const reportSuffix = segment ? `-${segment}` : "";
  const reportJsonPath = join(reportDir, `report${reportSuffix}.json`);
  const reportMdPath = join(reportDir, `report${reportSuffix}.md`);

  // Build quality map from analyses for confidence indicators in the report
  const analysisQuality: AnalysisQuality = new Map(
    analyses
      .filter(a => a.searchCoverage != null)
      .map(a => [a.name, { evidenceCount: a.evidenceCount ?? 0, searchCoverage: a.searchCoverage! }])
  );

  writeJson(reportJsonPath, report);
  writeFileSync(reportMdPath, formatReport(report, selectedCompetitors, analyses, segment, analysisQuality), "utf-8");

  session.phases.analyze = "done";
  session.selectedCompetitorIndices = selectedCompetitors.map((c) =>
    validated.findIndex(v => v.id === c.id)
  );
  writeJson(join(reportDir, "session.json"), session);

  log(`\n✅ Report complete!\n`);
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("📊 EXECUTIVE SUMMARY");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  for (const bullet of report.executiveSummary) {
    log(`  • ${bullet}`);
  }
  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("🎯 TOP DIFFERENTIATORS");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  for (const d of report.topDifferentiators) {
    log(`  ${d.title}`);
    log(`  ${d.description}\n`);
  }
  log(`📄 Full report: ${reportMdPath}`);
  log("   Open with: Ctrl+Shift+V in VSCode for formatted preview\n");
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const phase = require("phase") as "discover" | "analyze";
  const productName = require("name");
  const productDescription = require("description");
  const category = require("category");
  const segment = getArg("segment"); // optional: "enterprise" | "startup"
  const dryRun = process.argv.includes("--dry-run");

  if (dryRun) {
    log("\n📋 DRY RUN — arguments validated, no agents will run\n");
    log(`  --phase       ${phase}`);
    log(`  --name        ${productName}`);
    log(`  --description ${productDescription}`);
    log(`  --category    ${category}`);
    if (segment) log(`  --segment     ${segment}`);
    if (phase === "analyze") {
      log(`  --select      ${getArg("select") ?? "starred (default)"}`);
      const sessionFile = getArg("session");
      if (sessionFile) log(`  --session     ${sessionFile}`);
    }
    log("\n✅ All required arguments present\n");
    return;
  }

  // Resolve session directory
  let reportDir: string;
  const sessionArg = getArg("session");

  if (sessionArg && existsSync(sessionArg)) {
    // Resume from existing session file
    const existing: SessionState = readJson(sessionArg);
    reportDir = join("reports", existing.slug);
    log(`\n📂 Resuming session: ${existing.slug}`);
  } else {
    // Create new session — include segment in slug when provided
    const segmentSuffix = segment ? `-${slugify(segment)}` : "";
    const slug = `${slugify(productName)}${segmentSuffix}-${new Date().toISOString().slice(0, 10)}`;
    reportDir = join("reports", slug);
    mkdirSync(reportDir, { recursive: true });

    const session: SessionState = {
      productName,
      productDescription,
      category,
      slug,
      createdAt: new Date().toISOString(),
      phases: {},
    };
    writeJson(join(reportDir, "session.json"), session);
    log(`\n📂 New session: ${slug}`);
    if (segment) log(`🎯 Segment filter: ${segment}`);
  }

  const session: SessionState = readJson(join(reportDir, "session.json"));

  if (phase === "discover") {
    if (session.phases.discover === "done") {
      log("\n⚡ Discovery already complete. Showing saved results:\n");
      const validated: ValidatedCompetitor[] = readJson(join(reportDir, "competitors.json"));
      log(formatCompetitorList(validated));
      log("\n─────────────────────────────────────────────");
      log('➡️  Run with --phase analyze --select "1,2,3" to continue');
      log("─────────────────────────────────────────────\n");
      return;
    }
    await phaseDiscover(productName, productDescription, category, reportDir, session, segment);
  } else if (phase === "analyze") {
    if (session.phases.discover !== "done") {
      console.error("❌ Run --phase discover first.");
      process.exit(1);
    }
    const selectArg = getArg("select") ?? "starred";
    await phaseAnalyze(productName, productDescription, category, reportDir, session, selectArg, segment);
  } else {
    console.error(`❌ Unknown phase: ${phase}. Use --phase discover or --phase analyze`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
