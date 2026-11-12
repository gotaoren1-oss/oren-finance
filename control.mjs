// בקרה: תמיד עסקת מעקב היפותטית אחת פתוחה, עד 60 יום. בסגירה נוצר דוח חקירה לאחור
const DAYS = 60, R = 2;
export function updateControl(prev, B, S, picks, mkt) {
  const ctrl = { open: prev?.open || [], closed: prev?.closed || [] }, done = [];
  const spyRet = from => { const b = B.SPY, i = b ? b.findIndex(x => x.d >= from) : -1; return i < 0 ? null : (b[b.length - 1].c / b[i].c - 1) * 100; };
  ctrl.open = ctrl.open.filter(p => {
    const b = B[p.ticker], s = S[p.ticker]; if (!b || !s) return true;
    const path = b.filter(x => x.d > p.date), last = b[b.length - 1]; let ex = null;
    for (const x of path) { if (x.l <= p.stop) { ex = { price: p.stop, why: 'נפגע ה-Stop (ATR×2)', date: x.d }; break; } if (x.h >= p.target) { ex = { price: p.target, why: `הושג יעד ${R}R`, date: x.d }; break; } }
    const days = Math.round((Date.now() - new Date(p.date)) / 864e5);
    if (!ex && !s.checks.above150) ex = { price: last.c, why: 'שבירת מגמה: מתחת ל-EMA 150', date: last.d };
    if (!ex && days >= DAYS) ex = { price: last.c, why: 'חלפו 60 יום', date: last.d };
    const maxP = Math.max(p.maxP, ...path.map(x => x.h)), minP = Math.min(p.minP, ...path.map(x => x.l)), sr = spyRet(p.date), pnl = (last.c / p.entry - 1) * 100;
    Object.assign(p, { maxP, minP, days, now: last.c, pnl, alpha: sr == null ? null : pnl - sr });
    if (!ex) return true;
    const pl = (ex.price / p.entry - 1) * 100, c = { ...p, exit: ex.date, exitPrice: ex.price, why: ex.why, pnl: pl, alpha: sr == null ? null : pl - sr, mfe: (maxP / p.entry - 1) * 100, mae: (minP / p.entry - 1) * 100, outcome: pl > 0 ? 'הצלחה' : 'כישלון', exitChecks: s.checks, exitMarket: mkt };
    ctrl.closed.unshift(c); done.push(c); return false;
  });
  if (!ctrl.open.length) {
    const recent = new Set(ctrl.closed.filter(c => Date.now() - new Date(c.exit) < 10 * 864e5).map(c => c.ticker));
    const cand = [...new Set([...picks, ...Object.keys(S)])].filter(t => S[t] && S[t].status === 'green' && !recent.has(t) && !['SPY', 'QQQ', '^VIX'].includes(t));
    const t = picks.find(x => cand.includes(x)) || cand.sort((a, b) => S[b].combined - S[a].combined)[0];
    if (t) { const s = S[t]; ctrl.open.push({ ticker: t, date: s.date, entry: s.price, stop: s.stop, target: s.price + R * (s.price - s.stop), maxP: s.price, minP: s.price, days: 0, now: s.price, pnl: 0, alpha: 0, entryChecks: s.checks, entryOurs: s.ours, entryScore: s.combined, entryMarket: mkt, thesis: '' }); }
  }
  const cl = ctrl.closed, al = cl.filter(c => c.alpha != null);
  ctrl.stats = { n: cl.length, wins: cl.filter(c => c.outcome === 'הצלחה').length, avgPnl: cl.length ? cl.reduce((a, c) => a + c.pnl, 0) / cl.length : 0, avgAlpha: al.length ? al.reduce((a, c) => a + c.alpha, 0) / al.length : 0 };
  return { ctrl, done };
}
