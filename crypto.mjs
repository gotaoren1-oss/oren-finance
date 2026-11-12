// Oren Finance · מודול קריפטו: מחירים, מומנטום, מדדי שוק ופעילות ארנקים גדולים
// כל מקור נבדק בנפרד ומקבל זמן נתון משלו. מקור שנכשל או ישן מדי לא נכנס, ולא מוחלף בנתון ישן.
const FNG_HE = { 'Extreme Fear': 'פחד קיצוני', Fear: 'פחד', Neutral: 'ניטרלי', Greed: 'חמדנות', 'Extreme Greed': 'חמדנות קיצונית' };
const num = x => (x == null || x === '' || isNaN(+x) ? null : +x);
const pct = (a, b) => (a != null && b ? (a / b - 1) * 100 : null);
const L = '\u200e', fmtUsd = v => L + '$' + (v >= 1e12 ? (v / 1e12).toFixed(2) + 'T' : v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.round(v).toLocaleString('en-US')) + L;
const utc = t => new Date(t).toISOString().slice(0, 19).replace('T', ' ');

// ---- מנתחים (פונקציות טהורות, נבדקות עם נתוני דמה) ----
export const parse = {
  markets(j) { return (Array.isArray(j) ? j : []).map(c => ({ id: c.id, sym: String(c.symbol || '').toUpperCase(), price: num(c.current_price), ch24: num(c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h), ch7: num(c.price_change_percentage_7d_in_currency), ch30: num(c.price_change_percentage_30d_in_currency), mcap: num(c.market_cap), vol: num(c.total_volume), high: num(c.ath), at: c.last_updated || null })).filter(c => c.price != null); },
  global(j) { const g = j?.data; if (!g) return null; return { btcDom: num(g.market_cap_percentage?.btc), ethDom: num(g.market_cap_percentage?.eth), mcap: num(g.total_market_cap?.usd), mcapCh24: num(g.market_cap_change_percentage_24h_usd), at: g.updated_at ? new Date(g.updated_at * 1000).toISOString() : null }; },
  fng(j) { const a = (j?.data || []).map(x => ({ value: num(x.value), label: x.value_classification, at: x.timestamp ? new Date(x.timestamp * 1000).toISOString() : null })).filter(x => x.value != null); return a.length ? { now: a[0], week: a[6] || a.at(-1), history: a.map(x => x.value).reverse() } : null; },
  okxFunding(j) { const r = j?.data?.[0]; return r && num(r.fundingRate) != null ? { rate: num(r.fundingRate), next: num(r.nextFundingTime), at: num(r.ts) || num(r.fundingTime) } : null; },
  okxOI(j) { const r = j?.data?.[0]; if (!r) return null; return { oi: num(r.oiCcy) ?? num(r.oi), usd: num(r.oiUsd), at: num(r.ts) }; },
  bybit(j) { const r = j?.result?.list?.[0]; return r && num(r.fundingRate) != null ? { rate: num(r.fundingRate), oiUsd: num(r.openInterestValue), next: num(r.nextFundingTime) } : null; },
  stable(j) { // DefiLlama: מערך יומי של היצע סטייבלקוינים
    if (!Array.isArray(j) || j.length < 31) return null; const val = x => num(x?.totalCirculatingUSD?.peggedUSD) ?? num(x?.totalCirculating?.peggedUSD), L = j.at(-1), v = val(L); if (v == null) return null;
    return { total: v, ch7: pct(v, val(j.at(-8))), ch30: pct(v, val(j.at(-31))), at: new Date(+L.date * 1000).toISOString() };
  },
  blockchairBtc(j) { return (j?.data || []).filter(t => !t.is_coinbase && num(t.output_total_usd) != null).map(t => ({ coin: 'BTC', usd: num(t.output_total_usd), amount: num(t.output_total) / 1e8, time: String(t.time).replace(' ', 'T') + 'Z', hash: t.hash, url: 'https://blockchair.com/bitcoin/transaction/' + t.hash })); },
  blockchairEth(j) { return (j?.data || []).filter(t => num(t.value_usd) != null).map(t => ({ coin: 'ETH', usd: num(t.value_usd), amount: num(t.value) / 1e18, time: String(t.time).replace(' ', 'T') + 'Z', hash: t.transaction_hash || t.hash, from: t.sender, to: t.recipient, url: 'https://blockchair.com/ethereum/transaction/' + (t.transaction_hash || t.hash) })); },
  whaleAlert(j) { return (j?.transactions || []).filter(t => ['btc', 'eth'].includes(t.symbol)).map(t => ({ coin: t.symbol.toUpperCase(), usd: Math.round(t.amount_usd), amount: Math.round(t.amount), time: new Date(t.timestamp * 1000).toISOString(), from: [t.from?.owner_type, t.from?.owner].filter(Boolean).join(':'), to: [t.to?.owner_type, t.to?.owner].filter(Boolean).join(':'), url: t.hash ? 'https://whale-alert.io/transaction/' + t.blockchain + '/' + t.hash : null, kind: 'whale-alert' })); },
};

