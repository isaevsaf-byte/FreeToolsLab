/**
 * payment-terms-lens — FreeToolsLab tool script.
 *
 * FORMULAS (mirror of the visible "Assumptions" block — keep both in sync):
 *   daily_spend        = spend / 365
 *   delta_days         = proposed − current
 *   cash_shift         = daily_spend × delta_days              (one-off; > 0 = supplier funds the buyer)
 *   buyer_interest     = cash_shift × buyer_rate               (+ = buyer gain)
 *   supplier_rate_eff  = scf ? buyer_rate + spread : supplier_rate
 *   supplier_interest  = cash_shift × supplier_rate_eff        (+ = supplier cost)
 *   value_leak_pa      = supplier_interest − buyer_interest    (> 0 = goes to the supplier's lender)
 *   discount_value     = spend × discount                      (buyer gain, supplier cost)
 *   buyer_net          = buyer_interest + discount_value
 *   supplier_net       = − supplier_interest − discount_value  (+ = gain)
 *   supplier_profit    = supplier_revenue × margin
 *   cost_pct_of_profit = (supplier_interest + discount_value) / supplier_profit
 *   days_of_revenue    = cash_shift / (supplier_revenue / 365)
 *   share_of_supplier  = spend / supplier_revenue
 *   fair_band          = delta_days / 365 × [buyer_rate … supplier_rate_eff]   (discount for paying on current terms)
 *
 * Option B = same inputs with its own proposed terms and discount. Perspective ("I am the supplier") changes wording only.
 * Missing data: spend + both terms are required; everything else is optional and its outputs show "n/a".
 * Simple interest, no compounding, terms assumed to hold for a full year.
 * Rates, spread and margin are ILLUSTRATIVE defaults, not benchmarks. No identifiers needed. Zero network.
 */
import { initI18n, lookup } from "../../shared/i18n.js";
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
  formatPercentLoose,
  currencySymbol,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from "../../shared/share.js";
import { initTheme, prefsQuery } from "../../shared/theme.js";
import { SITE } from "../../shared/site.js";
import bundle from "./i18n.js";

const DEFAULTS = { spend: 1200000, cur: 30, next: 60, disc: 0, br: 6, srev: 4000000, sr: 12, m: 8, spread: 1.5, next2: 45, disc2: 0 };
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
  who: params.get("who") === "supplier" ? "supplier" : "buyer",
  ccy: CURRENCIES.includes(params.get("ccy")) ? params.get("ccy") : DEFAULT_CURRENCY,
  spend: readNum("spend", null, { min: 0 }),
  cur: readNum("cur", DEFAULTS.cur, { min: 0, max: 365 }),
  next: readNum("next", DEFAULTS.next, { min: 0, max: 365 }),
  disc: readNum("disc", DEFAULTS.disc, { min: 0, max: 100 }) ?? 0,
  br: readNum("br", DEFAULTS.br, { min: 0, max: 100 }) ?? DEFAULTS.br,
  srev: readNum("srev", null, { min: 0 }),
  sr: readNum("sr", DEFAULTS.sr, { min: 0, max: 100 }) ?? DEFAULTS.sr,
  scf: params.get("scf") === "1",
  spread: readNum("spread", DEFAULTS.spread, { min: 0, max: 100 }) ?? DEFAULTS.spread,
  m: readNum("m", DEFAULTS.m, { min: 0, max: 100 }) ?? DEFAULTS.m,
  cmp: params.get("cmp") === "1",
  next2: readNum("next2", DEFAULTS.next2, { min: 0, max: 365 }),
  disc2: readNum("disc2", DEFAULTS.disc2, { min: 0, max: 100 }) ?? 0,
};
const scaled = (gbp, ccy) => Math.round((gbp * FX[ccy]) / ROUND[ccy]) * ROUND[ccy];
if (params.get("spend") === null) state.spend = scaled(DEFAULTS.spend, state.ccy);
if (params.get("srev") === null) state.srev = scaled(DEFAULTS.srev, state.ccy);
const urlState = () => ({
  ...state,
  who: state.who === "supplier" ? "supplier" : "",
  scf: state.scf ? "1" : "",
  cmp: state.cmp ? "1" : "",
  disc: state.disc || "",
  disc2: state.disc2 || "",
});
const save = () => writeParams(urlState());

