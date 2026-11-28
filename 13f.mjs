// FALILO · משקיעים וקרנות לפי דוחות 13F (SEC EDGAR). רץ פעם ביום (investors.yml) וכותב investors.json.
// מקורות: data.sec.gov (הגשות), sec.gov/Archives (טבלת האחזקות), OpenFIGI (CUSIP לטיקר, חינמי).
// בלי השערות: משקיע שלא אומת מול ה-SEC (שם לא תואם, אין דוח) לא מוצג, ומסומן בבדיקת התקינות.
import fs from 'fs';

const EMAIL = process.env.CONTACT_EMAIL || 'contact@example.com';
const UA = { 'User-Agent': `FaliloFinance ${EMAIL}`, 'Accept-Encoding': 'gzip, deflate' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TOP = 10, MAXCH = 10;

// ---------- רשת ----------
export async function sget(url, type = 'text', tries = 3) {
  for (let i = 0; i < tries; i++) {
    try { await sleep(130); const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) }); if (r.status === 404) return null; if (!r.ok) throw new Error('HTTP ' + r.status); return type === 'json' ? await r.json() : await r.text(); }
    catch (e) { if (i === tries - 1) throw new Error(`${url.replace('https://', '').slice(0, 70)}: ${e.message}`); await sleep(1200 * (i + 1)); }
  }
}

// ---------- פענוח טבלת אחזקות ----------
const tag = (x, t) => { const m = x.match(new RegExp(`<(?:\\w+:)?${t}>([^<]*)</(?:\\w+:)?${t}>`)); return m ? m[1].trim() : ''; };
const nice = s => String(s).toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase()).replace(/\b(Inc|Corp|Co|Ltd|Plc|Llc|Etf|Adr|Ii|Iii)\b/g, m => ({ Etf: 'ETF', Adr: 'ADR', Llc: 'LLC', Ii: 'II', Iii: 'III' }[m] || m)).replace(/\s+/g, ' ').trim();
export function parseInfoTable(xml) {
  const out = [], re = /<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/g; let m;
  while ((m = re.exec(xml))) {
    const x = m[1]; if (tag(x, 'putCall')) continue; const type = tag(x, 'sshPrnamtType'); if (type && type !== 'SH') continue;
    const cusip = tag(x, 'cusip').toUpperCase(), sh = +tag(x, 'sshPrnamt'), v = +tag(x, 'value'); if (!cusip || !(sh > 0)) continue;
    out.push({ cusip, name: nice(tag(x, 'nameOfIssuer').replace(/&amp;/g, '&')), sh, v });
  }
  return out;
}
// איחוד שורות לפי CUSIP. ערכים בדולרים מינואר 2023, לפני זה באלפי דולרים.
export function aggregate(rows, filed) {
  const k = filed >= '2023-01-03' ? 1 : 1000, M = new Map();
  for (const r of rows) { const e = M.get(r.cusip) || { cusip: r.cusip, name: r.name, sh: 0, v: 0 }; e.sh += r.sh; e.v += r.v * k; M.set(r.cusip, e); }
  return M;
}
// שינוי בין שני רבעונים לפי מספר מניות (לא לפי מחיר, שמושפע מהשוק)
export function diff(cur, prev, top = MAXCH) {
  const all = [], thr = 0.1;
  for (const [c, e] of cur) { const p = prev.get(c); if (!p) all.push({ c, name: e.name, type: 'new', dsh: e.sh, dval: e.v, pct: null }); else { const pct = (e.sh - p.sh) / p.sh; if (Math.abs(pct) >= thr) all.push({ c, name: e.name, type: pct > 0 ? 'up' : 'down', pct: +(pct * 100).toFixed(1), dsh: e.sh - p.sh, dval: (e.sh - p.sh) * (e.v / e.sh) }); } }
  for (const [c, p] of prev) if (!cur.has(c)) all.push({ c, name: p.name, type: 'exit', dsh: -p.sh, dval: -p.v, pct: -100 });
  return all.sort((a, b) => Math.abs(b.dval) - Math.abs(a.dval)).slice(0, top);
}

