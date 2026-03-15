import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { runDiscovery } from "./discover.js";
import { runDeepAnalysis } from "./analyze-deep.js";
import { runFeatureResearch } from "./research-feature.js";
import type { AuthRequest, CompetitorCard, ComparisonTable } from "./types.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"]
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// ── Auth middleware ──────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({ error: "Supabase not configured" });
    return;
  }
  const { data: { user }, error } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY).auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  const authReq = req as AuthRequest;
  authReq.user = user;
  authReq.db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  next();
}

// ── Products ─────────────────────────────────────────────────────

app.get("/products", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  // Try with nested selects first (requires FK relationships in Supabase)
  let { data, error } = await userDb
    .from("products")
    .select(`
      id, category, name, description, created_at,
      competitor_discoveries(status, updated_at),
      analyses(status, updated_at)
    `)
    .order("created_at", { ascending: true });
  // Fallback to plain select if nested relations fail
  if (error) {
    ({ data, error } = await userDb
      .from("products")
      .select("id, category, name, description, created_at")
      .order("created_at", { ascending: true }));
  }
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data });
});

app.post("/products", authenticate, async (req, res) => {
  const { db: userDb, user } = req as AuthRequest;
  const { category, name, description } = req.body as {
    category: string; name: string; description: string;
  };
  if (!category?.trim() || !name?.trim() || !description?.trim()) {
    res.status(400).json({ error: "category, name, and description are required" });
    return;
  }
  const { data, error } = await userDb
    .from("products")
    .insert({ user_id: user.id, category, name: name.trim(), description: description.trim() })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data });
});

app.patch("/products/:id", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  const { id } = req.params;
  const { name, description } = req.body as { name?: string; description?: string };
  const updates: Record<string, string> = {};
  if (name?.trim()) updates.name = name.trim();
  if (description?.trim()) updates.description = description.trim();
  if (!Object.keys(updates).length) {
    res.status(400).json({ error: "name or description required" });
    return;
  }
  const { data, error } = await userDb
    .from("products").update(updates).eq("id", id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data });
});

