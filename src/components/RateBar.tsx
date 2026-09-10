import React, { useState } from "react";
import { 
  Send, 
  RefreshCw, 
  Edit3, 
  Settings2, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from "lucide-react";
import { RateSource, ExchangeSettings } from "../types";
import { formatNumberWithCommas, formatRelativeTime } from "../utils/formatters";

interface RateBarProps {
  currentRate: RateSource;
  settings: ExchangeSettings;
  isFetching: boolean;
  onRefreshFromTelegram: () => void;
  onOpenManualModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenPreviewModal: () => void;
}

export const RateBar: React.FC<RateBarProps> = ({
  currentRate,
  settings,
  isFetching,
  onRefreshFromTelegram,
  onOpenManualModal,
  onOpenSettingsModal,
  onOpenPreviewModal,
}) => {
  const [copied, setCopied] = useState(false);

  const copyRate = () => {
    navigator.clipboard.writeText(currentRate.rateInToman.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          
          {/* Rate Title & Details */}
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  نرخ مبنای سیستم
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  منبع: 
                  <strong className="text-sky-300 font-mono" dir="ltr">
                    @{currentRate.channelUsername || settings.activeChannel}
                  </strong>
                </span>
                <span className="text-xs text-slate-400">
                  بروزرسانی: {formatRelativeTime(currentRate.lastUpdated)}
                </span>
              </div>

              {/* Huge Rate display */}
              <div className="mt-2 flex items-baseline gap-3 flex-wrap">
                <div 
                  onClick={copyRate} 
                  title="کلیک برای کپی عدد تومان"
                  className="cursor-pointer group flex items-baseline gap-2 bg-white/5 hover:bg-white/10 transition px-3 py-1.5 rounded-xl border border-white/10"
                >
                  <span className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                    {formatNumberWithCommas(currentRate.rateInToman)}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-amber-400">
                    تومان
                  </span>
                  {copied && (
                    <span className="text-xs text-emerald-300 font-normal">کپی شد!</span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 text-slate-300 text-sm sm:text-base bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="font-mono text-slate-200 font-semibold text-base sm:text-lg">
                    {formatNumberWithCommas(currentRate.rateInRial)}
                  </span>
                  <span className="text-xs text-slate-400">ریال</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              id="refresh-telegram-rate-btn"
              onClick={onRefreshFromTelegram}
              disabled={isFetching}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-white font-medium text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              <span>{isFetching ? "در حال استعلام از تلگرام..." : "استعلام زنده از تلگرام"}</span>
            </button>

            <button
              id="set-manual-rate-btn"
              onClick={onOpenManualModal}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-slate-100 font-medium text-sm transition border border-white/10 cursor-pointer"
              title="تعیین نرخ دلخواه بدون تلگرام"
            >
              <Edit3 className="w-4 h-4" />
              <span>نرخ دستی</span>
            </button>

            <button
              id="preview-messages-btn"
              onClick={onOpenPreviewModal}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-slate-100 font-medium text-sm transition border border-white/10 cursor-pointer"
              title="مشاهده آخرین متن دریافت شده از کانال تلگرام"
            >
              <Eye className="w-4 h-4" />
              <span>پست تلگرام</span>
            </button>

            <button
              id="settings-telegram-btn"
              onClick={onOpenSettingsModal}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-slate-100 transition border border-white/10 cursor-pointer"
              title="تنظیمات کانال تلگرام"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Sub Bar with source note & quick advice */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          {currentRate.status === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : currentRate.status === "manual" ? (
            <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>
            {currentRate.sourceType === "ai" 
              ? "استخراج هوشمند توسط هوش مصنوعی از پست‌های کانال تلگرام"
              : currentRate.sourceType === "manual"
              ? "نرخ به صورت دستی تنظیم گردیده است"
              : `استخراج مستقیم از آخرین متن تلگرام @${currentRate.channelUsername}`}
          </span>
          {currentRate.rawPostText && (
            <span className="hidden md:inline-block text-slate-400 truncate max-w-md" title={currentRate.rawPostText}>
              | بخش شناسایی شده: «{currentRate.rawPostText.slice(0, 60)}...»
            </span>
          )}
        </div>

        <div className="text-slate-500 font-mono text-[11px]" dir="ltr">
          1 USD = {formatNumberWithCommas(currentRate.rateInToman)} Toman = {formatNumberWithCommas(currentRate.rateInRial)} IRR
        </div>
      </div>
    </div>
  );
};