// ---------- CUSIP לטיקר (OpenFIGI, עם מטמון בקובץ) ----------
const CACHE = 'figi-cache.json';
let FIGI = {}; try { FIGI = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch {}
export async function mapCusips(cusips, post = figiPost) {
  const need = [...new Set(cusips)].filter(c => !(c in FIGI)); if (!need.length) return;
  for (let i = 0; i < need.length; i += 10) {
    const b = need.slice(i, i + 10); let res; try { res = await post(b); } catch (e) { console.error('openfigi:', e.message); await sleep(5000); continue; }
    b.forEach((c, j) => { const d = res?.[j]?.data; if (!d) { FIGI[c] = null; return; } const us = d.filter(x => x.exchCode === 'US' && x.ticker) , pick = us.find(x => /common|etp|reit|adr/i.test(x.securityType || '')) || us[0] || d.find(x => x.ticker); FIGI[c] = pick ? { t: pick.ticker.replace(/\//g, '-'), n: pick.name } : null; });
    await sleep(2600); // 25 בקשות בדקה ללא מפתח
  }
  fs.writeFileSync(CACHE, JSON.stringify(FIGI));
}
async function figiPost(batch) {
  const r = await fetch('https://api.openfigi.com/v3/mapping', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.OPENFIGI_KEY ? { 'X-OPENFIGI-APIKEY': process.env.OPENFIGI_KEY } : {}) }, body: JSON.stringify(batch.map(c => ({ idType: 'ID_CUSIP', idValue: c, exchCode: 'US' }))), signal: AbortSignal.timeout(30000) });
  if (r.status === 429) { await sleep(30000); throw new Error('rate limit'); } if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
}

// ---------- משקיע אחד ----------
const pad = c => String(c).padStart(10, '0'), flat = a => a.replace(/-/g, '');
export async function findCik(q) { // חיפוש לפי שם, רק למי שאין לו CIK בהגדרות
  const x = await sget(`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(q)}&type=13F-HR&dateb=&owner=include&count=10&output=atom`); if (!x) return null;
  const m = x.match(/<cik>(\d+)<\/cik>/i) || x.match(/CIK=(\d{6,10})/); return m ? +m[1] : null;
}
export async function loadFilings(cik) {
  const j = await sget(`https://data.sec.gov/submissions/CIK${pad(cik)}.json`, 'json'); if (!j) return null;
  const R = j.filings.recent, rows = R.form.map((f, i) => ({ form: f, acc: R.accessionNumber[i], filed: R.filingDate[i], qe: R.reportDate[i], doc: R.primaryDocument[i] })).filter(x => /^13F-HR/.test(x.form) && x.qe);
  const byQ = new Map(); for (const r of rows) { const o = byQ.get(r.qe); if (!o || (o.form !== '13F-HR' && r.form === '13F-HR')) byQ.set(r.qe, r); } // מעדיפים דוח מקורי
  return { name: j.name, list: [...byQ.values()].sort((a, b) => b.qe.localeCompare(a.qe)) };
}
export async function loadTable(cik, f) {
  const base = `https://www.sec.gov/Archives/edgar/data/${+cik}/${flat(f.acc)}/`, idx = await sget(base + 'index.json', 'json'); if (!idx) throw new Error('אין אינדקס לדוח');
  const xmls = idx.directory.item.filter(i => /\.xml$/i.test(i.name) && !/primary_doc/i.test(i.name)).map(i => ({ n: i.name, s: +i.size || 0 }));
  const pick = xmls.find(x => /info|table|13f/i.test(x.n)) || xmls.sort((a, b) => b.s - a.s)[0]; if (!pick) throw new Error('לא נמצא קובץ טבלת אחזקות');
  const rows = parseInfoTable(await sget(base + pick.n)); if (!rows.length) throw new Error('הטבלה ריקה'); return aggregate(rows, f.filed);
}
export async function buildOne(cfg, deps = { loadFilings, loadTable, mapCusips, findCik }) {
  let cik = cfg.cik; if (!cik && cfg.q) cik = await deps.findCik(cfg.q); if (!cik) throw new Error('לא נמצא CIK');
  const F = await deps.loadFilings(cik); if (!F || !F.list.length) throw new Error('אין דוחות 13F');
  if (cfg.match && !new RegExp(cfg.match, 'i').test(F.name)) throw new Error(`שם לא תואם ב-SEC: ${F.name}`);
  if ((Date.now() - new Date(F.list[0].filed)) / 864e5 > 200) throw new Error('אין דוח עדכני: ' + F.list[0].filed); // דוח ישן מחצי שנה לא מוצג
  const [c0, c1] = F.list, cur = await deps.loadTable(cik, c0), prev = c1 ? await deps.loadTable(cik, c1).catch(() => null) : null;
  const total = [...cur.values()].reduce((a, e) => a + e.v, 0), ptotal = prev ? [...prev.values()].reduce((a, e) => a + e.v, 0) : null;
  const top = [...cur.values()].sort((a, b) => b.v - a.v).slice(0, TOP), ch = prev ? diff(cur, prev) : [];
  await deps.mapCusips([...top.map(x => x.cusip), ...ch.map(x => x.c)]);
  const tk = c => FIGI[c]?.t || null;
  return {
    id: cfg.id, name: cfg.name, he: cfg.he || null, cat: cfg.cat, cik, secName: F.name, domain: cfg.domain || null, filed: c0.filed, qe: c0.qe, prevQe: c1?.qe || null, acc: c0.acc,
    url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=13F-HR`, total: Math.round(total), dTotal: ptotal ? +((total / ptotal - 1) * 100).toFixed(1) : null, n: cur.size,
    top: top.map(e => ({ t: tk(e.cusip), n: e.name, sh: e.sh, v: Math.round(e.v), p: +(e.v / total * 100).toFixed(2), ch: prev?.get(e.cusip) ? +(((e.sh / prev.get(e.cusip).sh) - 1) * 100).toFixed(1) : (prev ? null : undefined), isNew: !!prev && !prev.has(e.cusip) })),
    changes: ch.map(x => ({ t: tk(x.c), n: x.name, type: x.type, pct: x.pct, dsh: Math.round(x.dsh), dval: Math.round(x.dval) })),
  };
}

// ---------- ריצה ----------
async function main() {
  const cfg = JSON.parse(fs.readFileSync('investors.config.json', 'utf8')), old = (() => { try { return JSON.parse(fs.readFileSync('investors.json', 'utf8')); } catch { return { list: [] }; } })();
  const list = [], health = [], T0 = Date.now();
  for (const c of cfg) {
    if (Date.now() - T0 > 25 * 60 * 1000) { health.push({ id: c.id, ok: false, why: 'חריגה מזמן הריצה' }); const o = old.list.find(x => x.id === c.id); if (o) list.push(o); continue; }
    try { const r = await buildOne(c); list.push(r); health.push({ id: c.id, ok: true, name: c.name, filed: r.filed }); console.log('✔', c.name, r.filed, r.qe, r.n, 'אחזקות'); }
    catch (e) { console.error('✘', c.name, e.message); health.push({ id: c.id, ok: false, name: c.name, why: e.message.slice(0, 120) }); const o = old.list.find(x => x.id === c.id); if (o && /HTTP|ECONN|timeout|fetch/i.test(e.message)) list.push(o); }
  }
  // אינדקס הפוך: מניה ← מי מחזיק אותה (לכרטיס מניה באתר הראשי)
  const heldBy = {};
  for (const r of list) for (const h of r.top) if (h.t) (heldBy[h.t] ||= []).push({ id: r.id, name: r.name, cat: r.cat, p: h.p, ch: h.ch ?? null, isNew: h.isNew || false, filed: r.filed });
  for (const r of list) for (const c of r.changes) if (c.t && (c.type === 'new' || c.type === 'exit')) { const a = (heldBy[c.t] ||= []); if (!a.some(x => x.id === r.id)) a.push({ id: r.id, name: r.name, cat: r.cat, p: 0, ch: c.type === 'exit' ? -100 : null, isNew: c.type === 'new', exit: c.type === 'exit', filed: r.filed }); }
  fs.writeFileSync('investors.json', JSON.stringify({ updated: new Date().toISOString(), list, heldBy, health }));
  console.log(`investors.json: ${list.length}/${cfg.length} משקיעים`);
  if (!list.length) process.exitCode = 1;
}
if (process.argv[1] && process.argv[1].endsWith('13f.mjs')) main().catch(e => { console.error(e); process.exit(1); });
