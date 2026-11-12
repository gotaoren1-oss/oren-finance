// FALILO FINANCE · המלצות אנליסטים ויעדי מחיר (Yahoo Finance, ללא תשלום)
// שולף קונצנזוס, יעד מחיר ושדרוגים/הורדות אחרונים. אם Yahoo חוסם, המקור מסומן כלא זמין והניתוח ממשיך בלעדיו.
const raw = x => (x && typeof x === 'object' ? x.raw : x);
const num = x => { const v = raw(x); return v == null || v === '' || isNaN(+v) ? null : +v; };
export const KEY_HE = { strong_buy: 'קנייה חזקה', buy: 'קנייה', hold: 'החזקה', underperform: 'ביצועי חסר', sell: 'מכירה', strong_sell: 'מכירה חזקה' };
export function labelFromMean(m) { return m == null ? null : m <= 1.8 ? 'קנייה חזקה' : m <= 2.5 ? 'קנייה' : m <= 3.5 ? 'החזקה' : m <= 4.2 ? 'מכירה' : 'מכירה חזקה'; }

// מנתח את התשובה של quoteSummary (פונקציה טהורה, נבדקת עם נתוני דמה)
export function parseSummary(j, price, now = Date.now()) {
  const r = j?.quoteSummary?.result?.[0]; if (!r) return null; const fd = r.financialData || {}, tr = r.recommendationTrend?.trend?.[0] || null;
  const mean = num(fd.recommendationMean), n = num(fd.numberOfAnalystOpinions), target = num(fd.targetMeanPrice), cur = price ?? num(fd.currentPrice);
  if (mean == null && target == null && !tr) return null;
  const ch = (r.upgradeDowngradeHistory?.history || []).filter(h => h.epochGradeDate && now / 1000 - h.epochGradeDate <= 14 * 86400 && /up|down|init|main|reit/i.test(h.action || '')).slice(0, 4)
    .map(h => ({ firm: h.firm, from: h.fromGrade || '', to: h.toGrade || '', action: /up/i.test(h.action) ? 'שדרוג' : /down/i.test(h.action) ? 'הורדה' : /init/i.test(h.action) ? 'פתיחת כיסוי' : 'אישור מחדש', date: new Date(h.epochGradeDate * 1000).toISOString().slice(0, 10) }));
  const out = { mean, label: labelFromMean(mean) || KEY_HE[fd.recommendationKey] || null, n, target, high: num(fd.targetHighPrice), low: num(fd.targetLowPrice), median: num(fd.targetMedianPrice),
    upside: target != null && cur ? (target / cur - 1) * 100 : null, trend: tr ? { sb: tr.strongBuy, b: tr.buy, h: tr.hold, s: tr.sell, ss: tr.strongSell } : null, changes: ch };
  out.stance = out.label == null && out.upside == null ? null : (mean != null && mean <= 2.5 && (out.upside == null || out.upside >= 5)) ? 'pos' : ((mean != null && mean >= 3.5) || (out.upside != null && out.upside < 0)) ? 'neg' : 'mid';
  if (n != null && n < 3) out.stance = 'mid'; // מעט אנליסטים: לא מכריעים
  return out;
}

async function session(T) {
  const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' };
  try {
    const r = await fetch('https://fc.yahoo.com', { headers: UA, redirect: 'manual', signal: AbortSignal.timeout(10000) }), cookie = (r.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
    const c = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', { headers: { ...UA, Cookie: cookie }, signal: AbortSignal.timeout(10000) }); const crumb = (await c.text()).trim();
    if (!c.ok || !crumb || crumb.length > 40 || /</.test(crumb)) return null; return { cookie, crumb, UA };
  } catch (e) { console.error('yahoo crumb:', e.message); return null; }
}

export async function collectAnalysts(symbols, S, { T0 = Date.now() } = {}) {
  const out = {}, res = { ok: false, detail: '', n: 0 }; if (!symbols.length) { res.detail = 'אין מניות'; return { data: out, ...res }; }
  const ses = await session(); if (!ses) { res.detail = 'Yahoo לא נתן הרשאת גישה (crumb)'; return { data: out, ...res }; }
  let i = 0, fail = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (i < symbols.length) { const s = symbols[i++]; try {
    const r = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(s)}?modules=financialData,recommendationTrend,upgradeDowngradeHistory&crumb=${encodeURIComponent(ses.crumb)}`, { headers: { ...ses.UA, Cookie: ses.cookie }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error(r.status); const p = parseSummary(await r.json(), S[s]?.price, T0); if (p) out[s] = p; else fail++;
  } catch { fail++; } } }));
  res.n = Object.keys(out).length; res.ok = res.n > 0; res.detail = res.ok ? `${res.n}/${symbols.length} מניות עם נתוני אנליסטים` : 'לא הוחזרו נתונים'; res.at = new Date(T0).toISOString(); return { data: out, ...res };
}
