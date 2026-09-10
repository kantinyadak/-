import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Types
interface PriceHistoryRecord {
  id: string;
  productId: string;
  timestamp: string;
  dollarRateInToman: number;
  dollarRateInRial: number;
  priceInRial: number;
  priceInToman: number;
  usdPrice: number;
  shippingUsd: number;
  profitMarginPercent: number;
  cooperator3Rial: number;
  cooperator6Rial: number;
  note?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  usdPrice: number;
  shippingUsd: number;
  profitMarginPercent: number;
  stock: number;
  notes?: string;
  priceHistory?: PriceHistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

interface RateSource {
  channelUsername: string;
  sourceType: 'telegram' | 'manual' | 'ai';
  rateInToman: number;
  rateInRial: number;
  lastUpdated: string;
  rawPostText?: string;
  detectedPostTime?: string;
  status: 'success' | 'error' | 'manual';
  errorMessage?: string;
  confidenceScore?: number;
  extractedFromChannel?: string;
}

interface RateHistoryItem {
  id: string;
  rateInToman: number;
  timestamp: string;
  channel: string;
  method: string;
}

interface ExchangeSettings {
  activeChannel: string;
  fallbackRateInToman: number;
  defaultProfitMargin: number;
  autoRefreshInterval: number;
  priceDisplayUnit: 'toman' | 'rial' | 'both';
  roundCalculations: boolean;
  roundStepRial?: number;
}

interface DispatchSettings {
  enabled: boolean;
  scheduledTime: string; // e.g. "12:00"
  targetService: 'bale' | 'whatsapp' | 'both';
  baleBotToken?: string;
  baleChatId?: string;
  whatsappType?: 'callmebot' | 'webhook';
  whatsappPhone?: string;
  whatsappApiKey?: string;
  whatsappWebhookUrl?: string;
  lastDispatchDate?: string;
  lastStatus?: 'success' | 'error' | 'pending';
  lastLogMessage?: string;
}

interface DispatchLogItem {
  id: string;
  timestamp: string;
  targetService: string;
  status: 'success' | 'error';
  messagePreview: string;
  errorDetail?: string;
}

interface DatabaseSchema {
  products: Product[];
  currentRate: RateSource;
  settings: ExchangeSettings;
  rateHistory: RateHistoryItem[];
  priceHistory?: PriceHistoryRecord[];
  dispatchSettings?: DispatchSettings;
  dispatchLogs?: DispatchLogItem[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default initial database content
const defaultDb: DatabaseSchema = {
  products: [
    {
      id: "prod_rubber_8_grey",
      name: "لاستیک ۸ طوسی",
      sku: "LST-8-GRY",
      category: "لاستیک و عایق",
      usdPrice: 3.7,
      shippingUsd: 0,
      profitMarginPercent: 0,
      stock: 100,
      notes: "لاستیک نوار ۸ طوسی",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_rubber_8_black",
      name: "لاستیک ۸ مشکی",
      sku: "LST-8-BLK",
      category: "لاستیک و عایق",
      usdPrice: 3.5,
      shippingUsd: 0,
      profitMarginPercent: 0,
      stock: 100,
      notes: "لاستیک نوار ۸ مشکی",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_rubber_8_black_4l",
      name: "لاستیک ۸ مشکی ۴ لبه",
      sku: "LST-8-BLK-4L",
      category: "لاستیک و عایق",
      usdPrice: 3.5,
      shippingUsd: 0,
      profitMarginPercent: 0,
      stock: 100,
      notes: "لاستیک نوار ۸ مشکی ۴ لبه",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_rubber_6",
      name: "لاستیک ۶",
      sku: "LST-6",
      category: "لاستیک و عایق",
      usdPrice: 3.43,
      shippingUsd: 0,
      profitMarginPercent: 0,
      stock: 100,
      notes: "لاستیک سایز ۶",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_rubber_5_5",
      name: "لاستیک ۵.۵",
      sku: "LST-5.5",
      category: "لاستیک و عایق",
      usdPrice: 3.2,
      shippingUsd: 0,
      profitMarginPercent: 0,
      stock: 100,
      notes: "لاستیک سایز ۵.۵",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_rubber_2_3_4",
      name: "لاستیک ۲،۳،۴",
      sku: "LST-234",
      category: "لاستیک و عایق",
      usdPrice: 2.6,
      shippingUsd: 0,
      profitMarginPercent: 0,
      stock: 100,
      notes: "لاستیک سایز ۲، ۳ و ۴",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_partition",
      name: "پارتیشنی",
      sku: "PRT-3.5",
      category: "پارتیشن و یراق‌آلات",
      usdPrice: 3.5,
      shippingUsd: 0,
      profitMarginPercent: 0,
      stock: 100,
      notes: "لاستیک / نوار پارتیشنی",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod_sloped_insulation",
      name: "عایق شیبدار",
      sku: "AYQ-SHB",
      category: "لاستیک و عایق",
      usdPrice: 2.6,
      shippingUsd: 0,
      profitMarginPercent: 0,
      stock: 100,
      notes: "عایق شیبدار",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  currentRate: {
    channelUsername: "tgju_org",
    sourceType: "manual",
    rateInToman: 93500,
    rateInRial: 935000,
    lastUpdated: new Date().toISOString(),
    rawPostText: "نرخ پیش‌فرض اولیه سامانه: دلار ۹۳,۵۰۰ تومان",
    detectedPostTime: "امروز",
    status: "manual",
    confidenceScore: 100,
    extractedFromChannel: "tgju_org",
  },
  settings: {
    activeChannel: "tgju_org",
    fallbackRateInToman: 93500,
    defaultProfitMargin: 10,
    autoRefreshInterval: 30,
    priceDisplayUnit: "both",
    roundCalculations: true,
  },
  rateHistory: [
    {
      id: "hist_init",
      rateInToman: 93500,
      timestamp: new Date().toISOString(),
      channel: "tgju_org",
      method: "نرخ پایه اولیه",
    },
  ],
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      return defaultDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : defaultDb.products,
      currentRate: parsed.currentRate || defaultDb.currentRate,
      settings: { ...defaultDb.settings, ...parsed.settings },
      rateHistory: Array.isArray(parsed.rateHistory) ? parsed.rateHistory : defaultDb.rateHistory,
      priceHistory: Array.isArray(parsed.priceHistory) ? parsed.priceHistory : [],
      dispatchSettings: parsed.dispatchSettings || {
        enabled: true,
        scheduledTime: "12:00",
        targetService: "bale",
        baleBotToken: "2013305231:91efktDoG9PrJ0TOExnUzvFniu6ihnI658I",
        baleChatId: "115840157",
      },
      dispatchLogs: Array.isArray(parsed.dispatchLogs) ? parsed.dispatchLogs : [],
    };
  } catch (err) {
    console.error("Error reading database file:", err);
    return defaultDb;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

function roundRial5000(amountRial: number): number {
  if (!amountRial || isNaN(amountRial)) return 0;
  const rounded = Math.round(amountRial);
  const remainder = rounded % 10000;
  if (remainder < 5000) {
    return rounded - remainder;
  } else {
    return rounded + (10000 - remainder);
  }
}

// Helper to calculate rounded Rial and Toman prices
function calculateProductHistoryRecord(
  product: Product,
  rateInToman: number,
  note: string = "بروزرسانی نرخ"
): PriceHistoryRecord {
  const baseUsd = Number(product.usdPrice) || 0;
  const shippingUsd = Number(product.shippingUsd) || 0;
  const rawUsdTotal = baseUsd + shippingUsd;
  const marginPercent = Number(product.profitMarginPercent) || 0;

  const rawCustomerRial = rawUsdTotal * (1 + marginPercent / 100) * rateInToman * 10;
  const rawCoop3Rial = rawCustomerRial * (1 - 0.03);
  const rawCoop6Rial = rawCustomerRial * (1 - 0.06);

  // گرد کردن بر مبنای ۵,۰۰۰ ریال (تبدیل به ۰ یا ۱۰,۰۰۰ ریال)
  const priceInRial = roundRial5000(rawCustomerRial);
  const priceInToman = Math.round(priceInRial / 10);

  const cooperator3Rial = roundRial5000(rawCoop3Rial);
  const cooperator6Rial = roundRial5000(rawCoop6Rial);

  return {
    id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    timestamp: new Date().toISOString(),
    dollarRateInToman: rateInToman,
    dollarRateInRial: rateInToman * 10,
    priceInRial,
    priceInToman,
    usdPrice: baseUsd,
    shippingUsd,
    profitMarginPercent: marginPercent,
    cooperator3Rial,
    cooperator6Rial,
    note,
  };
}

// Record price history entry for all products when dollar rate changes
function snapshotAllProductsPriceHistory(db: DatabaseSchema, rateInToman: number, note: string) {
  if (!Array.isArray(db.products)) return;
  db.products.forEach((p) => {
    if (!Array.isArray(p.priceHistory)) {
      p.priceHistory = [];
    }
    const record = calculateProductHistoryRecord(p, rateInToman, note);
    p.priceHistory.unshift(record);
    // Keep last 30 price records per product
    if (p.priceHistory.length > 30) {
      p.priceHistory = p.priceHistory.slice(0, 30);
    }
  });
}


// Convert Persian and Arabic digits to English digits
function convertPersianToEnglishDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result;
}

// Regex-based rate extractor for Persian Telegram financial posts
function parseRateRegex(text: string): { rateInToman: number; snippet: string; postTime?: string } | null {
  const normalized = convertPersianToEnglishDigits(text);
  
  // Extract Persian update time if present in post (e.g., "چهارشنبه ۱۸ شهریور ۱۴۰۵ - ۱۴:۴۷")
  let postTime = "";
  const timeMatch = text.match(/(?:آخرین بروزرسانی|بروزرسانی|ساعت|زمان)\s*[:=؛\-]?\s*(?:\n\s*)?([^\n#@]+)/i);
  if (timeMatch && timeMatch[1]) {
    postTime = timeMatch[1].replace(/[⌚⏱️⏰]/g, "").trim();
  }

  // Patterns specifically targeting US Dollar (strictly avoiding Canadian dollar, Australian dollar, etc.)
  const usDollarPatterns = [
    // 1. Matches "💵 دلار: 233,290" or "دلار: 233,290 تومان" but NOT "دلار کانادا" or "دلار استرالیا"
    /(?:💵|🇺🇸|💲)?\s*(?:دلار(?:\s+آمریکا|\s+تهران|\s+نقدی|\s+سبزه\s*میدان|\s+هرات|\s+سلیمانیه|\s+اسکناس)?|اسکناس دلار|USD)\s*(?!کانادا|استرالیا|نیوزلند|نیوزیلند|سنگاپور)\s*[:=؛\-]?\s*([0-9]{2,3}[,،\s]?[0-9]{3})/i,
    // 2. Matches "233,290 تومان : دلار"
    /([0-9]{2,3}[,،\s]?[0-9]{3})\s*(?:تومان|تومن)\s*[:=؛\-]?\s*(?:دلار|USD)(?!.*(?:کانادا|استرالیا))/i,
    // 3. "نرخ دلار" / "قیمت دلار" / "فروش دلار"
    /(?:نرخ دلار|قیمت دلار|فروش دلار)\s*(?!کانادا|استرالیا)\s*[:=؛\-]?\s*([0-9]{2,3}[,،\s]?[0-9]{3})/i,
    // 4. Fallback if dollar is mentioned near a 5-6 digit number
    /(?:دلار|USD)\s*(?!کانادا|استرالیا)\s*[:=؛\-]?\s*([0-9]{5,6})/i,
    /([0-9]{2,3}[,،][0-9]{3})\s*(?:تومان|تومن)\s*(?:دلار|اسکناس)/i,
  ];

  for (const regex of usDollarPatterns) {
    const match = normalized.match(regex);
    if (match && match[1]) {
      const cleanNumStr = match[1].replace(/[,،\s]/g, "");
      const num = parseInt(cleanNumStr, 10);
      
      // Sanity check: dollar rate in Iran is typically 50,000 to 500,000 Toman, or 500,000 to 5,000,000 Rial
      if (num >= 50000 && num <= 500000) {
        return { rateInToman: num, snippet: match[0].trim(), postTime };
      } else if (num >= 500000 && num <= 5000000) {
        // Provided in Rials
        return { rateInToman: Math.round(num / 10), snippet: match[0].trim(), postTime };
      }
    }
  }

  return null;
}

// Gemini AI-based parser
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function parseRateWithGemini(messages: string[], channel: string): Promise<{ rateInToman: number; snippet: string; postTime?: string } | null> {
  const ai = getGemini();
  if (!ai) return null;

  try {
    const prompt = `You are a specialized financial data extractor for Iranian currency markets.
The following are the latest message texts scraped from the public Telegram channel '@${channel}':

${messages.slice(-3).map((m, i) => `[پیام ${i + 1}]:\n${m}`).join("\n\n---\n\n")}

Task:
Extract the most recent US Dollar (USD / دلار) exchange rate to Iranian Toman (تومان) or Rial (ریال).
IMPORTANT:
- Make sure to extract US Dollar (دلار آمریکا / دلار), and NEVER extract Canadian dollar (دلار کانادا) or Australian dollar (دلار استرالیا).
- If the rate is in Rials, convert it to Tomans (1 Toman = 10 Rials). The rate is typically in the range of 100,000 to 350,000 Tomans.
- Identify the exact snippet and time if present in the post.

Return ONLY a JSON object with this exact structure:
{
  "found": true,
  "rateInToman": 233290,
  "rateSnippet": "💵 دلار: 233,290 تومان",
  "postTime": "چهارشنبه ۱۸ شهریور ۱۴۰۵ - ۱۴:۴۷"
}
If no dollar rate is found in the text, return:
{
  "found": false,
  "rateInToman": 0,
  "rateSnippet": "",
  "postTime": ""
}`;

    // Add a 5 second timeout race
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
    const generatePromise = (async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) return null;
      const parsed = JSON.parse(text);
      if (parsed.found && parsed.rateInToman && parsed.rateInToman >= 40000 && parsed.rateInToman <= 500000) {
        return {
          rateInToman: Number(parsed.rateInToman),
          snippet: parsed.rateSnippet || "",
          postTime: parsed.postTime || "",
        };
      }
      return null;
    })();

    return await Promise.race([generatePromise, timeoutPromise]);
  } catch (err) {
    console.error("Gemini rate parsing error:", err);
  }
  return null;
}

// Scrape public telegram channel preview (https://t.me/s/<channel>)
async function fetchTelegramChannel(channelName: string) {
  const cleanChannel = channelName
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\/s\//i, "")
    .replace(/^https?:\/\/t\.me\//i, "")
    .trim();

  if (!cleanChannel) {
    throw new Error("نام کانال تلگرام نامعتبر است");
  }

  const url = `https://t.me/s/${cleanChannel}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fa,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`خطا در ارتباط با پیش‌نمایش کانال تلگرام (کد وضعیت: ${response.status})`);
  }

  const html = await response.text();

  // Extract messages inside <div class="tgme_widget_message_text...">...</div>
  const messageRegex = /<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const rawMessages: string[] = [];
  let match;
  while ((match = messageRegex.exec(html)) !== null) {
    // Strip inner HTML tags
    const cleanText = match[1]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
    if (cleanText) {
      rawMessages.push(cleanText);
    }
  }

  // Also extract dates if possible
  const dateRegex = /<time[^>]*datetime="([^"]*)"[^>]*>([^<]*)<\/time>/gi;
  const dates: string[] = [];
  while ((match = dateRegex.exec(html)) !== null) {
    dates.push(match[2].trim());
  }

  return {
    channel: cleanChannel,
    messages: rawMessages.slice(-8), // latest 8 messages
    latestDate: dates.length > 0 ? dates[dates.length - 1] : undefined,
  };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Products CRUD
app.get("/api/products", (req: Request, res: Response) => {
  const db = readDb();
  res.json({ products: db.products });
});

app.post("/api/products", (req: Request, res: Response) => {
  const db = readDb();
  const { name, sku, category, usdPrice, shippingUsd, profitMarginPercent, stock, notes } = req.body;

  if (!name || usdPrice === undefined || isNaN(Number(usdPrice))) {
    res.status(400).json({ error: "نام محصول و قیمت دلاری معتبر الزامی است" });
    return;
  }

  const newProduct: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: String(name).trim(),
    sku: sku ? String(sku).trim() : `SKU-${Date.now().toString().slice(-5)}`,
    category: category ? String(category).trim() : "عمومی",
    usdPrice: Math.max(0, Number(usdPrice)),
    shippingUsd: Number(shippingUsd) || 0,
    profitMarginPercent: Number(profitMarginPercent) || 0,
    stock: Number(stock) || 0,
    notes: notes ? String(notes).trim() : "",
    priceHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add initial price history record
  const initialHistory = calculateProductHistoryRecord(
    newProduct,
    db.currentRate.rateInToman,
    "ثبت اولیه محصول"
  );
  newProduct.priceHistory = [initialHistory];

  db.products.unshift(newProduct);
  writeDb(db);

  res.status(201).json({ product: newProduct });
});

app.put("/api/products/:id", (req: Request, res: Response) => {
  const db = readDb();
  const { id } = req.params;
  const index = db.products.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: "محصول یافت نشد" });
    return;
  }

  const existing = db.products[index];
  const { name, sku, category, usdPrice, shippingUsd, profitMarginPercent, stock, notes } = req.body;

  const isPriceChanged = 
    (usdPrice !== undefined && Number(usdPrice) !== existing.usdPrice) ||
    (shippingUsd !== undefined && Number(shippingUsd) !== existing.shippingUsd) ||
    (profitMarginPercent !== undefined && Number(profitMarginPercent) !== existing.profitMarginPercent);

  const updatedProduct: Product = {
    ...existing,
    name: name !== undefined ? String(name).trim() : existing.name,
    sku: sku !== undefined ? String(sku).trim() : existing.sku,
    category: category !== undefined ? String(category).trim() : existing.category,
    usdPrice: usdPrice !== undefined ? Math.max(0, Number(usdPrice)) : existing.usdPrice,
    shippingUsd: shippingUsd !== undefined ? Number(shippingUsd) : existing.shippingUsd,
    profitMarginPercent: profitMarginPercent !== undefined ? Number(profitMarginPercent) : existing.profitMarginPercent,
    stock: stock !== undefined ? Number(stock) : existing.stock,
    notes: notes !== undefined ? String(notes).trim() : existing.notes,
    priceHistory: Array.isArray(existing.priceHistory) ? existing.priceHistory : [],
    updatedAt: new Date().toISOString(),
  };

  if (isPriceChanged) {
    const changeRecord = calculateProductHistoryRecord(
      updatedProduct,
      db.currentRate.rateInToman,
      "ویرایش قیمت یا سود کالا توسط کاربر"
    );
    updatedProduct.priceHistory = [changeRecord, ...(updatedProduct.priceHistory || [])].slice(0, 30);
  }

  db.products[index] = updatedProduct;
  writeDb(db);

  res.json({ product: updatedProduct });
});

// Get price history of a specific product
app.get("/api/products/:id/history", (req: Request, res: Response) => {
  const db = readDb();
  const { id } = req.params;
  const product = db.products.find((p) => p.id === id);

  if (!product) {
    res.status(404).json({ error: "محصول یافت نشد" });
    return;
  }

  // If no history exists yet, generate initial one
  if (!product.priceHistory || product.priceHistory.length === 0) {
    const record = calculateProductHistoryRecord(product, db.currentRate.rateInToman, "نرخ پایه فعلی");
    product.priceHistory = [record];
    writeDb(db);
  }

  res.json({ 
    product: { id: product.id, name: product.name, sku: product.sku },
    history: product.priceHistory 
  });
});


app.delete("/api/products/:id", (req: Request, res: Response) => {
  const db = readDb();
  const { id } = req.params;
  const filtered = db.products.filter((p) => p.id !== id);

  if (filtered.length === db.products.length) {
    res.status(404).json({ error: "محصول پیدا نشد" });
    return;
  }

  db.products = filtered;
  writeDb(db);

  res.json({ success: true, deletedId: id });
});

// Bulk import/replace products
app.post("/api/products/bulk", (req: Request, res: Response) => {
  const db = readDb();
  const { products } = req.body;

  if (!Array.isArray(products)) {
    res.status(400).json({ error: "لیست محصولات نامعتبر است" });
    return;
  }

  const validProducts: Product[] = products.map((item, idx) => ({
    id: item.id || `prod_${Date.now()}_${idx}`,
    name: String(item.name || "محصول بدون نام").trim(),
    sku: String(item.sku || `SKU-${idx + 1}`).trim(),
    category: String(item.category || "عمومی").trim(),
    usdPrice: Math.max(0, Number(item.usdPrice) || 0),
    shippingUsd: Math.max(0, Number(item.shippingUsd) || 0),
    profitMarginPercent: Number(item.profitMarginPercent) || 0,
    stock: Math.max(0, Number(item.stock) || 0),
    notes: item.notes ? String(item.notes).trim() : "",
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  db.products = validProducts;
  writeDb(db);

  res.json({ success: true, count: validProducts.length, products: validProducts });
});

// Database Full Backup Export
app.get("/api/database/backup", (req: Request, res: Response) => {
  const db = readDb();
  const dateStr = new Date().toISOString().split("T")[0];
  res.setHeader("Content-Disposition", `attachment; filename="exchange_db_backup_${dateStr}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(db, null, 2));
});

// Database Full Restore
app.post("/api/database/restore", (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== "object") {
      res.status(400).json({ error: "ساختار فایل پشتیبان نامعتبر است" });
      return;
    }

    const currentDb = readDb();
    
    // Check if incoming is full AppDb or just products array
    let restoredProducts = incoming.products;
    if (!Array.isArray(restoredProducts) && Array.isArray(incoming)) {
      restoredProducts = incoming;
    }

    if (!Array.isArray(restoredProducts)) {
      res.status(400).json({ error: "فایل فاقد لیست معتبر محصولات است" });
      return;
    }

    const validProducts: Product[] = restoredProducts.map((item: any, idx: number) => ({
      id: item.id || `prod_${Date.now()}_${idx}`,
      name: String(item.name || "محصول بدون نام").trim(),
      sku: String(item.sku || `SKU-${idx + 1}`).trim(),
      category: String(item.category || "عمومی").trim(),
      usdPrice: Math.max(0, Number(item.usdPrice) || 0),
      shippingUsd: Math.max(0, Number(item.shippingUsd) || 0),
      profitMarginPercent: Number(item.profitMarginPercent) || 0,
      stock: Math.max(0, Number(item.stock) || 0),
      notes: item.notes ? String(item.notes).trim() : "",
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceHistory: Array.isArray(item.priceHistory) ? item.priceHistory : [],
    }));

    currentDb.products = validProducts;

    if (incoming.currentRate && incoming.currentRate.rateInToman) {
      currentDb.currentRate = incoming.currentRate;
    }
    if (incoming.settings) {
      currentDb.settings = { ...currentDb.settings, ...incoming.settings };
    }
    if (Array.isArray(incoming.rateHistory) && incoming.rateHistory.length > 0) {
      currentDb.rateHistory = incoming.rateHistory;
    }

    writeDb(currentDb);

    res.json({
      success: true,
      count: validProducts.length,
      currentRate: currentDb.currentRate,
      settings: currentDb.settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: "خطا در پردازش و بازیابی دیتابیس: " + err.message });
  }
});

// 3. Current Exchange Rate
app.get("/api/rates/current", (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    currentRate: db.currentRate,
    settings: db.settings,
  });
});

// 4. Fetch exchange rate from Telegram channel
app.post("/api/rates/fetch", async (req: Request, res: Response) => {
  const db = readDb();
  const requestedChannel = req.body.channel || db.settings.activeChannel || "tgju_org";

  try {
    const scraped = await fetchTelegramChannel(requestedChannel);
    const messages = scraped.messages;

    if (messages.length === 0) {
      throw new Error(`هیچ پیامی در پیش‌نمایش عمومی کانال @${scraped.channel} یافت نشد.`);
    }

    let detectedRate: number | null = null;
    let snippet = "";
    let detectedTime = scraped.latestDate || "هم‌اکنون";
    let method: "ai" | "telegram" = "telegram";

    // 1. Try fast Regex parser first across messages (newest first)
    for (let i = messages.length - 1; i >= 0; i--) {
      const parsed = parseRateRegex(messages[i]);
      if (parsed) {
        detectedRate = parsed.rateInToman;
        snippet = parsed.snippet;
        if (parsed.postTime) detectedTime = parsed.postTime;
        method = "telegram";
        break;
      }
    }

    // 2. If regex didn't find and Gemini API key is available, use AI extraction
    if (!detectedRate && process.env.GEMINI_API_KEY) {
      const aiResult = await parseRateWithGemini(messages, scraped.channel);
      if (aiResult) {
        detectedRate = aiResult.rateInToman;
        snippet = aiResult.snippet;
        if (aiResult.postTime) detectedTime = aiResult.postTime;
        method = "ai";
      }
    }

    if (!detectedRate) {
      // If unable to automatically extract, return latest messages so user can see or choose
      res.status(200).json({
        success: false,
        warning: `پیام‌ها از کانال @${scraped.channel} دریافت شد، اما عدد مشخصی برای دلار یافت نشد. می‌توانید نرخ را به صورت دستی یا از کانال دیگری استعلام فرمایید.`,
        previewMessages: messages,
        currentRate: db.currentRate,
      });
      return;
    }

    const newRateSource: RateSource = {
      channelUsername: scraped.channel,
      sourceType: method,
      rateInToman: detectedRate,
      rateInRial: detectedRate * 10,
      lastUpdated: new Date().toISOString(),
      rawPostText: snippet || messages[messages.length - 1],
      detectedPostTime: detectedTime,
      status: "success",
      confidenceScore: method === "ai" ? 95 : 90,
      extractedFromChannel: scraped.channel,
    };

    db.currentRate = newRateSource;
    db.settings.activeChannel = scraped.channel;

    // Log to rate history
    db.rateHistory.unshift({
      id: `hist_${Date.now()}`,
      rateInToman: detectedRate,
      timestamp: new Date().toISOString(),
      channel: scraped.channel,
      method: method === "ai" ? "هوش مصنوعی جمنای از تلگرام" : "استخراج مستقیم از تلگرام",
    });
    // Keep last 50 history entries
    if (db.rateHistory.length > 50) {
      db.rateHistory = db.rateHistory.slice(0, 50);
    }

    // Snapshot price history for all products with new rate
    snapshotAllProductsPriceHistory(
      db, 
      detectedRate, 
      `استعلام خودکار از کانال تلگرام @${scraped.channel}`
    );

    writeDb(db);

    res.json({
      success: true,
      currentRate: newRateSource,
      previewMessages: messages.slice(-3),
    });
  } catch (err: any) {
    console.error("Telegram rate fetch error:", err);
    res.status(200).json({
      success: false,
      error: err.message || "خطا در برقراری ارتباط با تلگرام",
      currentRate: db.currentRate,
    });
  }
});

// 5. Set Manual Rate
app.post("/api/rates/manual", (req: Request, res: Response) => {
  const db = readDb();
  const { rateInToman, notes } = req.body;

  const numRate = Number(rateInToman);
  if (!numRate || isNaN(numRate) || numRate <= 0) {
    res.status(400).json({ error: "نرخ دلار به تومان باید عددی معتبر و بزرگتر از صفر باشد" });
    return;
  }

  const manualRateSource: RateSource = {
    channelUsername: "تنظیم دستی توسط کاربر",
    sourceType: "manual",
    rateInToman: Math.round(numRate),
    rateInRial: Math.round(numRate * 10),
    lastUpdated: new Date().toISOString(),
    rawPostText: notes ? String(notes).trim() : "تنظیم دستی توسط مدیر",
    detectedPostTime: "دستی",
    status: "manual",
    confidenceScore: 100,
    extractedFromChannel: "دستی",
  };

  db.currentRate = manualRateSource;
  db.rateHistory.unshift({
    id: `hist_${Date.now()}`,
    rateInToman: Math.round(numRate),
    timestamp: new Date().toISOString(),
    channel: "دستی",
    method: "تعیین مستقیم کاربر",
  });
  if (db.rateHistory.length > 50) {
    db.rateHistory = db.rateHistory.slice(0, 50);
  }

  // Snapshot price history for all products with new manual rate
  snapshotAllProductsPriceHistory(
    db, 
    Math.round(numRate), 
    notes ? `تنظیم دستی: ${notes}` : "تنظیم دستی نرخ دلار"
  );

  writeDb(db);

  res.json({ success: true, currentRate: manualRateSource });
});

// 6. Parse and Apply from Raw Text (e.g. pasted Telegram message)
app.post("/api/rates/parse-text", async (req: Request, res: Response) => {
  const db = readDb();
  const { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "متن پست ارسال نشده است" });
    return;
  }

