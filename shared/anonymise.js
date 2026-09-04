/**
 * FreeToolsLab — anonymiser for tools that accept pasted/uploaded data.
 * Names -> C-001, C-002 ... The mapping lives in memory only (never stored, never sent).
 * Usage:
 *   const anon = createAnonymiser("C");
 *   anon.code("Acme Ltd")   // "C-001" (same input -> same code)
 *   anon.reveal("C-001")    // "Acme Ltd"  (for the "Show original" toggle)
 *   anon.size               // number of distinct labels
 */
export function createAnonymiser(prefix = "C", width = 3) {
  const forward = new Map();
  const backward = new Map();
  return {
    code(label) {
      const key = String(label ?? "").trim();
      if (!key) return "";
      if (!forward.has(key)) {
        const c = `${prefix}-${String(forward.size + 1).padStart(width, "0")}`;
        forward.set(key, c);
        backward.set(c, key);
      }
      return forward.get(key);
    },
    reveal(code) {
      return backward.get(code) ?? code;
    },
    has(label) {
      return forward.has(String(label ?? "").trim());
    },
    get size() {
      return forward.size;
    },
    clear() {
      forward.clear();
      backward.clear();
    },
  };
}
