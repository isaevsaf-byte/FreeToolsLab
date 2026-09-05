/**
 * payment-terms-lens — FreeToolsLab tool script.
 *
 * FORMULAS (mirror of the visible "Assumptions" block — keep both in sync):
 *   daily_spend        = spend / 365
 *   delta_days         = proposed − current
 *   cash_shift         = daily_spend × delta_days              (one-off; > 0 = supplier funds you)
 *   buyer_gain_pa      = cash_shift × buyer_rate
 *   supplier_cost_pa   = cash_shift × supplier_rate
 *   value_leak_pa      = supplier_cost_pa − buyer_gain_pa      (> 0 = goes to the supplier's lender)
 *   supplier_profit    = supplier_revenue × margin
 *   cost_pct_of_profit = supplier_cost_pa / supplier_profit
 *   days_of_revenue    = cash_shift / (supplier_revenue / 365)
 *   share_of_supplier  = spend / supplier_revenue
 *   fair_band          = delta_days / 365 × [buyer_rate … supplier_rate]   (discount for paying on current terms)
 *
 * Missing data: spend + both terms are required; everything else is optional and its outputs show "n/a".
 * Simple interest, no compounding, terms assumed to hold for a full year.
 * Rates and margin are ILLUSTRATIVE defaults, not benchmarks. No identifiers needed. Zero network.
 */
