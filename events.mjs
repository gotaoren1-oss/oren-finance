// FALILO RADAR · אירועי הנהלה והחלטות חברה
// מקורות: (1) דיווחי 8-K רשמיים ל-SEC (סעיפים של שינויי הנהלה ואירועים מהותיים), (2) כותרות חדשות שכבר נאספות.
// זה סיווג לפי כללים (בלי מודל שפה): אירוע, טון וקישור למקור. ההשלכות על חברות קשורות מוצגות כ"לבדיקה", לא כוודאות.
import { extractTickers } from './analyst.mjs';

export const KIND_HE = { leadership: 'שינוי בהנהלה', legal: 'חקירה / משפט', guidance: 'תחזית', capital: 'הקצאת הון והשקעות', deal: 'עסקה / רכישה', funding: 'גיוס הון / חוב', distress: 'סיכון פיננסי' };

// כללי סיווג לכותרות. הסדר חשוב: הראשון שמתאים קובע את הסוג, והטון נקבע לפי המילים.
const RULES = [
  { kind: 'leadership', re: /\b(resigns?|resigned|resignation|steps? down|stepping down|stepped down|ousted|fired|dismissed|abruptly (?:leaves|departs|exits)|interim (?:ceo|cfo|chief)|acting (?:ceo|cfo)|names? (?:new )?(?:ceo|cfo|chief executive|chairman)|appoints? (?:new )?(?:ceo|cfo|chief executive|chairman)|new ceo|ceo (?:to retire|retire[sd]?|exit|departure|succession)|founder .{0,30}(?:leaves|exits|resigns))\b/i,
    neg: /\b(resign|steps? down|stepping down|stepped down|ousted|fired|dismissed|abrupt|interim|acting|scandal|misconduct|exit)/i, pos: /\b(names? new|appoints? new|new ceo|succession)\b/i },
  { kind: 'legal', re: /\b(probe|investigation|investigating|subpoena|lawsuit|sues?|sued|class action|sec charges|charged|fraud|indict|antitrust|fined|fine of|recall|whistleblower|settle(?:s|ment)|raid)\b/i, neg: /./ },
  { kind: 'distress', re: /\b(bankruptcy|chapter 11|going concern|default(?:s|ed)?|delist|restat(?:e|ement)|non-reliance|material weakness|cyber ?attack|data breach|layoffs?|job cuts?|cuts? \d+% of (?:its )?workforce)\b/i, neg: /./ },
  { kind: 'guidance', re: /\b((?:cuts?|lowers?|slashes?|raises?|boosts?|lifts?|hikes?|reaffirms?|withdraws?|suspends?|warns?).{0,30}(?:guidance|forecast|outlook|view|targets?)|profit warning|revenue warning|(?:guidance|outlook|forecast) (?:cut|raise|boost|lowered|raised))\b/i,
    neg: /\b(cuts?|lowers?|slashes?|withdraws?|suspends?|warns?|warning|lowered|miss)\b/i, pos: /\b(raises?|boosts?|lifts?|hikes?|raised|tops?|beat)\b/i },
  { kind: 'capital', re: /\b(buybacks?|repurchase|share repurchase|dividend|pauses?|halts?|scales? back|pulls? back|(?:cuts?|slashes?|trims?) (?:capex|capital spending|spending|investment|investments)|no longer plans? to|plans? to invest|commits? \$|to invest \$|invest(?:s|ing)? (?:up to |more than )?\$\d|expands? (?:investment|capacity)|capex)\b/i,
    neg: /\b(pauses?|halts?|scales? back|pulls? back|cuts?|slashes?|trims?|no longer|suspends?|ends?)\b/i, pos: /\b(buybacks?|repurchase|raises? dividend|increases? dividend|plans? to invest|commits?|to invest|expands?|invest(?:s|ing))\b/i },
  { kind: 'funding', re: /\b(share (?:sale|offering)|stock offering|public offering|secondary offering|convertible (?:notes|bonds|debt)|debt offering|raises? \$\d|raising \$\d|at-the-market|financing (?:to|for) customers|vendor financing|credit facility)\b/i, neg: /\b(offering|share sale|convertible|dilut)\b/i },
  { kind: 'deal', re: /\b(to acquire|acquires?|acquisition of|agrees? to buy|to buy|takeover|merger|merge with|spin[- ]?off|divest|to sell (?:its|unit|division)|buyout)\b/i },
];

