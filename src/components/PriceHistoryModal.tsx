import React, { useState, useEffect } from "react";
import { 
  X, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Coins, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { Product, PriceHistoryRecord } from "../types";
import { formatNumberWithCommas, formatUSD } from "../utils/formatters";

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currentRateInToman: number;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  isOpen,
  onClose,
  product,
  currentRateInToman,
}) => {
  const [historyList, setHistoryList] = useState<PriceHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !product) return;

    // Fetch up-to-date history from server or use product.priceHistory
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${product.id}/history`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.history) && data.history.length > 0) {
            setHistoryList(data.history);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching product history:", err);
      }

      // Fallback: If no server records yet, generate initial display records
      if (product.priceHistory && product.priceHistory.length > 0) {
        setHistoryList(product.priceHistory);
      } else {
        // Synthesize current record + estimated baseline
        const baseUsd = product.usdPrice + (product.shippingUsd || 0);
        const currentRial = Math.round(baseUsd * (1 + (product.profitMarginPercent || 0) / 100) * currentRateInToman * 10 / 100000) * 100000;
        
        setHistoryList([
          {
            id: "ph_current",
            productId: product.id,
            timestamp: new Date().toISOString(),
            dollarRateInToman: currentRateInToman,
            dollarRateInRial: currentRateInToman * 10,
            priceInRial: currentRial,
            priceInToman: Math.round(currentRial / 10),
            usdPrice: product.usdPrice,
            shippingUsd: product.shippingUsd || 0,
            profitMarginPercent: product.profitMarginPercent || 0,
            cooperator3Rial: Math.round(baseUsd * 1.03 * currentRateInToman * 10 / 100000) * 100000,
            cooperator6Rial: Math.round(baseUsd * 1.06 * currentRateInToman * 10 / 100000) * 100000,
            note: "قیمت لحظه‌ای فعلی",
          }
        ]);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [isOpen, product, currentRateInToman]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 text-base">
                  تاریخچه تغییرات قیمت ریالی
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                  {product.sku}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {product.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Info Ribbon */}
        <div className="px-5 py-3.5 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-900">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>قیمت پایه دلاری کالا: <strong>{formatUSD(product.usdPrice + (product.shippingUsd || 0))}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-indigo-900">
            <Coins className="w-4 h-4 text-indigo-600" />
            <span>نرخ فعلی دلار: <strong>{formatNumberWithCommas(currentRateInToman * 10)} ریال</strong> ({formatNumberWithCommas(currentRateInToman)} تومان)</span>
          </div>
        </div>

        {/* Modal Body / History Timeline Table */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              در حال بارگذاری تاریخچه قیمت...
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Info className="w-8 h-8 text-slate-300 mx-auto" />
              <p>هنوز تاریخچه‌ای برای این محصول ثبت نشده است.</p>
              <p className="text-[11px] text-slate-400">به محض استعلام جدید از تلگرام یا تغییر قیمت، تغییرات ذخیره و ثبت خواهند شد.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>تعداد دفعات ثبت شده: {historyList.length} مورد</span>
                <span>ترتیب: جدیدترین به قدیمی‌ترین</span>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5">تاریخ و ساعت</th>
                      <th className="py-3 px-3.5 text-center">نرخ دلار وقت ثبت</th>
                      <th className="py-3 px-3.5 text-left">قیمت ریالی (رند شده)</th>
                      <th className="py-3 px-3.5 text-left">همکار ۳٪ و ۶٪</th>
                      <th className="py-3 px-3.5">علت / رویداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((rec, idx) => {
                      const dateObj = new Date(rec.timestamp);
                      const formattedDate = !isNaN(dateObj.getTime())
                        ? `${dateObj.toLocaleDateString("fa-IR")} ${dateObj.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`
                        : "اخیراً";

                      // Compare with previous history record to show price trend
                      const prevRecord = historyList[idx + 1];
                      let trend = 0;
                      if (prevRecord && prevRecord.priceInRial) {
                        trend = rec.priceInRial - prevRecord.priceInRial;
                      }

                      return (
                        <tr key={rec.id || idx} className="hover:bg-slate-50/70 transition">
                          {/* Date */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formattedDate}</span>
                            </div>
                            {idx === 0 && (
                              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                                آخرین قیمت فعال
                              </span>
                            )}
                          </td>

                          {/* Dollar Rate */}
                          <td className="py-3 px-3.5 text-center font-mono">
                            <div className="font-bold text-slate-800">
                              {formatNumberWithCommas(rec.dollarRateInRial || rec.dollarRateInToman * 10)}
                              <span className="text-[10px] font-sans font-normal text-slate-400 mr-1">ریال</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ({formatNumberWithCommas(rec.dollarRateInToman)} تومان)
                            </div>
                          </td>

                          {/* Rial Price */}
                          <td className="py-3 px-3.5 text-left font-mono">
                            <div className="font-extrabold text-indigo-950 text-sm">
                              {formatNumberWithCommas(rec.priceInRial)}
                              <span className="text-[10px] font-sans text-indigo-600 mr-1">ریال</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {formatNumberWithCommas(rec.priceInToman)} تومان
                            </div>
                            {trend !== 0 && (
                              <div className={`text-[10px] flex items-center gap-0.5 mt-0.5 justify-end font-sans ${
                                trend > 0 ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"
                              }`}>
                                {trend > 0 ? (
                                  <>
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+{formatNumberWithCommas(trend)} ریال</span>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="w-3 h-3" />
                                    <span>{formatNumberWithCommas(trend)} ریال</span>
                                  </>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Tiers */}
                          <td className="py-3 px-3.5 text-left font-mono text-[11px]">
                            <div className="text-emerald-700">
                              همکار ۳٪: <strong>{formatNumberWithCommas(rec.cooperator3Rial || Math.round(rec.priceInRial * 0.95))}</strong>
                            </div>
                            <div className="text-amber-700 mt-0.5">
                              همکار ۶٪: <strong>{formatNumberWithCommas(rec.cooperator6Rial || Math.round(rec.priceInRial * 0.98))}</strong>
                            </div>
                          </td>

                          {/* Note */}
                          <td className="py-3 px-3.5 text-slate-500 text-[11px] max-w-[160px] truncate" title={rec.note || "ثبت سیستمی"}>
                            {rec.note || "ثبت سیستمی نرخ"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            نرخ‌ها به صورت خودکار با هر استعلام از تلگرام لاگ و رند می‌شوند.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