import { initI18n } from "../../shared/i18n.js";
import {
  readParams,
  writeParams,
  shareUrl,
  copyText,
  downloadCsv,
  downloadSvgPng,
  formatMoney,
  formatNumber,
  formatPercent,
  currencySymbol,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from "../../shared/share.js";
import { initTheme, prefsQuery } from "../../shared/theme.js";
import { SITE } from "../../shared/site.js";
import bundle from "./i18n.js";

const DEFAULTS = { spend: 1200000, cur: 30, next: 60, br: 6, srev: 4000000, sr: 12, m: 8, ccy: DEFAULT_CURRENCY };
// Rough rates vs GBP, used ONLY to keep the illustrative defaults sensible when the currency changes. Not a benchmark.
const FX = { GBP: 1, USD: 1.3, EUR: 1.15, CNY: 9.2, RUB: 105, UZS: 16000 };
const ROUND = { GBP: 1000, USD: 1000, EUR: 1000, CNY: 10000, RUB: 100000, UZS: 1000000 };

/* ---------- state (settings only; lives in the URL). null = unknown ---------- */
const params = readParams();
const has = (v) => typeof v === "number" && Number.isFinite(v);
function readNum(key, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
const state = {
  ccy: CURRENCIES.includes(params.get("ccy")) ? params.get("ccy") : DEFAULTS.ccy,
  spend: readNum("spend", null, { min: 0 }),
  cur: readNum("cur", DEFAULTS.cur, { min: 0, max: 365 }),
  next: readNum("next", DEFAULTS.next, { min: 0, max: 365 }),
  br: readNum("br", DEFAULTS.br, { min: 0, max: 100 }) ?? DEFAULTS.br,
  srev: readNum("srev", null, { min: 0 }),
  sr: readNum("sr", DEFAULTS.sr, { min: 0, max: 100 }) ?? DEFAULTS.sr,
  m: readNum("m", DEFAULTS.m, { min: 0, max: 100 }) ?? DEFAULTS.m,
};
const scaled = (gbp, ccy) => Math.round((gbp * FX[ccy]) / ROUND[ccy]) * ROUND[ccy];
if (params.get("spend") === null) state.spend = scaled(DEFAULTS.spend, state.ccy);
if (params.get("srev") === null) state.srev = scaled(DEFAULTS.srev, state.ccy);

/* ---------- formulas ---------- */
function compute(s) {
  const ok = has(s.spend) && has(s.cur) && has(s.next);
  const dailySpend = ok ? s.spend / 365 : null;
  const deltaDays = ok ? s.next - s.cur : null;
  const cashShift = ok ? dailySpend * deltaDays : null;
  const buyerGain = ok ? cashShift * (s.br / 100) : null;
  const supplierCost = ok ? cashShift * (s.sr / 100) : null;
  const leak = ok ? supplierCost - buyerGain : null;
  const hasRev = has(s.srev) && s.srev > 0;
  const supplierProfit = hasRev && s.m > 0 ? s.srev * (s.m / 100) : null;
  const pctOfProfit = ok && supplierProfit ? (supplierCost / supplierProfit) * 100 : null;
  const daysOfRevenue = ok && hasRev ? cashShift / (s.srev / 365) : null;
  const share = hasRev && has(s.spend) ? Math.min(100, (s.spend / s.srev) * 100) : null;
  const spendExceeds = hasRev && has(s.spend) && s.spend > s.srev;
  const fairLow = ok ? (deltaDays / 365) * s.br : null;
  const fairHigh = ok ? (deltaDays / 365) * s.sr : null;
  const fairShown = ok && deltaDays > 0 && s.sr > s.br;
  return { ok, dailySpend, deltaDays, cashShift, buyerGain, supplierCost, leak, supplierProfit, pctOfProfit, daysOfRevenue, share, spendExceeds, fairLow, fairHigh, fairShown };
}

/* ---------- DOM helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const out = (name) => $(`[data-out="${name}"]`);
const setText = (name, value) => {
  const el = out(name);
  if (el) el.textContent = value;
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const shown = new Map(); // last numeric value per animated output
function setMoney(name, value, fmt) {
  const el = out(name);
  if (!el) return;
  if (value === null) {
    shown.delete(name);
    el.textContent = i18n.t("impact.na");
    return;
  }
  const from = shown.get(name);
  shown.set(name, value);
  if (reducedMotion || from === undefined || from === value) {
    el.textContent = fmt(value);
    return;
  }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 280);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (value - from) * e);
    if (k < 1 && shown.get(name) === value) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

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
i18n.onChange((lang) => {
  applySite(lang);
  syncLinks();
  fillInputs();
  render();
});
syncLinks();

/* ---------- inputs ---------- */
const parseMoney = (v) => {
  const digits = String(v).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
};
function fillInputs() {
  $$("[data-param]").forEach((el) => {
    const key = el.dataset.param;
    const v = state[key];
    if (el.hasAttribute("data-money")) el.value = v === null ? "" : formatNumber(v, i18n.lang);
    else el.value = v === null ? "" : String(v);
  });
}
$$("[data-param]").forEach((el) => {
  const key = el.dataset.param;
  el.addEventListener("input", () => {
    if (el.hasAttribute("data-money")) state[key] = parseMoney(el.value);
    else if (el.type === "number") state[key] = el.value === "" ? null : Number(el.value);
    else if (el.type === "range") state[key] = Number(el.value) || 0;
    else state[key] = el.value;
    if (key === "ccy") {
      // keep the illustrative defaults sensible in the new currency (only if the user has not typed their own)
      const prev = params.get("ccy") || DEFAULTS.ccy;
      for (const k of ["spend", "srev"]) if (state[k] === scaled(DEFAULTS[k], prev)) state[k] = scaled(DEFAULTS[k], state.ccy);
      params.set("ccy", state.ccy);
      fillInputs();
    }
    writeParams(state);
    render();
  });
  if (el.hasAttribute("data-money")) el.addEventListener("change", fillInputs); // regroup digits on blur
});
$$("[data-preset]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const [a, b] = btn.dataset.preset.split(",").map(Number);
    state.cur = a;
    state.next = b;
    fillInputs();
    writeParams(state);
    render();
  }),
);
$$("[data-size]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.srev = scaled(Number(btn.dataset.size), state.ccy);
    fillInputs();
    writeParams(state);
    render();
  }),
);
$$("[data-margin]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.m = Number(btn.dataset.margin);
    fillInputs();
    writeParams(state);
    render();
  }),
);