// ---- פרשנות בכללים קבועים ----
export function interpret(c) {
  const out = [], btc = c.coins?.find(x => x.sym === 'BTC'), eth = c.coins?.find(x => x.sym === 'ETH');
  if (c.fng) { const v = c.fng.now.value, w = c.fng.week?.value, tone = v <= 25 ? 'dn' : v >= 75 ? 'am' : 'up'; out.push({ key: 'fng', name: 'פחד וחמדנות בקריפטו', value: v + '', status: FNG_HE[c.fng.now.label] || c.fng.now.label, tone, detail: w != null ? `לפני שבוע ${w}` : '', note: v <= 25 ? 'פחד קיצוני: היסטורית אזור שבו מוכרים בבהלה, אבל המגמה יכולה להמשיך לרדת.' : v >= 75 ? 'חמדנות גבוהה: שוק חם, ומסוכן יותר להיכנס אחרי עלייה חדה.' : 'הסנטימנט בטווח הרגיל.', at: c.fng.now.at }); }
  if (btc?.ch7 != null) { const tone = btc.ch7 < -8 ? 'dn' : btc.ch7 < 0 ? 'am' : 'up'; out.push({ key: 'mom', name: 'מומנטום ביטקוין', value: sgn(btc.ch7), status: 'שבוע · ' + (btc.ch7 < -8 ? 'ירידה חדה' : btc.ch7 < 0 ? 'חלש' : btc.ch7 > 8 ? 'עלייה חדה' : 'חיובי'), tone, detail: `24 שעות ${sgn(btc.ch24)} · 30 יום ${sgn(btc.ch30)}`, note: 'שינוי המחיר בשבוע האחרון. מומנטום הוא תיאור של העבר ולא תחזית.', at: btc.at }); }
  if (c.global?.btcDom != null) { const g = c.global; out.push({ key: 'dom', name: 'דומיננטיות ביטקוין', value: g.btcDom.toFixed(1) + '%', status: g.btcDom > 58 ? 'גבוהה' : g.btcDom < 48 ? 'נמוכה' : 'בינונית', tone: 'am', detail: `שווי שוק כולל ${fmtUsd(g.mcap)} · 24 שעות ${sgn(g.mcapCh24)}`, note: g.btcDom > 58 ? 'הכסף מתרכז בביטקוין, ואלטקוינים נוטים להיות חלשים יותר.' : g.btcDom < 48 ? 'הכסף מתפזר לאלטקוינים, שלב שנוטה להיות תנודתי יותר.' : 'חלוקה מאוזנת יחסית בין ביטקוין לשאר השוק.', at: g.at }); }
  for (const k of ['BTC', 'ETH']) {
    const f = c.deriv?.[k]; if (!f) continue; const r = f.rate * 100, tone = r > 0.05 ? 'dn' : r > 0.02 ? 'am' : r < -0.01 ? 'am' : 'up';
    out.push({ key: 'fund' + k, name: `מימון חוזים (${k})`, value: r.toFixed(4) + '%', status: r > 0.05 ? 'לונגים עמוסים' : r > 0.02 ? 'מוטה ללונג' : r < -0.01 ? 'מוטה לשורט' : 'מאוזן', tone, detail: (f.oiUsd ? 'Open Interest ' + fmtUsd(f.oiUsd) + ' · ' : '') + 'מקור ' + f.src, note: 'ריבית המימון שמשלמים בין לונגים לשורטים כל 8 שעות. ערך גבוה מעיד על מינוף ועומס בצד הקונים, וסיכון לירידה חדה (ליקווידציות). ערך שלילי מעיד על עומס בשורט.', at: f.at ? new Date(f.at).toISOString() : null });
  }
  if (c.stable) { const s = c.stable, tone = s.ch7 > 0.3 ? 'up' : s.ch7 < -0.3 ? 'dn' : 'am'; out.push({ key: 'stable', name: 'היצע סטייבלקוינים', value: fmtUsd(s.total), status: s.ch7 > 0.3 ? 'גדל' : s.ch7 < -0.3 ? 'מתכווץ' : 'יציב', tone, detail: `7 ימים ${sgn(s.ch7, '%')} · 30 יום ${sgn(s.ch30, '%')}`, note: 'סטייבלקוינים הם המזומן שממתין בצד השוק. היצע גדל מעיד על כסף חדש שנכנס, והיצע מתכווץ על יציאת כסף.', at: s.at }); }
  return out;
}
const sgn = (x, u = '%') => (x == null || isNaN(x) ? '–' : L + (x > 0 ? '+' : '') + (+x).toFixed(1) + u + L);

