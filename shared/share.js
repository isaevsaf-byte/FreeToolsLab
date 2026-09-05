/**
 * FreeToolsLab — shared "share" helpers.
 * State lives in the URL (settings only, never the user's data).
 * Exports leave the browser only through the user's explicit action.
 */

export const CURRENCIES = ["GBP", "USD", "EUR", "CNY", "RUB", "UZS"];
export const DEFAULT_CURRENCY = "GBP";

/** Short symbol for input units. UZS has no glyph: "so'm" / "сум". */
export function currencySymbol(ccy, lang = "en") {
  const map = { GBP: "£", USD: "$", EUR: "€", CNY: "¥", RUB: "₽", UZS: lang === "ru" ? "сум" : "so'm" };
  return map[ccy] || ccy;
}

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

/** Percent with up to `maxDigits` decimals and no trailing zeros: 0.49 -> "0.5%", 1.0 -> "1%". */
export function formatPercentLoose(n, lang = "en", maxDigits = 1) {
  return new Intl.NumberFormat(LOCALE[lang] || LOCALE.en, { style: "percent", maximumFractionDigits: maxDigits }).format(n / 100);
}

export function formatPercent(n, lang = "en", digits = 0) {
  return new Intl.NumberFormat(LOCALE[lang] || LOCALE.en, {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n / 100);
}

export const escapeXml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Replace var(--x) in fill/stroke/style attributes with the document's computed values. */
function inlineCssVars(root) {
  const cs = getComputedStyle(document.documentElement);
  const fix = (v) => v.replace(/var\((--[\w-]+)\)/g, (_, name) => cs.getPropertyValue(name).trim() || "#000");
  root.querySelectorAll("*").forEach((n) => {
    for (const attr of ["fill", "stroke"]) {
      const v = n.getAttribute(attr);
      if (v && v.includes("var(")) n.setAttribute(attr, fix(v));
    }
    const st = n.getAttribute("style");
    if (st && st.includes("var(")) n.setAttribute("style", fix(st));
  });
}

/**
 * Download an SVG element as a PNG, rendered client-side on a canvas (no network).
 * Adds the page background, an optional title line and footer line. Colours follow the current theme.
 */
export async function downloadSvgPng(svgEl, { filename = "chart.png", title = "", footer = "", scale = 2 } = {}) {
  const vbAttr = (svgEl.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
  const w = (vbAttr.length === 4 && vbAttr[2]) || svgEl.viewBox?.baseVal?.width || svgEl.clientWidth || 640;
  const h = (vbAttr.length === 4 && vbAttr[3]) || svgEl.viewBox?.baseVal?.height || svgEl.clientHeight || 330;
  const pad = 32;
  const titleH = title ? 40 : 0;
  const footH = footer ? 28 : 0;
  const W = w + pad * 2;
  const H = h + pad * 2 + titleH + footH;
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fb) => cs.getPropertyValue(name).trim() || fb;
  const bg = v("--bg", "#fff");
  const ink = v("--ink", "#000");
  const muted = v("--muted", "#666");
  const font = "ui-monospace, Menlo, Consolas, monospace";
  const clone = svgEl.cloneNode(true);
  inlineCssVars(clone);
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  clone.setAttribute("x", String(pad));
  clone.setAttribute("y", String(pad + titleH));
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  clone.querySelectorAll("text").forEach((t) => {
    if (!t.getAttribute("fill")) t.setAttribute("fill", ink);
    t.setAttribute("font-family", font);
  });
  const outer =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${bg}"/>` +
    (title ? `<text x="${pad}" y="${pad + 18}" font-family="${font}" font-size="18" fill="${ink}">${escapeXml(title)}</text>` : "") +
    new XMLSerializer().serializeToString(clone) +
    (footer ? `<text x="${pad}" y="${H - pad + 10}" font-family="${font}" font-size="12" fill="${muted}">${escapeXml(footer)}</text>` : "") +
    `</svg>`;
  const url = URL.createObjectURL(new Blob([outer], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    const png = await new Promise((res) => canvas.toBlob(res, "image/png"));
    downloadBlob(filename, png);
    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}
