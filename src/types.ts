export interface PriceHistoryRecord {
  id: string;
  productId: string;
  timestamp: string; // ISO date
  dollarRateInToman: number; // e.g. 228000
  dollarRateInRial: number; // e.g. 2280000
  priceInRial: number; // calculated rounded customer price in Rial
  priceInToman: number; // calculated rounded customer price in Toman
  usdPrice: number; // USD base at time
  shippingUsd: number; // Shipping USD
  profitMarginPercent: number; // Margin applied (e.g. 8%)
  cooperator3Rial: number; // همکار ۳٪ in Rial
  cooperator6Rial: number; // همکار ۶٪ in Rial
  note?: string; // Reason or source (e.g. "بروزرسانی از کانال تلگرام", "تغییر دستی")
}

export interface Product {
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

export interface RateSource {
  channelUsername: string;
  sourceType: 'telegram' | 'manual' | 'ai';
  rateInToman: number; // e.g. 93500 (تومان)
  rateInRial: number;  // e.g. 935000 (ریال)
  lastUpdated: string;
  rawPostText?: string;
  detectedPostTime?: string;
  status: 'success' | 'error' | 'manual';
  errorMessage?: string;
  confidenceScore?: number;
  extractedFromChannel?: string;
}

export interface RateHistoryItem {
  id: string;
  rateInToman: number;
  timestamp: string;
  channel: string;
  method: string;
}

export interface ExchangeSettings {
  activeChannel: string;
  fallbackRateInToman: number;
  defaultProfitMargin: number;
  autoRefreshInterval: number; // in minutes (0 = disabled)
  priceDisplayUnit: 'toman' | 'rial' | 'both';
  roundCalculations: boolean;
  roundStepRial?: number; // e.g. 100000 (رند کردن به ۱۰۰ هزار ریال / ۱۰ هزار تومان)
}

export type PriceTier = 'customer' | 'cooperator3' | 'cooperator6';

export interface TierPriceSummary {
  customerPriceRial: number;
  customerPriceToman: number;
  cooperator3PriceRial: number;
  cooperator3PriceToman: number;
  cooperator6PriceRial: number;
  cooperator6PriceToman: number;
}

export interface DispatchSettings {
  enabled: boolean;
  scheduledTime: string; // e.g. "12:00"
  targetService: 'bale' | 'whatsapp' | 'both';
  appUrl?: string; // Web domain e.g. https://kantinyadak-p.onrender.com
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

export interface DispatchLogItem {
  id: string;
  timestamp: string;
  targetService: string;
  status: 'success' | 'error';
  messagePreview: string;
  errorDetail?: string;
}

export interface PublicPriceItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  customerPriceRial: number;
  customerPriceToman: number;
  cooperator3PriceRial: number;
  cooperator3PriceToman: number;
  cooperator6PriceRial: number;
  cooperator6PriceToman: number;
}

export interface DatabaseState {
  products: Product[];
  currentRate: RateSource;
  settings: ExchangeSettings;
  rateHistory: RateHistoryItem[];
  priceHistory?: PriceHistoryRecord[];
  dispatchSettings?: DispatchSettings;
  dispatchLogs?: DispatchLogItem[];
}