export function summarize(c) {
  const t = c.read || [], dn = t.filter(x => x.tone === 'dn').length, up = t.filter(x => x.tone === 'up').length, btc = c.coins?.find(x => x.sym === 'BTC'), eth = c.coins?.find(x => x.sym === 'ETH');
  const line = x => x ? `${x.sym} ב-$${x.price.toLocaleString('en-US', { maximumFractionDigits: x.price > 100 ? 0 : 2 })} (${sgn(x.ch24)} ביממה, ${sgn(x.ch7)} בשבוע)` : null;
  const w = c.whales || [], big = w.filter(x => x.usd >= 50e6), tot = w.reduce((s, x) => s + x.usd, 0);
  const mood = dn > up + 1 ? 'התמונה בקריפטו שלילית כרגע' : up > dn + 1 ? 'התמונה בקריפטו חיובית כרגע' : 'התמונה בקריפטו מעורבת';
  return { view: `${mood}: ${up} מדדים חיוביים מול ${dn} מדדים מדאיגים.${c.fng ? ` פחד וחמדנות ${c.fng.now.value} (${FNG_HE[c.fng.now.label] || c.fng.now.label}).` : ''}${w.length ? ` זוהו ${w.length} העברות גדולות בשעות האחרונות בהיקף כולל ${fmtUsd(tot)}${big.length ? `, מהן ${big.length} מעל 50 מיליון דולר` : ''}. העברה גדולה אינה בהכרח קנייה או מכירה: היא יכולה להיות העברה בין ארנקים של אותו גוף.` : ' לא נקלטו העברות גדולות בטווח הזמן שנבדק.'}`, btc: line(btc) || 'אין נתון', eth: line(eth) || 'אין נתון' };
}

