/**
 * FreeToolsLab — shared "share" helpers.
 * State lives in the URL (settings only, never the user's data).
 * Exports leave the browser only through the user's explicit action.
 */

export const CURRENCIES = ["GBP", "USD", "EUR"];
export const DEFAULT_CURRENCY = "GBP";

/** Current URL params. */
export function readParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/** Read a number param with a default (and optional bounds). */
export function readNumber(params, key, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Merge `obj` into the URL query without reload. `undefined`/null/"" removes the key. */
export function writeParams(obj) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") url.searchParams.delete(k);
    else url.searchParams.set(k, String(v));
  }
  window.history.replaceState(window.history.state, "", url);
}

/** Absolute URL of this page with the given settings (plus current ?lang=). */
export function shareUrl(obj = {}) {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  const lang = url.searchParams.get("lang");
  url.search = "";
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  if (lang) url.searchParams.set("lang", lang);
  return url.toString();
}

/** Copy plain text. Clipboard API first, hidden textarea fallback. Resolves true on success. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Trigger a client-side download of a Blob. No network. */
export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** rows: (string|number)[][] -> CSV text (RFC 4180 quoting, CRLF). */
export function toCsv(rows) {
  const cell = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Download rows as CSV. */
export function downloadCsv(filename, rows) {
  downloadBlob(filename, new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
}

/** Download an SVG element as .svg (client-side). */
export function downloadSvg(filename, svgEl) {
  const xml = new XMLSerializer().serializeToString(svgEl);
  downloadBlob(filename, new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
}

const LOCALE = { en: "en-GB", ru: "ru-RU" };

export function formatNumber(n, lang = "en", digits = 0) {
  return new Intl.NumberFormat(LOCALE[lang] || LOCALE.en, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatMoney(n, ccy = DEFAULT_CURRENCY, lang = "en", digits = 0) {
  return new Intl.NumberFormat(LOCALE[lang] || LOCALE.en, {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatPercent(n, lang = "en", digits = 0) {
  return new Intl.NumberFormat(LOCALE[lang] || LOCALE.en, {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n / 100);
}
