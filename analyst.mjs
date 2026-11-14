// Oren Finance · אנליסט בכללים קבועים (ללא מודל שפה)
// כל משפט בעברית נבנה מתבניות ומחישובים מוצהרים, כך שאותו קלט תמיד נותן אותו פלט וכל מספר ניתן לבדיקה.
const COMPANIES = { nvidia: 'NVDA', apple: 'AAPL', microsoft: 'MSFT', amazon: 'AMZN', alphabet: 'GOOGL', google: 'GOOGL', meta: 'META', facebook: 'META', tesla: 'TSLA', netflix: 'NFLX', broadcom: 'AVGO', 'advanced micro': 'AMD', amd: 'AMD', intel: 'INTC', micron: 'MU', qualcomm: 'QCOM', oracle: 'ORCL', salesforce: 'CRM', adobe: 'ADBE', palantir: 'PLTR', 'super micro': 'SMCI', coinbase: 'COIN', microstrategy: 'MSTR', strategy: 'MSTR', robinhood: 'HOOD', paypal: 'PYPL', shopify: 'SHOP', uber: 'UBER', airbnb: 'ABNB', disney: 'DIS', walmart: 'WMT', costco: 'COST', target: 'TGT', 'home depot': 'HD', "lowe's": 'LOW', nike: 'NKE', starbucks: 'SBUX', "mcdonald's": 'MCD', 'coca-cola': 'KO', pepsi: 'PEP', 'procter': 'PG', 'johnson & johnson': 'JNJ', pfizer: 'PFE', merck: 'MRK', abbvie: 'ABBV', 'eli lilly': 'LLY', lilly: 'LLY', 'novo nordisk': 'NVO', unitedhealth: 'UNH', moderna: 'MRNA', 'jpmorgan': 'JPM', 'bank of america': 'BAC', 'wells fargo': 'WFC', citigroup: 'C', 'goldman sachs': 'GS', 'morgan stanley': 'MS', visa: 'V', mastercard: 'MA', berkshire: 'BRK-B', 'american express': 'AXP', blackrock: 'BLK', exxon: 'XOM', chevron: 'CVX', conocophillips: 'COP', boeing: 'BA', lockheed: 'LMT', caterpillar: 'CAT', deere: 'DE', ford: 'F', 'general motors': 'GM', rivian: 'RIVN', lucid: 'LCID', 'at&t': 'T', verizon: 'VZ', comcast: 'CMCSA', cisco: 'CSCO', ibm: 'IBM', snowflake: 'SNOW', crowdstrike: 'CRWD', datadog: 'DDOG', cloudflare: 'NET', zoom: 'ZM', spotify: 'SPOT', taiwan: 'TSM', tsmc: 'TSM', asml: 'ASML', arm: 'ARM', applovin: 'APP', sofi: 'SOFI', gamestop: 'GME', amc: 'AMC', 'circle internet': 'CRCL', 'dell': 'DELL', 'walgreens': 'WBA', 'lululemon': 'LULU', 'chipotle': 'CMG', 'uber': 'UBER', 'lyft': 'LYFT', 'doordash': 'DASH', 'roblox': 'RBLX', 'unity': 'U', 'rocket lab': 'RKLB', 'ionq': 'IONQ', 'cava': 'CAVA', 'hims': 'HIMS' };
const STOP = new Set('A I AI CEO CFO IPO ETF USA US USD GDP CPI PCE FED FOMC SEC FDA EPS IRS NYSE NASDAQ DOW S P AND THE FOR NEW ALL ONE TWO TOP BIG NOW WHY HOW WHO YOU ARE CAN HAS BUY SELL HOLD NEXT LIVE BEST TODAY WEEK AFTER OVER FROM WITH THIS THAT WILL MORE NEWS STOCK STOCKS MARKET MARKETS CNBC EU UK OPEC NATO AT ON IN IT OR BY TO UP GO DO IF SO NO'.split(' '));
export const SECTORS = { XLK: 'טכנולוגיה', XLF: 'פיננסים', XLE: 'אנרגיה', XLV: 'בריאות', XLY: 'צריכה מחזורית', XLP: 'צריכה בסיסית', XLI: 'תעשייה', XLU: 'תשתיות', XLB: 'חומרים', XLRE: 'נדל"ן', XLC: 'תקשורת' };
const POS = /\b(surge[sd]?|jump[s|ed]*|rall(y|ies|ied)|beat[s]?|record|soar[s|ed]*|gain[s|ed]*|upgrade[sd]?|bullish|climb[s|ed]*|rise[s]?|rose|strong|boost[s|ed]*|rebound[s|ed]*|top[s|ped]* estimates|raises? (guidance|outlook|forecast)|outperform|breakout|optimis\w+|cuts? rates?)\b/i;
const NEG = /\b(plunge[sd]?|slump[s|ed]*|tumble[sd]?|fall[s]?|fell|drop[s|ped]*|miss(es|ed)?|downgrade[sd]?|bearish|slide[s]?|sink[s]?|sank|crash\w*|sell-?off|fears?|warn[s|ed]*|cuts? (guidance|outlook|forecast|jobs)|layoffs?|lawsuit|probe|investigation|recession|tariffs?|default|bankrupt\w*|weak|concern[s]?|worst|volatil\w+|shutdown)\b/i;
const THEMES = [['ריבית והפד', /\b(fed|fomc|powell|rate cut|rate hike|interest rate|treasury yield)/i], ['אינפלציה', /\b(inflation|cpi|pce|prices? (rise|rose|climb))/i], ['שוק העבודה', /\b(jobs? report|payrolls?|unemployment|jobless|layoffs?|hiring)/i], ['בינה מלאכותית ושבבים', /\b(ai\b|artificial intelligence|chip|semiconductor|data center|nvidia|openai|gpu)/i], ['מכסים וסחר', /\b(tariffs?|trade war|trade deal|china|export controls?)/i], ['דוחות רבעוניים', /\b(earnings|quarterly results|guidance|revenue|profit|eps)\b/i], ['נפט ואנרגיה', /\b(oil|crude|opec|natural gas|energy prices)/i], ['קריפטו', /\b(bitcoin|crypto|ethereum|stablecoin|btc|eth)\b/i], ['בנקים ואשראי', /\b(banks?|credit|lending|mortgage|private credit)/i], ['גיאופוליטיקה', /\b(war|ukraine|russia|israel|iran|sanctions|shutdown|election)/i]];
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const CNN_HE = { 'extreme fear': 'פחד קיצוני', fear: 'פחד', neutral: 'ניטרלי', greed: 'חמדנות', 'extreme greed': 'חמדנות קיצונית' };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), n1 = x => (x == null || isNaN(x) ? '–' : (+x).toFixed(1)), sg = x => (x == null || isNaN(x) ? '–' : (x > 0 ? '+' : '') + (+x).toFixed(1) + '%'), bare = t => String(t).replace('-USD', '');
const txt = i => `${i.title}. ${i.desc || ''}`;

