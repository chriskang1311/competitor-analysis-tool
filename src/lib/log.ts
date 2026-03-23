/**
 * Structured logger that prefixes messages with an agent/component label.
 * Usage: log("validator", "Searching for Competitor A…")
 */
export function log(agent: string, message: string): void {
  console.log(`[${agent}] ${message}`);
}

export function warn(agent: string, message: string): void {
  console.warn(`[${agent}] ⚠️  ${message}`);
}

export function error(agent: string, message: string): void {
  console.error(`[${agent}] ❌ ${message}`);
}
