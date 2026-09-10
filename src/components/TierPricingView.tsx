import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  Users, 
  Briefcase, 
  Building2, 
  HelpCircle,
  SlidersHorizontal,
  FileSpreadsheet
} from "lucide-react";
import { Product } from "../types";
import { 
  calculateProductPrices, 
  formatNumberWithCommas, 
  formatUSD 
} from "../utils/formatters";

interface TierPricingViewProps {
  products: Product[];
  rateInToman: number;
  shouldRound: boolean;
  onToggleRound?: () => void;
}

export const TierPricingView: React.FC<TierPricingViewProps> = ({
  products,
  rateInToman,
  shouldRound,
  onToggleRound,
}) => {
  const [copiedTier, setCopiedTier] = useState<string | null>(null);

  // Helper to copy text to clipboard
  const copyToClipboard = async (tierName: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTier(tierName);
      setTimeout(() => setCopiedTier(null), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedTier(tierName);
      setTimeout(() => setCopiedTier(null), 2500);
    }
  };

  // Generate clean plain-text for copying: اسم محصول - قیمت به ریال (بدون هیچ چیز اضافه)
  const generateCopyText = (tierType: 'customer' | 'coop3' | 'coop6') => {
    return products.map((p) => {
      const calc = calculateProductPrices(p, rateInToman, shouldRound);
      let rialPrice = 0;
      if (tierType === "customer") {
        rialPrice = shouldRound ? calc.priceInRial : calc.rawPriceInRial;
      } else if (tierType === "coop3") {
        rialPrice = shouldRound ? calc.cooperator3Rial : calc.rawCoop3Rial;
      } else {
        rialPrice = shouldRound ? calc.cooperator6Rial : calc.rawCoop6Rial;
      }

      return `${p.name} - ${formatNumberWithCommas(rialPrice)} ریال`;
    }).join("\n");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Rounding Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <h2 className="font-extrabold text-slate-800 text-lg">
              صفحه قیمت‌های ریالی در سه سطح (مشتری، همکار ۳٪، همکار ۶٪)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            با کلیک روی دکمه یا کارت هر دسته، متن ساده قیمت‌ها (اسم محصول - قیمت به ریال) بدون هیچ چیز اضافی کپی می‌شود.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Rounding Status Indicator */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 font-medium">وضعیت رند کردن:</span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
              shouldRound 
                ? "bg-emerald-100 text-emerald-800" 
                : "bg-amber-100 text-amber-800"
            }`}>
              {shouldRound ? "فعال (مبنای ۵,۰۰۰ ریال: تبدیل به ۰ یا ۱۰,۰۰۰ ریال)" : "دقیق و بدون رند"}
            </span>
            {onToggleRound && (
              <button
                onClick={onToggleRound}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer mr-1"
              >
                {shouldRound ? "غیرفعال‌سازی" : "فعال‌سازی رند"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Interactive Category Cards with 1-Click Copy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tier 1: Customer */}
        <div 
          id="tier-card-customer"
          onClick={() => copyToClipboard("customer", generateCopyText("customer"))}
          className="group relative bg-gradient-to-b from-white to-slate-50/70 border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer select-none"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  دسته اول
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  قیمت مشتری
                </h3>
              </div>
            </div>

            <button
              id="copy-btn-customer"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard("customer", generateCopyText("customer"));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                copiedTier === "customer"
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 group-hover:bg-indigo-700 text-white shadow-xs"
              }`}
            >
              {copiedTier === "customer" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی همه قیمت‌ها</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            قیمت مصرف‌کننده نهایی با احتساب سود فروشگاهی تعریف شده هر کالا.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>تعداد محصولات: <strong>{products.length}</strong></span>
            <span className="text-indigo-600 group-hover:underline text-[11px] font-medium flex items-center gap-1">
              کلیک کنید تا کپی شود ↵
            </span>
          </div>
        </div>

        {/* Tier 2: Colleague 3% */}
        <div 
          id="tier-card-coop3"
          onClick={() => copyToClipboard("coop3", generateCopyText("coop3"))}
          className="group relative bg-gradient-to-b from-white to-slate-50/70 border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer select-none"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  دسته دوم
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  همکار ۳٪
                </h3>
              </div>
            </div>

            <button
              id="copy-btn-coop3"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard("coop3", generateCopyText("coop3"));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                copiedTier === "coop3"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-600 group-hover:bg-emerald-700 text-white shadow-xs"
              }`}
            >
              {copiedTier === "coop3" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی همه قیمت‌ها</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            قیمت ریالی با ۳٪ تخفیف نسبت به قیمت مشتری ویژه همکاران خرید عمده و هم‌صنف.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>تعداد محصولات: <strong>{products.length}</strong></span>
            <span className="text-emerald-700 group-hover:underline text-[11px] font-medium flex items-center gap-1">
              کلیک کنید تا کپی شود ↵
            </span>
          </div>
        </div>

        {/* Tier 3: Colleague 6% */}
        <div 
          id="tier-card-coop6"
          onClick={() => copyToClipboard("coop6", generateCopyText("coop6"))}
          className="group relative bg-gradient-to-b from-white to-slate-50/70 border-2 border-slate-200 hover:border-amber-500 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer select-none"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                  دسته سوم
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  همکار ۶٪
                </h3>
              </div>
            </div>

            <button
              id="copy-btn-coop6"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard("coop6", generateCopyText("coop6"));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                copiedTier === "coop6"
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-600 group-hover:bg-amber-700 text-white shadow-xs"
              }`}
            >
              {copiedTier === "coop6" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی همه قیمت‌ها</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            قیمت ریالی با ۶٪ تخفیف نسبت به قیمت مشتری ویژه نمایندگان توزیع، خورده‌فروشی و شهرستان.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>تعداد محصولات: <strong>{products.length}</strong></span>
            <span className="text-amber-700 group-hover:underline text-[11px] font-medium flex items-center gap-1">
              کلیک کنید تا کپی شود ↵
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Side-by-Side Comparison Table for all 3 tiers */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <span>جدول مقایسه‌ای قیمت‌های ریالی هر ۳ دسته</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تمام قیمت‌های زیر بر اساس نرخ دلار {formatNumberWithCommas(rateInToman * 10)} ریال محاسبه و رند شده‌اند.
            </p>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>برای کپی تکی هر قیمت، روی مقدار ریالی آن کلیک کنید.</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">ردیف</th>
                <th className="py-3.5 px-4">کالا و مشخصات</th>
                <th className="py-3.5 px-4 text-left">قیمت دلاری ($)</th>
                
                {/* Category 1 header */}
                <th className="py-3.5 px-4 bg-indigo-50/60 border-x border-indigo-100/80">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-900 font-bold">قیمت مشتری (ریال)</span>
                    <button
                      onClick={() => copyToClipboard("customer", generateCopyText("customer"))}
                      className="p-1 rounded text-indigo-600 hover:bg-indigo-100 transition"
                      title="کپی کل این ستون"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>

                {/* Category 2 header */}
                <th className="py-3.5 px-4 bg-emerald-50/60 border-x border-emerald-100/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-emerald-900 font-bold block">همکار ۳٪</span>
                      <span className="text-[10px] text-emerald-700 font-normal">۳٪ کمتر از مشتری</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("coop3", generateCopyText("coop3"))}
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-100 transition"
                      title="کپی کل این ستون"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>

                {/* Category 3 header */}
                <th className="py-3.5 px-4 bg-amber-50/60 border-x border-amber-100/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-amber-900 font-bold block">همکار ۶٪</span>
                      <span className="text-[10px] text-amber-700 font-normal">۶٪ کمتر از مشتری</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard("coop6", generateCopyText("coop6"))}
                      className="p-1 rounded text-amber-600 hover:bg-amber-100 transition"
                      title="کپی کل این ستون"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product, index) => {
                const calc = calculateProductPrices(product, rateInToman, shouldRound);
                const rawTotalUsd = product.usdPrice + (product.shippingUsd || 0);

                return (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        {product.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-400">{product.sku}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-md bg-slate-100 text-slate-600">
                          {product.category}
                        </span>
                      </div>
                    </td>

                    {/* USD total */}
                    <td className="py-3.5 px-4 text-left font-mono">
                      <div className="font-bold text-slate-800 text-xs">
                        {formatUSD(rawTotalUsd)}
                      </div>
                      {product.shippingUsd > 0 && (
                        <div className="text-[10px] text-slate-400">
                          +{formatUSD(product.shippingUsd)} کرایه
                        </div>
                      )}
                    </td>

                    {/* Category 1: Customer */}
                    <td 
                      onClick={() => {
                        const rial = shouldRound ? calc.priceInRial : calc.rawPriceInRial;
                        copyToClipboard(
                          `cell_cust_${product.id}`,
                          `${product.name} - ${formatNumberWithCommas(rial)} ریال`
                        );
                      }}
                      className="py-3.5 px-4 bg-indigo-50/20 border-x border-indigo-100/50 hover:bg-indigo-50/50 cursor-pointer transition"
                      title="کلیک برای کپی قیمت این کالا"
                    >
                      <div className="font-extrabold text-indigo-950 font-mono text-sm">
                        {formatNumberWithCommas(calc.priceInRial)}
                        <span className="text-[10px] font-sans text-indigo-600 mr-1">ریال</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-sans">گرد نشده:</span>
                        <span>{formatNumberWithCommas(calc.rawPriceInRial)} ریال</span>
                      </div>
                    </td>

                    {/* Category 2: Cooperator 3% */}
                    <td 
                      onClick={() => {
                        const rial = shouldRound ? calc.cooperator3Rial : calc.rawCoop3Rial;
                        copyToClipboard(
                          `cell_c3_${product.id}`,
                          `${product.name} - ${formatNumberWithCommas(rial)} ریال`
                        );
                      }}
                      className="py-3.5 px-4 bg-emerald-50/20 border-x border-emerald-100/50 hover:bg-emerald-50/50 cursor-pointer transition"
                      title="کلیک برای کپی قیمت این کالا"
                    >
                      <div className="font-extrabold text-emerald-950 font-mono text-sm">
                        {formatNumberWithCommas(calc.cooperator3Rial)}
                        <span className="text-[10px] font-sans text-emerald-600 mr-1">ریال</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-sans">گرد نشده:</span>
                        <span>{formatNumberWithCommas(calc.rawCoop3Rial)} ریال</span>
                      </div>
                    </td>

                    {/* Category 3: Cooperator 6% */}
                    <td 
                      onClick={() => {
                        const rial = shouldRound ? calc.cooperator6Rial : calc.rawCoop6Rial;
                        copyToClipboard(
                          `cell_c6_${product.id}`,
                          `${product.name} - ${formatNumberWithCommas(rial)} ریال`
                        );
                      }}
                      className="py-3.5 px-4 bg-amber-50/20 border-x border-amber-100/50 hover:bg-amber-50/50 cursor-pointer transition"
                      title="کلیک برای کپی قیمت این کالا"
                    >
                      <div className="font-extrabold text-amber-950 font-mono text-sm">
                        {formatNumberWithCommas(calc.cooperator6Rial)}
                        <span className="text-[10px] font-sans text-amber-600 mr-1">ریال</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-sans">گرد نشده:</span>
                        <span>{formatNumberWithCommas(calc.rawCoop6Rial)} ریال</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
