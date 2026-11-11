// Oren Finance · צינור הנתונים
// איסוף כתמונת מצב אחת ← סינון מידע ישן ← שער איכות ← ניתוח טכני (2 מודלים) ← ניתוח בעברית ← בקרה ← שמירה
// כלל ברזל: או שמתפרסמת תמונת מצב חדשה ושלמה, או שנשארת הקודמת כמות שהיא. אין ערבוב ישן עם חדש.
import fs from 'fs';
import { bars, analyzeFull } from './engine.mjs';
import { updateControl } from './control.mjs';

const T0 = Date.now(), ISO = new Date(T0).toISOString(), AGE_H = { news: 36, video: 72 }, MAX_TICKERS = 80;
const EMAIL = process.env.CONTACT_EMAIL || 'user@example.com';
const UA = { 'User-Agent': `Mozilla/5.0 (compatible; OrenFinance/1.0; ${EMAIL})` };
const old = (() => { try { return JSON.parse(fs.readFileSync('data.json', 'utf8')); } catch { return {}; } })();
const get = async (u, h = {}) => { try { const r = await fetch(u, { headers: { ...UA, ...h }, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(r.status); return await r.text(); } catch (e) { console.error('נכשל:', u, e.message); return ''; } };
const jget = async (u, h) => { try { return JSON.parse(await get(u, h)); } catch { return null; } };
const tag = (s, t) => ((s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
const parts = (x, t) => x.split(new RegExp(`<${t}[ >]`)).slice(1);
const health = [], HL = (name, ok, detail) => health.push({ name, ok, detail }), steps = [], step = (t, d) => steps.push({ t, d });
const dropped = { news: 0, video: 0 };

// 1. איסוף: כל מקור נקרא פעם אחת, ופריט שעבר את גיל המקסימום נזרק ולא נכנס לניתוח
async function rss(name, url, kind, n = 12) {
  const x = await get(url), es = parts(x, 'item').length ? parts(x, 'item') : parts(x, 'entry'), out = [];
  for (const e of es.slice(0, n)) {
    const date = tag(e, 'pubDate') || tag(e, 'published') || tag(e, 'updated'), a = (T0 - new Date(date)) / 36e5; if (isNaN(a)) continue;
    if (a > AGE_H[kind]) { dropped[kind]++; continue; }
    out.push({ src: name, title: tag(e, 'title'), url: tag(e, 'link') || (e.match(/href="([^"]+)"/) || [])[1], date, ageH: Math.max(0, Math.round(a)), desc: (tag(e, 'description') || tag(e, 'media:description')).replace(/<[^>]+>/g, ' ').slice(0, 300) });
  }
  HL(name, es.length > 0, `${out.length} טריים · ${es.length - out.length} ישנים הוסרו`);
  return out;
}
const NEWS = [['CNBC · שווקים', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258'], ['CNBC · השקעות', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839069'], ['CNBC · פיננסים', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664'], ['Yahoo Finance', 'https://finance.yahoo.com/news/rssindex'], ['MarketWatch', 'https://feeds.content.dowjones.io/public/rss/mw_topstories'], ['הפד', 'https://www.federalreserve.gov/feeds/press_all.xml'], ['Cointelegraph', 'https://cointelegraph.com/rss']];
const HANDLES = { 'Micha.Stocks': 'Micha.Stocks', 'Larry Jones': 'stockupwithlarryjones', 'Mark Tilbury': 'marktilbury', 'Chris Sain': 'chrissain1' };
const chan = { marktilbury: 'UCxgAuX3XZROujMmGphN_scA', ...(old.chan || {}) };
async function chanId(h) { if (chan[h]) return chan[h]; const x = await get(`https://www.youtube.com/@${h}`, { 'Accept-Language': 'en', Cookie: 'CONSENT=YES+1; SOCS=CAI' }); return (chan[h] = (x.match(/"externalId":"(UC[\w-]{22})"/) || x.match(/channel_id=(UC[\w-]{22})/) || x.match(/"channelId":"(UC[\w-]{22})"/) || [])[1]); }
const ytJobs = Object.entries(HANDLES).map(async ([name, h]) => { const id = await chanId(h); if (!id) { HL('YouTube · ' + name, false, 'לא נמצא מזהה ערוץ'); return []; } return rss('YouTube · ' + name, `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, 'video', 8); });
const [newsAll, ytAll] = await Promise.all([Promise.all(NEWS.map(([n, u]) => rss(n, u, 'news'))), Promise.all(ytJobs)]);
const seen = new Set(), news = newsAll.flat().filter(i => { const k = i.title.toLowerCase(); return !seen.has(k) && seen.add(k); }).sort((a, b) => a.ageH - b.ageH), yt = ytAll.flat().sort((a, b) => a.ageH - b.ageH);
const items = [...news, ...yt];
const sec = await get('https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=13F-HR&count=25&output=atom', { 'User-Agent': `OrenFinance ${EMAIL}` });
const filings = parts(sec, 'entry').map(e => ({ title: tag(e, 'title'), url: (e.match(/href="([^"]+)"/) || [])[1], date: tag(e, 'updated') })); HL('SEC 13F', filings.length > 0, filings.length + ' הגשות');
const earnings = (await get('https://www.earningswhispers.com/')).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000); HL('Earnings Whispers', earnings.length > 300, earnings.length > 300 ? 'נטען' : 'ריק');
const prices = (await jget('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true')) || {};
let whales = []; if (process.env.WHALE_ALERT_KEY) { const j = await jget(`https://api.whale-alert.io/v1/transactions?api_key=${process.env.WHALE_ALERT_KEY}&min_value=5000000&start=${Math.floor(T0 / 1000) - 7200}`); whales = (j?.transactions || []).filter(t => ['btc', 'eth'].includes(t.symbol)).slice(0, 15).map(t => ({ symbol: t.symbol.toUpperCase(), amount: Math.round(t.amount), usd: Math.round(t.amount_usd), from: t.from.owner_type + (t.from.owner ? ':' + t.from.owner : ''), to: t.to.owner_type + (t.to.owner ? ':' + t.to.owner : ''), time: t.timestamp })); }
const fg = await jget('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', { Accept: 'application/json', Referer: 'https://edition.cnn.com/' }), fng = fg?.fear_and_greed ? { value: Math.round(fg.fear_and_greed.score), label: fg.fear_and_greed.rating } : null; HL('פחד וחמדנות (CNN)', !!fng, fng ? fng.value + ' · ' + fng.label : 'לא זמין');
const cf = (await jget('https://api.alternative.me/fng/'))?.data?.[0], cfng = cf ? { value: +cf.value, label: cf.value_classification } : null; HL('פחד וחמדנות קריפטו', !!cfng, cfng ? cfng.value + '' : 'לא זמין');
const trend = ((await jget('https://query1.finance.yahoo.com/v1/finance/trending/US?count=25'))?.finance?.result?.[0]?.quotes || []).map(q => q.symbol); HL('Yahoo · טרנדים', trend.length > 0, trend.length + ' סימולים');
// מאקרו: דוחות כלכליים אחרונים מ-FRED (CSV ציבורי, ללא מפתח). הסטטוס והמשמעות מחושבים בקוד לפי כללים קבועים, לא ממודל
const fred = async id => (await get(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${new Date(T0).getUTCFullYear() - 2}-01-01`)).trim().split('\n').slice(1).map(l => l.split(',')).filter(r => r[1] && !isNaN(+r[1])).map(r => ({ d: r[0], v: +r[1] }));
const [sCpi, sCore, sUn, sPay, sFf, sY10, sCv] = await Promise.all(['CPIAUCSL', 'CPILFESL', 'UNRATE', 'PAYEMS', 'DFF', 'DGS10', 'T10Y2Y'].map(fred));
const mItems = [], mon = d => d.slice(0, 7), yoyAt = (a, i = 0) => (a.length > 13 + i ? (a.at(-1 - i).v / a.at(-13 - i).v - 1) * 100 : null);
for (const [key, name, s, what] of [['cpi', 'אינפלציה (CPI)', sCpi, 'מדד המחירים לצרכן: קצב עליית המחירים בשנה האחרונה. הפד שואף ל-2% בשנה.'], ['core', 'אינפלציית ליבה', sCore, 'אינפלציה בלי מזון ואנרגיה התנודתיים. משקפת את המגמה העמוקה, והפד עוקב אחריה מקרוב.']]) {
  const y = yoyAt(s), p = yoyAt(s, 1); if (y == null) continue;
  const tone = y > 3.5 ? 'dn' : y > 2.5 ? 'am' : 'up', dir = p == null ? '' : y > p + .05 ? 'עולה' : y < p - .05 ? 'יורדת' : 'יציבה';
  mItems.push({ key, name, value: y.toFixed(1) + '%', detail: `חודשי ${((s.at(-1).v / s.at(-2).v - 1) * 100).toFixed(2)}%${p == null ? '' : ` · בחודש הקודם ${p.toFixed(1)}% (${dir})`}`, status: y > 3.5 ? 'גבוהה מאוד' : y > 2.5 ? 'מעל יעד הפד' : 'קרובה ליעד', tone, what, asOf: mon(s.at(-1).d),
    impact: tone === 'dn' ? 'אינפלציה גבוהה מקשה על הפד להוריד ריבית. ריבית גבוהה לאורך זמן בדרך כלל לוחצת על מניות צמיחה ועל אג"ח.' : tone === 'am' ? 'אינפלציה מעל היעד משאירה את הפד זהיר, והורדות ריבית פחות סבירות עד שהיא יורדת.' : 'אינפלציה קרובה ליעד נותנת לפד מרחב להוריד ריבית, וזה בדרך כלל תומך במניות.' });
}
if (sUn.length > 1) { const v = sUn.at(-1).v, p = sUn.at(-2).v, dl = v - p, tone = v >= 5 ? 'dn' : dl >= .2 ? 'am' : 'up';
  mItems.push({ key: 'unemp', name: 'אבטלה', value: v.toFixed(1) + '%', detail: `בחודש הקודם ${p.toFixed(1)}%`, status: v >= 5 ? 'גבוהה' : dl >= .2 ? 'עולה' : dl <= -.2 ? 'יורדת' : 'יציבה', tone, what: 'שיעור המובטלים מכוח העבודה בארה"ב. מדד מרכזי לחוזק הכלכלה.', asOf: mon(sUn.at(-1).d),
    impact: tone === 'dn' ? 'אבטלה גבוהה מעלה חשש מהאטה. זה מגדיל את הסיכוי להורדת ריבית, אבל פוגע בצריכה וברווחי חברות.' : tone === 'am' ? 'עלייה באבטלה היא סימן ראשון להתקררות. השוק יבדוק אם זו מגמה.' : 'שוק עבודה יציב תומך בצריכה ובצמיחה, אבל עלול להשאיר את הפד זהיר בהורדת ריבית.' }); }
if (sPay.length > 1) { const ch = sPay.at(-1).v - sPay.at(-2).v, tone = ch < 50 ? 'dn' : ch < 150 ? 'am' : 'up';
  mItems.push({ key: 'jobs', name: 'משרות חדשות (Payrolls)', value: (ch >= 0 ? '+' : '') + Math.round(ch) + 'K', detail: 'שינוי חודשי באלפי משרות', status: ch < 0 ? 'ירידה במשרות' : ch < 50 ? 'חלש' : ch < 150 ? 'מתון' : 'חזק', tone, what: 'שינוי חודשי במספר המשרות במשק האמריקאי. מדד מרכזי לבריאות הכלכלה, ומתעדכן לעיתים בדיעבד.', asOf: mon(sPay.at(-1).d),
    impact: tone === 'dn' ? 'יצירת משרות חלשה מעלה חשש מהאטה ומחזקת ציפיות להורדת ריבית. השוק עלול להגיב בשלילה אם החשש הוא מהאטה חדה.' : tone === 'am' ? 'יצירת משרות מתונה מתאימה לכלכלה שמתקררת בהדרגה, ובדרך כלל לא מטלטלת את השוק.' : 'יצירת משרות חזקה תומכת בצמיחה, אבל עלולה להרחיק הורדות ריבית.' }); }
if (sFf.length) { const v = sFf.at(-1).v, o = (sFf.at(-91) || sFf[0]).v, dl = v - o, tone = dl <= -.2 ? 'up' : dl >= .2 ? 'dn' : 'am';
  mItems.push({ key: 'fed', name: 'ריבית הפד', value: v.toFixed(2) + '%', detail: `לפני כשלושה חודשים ${o.toFixed(2)}%`, status: dl <= -.2 ? 'בהורדות' : dl >= .2 ? 'בהעלאות' : 'ללא שינוי', tone, what: 'ריבית הפדרל ריזרב: מחיר הכסף במשק. קובעת את עלות האשראי והמשכנתאות.', asOf: sFf.at(-1).d,
    impact: 'ריבית גבוהה מייקרת אשראי ומקשה על הערכות שווי של מניות צמיחה. הורדות ריבית בדרך כלל תומכות בשוק.' }); }
if (sY10.length) { const v = sY10.at(-1).v, o = (sY10.at(-22) || sY10[0]).v, dl = v - o, tone = v >= 4.75 ? 'dn' : v >= 4 || dl >= .25 ? 'am' : 'up';
  mItems.push({ key: 'y10', name: 'תשואת אג"ח ל-10 שנים', value: v.toFixed(2) + '%', detail: `לפני כחודש ${o.toFixed(2)}%`, status: v >= 4.75 ? 'גבוהה' : v >= 4 || dl >= .25 ? 'מוגבהת' : 'נמוכה יחסית', tone, what: 'מחיר הכסף לטווח ארוך, ובסיס לתמחור מניות ומשכנתאות.', asOf: sY10.at(-1).d,
    impact: 'תשואה גבוהה מתחרה במניות על כסף ומכבידה על הערכות שווי. תשואה יורדת בדרך כלל מקלה על השוק.' }); }
if (sCv.length) { const v = sCv.at(-1).v, tone = v < 0 ? 'dn' : v < .3 ? 'am' : 'up';
  mItems.push({ key: 'curve', name: 'עקום תשואות (10 מול 2 שנים)', value: (v >= 0 ? '+' : '') + v.toFixed(2) + '%', detail: 'תשואת 10 שנים פחות תשואת 2 שנים', status: v < 0 ? 'הפוך' : v < .3 ? 'שטוח' : 'תקין', tone, what: 'הפרש התשואות בין אג"ח ל-10 שנים ל-2 שנים. עקום הפוך היה בעבר סימן מקדים להאטה, אבל התזמון לא קבוע.', asOf: sCv.at(-1).d,
    impact: tone === 'dn' ? 'עקום הפוך משדר חשש מהאטה עתידית, ולכן נחשב אות אזהרה.' : tone === 'am' ? 'עקום שטוח מעיד על אי ודאות לגבי הכיוון הכלכלי.' : 'עקום תקין מעיד על ציפיות לצמיחה רגילה.' }); }
const macro = { items: mItems, at: ISO }, macroBrief = mItems.map(x => ({ name: x.name, value: x.value, status: x.status, detail: x.detail }));
HL('מאקרו (FRED)', mItems.length >= 5, `${mItems.length}/7 מדדים`); step('מאקרו', `${mItems.length} דוחות כלכליים אחרונים מ-FRED, עם סטטוס לפי כללים קבועים`);
// /מאקרו
step('איסוף', `${items.length} פריטים טריים מ-${new Set(items.map(i => i.src)).size} מקורות, נקראו כולם באותה הרצה (${ISO.slice(11, 16)} UTC)`);
step('סינון רעננות', `הוסרו ${dropped.news} כתבות ישנות מ-${AGE_H.news} שעות ו-${dropped.video} סרטונים ישנים מ-${AGE_H.video} שעות`);

// 2. שפה: חילוץ סימולים (Gemini חינמי)
let llmErr = '';
async function llm(prompt, max = 6000) {
  const key = process.env.GEMINI_API_KEY; if (!key) { llmErr = 'הסוד GEMINI_API_KEY ריק או לא הוגדר ב-GitHub'; return null; }
  const models = [...new Set([process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean))];
  const errs = [];
  for (const m of models) { // אם מודל לא קיים או חרג ממכסה, מנסים את הבא
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(90000), body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: max } }) });
      const j = await r.json(); if (!r.ok) throw new Error(`${m}: ${r.status} ${(j.error?.message || '').slice(0, 140)}`);
      const t = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''; const out = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); llmErr = ''; return out;
    } catch (e) { errs.push(e.message); console.error('LLM:', e.message); }
  }
  llmErr = errs.join(' | ').slice(0, 500); return null;
}
const digest = items.slice(0, 140).map(i => `[${i.src}|${i.ageH}ש׳] ${i.title}. ${i.desc.slice(0, 140)}`).join('\n').slice(0, 16000);
const ext = (await llm(`Extract every US-listed stock ticker (plus BTC and ETH) discussed in the texts below, mapping company names to tickers. JSON only: {"tickers":["AAPL"]}. Max 60.
${digest}`, 8000))?.tickers || []; HL('חילוץ סימולים (Gemini)', ext.length > 0, ext.length ? ext.length + ' סימולים' : (llmErr || 'לא הוחזרו סימולים'));
const tags = new Set(); for (const x of items) for (const m of (x.title + ' ' + x.desc).matchAll(/\$([A-Z]{1,5})\b/g)) tags.add(m[1]);
const norm = t => String(t).toUpperCase().replace(/^BTC$/, 'BTC-USD').replace(/^ETH$/, 'ETH-USD'), okT = t => /^[A-Z]{1,5}(-USD)?$/.test(t) || t === '^VIX';
const wl = [...new Set(['SPY', 'QQQ', '^VIX', 'BTC-USD', 'ETH-USD', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', ...(old.control?.open || []).map(p => p.ticker), ...ext, ...trend, ...tags].map(norm))].filter(okT).slice(0, MAX_TICKERS);

// 3. ניתוח טכני: מודל א׳ (כללי האסטרטגיה שלך) ומודל ב׳ (Oren Finance)
const B = {}, S = {}; let bench = null;
const R = {}; { let i = 0; await Promise.all(Array.from({ length: 8 }, async () => { while (i < wl.length) { const sym = wl[i++]; R[sym] = await bars(sym); } })); } // 8 במקביל, עם מגבלת זמן לכל בקשה
for (const sym of wl) { const r = R[sym]; if (r) { B[sym] = r.bars; S[sym] = { ...analyzeFull(r.bars, bench), src: r.src }; if (sym === 'SPY') bench = S.SPY.ret63; } }
const spyAge = S.SPY ? (T0 - new Date(S.SPY.date)) / 864e5 : 99;
HL('מחירים (Yahoo / Stooq)', Object.keys(S).length >= wl.length * .7, `${Object.keys(S).length}/${wl.length} נכסים`); HL('עדכניות מחירים', spyAge <= 5, S.SPY ? 'סגירה אחרונה ' + S.SPY.date : 'אין נתון');

// שער איכות: אם נכשל, התמונה הקודמת נשארת שלמה
const why = [];
if (spyAge > 5) why.push('מחירי S&P 500 חסרים או ישנים'); if (items.length < 15) why.push('פחות מ-15 פריטים טריים'); // יוטיוב שלא נטען אינו פוסל את ההרצה: הוא מסומן באדום בבדיקת התקינות ובאזהרה בראש הדף
if (why.length) { fs.writeFileSync('data.json', JSON.stringify({ ...old, lastRun: { ok: false, at: ISO, reasons: why }, health }, null, 1)); console.log('נדחה בשער האיכות:', why.join(', ')); process.exit(0); }
step('שער איכות', 'עבר: מחירים עדכניים ומקורות מספיקים. התמונה החדשה מחליפה את הקודמת במלואה');
step('ניתוח טכני', `${Object.keys(S).length} נכסים (ללא הגבלה מלאכותית, תקרה ${MAX_TICKERS}) נבדקו בשני מודלים: א׳ כללי האסטרטגיה, ב׳ Oren Finance`);

const spy = S.SPY, qqq = S.QQQ, vix = S['^VIX']?.price;
const rules = [{ label: 'VIX מעל 30', state: vix == null ? null : vix > 30, value: vix?.toFixed(1) }, { label: 'פחד וחמדנות מתחת ל-10', state: fng ? fng.value < 10 : null, value: fng?.value }, { label: '3 ימים אדומים ברצף', state: spy || qqq ? !!(spy?.reds || qqq?.reds) : null }, { label: 'S5FI מתחת ל-20', state: null }];
const trendR = [{ label: 'S&P 500 מעל EMA 150', state: spy.checks.above150 }, { label: 'S&P 500: EMA 50 מעל 200', state: spy.checks.cross }, { label: 'נאסד"ק 100 מעל EMA 150', state: qqq ? qqq.checks.above150 : null }, { label: 'McClellan מעל 0', state: null }];
let risk = 5; if (vix > 30) risk += 2; else if (vix > 22) risk += 1; if (!spy.checks.above150) risk += 1; if (spy.checks.cross === false) risk += 1; if (spy.checks.above150 && spy.checks.cross && vix < 16) risk -= 1; if (fng && fng.value > 80) risk += 1;
const dip = rules.filter(r => r.state === true).length, market = { rules, trend: trendR, dip, risk: Math.max(1, Math.min(10, risk)), conflict: dip > 0 && !spy.checks.above150, fng, cfng, vix: vix ?? null, date: spy.date };

// 4. ניתוח בעברית: מבוסס רק על המידע הטרי ועל תוצאות הבדיקה הטכנית
const compact = Object.fromEntries(Object.entries(S).map(([k, v]) => [k, { price: +v.price.toFixed(2), verdict: v.verdict, score: v.combined, a: v.checks, b: v.ours }]));
const analysis = await llm(`אתה אנליסט שוק ההון בכיר של Oren Finance. היום ${ISO.slice(0, 10)}. כל המידע נאסף באותה הרצה ורק מהשעות האחרונות. החזר JSON בלבד, כל הטקסט בעברית, במבנה:
{"summary":"3-4 משפטים","mood":{"label":"עולה|יורד|מעורב","score":0-100,"why":""},"trend":"לאן המגמה הולכת, 2-3 משפטים","sectors":[{"name":"","score":-100..100,"note":""}],"picks":[{"ticker":"","name":"","thesis":"","catalyst":"מה במקורות תומך בזה","risk":"","confidence":"נמוכה|בינונית|גבוהה"}],"avoid":[{"ticker":"","why":""}],"risks":[{"title":"","detail":"","level":1-3}],"earnings":[{"ticker":"","date":"YYYY-MM-DD","note":""}],"crypto":{"view":"ביטקוין ואת'ריום מול הלווייתנים","btc":"","eth":""},"institutions":"מה עולה מ-13F ובאיזה איחור","themes":[{"topic":"","tickers":[],"sources":[],"sentiment":"חיובי|שלילי|מעורב"}],"contradictions":[""],"watch":[""],"reasoning":["איך הגעת למסקנות, 4-6 נקודות"],"improve":["איזה מידע חסר או חלש בהרצה הזו"],"macroView":"2-3 משפטים: מה מצב הדוחות הכלכליים האחרונים (אינפלציה, תעסוקה, ריבית) ומה המשמעות לשוק המניות, על בסיס macro בלבד"}
כללים: picks רק מטיקרים שקיימים ב-signals ושמוזכרים גם במקורות, ללא הגבלת כמות מלאכותית. אל תחשב ואל תמציא מספרים טכניים, הסתמך על a (מודל א׳) ו-b (מודל ב׳) ועל verdict. earnings רק מהיום והלאה. אם market.conflict=true הסבר את הסתירה בין כללי הדיפ לכללי המגמה. זה כלי מחקר ולא ייעוץ השקעות.
נתונים: ${JSON.stringify({ macro: macroBrief, market, signals: compact, earnings, prices, whales, filings: filings.slice(0, 15) })}
מקורות (שם|גיל בשעות):\n${digest}`, 16000);
step('ניתוח בעברית', analysis ? 'Gemini כתב סיכום ורעיונות על בסיס המקורות והבדיקה הטכנית בלבד' : `לא הופעל: ${llmErr || 'סיבה לא ידועה'}. מוצגים רק הכללים הטכניים`);

// 5. בקרה ודוחות חקירה לאחור
const { ctrl, done } = updateControl(old.control, B, S, (analysis?.picks || []).map(p => norm(p.ticker)), { risk: market.risk, vix: market.vix, dip });
const op = ctrl.open[0]; if (op && !op.thesis) op.thesis = analysis?.picks?.find(p => norm(p.ticker) === op.ticker)?.thesis || 'נבחרה כי עמדה בשני המודלים הטכניים';
for (const c of done) {
  const slim = { ticker: c.ticker, outcome: c.outcome, pnl: c.pnl, alpha: c.alpha, days: c.days, why: c.why, mfe: c.mfe, mae: c.mae, entry: { a: c.entryChecks, b: c.entryOurs, score: c.entryScore, market: c.entryMarket }, exit: { a: c.exitChecks, market: c.exitMarket } };
  c.lesson = await llm(`בצע חקירה לאחור בעברית על עסקת בקרה היפותטית שנסגרה: מה בתנאי הכניסה הסביר את התוצאה. JSON: {"summary":"מה קרה","worked":"מה עבד","failed":"מה לא עבד","lesson":"הלקח","change":"שינוי קונקרטי מוצע בכללים"}\n${JSON.stringify(slim)}`, 4000) || { lesson: 'לא נוצר ניתוח' };
}
step('בקרה', `${ctrl.open.length ? 'עסקת מעקב פעילה: ' + op.ticker : 'אין מניה מתאימה לעסקת בקרה'}${done.length ? ` · נסגרו ${done.length} עסקאות והופקו דוחות` : ''}`);
fs.writeFileSync('data.json', JSON.stringify({ updated: ISO, lastRun: { ok: true, at: ISO }, chan, prices, whales, news, yt, filings, signals: S, market, macro: mItems.length ? macro : old.macro, analysis, control: ctrl, health, meta: { steps, seconds: Math.round((Date.now() - T0) / 1000), llmError: analysis ? '' : llmErr } }));
console.log('data.json עודכן');