// סעיפי 8-K מהותיים (רשמי). 2.02 (דוחות) ו-7.01/8.01 לא נכללים כי הם רועשים.
export const SEC_ITEMS = {
  '5.02': { kind: 'leadership', tone: 'mixed', he: 'שינוי בהנהלה או בדירקטוריון (פרישה, מינוי או שינוי תנאים)' },
  '1.01': { kind: 'deal', tone: 'mixed', he: 'הסכם מהותי חדש' },
  '1.02': { kind: 'deal', tone: 'neg', he: 'סיום הסכם מהותי' },
  '1.03': { kind: 'distress', tone: 'neg', he: 'פשיטת רגל או כינוס נכסים' },
  '1.05': { kind: 'distress', tone: 'neg', he: 'אירוע סייבר מהותי' },
  '2.04': { kind: 'distress', tone: 'neg', he: 'האצת חוב או אירוע ברמת הלוואה' },
  '2.05': { kind: 'distress', tone: 'neg', he: 'עלויות פיטורים או מיזוג פעילות' },
  '2.06': { kind: 'distress', tone: 'neg', he: 'ירידת ערך מהותית' },
  '3.01': { kind: 'distress', tone: 'neg', he: 'הודעה על סיכון להסרה מהמסחר' },
  '4.02': { kind: 'distress', tone: 'neg', he: 'אי-הסתמכות על דוחות כספיים קודמים (תיקון דוחות)' },
};

// מפת קשרים ידנית בין חברות גדולות: לבדיקה בלבד, לא תחזית.
export const REL = {
  NVDA: { cust: ['MSFT', 'META', 'AMZN', 'GOOGL', 'CRWV', 'NBIS', 'ORCL'], comp: ['AMD', 'AVGO', 'INTC'], sup: ['TSM', 'MU', 'ASML'] },
  AMD: { cust: ['MSFT', 'META', 'AMZN'], comp: ['NVDA', 'INTC', 'AVGO'], sup: ['TSM'] },
  AVGO: { cust: ['GOOGL', 'META', 'AAPL'], comp: ['NVDA', 'AMD', 'MRVL'], sup: ['TSM'] },
  INTC: { cust: ['DELL', 'HPQ'], comp: ['AMD', 'NVDA', 'TSM'], sup: [] },
  TSM: { cust: ['NVDA', 'AMD', 'AAPL', 'AVGO'], comp: ['INTC'], sup: ['ASML'] },
  MU: { cust: ['NVDA', 'AAPL'], comp: ['WDC'], sup: [] },
  MSFT: { cust: [], comp: ['GOOGL', 'AMZN', 'ORCL'], sup: ['NVDA'] },
  GOOGL: { cust: [], comp: ['MSFT', 'META', 'AMZN'], sup: ['NVDA', 'AVGO'] },
  AMZN: { cust: [], comp: ['MSFT', 'GOOGL', 'WMT'], sup: ['NVDA'] },
  META: { cust: [], comp: ['GOOGL', 'SNAP', 'PINS'], sup: ['NVDA', 'AVGO'] },
  AAPL: { cust: [], comp: ['MSFT', 'GOOGL'], sup: ['TSM', 'AVGO'] },
  TSLA: { cust: [], comp: ['GM', 'F', 'RIVN'], sup: ['NVDA'] },
  CRWV: { cust: ['MSFT', 'META'], comp: ['NBIS', 'ORCL'], sup: ['NVDA'] },
  NBIS: { cust: [], comp: ['CRWV', 'ORCL'], sup: ['NVDA'] },
  ORCL: { cust: [], comp: ['MSFT', 'AMZN', 'GOOGL'], sup: ['NVDA'] },
  PLTR: { cust: [], comp: ['SNOW', 'MSFT'], sup: [] },
};
const REL_HE = { cust: 'לקוחות', comp: 'מתחרות', sup: 'ספקים' };
const REL_NOTE = {
  neg: { cust: 'לבדוק חשיפה לספק שנמצא בבעיה', comp: 'לפעמים נהנות מהשינוי', sup: 'לבדוק תלות בלקוח' },
  pos: { cust: 'לבדוק אם נהנות מהחדשות', comp: 'לפעמים נפגעות יחסית', sup: 'לבדוק אם נהנות מהביקוש' },
  mixed: { cust: 'לבדוק חשיפה', comp: 'לבדוק השפעה', sup: 'לבדוק חשיפה' },
};

