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

function formatReport(report: SynthesisReport): string {
  const lines: string[] = [];

  lines.push(`# Competitive Intelligence Report: ${report.productName}`);
  lines.push(`*Category: ${report.category} · Generated: ${new Date(report.generatedAt).toLocaleString()}*`);
  lines.push("");

  lines.push("## Executive Summary");
  for (const bullet of report.executiveSummary) {
    lines.push(`- ${bullet}`);
  }
  lines.push("");

  lines.push("## Top Differentiators");
  for (const d of report.topDifferentiators) {
    lines.push(`### ${d.title}`);
    lines.push(d.description);
    lines.push("");
  }

  lines.push("## Table Stakes");
  lines.push("*Features every competitor in this space has — the baseline expectation:*");
  for (const f of report.tableStakes) {
    lines.push(`- ${f}`);
  }
  lines.push("");

  lines.push("## Whitespace Opportunities");
  lines.push("*Gaps where no competitor currently excels — strategic opportunities:*");
  for (const w of report.whitespaceOpportunities) {
    lines.push(`- ${w}`);
  }
  lines.push("");

  lines.push("## Feature Comparison Matrix");
  lines.push("");

  const { features, competitors } = report.comparisonTable;
  const header = `| Feature | ${competitors.map(c => c.name).join(" | ")} |`;
  const divider = `| --- | ${competitors.map(() => "---").join(" | ")} |`;
  lines.push(header);
  lines.push(divider);
  for (const feature of features) {
    const cells = competitors.map(c => {
      const val = c.values[feature] ?? "Unknown";
      if (val === "Yes") return "✅";
      if (val === "Partial") return "⚡";
      if (val === "No") return "❌";
      return "❓";
    });
    lines.push(`| ${feature} | ${cells.join(" | ")} |`);
  }
  lines.push("");
  lines.push("*✅ Yes · ⚡ Partial · ❌ No · ❓ Unknown*");
  lines.push("");

  if (report.sources.length > 0) {
    lines.push("## Sources");
    for (const s of report.sources) {
      lines.push(`- **${s.competitor}** / ${s.feature}: "${s.claim}" — [${s.url}](${s.url})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Phase 1: Discover ────────────────────────────────────────────

async function phaseDiscover(
  productName: string,
  productDescription: string,
  category: string,
  reportDir: string,
  session: SessionState
) {
  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("🔎 PHASE 1a — Discovery Agent");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const rawCompetitors = await runDiscovery(
    productName, productDescription, category,
    text => log(`  ${text}`)
  );

  writeJson(join(reportDir, "competitors-raw.json"), rawCompetitors);
  log(`\n✅ Discovery complete — found ${rawCompetitors.length} competitors\n`);

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log("🧐 PHASE 1b — Validator Agent");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const validated = await runValidator(
    productName, category, rawCompetitors,
    text => log(`  ${text}`)
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
  selectArg: string
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
    text => log(`  ${text}`)
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
    text => log(`  ${text}`)
  );

  writeJson(join(reportDir, "report.json"), report);
  writeFileSync(join(reportDir, "report.md"), formatReport(report), "utf-8");

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
  log(`📄 Full report: ${join(reportDir, "report.md")}`);
  log("   Open with: Ctrl+Shift+V in VSCode for formatted preview\n");
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const phase = require("phase") as "discover" | "analyze";
  const productName = require("name");
  const productDescription = require("description");
  const category = require("category");

  // Resolve session directory
  let reportDir: string;
  const sessionArg = getArg("session");

  if (sessionArg && existsSync(sessionArg)) {
    // Resume from existing session file
    const existing: SessionState = readJson(sessionArg);
    reportDir = join("reports", existing.slug);
    log(`\n📂 Resuming session: ${existing.slug}`);
  } else {
    // Create new session
    const slug = `${slugify(productName)}-${new Date().toISOString().slice(0, 10)}`;
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
    await phaseDiscover(productName, productDescription, category, reportDir, session);
  } else if (phase === "analyze") {
    if (session.phases.discover !== "done") {
      console.error("❌ Run --phase discover first.");
      process.exit(1);
    }
    const selectArg = getArg("select") ?? "starred";
    await phaseAnalyze(productName, productDescription, category, reportDir, session, selectArg);
  } else {
    console.error(`❌ Unknown phase: ${phase}. Use --phase discover or --phase analyze`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