  let parsed = parseRateRegex(text);
  let detectedRate = parsed ? parsed.rateInToman : null;
  let snippet = parsed ? parsed.snippet : "";
  let detectedTime = parsed?.postTime || "لحظه‌ای";
  let method: "ai" | "manual" | "telegram" = "telegram";

  if (!detectedRate && process.env.GEMINI_API_KEY) {
    const aiResult = await parseRateWithGemini([text], "متن ورودی");
    if (aiResult) {
      detectedRate = aiResult.rateInToman;
      snippet = aiResult.snippet;
      if (aiResult.postTime) detectedTime = aiResult.postTime;
      method = "ai";
    }
  }

  if (!detectedRate) {
    res.status(400).json({
      error: "نرخ دلار آمریکا در این متن یافت نشد. لطفاً از درستی فرمت اطمینان حاصل کنید یا نرخ را به صورت دستی وارد نمایید."
    });
    return;
  }

  const newRateSource: RateSource = {
    channelUsername: "متن پست تلگرام",
    sourceType: method,
    rateInToman: detectedRate,
    rateInRial: detectedRate * 10,
    lastUpdated: new Date().toISOString(),
    rawPostText: snippet,
    detectedPostTime: detectedTime,
    status: "success",
    confidenceScore: 100,
    extractedFromChannel: "ورودی مستقیم متن",
  };