const txt = i => `${i.title || ''}. ${i.desc || i.summary || ''}`.replace(/<[^>]+>/g, ' ');

// מסווג כותרת אחת. מחזיר null כשאין אירוע מהסוגים שמעניינים אותנו.
export function classify(text) {
  for (const r of RULES) {
    if (!r.re.test(text)) continue;
    const neg = r.neg ? r.neg.test(text) : false, pos = r.pos ? r.pos.test(text) : false;
    let tone = neg && !pos ? 'neg' : pos && !neg ? 'pos' : 'mixed';
    // טיפול בניסוחים מבלבלים: "raises" בגיוס הון הוא לא חיובי
    if (r.kind === 'funding' && tone === 'pos') tone = 'mixed';
    return { kind: r.kind, tone };
  }
  return null;
}

// אירועי חדשות: מכותרות טריות. כל אירוע קשור לחברות שזוהו בכותרת.
export function newsEvents(items, { maxAgeH = 72 } = {}) {
  const out = [];
  for (const i of items) {
    if (i.ageH != null && i.ageH > maxAgeH) continue; if (/youtube|video|yt/i.test(i.type || '')) continue;
    const t = txt(i), c = classify(i.title || t); if (!c) continue;
    const tk = extractTickers([i]).map(x => x.ticker).filter(x => !/-USD$/.test(x));
    if (!tk.length && c.kind !== 'leadership') continue; if (!tk.length) continue;
    out.push({ source: 'news', kind: c.kind, tone: c.tone, tickers: tk.slice(0, 4), title: i.title, url: i.url || i.link || null, src: i.src || i.source || '', ageH: i.ageH ?? null, official: false });
  }
  return out;
}

// פענוח JSON של data.sec.gov/submissions: מחזיר דיווחי 8-K טריים עם סעיפים מהותיים
export function parseSubmissions(j, ticker, now = Date.now(), maxAgeH = 96) {
  const r = j?.filings?.recent; if (!r?.form) return []; const out = [];
  for (let k = 0; k < r.form.length; k++) {
    if (r.form[k] !== '8-K' && r.form[k] !== '8-K/A') continue; const d = r.filingDate?.[k], age = d ? (now - new Date(d + 'T23:59:59Z')) / 36e5 : null;
    if (age == null || age > maxAgeH) continue; const items = String(r.items?.[k] || '').split(',').map(s => s.trim()).filter(x => SEC_ITEMS[x]);
    if (!items.length) continue; const acc = String(r.accessionNumber?.[k] || '').replace(/-/g, ''), cik = String(+j.cik);
    for (const it of items) { const m = SEC_ITEMS[it]; out.push({ source: 'sec', kind: m.kind, tone: m.tone, tickers: [ticker], title: `\u200e8-K\u200e סעיף ${it}: ${m.he}`, url: acc ? `https://www.sec.gov/Archives/edgar/data/${cik}/${acc}/` : null, src: 'SEC EDGAR', ageH: Math.max(0, Math.round(age)), official: true, item: it, filed: d }); }
  }
  return out;
}

