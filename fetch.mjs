import fs from 'fs';
import fetch from 'node-fetch';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY secret.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function getFearAndGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/');
    const data = await res.json();
    if (data && data.data && data.data[0]) {
      return data.data[0]; 
    }
    return { value: '50', value_classification: 'Neutral' };
  } catch (e) {
    return { value: '50', value_classification: 'Neutral' };
  }
}

async function run() {
  console.log("Running Oren Finance AUTONOMOUS RADAR & SCANNER...");
  const fng = await getFearAndGreed();

  const prompt = `
You are the elite AUTONOMOUS quantitative stock and crypto scanner for "Oren Finance" (managed by Oren Gota / GOTAKING).

CRITICAL RULE: DO NOT USE A PREDEFINED OR HARDCODED LIST OF STOCKS.
Your job is to act as an independent radar. You must SCAN the market for TODAY and DISCOVER 6 to 10 assets (stocks or crypto) that are actively trending right now.

How to discover your assets for this run:
1. Identify what institutional investors (smart money) are currently accumulating (e.g., recent 13F buzz).
2. Identify trending tickers from current financial news and upcoming/recent earnings (Earnings Whispers, CNBC).
3. Identify assets gaining heavy momentum on financial YouTube channels (e.g., Micha.Stocks, Larry Jones).

Once you dynamically select these 6-10 trending assets, you MUST filter them strictly through Oren's rules:
- Technicals: Is the price above EMA 150? (Must be above for a 'green' buy signal). Is RSI > 50? Is there a volume breakout? 
- Fundamentals: Market Cap > $1B, revenue/profit growth.
- Macro: CNN Fear & Greed Index is EXACTLY at ${fng.value} (${fng.value_classification}). Account for this in your risk score and dip-buying rules (VIX, 3-red-days).

Output a strict JSON object with this exact structure:
{
  "macro": {
    "marketState": "Current Wall Street macro summary in professional Hebrew based on today's reality",
    "fearGreedValue": "${fng.value}",
    "fearGreedLabel": "${fng.value_classification}",
    "cpiStatus": "Latest inflation/CPI/Rate outlook note in Hebrew",
    "dailyVerdict": "Personalized quantitative AI market direction and scanner summary for today in Hebrew",
    "riskScore": 6
  },
  "assets": [
    {
      "symbol": "TICKER",
      "name": "Company Name",
      "status": "green", // green (buy/passed all rules), yellow (watchlist/approaching resistance), red (avoid/below EMA 150)
      "score": 92,
      "reasoning": "הסבר מקצועי בעברית: מאיפה המניה צצה בסריקה (למשל, קניות מוסדיים/דוחות מעולים) ולמה היא קיבלה את צבע הרמזור.",
      "conditionsMet": "Price > EMA 150 | Volume Breakout Confirmed | RSI: 64"
    }
  ]
}

Ensure the output is 100% valid JSON. The generated assets MUST change based on actual market conditions and news, proving this is a live scanner and not a static list.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let text = response.text.trim();
    // ניקוי תגיות של מארק-דאון במידה והמודל מוסיף אותן בטעות
    if (text.startsWith('```json')) text = text.slice(7, -3).trim();
    else if (text.startsWith('```')) text = text.slice(3, -3).trim();
    
    const parsedData = JSON.parse(text);
    parsedData.lastUpdated = new Date().toISOString();

    fs.writeFileSync('data.json', JSON.stringify(parsedData, null, 2));
    console.log("Autonomous scan complete. Data saved successfully.");
  } catch (err) {
    console.error("Error generating analysis:", err);
    process.exit(1);
  }
}

run();