  db.currentRate = newRateSource;

  // Log to rate history
  db.rateHistory.unshift({
    id: `hist_${Date.now()}`,
    rateInToman: detectedRate,
    timestamp: new Date().toISOString(),
    channel: "متن ارسالی تلگرام",
    method: "استخراج مستقیم از متن پیام",
  });
  if (db.rateHistory.length > 50) {
    db.rateHistory = db.rateHistory.slice(0, 50);
  }

  // Snapshot price history for all products with new rate
  snapshotAllProductsPriceHistory(
    db, 
    detectedRate, 
    `استخراج از متن پست تلگرام (${snippet})`
  );

  writeDb(db);

  res.json({
    success: true,
    currentRate: newRateSource,
  });
});

// 7. Settings & History
app.get("/api/settings", (req: Request, res: Response) => {
  const db = readDb();
  res.json({ settings: db.settings });
});

app.post("/api/settings", (req: Request, res: Response) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

app.get("/api/rates/history", (req: Request, res: Response) => {
  const db = readDb();
  res.json({ history: db.rateHistory || [] });
});

// 8. Public Read-Only Price Endpoint (Never exposes USD costs, margins, or notes)
// Supports ?tier=customer | ?tier=coop3 | ?tier=coop6 to strictly isolate tiers from one another!
app.get("/api/public/prices", (req: Request, res: Response) => {
  const db = readDb();
  const currentRate = db.currentRate || { rateInToman: 235490, rateInRial: 2354900, lastUpdated: new Date().toISOString() };
  const requestedTier = (req.query.tier as string) || "customer"; // Default to customer if not specified
  
  const publicProducts = (db.products || []).map((product) => {
    const calc = calculateProductHistoryRecord(product, currentRate.rateInToman);

    if (requestedTier === "customer") {
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        priceRial: calc.priceInRial,
        priceToman: calc.priceInToman,
      };
    } else if (requestedTier === "coop3") {
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        priceRial: calc.cooperator3Rial,
        priceToman: Math.round(calc.cooperator3Rial / 10),
      };
    } else if (requestedTier === "coop6") {
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        priceRial: calc.cooperator6Rial,
        priceToman: Math.round(calc.cooperator6Rial / 10),
      };
    }

    // Default 'all' (only for master admin preview if requested)
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      customerPriceRial: calc.priceInRial,
      customerPriceToman: calc.priceInToman,
      cooperator3PriceRial: calc.cooperator3Rial,
      cooperator3PriceToman: Math.round(calc.cooperator3Rial / 10),
      cooperator6PriceRial: calc.cooperator6Rial,
      cooperator6PriceToman: Math.round(calc.cooperator6Rial / 10),
    };
  });

  res.json({
    tier: requestedTier,
    lastUpdated: currentRate.lastUpdated,
    rateInToman: currentRate.rateInToman,
    rateInRial: currentRate.rateInRial || currentRate.rateInToman * 10,
    products: publicProducts,
  });
});

