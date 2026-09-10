import React, { useState } from "react";
import { Calculator, ArrowLeftRight, Copy, Check } from "lucide-react";
import { formatNumberWithCommas, formatUSD } from "../utils/formatters";

interface QuickConverterProps {
  rateInToman: number;
}

export const QuickConverter: React.FC<QuickConverterProps> = ({ rateInToman }) => {
  const [usdInput, setUsdInput] = useState<number | string>(100);
  const [copied, setCopied] = useState(false);

  const numUsd = Number(usdInput) || 0;
  const resultToman = Math.round(numUsd * rateInToman);
  const resultRial = resultToman * 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(resultToman.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calculator className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">ماشین حساب تبدیل سریع ارز</h3>
            <p className="text-[11px] text-slate-400">محاسبه آنی بر اساس نرخ تلگرام ({formatNumberWithCommas(rateInToman)} تومان)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* USD Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">مبلغ دلاری ($ USD):</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={usdInput}
              onChange={(e) => setUsdInput(e.target.value)}
              placeholder="100"
              dir="ltr"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-mono font-bold outline-hidden"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="hidden md:flex justify-center text-slate-400 pt-4">
          <ArrowLeftRight className="w-5 h-5" />
        </div>

        {/* Calculated Output */}
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">معادل تومانی:</div>
            <div className="text-base font-extrabold text-slate-900 font-mono">
              {formatNumberWithCommas(resultToman)}
              <span className="text-xs font-bold text-amber-600 mr-1 font-sans">تومان</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {formatNumberWithCommas(resultRial)} ریال
            </div>
          </div>
          <button
            onClick={handleCopy}
            title="کپی نتیجه تومانی"
            className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