/* ---------- formulas ---------- */
function compute(s, sc = { next: s.next, disc: s.disc }) {
  const ok = has(s.spend) && has(s.cur) && has(sc.next);
  const effSr = s.scf ? s.br + (s.spread || 0) : s.sr;
  const disc = sc.disc || 0;
  const dailySpend = ok ? s.spend / 365 : null;
  const deltaDays = ok ? sc.next - s.cur : null;
  const cashShift = ok ? dailySpend * deltaDays : null;
  const buyerGain = ok ? cashShift * (s.br / 100) : null;
  const supplierCost = ok ? cashShift * (effSr / 100) : null;
  const leak = ok ? supplierCost - buyerGain : null;
  const discountValue = ok ? s.spend * (disc / 100) : null;
  const buyerNet = ok ? buyerGain + discountValue : null;
  const supplierNet = ok ? -supplierCost - discountValue : null;
  const supplierTotalCost = ok ? supplierCost + discountValue : null;
  const hasRev = has(s.srev) && s.srev > 0;
  const supplierProfit = hasRev && s.m > 0 ? s.srev * (s.m / 100) : null;
  const pctOfProfit = ok && supplierProfit ? (supplierTotalCost / supplierProfit) * 100 : null;
  const daysOfRevenue = ok && hasRev ? cashShift / (s.srev / 365) : null;
  const share = hasRev && has(s.spend) ? Math.min(100, (s.spend / s.srev) * 100) : null;
  const spendExceeds = hasRev && has(s.spend) && s.spend > s.srev;
  const fairLow = ok ? (deltaDays / 365) * s.br : null;
  const fairHigh = ok ? (deltaDays / 365) * effSr : null;
  const fairShown = ok && deltaDays > 0 && effSr > s.br;
  return {
    ok, effSr, disc, dailySpend, deltaDays, cashShift, buyerGain, supplierCost, leak, discountValue, buyerNet, supplierNet,
    supplierTotalCost, supplierProfit, pctOfProfit, daysOfRevenue, share, spendExceeds, fairLow, fairHigh, fairShown,
  };
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
const shown = new Map();
function setMoney(name, value, fmt) {
  const el = out(name);
  if (!el) return;
  if (value === null) {
    shown.delete(name);
    el.textContent = tr("impact.na");
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
/** Perspective-aware translator: "I am the supplier" uses sup.* overrides where they exist. */
const tr = (key, vars) =>
  state.who === "supplier" && lookup(bundle[i18n.lang], `sup.${key}`) !== undefined ? i18n.t(`sup.${key}`, vars) : i18n.t(key, vars);
const applyLabels = () => $$("[data-i18n]").forEach((el) => (el.textContent = tr(el.getAttribute("data-i18n"))));
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
    if (el.type === "checkbox") el.checked = !!v;
    else if (el.hasAttribute("data-money")) el.value = v === null ? "" : formatNumber(v, i18n.lang);
    else el.value = v === null || v === undefined ? "" : String(v);
  });
}
$$("[data-param]").forEach((el) => {
  const key = el.dataset.param;
  el.addEventListener("input", () => {
    if (el.type === "checkbox") state[key] = el.checked;
    else if (el.hasAttribute("data-money")) state[key] = parseMoney(el.value);
    else if (el.type === "number") state[key] = el.value === "" ? null : Number(el.value);
    else if (el.type === "range") state[key] = Number(el.value) || 0;
    else state[key] = el.value;
    if (key === "ccy") {
      const prev = params.get("ccy") || DEFAULT_CURRENCY;
      for (const k of ["spend", "srev"]) if (state[k] === scaled(DEFAULTS[k], prev)) state[k] = scaled(DEFAULTS[k], state.ccy);
      params.set("ccy", state.ccy);
      fillInputs();
    }
    save();
    render();
  });
  if (el.hasAttribute("data-money")) {
    el.addEventListener("change", fillInputs);
    el.addEventListener("focus", () => el.select());
  }
});
const onChip = (sel, fn) => $$(sel).forEach((btn) => btn.addEventListener("click", () => { fn(btn); fillInputs(); save(); render(); }));
onChip("[data-preset]", (btn) => { const [a, b, d] = btn.dataset.preset.split(",").map(Number); state.cur = a; state.next = b; state.disc = d || 0; });
onChip("[data-size]", (btn) => { state.srev = scaled(Number(btn.dataset.size), state.ccy); });
onChip("[data-margin]", (btn) => { state.m = Number(btn.dataset.margin); });
onChip("[data-who]", (btn) => { state.who = btn.dataset.who; });
$("[data-panel='compare']").addEventListener("toggle", (e) => {
  if (e.target.open === state.cmp) return;
  state.cmp = e.target.open;
  save();
  render();
});
$("[data-action='more']").addEventListener("click", (e) => {
  const more = $("[data-more]");
  more.hidden = !more.hidden;
  e.currentTarget.setAttribute("aria-expanded", String(!more.hidden));
});
$("[data-action='reset']").addEventListener("click", () => {
  Object.assign(state, { spend: scaled(DEFAULTS.spend, state.ccy), cur: DEFAULTS.cur, next: DEFAULTS.next, disc: 0, br: DEFAULTS.br, srev: scaled(DEFAULTS.srev, state.ccy), sr: DEFAULTS.sr, scf: false, spread: DEFAULTS.spread, m: DEFAULTS.m, cmp: false, next2: DEFAULTS.next2, disc2: 0 });
  fillInputs();
  save();
  render();
});
$("[data-action='refine']").addEventListener("click", (e) => {
  e.preventDefault();
  const d = $("#refine");
  d.open = true;
  d.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  $("#br").focus({ preventScroll: true });
});