// מיזוג אירועים: אותו סימול ואותו סוג = אירוע אחד. מקור רשמי או כמה כלי תקשורת מעלים ביטחון.
export function merge(list, S = {}, prev = [], now = Date.now()) {
  const m = new Map(), pm = new Map((prev || []).map(e => [e.id, e]));
  for (const e of list) for (const t of e.tickers.slice(0, 1)) { // האירוע שייך לסימול הראשון (החברה המרכזית בכותרת)
    const id = `${t}|${e.kind}`, r = m.get(id) || { id, ticker: t, kind: e.kind, tone: e.tone, tickers: new Set(), srcs: new Set(), links: [], official: false, ageH: e.ageH, titles: [] };
    for (const x of e.tickers) r.tickers.add(x); r.srcs.add(e.src); r.official ||= e.official; r.ageH = Math.min(r.ageH ?? 999, e.ageH ?? 999);
    if (e.tone !== 'mixed' && r.tone === 'mixed') r.tone = e.tone; else if (e.tone !== 'mixed' && e.tone !== r.tone) r.tone = 'mixed';
    if (r.links.length < 3 && !r.links.some(l => l.title === e.title)) r.links.push({ title: e.title, url: e.url, src: e.src, official: e.official, ageH: e.ageH }); m.set(id, r);
  }
  return [...m.values()].map(r => {
    const st = S[r.ticker], p = pm.get(r.id), seen = p?.firstSeen || new Date(now).toISOString(), p0 = p?.p0 ?? (st ? +st.price.toFixed(2) : null);
    const rel = REL[r.ticker], related = []; if (rel) for (const [g, n] of [['cust', 3], ['comp', 3], ['sup', 2]]) for (const t of rel[g].slice(0, n)) related.push({ t, rel: REL_HE[g], note: REL_NOTE[r.tone]?.[g] || REL_NOTE.mixed[g], chg: S[t] ? +S[t].chg.toFixed(1) : null });
    const others = [...r.tickers].filter(t => t !== r.ticker).map(t => ({ t, rel: 'מוזכרת באותה כתבה', note: 'נקשרה באותו אירוע', chg: S[t] ? +S[t].chg.toFixed(1) : null }));
    const conf = r.official ? 'דיווח רשמי' : r.srcs.size >= 2 ? `${r.srcs.size} מקורות` : 'מקור יחיד';
    return { id: r.id, ticker: r.ticker, kind: r.kind, kindHe: KIND_HE[r.kind], tone: r.tone, conf, official: r.official, ageH: r.ageH, links: r.links, related: [...others, ...related].slice(0, 8), chg: st ? +st.chg.toFixed(1) : null, price: st ? +st.price.toFixed(2) : null, p0, since: st && p0 ? +((st.price / p0 - 1) * 100).toFixed(1) : null, firstSeen: seen,
      belowEma150: st ? !st.checks.above150 : null };
  }).filter(e => (now - new Date(e.firstSeen)) < 7 * 864e5).sort((a, b) => (b.official - a.official) || (a.ageH ?? 999) - (b.ageH ?? 999)).slice(0, 24);
}

// איסוף מלא: SEC 8-K לנכסים העיקריים + חדשות. כשל במקור אחד לא עוצר את השני.
export async function collectEvents({ get, items, S, tickers, email, prev = [], T0 = Date.now() }) {
  const res = { sec: { ok: false, detail: '' }, news: { ok: true, detail: '' } }, all = [];
  const ne = newsEvents(items); all.push(...ne); res.news.detail = `${ne.length} כותרות עם אירוע הנהלה או החלטת חברה`;
  try {
    const UA = { 'User-Agent': `OrenFinance ${email || 'contact@example.com'}`, Accept: 'application/json' };
    const map = JSON.parse(await get('https://www.sec.gov/files/company_tickers.json', UA)), cik = {}; for (const v of Object.values(map)) cik[v.ticker] = String(v.cik_str).padStart(10, '0');
    const list = [...new Set([...tickers, ...ne.map(x => x.tickers[0])])].filter(t => cik[t]).slice(0, 80); let i = 0, ok = 0, found = 0;
    await Promise.all(Array.from({ length: 4 }, async () => { while (i < list.length) { const t = list[i++]; try { const j = JSON.parse(await get(`https://data.sec.gov/submissions/CIK${cik[t]}.json`, UA)); const ev = parseSubmissions(j, t, T0); all.push(...ev); found += ev.length; ok++; } catch {} } }));
    res.sec.ok = ok >= Math.max(1, list.length * .5); res.sec.detail = `${ok}/${list.length} חברות נבדקו, ${found} דיווחי \u200e8-K\u200e מהותיים ב-4 ימים אחרונים`;
  } catch (e) { res.sec.detail = 'SEC לא נגיש בהרצה זו: ' + String(e.message || e).slice(0, 60); }
  return { events: merge(all, S, prev, T0), ...res };
}