export function sentiment(s) { return (POS.test(s) ? 1 : 0) - (NEG.test(s) ? 1 : 0); }

// ---- חילוץ סימולים ממקורות טריים ----
export function extractTickers(items, extra = []) {
  const m = new Map(); const add = (t, i, how) => { if (!t || STOP.has(t) || !/^[A-Z]{1,5}(-[A-Z])?$/.test(t)) return; const r = m.get(t) || { ticker: t, items: [], how: new Set() }; if (!r.items.includes(i)) r.items.push(i); r.how.add(how); m.set(t, r); };
  for (const i of items) {
    const s = txt(i), low = s.toLowerCase();
    for (const x of s.matchAll(/\$([A-Z]{1,5})\b/g)) add(x[1], i, 'cashtag');
    for (const x of s.matchAll(/\((?:NASDAQ|NYSE|NYSEARCA|AMEX|Nasdaq|NYSE American)\s*:\s*([A-Z]{1,5})\)/g)) add(x[1], i, 'exchange');
    for (const [name, t] of Object.entries(COMPANIES)) { const k = low.indexOf(name); if (k >= 0 && !/[a-z]/.test(low[k - 1] || ' ') && !/[a-z]/.test(low[k + name.length] || ' ')) add(t, i, 'name'); }
    if (/\bbitcoin\b|\bbtc\b/i.test(s)) add('BTC-USD', i, 'name'); if (/\bethereum\b|\bether\b|\beth\b/i.test(s)) add('ETH-USD', i, 'name');
  }
  for (const t of extra) if (!m.has(t) && !STOP.has(t)) m.set(t, { ticker: t, items: [], how: new Set(['trending']) });
  return [...m.values()].map(r => ({ ticker: r.ticker, n: r.items.length, srcs: [...new Set(r.items.map(i => i.src))], sent: r.items.reduce((a, i) => a + sentiment(txt(i)), 0), titles: r.items.slice(0, 3).map(i => i.title), how: [...r.how] }));
}

