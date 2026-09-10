import React, { useState } from "react";
import { X, Send, Eye, CheckCircle, Clock, FileText, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { RateSource } from "../types";
import { formatNumberWithCommas, formatRelativeTime } from "../utils/formatters";

interface TelegramPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRate: RateSource;
  previewMessages?: string[];
  onRateUpdated?: (newRate: RateSource) => void;
}

export const TelegramPreviewModal: React.FC<TelegramPreviewModalProps> = ({
  isOpen,
  onClose,
  currentRate,
  previewMessages = [],
  onRateUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"channel" | "paste">("channel");
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParsePastedText = async () => {
    if (!pastedText.trim()) {
      setPasteError("لطفاً متن پیام یا پست تلگرام را وارد کنید");
      return;
    }

    setIsProcessing(true);
    setPasteError(null);
    setPasteSuccess(null);

    try {
      const res = await fetch("/api/rates/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.currentRate) {
        setPasteSuccess(`نرخ ${formatNumberWithCommas(data.currentRate.rateInToman)} تومان با موفقیت استخراج و در سامانه اعمال شد.`);
        if (onRateUpdated) {
          onRateUpdated(data.currentRate);
        }
      } else {
        setPasteError(data.error || "خطا در استخراج نرخ از متن ارسالی");
      }
    } catch (err: any) {
      setPasteError(err.message || "خطای ارتباط با سرور");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                مشاهده و استخراج از پست‌های تلگرام
              </h3>
              <p className="text-xs text-slate-500">
                مشاهده استعلام‌های کانال @{currentRate.channelUsername} یا استخراج مستقیم از متن
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 border-b border-slate-100 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("channel")}
            className={`pb-2.5 border-b-2 transition cursor-pointer ${
              activeTab === "channel"
                ? "border-sky-600 text-sky-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            پیام‌های اخیر کانال تلگرام
          </button>
          <button
            onClick={() => setActiveTab("paste")}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "paste"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>استخراج از متن پیست شده</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Rate Summary banner */}
          <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl border border-sky-200/80 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[11px] text-sky-800 font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-sky-600" />
                <span>نرخ فعال در سامانه:</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {formatNumberWithCommas(currentRate.rateInToman)} تومان
              </div>
            </div>
            <div className="text-left text-xs text-slate-500">
              <div className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentRate.detectedPostTime || formatRelativeTime(currentRate.lastUpdated)}</span>
              </div>
              <span className="font-mono text-slate-600">
                {formatNumberWithCommas(currentRate.rateInRial)} ریال
              </span>
            </div>
          </div>

          {activeTab === "channel" ? (
            <>
              {/* Detected snippet if available */}
              {currentRate.rawPostText && (
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                    بخش تشخیص داده شده توسط سامانه:
                  </span>
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 font-mono whitespace-pre-wrap leading-relaxed">
                    {currentRate.rawPostText}
                  </div>
                </div>
              )}

              {/* Raw messages from telegram */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  متن کامل آخرین پیام‌های دریافتی از تلگرام:
                </span>
                {previewMessages && previewMessages.length > 0 ? (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {previewMessages.map((msg, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 mb-1.5 border-b border-slate-200">
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3 text-sky-500" />
                            پیام {idx + 1} از {previewMessages.length}
                          </span>
                        </div>
                        {msg}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    متن کامل برای نمایش در حافظه موقت وجود ندارد. می‌توانید با کلیک بر روی دکمه «استعلام زنده از تلگرام» مجدداً پیام‌ها را دریافت نمایید.
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Paste Raw Text Tab */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  متن پست تلگرام را اینجا پیست کنید:
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="مثال:&#10;💵 دلار: 233,290🔻  4300🔼 %1.88+&#10;💶 یورو: 271,520🔻..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden leading-relaxed text-right dir-rtl"
                />
              </div>

              {pasteError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}

              {pasteSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{pasteSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={isProcessing || !pastedText.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? "در حال پردازش متن..." : "استخراج و اعمال قیمت دلار"}</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
            >
              بستن پنجره
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