app.delete("/products/:id", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  const { error } = await userDb.from("products").delete().eq("id", req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

app.get("/products/:id", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  const { id } = req.params;
  const [productRes, discoveryRes, analysisRes] = await Promise.all([
    userDb.from("products").select("*").eq("id", id).single(),
    userDb.from("competitor_discoveries")
      .select("competitors, status, error_message, updated_at")
      .eq("product_id", id).maybeSingle(),
    userDb.from("analyses")
      .select("comparison_table, selected_competitor_ids, status, error_message, updated_at")
      .eq("product_id", id).maybeSingle(),
  ]);
  if (productRes.error) { res.status(404).json({ error: productRes.error.message }); return; }
  res.json({
    data: {
      product: productRes.data,
      competitors: discoveryRes.data?.competitors ?? [],
      discovery_status: discoveryRes.data?.status ?? "idle",
      discovery_updated_at: discoveryRes.data?.updated_at ?? null,
      discovery_error: discoveryRes.data?.error_message ?? null,
      analysis: analysisRes.data
        ? {
            comparison_table: analysisRes.data.comparison_table,
            selected_competitor_ids: analysisRes.data.selected_competitor_ids,
          }
        : null,
      analysis_status: analysisRes.data?.status ?? "idle",
      analysis_updated_at: analysisRes.data?.updated_at ?? null,
      analysis_error: analysisRes.data?.error_message ?? null,
    },
  });
});

// ── Competitor Discovery — Phase 1 SSE ───────────────────────────

app.post("/products/:id/discover", authenticate, async (req, res) => {
  const { db: userDb, user } = req as AuthRequest;
  const { id } = req.params;

  const { data: product, error: productError } = await userDb
    .from("products").select("name, description, category").eq("id", id).single();
  if (productError || !product) { res.status(404).json({ error: "Product not found" }); return; }

  // Mark as running immediately
  await userDb.from("competitor_discoveries").upsert(
    { product_id: id, user_id: user.id, competitors: [], status: "running", updated_at: new Date().toISOString() },
    { onConflict: "product_id" }
  );

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  let timedOut = false;

  const timeout = setTimeout(async () => {
    timedOut = true;
    await userDb.from("competitor_discoveries").update(
      { status: "error", error_message: "Timed out after 8 minutes", updated_at: new Date().toISOString() }
    ).eq("product_id", id);
    send({ type: "error", text: "Discovery timed out after 8 minutes." });
    res.write("data: [DONE]\n\n");
    res.end();
  }, 8 * 60 * 1000);

  try {
    console.log(`[server] Starting discovery for: "${product.name}"`);
    for await (const event of runDiscovery(product.name, product.description, product.category)) {
      if (timedOut) break;
      if (event.type === "result" && event.data) {
        await userDb.from("competitor_discoveries").upsert(
          { product_id: id, user_id: user.id, competitors: event.data, status: "done", updated_at: new Date().toISOString() },
          { onConflict: "product_id" }
        );
      }
      send(event);
    }
    if (!timedOut) {
      await userDb.from("competitor_discoveries").update(
        { status: "done", updated_at: new Date().toISOString() }
      ).eq("product_id", id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[server] Discovery error:", message);
    await userDb.from("competitor_discoveries").update(
      { status: "error", error_message: message, updated_at: new Date().toISOString() }
    ).eq("product_id", id);
    if (!timedOut) send({ type: "error", text: message });
  } finally {
    clearTimeout(timeout);
    if (!timedOut) { res.write("data: [DONE]\n\n"); res.end(); }
    console.log(`[server] Discovery complete for: "${product.name}"`);
  }
});

// ── Add/remove manual competitor ─────────────────────────────────

app.post("/products/:id/discover/competitor", authenticate, async (req, res) => {
  const { db: userDb, user } = req as AuthRequest;
  const { id } = req.params;
  const { name, company, website, description, targetUser, keyStrength } = req.body as {
    name: string; company: string; website: string;
    description: string; targetUser: string; keyStrength: string;
  };
  if (!name?.trim() || !company?.trim()) {
    res.status(400).json({ error: "name and company are required" });
    return;
  }

  const { data: existing } = await userDb
    .from("competitor_discoveries").select("competitors").eq("product_id", id).maybeSingle();

  const current: CompetitorCard[] = existing?.competitors ?? [];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newCompetitor: CompetitorCard = {
    id: `manual-${slug}-${Date.now()}`,
    name: name.trim(),
    company: company.trim(),
    website: website?.trim() || "",
    description: description?.trim() || "",
    targetUser: targetUser?.trim() || "",
    keyStrength: keyStrength?.trim() || "",
  };

  const updated = [...current, newCompetitor];
  const { error } = await userDb.from("competitor_discoveries").upsert(
    { product_id: id, user_id: user.id, competitors: updated, status: "done", updated_at: new Date().toISOString() },
    { onConflict: "product_id" }
  );
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data: newCompetitor });
});

app.delete("/products/:id/discover/competitor/:competitorId", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  const { id, competitorId } = req.params;
  const { data: existing } = await userDb
    .from("competitor_discoveries").select("competitors").eq("product_id", id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Discovery not found" }); return; }
  const updated = (existing.competitors as CompetitorCard[]).filter(c => c.id !== competitorId);
  const { error } = await userDb.from("competitor_discoveries")
    .update({ competitors: updated, updated_at: new Date().toISOString() }).eq("product_id", id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ── Delete discovery (keep analysis) ─────────────────────────────

app.delete("/products/:id/discovery", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  const { error } = await userDb
    .from("competitor_discoveries").delete().eq("product_id", req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ── Deep Analysis — Phase 2 SSE ──────────────────────────────────

app.post("/products/:id/analyze", authenticate, async (req, res) => {
  const { db: userDb, user } = req as AuthRequest;
  const { id } = req.params;
  const { selectedCompetitorIds } = req.body as { selectedCompetitorIds: string[] };

  if (!selectedCompetitorIds?.length) {
    res.status(400).json({ error: "selectedCompetitorIds is required" });
    return;
  }

  const [productRes, discoveryRes] = await Promise.all([
    userDb.from("products").select("name, description, category").eq("id", id).single(),
    userDb.from("competitor_discoveries").select("competitors").eq("product_id", id).maybeSingle(),
  ]);
  if (productRes.error || !productRes.data) { res.status(404).json({ error: "Product not found" }); return; }
  if (!discoveryRes.data?.competitors) { res.status(400).json({ error: "Run competitor discovery first" }); return; }

  const allCompetitors = discoveryRes.data.competitors as CompetitorCard[];
  const selected = allCompetitors.filter(c => selectedCompetitorIds.includes(c.id));
  if (!selected.length) { res.status(400).json({ error: "No matching competitors found" }); return; }

  const product = productRes.data;

  // Mark as running immediately
  await userDb.from("analyses").upsert(
    { product_id: id, user_id: user.id, selected_competitor_ids: selectedCompetitorIds, comparison_table: {}, status: "running", updated_at: new Date().toISOString() },
    { onConflict: "product_id" }
  );

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  let timedOut = false;

  const timeout = setTimeout(async () => {
    timedOut = true;
    await userDb.from("analyses").update(
      { status: "error", error_message: "Timed out after 12 minutes", updated_at: new Date().toISOString() }
    ).eq("product_id", id);
    send({ type: "error", text: "Analysis timed out after 12 minutes." });
    res.write("data: [DONE]\n\n");
    res.end();
  }, 12 * 60 * 1000);

  try {
    console.log(`[server] Starting deep analysis for: "${product.name}"`);
    for await (const event of runDeepAnalysis(product.name, product.description, product.category, selected)) {
      if (timedOut) break;
      if (event.type === "result" && event.data) {
        await userDb.from("analyses").upsert(
          { product_id: id, user_id: user.id, selected_competitor_ids: selectedCompetitorIds, comparison_table: event.data, status: "done", updated_at: new Date().toISOString() },
          { onConflict: "product_id" }
        );
      }
      send(event);
    }
    if (!timedOut) {
      await userDb.from("analyses").update(
        { status: "done", updated_at: new Date().toISOString() }
      ).eq("product_id", id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[server] Analysis error:", message);
    await userDb.from("analyses").update(
      { status: "error", error_message: message, updated_at: new Date().toISOString() }
    ).eq("product_id", id);
    if (!timedOut) send({ type: "error", text: message });
  } finally {
    clearTimeout(timeout);
    if (!timedOut) { res.write("data: [DONE]\n\n"); res.end(); }
    console.log(`[server] Deep analysis complete for: "${product.name}"`);
  }
});

// ── Update analysis cell ─────────────────────────────────────────

app.patch("/products/:id/analysis", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  const { id } = req.params;
  const { competitorName, feature, value } = req.body as {
    competitorName: string; feature: string; value: string;
  };
  if (!competitorName || !feature || value === undefined) {
    res.status(400).json({ error: "competitorName, feature, and value are required" });
    return;
  }
  const { data: existing } = await userDb
    .from("analyses").select("comparison_table").eq("product_id", id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Analysis not found" }); return; }

  const table = existing.comparison_table as ComparisonTable;
  const competitor = table.competitors.find(c => c.name === competitorName);
  if (!competitor) { res.status(404).json({ error: "Competitor not found in table" }); return; }
  competitor.values[feature] = value;

  const { error } = await userDb.from("analyses")
    .update({ comparison_table: table, updated_at: new Date().toISOString() }).eq("product_id", id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ── Add custom feature row ────────────────────────────────────────

app.post("/products/:id/analysis/feature", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  const { id } = req.params;
  const { feature } = req.body as { feature: string };
  if (!feature?.trim()) { res.status(400).json({ error: "feature is required" }); return; }

  const { data: existing } = await userDb
    .from("analyses").select("comparison_table").eq("product_id", id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Analysis not found" }); return; }

  const table = existing.comparison_table as ComparisonTable;
  if (!table.features.includes(feature.trim())) {
    table.features.push(feature.trim());
    for (const c of table.competitors) c.values[feature.trim()] = "Unknown";
  }

  const { error } = await userDb.from("analyses")
    .update({ comparison_table: table, updated_at: new Date().toISOString() }).eq("product_id", id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ data: table });
});

// ── Research specific features SSE ───────────────────────────────

app.post("/products/:id/analysis/research-feature", authenticate, async (req, res) => {
  const { db: userDb } = req as AuthRequest;
  const { id } = req.params;
  const { features } = req.body as { features: string[] };
  if (!features?.length) { res.status(400).json({ error: "features array is required" }); return; }

  const [productRes, analysisRes] = await Promise.all([
    userDb.from("products").select("name, description, category").eq("id", id).single(),
    userDb.from("analyses").select("comparison_table").eq("product_id", id).maybeSingle(),
  ]);
  if (productRes.error || !productRes.data) { res.status(404).json({ error: "Product not found" }); return; }
  if (!analysisRes.data?.comparison_table) { res.status(400).json({ error: "No analysis found" }); return; }

  const product = productRes.data;
  const existingTable = analysisRes.data.comparison_table as ComparisonTable;
  const competitors = existingTable.competitors.map(c => ({
    name: c.name, company: c.company, website: ""
  }));

  // Try to get websites from competitor_discoveries
  const { data: discoveryData } = await userDb
    .from("competitor_discoveries").select("competitors").eq("product_id", id).maybeSingle();
  if (discoveryData?.competitors) {
    const discoveredMap = new Map(
      (discoveryData.competitors as CompetitorCard[]).map(c => [c.name, c.website])
    );
    for (const c of competitors) c.website = discoveredMap.get(c.name) ?? "";
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    send({ type: "error", text: "Feature research timed out." });
    res.write("data: [DONE]\n\n");
    res.end();
  }, 8 * 60 * 1000);

  try {
    for await (const event of runFeatureResearch(
      product.name, product.description, product.category, features, competitors
    )) {
      if (timedOut) break;
      if (event.type === "result" && event.data) {
        // Merge the new feature values into the existing table
        const newData = event.data as ComparisonTable;
        for (const newFeature of newData.features) {
          if (!existingTable.features.includes(newFeature)) {
            existingTable.features.push(newFeature);
          }
          for (const newComp of newData.competitors) {
            const existing = existingTable.competitors.find(c => c.name === newComp.name);
            if (existing && newComp.values[newFeature] !== undefined) {
              existing.values[newFeature] = newComp.values[newFeature];
            }
          }
        }
        await userDb.from("analyses").update(
          { comparison_table: existingTable, updated_at: new Date().toISOString() }
        ).eq("product_id", id);
        send({ type: "result", text: "", data: existingTable });
      } else {
        send(event);
      }
    }
  } catch (err) {
    if (!timedOut) send({ type: "error", text: err instanceof Error ? err.message : String(err) });
  } finally {
    clearTimeout(timeout);
    if (!timedOut) { res.write("data: [DONE]\n\n"); res.end(); }
  }
});

app.listen(PORT, () => {
  console.log(`\nCompetitor Analysis API running at http://localhost:${PORT}\n`);
});