// Helper to fetch latest rate automatically from Telegram before sending or on schedule
async function fetchAndApplyLatestRate(channelName?: string): Promise<{ success: boolean; rateInToman: number; error?: string }> {
  const db = readDb();
  const channelToUse = (channelName || db.settings.activeChannel || "tgju_org").trim().replace(/^@/, "");
  try {
    const scraped = await fetchTelegramChannel(channelToUse);
    const messages = scraped.messages || [];
    let detectedRate: number | null = null;
    let snippet: string = "";
    let detectedTime: string = "هم‌اکنون";
    let method: "telegram" | "manual" | "ai" = "telegram";

    for (let i = messages.length - 1; i >= 0; i--) {
      const parsed = parseRateRegex(messages[i]);
      if (parsed) {
        detectedRate = parsed.rateInToman;
        snippet = parsed.snippet;
        if (parsed.postTime) detectedTime = parsed.postTime;
        method = "telegram";
        break;
      }
    }

    if (!detectedRate && process.env.GEMINI_API_KEY) {
      const aiResult = await parseRateWithGemini(messages, scraped.channel);
      if (aiResult) {
        detectedRate = aiResult.rateInToman;
        snippet = aiResult.snippet;
        if (aiResult.postTime) detectedTime = aiResult.postTime;
        method = "ai";
      }
    }

    if (detectedRate && detectedRate > 0) {
      const newRateSource: RateSource = {
        channelUsername: scraped.channel,
        sourceType: method,
        rateInToman: detectedRate,
        rateInRial: detectedRate * 10,
        lastUpdated: new Date().toISOString(),
        rawPostText: snippet || messages[messages.length - 1] || "",
        detectedPostTime: detectedTime,
        status: "success",
        confidenceScore: method === "ai" ? 95 : 90,
        extractedFromChannel: scraped.channel,
      };
      db.currentRate = newRateSource;
      db.rateHistory.unshift({
        id: `hist_${Date.now()}`,
        rateInToman: detectedRate,
        timestamp: new Date().toISOString(),
        channel: scraped.channel,
        method: method === "ai" ? "استعلام خودکار با هوش مصنوعی" : "استعلام خودکار پیش از ارسال پیام",
      });
      if (db.rateHistory.length > 50) {
        db.rateHistory = db.rateHistory.slice(0, 50);
      }
      snapshotAllProductsPriceHistory(db, detectedRate, `استعلام خودکار نرخ پیش از ارسال روزانه (@${scraped.channel})`);
      writeDb(db);
      console.log(`[AutoDispatch] Fresh rate fetched successfully: ${detectedRate} Toman`);
      return { success: true, rateInToman: detectedRate };
    }
    return { success: false, rateInToman: db.currentRate?.rateInToman || 235000, error: "نرخ جدید در پیام‌ها یافت نشد" };
  } catch (err: any) {
    console.error("[AutoDispatch] Error fetching fresh rate:", err);
    return { success: false, rateInToman: db.currentRate?.rateInToman || 235000, error: err.message };
  }
}

