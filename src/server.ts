import express from "express";
import cors from "cors";
import { runAnalysis } from "./analyze.js";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173"]
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// --- History endpoints ---

app.get("/analyses", async (_req, res) => {
  if (!db) {
    res.json({ data: [] });
    return;
  }
  const { data, error } = await db
    .from("analyses")
    .select("id, product_name, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data });
});

app.get("/analyses/:id", async (req, res) => {
  if (!db) {
    res.status(404).json({ error: "Database not configured" });
    return;
  }
  const { data, error } = await db
    .from("analyses")
    .select("id, product_name, product_description, report_markdown, competitor_count, created_at")
    .eq("id", req.params.id)
    .single();

  if (error) {
    res.status(404).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// --- Analysis SSE endpoint ---

app.post("/analyze", async (req, res) => {
  const { productName, productDescription, maxCompetitors = 5 } = req.body as {
    productName: string;
    productDescription: string;
    maxCompetitors?: number;
  };

  if (!productName?.trim() || !productDescription?.trim()) {
    res.status(400).json({ error: "productName and productDescription are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const clampedMax = Math.min(Math.max(Number(maxCompetitors), 3), 7);

  let timedOut = false;
  let reportText = "";

  const timeout = setTimeout(() => {
    timedOut = true;
    send({ type: "error", text: "Analysis timed out after 12 minutes. Try fewer competitors or a more specific description." });
    res.write("data: [DONE]\n\n");
    res.end();
  }, 12 * 60 * 1000);

  try {
    console.log(`[server] Starting analysis for: "${productName}"`);

    for await (const event of runAnalysis(productName.trim(), productDescription.trim(), clampedMax)) {
      if (timedOut) break;
      send(event);
      if (event.type === "result") reportText = event.text;
    }

    // Persist to Supabase if available
    if (!timedOut && reportText && db) {
      const { error } = await db.from("analyses").insert({
        product_name: productName.trim(),
        product_description: productDescription.trim(),
        report_markdown: reportText,
        competitor_count: clampedMax,
      });
      if (error) console.error("[server] Supabase save error:", error.message);
      else console.log(`[server] Saved analysis for: "${productName}"`);
    }
  } catch (err) {
    if (!timedOut) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[server] Analysis error:`, message);
      send({ type: "error", text: message });
    }
  } finally {
    clearTimeout(timeout);
    if (!timedOut) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
    console.log(`[server] Analysis complete for: "${productName}"`);
  }
});

app.listen(PORT, () => {
  console.log(`\nCompetitor Analysis API running at http://localhost:${PORT}\n`);
  if (!db) console.log("  [info] Supabase not configured — history disabled\n");
});
