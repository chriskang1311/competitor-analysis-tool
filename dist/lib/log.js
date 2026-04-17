/**
 * Structured logger that prefixes messages with an agent/component label.
 * Usage: log("validator", "Searching for Competitor A…")
 */
export function log(agent, message) {
    console.log(`[${agent}] ${message}`);
}
export function warn(agent, message) {
    console.warn(`[${agent}] ⚠️  ${message}`);
}
export function error(agent, message) {
    console.error(`[${agent}] ❌ ${message}`);
}
