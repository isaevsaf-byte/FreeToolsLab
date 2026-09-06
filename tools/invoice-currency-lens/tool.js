/**
 * invoice-currency-lens — FreeToolsLab tool script.
 *
 * FORMULAS (mirror of the visible "Assumptions" block — keep both in sync):
 *   base_X      = amount_X × bank_sell_rate_X                (home currency per 1 unit of X; 1 if X is the home currency)
 *   fee_X       = base_X × fee_pct_X
 *   today_X     = base_X + fee_X
 *   move_X      = base_X × expected_move_pct_X                (user's own assumption; 0 = no view)
 *   expected_X  = base_X × (1 + move) × (1 + fee)
 *   diff        = expected_B − expected_A                     (> 0: A cheaper)
 *   flip        = dearer / cheaper − 1                        (how much the cheaper quote's currency must rise to flip)
 *   cross_sup   = amount_A / amount_B                         (supplier's implied A per 1 B)
 *   cross_bank  = rate_B / rate_A                             (your bank's A per 1 B)
 *
 * No FX feed: the rates are the ones the user types (the bank's SELL rate). Zero network. No identifiers.
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
  formatPercentLoose,
  currencySymbol,
} from "../../shared/share.js";
import { initTheme, prefsQuery } from "../../shared/theme.js";
import { SITE } from "../../shared/site.js";
import bundle from "./i18n.js";

const CCY = ["UZS", "KZT", "RUB", "USD", "EUR", "GBP", "CNY"];
// Illustrative example rates, UZS per 1 unit. Only used to pre-fill a rate when a currency changes; the user types the real bank rate.
const EXAMPLE_UZS = { UZS: 1, USD: 12650, EUR: 14800, GBP: 17100, KZT: 24, RUB: 155, CNY: 1760 };
const exampleRate = (cur, home) => (cur === home ? 1 : Number((EXAMPLE_UZS[cur] / EXAMPLE_UZS[home]).toPrecision(4)));
const DEFAULTS = { home: "UZS", days: 60, amtA: 1000000, ccyA: "KZT", amtB: 2100, ccyB: "USD", feeA: 1, feeB: 0.5, moveA: 0, moveB: 0 };

/* ---------- state ---------- */
const params = readParams();
const has = (v) => typeof v === "number" && Number.isFinite(v);
function readNum(key, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
const ccy = (key, d) => (CCY.includes(params.get(key)) ? params.get(key) : d);
const state = {
  home: ccy("home", DEFAULTS.home),
  days: readNum("days", DEFAULTS.days, { min: 0, max: 365 }),
  amtA: readNum("amtA", DEFAULTS.amtA, { min: 0 }),
  ccyA: ccy("ccyA", DEFAULTS.ccyA),
  rateA: readNum("rateA", null, { min: 0 }),
  amtB: readNum("amtB", DEFAULTS.amtB, { min: 0 }),
  ccyB: ccy("ccyB", DEFAULTS.ccyB),
  rateB: readNum("rateB", null, { min: 0 }),
  feeA: readNum("feeA", DEFAULTS.feeA, { min: 0, max: 100 }) ?? 0,
  feeB: readNum("feeB", DEFAULTS.feeB, { min: 0, max: 100 }) ?? 0,
  moveA: readNum("moveA", DEFAULTS.moveA, { min: -100, max: 1000 }) ?? 0,
  moveB: readNum("moveB", DEFAULTS.moveB, { min: -100, max: 1000 }) ?? 0,
};
if (params.get("rateA") === null) state.rateA = exampleRate(state.ccyA, state.home);
if (params.get("rateB") === null) state.rateB = exampleRate(state.ccyB, state.home);
const save = () => writeParams({ ...state, moveA: state.moveA || "", moveB: state.moveB || "" });

/* ---------- formulas ---------- */
function side(s, k) {
  const amt = s["amt" + k];
  const cur = s["ccy" + k];
  const same = cur === s.home;
  const rate = same ? 1 : s["rate" + k];
  const ok = has(amt) && has(rate) && rate > 0;
  const base = ok ? amt * rate : null;
  const fee = ok ? base * ((same ? 0 : s["fee" + k]) / 100) : null;
  const move = ok ? base * ((same ? 0 : s["move" + k]) / 100) : null;
  const today = ok ? base + fee : null;
  const expected = ok ? base * (1 + (same ? 0 : s["move" + k]) / 100) * (1 + (same ? 0 : s["fee" + k]) / 100) : null;
  return { ok, same, amt, cur, rate, base, fee, move, today, expected };
}
function compute(s) {
  const A = side(s, "A");
  const B = side(s, "B");
  const ok = A.ok && B.ok;
  const hasMove = ok && ((!A.same && s.moveA !== 0) || (!B.same && s.moveB !== 0));
  const diff = ok ? B.expected - A.expected : null; // > 0: A cheaper
  const cheaper = !ok ? null : Math.abs(diff) < 0.5 ? "same" : diff > 0 ? "A" : "B";
  const dearer = cheaper === "A" ? B.expected : A.expected;
  const cheap = cheaper === "A" ? A.expected : B.expected;
  const diffPct = ok && dearer > 0 ? (Math.abs(diff) / dearer) * 100 : null;
  const flip = ok && cheap > 0 && cheaper !== "same" ? (dearer / cheap - 1) * 100 : null;
  const sameCcy = A.cur === B.cur;
  const crossSup = ok && !sameCcy && A.amt > 0 && B.amt > 0 ? A.amt / B.amt : null; // A per 1 B
  const crossBank = ok && !sameCcy && A.rate > 0 ? B.rate / A.rate : null;
  return { ok, A, B, hasMove, diff, cheaper, diffPct, flip, sameCcy, crossSup, crossBank };
}

/* ---------- DOM ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const out = (name) => $(`[data-out="${name}"]`);
const setText = (name, value) => { const el = out(name); if (el) el.textContent = value; };
const theme = initTheme();
const i18n = initI18n(bundle);
const syncLinks = () => $$("[data-prefs-link]").forEach((a) => a.setAttribute("href", a.getAttribute("href").split("?")[0] + prefsQuery(i18n.lang, theme.theme)));
theme.onChange(syncLinks);
const applySite = (lang) => {
  $$("[data-site='credit']").forEach((el) => (el.textContent = lang === "ru" ? SITE.credit_ru : SITE.credit_en));
  $$("[data-site='linkedin']").forEach((el) => (el.href = SITE.author.linkedin));
};
applySite(i18n.lang);
i18n.onChange((lang) => { applySite(lang); syncLinks(); fillInputs(); render(); });
syncLinks();
if (params.get("og") === "1") document.body.dataset.og = "1";

const parseMoney = (v) => { const d = String(v).replace(/[^\d]/g, ""); return d ? Number(d) : null; };
function fillInputs() {
  $$("[data-param]").forEach((el) => {
    const v = state[el.dataset.param];
    if (el.hasAttribute("data-money")) el.value = v === null ? "" : formatNumber(v, i18n.lang);
    else el.value = v === null || v === undefined ? "" : String(v);
  });
}
$$("[data-param]").forEach((el) => {
  const key = el.dataset.param;
  el.addEventListener("input", () => {
    if (el.hasAttribute("data-money")) state[key] = parseMoney(el.value);
    else if (el.type === "number") state[key] = el.value === "" ? null : Number(el.value);
    else state[key] = el.value;
    // a currency changed: the old rate is meaningless, pre-fill an example rate and ask for the bank's
    if (key === "home") { state.rateA = exampleRate(state.ccyA, state.home); state.rateB = exampleRate(state.ccyB, state.home); fillInputs(); flash("inputs.rate_reset"); }
    if (key === "ccyA") { state.rateA = exampleRate(state.ccyA, state.home); fillInputs(); flash("inputs.rate_reset"); }
    if (key === "ccyB") { state.rateB = exampleRate(state.ccyB, state.home); fillInputs(); flash("inputs.rate_reset"); }
    save();
    render();
  });
  if (el.hasAttribute("data-money")) { el.addEventListener("change", fillInputs); el.addEventListener("focus", () => el.select()); }
});
$("[data-action='reset']").addEventListener("click", () => { Object.assign(state, DEFAULTS, { rateA: exampleRate(DEFAULTS.ccyA, DEFAULTS.home), rateB: exampleRate(DEFAULTS.ccyB, DEFAULTS.home) }); fillInputs(); save(); render(); });
$("[data-action='more']").addEventListener("click", (e) => { const m = $("[data-more]"); m.hidden = !m.hidden; e.currentTarget.setAttribute("aria-expanded", String(!m.hidden)); });

/* ---------- render ---------- */
let lastVis = null;
function render() {
  const lang = i18n.lang;
  const t = i18n.t;
  const r = compute(state);
  const home = state.home;
  const na = "n/a";
  const money = (n) => formatMoney(n, home, lang);
  const pct = (n) => formatPercentLoose(n, lang, 1);
  const num = (n, d = 0) => formatNumber(n, lang, d);
  const rateFmt = (n) => formatNumber(n, lang, n >= 100 ? 0 : n >= 10 ? 2 : 4);

  // labels that carry currency codes
  for (const k of ["A", "B"]) {
    const c = state["ccy" + k];
    const same = c === home;
    setText("rateLabel" + k, same ? t("inputs.same_home") : t("inputs.rate", { ccy: c }));
    setText("home" + k, same ? "" : home);
    setText("rateHint" + k, t("inputs.rate_hint", { home, ccy: c }));
    setText("feeLabel" + k, t("inputs.fee", { ccy: c }));
    setText("feeHint" + k, t("inputs.fee_hint", { ccy: c }));
    setText("moveLabel" + k, t("inputs.move", { ccy: c, home }));
    setText("moveHint" + k, t("inputs.move_hint", { ccy: c, home }));
    $("#rate" + k).disabled = same;
    setText("label" + k, t(k === "A" ? "results.cost_a" : "results.cost_b", { home }));
    setText("bLabel" + k, `${t(k === "A" ? "inputs.quote_a" : "inputs.quote_b")} · ${num(state["amt" + k] ?? 0)} ${c}`);
  }

  // headline + subline
  let head, sub;
  if (!r.ok) [head, sub] = [t("answer.head_empty"), t("answer.sub_empty")];
  else if (r.cheaper === "same") [head, sub] = [t("answer.head_same", { home }), r.hasMove ? t("answer.sub_expected", { days: num(state.days ?? 0) }) : t("answer.sub_today")];
  else {
    head = t(r.cheaper === "A" ? "answer.head_a" : "answer.head_b", { d: money(Math.abs(r.diff)), pct: pct(r.diffPct) });
    const cheapCcy = r.cheaper === "A" ? state.ccyA : state.ccyB;
    const base = r.hasMove ? t("answer.sub_expected", { days: num(state.days ?? 0) }) : t("answer.sub_today");
    sub = cheapCcy === home || r.flip === null ? base : `${base} ${t("answer.sub_flip", { ccy: cheapCcy, home, pct: pct(r.flip), days: num(state.days ?? 0) })}`;
  }
  setText("headline", head);
  setText("subline", sub);

  // tiles
  const cost = (x) => (x.ok ? money(x.expected) : na);
  setText("costA", cost(r.A));
  setText("costB", cost(r.B));
  setText("subA", r.A.ok && !r.A.same ? `${num(r.A.amt)} ${r.A.cur} × ${rateFmt(r.A.rate)}${state.feeA ? ` + ${pct(state.feeA)}` : ""}` : "");
  setText("subB", r.B.ok && !r.B.same ? `${num(r.B.amt)} ${r.B.cur} × ${rateFmt(r.B.rate)}${state.feeB ? ` + ${pct(state.feeB)}` : ""}` : "");
  $("[data-card='a']").className = `stat ${r.cheaper === "A" ? "stat--go" : r.cheaper === "B" ? "stat--stop" : ""}`;
  $("[data-card='b']").className = `stat ${r.cheaper === "B" ? "stat--go" : r.cheaper === "A" ? "stat--stop" : ""}`;
  setText("diff", r.ok ? money(Math.abs(r.diff)) : na);
  setText("diffPct", r.ok && r.diffPct !== null ? pct(r.diffPct) : "");
  setText("crossSup", r.crossSup === null ? na : rateFmt(r.crossSup));
  setText("crossBank", r.crossBank === null ? "" : `${t("results.cross_bank")}: ${rateFmt(r.crossBank)} · ${t("results.per", { a: state.ccyA, b: state.ccyB })}`);
  setText("crossLine", !r.ok ? "" : r.sameCcy ? t("answer.cross_same") : t("answer.cross", { a: state.ccyA, b: state.ccyB, sup: rateFmt(r.crossSup), bank: rateFmt(r.crossBank) }));

  // visual: two stacked bars, one scale
  setText("vTitle", t("visual.title", { home }));
  const big = Math.max(r.A.ok ? r.A.expected : 0, r.B.ok ? r.B.expected : 0, r.A.ok ? r.A.today : 0, r.B.ok ? r.B.today : 0, 1e-9);
  const vis = { title: t("visual.title", { home }), rows: [] };
  for (const [k, x, other] of [["A", r.A, r.B], ["B", r.B, r.A]]) {
    const row = { label: out("bLabel" + k).textContent, value: x.ok ? money(x.expected) : na, base: 0, fee: 0, move: 0, neg: false, flip: null, best: r.cheaper === k };
    if (x.ok) {
      row.base = (x.base / big) * 100;
      row.fee = (x.fee / big) * 100;
      row.move = (Math.abs(x.move) / big) * 100;
      row.neg = x.move < 0;
      if (row.best && other.ok && r.flip !== null) row.flip = (other.expected / big) * 100;
    }
    vis.rows.push(row);
    const seg = (n) => $(`[data-seg="${n + k}"]`);
    seg("base").style.left = "0"; seg("base").style.width = `${row.neg ? row.base - row.move : row.base}%`;
    seg("fee").style.left = `${row.neg ? row.base - row.move : row.base}%`; seg("fee").style.width = `${row.fee}%`;
    seg("move").style.left = `${row.neg ? row.base - row.move + row.fee : row.base + row.fee}%`; seg("move").style.width = `${row.move}%`;
    seg("move").classList.toggle("neg", row.neg);
    setText("bVal" + k, row.value);
    const fm = $(`[data-flip="${k.toLowerCase()}"]`);
    fm.hidden = row.flip === null;
    if (row.flip !== null) { fm.style.left = `${Math.min(99, row.flip)}%`; fm.setAttribute("data-label", t("visual.flip", { pct: pct(r.flip) })); }
    $(`[data-brow="${k.toLowerCase()}"]`).classList.toggle("best", row.best);
  }
  lastVis = vis;

  // table
  const rows = [
    ["table.base_a", r.A.ok ? money(r.A.base) : na, "f1"], ["table.fee_a", r.A.ok ? money(r.A.fee) : na, "f1"], ["table.today_a", r.A.ok ? money(r.A.today) : na, "f1"], ["table.exp_a", r.A.ok ? money(r.A.expected) : na, "f2"],
    ["table.base_b", r.B.ok ? money(r.B.base) : na, "f1"], ["table.fee_b", r.B.ok ? money(r.B.fee) : na, "f1"], ["table.today_b", r.B.ok ? money(r.B.today) : na, "f1"], ["table.exp_b", r.B.ok ? money(r.B.expected) : na, "f2"],
    ["table.diff", r.ok ? (r.diff < 0 ? "−" : "+") + money(Math.abs(r.diff)) : na, "f3"],
    ["table.flip", r.flip === null ? na : pct(r.flip), "f4"],
    ["table.cross_sup", r.crossSup === null ? na : `${rateFmt(r.crossSup)} ${t("results.per", { a: state.ccyA, b: state.ccyB })}`, "f5"],
    ["table.cross_bank", r.crossBank === null ? na : `${rateFmt(r.crossBank)} ${t("results.per", { a: state.ccyA, b: state.ccyB })}`, "f5"],
  ];
  out("tableBody").innerHTML = rows.map(([k, v, f]) => `<tr><td>${esc(t(k))}</td><td class="v">${esc(v)}</td><td class="f">${esc(t(`assumptions.${f}`))}</td></tr>`).join("");

  const url = shareUrl({ ...state });
  $("[data-feedback-mail]").href = `mailto:${SITE.author.email}?subject=${encodeURIComponent(t("feedback.subject"))}&body=${encodeURIComponent(t("feedback.body", { url }))}`;
  $("[data-feedback-github]").href = `${SITE.repo}/issues/new?template=tool-feedback.yml&title=${encodeURIComponent("[invoice-currency-lens] ")}`;
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- export SVG (same numbers as on screen) ---------- */
function visualSvg() {
  const v = lastVis;
  if (!v) return null;
  const W = 640;
  let y = 44;
  let body = `<text x="0" y="22" font-size="20">${esc(v.title)}</text>`;
  for (const row of v.rows) {
    body += `<text x="0" y="${y + 14}" font-size="15" fill="var(--muted)">${esc(row.label)}</text><text x="${W}" y="${y + 14}" font-size="15" text-anchor="end">${esc(row.value)}</text>`;
    const ty = y + 24;
    body += `<rect x="0" y="${ty}" width="${W}" height="30" fill="var(--panel-2)" stroke="var(${row.best ? "--go" : "--rule-2"})"/>`;
    const baseW = ((row.neg ? row.base - row.move : row.base) / 100) * W;
    const feeW = (row.fee / 100) * W;
    const moveW = (row.move / 100) * W;
    body += `<rect x="0" y="${ty}" width="${baseW}" height="30" fill="var(--link)"/><rect x="${baseW}" y="${ty}" width="${feeW}" height="30" fill="var(--warn)"/><rect x="${baseW + feeW}" y="${ty}" width="${moveW}" height="30" fill="var(${row.neg ? "--go" : "--stop"})"/>`;
    if (row.flip !== null) body += `<rect x="${(Math.min(99, row.flip) / 100) * W - 1}" y="${ty - 6}" width="2" height="42" fill="var(--ink)"/>`;
    y += 80;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}">${body}</svg>`;
  return new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
}

/* ---------- actions ---------- */
function resultText() {
  const lang = i18n.lang;
  const t = i18n.t;
  const r = compute(state);
  const money = (n) => formatMoney(n, state.home, lang);
  const num = (n, d = 0) => formatNumber(n, lang, d);
  const lines = [t("name")];
  if (!r.ok) { lines.push(t("answer.head_empty"), shareUrl({ ...state })); return lines.join("\n"); }
  const rateFmt = (n) => formatNumber(n, lang, n >= 100 ? 0 : n >= 10 ? 2 : 4);
  lines.push(
    t("copy.quotes", { a: `${num(state.amtA)} ${state.ccyA}`, b: `${num(state.amtB)} ${state.ccyB}`, days: num(state.days ?? 0), home: state.home }),
    t("copy.today", { a: money(r.A.today), b: money(r.B.today) }),
  );
  if (r.hasMove) lines.push(t("copy.expected", { days: num(state.days ?? 0), a: money(r.A.expected), b: money(r.B.expected) }));
  lines.push(out("headline").textContent + (out("subline").textContent ? " " + out("subline").textContent : ""));
  if (r.crossSup !== null) lines.push(t("copy.cross", { sup: rateFmt(r.crossSup), bank: rateFmt(r.crossBank), a: state.ccyA, b: state.ccyB }));
  lines.push(shareUrl({ ...state }));
  return lines.join("\n");
}
function flash(key) { const el = out("status"); el.textContent = i18n.t(key); setTimeout(() => (el.textContent = ""), 2500); }
$("[data-action='copy']").addEventListener("click", async () => flash((await copyText(resultText())) ? "actions.copied" : "actions.copy_failed"));
$("[data-action='link']").addEventListener("click", async () => flash((await copyText(shareUrl({ ...state }))) ? "actions.link_copied" : "actions.copy_failed"));
$("[data-action='png']").addEventListener("click", async () => {
  const svg = visualSvg();
  const ok = svg && (await downloadSvgPng(svg, { filename: "invoice-currency-lens.png", title: out("headline").textContent, footer: `freetoolslab.org/tools/invoice-currency-lens · ${i18n.lang === "ru" ? SITE.credit_ru : SITE.credit_en}` }));
  flash(ok ? "actions.png_done" : "actions.png_failed");
});
$("[data-action='csv']").addEventListener("click", () => {
  const r = compute(state);
  const f = (n) => (n === null || n === undefined ? "" : Number(n).toFixed(2));
  downloadCsv("invoice-currency-lens.csv", [
    ["metric", "value", "unit"],
    ["home_currency", state.home, ""], ["days", state.days ?? "", "days"],
    ["quote_a_amount", state.amtA ?? "", state.ccyA], ["quote_a_rate", state.rateA ?? "", `${state.home} per ${state.ccyA}`], ["quote_a_fee", state.feeA, "%"], ["quote_a_move", state.moveA, "%"],
    ["quote_b_amount", state.amtB ?? "", state.ccyB], ["quote_b_rate", state.rateB ?? "", `${state.home} per ${state.ccyB}`], ["quote_b_fee", state.feeB, "%"], ["quote_b_move", state.moveB, "%"],
    ["quote_a_today", f(r.A.today), state.home], ["quote_a_expected", f(r.A.expected), state.home],
    ["quote_b_today", f(r.B.today), state.home], ["quote_b_expected", f(r.B.expected), state.home],
    ["difference_b_minus_a", f(r.diff), state.home], ["cheaper", r.cheaper ?? "", ""], ["break_even_move", f(r.flip), "%"],
    ["supplier_cross_rate", f(r.crossSup), `${state.ccyA} per ${state.ccyB}`], ["bank_cross_rate", f(r.crossBank), `${state.ccyA} per ${state.ccyB}`],
  ]);
  flash("actions.downloaded");
});

fillInputs();
render();
document.body.dataset.ready = "1";
