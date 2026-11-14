// מנוע הכללים הטכניים של האסטרטגיה: מחירים (Yahoo, גיבוי Stooq) ואינדיקטורים
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; OrenFinance/1.0)' };
async function yahoo(s) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=2y&interval=1d`, { headers: UA, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const j = (await r.json()).chart.result[0], q = j.indicators.quote[0];
  return j.timestamp.map((t, i) => ({ d: new Date(t * 1000).toISOString().slice(0, 10), h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i] })).filter(b => b.c != null && b.h != null);
}
async function stooq(s) {
  const m = { '^VIX': '^vix', 'BTC-USD': 'btc.v', 'ETH-USD': 'eth.v' }, k = m[s] || s.toLowerCase() + '.us';
  const t = await (await fetch(`https://stooq.com/q/d/l/?s=${k}&i=d`, { headers: UA, signal: AbortSignal.timeout(12000) })).text();
  const rows = t.trim().split('\n').slice(1).map(l => l.split(','));
  if (!rows.length || isNaN(+rows[0][4])) throw new Error('stooq');
  return rows.map(r => ({ d: r[0], h: +r[2], l: +r[3], c: +r[4], v: +r[5] || 0 })).slice(-500);
}
// חצייה של EMA 50 מול EMA 200: נקודת זהב (עליה) או חצייה שלילית (ירידה), עם תאריך וגיל (בנרות)
export function crossInfo(b) {
  const n = b.length; if (n < 200) return null; const c = b.map(x => x.c), a = ema(c, 50), z = ema(c, 200), sp = i => (a[i] - z[i]) / z[i] * 100;
  let k = n - 1; const up = sp(n - 1) > 0; while (k > 200 && (sp(k - 1) > 0) === up) k--; const cur = sp(n - 1), old = sp(Math.max(0, n - 11)), fresh = k > 200;
  // משך המצב הקודם (לפני החצייה האחרונה): חצייה שקדם לה מצב קצר מאוד היא כנראה איתות שווא
  let j = k - 1; if (fresh) while (j > 200 && (sp(j - 1) > 0) === !up) j--; const prevLen = fresh && j > 200 ? k - j : null;
  // כמה חציות היו בחלון האחרון: הרבה חציות = שוק מדשדש, איתותי שווא
  let flips = 0; for (let i = Math.max(201, n - 120); i < n; i++) if ((sp(i) > 0) !== (sp(i - 1) > 0)) flips++;
  // אישור בנפח: ממוצע נפח סביב החצייה מול ממוצע 50 הנרות שלפניה
  let volRatio = null; if (fresh && b[k].v != null) { const w = b.slice(k - 2, Math.min(n, k + 4)), base = b.slice(Math.max(0, k - 52), k - 2); const m = x => x.reduce((t, y) => t + (y.v || 0), 0) / (x.length || 1); if (m(base) > 0) volRatio = +(m(w) / m(base)).toFixed(2); }
  return { state: up ? 'golden' : 'death', daysAgo: fresh ? n - 1 - k : null, date: fresh ? b[k].d : null, spreadPct: +cur.toFixed(2), converging: Math.abs(cur) < Math.abs(old), prevLen, flips, choppy: flips >= 2 || (Math.abs(cur) < .6 && Math.abs(old) < 1.2), volRatio };
}
// נרות שבועיים (10 שנים) לחצייה איטית ופחות רועשת. daysAgo בנרות כאן הוא שבועות
export async function weeklyCross(s) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=10y&interval=1wk`, { headers: UA, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null; const j = (await r.json()).chart.result[0], q = j.indicators.quote[0];
    const b = j.timestamp.map((t, i) => ({ d: new Date(t * 1000).toISOString().slice(0, 10), c: q.close[i], v: q.volume ? q.volume[i] : undefined })).filter(x => x.c != null);
    const x = crossInfo(b); return x ? { ...x, weeks: x.daysAgo, daysAgo: undefined, bars: b.length } : null;
  } catch { return null; }
}
export async function bars(s) {
  for (const f of [yahoo, stooq]) { try { const b = await f(s); if (b.length >= 60) return { bars: b, src: f.name }; } catch {} }
  return null;
}
const ema = (a, n) => { const k = 2 / (n + 1); let e = a[0]; return a.map(x => (e = x * k + e * (1 - k))); };
const rsi = (c, n = 14) => { let g = 0, l = 0; for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; d > 0 ? (g += d) : (l -= d); } g /= n; l /= n;
  for (let i = n + 1; i < c.length; i++) { const d = c[i] - c[i - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; } return l ? 100 - 100 / (1 + g / l) : 100; };
const atr = (b, n = 14) => { const t = []; for (let i = 1; i < b.length; i++) t.push(Math.max(b[i].h - b[i].l, Math.abs(b[i].h - b[i - 1].c), Math.abs(b[i].l - b[i - 1].c)));
  let a = t.slice(0, n).reduce((x, y) => x + y) / n; for (let i = n; i < t.length; i++) a = (a * (n - 1) + t[i]) / n; return a; };
export function analyze(b) {
  const n = b.length, c = b.map(x => x.c), last = b[n - 1], prev = b[n - 2];
  const E = k => ema(c, k)[n - 1], e50 = E(50), e150 = E(150), e200 = E(200), R = rsi(c), A = atr(b);
  const hi = Math.max(...b.slice(-56, -1).map(x => x.h)), avgV = b.slice(-21, -1).reduce((s, x) => s + (x.v || 0), 0) / 20;
  const rg = b.slice(-120), Hh = Math.max(...rg.map(x => x.h)), L = Math.min(...rg.map(x => x.l)), f50 = Hh - (Hh - L) * .5, f618 = Hh - (Hh - L) * .618;
  const checks = { above150: last.c > e150, cross: n >= 200 ? e50 > e200 : null, rsi50: R > 50, above50: last.c > e50, breakout: last.c > hi && avgV > 0 && last.v > avgV * 1.5 };
  const xinfo = crossInfo(b);
  const status = !checks.above150 ? 'red' : (checks.cross !== false && checks.rsi50) ? 'green' : 'yellow';
  return { price: last.c, chg: (last.c / prev.c - 1) * 100, date: last.d, e50, e150, e200, rsi: R, atr: A, stop: last.c - 2 * A, stopPct: 2 * A / last.c * 100,
    reds: [0, 1, 2].every(i => c[n - 1 - i] < c[n - 2 - i]), fib: { f50, f618, inFib: last.c <= f50 && last.c >= f618 },
    cross: xinfo, checks, score: Object.values(checks).filter(Boolean).length * 20, status, spark: c.slice(-60).map(x => +x.toFixed(2)) };
}
// מודל ב׳ (Oren Finance): מתווסף למודל א׳ (כללי האסטרטגיה). bench = תשואת S&P 500 ל-63 ימי מסחר
export function analyzeFull(b, bench) {
  const a = analyze(b), c = b.map(x => x.c), n = c.length;
  const e12 = ema(c, 12), e26 = ema(c, 26), mac = e12.map((x, i) => x - e26[i]), sig = ema(mac, 9);
  let acc = 0; const obv = b.map((x, i) => (i ? (acc += Math.sign(x.c - b[i - 1].c) * (x.v || 0)) : 0));
  const ret63 = n > 63 ? c[n - 1] / c[n - 64] - 1 : null, hi52 = Math.max(...b.slice(-252).map(x => x.h));
  const ours = { macd: mac[n - 1] > sig[n - 1], rs: bench != null && ret63 != null ? ret63 > bench : null, nearHigh: c[n - 1] >= hi52 * .9, obvUp: obv[n - 1] > obv[n - 21], calm: a.atr / c[n - 1] < .05 };
  const oursScore = Object.values(ours).filter(Boolean).length * 20, combined = Math.round((a.score + oursScore) / 2);
  const verdict = a.status === 'red' ? 'חלש' : combined >= 75 ? 'חזק' : combined >= 55 ? 'חיובי' : combined >= 35 ? 'ניטרלי' : 'חלש';
  return { ...a, ours, oursScore, combined, verdict, ret63 };
}