/* ---------- render ---------- */
function render() {
  const lang = i18n.lang;
  const t = i18n.t;
  const r = compute(state);
  const na = t("impact.na");
  const money = (n) => formatMoney(Math.abs(n), state.ccy, lang);
  const moneyOrNa = (n) => (n === null ? na : money(n));
  const pct = (n, d = 1) => formatPercent(n, lang, d);
  const num = (n, d = 0) => formatNumber(n, lang, d);
  const toYou = r.ok && r.deltaDays > 0;
  const noChange = r.ok && r.deltaDays === 0;
  const gainSide = toYou || noChange || !r.ok; // wording: you gain / supplier pays

  $$("[data-ccy-symbol]").forEach((el) => (el.textContent = currencySymbol(state.ccy, lang)));
  setText("brLabel", num(state.br, 1));
  setText("srLabel", num(state.sr, 1));
  setText("mLabel", num(state.m, 1));
  $$("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === `${state.cur},${state.next}`)));
  $$("[data-size]").forEach((b) => b.setAttribute("aria-pressed", String(state.srev === scaled(Number(b.dataset.size), state.ccy))));
  $$("[data-margin]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.margin) === state.m)));
  $$("[data-size]").forEach((b) => (b.textContent = formatNumber(scaled(Number(b.dataset.size), state.ccy) / 1e6, lang, 0) + "m"));

  // summary sentence
  let summary;
  if (!r.ok) summary = t("summary.empty");
  else if (noChange) summary = t("summary.none");
  else {
    const vars = {
      a: num(state.cur), b: num(state.next), cash: money(r.cashShift), gain: money(r.buyerGain), cost: money(r.supplierCost),
      leak: money(r.leak), created: money(r.leak),
    };
    summary = t(toYou ? (r.leak >= 0 ? "summary.extend" : "summary.extend_created") : r.leak <= 0 ? "summary.shorten" : "summary.shorten_lost", vars);
  }
  setText("summary", summary);

  // results
  setMoney("cash", r.cashShift, money);
  setText("cashDir", !r.ok ? "" : noChange ? t("results.no_change") : t(toYou ? "results.dir_to_you" : "results.dir_to_supplier", { days: num(Math.abs(r.deltaDays)) }));
  setText("buyerLabel", t(gainSide ? "results.buyer_gain" : "results.buyer_cost"));
  setMoney("buyer", r.buyerGain, money);
  setText("supplierLabel", t(gainSide ? "results.supplier_cost" : "results.supplier_gain"));
  setMoney("supplier", r.supplierCost, money);
  setText("leakLabel", t(!r.ok || r.leak >= 0 ? "results.leak" : "results.created"));
  setMoney("leak", r.leak, money);
  setText("leakNote", !r.ok || noChange || r.leak === 0 ? (r.ok ? t("results.no_leak_note") : "") : t(r.leak > 0 ? "results.leak_note" : "results.created_note"));
  $("[data-card='buyer']").className = `result ${gainSide ? "result--go" : "result--stop"}`;
  $("[data-card='supplier']").className = `result ${gainSide ? "result--stop" : "result--go"}`;
  $$("[data-formula]").forEach((el) => el.setAttribute("title", t(`assumptions.${el.dataset.formula}`)));

  // supplier impact
  setText("pctProfit", r.pctOfProfit === null ? na : pct(Math.abs(r.pctOfProfit)));
  setText("days", r.daysOfRevenue === null ? na : `${num(Math.abs(r.daysOfRevenue), 1)} ${t("impact.days_unit")}`);
  setText("share", r.share === null ? na : pct(r.share, 0));
  const warnEl = out("warnSpend");
  warnEl.textContent = r.spendExceeds ? t("impact.warn_spend") : "";
  warnEl.hidden = !r.spendExceeds;

  // fair alternative
  const fair = $("[data-panel='fair']");
  fair.dataset.shown = r.fairShown ? "1" : "0";
  setText("fairText", r.fairShown ? t("fair.text", { low: pct(r.fairLow, 2), high: pct(r.fairHigh, 2), days: num(state.cur) }) : t("fair.hidden"));
  setText("fairValue", r.fairShown ? t("fair.value", { lowMoney: money(r.buyerGain), highMoney: money(r.supplierCost) }) : "");

  // visual: where the money goes
  const W = 640;
  const cashBar = $("[data-bar='cash']");
  const arrowR = $("[data-arrow='right']");
  const arrowL = $("[data-arrow='left']");
  if (!r.ok || noChange) {
    setText("vCash", r.ok ? t("visual.cash_none") : t("summary.empty"));
    cashBar.setAttribute("width", "0");
    arrowR.setAttribute("visibility", "hidden");
    arrowL.setAttribute("visibility", "hidden");
  } else {
    setText("vCash", t(toYou ? "visual.cash_to_you" : "visual.cash_to_supplier", { cash: money(r.cashShift), days: num(Math.abs(r.deltaDays)) }));
    cashBar.setAttribute("x", toYou ? "0" : "28");
    cashBar.setAttribute("width", "612");
    arrowR.setAttribute("visibility", toYou ? "visible" : "hidden");
    arrowL.setAttribute("visibility", toYou ? "hidden" : "visible");
  }
  const segA = $("[data-bar='segA']");
  const segB = $("[data-bar='segB']");
  if (!r.ok || noChange) {
    setText("vHead", "");
    setText("vA", "");
    setText("vB", "");
    segA.setAttribute("width", "0");
    segB.setAttribute("width", "0");
  } else {
    // the bigger side is the whole bar; the smaller side is segment A; the difference is segment B
    const g = Math.abs(r.buyerGain);
    const c = Math.abs(r.supplierCost);
    const big = Math.max(g, c, 1e-9);
    const a = Math.min(g, c);
    const b = big - a;
    let k; // 1: supplier pays, part reaches you · 2: you gain, supplier pays part · 3: supplier gains, you pay part · 4: you pay, supplier gains part
    if (toYou) k = r.leak >= 0 ? 1 : 2;
    else k = r.leak <= 0 ? 3 : 4;
    const aColor = k === 1 || k === 3 ? "var(--go)" : "var(--stop)";
    const bColor = k === 1 || k === 4 ? "var(--stop)" : "var(--go)";
    // for cases 3 and 4 the "small side" is what you pay; keep the reading left-to-right: A first, then B
    segA.setAttribute("width", String((a / big) * W));
    segA.setAttribute("fill", aColor);
    segB.setAttribute("x", String((a / big) * W));
    segB.setAttribute("width", String((b / big) * W));
    segB.setAttribute("fill", bColor);
    setText("vHead", t(`visual.head${k}`, { big: money(big) }));
    setText("vA", t(`visual.a${k}`, { a: money(a) }));
    setText("vB", b > 0.5 ? t(`visual.b${k}`, { b: money(b) }) : "");
    out("vA").setAttribute("fill", aColor);
    out("vB").setAttribute("fill", bColor);
  }
  const bite = $("[data-bar='bite']");
  if (r.supplierProfit === null || !r.ok || noChange) {
    setText("vProfit", r.supplierProfit === null ? t("visual.profit_na") : t("table.profit") + ": " + money(r.supplierProfit));
    bite.setAttribute("width", "0");
  } else {
    setText("vProfit", t(toYou ? "visual.profit" : "visual.profit_added", { profit: money(r.supplierProfit), pct: pct(Math.abs(r.pctOfProfit)), days: num(Math.abs(r.daysOfRevenue), 1) }));
    bite.setAttribute("width", String(Math.min(1, Math.abs(r.pctOfProfit) / 100) * W));
    bite.setAttribute("fill", toYou ? "var(--stop)" : "var(--go)");
  }
  setText("vProfitNote", r.supplierProfit === null ? "" : `${t("table.profit")} = ${t("assumptions.f5").split("=")[1].trim()}`);

  // all numbers
  const rows = [
    ["table.daily_spend", r.dailySpend === null ? na : money(r.dailySpend), "f1"],
    ["table.delta_days", r.deltaDays === null ? na : `${num(r.deltaDays)} ${t("impact.days_unit")}`, "f1"],
    ["table.cash", moneyOrNa(r.cashShift), "f1"],
    ["table.buyer_rate", pct(state.br, 1), ""],
    ["table.buyer_gain", r.buyerGain === null ? na : signed(r.buyerGain, money), "f2"],
    ["table.supplier_rate", pct(state.sr, 1), ""],
    ["table.supplier_cost", r.supplierCost === null ? na : signed(r.supplierCost, money), "f3"],
    ["table.leak", r.leak === null ? na : signed(r.leak, money), "f4"],
    ["table.profit", moneyOrNa(r.supplierProfit), "f5"],
    ["table.pct", r.pctOfProfit === null ? na : pct(r.pctOfProfit, 2), "f6"],
    ["table.days_rev", r.daysOfRevenue === null ? na : `${num(r.daysOfRevenue, 1)} ${t("impact.days_unit")}`, "f7"],
    ["table.share", r.share === null ? na : pct(r.share, 1), ""],
    ["table.fair_low", r.fairShown ? pct(r.fairLow, 2) : na, "f8"],
    ["table.fair_high", r.fairShown ? pct(r.fairHigh, 2) : na, "f8"],
  ];
  out("tableBody").innerHTML = rows
    .map(([k, v, f]) => `<tr><td>${esc(t(k))}</td><td class="v">${esc(v)}</td><td class="f">${f ? esc(t(`assumptions.${f}`)) : ""}</td></tr>`)
    .join("");

  // feedback links (mailto with settings link; GitHub issue form)
  const url = shareUrl(state);
  const mail = $("[data-feedback-mail]");
  mail.href = `mailto:${SITE.author.email}?subject=${encodeURIComponent(t("feedback.subject"))}&body=${encodeURIComponent(t("feedback.body", { url }))}`;
  $("[data-feedback-github]").href = `${SITE.repo}/issues/new?template=tool-feedback.yml&title=${encodeURIComponent("[payment-terms-lens] ")}`;
}
const signed = (n, fmt) => (n < 0 ? "−" : "+") + fmt(n);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- actions ---------- */
function resultText() {
  const lang = i18n.lang;
  const t = i18n.t;
  const r = compute(state);
  const money = (n) => formatMoney(Math.abs(n), state.ccy, lang);
  const lines = [t("name")];
  if (!r.ok) {
    lines.push(t("summary.empty"), shareUrl(state));
    return lines.join("\n");
  }
  const toYou = r.deltaDays > 0;
  const noChange = r.deltaDays === 0;
  lines.push(
    t("copy.terms", { a: formatNumber(state.cur, lang), b: formatNumber(state.next, lang), spend: money(state.spend) }),
    `${t("results.cash")}: ${money(r.cashShift)}${noChange ? "" : `, ${t(toYou ? "results.dir_to_you" : "results.dir_to_supplier", { days: formatNumber(Math.abs(r.deltaDays), lang) })}`}`,
    `${t(toYou || noChange ? "results.buyer_gain" : "results.buyer_cost")}: ${money(r.buyerGain)} (${formatNumber(state.br, lang, 1)}%)`,
    `${t(toYou || noChange ? "results.supplier_cost" : "results.supplier_gain")}: ${money(r.supplierCost)} (${formatNumber(state.sr, lang, 1)}%)` +
      (r.pctOfProfit === null ? "" : `: ${t("copy.supplier_line", { pct: formatPercent(Math.abs(r.pctOfProfit), lang, 1), days: formatNumber(Math.abs(r.daysOfRevenue), lang, 1) })}`),
    `${t(r.leak >= 0 ? "results.leak" : "results.created")}: ${money(r.leak)}`,
  );
  if (r.fairShown) lines.push(t("copy.fair", { low: formatPercent(r.fairLow, lang, 2), high: formatPercent(r.fairHigh, lang, 2) }));
  lines.push(shareUrl(state));
  return lines.join("\n");
}

function flash(key) {
  const el = out("status");
  el.textContent = i18n.t(key);
  setTimeout(() => (el.textContent = ""), 2500);
}

$("[data-action='copy']").addEventListener("click", async () => flash((await copyText(resultText())) ? "actions.copied" : "actions.copy_failed"));
$("[data-action='link']").addEventListener("click", async () => flash((await copyText(shareUrl(state))) ? "actions.link_copied" : "actions.copy_failed"));
$("[data-action='png']").addEventListener("click", async () => {
  const r = compute(state);
  const title = r.ok
    ? `${i18n.t("name")}: ${i18n.t("copy.terms", { a: formatNumber(state.cur, i18n.lang), b: formatNumber(state.next, i18n.lang), spend: formatMoney(state.spend, state.ccy, i18n.lang) })}`
    : i18n.t("name");
  const ok = await downloadSvgPng($(".visual"), {
    filename: "payment-terms-lens.png",
    title,
    footer: `freetoolslab.org/tools/payment-terms-lens · ${i18n.lang === "ru" ? SITE.credit_ru : SITE.credit_en}`,
  });
  flash(ok ? "actions.png_done" : "actions.png_failed");
});
$("[data-action='csv']").addEventListener("click", () => {
  const r = compute(state);
  const f = (n) => (n === null ? "" : Number(n).toFixed(2));
  downloadCsv("payment-terms-lens.csv", [
    ["metric", "value", "unit"],
    ["spend", state.spend ?? "", state.ccy + "/year"],
    ["current_terms", state.cur ?? "", "days"],
    ["proposed_terms", state.next ?? "", "days"],
    ["buyer_rate", state.br, "% a year"],
    ["supplier_revenue", state.srev ?? "", state.ccy + "/year"],
    ["supplier_rate", state.sr, "% a year"],
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

fillInputs();
render();
document.body.dataset.ready = "1"; // Playwright waits for this
