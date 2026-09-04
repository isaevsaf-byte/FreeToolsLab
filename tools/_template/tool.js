/**
 * __SLUG__ — FreeToolsLab tool script.
 *
 * FORMULAS (mirror of the visible "Assumptions" block — keep both in sync):
 *   annual = volume × unitCost
 *   after  = annual × (1 − saving / 100)
 *   delta  = annual − after
 *
 * DEFAULTS are illustrative, not benchmarks. Benchmarks must carry a source label.
 * No identifiers are needed to compute anything. Zero network requests at runtime.
 */
import { initI18n } from "../../shared/i18n.js";
import {
  readParams,
  readNumber,
  writeParams,
  shareUrl,
  copyText,
  downloadCsv,
  formatMoney,
  formatNumber,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from "../../shared/share.js";
import { SITE } from "../../shared/site.js";
import bundle from "./i18n.js";

const DEFAULTS = { volume: 1200, unitCost: 4.5, saving: 10, ccy: DEFAULT_CURRENCY };
const SYMBOL = { GBP: "£", USD: "$", EUR: "€" };

/* ---------- state (settings only; lives in the URL) ---------- */
const params = readParams();
const state = {
  volume: readNumber(params, "volume", DEFAULTS.volume, { min: 0 }),
  unitCost: readNumber(params, "unitCost", DEFAULTS.unitCost, { min: 0 }),
  saving: readNumber(params, "saving", DEFAULTS.saving, { min: 0, max: 50 }),
  ccy: CURRENCIES.includes(params.get("ccy")) ? params.get("ccy") : DEFAULTS.ccy,
};

/* ---------- formulas ---------- */
function compute({ volume, unitCost, saving }) {
  const annual = volume * unitCost;
  const after = annual * (1 - saving / 100);
  const delta = annual - after;
  return { annual, after, delta };
}

/* ---------- DOM ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const out = (name) => $(`[data-out="${name}"]`);

// OG mode: ?og=1 renders the 1200x630 card only
if (params.get("og") === "1") document.body.dataset.og = "1";

// site-wide values (credit line, LinkedIn) come from site/config.json via shared/site.js
const i18n = initI18n(bundle);
$$("[data-site='credit']").forEach((el) => (el.textContent = i18n.lang === "ru" ? SITE.credit_ru : SITE.credit_en));
$$("[data-site='linkedin']").forEach((el) => (el.href = SITE.author.linkedin));
i18n.onChange((lang) => {
  $$("[data-site='credit']").forEach((el) => (el.textContent = lang === "ru" ? SITE.credit_ru : SITE.credit_en));
  render();
});

// inputs -> state
$$("[data-param]").forEach((el) => {
  const key = el.dataset.param;
  el.value = String(state[key]);
  el.addEventListener("input", () => {
    state[key] = el.type === "number" || el.type === "range" ? Number(el.value) || 0 : el.value;
    writeParams(state);
    render();
  });
});

function render() {
  const lang = i18n.lang;
  const { annual, after, delta } = compute(state);
  const money = (n) => formatMoney(n, state.ccy, lang);

  out("annual").textContent = money(annual);
  out("after").textContent = money(after);
  out("delta").textContent = money(delta);
  out("savingLabel").textContent = formatNumber(state.saving, lang);
  $$("[data-ccy-symbol]").forEach((el) => (el.textContent = SYMBOL[state.ccy]));

  // primary visual: two bars, before (stop) vs after (go), max width 500
  const max = Math.max(annual, 1);
  $("[data-bar='before']").setAttribute("width", String(500 * (annual / max)));
  $("[data-bar='after']").setAttribute("width", String(500 * (after / max)));
  out("visualNote").textContent = i18n.t("visual.note", {
    delta: money(delta),
    pct: formatNumber(state.saving, lang),
  });
}

/* ---------- actions ---------- */
function resultText() {
  const lang = i18n.lang;
  const { annual, after, delta } = compute(state);
  const money = (n) => formatMoney(n, state.ccy, lang);
  return [
    i18n.t("name"),
    `${i18n.t("results.annual")}: ${money(annual)}`,
    `${i18n.t("results.after")}: ${money(after)}`,
    `${i18n.t("results.delta")}: ${money(delta)} (${formatNumber(state.saving, lang)}%)`,
    shareUrl(state),
  ].join("\n");
}

function flash(key) {
  const el = out("status");
  el.textContent = i18n.t(key);
  setTimeout(() => (el.textContent = ""), 2000);
}

$("[data-action='copy']").addEventListener("click", async () => {
  flash((await copyText(resultText())) ? "actions.copied" : "actions.copy_failed");
});

$("[data-action='csv']").addEventListener("click", () => {
  const { annual, after, delta } = compute(state);
  downloadCsv("__SLUG__.csv", [
    ["metric", "value", "currency"],
    ["volume", state.volume, ""],
    ["unit_cost", state.unitCost, state.ccy],
    ["saving_pct", state.saving, ""],
    ["annual", annual.toFixed(2), state.ccy],
    ["after", after.toFixed(2), state.ccy],
    ["delta", delta.toFixed(2), state.ccy],
  ]);
  flash("actions.downloaded");
});

render();
document.body.dataset.ready = "1"; // Playwright waits for this