// 9. Automated Daily Dispatch Helpers (Bale & WhatsApp)
function formatThreeTierPriceMessage(db: DatabaseSchema): string {
  const currentRate = db.currentRate?.rateInToman || 235490;
  let tehranDateStr = "";
  try {
    tehranDateStr = new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());
  } catch {
    tehranDateStr = new Date().toISOString();
  }

  let text = `📢 لیست قیمت روز محصولات\n`;
  text += `🗓 تاریخ: ${tehranDateStr}\n`;
  text += `💵 نرخ مبنای دلار: ${currentRate.toLocaleString("fa-IR")} تومان\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  (db.products || []).forEach((p, idx) => {
    const calc = calculateProductHistoryRecord(p, currentRate);
    text += `📦 ${idx + 1}. ${p.name} (${p.sku})\n`;
    text += `   🔹 مشتری: ${calc.priceInToman.toLocaleString("fa-IR")} تومان (${calc.priceInRial.toLocaleString("fa-IR")} ریال)\n`;
    text += `   🔸 همکار ۳٪: ${Math.round(calc.cooperator3Rial / 10).toLocaleString("fa-IR")} تومان\n`;
    text += `   🔸 همکار ۶٪: ${Math.round(calc.cooperator6Rial / 10).toLocaleString("fa-IR")} تومان\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🌐 مشاهده آنلاین کاتالوگ قیمت: ${process.env.APP_URL || ""}/?view=prices`;
  return text;
}

async function sendToBale(token: string, rawChatIds: string, text: string): Promise<{ success: boolean; error?: string; count?: number }> {
  const chatIds = (rawChatIds || "")
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((rawId) => {
      let id = rawId.replace(/^https?:\/\/ble\.ir\//i, "").replace(/^ble\.ir\//i, "").trim();
      // If it's not all digits and doesn't start with - or @, prepend @ for channels/groups
      if (!/^-?\d+$/.test(id) && !id.startsWith("@")) {
        id = `@${id}`;
      }
      return id;
    });

  if (chatIds.length === 0) {
    return { success: false, error: "شناسه چت یا کانال بله وارد نشده است" };
  }

  let successCount = 0;
  const errors: string[] = [];

  for (const chatId of chatIds) {
    try {
      const url = `https://tapi.bale.ai/bot${token.trim()}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });
      const json: any = await res.json();
      if (json.ok) {
        successCount++;
      } else {
        errors.push(`[${chatId}]: ${json.description || JSON.stringify(json)}`);
      }
    } catch (err: any) {
      errors.push(`[${chatId}]: ${err.message || "خطای اتصال به بله"}`);
    }
  }

  if (successCount > 0) {
    return {
      success: true,
      count: successCount,
      error: errors.length > 0 ? `ارسال به ${successCount} چت موفق بود، اما در این موارد خطا داد: ${errors.join("; ")}` : undefined,
    };
  } else {
    return {
      success: false,
      error: errors.join("; ") || "ارسال به بله ناموفق بود",
    };
  }
}

