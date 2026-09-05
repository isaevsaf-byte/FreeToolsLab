/**
 * FreeToolsLab — light/dark theme. Light is the default; ?theme=dark switches.
 * No localStorage: the choice travels in the URL like every other setting.
 * Markup: <button data-theme-toggle> … <span class="when-light">Dark</span><span class="when-dark">Light</span></button>
 */
export const THEMES = ["light", "dark"];
export const DEFAULT_THEME = "light";

export const isTheme = (x) => x === "light" || x === "dark";

export function detectTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const q = new URLSearchParams(window.location.search).get("theme");
  return isTheme(q) ? q : DEFAULT_THEME;
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}

/** Write ?theme= into the URL (removed when light, to keep URLs clean). */
export function applyThemeToUrl(theme) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (theme === "dark") url.searchParams.set("theme", "dark");
  else url.searchParams.delete("theme");
  window.history.replaceState(window.history.state, "", url);
}

/** Query string carrying the current non-default prefs, e.g. "?lang=ru&theme=dark" or "". */
export function prefsQuery(lang, theme) {
  const p = new URLSearchParams();
  if (lang && lang !== "en") p.set("lang", lang);
  if (theme === "dark") p.set("theme", "dark");
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function initTheme(opts = {}) {
  const root = opts.root || document;
  const listeners = [];
  let theme = detectTheme();
  applyTheme(theme);
  const api = {
    get theme() {
      return theme;
    },
    setTheme(next) {
      if (!isTheme(next) || next === theme) return;
      theme = next;
      applyTheme(theme);
      applyThemeToUrl(theme);
      listeners.forEach((fn) => fn(theme));
    },
    toggle() {
      api.setTheme(theme === "dark" ? "light" : "dark");
    },
    onChange(fn) {
      listeners.push(fn);
      return () => listeners.splice(listeners.indexOf(fn), 1);
    },
  };
  root.querySelectorAll("[data-theme-toggle]").forEach((btn) => btn.addEventListener("click", api.toggle));
  return api;
}
