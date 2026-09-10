import React, { useState } from "react";
import { X, Send, Check, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { ExchangeSettings } from "../types";

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ExchangeSettings;
  onSaveSettings: (newSettings: Partial<ExchangeSettings>) => void;
  onTestChannel: (channelName: string) => Promise<any>;
}

const POPULAR_CHANNELS = [
  { username: "tgju_org", title: "کانال رسمی شبکه اطلاع رسانی طلا و ارز (TGJU)" },
  { username: "dolar_tehran", title: "اطلاع رسانی قیمت دلار تهران و سبزه میدان" },
  { username: "bonbast_rates", title: "نرخ ارزهای آزاد و حواله" },
  { username: "irandollar", title: "کانال قیمت لحظه‌ای دلار و تتر" },
];

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestChannel,
}) => {
  const [channel, setChannel] = useState(settings.activeChannel || "tgju_org");
  const [defaultMargin, setDefaultMargin] = useState(settings.defaultProfitMargin || 10);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rate?: number } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!channel.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestChannel(channel.trim());
      if (res.success) {
        setTestResult({
          success: true,
          message: `استعلام موفقیت‌آمیز بود! نرخ شناسایی شده: ${res.currentRate.rateInToman.toLocaleString("fa-IR")} تومان`,
          rate: res.currentRate.rateInToman,
        });
      } else {
        setTestResult({
          success: false,
          message: res.warning || res.error || "کانال بررسی شد اما نرخ دلار در پیام‌های اخیر یافت نشد.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "خطا در استعلام از تلگرام",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      activeChannel: channel.trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\/(s\/)?/i, ""),
      defaultProfitMargin: Number(defaultMargin) || 10,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                تنظیمات کانال تلگرام و استعلام نرخ
              </h3>
              <p className="text-xs text-slate-500">
                مشخص کنید سیستم قیمت دلار را از چه کانالی استخراج کند
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Channel input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              آیدی یا آدرس کانال عمومی تلگرام
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="telegram-channel-input"
                  type="text"
                  value={channel}
                  onChange={(e) => {
                    setChannel(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="مثال: tgju_org یا https://t.me/s/channel_name"
                  dir="ltr"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm outline-hidden transition font-mono text-left"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">@</span>
              </div>
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || !channel.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "در حال تست..." : "تست آنلاین"}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              * این سیستم پیش‌نمایش وب کانال‌های عمومی تلگرام (<span dir="ltr" className="font-mono text-indigo-600">t.me/s/...</span>) را خوانده و با الگوریتم‌های هوش مصنوعی و تطبیق متن فارسی، نرخ را استخراج می‌کند. نیازی به فیلترشکن در مرورگر شما نیست!
            </p>
          </div>

          {/* Test result message */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                {testResult.message}
              </div>
            </div>
          )}

          {/* Popular Channels Quick Select */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              کانال‌های پیشنهادی معتبر نرخ ارز:
            </span>
            <div className="space-y-2">
              {POPULAR_CHANNELS.map((item) => (
                <button
                  key={item.username}
                  type="button"
                  onClick={() => {
                    setChannel(item.username);
                    setTestResult(null);
                  }}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs transition flex items-center justify-between cursor-pointer ${
                    channel === item.username
                      ? "border-sky-500 bg-sky-50/70 text-sky-950 font-medium"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <span className="block font-medium">{item.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                      @{item.username}
                    </span>
                  </div>
                  {channel === item.username && (
                    <Check className="w-4 h-4 text-sky-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Default Profit margin */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              درصد سود پیش‌فرض برای محصولات جدید (٪)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={defaultMargin}
              onChange={(e) => setDefaultMargin(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition font-mono"
            />
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/80 flex items-center gap-2 text-xs text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              سیستم به هوش مصنوعی مجهز است و به طور خودکار عباراتی مانند «دلار نقدی»، «دلار هرات»، «حواله» را در پست‌های فارسی تلگرام تشخیص می‌دهد.
            </span>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره و اعمال کانال</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
