import { Product } from "../types";

// Convert English numbers to Persian digits if desired
export function toPersianDigits(n: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

// Format number with commas (e.g. 93,500,000)
export function formatNumberWithCommas(num: number): string {
  if (isNaN(num)) return "0";
  return Math.round(num).toLocaleString("fa-IR");
}

// Format USD currency (e.g. $1,250.00)
export function formatUSD(amount: number): string {
  if (isNaN(amount)) return "$0";
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

// Rounding utility for Iranian currency (Rial & Toman)
// فرمول گرد کردن بر مبنای ۵,۰۰۰ ریال:
// اگر باقیمانده کمتر از ۵,۰۰۰ ریال باشد، کم شده و به صفر تبدیل می‌شود.
// اگر باقیمانده ۵,۰۰۰ ریال یا بیشتر باشد، اضافه شده و به ۱۰,۰۰۰ ریال تبدیل می‌شود.
export function roundToNearestRial(amountRial: number, stepRial: number = 10000): number {
  if (!amountRial || isNaN(amountRial)) return 0;
  const roundedBase = Math.round(amountRial);
  const remainder = roundedBase % 10000;
  if (remainder < 5000) {
    return roundedBase - remainder;
  } else {
    return roundedBase + (10000 - remainder);
  }
}

export function roundToNearestToman(amountToman: number, stepToman: number = 1000): number {
  if (!amountToman || isNaN(amountToman)) return 0;
  const roundedBase = Math.round(amountToman);
  const remainder = roundedBase % 1000;
  if (remainder < 500) {
    return roundedBase - remainder;
  } else {
    return roundedBase + (1000 - remainder);
  }
}

export interface CalculationResult {
  rawUsdTotal: number;
  finalUsd: number;
  // Customer (مشتری)
  priceInToman: number;
  priceInRial: number;
  rawPriceInRial: number;
  rawPriceInToman: number;
  // Cooperator 3% (همکار ۳٪)
  cooperator3Rial: number;
  cooperator3Toman: number;
  rawCoop3Rial: number;
  rawCoop3Toman: number;
  // Cooperator 6% (همکار ۶٪)
  cooperator6Rial: number;
  cooperator6Toman: number;
  rawCoop6Rial: number;
  rawCoop6Toman: number;
  profitAmountToman: number;
}

export function calculateProductPrices(
  product: Product, 
  rateInToman: number, 
  shouldRound: boolean = true,
  roundStepRial: number = 10000 // مبنای ۵,۰۰۰ ریال (تبدیل به ۰ یا ۱۰,۰۰۰ ریال)
): CalculationResult {
  const baseUsd = Number(product.usdPrice) || 0;
  const shippingUsd = Number(product.shippingUsd) || 0;
  const rawUsdTotal = baseUsd + shippingUsd;
  const marginPercent = Number(product.profitMarginPercent) || 0;
  
  // 1. Customer base (قیمت مشتری بر مبنای سود تعریف شده)
  const finalUsd = rawUsdTotal * (1 + marginPercent / 100);
  const rawPriceInToman = finalUsd * rateInToman;
  const rawPriceInRial = rawPriceInToman * 10;

  // 2. Cooperator 3% (۳٪ کمتر از قیمت مشتری)
  const rawCoop3Rial = rawPriceInRial * (1 - 0.03);
  const rawCoop3Toman = rawPriceInToman * (1 - 0.03);

  // 3. Cooperator 6% (۶٪ کمتر از قیمت مشتری)
  const rawCoop6Rial = rawPriceInRial * (1 - 0.06);
  const rawCoop6Toman = rawPriceInToman * (1 - 0.06);

  // Apply rounding if requested
  const priceInRial = shouldRound ? roundToNearestRial(rawPriceInRial, roundStepRial) : Math.round(rawPriceInRial);
  const priceInToman = Math.round(priceInRial / 10);

  const cooperator3Rial = shouldRound ? roundToNearestRial(rawCoop3Rial, roundStepRial) : Math.round(rawCoop3Rial);
  const cooperator3Toman = Math.round(cooperator3Rial / 10);

  const cooperator6Rial = shouldRound ? roundToNearestRial(rawCoop6Rial, roundStepRial) : Math.round(rawCoop6Rial);
  const cooperator6Toman = Math.round(cooperator6Rial / 10);
  
  const baseCostToman = Math.round(rawUsdTotal * rateInToman);
  const profitAmountToman = Math.max(0, priceInToman - baseCostToman);

  return {
    rawUsdTotal,
    finalUsd,
    priceInToman,
    priceInRial,
    rawPriceInRial: Math.round(rawPriceInRial),
    rawPriceInToman: Math.round(rawPriceInToman),
    cooperator3Rial,
    cooperator3Toman,
    rawCoop3Rial: Math.round(rawCoop3Rial),
    rawCoop3Toman: Math.round(rawCoop3Toman),
    cooperator6Rial,
    cooperator6Toman,
    rawCoop6Rial: Math.round(rawCoop6Rial),
    rawCoop6Toman: Math.round(rawCoop6Toman),
    profitAmountToman,
  };
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "نامشخص";
    
    // Check if it's within today
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "همین الان";
    if (diffMins < 60) return `${diffMins} دقیقه قبل`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ساعت قبل`;
    
    return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "اخیراً";
  }
}