/* ---------- render ---------- */
const signedMoney = (n, ccy, lang) => (n < 0 ? "−" : "+") + formatMoney(Math.abs(n), ccy, lang);

function render() {
  const lang = i18n.lang;
  const t = tr;
  const A = compute(state);
  const B = state.cmp ? compute(state, { next: state.next2, disc: state.disc2 }) : null;
  const na = t("impact.na");
  const money = (n) => formatMoney(Math.abs(n), state.ccy, lang);
  const signed = (n) => signedMoney(n, state.ccy, lang);
  const moneyOrNa = (n) => (n === null ? na : money(n));
  const pct = (n, d = 1) => formatPercent(n, lang, d);
  const num = (n, d = 0) => formatNumber(n, lang, d);
  const pctLoose = (n) => formatPercentLoose(n, lang, 1);
  const toYou = A.ok && A.deltaDays > 0;
  const noChange = A.ok && A.deltaDays === 0;
  const hasDisc = A.ok && A.disc > 0;

  applyLabels();
  $$("[data-ccy-symbol]").forEach((el) => (el.textContent = currencySymbol(state.ccy, lang)));
  setText("brLabel", num(state.br, 1));
  setText("srLabel", num(state.sr, 1));
  setText("mLabel", num(state.m, 1));
  $$("[data-who]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.who === state.who)));
  $$("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === `${state.cur},${state.next},${state.disc || 0}`)));
  $$("[data-size]").forEach((b) => b.setAttribute("aria-pressed", String(state.srev === scaled(Number(b.dataset.size), state.ccy))));
  $$("[data-margin]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.margin) === state.m)));
  $$("[data-size]").forEach((b) => (b.textContent = formatNumber(scaled(Number(b.dataset.size), state.ccy) / 1e6, lang, 0) + "m"));
  $$("[data-scf-only]").forEach((el) => (el.hidden = !state.scf));
  $$("[data-disc-only]").forEach((el) => (el.hidden = !hasDisc));
  const cmpPanel = $("[data-panel='compare']");
  if (cmpPanel.open !== state.cmp) cmpPanel.open = state.cmp;
  setText("scfNote", state.scf ? t("inputs.scf_note", { br: pct(state.br, 1), spread: pct(state.spread || 0, 1), eff: pct(A.effSr, 1) }) : "");

  // headline (one number) + subline (the other side)
  let head, sub;
  if (!A.ok) [head, sub] = [t("summary.head_empty"), t("summary.sub_empty")];
  else if (noChange && !hasDisc) [head, sub] = [t("summary.head_none"), t("summary.sub_none")];
  else if (hasDisc) {
    const v = { b: num(state.next), disc: pctLoose(A.disc), yn: signed(A.buyerNet), sn: signed(A.supplierNet), yi: signed(A.buyerGain), si: signed(-A.supplierCost), d: money(A.discountValue) };
    [head, sub] = [t("summary.head_discount", v), t("summary.sub_discount", v)];
  } else {
    const v = { b: num(state.next), gain: money(A.buyerGain), cost: money(A.supplierCost), leak: money(A.leak), created: money(A.leak) };
    head = t(toYou ? "summary.head_extend" : "summary.head_shorten", v);
    sub = toYou ? t(A.leak >= 0 ? "summary.sub_extend" : "summary.sub_extend_created", v) : t(A.leak <= 0 ? "summary.sub_shorten" : "summary.sub_shorten_lost", v);
  }
  setText("headline", head);
  setText("subline", sub);

  // results
  setMoney("cash", A.cashShift, money);
  setMoney("buyer", A.buyerGain, signed);
  setMoney("supplier", A.supplierCost === null ? null : -A.supplierCost, signed);
  setText("leakLabel", t(!A.ok || A.leak >= 0 ? "results.leak" : "results.created"));
  setMoney("leak", A.leak, money);
  setText("buyerLabel", t(hasDisc ? "results.buyer_interest" : "results.buyer"));
  setText("supplierLabel", t(hasDisc ? "results.supplier_interest" : "results.supplier"));
  setMoney("discount", A.discountValue, money);
  setMoney("yourNet", A.buyerNet, signed);
  setMoney("supplierNet", A.supplierNet, signed);
  $("[data-card='buyer']").className = `stat ${!A.ok || A.buyerGain >= 0 ? "stat--go" : "stat--stop"}`;
  $("[data-card='supplier']").className = `stat ${A.ok && A.supplierCost <= 0 ? "stat--go" : "stat--stop"}`;
  $$("[data-formula]").forEach((el) => el.setAttribute("title", t(`assumptions.${el.dataset.formula}`)));

  // what we assumed, in one line (rates always; supplier line only when revenue is known)
  // timeline: day 0 → current → proposed
  const tl = { max: 1, cur: 0, next: 0 };
  if (A.ok) {
    tl.max = Math.max(state.cur, state.next, 1) * 1.08;
    tl.cur = state.cur;
    tl.next = state.next;
  }
  const px = (d) => `${(d / tl.max) * 100}%`;
  const lo = Math.min(tl.cur, tl.next);
  const hi = Math.max(tl.cur, tl.next);
  $("[data-tl='span']").style.left = px(lo);
  $("[data-tl='span']").style.width = px(hi - lo);
  $("[data-tl='t1']").style.left = px(tl.cur);
  $("[data-tl='t2']").style.left = px(tl.next);
  $("[data-tl='l1']").style.left = px(tl.cur);
  $("[data-tl='l2']").style.left = px(tl.next);
  $("[data-tl='l0']").textContent = t("visual.today");
  $("[data-tl='l1']").textContent = A.ok ? t("visual.day", { d: num(tl.cur) }) : "";
  $("[data-tl='l2']").textContent = A.ok && tl.next !== tl.cur ? t("visual.day", { d: num(tl.next) }) : "";
  $("[data-tl='l2']").classList.toggle("edge-r", tl.next / tl.max > 0.9);
  $("[data-tl='l1']").classList.toggle("edge-r", tl.cur / tl.max > 0.9);
  const warnEl = out("warnSpend");
  warnEl.textContent = A.spendExceeds ? t("impact.warn_spend") : "";
  warnEl.hidden = !A.spendExceeds;

  // fair alternative
  const fair = $("[data-panel='fair']");
  fair.dataset.shown = A.fairShown ? "1" : "0";
  setText("fairText", A.fairShown ? t("fair.text", { low: pctLoose(A.fairLow), high: pctLoose(A.fairHigh), days: num(state.cur) }) : t("fair.hidden"));
  setText("fairValue", A.fairShown ? t("fair.value", { lowMoney: money(A.buyerGain), highMoney: money(A.supplierCost) }) : "");

  // visual: butterfly. Left = you, right = supplier, one scale; nets when a discount is in play
  const vis = { title: "", whoL: "", whoR: "", valL: "", valR: "", wL: 0, wR: 0, cL: "--go", cR: "--stop", note: "", sub: "" };
  const L = !A.ok ? null : hasDisc ? A.buyerNet : A.buyerGain;
  const R = !A.ok ? null : hasDisc ? A.supplierNet : -A.supplierCost;
  vis.title = A.ok && !noChange ? t("visual.title", { days: num(Math.abs(A.deltaDays)) }) : t("visual.title_none");
  vis.whoL = `${t("visual.you")} · ${pctLoose(state.br)}${hasDisc ? ` · ${t("visual.net")}` : ""}`;
  vis.whoR = `${t("visual.supplier")} · ${pctLoose(A.effSr)}${hasDisc ? ` · ${t("visual.net")}` : ""}`;
  if (L !== null && R !== null && (L || R)) {
    const big = Math.max(Math.abs(L), Math.abs(R), 1e-9);
    vis.wL = (Math.abs(L) / big) * 100;
    vis.wR = (Math.abs(R) / big) * 100;
    vis.cL = L >= 0 ? "--go" : "--stop";
    vis.cR = R >= 0 ? "--go" : "--stop";
    vis.valL = signed(L);
    vis.valR = signed(R);
    vis.note = A.leak > 0.5 ? t("visual.note_leak", { leak: money(A.leak) }) : A.leak < -0.5 ? t("visual.note_created", { created: money(A.leak) }) : t("visual.note_even");
    if (hasDisc) vis.note = t("visual.discount_note", { disc: pctLoose(A.disc), d: money(A.discountValue) }) + " " + vis.note;
    if (A.pctOfProfit !== null) vis.sub = t("answer.supplier_line", { pct: pct(Math.abs(A.pctOfProfit)), days: num(Math.abs(A.daysOfRevenue), 0) });
  } else {
    vis.note = A.ok ? t("visual.note_none") : "";
  }
  setText("vTitle", vis.title);
  setText("flyWhoL", vis.whoL);
  setText("flyWhoR", vis.whoR);
  setText("flyValL", vis.valL);
  setText("flyValR", vis.valR);
  out("flyValL").style.color = `var(${vis.cL})`;
  out("flyValR").style.color = `var(${vis.cR})`;
  const barL = $("[data-bar='left']");
  const barR = $("[data-bar='right']");
  barL.style.width = `${vis.wL}%`;
  barL.style.background = `var(${vis.cL})`;
  barR.style.width = `${vis.wR}%`;
  barR.style.background = `var(${vis.cR})`;
  setText("flyNote", vis.note);
  setText("flySub", vis.sub);
  vis.tl = tl;
  lastVis = vis;

  // option A vs B
  if (B) {
    const termsOf = (r, next) => (r.ok ? `${num(state.cur)} → ${num(next)} ${t("impact.days_unit")}` : na);
    const cell = (r, f) => (r.ok ? f(r) : na);
    const rows = [
      ["compare.terms", termsOf(A, state.next), termsOf(B, state.next2)],
      ["compare.discount", pct(A.disc, 1), pct(B.disc, 1)],
      ["compare.cash", cell(A, (r) => signed(r.cashShift)), cell(B, (r) => signed(r.cashShift))],
      ["compare.your_interest", cell(A, (r) => signed(r.buyerGain)), cell(B, (r) => signed(r.buyerGain))],
      ["compare.discount_value", cell(A, (r) => money(r.discountValue)), cell(B, (r) => money(r.discountValue))],
      ["compare.your_net", cell(A, (r) => signed(r.buyerNet)), cell(B, (r) => signed(r.buyerNet)), A.ok && B.ok ? Math.sign(B.buyerNet - A.buyerNet) : 0],
      ["compare.supplier_interest", cell(A, (r) => signed(-r.supplierCost)), cell(B, (r) => signed(-r.supplierCost))],
      ["compare.supplier_net", cell(A, (r) => signed(r.supplierNet)), cell(B, (r) => signed(r.supplierNet)), A.ok && B.ok ? Math.sign(B.supplierNet - A.supplierNet) : 0],
      ["compare.leak", cell(A, (r) => signed(r.leak)), cell(B, (r) => signed(r.leak))],
      ["compare.pct", A.pctOfProfit === null ? na : pct(A.pctOfProfit), B.pctOfProfit === null ? na : pct(B.pctOfProfit)],
      ["compare.days", A.daysOfRevenue === null ? na : num(A.daysOfRevenue, 1), B.daysOfRevenue === null ? na : num(B.daysOfRevenue, 1)],
    ];
    out("compareBody").innerHTML = rows
      .map(([k, a, b, better]) => `<tr><td>${esc(t(k))}</td><td class="v${better < 0 ? " best" : ""}">${esc(a)}</td><td class="v${better > 0 ? " best" : ""}">${esc(b)}</td></tr>`)
      .join("");
    let verdict = "";
    if (A.ok && B.ok) {
      const dy = B.buyerNet - A.buyerNet;
      const ds = B.supplierNet - A.supplierNet;
      if (Math.abs(dy) < 0.5) verdict = t("compare.verdict_same");
      else if (dy > 0 && ds > 0) verdict = t("compare.verdict_b_both", { y: money(dy), s: money(ds) });
      else if (dy < 0 && ds < 0) verdict = t("compare.verdict_a_both", { y: money(dy), s: money(ds) });
      else verdict = t("compare.verdict_mixed", { you: dy > 0 ? "B" : "A", sup: ds > 0 ? "B" : "A", y: money(dy), s: money(ds) });
    }
    setText("compareVerdict", verdict);
  }

  // all numbers
  const rows = [
    ["table.daily_spend", A.dailySpend === null ? na : money(A.dailySpend), "f1"],
    ["table.delta_days", A.deltaDays === null ? na : `${num(A.deltaDays)} ${t("impact.days_unit")}`, "f1"],
    ["table.cash", moneyOrNa(A.cashShift), "f1"],
    ["table.buyer_rate", pct(state.br, 1), ""],
    ["table.buyer_gain", A.buyerGain === null ? na : signed(A.buyerGain), "f2"],
    ["table.supplier_rate", pct(A.effSr, 1), "f3"],
    ["table.supplier_cost", A.supplierCost === null ? na : signed(A.supplierCost), "f3"],
    ["table.leak", A.leak === null ? na : signed(A.leak), "f4"],
    ["table.discount", moneyOrNa(A.discountValue), "f9"],
    ["table.your_net", A.buyerNet === null ? na : signed(A.buyerNet), "f9"],
    ["table.supplier_net", A.supplierNet === null ? na : signed(A.supplierNet), "f9"],
    ["table.profit", moneyOrNa(A.supplierProfit), "f5"],
    ["table.pct", A.pctOfProfit === null ? na : pct(A.pctOfProfit, 2), "f6"],
    ["table.days_rev", A.daysOfRevenue === null ? na : `${num(A.daysOfRevenue, 1)} ${t("impact.days_unit")}`, "f7"],
    ["table.share", A.share === null ? na : pct(A.share, 1), ""],
    ["table.fair_low", A.fairShown ? pct(A.fairLow, 2) : na, "f8"],
    ["table.fair_high", A.fairShown ? pct(A.fairHigh, 2) : na, "f8"],
  ];
  out("tableBody").innerHTML = rows
    .map(([k, v, f]) => `<tr><td>${esc(t(k))}</td><td class="v">${esc(v)}</td><td class="f">${f ? esc(t(`assumptions.${f}`)) : ""}</td></tr>`)
    .join("");

  // feedback links
  const url = shareUrl(urlState());
  $("[data-feedback-mail]").href = `mailto:${SITE.author.email}?subject=${encodeURIComponent(t("feedback.subject"))}&body=${encodeURIComponent(t("feedback.body", { url }))}`;
  $("[data-feedback-github]").href = `${SITE.repo}/issues/new?template=tool-feedback.yml&title=${encodeURIComponent("[payment-terms-lens] ")}`;
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let lastVis = null;

/** Build the export SVG (640x260) from the last rendered butterfly. Colours stay CSS vars; downloadSvgPng resolves them. */
function visualSvg() {
  const v = lastVis;
  if (!v) return null;
  const W = 640;
  const mid = W / 2;
  const half = mid - 8;
  const wl = (v.wL / 100) * half;
  const wr = (v.wR / 100) * half;
  const wrap = (text, max) => {
    const lines = [];
    let cur = "";
    for (const word of String(text).split(" ")) {
      if ((cur + " " + word).trim().length > max && cur) {
        lines.push(cur);
        cur = word;
      } else cur = (cur + " " + word).trim();
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const noteLines = wrap(v.note, 62);
  const subLines = wrap(v.sub, 70);
  let y = 170;
  const noteSvg = noteLines.map((l) => `<text x="${mid}" y="${(y += 22)}" font-size="15" text-anchor="middle">${esc(l)}</text>`).join("");
  y += 10;
  const subSvg = subLines.map((l) => `<text x="${mid}" y="${(y += 20)}" font-size="13" fill="var(--muted)" text-anchor="middle">${esc(l)}</text>`).join("");
  const H = y + 24;
  const tlx = (d) => (d / v.tl.max) * W;
  const tlLo = Math.min(v.tl.cur, v.tl.next);
  const tlHi = Math.max(v.tl.cur, v.tl.next);
  const tlSvg = v.tl.max > 1
    ? `<rect x="0" y="40" width="${W}" height="2" fill="var(--rule-2)"/><rect x="${tlx(tlLo)}" y="37" width="${tlx(tlHi) - tlx(tlLo)}" height="8" rx="4" fill="var(--link)" opacity="0.35"/>` +
      `<rect x="${tlx(v.tl.cur) - 1}" y="34" width="2" height="14" fill="var(--ink)"/><rect x="${tlx(v.tl.next) - 1}" y="34" width="2" height="14" fill="var(--ink)"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <text x="0" y="22" font-size="20">${esc(v.title)}</text>${tlSvg}
  <text x="0" y="66" font-size="14" fill="var(--muted)">${esc(v.whoL)}</text>
  <text x="${W}" y="66" font-size="14" fill="var(--muted)" text-anchor="end">${esc(v.whoR)}</text>
  <text x="0" y="92" font-size="22" fill="var(${v.cL})">${esc(v.valL)}</text>
  <text x="${W}" y="92" font-size="22" fill="var(${v.cR})" text-anchor="end">${esc(v.valR)}</text>
  <rect x="${mid - wl}" y="110" width="${wl}" height="32" rx="2" fill="var(${v.cL})"/>
  <rect x="${mid}" y="110" width="${wr}" height="32" rx="2" fill="var(${v.cR})"/>
  <rect x="${mid - 1}" y="104" width="2" height="44" fill="var(--ink)"/>
${noteSvg}${subSvg}
</svg>`;
  return new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
}

/* ---------- actions ---------- */
function resultText() {
  const lang = i18n.lang;
  const t = tr;
  const A = compute(state);
  const money = (n) => formatMoney(Math.abs(n), state.ccy, lang);
  const signed = (n) => signedMoney(n, state.ccy, lang);
  const pct = (n, d = 1) => formatPercent(n, lang, d);
  const lines = [t("name")];
  if (!A.ok) {
    lines.push(t("summary.empty"), shareUrl(urlState()));
    return lines.join("\n");
  }
  const toYou = A.deltaDays > 0;
  const noChange = A.deltaDays === 0;
  lines.push(
    t("copy.terms", { a: formatNumber(state.cur, lang), b: formatNumber(state.next, lang), spend: money(state.spend) }),
    `${t("results.cash")}: ${money(A.cashShift)}${noChange ? "" : `, ${t(toYou ? "results.dir_to_you" : "results.dir_to_supplier", { days: formatNumber(Math.abs(A.deltaDays), lang) })}`}`,
    `${t("results.buyer")}: ${signed(A.buyerGain)} (${formatNumber(state.br, lang, 1)}%)`,
    `${t("results.supplier")}: ${signed(-A.supplierCost)} (${formatNumber(A.effSr, lang, 1)}%)` +
      (A.pctOfProfit === null ? "" : `: ${t("copy.supplier_line", { pct: pct(Math.abs(A.pctOfProfit)), days: formatNumber(Math.abs(A.daysOfRevenue), lang, 1) })}`),
    `${t(A.leak >= 0 ? "results.leak" : "results.created")}: ${money(A.leak)}`,
  );
  if (A.disc > 0) lines.push(t("copy.discount", { disc: pct(A.disc, 1), b: formatNumber(state.next, lang), d: money(A.discountValue), yn: signed(A.buyerNet), sn: signed(A.supplierNet) }));
  if (state.scf) lines.push(t("copy.scf", { eff: pct(A.effSr, 1), br: pct(state.br, 1), spread: pct(state.spread || 0, 1) }));
  if (A.fairShown) lines.push(t("copy.fair", { low: formatPercentLoose(A.fairLow, lang, 1), high: formatPercentLoose(A.fairHigh, lang, 1) }));
  if (state.cmp) {
    const B = compute(state, { next: state.next2, disc: state.disc2 });
    if (B.ok) lines.push(t("copy.option_b", { a: formatNumber(state.cur, lang), b: formatNumber(state.next2, lang), disc: pct(B.disc, 1), yn: signed(B.buyerNet), sn: signed(B.supplierNet) }));
  }
  lines.push(shareUrl(urlState()));
  return lines.join("\n");
}

function flash(key) {
  const el = out("status");
  el.textContent = tr(key);
  setTimeout(() => (el.textContent = ""), 2500);
}

$("[data-action='copy']").addEventListener("click", async () => flash((await copyText(resultText())) ? "actions.copied" : "actions.copy_failed"));
$("[data-action='link']").addEventListener("click", async () => flash((await copyText(shareUrl(urlState()))) ? "actions.link_copied" : "actions.copy_failed"));
$("[data-action='png']").addEventListener("click", async () => {
  const A = compute(state);
  const title = A.ok
    ? tr("copy.terms", { a: formatNumber(state.cur, i18n.lang), b: formatNumber(state.next, i18n.lang), spend: formatMoney(state.spend, state.ccy, i18n.lang) })
    : tr("name");
  const svg = visualSvg();
  const ok = svg && (await downloadSvgPng(svg, {
    filename: "payment-terms-lens.png",
    title,
    footer: `freetoolslab.org/tools/payment-terms-lens · ${i18n.lang === "ru" ? SITE.credit_ru : SITE.credit_en}`,
  }));
  flash(ok ? "actions.png_done" : "actions.png_failed");
});
$("[data-action='csv']").addEventListener("click", () => {
  const A = compute(state);
  const B = state.cmp ? compute(state, { next: state.next2, disc: state.disc2 }) : null;
  const f = (n) => (n === null || n === undefined ? "" : Number(n).toFixed(2));
  const block = (r, tag) => [
    [`${tag}cash_shift`, f(r.cashShift), state.ccy],
    [`${tag}buyer_interest_pa`, f(r.buyerGain), state.ccy + "/year"],
    [`${tag}supplier_interest_pa`, f(r.supplierCost), state.ccy + "/year"],
    [`${tag}value_leak_pa`, f(r.leak), state.ccy + "/year"],
    [`${tag}discount_value_pa`, f(r.discountValue), state.ccy + "/year"],
    [`${tag}buyer_net_pa`, f(r.buyerNet), state.ccy + "/year"],
    [`${tag}supplier_net_pa`, f(r.supplierNet), state.ccy + "/year"],
    [`${tag}cost_pct_of_profit`, f(r.pctOfProfit), "%"],
    [`${tag}days_of_supplier_revenue`, f(r.daysOfRevenue), "days"],
  ];
  downloadCsv("payment-terms-lens.csv", [
    ["metric", "value", "unit"],
    ["perspective", state.who, ""],
    ["spend", state.spend ?? "", state.ccy + "/year"],
    ["current_terms", state.cur ?? "", "days"],
    ["proposed_terms", state.next ?? "", "days"],
    ["discount", state.disc, "%"],
    ["buyer_rate", state.br, "% a year"],
    ["supplier_revenue", state.srev ?? "", state.ccy + "/year"],
    ["supplier_rate", state.sr, "% a year"],
    ["scf", state.scf ? 1 : 0, ""],
    ["scf_spread", state.spread, "% a year"],
    ["supplier_rate_effective", A.effSr, "% a year"],
    ["supplier_margin", state.m, "%"],
    ["supplier_profit", f(A.supplierProfit), state.ccy + "/year"],
    ["share_of_supplier_revenue", f(A.share), "%"],
    ...block(A, ""),
    ["fair_discount_low", A.fairShown ? f(A.fairLow) : "", "%"],
    ["fair_discount_high", A.fairShown ? f(A.fairHigh) : "", "%"],
    ...(B ? [["option_b_terms", state.next2 ?? "", "days"], ["option_b_discount", state.disc2, "%"], ...block(B, "option_b_")] : []),
  ]);
  flash("actions.downloaded");
});

fillInputs();
render();
document.body.dataset.ready = "1"; // Playwright waits for this
