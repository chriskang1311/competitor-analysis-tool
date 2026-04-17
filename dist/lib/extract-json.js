/**
 * Extracts valid JSON from an LLM response that may contain prose,
 * markdown code blocks, or other wrapping around the JSON object.
 *
 * Strategy:
 * 1. Strip all markdown code fences
 * 2. If the result already starts with { or [, return it
 * 3. Scan for each { or [ position; use proper string-aware boundary
 *    detection to find the matching closer; try JSON.parse on each
 *    candidate and return the first that succeeds
 * 4. Fall back to stripped text and let the caller surface the error
 */
export function extractJson(text) {
    // 1. Strip all markdown code fences (handles ```json and plain ```)
    const stripped = text
        .replace(/```(?:json)?\s*/g, "")
        .replace(/```/g, "")
        .trim();
    // 2. If already clean JSON, return immediately
    if (stripped.startsWith("{") || stripped.startsWith("[")) {
        return stripped;
    }
    // 3. Scan both the original text and stripped version for JSON boundaries
    for (const source of [text, stripped]) {
        for (let i = 0; i < source.length; i++) {
            const ch = source[i];
            if (ch !== "{" && ch !== "[")
                continue;
            const end = findJsonEnd(source, i);
            if (end === -1)
                continue;
            const candidate = source.slice(i, end + 1);
            try {
                JSON.parse(candidate);
                return candidate;
            }
            catch {
                // Not valid JSON — keep scanning
            }
        }
    }
    // 4. Return stripped and let JSON.parse surface the error at the call site
    return stripped;
}
/**
 * Finds the index of the closing bracket/brace that matches the opener
 * at `start`, correctly handling nested structures and string literals
 * (including escape sequences).
 *
 * Returns -1 if no matching closer is found.
 */
function findJsonEnd(text, start) {
    const opener = text[start];
    const closer = opener === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let i = start;
    while (i < text.length) {
        const ch = text[i];
        if (inString) {
            if (ch === "\\") {
                i += 2; // skip escaped character
                continue;
            }
            if (ch === '"')
                inString = false;
        }
        else {
            if (ch === '"') {
                inString = true;
            }
            else if (ch === opener) {
                depth++;
            }
            else if (ch === closer) {
                depth--;
                if (depth === 0)
                    return i;
            }
        }
        i++;
    }
    return -1;
}
