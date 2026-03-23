export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// ── In-memory result cache ────────────────────────────────────────

const cache = new Map<string, TavilyResult[]>();

function cacheKey(query: string, days?: number): string {
  return `${query}::${days ?? "none"}`;
}

// ── Concurrency limiter (max 3 parallel Tavily calls) ─────────────

const MAX_CONCURRENT = 3;
let activeCalls = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeCalls < MAX_CONCURRENT) {
    activeCalls++;
    return Promise.resolve();
  }
  return new Promise(resolve => waitQueue.push(resolve));
}

function releaseSlot(): void {
  activeCalls--;
  const next = waitQueue.shift();
  if (next) {
    activeCalls++;
    next();
  }
}

// ── Core search ───────────────────────────────────────────────────

export async function tavilySearch(
  query: string,
  maxResults = 6,
  days?: number
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const key = cacheKey(query, days);
  const cached = cache.get(key);
  if (cached) return cached;

  await acquireSlot();

  try {
    const body: Record<string, unknown> = {
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false,
    };
    if (days) body.days = days;

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn(`⚠️  Tavily search failed (${response.status}) — continuing without it`);
      return [];
    }

    const data = (await response.json()) as { results: TavilyResult[] };
    const results = data.results ?? [];
    cache.set(key, results);
    return results;
  } finally {
    releaseSlot();
  }
}

export function formatTavilyResults(results: TavilyResult[]): string {
  if (results.length === 0) return "";
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 600)}`)
    .join("\n\n---\n\n");
}

export async function tavilyMultiSearch(
  queries: string[],
  maxResultsEach = 5
): Promise<string> {
  const allResults = await Promise.all(
    queries.map(q => tavilySearch(q, maxResultsEach))
  );
  const flat = allResults.flat().sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const deduped = flat.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  return formatTavilyResults(deduped.slice(0, 12));
}

/**
 * Two-tier search: runs `recentQueries` with a 90-day recency filter to capture
 * fresh news/events, and `evergreenQueries` without any date filter to capture
 * historical product info, reviews, and rankings. Results are merged and deduped.
 *
 * Results are cached in memory — repeated calls for the same queries are free.
 * Concurrency is capped at 3 simultaneous Tavily API calls to avoid rate limits.
 */
export async function tavilyTieredSearch(
  recentQueries: string[],
  evergreenQueries: string[],
  maxResultsEach = 5
): Promise<string> {
  const [recentResults, evergreenResults] = await Promise.all([
    Promise.all(recentQueries.map(q => tavilySearch(q, maxResultsEach, 90))),
    Promise.all(evergreenQueries.map(q => tavilySearch(q, maxResultsEach))),
  ]);

  const flat = [...recentResults.flat(), ...evergreenResults.flat()]
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const deduped = flat.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  return formatTavilyResults(deduped.slice(0, 20));
}
