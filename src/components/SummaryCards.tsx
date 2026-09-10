import React from "react";
import { Package, DollarSign, Coins, Calculator } from "lucide-react";
import { Product } from "../types";
import { calculateProductPrices, formatNumberWithCommas, formatUSD } from "../utils/formatters";

interface SummaryCardsProps {
  products: Product[];
  rateInToman: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ products, rateInToman }) => {
  const totalItemsCount = products.length;
  const totalStockCount = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

  // Total USD sum (considering stock)
  const totalUsdValue = products.reduce((sum, p) => {
    const calc = calculateProductPrices(p, rateInToman);
    const stock = Number(p.stock) > 0 ? Number(p.stock) : 1;
    return sum + (calc.finalUsd * stock);
  }, 0);

  // Total Toman sum (considering stock)
  const totalTomanValue = products.reduce((sum, p) => {
    const calc = calculateProductPrices(p, rateInToman);
    const stock = Number(p.stock) > 0 ? Number(p.stock) : 1;
    return sum + (calc.priceInToman * stock);
  }, 0);

  // Total expected profit
  const totalProfitToman = products.reduce((sum, p) => {
    const calc = calculateProductPrices(p, rateInToman);
    const stock = Number(p.stock) > 0 ? Number(p.stock) : 1;
    return sum + (calc.profitAmountToman * stock);
  }, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Products */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">تعداد کالا در کاتالوگ</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800 font-mono">
            {formatNumberWithCommas(totalItemsCount)}
          </span>
          <span className="text-xs text-slate-500">عنوان کالا</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          مجموع کل موجودی: <span className="font-semibold text-slate-600">{formatNumberWithCommas(totalStockCount)}</span> عدد
        </div>
      </div>

      {/* Card 2: Total USD Worth */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">ارزش کل دلاری کاتالوگ</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1" dir="ltr">
          <span className="text-2xl font-bold text-slate-800 font-mono">
            {formatUSD(totalUsdValue)}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          بر مبنای قیمت دلاری + هزینه حمل
        </div>
      </div>

      {/* Card 3: Total Toman Worth */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">ارزش معادل تومانی کل انبار</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Coins className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-slate-800 font-mono">
            {formatNumberWithCommas(totalTomanValue)}
          </span>
          <span className="text-xs font-bold text-amber-600">تومان</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          معادل: {formatNumberWithCommas(totalTomanValue * 10)} ریال
        </div>
      </div>

      {/* Card 4: Expected Profit */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">سود برآوردی فروش</span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Calculator className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
            {formatNumberWithCommas(totalProfitToman)}
          </span>
          <span className="text-xs font-bold text-emerald-600">تومان</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          محاسبه با احتساب درصدهای سود تعیین شده
        </div>
      </div>
    </div>
  );
};
