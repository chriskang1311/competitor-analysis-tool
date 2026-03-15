export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function tavilySearch(
  query: string,
  maxResults = 6
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    console.warn(`⚠️  Tavily search failed (${response.status}) — continuing without it`);
    return [];
  }

  const data = (await response.json()) as { results: TavilyResult[] };
  return data.results ?? [];
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
  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = flat.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  return formatTavilyResults(deduped.slice(0, 12));
}
