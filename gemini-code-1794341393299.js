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
    return data.data ? data.data[0] : { value: '50', value_classification: 'Neutral' };
  } catch (e) {
    return { value: '50', value_classification: 'Neutral' };
  }
}

async function run() {
  console.log("Running Oren Finance Quantitative Analysis Engine...");
  const fng = await getFearAndGreed();

  const prompt = `
You are the elite algorithmic quantitative analyst for "Oren Finance" (managed by Oren Gota).
Analyze current market conditions, upcoming reports (CPI), and multi-source signals (YouTube channels: Micha.Stocks, Larry Jones, Mark Tilbury, Chris Sain; Earnings Whispers; Crypto BTC/ETH).

Apply strict rule-based validation matching Oren's strategy:
- Basic filter: Market cap > $1B, profit & growth.
- Technical timing: Price > EMA 150, volume breakout, RSI > 50, ATR stop-loss logic.
- Fear & Greed status: ${fng.value}.

Output a strict JSON object with this exact structure:
{
  "macro": {
    "marketState": "Short Wall Street market trend in Hebrew (e.g. שורי בזהירות)",
    "fearGreedValue": "${fng.value}",
    "fearGreedLabel": "${fng.value_classification}",
    "cpiStatus": "Latest CPI & Inflation outlook note in Hebrew",
    "dailyVerdict": "Personalized AI system analysis and operational takeaway for today in Hebrew",
    "riskScore": 6
  },
  "assets": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "status": "green",
      "score": 88,
      "reasoning": "הסבר מפורט למה הנכס בירוק (למשל: זרימת הון מוסדית חזקה, פריצת התנגדות וזינוק בנפח המסחר מעל הממוצע).",
      "conditionsMet": "Price > EMA 150, RSI > 50, Volume confirmation."
    },
    {
      "symbol": "NVDA",
      "name": "NVIDIA",
      "status": "yellow",
      "score": 68,
      "reasoning": "הסבר מפורט למה הנכס בצהוב למעקב (למשל: נסחר סמוך לרصistance, ממתין לאישור דוחות ולפריצת נפח).",
      "conditionsMet": "Pending volume breakout, EMA 50/200 tracking."
    },
    {
      "symbol": "TSLA",
      "name": "Tesla",
      "status": "red",
      "score": 40,
      "reasoning": "הסבר מפורט למה הנכס באדום להימנעות (למשל: נסחר מתחת ל-EMA 150, מומנטום שלילי ושבירת תמיכה קריטית).",
      "conditionsMet": "Failed key support, avoid."
    }
  ]
}

Respond in professional Hebrew inside the JSON values. Return ONLY valid JSON block.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let text = response.text.trim();
    if (text.startsWith('```json')) text = text.slice(7, -3).trim();
    
    const parsedData = JSON.parse(text);
    parsedData.lastUpdated = new Date().toISOString();

    fs.writeFileSync('data.json', JSON.stringify(parsedData, null, 2));
    console.log("Data successfully generated and saved to data.json");
  } catch (err) {
    console.error("Error generating analysis:", err);
    process.exit(1);
  }
}

run();