async function sendToWhatsApp(settings: DispatchSettings, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (settings.whatsappType === "webhook" && settings.whatsappWebhookUrl) {
      const res = await fetch(settings.whatsappWebhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: settings.whatsappPhone,
          message: text,
        }),
      });
      return { success: res.ok, error: res.ok ? undefined : `HTTP Status: ${res.status}` };
    } else if (settings.whatsappPhone && settings.whatsappApiKey) {
      const cleanPhone = settings.whatsappPhone.replace(/[^\d+]/g, "");
      const encodedText = encodeURIComponent(text);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${settings.whatsappApiKey.trim()}`;
      const res = await fetch(url);
      const resText = await res.text();
      if (res.ok || resText.includes("Message queued") || resText.includes("success")) {
        return { success: true };
      } else {
        return { success: false, error: resText.slice(0, 150) };
      }
    }
    return { success: false, error: "تنظیمات واتساپ ثبت نشده است" };
  } catch (err: any) {
    return { success: false, error: err.message || "خطای ارسال به واتساپ" };
  }
}

async function executeDispatch(db: DatabaseSchema, settings: DispatchSettings) {
  // 1. REQUIREMENT 3: Automatically fetch the newest rate before sending to Bale/WhatsApp!
  console.log("[AutoDispatch] Automatically fetching freshest live dollar rate before dispatching...");
  try {
    const rateResult = await fetchAndApplyLatestRate();
    if (rateResult.success) {
      console.log(`[AutoDispatch] Rate refreshed before dispatch: ${rateResult.rateInToman} Toman`);
    } else {
      console.warn(`[AutoDispatch] Could not scrape newer rate, proceeding with current rate: ${rateResult.error}`);
    }
    // Re-read latest database state after refresh
    db = readDb();
  } catch (err) {
    console.error("[AutoDispatch] Error during pre-dispatch rate update:", err);
  }

  const text = formatThreeTierPriceMessage(db);
  const target = settings.targetService || "bale";
  let overallSuccess = true;
  let errorMsg = "";

  if (!db.dispatchLogs) db.dispatchLogs = [];

  // Bale
  if (target === "bale" || target === "both") {
    if (settings.baleBotToken && settings.baleChatId) {
      const baleRes = await sendToBale(settings.baleBotToken, settings.baleChatId, text);
      db.dispatchLogs.unshift({
        id: `log_bale_${Date.now()}`,
        timestamp: new Date().toISOString(),
        targetService: "bale",
        status: baleRes.success ? "success" : "error",
        messagePreview: text.slice(0, 60) + "...",
        errorDetail: baleRes.error,
      });
      if (!baleRes.success) {
        overallSuccess = false;
        errorMsg += `بله: ${baleRes.error}; `;
      }
    } else {
      overallSuccess = false;
      errorMsg += "توکن یا شناسه چت بله تنظیم نشده است; ";
    }
  }

  // WhatsApp
  if (target === "whatsapp" || target === "both") {
    const waRes = await sendToWhatsApp(settings, text);
    db.dispatchLogs.unshift({
      id: `log_wa_${Date.now()}`,
      timestamp: new Date().toISOString(),
      targetService: "whatsapp",
      status: waRes.success ? "success" : "error",
      messagePreview: text.slice(0, 60) + "...",
      errorDetail: waRes.error,
    });
    if (!waRes.success) {
      overallSuccess = false;
      errorMsg += `واتساپ: ${waRes.error}; `;
    }
  }

  if (db.dispatchLogs.length > 30) {
    db.dispatchLogs = db.dispatchLogs.slice(0, 30);
  }

  settings.lastStatus = overallSuccess ? "success" : "error";
  settings.lastLogMessage = overallSuccess ? "ارسال با موفقیت انجام شد" : errorMsg;
  db.dispatchSettings = settings;
  writeDb(db);

  return { success: overallSuccess, error: errorMsg, logs: db.dispatchLogs };
}

// 10. Dispatch Settings Endpoints
app.get("/api/dispatch/settings", (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    settings: db.dispatchSettings || {
      enabled: false,
      scheduledTime: "12:00",
      targetService: "bale",
    },
    logs: db.dispatchLogs || [],
  });
});

app.post("/api/dispatch/settings", (req: Request, res: Response) => {
  const db = readDb();
  const incoming = req.body.settings;
  if (!incoming || typeof incoming !== "object") {
    res.status(400).json({ error: "تنظیمات نامعتبر است" });
    return;
  }
  db.dispatchSettings = { ...db.dispatchSettings, ...incoming };
  writeDb(db);
  res.json({ success: true, settings: db.dispatchSettings });
});

app.post("/api/dispatch/test", async (req: Request, res: Response) => {
  const db = readDb();
  const incomingSettings = req.body.settings || db.dispatchSettings;
  if (!incomingSettings) {
    res.status(400).json({ error: "تنظیمات ارسال تعریف نشده است" });
    return;
  }

  const result = await executeDispatch(db, incomingSettings);
  if (result.success) {
    res.json({ success: true, logs: result.logs });
  } else {
    res.status(400).json({ success: false, error: result.error, logs: result.logs });
  }
});

// 11. Background Interval Scheduler for 12:00 Tehran Time
function checkScheduledDispatch() {
  const db = readDb();
  const dispatch = db.dispatchSettings;
  if (!dispatch || !dispatch.enabled) return;

  let currentTehranTime = "";
  let currentTehranDate = "";
  try {
    const formatterTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    currentTehranTime = formatterTime.format(new Date());

    const formatterDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    currentTehranDate = formatterDate.format(new Date());
  } catch (e) {
    return;
  }

  const targetTime = dispatch.scheduledTime || "12:00";
  if (currentTehranTime === targetTime && dispatch.lastDispatchDate !== currentTehranDate) {
    console.log(`[AutoDispatch] Triggering 12:00 Tehran dispatch (${currentTehranTime})...`);
    dispatch.lastDispatchDate = currentTehranDate;
    writeDb(db);
    executeDispatch(db, dispatch).catch(console.error);
  }
}

// Check every 30 seconds
setInterval(checkScheduledDispatch, 30000);


// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