// ---- לוח דוחות מ-Earnings Whispers (טקסט הדף) ----
export function parseEarnings(text, now = new Date()) {
  const out = [], re = /(Before the Open|After the Close|Before Open|After Close|Pre[- ]?Market|After Hours)[^A-Za-z]{0,6}(?:(Mon|Tues?|Wed(?:nes)?|Thu(?:rs)?|Fri)\w*,?\s*)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2})\s*:?\s*((?:\$?[A-Z]{1,5}(?:[\s,]+|$)){1,40})/g;
  for (const m of text.matchAll(re)) {
    const mo = MONTHS[m[3].toLowerCase()], day = +m[4]; let y = now.getUTCFullYear(); if (mo < now.getUTCMonth() - 6) y++;
    const date = `${y}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, when = /before|pre/i.test(m[1]) ? 'לפני פתיחה' : 'אחרי סגירה';
    for (const t of m[5].split(/[\s,]+/).map(x => x.replace('$', '')).filter(Boolean)) if (/^[A-Z]{1,5}$/.test(t) && !STOP.has(t)) out.push({ ticker: t, date, when });
  }
  const seen = new Set(); return out.filter(e => !seen.has(e.ticker + e.date) && seen.add(e.ticker + e.date));
}

// ---- המנוע הראשי ----
export function analyze({ items, S, market, macro, earningsText, filings, crypto, trend = [], ET, lowSources = [], AN = {}, prev = null, now = new Date() }) {
  const exist = t => !!S[t], spy = S.SPY, qqq = S.QQQ, vix = market.vix, fng = market.fng, cfng = market.cfng;
  const stocks = Object.entries(S).filter(([k]) => !['SPY', 'QQQ', '^VIX', 'BTC-USD', 'ETH-USD', ...Object.keys(SECTORS)].includes(k)).map(([k, v]) => ({ t: k, ...v }));
  const ex = extractTickers(items, trend), mention = Object.fromEntries(ex.map(e => [e.ticker, e]));
  // סנטימנט חדשות כללי
  const ns = items.map(i => sentiment(txt(i))), posN = ns.filter(x => x > 0).length, negN = ns.filter(x => x < 0).length, newsBias = items.length ? (posN - negN) / items.length : 0;
  // רוחב שוק בסריקה
  const good = stocks.filter(s => s.combined >= 55).length, bad = stocks.filter(s => s.verdict === 'חלש').length, br = stocks.length ? good / stocks.length : 0.5, above150 = stocks.length ? stocks.filter(s => s.checks.above150).length / stocks.length : 0.5;
  // מצב רוח: מודל נקודות שקוף
  const f = []; let sc = 50; const fx = (pts, txtx) => { sc += pts; f.push(`${pts >= 0 ? '+' : ''}${pts} ${txtx}`); };
  fx(spy.checks.above150 ? 12 : -15, spy.checks.above150 ? 'S&P 500 מעל EMA 150' : 'S&P 500 מתחת ל-EMA 150');
  if (spy.checks.cross != null) fx(spy.checks.cross ? 8 : -8, spy.checks.cross ? 'EMA 50 מעל 200' : 'EMA 50 מתחת ל-200');
  fx(spy.checks.rsi50 ? 4 : -4, `RSI של S&P ${n1(spy.rsi)}`);
  if (vix != null) fx(vix > 30 ? -18 : vix > 22 ? -8 : vix < 16 ? 8 : 0, `VIX ${n1(vix)}`);
  fx(Math.round((br - 0.4) * 30), `${Math.round(br * 100)}% מהנכסים שנסרקו בדירוג חיובי ומעלה`);
  fx(Math.round((above150 - 0.5) * 16), `${Math.round(above150 * 100)}% מעל EMA 150`);
  fx(Math.round(clamp(newsBias * 20, -8, 8)), `נימת כותרות ${posN} חיוביות מול ${negN} שליליות`);
  if (fng) fx(fng.value > 80 ? -5 : fng.value < 20 ? -3 : 0, `פחד וחמדנות ${fng.value}`);
  sc = Math.round(clamp(sc, 5, 95)); const label = sc >= 62 ? 'עולה' : sc <= 38 ? 'יורד' : 'מעורב';

  // סקטורים: חוזק יחסי ל-63 יום לעומת S&P, ועוד שינוי יומי
  const sectors = Object.entries(SECTORS).filter(([k]) => S[k]).map(([k, name]) => { const v = S[k], rel = v.ret63 != null && spy.ret63 != null ? (v.ret63 - spy.ret63) * 100 : 0, score = Math.round(clamp(rel * 5 + v.chg * 8, -100, 100)); return { name, etf: k, score, note: `${k}: ${sg(v.chg)} ביום, ${v.ret63 != null ? sg(v.ret63 * 100) : '–'} ב-63 ימים (${rel >= 0 ? 'מעל' : 'מתחת ל'}־S&P ב-${Math.abs(rel).toFixed(1)} נק׳), ${v.checks.above150 ? 'מעל' : 'מתחת ל'}־EMA 150` }; }).sort((a, b) => b.score - a.score);

  // המלצות: מה שהמודלים מדרגים גבוה ושעלה גם במקורות הטריים
  const eAll = parseEarnings(earningsText, now), eNext = Object.fromEntries(eAll.filter(e => e.date >= (ET || now.toISOString().slice(0, 10))).sort((x, y) => x.date.localeCompare(y.date)).map(e => [e.ticker, e]).reverse());
  const picks = stocks.filter(s => mention[s.t]?.n && s.combined >= 55 && s.status !== 'red').map(s => { const an = AN[s.t]; return { s, m: mention[s.t], an, rank: s.combined + Math.min(mention[s.t].n, 4) * 3 + mention[s.t].sent * 2 + (an?.stance === 'pos' ? 12 : an?.stance === 'neg' ? -15 : 0) }; }).sort((a, b) => b.rank - a.rank).slice(0, 12).map(({ s, m, an }) => {
    const a = s.checks, why = []; if (a.above150) why.push('מעל EMA 150'); if (a.cross) why.push('EMA 50 מעל 200'); if (a.breakout) why.push('פריצה עם נפח'); if (s.ours.rs) why.push('חזק מ-S&P'); if (s.ours.macd) why.push('MACD חיובי');
    const rsiNote = s.rsi > 70 ? ` RSI ${n1(s.rsi)} גבוה, אחרי ריצה קיים סיכון לתיקון.` : '', cat = `${m.n} אזכורים ב-${m.srcs.length} מקורות${m.sent ? (m.sent > 0 ? ', נימה חיובית' : ', נימה שלילית') : ''}: ${m.titles[0] || ''}`.slice(0, 220);
    const okA = s.status === 'green', okB = s.oursScore >= 60, okC = an ? an.stance === 'pos' : null, votes = [okA, okB, okC].filter(v => v === true).length, avail = okC == null ? 2 : 3;
    let conf = s.combined >= 75 && m.n >= 2 ? 'גבוהה' : s.combined >= 65 ? 'בינונית' : 'נמוכה';
    if (an?.stance === 'pos' && conf === 'בינונית' && votes === 3) conf = 'גבוהה'; if (an?.stance === 'neg') conf = conf === 'גבוהה' ? 'בינונית' : 'נמוכה';
    const en = eNext[s.t], dToE = en ? Math.round((new Date(en.date) - new Date(ET || now)) / 864e5) : null, size = 1 / (s.stopPct / 100);
    return { ticker: bare(s.t), name: bare(s.t), thesis: `ציון משולב ${s.combined} (${s.verdict}): ${why.join(', ') || 'עומד ברוב הכללים'}.${rsiNote}`, catalyst: cat, risk: `Stop לפי ATR×2 ב-${s.stop.toFixed(2)} (${s.stopPct.toFixed(1)}% מתחת למחיר). לסיכון של 1% מההון, גודל הפוזיציה כ-${Math.min(100, size).toFixed(0)}% מההון.${market.risk >= 7 ? ' סיכון שוק גבוה כרגע.' : ''}${s.rsi > 70 ? ' מתוח (RSI גבוה).' : ''}${dToE != null && dToE <= 7 ? ` דוח בעוד ${dToE} ימים (${en.date}): סיכון אירוע.` : ''}${an?.stance === 'neg' ? ' האנליסטים שליליים או מעריכים ירידה.' : ''}`, confidence: conf,
      analyst: an ? { label: an.label, n: an.n, mean: an.mean, target: an.target, high: an.high, low: an.low, upside: an.upside, stance: an.stance, trend: an.trend, changes: an.changes } : null, triple: { a: okA, b: okB, c: okC, d: m.n >= 2 && m.srcs.length >= 2 && m.sent >= 0, dneg: m.sent < 0, dn: m.n, votes, avail } };
  });
  const avoid = stocks.filter(s => mention[s.t]?.n && (s.verdict === 'חלש' || s.status === 'red')).map(s => ({ s, m: mention[s.t] })).sort((a, b) => a.s.combined - b.s.combined).slice(0, 8).map(({ s, m }) => ({ ticker: bare(s.t), why: `${s.checks.above150 ? '' : 'מתחת ל-EMA 150, '}ציון משולב ${s.combined} (${s.verdict}), מספר אזכורים: ${m.n}${m.sent < 0 ? ', בנימה שלילית' : ''}. סימן לזהירות ולא המלצה למכור.` }));
  const watch = [...stocks.filter(s => mention[s.t]?.n && s.combined >= 45 && s.combined < 55 && s.status !== 'red').slice(0, 5).map(s => `${bare(s.t)}: ציון ${s.combined}, קרוב לסף החיובי`), ...stocks.filter(s => s.fib?.inFib && s.checks.above150).slice(0, 4).map(s => `${bare(s.t)} באזור פיבונאצ'י 50%-61.8% מעל EMA 150: אזור תיקון קלאסי`)];

  // נושאים
  const themes = THEMES.map(([topic, re]) => { const hit = items.filter(i => re.test(txt(i))); if (hit.length < 2) return null; const sent = hit.reduce((a, i) => a + sentiment(txt(i)), 0), tk = {}; for (const e of ex) if (e.items) for (const i of hit) if (txt(i).includes(e.titles?.[0] || '\u0000')) tk[e.ticker] = 1; return { topic, count: hit.length, tickers: ex.filter(e => hit.some(i => e.titles.includes(i.title))).sort((a, b) => b.n - a.n).slice(0, 5).map(e => bare(e.ticker)), sources: [...new Set(hit.map(i => i.src))].slice(0, 5), sentiment: sent > 0 ? 'חיובי' : sent < 0 ? 'שלילי' : 'מעורב' }; }).filter(Boolean).sort((a, b) => b.count - a.count).slice(0, 8);

  // דוחות
  const todayET = ET || now.toISOString().slice(0, 10), eList = parseEarnings(earningsText, now).filter(e => e.date >= todayET).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 40);
  const earnings = eList.map(e => { const s = S[e.ticker]; return { ticker: e.ticker, date: e.date, note: `${e.when}${s ? `. מודלים: ${s.verdict} (${s.combined}), ${s.checks.above150 ? 'מעל' : 'מתחת ל'}־EMA 150` : ''}${s && s.rsi > 70 ? '. RSI גבוה: הציפיות כבר במחיר' : ''}` }; });

  // מוסדות
  const names = filings.slice(0, 6).map(f => (f.title.match(/13F-HR\s*-\s*(.+?)\s*\(\d{5,}\)/) || [])[1]).filter(Boolean), institutions = filings.length ? `ברשימת ה-SEC כעת ${filings.length} הגשות 13F חדשות, למשל ${names.slice(0, 4).join(', ') || 'מוסדות שונים'}. הגשת 13F מפרטת החזקות ברבעון שהסתיים לפני עד 45 יום ולכן היא מאחרת, והרשימה כאן מראה מי הגיש ולא מי קנה או מכר.` : 'לא נקלטו הגשות 13F בהרצה זו.';

  // מאקרו
  const mi = macro?.items || [], by = Object.fromEntries(mi.map(x => [x.key, x])), bad2 = mi.filter(x => x.tone === 'dn'), ok2 = mi.filter(x => x.tone === 'up');
  const macroView = mi.length ? `${['cpi', 'unemp', 'fed', 'y10'].filter(k => by[k]).map(k => `${by[k].name} ${by[k].value} (${by[k].status})`).join(', ')}. ${bad2.length > ok2.length ? 'רוב המדדים מכבידים על השוק: ' : ok2.length > bad2.length ? 'רוב המדדים תומכים בשוק: ' : 'התמונה הכלכלית מעורבת: '}${by.cpi?.tone !== 'up' && by.fed?.status !== 'בהורדות' ? 'אינפלציה מעל היעד מקשה על הורדת ריבית, ולכן מניות צמיחה רגישות. ' : by.fed?.status === 'בהורדות' ? 'הפד בהורדות ריבית, וזה בדרך כלל תומך במניות. ' : ''}${by.curve?.tone === 'dn' ? 'העקום הפוך, אות אזהרה להאטה. ' : ''}${by.jobs?.tone === 'dn' ? 'יצירת המשרות חלשה. ' : ''}זו פרשנות לפי כללים קבועים ולא תחזית.`.trim() : 'לא התקבלו נתוני מאקרו עדכניים בהרצה זו.';

  // סיכונים
  const risks = []; const rk = (title, detail, level) => risks.push({ title, detail, level });
  if (vix > 22) rk('תנודתיות גבוהה', `VIX על ${n1(vix)}. מעל 22 מעיד על חרדה, ומעל 30 על פאניקה.`, vix > 30 ? 3 : 2);
  if (!spy.checks.above150) rk('S&P 500 מתחת ל-EMA 150', 'לפי האסטרטגיה זו מגמה שלילית, וקניית דיפים נעשית בסיכון גבוה יותר.', 3);
  if (spy.checks.cross === false) rk('חצייה שלילית', 'EMA 50 מתחת ל-200 במדד S&P 500.', 2);
  if (fng && fng.value > 75) rk('חמדנות גבוהה', `פחד וחמדנות ${fng.value} (${CNN_HE[String(fng.label).toLowerCase()] || fng.label}). שווקים חמים רגישים לאכזבה.`, 2);
  if (fng && fng.value < 25) rk('פחד בשוק', `פחד וחמדנות ${fng.value}. פחד קיצוני יוצר הזדמנויות אבל גם יכול להעמיק.`, 2);
  if (market.conflict) rk('סתירה בין כללי הדיפ לכללי המגמה', 'אותות קניית דיפים פעילים בזמן ש-S&P מתחת ל-EMA 150. כלל המגמה קובע זהירות.', 3);
  for (const x of bad2.slice(0, 3)) rk(`${x.name}: ${x.status}`, x.impact, 2);
  const near = earnings.filter(e => e.date <= new Date(now.getTime() + 3 * 864e5).toISOString().slice(0, 10)).length; if (near >= 15) rk('עומס דוחות בימים הקרובים', `${near} חברות מדווחות ב-3 הימים הקרובים, תנודתיות בודדות צפויה.`, 1);
  const hot = crypto?.read?.filter(x => x.tone === 'dn') || []; for (const x of hot.slice(0, 2)) rk(`קריפטו: ${x.name}`, `${x.value} · ${x.status}. ${x.note}`, 1);
  if (!risks.length) rk('אין אזהרות בולטות', 'כל כללי הסיכון הקבועים נמצאים בטווח תקין בהרצה זו. זה לא אומר שאין סיכון.', 1);

  // סתירות
  const contradictions = [];
  if (market.conflict) contradictions.push('כללי הדיפ מצביעים על קנייה, וכלל המגמה (EMA 150) מצביע על זהירות.');
  if (newsBias > 0.08 && !spy.checks.above150) contradictions.push('הכותרות חיוביות אך S&P 500 מתחת ל-EMA 150: ייתכן שהאופטימיות מוקדמת.');
  if (newsBias < -0.08 && spy.checks.above150) contradictions.push('הכותרות שליליות אך S&P 500 עדיין מעל EMA 150: המחיר עדיין לא מאשר את החשש.');
  if (fng && cfng && Math.abs(fng.value - cfng.value) > 35) contradictions.push(`פער בין סנטימנט המניות (${fng.value}) לסנטימנט הקריפטו (${cfng.value}).`);
  for (const e of ex.filter(e => e.srcs.length > 1 && e.items !== 0)) { const ss = items.filter(i => txt(i).includes(e.titles[0] || '\u0000')); if (ss.some(i => sentiment(txt(i)) > 0) && ss.some(i => sentiment(txt(i)) < 0)) { contradictions.push(`${bare(e.ticker)}: מקורות שונים מדווחים בנימה הפוכה.`); break; } }
  if (stocks.length && spy.checks.above150 && above150 < 0.4) contradictions.push('S&P מעל EMA 150 אך רוב הנכסים שנסרקו מתחתיו: הראלי צר.');

  // סיכום
  const best = sectors[0], worst = sectors.at(-1), rel = s => (s ? `${s.name} (${s.etf})` : '');
  const summary = `S&P 500 ב-${n1(spy.price)} (${sg(spy.chg)} ביום), ${spy.checks.above150 ? 'מעל' : 'מתחת ל'}־EMA 150 ו-VIX ${vix != null ? n1(vix) : 'לא זמין'}. ${fng ? `פחד וחמדנות ${fng.value} (${CNN_HE[String(fng.label).toLowerCase()] || fng.label}). ` : ''}מתוך ${stocks.length} מניות שנסרקו, ${good} בדירוג חיובי ומעלה ו-${bad} חלשות. ${best ? `הסקטור החזק: ${rel(best)}, החלש: ${rel(worst)}.` : ''} ציון מצב הרוח ${sc} מתוך 100 (${label}).`;
  const trendTxt = `${spy.checks.above150 && spy.checks.cross !== false ? 'המגמה הראשית חיובית: ' : spy.checks.above150 ? 'המגמה הראשית מעורבת: ' : 'המגמה הראשית שלילית: '}${f.slice(0, 4).join(' · ')}. ${themes[0] ? `הנושא המרכזי בכותרות: ${themes[0].topic} (${themes[0].count} פריטים, נימה ${themes[0].sentiment}).` : ''}`;

  const reasoning = [`ציון מצב הרוח נבנה מנקודות ידועות: ${f.join('; ')}.`, `זוהו ${ex.length} סימולים בטקסטים הטריים (כינוי חברה, $סימול, סימול בסוגריים או טרנד). רק מי שקיים בו מחיר נבדק.`, `המלצות: אזכור בלפחות מקור אחד, ציון משולב מעל 55 ולא אדום במודל א׳. ${picks.length} עמדו בתנאים. קונצנזוס האנליסטים (${Object.keys(AN).length} מניות) מוסיף או מוריד מהדירוג ומהביטחון, ואינו תנאי כניסה.`, `נימת כותרות לפי מילות מפתח באנגלית: ${posN} חיוביות, ${negN} שליליות מתוך ${items.length}.`, 'כל הניתוח נעשה בקוד ובכללים קבועים. אין מודל שפה, ולכן אין המצאת מספרים.'];
  const improve = [...lowSources.map(s => `${s}: לא נטען בהרצה זו`), 'S5FI ו-McClellan אינם זמינים בחינם, לכן שני כללי האסטרטגיה האלה לא נבדקים.', 'סרטוני יוטיוב נקראים לפי כותרת ותיאור בלבד, בלי תמלול.', ...(Object.keys(AN).length ? [] : ['נתוני אנליסטים (יעדי מחיר) לא נטענו בהרצה זו.']), 'ה-13F מציג מי הגיש ולא מה נקנה, ולכן אין ניתוח החזקות.', 'ניתוח נימה לפי מילות מפתח גס: ייתכנו טעויות בכותרות מורכבות.', 'סינון שווי שוק מעל מיליארד ודוחות צמיחה לא נבדק אוטומטית.'];


  // ===== תדריך FALILO: עדשות בלתי תלויות, מדד הסכמה, רמות ותרחישים, מה השתנה =====
  const sg1 = x => clamp(x, -1, 1), ans = Object.values(AN).filter(a => a.stance), anScore = ans.length ? (ans.filter(a => a.stance === 'pos').length - ans.filter(a => a.stance === 'neg').length) / ans.length : null;
  const cTone = (crypto?.read || []).reduce((a, x) => a + (x.tone === 'up' ? 1 : x.tone === 'dn' ? -1 : 0), 0), cN = (crypto?.read || []).length;
  const lenses = [
    { name: 'מגמה טכנית', score: sg1((spy.checks.above150 ? .5 : -.5) + (spy.checks.cross == null ? 0 : spy.checks.cross ? .25 : -.25) + (spy.checks.rsi50 ? .25 : -.25)), note: `S&P ${spy.checks.above150 ? 'מעל' : 'מתחת ל'}־EMA 150, RSI ${n1(spy.rsi)}` },
    { name: 'רוחב שוק', score: sg1((br - .4) * 2.5), note: `${Math.round(br * 100)}% מהנכסים בדירוג חיובי ומעלה` },
    { name: 'תנודתיות', score: vix == null ? 0 : vix < 16 ? .6 : vix < 20 ? .2 : vix < 25 ? -.2 : vix < 30 ? -.6 : -1, note: `VIX ${vix != null ? n1(vix) : '–'}` },
    { name: 'חדשות', score: sg1(newsBias * 5), note: `${posN} כותרות חיוביות מול ${negN} שליליות` },
    ...(anScore != null ? [{ name: 'אנליסטים', score: sg1(anScore), note: `${ans.filter(a => a.stance === 'pos').length} חיוביים, ${ans.filter(a => a.stance === 'neg').length} שליליים מתוך ${ans.length}` }] : []),
    ...(mi.length ? [{ name: 'מאקרו', score: sg1((ok2.length - bad2.length) / mi.length * 1.5), note: `${ok2.length} תומכים, ${bad2.length} מכבידים מתוך ${mi.length}` }] : []),
    ...(cN ? [{ name: 'קריפטו', score: sg1(cTone / cN * 1.5), note: `${crypto.read.filter(x => x.tone === 'up').length} חיוביים, ${crypto.read.filter(x => x.tone === 'dn').length} מדאיגים` }] : []),
  ];
  const mean = lenses.reduce((a, l) => a + l.score, 0) / lenses.length, posL = lenses.filter(l => l.score > .15).length, negL = lenses.filter(l => l.score < -.15).length, agree = Math.round(Math.max(posL, negL) / lenses.length * 100);
  const stance = mean > .25 ? { key: 'on', label: 'שוק חיובי', en: 'RISK-ON' } : mean < -.25 ? { key: 'off', label: 'שוק שלילי', en: 'RISK-OFF' } : { key: 'mid', label: 'שוק מעורב', en: 'NEUTRAL' };
  const agreeLabel = agree >= 75 ? 'הסכמה גבוהה בין העדשות' : agree >= 55 ? 'הסכמה חלקית' : 'העדשות חלוקות';
  // רמות ותרחישים ל-S&P 500
  const px = spy.price, hi60 = Math.max(...(spy.spark || [px])), lo60 = Math.min(...(spy.spark || [px])), d = v => (v / px - 1) * 100, fp = v => '\u200e' + v.toFixed(1), sg2 = v => '\u200e' + sg(v) + '\u200e';
  const levels = [['שיא 60 יום', hi60], ['EMA 50', spy.e50], ['EMA 150', spy.e150], ['פיבונאצ׳י 61.8%', spy.fib?.f618], ['שפל 60 יום', lo60]].filter(([, v]) => v && isFinite(v)).map(([n, v]) => ({ n, v: +v.toFixed(2), d: +d(v).toFixed(1) })).sort((a, b) => b.v - a.v);
  const scen = [];
  if (px < hi60 * .995) scen.push({ tone: 'up', if: `S&P נסגר מעל ${fp(hi60)} (${sg2(d(hi60))})`, then: 'פריצה לשיא 60 יום: המגמה מתחזקת. כללי הפריצה מאפשרים לבחון כניסות במניות המאושרות.' });
  if (spy.checks.above50) scen.push({ tone: 'dn', if: `S&P נסגר מתחת ל-EMA 50 (${fp(spy.e50)}, ${sg2(d(spy.e50))})`, then: 'תחילת תיקון. להדק Stop ולא להוסיף חשיפה.' }); else scen.push({ tone: 'up', if: `S&P חוזר מעל EMA 50 (${fp(spy.e50)}, ${sg2(d(spy.e50))})`, then: 'סימן להתאוששות. מחכים לאישור של יומיים לפחות.' });
  if (spy.checks.above150) scen.push({ tone: 'dn', if: `S&P נסגר מתחת ל-EMA 150 (${fp(spy.e150)}, ${sg2(d(spy.e150))})`, then: 'לפי האסטרטגיה המגמה הראשית נשברת. להימנע מקניות חדשות ולבחון הפחתת סיכון.' }); else scen.push({ tone: 'up', if: `S&P חוזר מעל EMA 150 (${fp(spy.e150)}, ${sg2(d(spy.e150))})`, then: 'כלל המגמה חוזר להיות חיובי.' });
  if (vix != null && vix < 30) scen.push({ tone: 'am', if: `VIX עולה מעל 30 (עכשיו ${n1(vix)})`, then: 'כלל הדיפ הראשון נדלק: פאניקה. בודקים קניית דיפים בזהירות, רק מול כלל המגמה.' });
  // מה השתנה מאז ההרצה הקודמת (השוואה מפורשת, עם הזמן)
  let delta = null; if (prev?.updated && prev.analysis?.mood) {
    const hrs = Math.max(0, Math.round((now - new Date(prev.updated)) / 36e5 * 10) / 10), pp = new Set((prev.analysis.picks || []).map(x => x.ticker)), np = new Set(picks.map(x => x.ticker)), ps = prev.signals || {};
    delta = { sinceH: hrs, moodDelta: sc - (prev.analysis.mood.score ?? sc), added: [...np].filter(t => !pp.has(t)), removed: [...pp].filter(t => !np.has(t)),
      flips: Object.entries(S).filter(([k, v]) => ps[k] && ps[k].verdict !== v.verdict && !['^VIX'].includes(k)).slice(0, 8).map(([k, v]) => ({ t: bare(k), from: ps[k].verdict, to: v.verdict })), spyFlip: ps.SPY && ps.SPY.checks?.above150 !== spy.checks.above150 ? (spy.checks.above150 ? 'S&P חזר מעל EMA 150' : 'S&P ירד מתחת ל-EMA 150') : null };
  }
  // מועמדים ואירועים
  const cands = picks.filter(p => p.triple && p.triple.votes >= Math.min(2, p.triple.avail)).slice(0, 4).map(p => ({ ticker: p.ticker, votes: p.triple.votes, avail: p.triple.avail, conf: p.confidence, upside: p.analyst?.upside ?? null, stop: S[p.ticker.includes('-') ? p.ticker : p.ticker]?.stop ?? null }));
  const evs = earnings.filter(e => e.date <= new Date(now.getTime() + 864e5).toISOString().slice(0, 10)).slice(0, 10).map(e => ({ ticker: e.ticker, date: e.date, note: e.note }));
  const todo = [stance.key === 'on' ? 'התנאים תומכים: אפשר לבחון כניסות לפי הכללים במניות עם 3 מתוך 3 אישורים.' : stance.key === 'off' ? 'התנאים לא תומכים: להפחית סיכון ולא להיכנס נגד המגמה.' : 'התנאים מעורבים: בררנות. רק מניות עם אישור מכל המודלים והאנליסטים.', ...(market.conflict ? ['כללי הדיפ וכלל המגמה סותרים: כלל המגמה קובע זהירות.'] : []), ...(evs.length >= 8 ? [`${evs.length} דוחות מדווחים עד מחר: תנודתיות בודדות צפויה, לא להיכנס ערב דוח.`] : []), ...(agree < 55 ? ['העדשות חלוקות: לא כדאי להסתמך על קריאה אחת.'] : [])];
  // ===== מסקנות סופיות: רק מה ששני המודלים (שלך ושל Falilo) מסכימים עליו =====
  const buyList = [], waitList = [], beware = [];
  const xTxt = c => c && c.daysAgo != null ? (c.state === 'golden' ? `נקודת זהב (EMA 50 חצה מעל 200) לפני ${c.daysAgo} ימים` : `חצייה שלילית (EMA 50 חצה מתחת ל-200) לפני ${c.daysAgo} ימים`) : null;
  for (const p of picks) {
    const st = S[p.ticker]; if (!st) continue; const t = p.triple, an = p.analyst, ck = st.checks;
    const both = t.a === true && t.b === true, one = (t.a === true) !== (t.b === true), anNeg = an?.stance === 'neg', anPos = t.c === true, cPos = t.d === true, cNeg = t.dneg === true;
    const score = (t.a ? 1 : 0) + (t.b ? 1 : 0) + (anPos ? 1 : 0) + (cPos ? 1 : 0), avail = 3 + (an ? 1 : 0);
    const pro = [], con = [], miss = [!ck.above150 && 'מתחת ל-EMA 150', ck.cross === false && 'EMA 50 מתחת ל-200', !ck.rsi50 && 'RSI מתחת ל-50'].filter(Boolean);
    (t.a ? pro : con).push(t.a ? 'הכללים שלך: כל התנאים מתקיימים (מעל EMA 150, RSI מעל 50, EMA 50 מעל 200)' : `הכללים שלך: ${miss.join(', ') || 'אין אישור מלא'}`);
    (t.b ? pro : con).push(t.b ? `מודל Falilo: ציון ${st.oursScore}${st.ours?.rs ? ', חזקה מ-S&P' : ''}` : `מודל Falilo: ציון ${st.oursScore} (מתחת ל-60)`);
    if (an) { const d = `${an.label || ''}${an.n ? `, ${an.n} אנליסטים` : ''}${an.target ? `, יעד $${Math.round(an.target)}` : ''}${an.upside != null ? ` (${an.upside > 0 ? '+' : ''}${an.upside.toFixed(0)}% מהמחיר)` : ''}`; (anPos ? pro : an.stance === 'neg' ? con : []).push(`אנליסטים: ${d}`); if (an.stance === 'mid') con.push(`אנליסטים: ניטרלי. ${d}`); }
    (cPos ? pro : cNeg ? con : con).push(cPos ? `תוכן חיצוני: ${t.dn} אזכורים בחדשות וביוטיוב, נימה לא שלילית` : cNeg ? `תוכן חיצוני: נימה שלילית ב-${t.dn} אזכורים` : `תוכן חיצוני: אזכורים מעטים (${t.dn}), אין אישור`);
    const xt = xTxt(st.cross), golden = st.cross?.state === 'golden' && st.cross.daysAgo != null && st.cross.daysAgo <= 45, death = st.cross?.state === 'death' && st.cross.daysAgo != null && st.cross.daysAgo <= 45;
    if (xt && (golden || death)) (golden ? pro : con).push(xt + ' (יומי)');
    const wc = st.wcross, wGold = wc?.state === 'golden' && wc.weeks != null && wc.weeks <= 12, wDeath = wc?.state === 'death' && wc.weeks != null && wc.weeks <= 12, wBear = wc?.state === 'death';
    if (wGold) pro.push(`נקודת זהב שבועית לפני ${wc.weeks} שבועות: אות חזק לסווינג ולטווח ארוך`);
    else if (wc?.state === 'golden') pro.push('מגמת טווח ארוך חיובית: EMA 50 מעל 200 בנרות שבועיים');
    if (wDeath) con.push(`חצייה שלילית שבועית לפני ${wc.weeks} שבועות`); else if (wBear) con.push('מגמת טווח ארוך שלילית: EMA 50 מתחת ל-200 בנרות שבועיים');
    const row = { ticker: p.ticker, price: +st.price.toFixed(2), support: +st.e150.toFixed(2), supportD: +((st.e150 / st.price - 1) * 100).toFixed(1), target: an?.target ?? null, upside: an?.upside ?? null, analyst: an ? (an.label || null) : null, rsi: +n1(st.rsi), combined: st.combined, v: { rules: !!t.a, falilo: !!t.b, analysts: an ? anPos : null, content: cPos }, score, avail, contentN: t.dn, pro, con, golden: golden ? st.cross.daysAgo : null, wGold: wGold ? wc.weeks : null };
    const strength = score === 4 ? 'חזקה' : score === 3 ? 'טובה' : 'בסיסית';
    if (wDeath) beware.push({ ...row, why: `חצייה שלילית שבועית טרייה (EMA 50 מתחת ל-200, לפני ${wc.weeks} שבועות). זה שינוי מגמה משמעותי לטווח ארוך, גם אם מקורות אחרים חיוביים.` });
    else if (death) beware.push({ ...row, why: `חצייה שלילית טרייה של EMA 50 מתחת ל-200. זה אות מגמה חלש לטווח שבועי-חודשי, גם אם חלק מהמקורות חיוביים.` });
    else if (both && (anNeg || cNeg)) beware.push({ ...row, why: anNeg ? 'שני המודלים חיוביים, אבל האנליסטים שליליים. הפער הזה מחייב בדיקה לפני שמסתמכים על האות.' : 'שני המודלים חיוביים, אבל הנימה בחדשות וביוטיוב שלילית. כדאי לבדוק מה קרה.' });
    else if (both && ck.above150 && st.rsi > 70) waitList.push({ ...row, why: `שני המודלים מסכימים, אבל המחיר כבר רץ (RSI ${n1(st.rsi)}). בסווינג עדיף להמתין לירידה קלה.` });
    else if (both && wBear) waitList.push({ ...row, why: 'שני המודלים חיוביים, אבל בנרות שבועיים EMA 50 עדיין מתחת ל-200. מגמת הטווח הארוך עוד לא התהפכה, ממתינים.' });
    else if (both && ck.above150 && score >= 3) buyList.push({ ...row, strength, why: `הסכמה ${strength}: ${score} מתוך ${avail} מקורות חיוביים${wGold ? `, ונקודת זהב שבועית לפני ${wc.weeks} שבועות` : golden ? `, ו${xt}` : ''}.` });
    else if (both && ck.above150) waitList.push({ ...row, why: 'שני המודלים חיוביים, אבל אין אישור מאנליסטים או מהתוכן החיצוני. מחכים לאישור נוסף.' });
    else if (one) waitList.push({ ...row, why: `אין הסכמה בין המודלים: ${t.a ? 'הכללים שלך חיוביים אבל Falilo לא' : 'Falilo חיובי אבל הכללים שלך לא'}.` });
  }
  // חציית EMA 50/200 בכל הנכסים הנסרקים
  const nmOf = k => k === 'SPY' ? 'S&P 500' : k === 'QQQ' ? 'נאסד״ק 100' : bare(k), ord = { golden: 0, death: 1, nearGolden: 2, nearDeath: 3 }, evs0 = [];
  for (const [k, v] of Object.entries(S)) {
    const w = v.wcross, c = v.cross;
    const kindOf = (x, age, fresh, near) => age != null && age <= fresh ? (x.state === 'golden' ? 'golden' : 'death') : x.converging && Math.abs(x.spreadPct) <= near ? (x.state === 'death' ? 'nearGolden' : 'nearDeath') : null;
    const kw = w && kindOf(w, w.weeks, 12, 2.5), kd = c && kindOf(c, c.daysAgo, 45, 1.5);
    const qa = (x, shortLen) => ({ vol: x.volRatio, volOk: x.volRatio != null ? x.volRatio >= 1.3 : null, choppy: !!x.choppy, whip: x.prevLen != null && x.prevLen < shortLen });
    if (kw) evs0.push({ key: k, ticker: nmOf(k), kind: kw, tf: 'שבועי', age: w.weeks, unit: 'שבועות', date: w.date, spread: w.spreadPct, ...qa(w, 8) });
    else if (kd) evs0.push({ key: k, ticker: nmOf(k), kind: kd, tf: 'יומי', age: c.daysAgo, unit: 'ימים', date: c.date, spread: c.spreadPct, ...qa(c, 20) });
  }
  const crossEvents = evs0.sort((x, y) => (x.tf === y.tf ? 0 : x.tf === 'שבועי' ? -1 : 1) || ord[x.kind] - ord[y.kind] || (x.age ?? 99) - (y.age ?? 99)).slice(0, 8);
  // סטטוס "סגורה": חצייה טרייה מההרצות הקודמות שהתהפכה בחזרה
  const closed = []; for (const e of (prev?.analysis?.brief?.verdict?.crossEvents || [])) { if (!e.key || (e.kind !== 'golden' && e.kind !== 'death')) continue; const st = S[e.key], x = e.tf === 'שבועי' ? st?.wcross : st?.cross; if (!x) continue;
    const flipped = (e.kind === 'golden' && x.state === 'death') || (e.kind === 'death' && x.state === 'golden'); if (flipped && !closed.some(c => c.key === e.key && c.tf === e.tf)) closed.push({ key: e.key, ticker: e.ticker, tf: e.tf, was: e.kind, since: e.date, note: `${e.kind === 'golden' ? 'נקודת הזהב' : 'החצייה השלילית'} (${e.tf}, מ-${e.date || 'לא ידוע'}) התהפכה בחזרה. סימן לאיתות שווא, לא מסתמכים עליה.` }); }
  for (const c of (prev?.analysis?.brief?.verdict?.closed || [])) if (!closed.some(x => x.key === c.key && x.tf === c.tf) && c.at && (now - new Date(c.at)) < 14 * 864e5) closed.push(c);
  for (const c of closed) c.at = c.at || now.toISOString();
  buyList.sort((x, y) => y.score - x.score || y.combined - x.combined);
  for (const a of avoid) beware.push({ ticker: a.ticker, why: a.why.replace(/ סימן לזהירות.*$/, '') });
  const seenB = new Set(); const bewareU = beware.filter(b => !seenB.has(b.ticker) && seenB.add(b.ticker)).slice(0, 6);
  const buyMode = stance.key, buy = buyMode === 'off' ? [] : buyList.slice(0, 5);
  const bottom = buyMode === 'off' ? 'המגמה הכללית של השוק שלילית. גם אם יש מניות טובות, עדיף להמתין.' : buy.length ? `${buy.length} מניות שהכללים שלך, מודל Falilo ולפחות עוד מקור אחד (אנליסטים או חדשות) מסכימים עליהן.${buyMode === 'mid' ? ' המגמה הכללית מעורבת, אז כדאי לצבור בהדרגה.' : ''}` : 'כרגע אין מניה שכל המקורות מסכימים עליה. אין סיבה למהר.';
  // יומן היסטוריה: תמונת מצב יומית, ומעקב אחרי כל מניה שהופיעה ברשימת ההסכמה
  const dayKey = ET || now.toISOString().slice(0, 10), hist = [...(prev?.analysis?.brief?.history || [])].filter(h => h.d !== dayKey);
  hist.push({ d: dayKey, spy: +px.toFixed(2), stance: stance.key, agree, buy: buyList.slice(0, 8).map(x => ({ t: x.ticker, p: x.price, s: x.score })), wait: waitList.slice(0, 6).map(x => x.ticker), beware: bewareU.map(x => x.ticker) }); while (hist.length > 180) hist.shift();
  const trk = {}; for (const h of hist) for (const b of h.buy) { const o = trk[b.t] ||= { t: b.t, first: h.d, p0: b.p, spy0: h.spy, days: 0, last: h.d }; o.days++; o.last = h.d; }
  const lastD = hist[hist.length - 1].d, journal = Object.values(trk).map(o => { const cur = S[o.t]?.price, still = o.last === lastD; return { ticker: o.t, first: o.first, days: o.days, entry: o.p0, now: cur != null ? +cur.toFixed(2) : null, ret: cur != null ? +((cur / o.p0 - 1) * 100).toFixed(1) : null, alpha: cur != null ? +(((cur / o.p0) - (px / o.spy0)) * 100).toFixed(1) : null, still, left: still ? null : o.last }; }).sort((a, b) => (b.still - a.still) || b.days - a.days).slice(0, 12);
  const jsum = journal.filter(j => j.ret != null && j.days >= 1 && !(j.first === lastD)), jstat = jsum.length ? { n: jsum.length, win: jsum.filter(j => j.ret > 0).length, beat: jsum.filter(j => j.alpha > 0).length, avg: +(jsum.reduce((t, j) => t + j.ret, 0) / jsum.length).toFixed(1) } : null;
  const verdict = { closed, journal, jstat, crossEvents, buy, buyMode, wait: waitList.slice(0, 4), beware: bewareU, mktWarn: [], bottom };
  const briefObj = { history: hist, verdict, stance, mean: +mean.toFixed(2), lenses, agree, agreeLabel, levels, price: px, scenarios: scen, delta, candidates: cands, events: evs, todo, at: now.toISOString() };
  const cr = crypto || {};
  const upg = Object.entries(AN).flatMap(([t, a]) => (a.changes || []).filter(c => c.action === 'שדרוג' || c.action === 'הורדה').map(c => ({ ticker: bare(t), ...c }))).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 12);
  return { brief: briefObj, analystMoves: upg, summary, mood: { label, score: sc, why: f.slice(0, 3).join(' · ') }, trend: trendTxt, sectors, picks, avoid, risks, earnings, crypto: { view: cr.view || 'אין נתוני קריפטו בהרצה זו.', btc: cr.btc || '', eth: cr.eth || '' }, institutions, themes, contradictions, watch, reasoning, improve, macroView, tickers: ex.map(e => e.ticker) };
}

