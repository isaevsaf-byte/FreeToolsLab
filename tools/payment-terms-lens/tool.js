/**
 * payment-terms-lens — FreeToolsLab tool script.
 *
 * FORMULAS (mirror of the visible "Assumptions" block — keep both in sync):
 *   daily_spend        = spend / 365
 *   delta_days         = proposed − current
 *   cash_shift         = daily_spend × delta_days              (one-off; > 0 = supplier funds you)
 *   buyer_gain_pa      = cash_shift × buyer_rate
 *   supplier_cost_pa   = cash_shift × supplier_rate
 *   value_leak_pa      = supplier_cost_pa − buyer_gain_pa      (> 0 = destroyed inside the pair)
 *   supplier_profit    = supplier_revenue × margin
 *   cost_pct_of_profit = supplier_cost_pa / supplier_profit
 *   days_of_revenue    = cash_shift / (supplier_revenue / 365)
 *   share_of_supplier  = spend / supplier_revenue
 *   fair_band          = delta_days / 365 × [buyer_rate … supplier_rate]   (early-payment discount)
 *
 * Simple interest, no compounding, terms assumed to hold for a full year.
 * Rates and margin are ILLUSTRATIVE defaults, not benchmarks. No identifiers needed. Zero network.
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
  formatPercent,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from "../../shared/share.js";
import { initTheme, prefsQuery } from "../../shared/theme.js";
import { SITE } from "../../shared/site.js";
import bundle from "./i18n.js";

const DEFAULTS = { spend: 1200000, cur: 30, next: 60, br: 6, srev: 4000000, sr: 12, m: 8, ccy: DEFAULT_CURRENCY };
const SYMBOL = { GBP: "£", USD: "$", EUR: "€" };

/* ---------- state (settings only; lives in the URL) ---------- */
const params = readParams();
const state = {
  spend: readNumber(params, "spend", DEFAULTS.spend, { min: 0 }),
  cur: readNumber(params, "cur", DEFAULTS.cur, { min: 0, max: 365 }),
  next: readNumber(params, "next", DEFAULTS.next, { min: 0, max: 365 }),
  br: readNumber(params, "br", DEFAULTS.br, { min: 0, max: 100 }),
  srev: readNumber(params, "srev", DEFAULTS.srev, { min: 0 }),
  sr: readNumber(params, "sr", DEFAULTS.sr, { min: 0, max: 100 }),
  m: readNumber(params, "m", DEFAULTS.m, { min: 0, max: 100 }),
  ccy: CURRENCIES.includes(params.get("ccy")) ? params.get("ccy") : DEFAULTS.ccy,
};

/* ---------- formulas ---------- */
function compute(s) {
  const dailySpend = s.spend / 365;
  const deltaDays = s.next - s.cur;
  const cashShift = dailySpend * deltaDays;
  const buyerGain = cashShift * (s.br / 100);
  const supplierCost = cashShift * (s.sr / 100);
  const leak = supplierCost - buyerGain;
  const supplierProfit = s.srev * (s.m / 100);
  const pctOfProfit = supplierProfit > 0 ? (supplierCost / supplierProfit) * 100 : null;
  const daysOfRevenue = s.srev > 0 ? cashShift / (s.srev / 365) : null;
  const share = s.srev > 0 ? Math.min(100, (s.spend / s.srev) * 100) : null;
  const spendExceeds = s.srev > 0 && s.spend > s.srev;
  const fairLow = (deltaDays / 365) * s.br; // percent
  const fairHigh = (deltaDays / 365) * s.sr;
  const fairShown = deltaDays > 0 && s.sr > s.br;
  return {
    deltaDays, cashShift, buyerGain, supplierCost, leak, supplierProfit,
    pctOfProfit, daysOfRevenue, share, spendExceeds, fairLow, fairHigh, fairShown,
  };
}