// ---- איסוף ----
export async function collectCrypto({ jget, T0, whaleKey }) {
  const sources = [], src = (name, ok, detail, at) => sources.push({ name, ok, detail, at: at || null });
  const c = { updated: new Date(T0).toISOString(), coins: [], global: null, fng: null, deriv: {}, stable: null, whales: [] };
  const ageMin = at => (at ? Math.round((T0 - new Date(at)) / 6e4) : null);
  const [mk, gl, fg, stable] = await Promise.all([
    jget('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&price_change_percentage=24h,7d,30d'),
    jget('https://api.coingecko.com/api/v3/global'),
    jget('https://api.alternative.me/fng/?limit=8'),
    jget('https://stablecoins.llama.fi/stablecoincharts/all'),
  ]);
  c.coins = parse.markets(mk); src('CoinGecko · מחירים', c.coins.length >= 2, c.coins.length ? c.coins.map(x => x.sym + ' $' + Math.round(x.price)).join(' · ') : 'לא זמין', c.coins[0]?.at);
  c.global = parse.global(gl); src('CoinGecko · שוק כולל', !!c.global, c.global ? 'דומיננטיות BTC ' + c.global.btcDom?.toFixed(1) + '%' : 'לא זמין', c.global?.at);
  c.fng = parse.fng(fg); src('פחד וחמדנות קריפטו', !!c.fng, c.fng ? c.fng.now.value + '' : 'לא זמין', c.fng?.now.at);
  c.stable = parse.stable(stable); src('DefiLlama · סטייבלקוינים', !!c.stable, c.stable ? fmtUsd(c.stable.total) : 'לא זמין', c.stable?.at);
  // מימון ו-Open Interest: OKX, ואם נכשל Bybit
  for (const [k, okx, byb] of [['BTC', 'BTC-USDT-SWAP', 'BTCUSDT'], ['ETH', 'ETH-USDT-SWAP', 'ETHUSDT']]) {
    const [f, o] = await Promise.all([jget(`https://www.okx.com/api/v5/public/funding-rate?instId=${okx}`), jget(`https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${okx}`)]);
    const pf = parse.okxFunding(f), po = parse.okxOI(o);
    if (pf) { const px = c.coins.find(x => x.sym === k)?.price; c.deriv[k] = { rate: pf.rate, oiUsd: po?.usd ?? (po?.oi && px ? po.oi * px : null), at: pf.at || T0, src: 'OKX' }; src(`OKX · מימון ${k}`, true, (pf.rate * 100).toFixed(4) + '%', new Date(pf.at || T0).toISOString()); continue; }
    const b = parse.bybit(await jget(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${byb}`));
    if (b) { c.deriv[k] = { rate: b.rate, oiUsd: b.oiUsd, at: T0, src: 'Bybit' }; src(`Bybit · מימון ${k}`, true, (b.rate * 100).toFixed(4) + '%', new Date(T0).toISOString()); } else src(`מימון ${k} (OKX/Bybit)`, false, 'לא זמין משני המקורות');
  }
  // ארנקים גדולים: Blockchair (ללא מפתח) והעברות ב-6 השעות האחרונות; Whale Alert אם הוגדר מפתח
  const since = utc(T0 - 6 * 36e5), MIN = 10e6;
  const [bt, et] = await Promise.all([
    jget(`https://api.blockchair.com/bitcoin/transactions?q=time(${since}..)&s=output_total(desc)&limit=15`),
    jget(`https://api.blockchair.com/ethereum/transactions?q=time(${since}..)&s=value(desc)&limit=15`),
  ]);
  const wb = parse.blockchairBtc(bt), we = parse.blockchairEth(et);
  src('Blockchair · BTC גדולות', wb.length > 0, wb.length ? `${wb.length} עסקאות · הגדולה ${fmtUsd(wb[0].usd)}` : 'לא זמין', wb[0]?.time);
  src('Blockchair · ETH גדולות', we.length > 0, we.length ? `${we.length} עסקאות · הגדולה ${fmtUsd(we[0].usd)}` : 'לא זמין', we[0]?.time);
  let all = [...wb, ...we];
  if (whaleKey) { const wa = parse.whaleAlert(await jget(`https://api.whale-alert.io/v1/transactions?api_key=${whaleKey}&min_value=5000000&start=${Math.floor(T0 / 1000) - 6 * 3600}`)); src('Whale Alert', wa.length > 0, wa.length ? wa.length + ' העברות' : 'לא זמין', wa[0]?.time); all = [...all, ...wa]; }
  const seenH = new Set();
  c.whales = all.filter(t => t.usd >= MIN && t.time && !isNaN(new Date(t.time)) && (T0 - new Date(t.time)) <= 12 * 36e5 && !seenH.has(t.hash || t.time + t.usd) && seenH.add(t.hash || t.time + t.usd))
    .map(t => ({ ...t, ageMin: Math.max(0, ageMin(t.time)) })).sort((a, b) => b.usd - a.usd).slice(0, 12);
  c.sources = sources; c.read = interpret(c); Object.assign(c, summarize(c));
  c.ok = c.coins.length >= 2; return c;
}