// ---- חקירה לאחור לעסקת בקרה שנסגרה ----
export function postMortem(c) {
  const A = c.entryChecks || {}, B = c.entryOurs || {}, on = o => Object.values(o).filter(Boolean).length, win = c.pnl > 0, hit = /Stop/.test(c.why || ''), trend = /EMA 150/.test(c.why || ''), time = /60/.test(c.why || '');
  const miss = [...Object.entries({ 'EMA 50 מעל 200': A.cross, 'RSI מעל 50': A.rsi50, 'פריצה עם נפח': A.breakout }), ['חוזק יחסי מול S&P', B.rs], ['MACD חיובי', B.macd]].filter(([, v]) => v === false || v == null).map(([k]) => k);
  return { summary: `${c.ticker}: ${win ? 'הצלחה' : 'כישלון'} אחרי ${c.days} ימים, תשואה ${sg(c.pnl)}${c.alpha != null ? ` (${sg(c.alpha)} מול S&P)` : ''}. סיבת יציאה: ${c.why}. השיא בדרך ${sg(c.mfe)}, השפל ${sg(c.mae)}.`, worked: `בכניסה עמדו ${on(A)} מתוך 5 כללי מודל א׳ ו-${on(B)} מתוך 5 של מודל ב׳ (ציון ${c.entryScore}).${win ? ' הרוב הזה תאם את התוצאה.' : ''}`, failed: win ? (miss.length ? `לא התקיימו בכניסה: ${miss.join(', ')}, ובכל זאת הצליחה.` : 'אין נקודת כשל בולטת.') : `${miss.length ? 'לא התקיימו בכניסה: ' + miss.join(', ') + '. ' : ''}${c.entryMarket?.risk >= 7 ? 'סיכון השוק בכניסה היה גבוה. ' : ''}${hit ? 'הרצפה נפגעה: ייתכן ש-ATR×2 צר מדי לנכס הזה.' : trend ? 'המגמה נשברה מתחת ל-EMA 150.' : ''}`, lesson: win ? `כניסה עם ${on(A) + on(B)} כללים מתוך 10 עבדה כאן. מדגם אחד אינו הוכחה.` : `${miss.length ? 'כללים חסרים בכניסה הם המועמדים העיקריים להסבר.' : 'הכניסה עמדה בכללים, ולכן ייתכן שהתוצאה מקרית.'} מדגם אחד אינו הוכחה.`, change: win ? 'אין שינוי מוצע לפני שיצטבר מדגם גדול יותר.' : hit && miss.length ? `לבחון דרישה גם ל-${miss[0]} כתנאי כניסה, ולהשוות מול עסקאות עתידיות.` : hit ? 'לבחון Stop רחב יותר (ATR×2.5) לנכסים תנודתיים.' : trend ? 'לבחון אישור של שני ימי סגירה מתחת ל-EMA 150 לפני יציאה.' : time ? 'לבחון יציאה מוקדמת בעסקאות שלא זזו אחרי 30 יום.' : 'אין שינוי מוצע.' };
}