/* ---------- DOM ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const out = (name) => $(`[data-out="${name}"]`);
const setText = (name, value) => { const el = out(name); if (el) el.textContent = value; };

if (params.get("og") === "1") document.body.dataset.og = "1";

const theme = initTheme();
const i18n = initI18n(bundle);
const syncLinks = () =>
  $$("[data-prefs-link]").forEach((a) => a.setAttribute("href", a.getAttribute("href").split("?")[0] + prefsQuery(i18n.lang, theme.theme)));
theme.onChange(syncLinks);
const applySite = (lang) => {
  $$("[data-site='credit']").forEach((el) => (el.textContent = lang === "ru" ? SITE.credit_ru : SITE.credit_en));
  $$("[data-site='linkedin']").forEach((el) => (el.href = SITE.author.linkedin));
};
applySite(i18n.lang);
i18n.onChange((lang) => { applySite(lang); syncLinks(); render(); });
syncLinks();

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
  const t = i18n.t;
  const r = compute(state);
  const money = (n) => formatMoney(Math.abs(n), state.ccy, lang);
  const pct = (n, d = 1) => formatPercent(n, lang, d);
  const num = (n, d = 0) => formatNumber(n, lang, d);
  const toYou = r.deltaDays > 0;
  const noChange = r.deltaDays === 0;

  $$("[data-ccy-symbol]").forEach((el) => (el.textContent = SYMBOL[state.ccy]));
  setText("brLabel", num(state.br, 1));
  setText("srLabel", num(state.sr, 1));
  setText("mLabel", num(state.m, 1));

  // results
  setText("cash", money(r.cashShift));
  setText(
    "cashDir",
    noChange
      ? t("results.no_change")
      : t(toYou ? "results.dir_to_you" : "results.dir_to_supplier", { days: num(Math.abs(r.deltaDays)) }),
  );
  setText("buyerLabel", t(toYou || noChange ? "results.buyer_gain" : "results.buyer_cost"));
  setText("buyer", money(r.buyerGain));
  setText("supplierLabel", t(toYou || noChange ? "results.supplier_cost" : "results.supplier_gain"));
  setText("supplier", money(r.supplierCost));
  setText("leakLabel", t(r.leak >= 0 ? "results.leak" : "results.created"));
  setText("leak", money(r.leak));
  setText(
    "leakNote",
    noChange || r.leak === 0 ? t("results.no_leak_note") : t(r.leak > 0 ? "results.leak_note" : "results.created_note"),
  );
  $("[data-card='buyer']").className = `result ${toYou || noChange ? "result--go" : "result--stop"}`;
  $("[data-card='supplier']").className = `result ${toYou || noChange ? "result--stop" : "result--go"}`;

  // supplier impact
  setText("pctProfit", r.pctOfProfit === null ? t("impact.na") : pct(Math.abs(r.pctOfProfit)));
  setText("days", r.daysOfRevenue === null ? t("impact.na") : `${num(Math.abs(r.daysOfRevenue), 1)} ${t("impact.days_unit")}`);
  setText("share", r.share === null ? t("impact.na") : pct(r.share, 0));
  const warnEl = out("warnSpend");
  warnEl.textContent = r.spendExceeds ? t("impact.warn_spend") : "";
  warnEl.hidden = !r.spendExceeds;

  // what's fair
  const fair = $("[data-panel='fair']");
  fair.dataset.shown = r.fairShown ? "1" : "0";
  setText(
    "fairText",
    r.fairShown
      ? t("fair.text", { low: pct(r.fairLow, 2), high: pct(r.fairHigh, 2), days: num(state.cur) })
      : t("fair.hidden"),
  );
  setText(
    "fairValue",
    r.fairShown ? t("fair.value", { lowMoney: money(r.buyerGain), highMoney: money(r.supplierCost) }) : "",
  );

  // primary visual: two bars on one scale + supplier-profit proportion bar
  const W = 640;
  const scale = Math.max(Math.abs(r.buyerGain), Math.abs(r.supplierCost), 1);
  const buyerW = (Math.abs(r.buyerGain) / scale) * W;
  const supplierW = (Math.abs(r.supplierCost) / scale) * W;
  const biteFrac = r.pctOfProfit === null ? 0 : Math.min(1, Math.abs(r.pctOfProfit) / 100);
  const barBuyer = $("[data-bar='buyer']");
  const barSupplier = $("[data-bar='supplier']");
  const bite = $("[data-bar='bite']");
  barBuyer.setAttribute("width", String(buyerW));
  barSupplier.setAttribute("width", String(supplierW));
  bite.setAttribute("width", String(biteFrac * W));
  barBuyer.setAttribute("fill", toYou || noChange ? "var(--go)" : "var(--stop)");
  barSupplier.setAttribute("fill", toYou || noChange ? "var(--stop)" : "var(--go)");
  bite.setAttribute("fill", toYou || noChange ? "var(--stop)" : "var(--go)");
  setText("vBuyer", `${t(toYou || noChange ? "visual.buyer_gain" : "visual.buyer_cost")}: ${money(r.buyerGain)}`);
  setText("vSupplier", `${t(toYou || noChange ? "visual.supplier_cost" : "visual.supplier_gain")}: ${money(r.supplierCost)}`);
  setText(
    "vProfit",
    `${t("visual.profit")}: ${money(r.supplierProfit)}${
      r.pctOfProfit === null || noChange ? "" : ` · ${t(toYou ? "visual.bite" : "visual.added", { pct: pct(Math.abs(r.pctOfProfit)) })}`
    }`,
  );
}

/* ---------- actions ---------- */
function resultText() {
  const lang = i18n.lang;
  const t = i18n.t;
  const r = compute(state);
  const money = (n) => formatMoney(Math.abs(n), state.ccy, lang);
  const toYou = r.deltaDays > 0;
  const noChange = r.deltaDays === 0;
  const lines = [
    t("name"),
    t("copy.terms", { a: formatNumber(state.cur, lang), b: formatNumber(state.next, lang), spend: money(state.spend) }),
    `${t("results.cash")}: ${money(r.cashShift)}${noChange ? "" : `, ${t(toYou ? "results.dir_to_you" : "results.dir_to_supplier", { days: formatNumber(Math.abs(r.deltaDays), lang) })}`}`,
    `${t(toYou || noChange ? "results.buyer_gain" : "results.buyer_cost")}: ${money(r.buyerGain)} (${formatNumber(state.br, lang, 1)}%)`,
    `${t(toYou || noChange ? "results.supplier_cost" : "results.supplier_gain")}: ${money(r.supplierCost)} (${formatNumber(state.sr, lang, 1)}%)` +
      (r.pctOfProfit === null
        ? ""
        : `: ${t("copy.supplier_line", { pct: formatPercent(Math.abs(r.pctOfProfit), lang, 1), days: formatNumber(Math.abs(r.daysOfRevenue), lang, 1) })}`),
    `${t(r.leak >= 0 ? "results.leak" : "results.created")}: ${money(r.leak)}`,
  ];
  if (r.fairShown) lines.push(t("copy.fair", { low: formatPercent(r.fairLow, lang, 2), high: formatPercent(r.fairHigh, lang, 2) }));
  lines.push(shareUrl(state));
  return lines.join("\n");
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
  const r = compute(state);
  const f = (n) => (n === null ? "" : Number(n).toFixed(2));
  downloadCsv("payment-terms-lens.csv", [
    ["metric", "value", "unit"],
    ["spend", state.spend, state.ccy + "/year"],
    ["current_terms", state.cur, "days"],
    ["proposed_terms", state.next, "days"],
    ["buyer_rate", state.br, "% p.a."],
    ["supplier_revenue", state.srev, state.ccy + "/year"],
    ["supplier_rate", state.sr, "% p.a."],
    ["supplier_margin", state.m, "%"],
    ["cash_shift", f(r.cashShift), state.ccy],
    ["buyer_gain_pa", f(r.buyerGain), state.ccy + "/year"],
    ["supplier_cost_pa", f(r.supplierCost), state.ccy + "/year"],
    ["value_leak_pa", f(r.leak), state.ccy + "/year"],
    ["supplier_profit", f(r.supplierProfit), state.ccy + "/year"],
    ["cost_pct_of_profit", f(r.pctOfProfit), "%"],
    ["days_of_supplier_revenue", f(r.daysOfRevenue), "days"],
    ["share_of_supplier_revenue", f(r.share), "%"],
    ["fair_discount_low", r.fairShown ? f(r.fairLow) : "", "%"],
    ["fair_discount_high", r.fairShown ? f(r.fairHigh) : "", "%"],
  ]);
  flash("actions.downloaded");
});

render();
document.body.dataset.ready = "1"; // Playwright waits for this
