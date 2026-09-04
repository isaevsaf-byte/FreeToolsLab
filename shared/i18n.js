/**
 * FreeToolsLab — shared i18n (EN/RU).
 * Reads `?lang=` first, then navigator.language. Never touches localStorage.
 * Usage in a tool:
 *   import { initI18n } from "../../shared/i18n.js";
 *   const i18n = initI18n(bundle);        // bundle = { en: {...}, ru: {...} }
 *   i18n.t("results.annual")              // string, or "[[key]]" if missing
 *   i18n.onChange(lang => render())       // re-render on toggle
 * Markup: <span data-i18n="key"></span>
 *         <input data-i18n-attr="placeholder:key,aria-label:other.key">
 */

export const LANGS = ["en", "ru"];
export const DEFAULT_LANG = "en";

export function isLang(x) {
  return x === "en" || x === "ru";
}

/** ?lang= first, then navigator.language. */
export function detectLang() {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const q = new URLSearchParams(window.location.search).get("lang");
  if (isLang(q)) return q;
  const nav = (navigator.language || "").toLowerCase();
  return nav.startsWith("ru") ? "ru" : "en";
}

/** Write ?lang= into the URL without a reload (settings only, never data). */
export function applyLangToUrl(lang) {
  if (typeof window === "undefined" || !isLang(lang)) return;
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState(window.history.state, "", url);
}

/** Dot-path lookup: lookup({a:{b:"x"}}, "a.b") -> "x" */
export function lookup(dict, key) {
  let cur = dict;
  for (const part of String(key).split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

/** Flatten nested keys: {a:{b:1}} -> ["a.b"]. Used by `npm run check` for RU/EN parity. */
export function flattenKeys(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") out.push(...flattenKeys(v, key));
    else out.push(key);
  }
  return out.sort();
}

/** Build a translator for one language. Falls back to EN, then to "[[key]]" (visible + greppable). */
export function makeT(bundle, lang) {
  return (key, vars) => {
    const raw = lookup(bundle[lang], key) ?? lookup(bundle[DEFAULT_LANG], key);
    if (raw === undefined) return `[[${key}]]`;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
  };
}

/** Fill every [data-i18n] / [data-i18n-attr] element under `root`. */
export function applyI18n(root, t) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    for (const pair of el.getAttribute("data-i18n-attr").split(",")) {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
}

/**
 * One call does it all: detect, translate the DOM, wire [data-lang-toggle] buttons.
 * Returns { lang, t, setLang, onChange }.
 */
export function initI18n(bundle, opts = {}) {
  const root = opts.root || document;
  const listeners = [];
  let lang = detectLang();
  let t = makeT(bundle, lang);

  const render = () => {
    document.documentElement.lang = lang;
    applyI18n(root, t);
    root.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      const next = lang === "en" ? "RU" : "EN";
      btn.textContent = next;
      // accessible name must contain the visible text (WCAG 2.5.3)
      btn.setAttribute("aria-label", `${next} · ${lang === "en" ? "Переключить на русский" : "Switch to English"}`);
    });
    listeners.forEach((fn) => fn(lang, t));
  };

  const api = {
    get lang() {
      return lang;
    },
    t: (key, vars) => t(key, vars),
    setLang(next) {
      if (!isLang(next) || next === lang) return;
      lang = next;
      t = makeT(bundle, lang);
      applyLangToUrl(lang);
      render();
    },
    onChange(fn) {
      listeners.push(fn);
      return () => listeners.splice(listeners.indexOf(fn), 1);
    },
  };

  root.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => api.setLang(lang === "en" ? "ru" : "en"));
  });

  render();
  return api;
}
