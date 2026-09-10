import React, { useState, useEffect } from "react";
import { 
  X, 
  Send, 
  Check, 
  AlertCircle, 
  Clock, 
  HelpCircle, 
  MessageSquare, 
  Smartphone, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Bot,
  Sparkles
} from "lucide-react";
import { DispatchSettings, DispatchLogItem, Product } from "../types";
import { formatNumberWithCommas, calculateProductPrices } from "../utils/formatters";

interface DispatchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentRateInToman: number;
  onToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const DispatchSettingsModal: React.FC<DispatchSettingsModalProps> = ({
  isOpen,
  onClose,
  products,
  currentRateInToman,
  onToast,
}) => {
  const [settings, setSettings] = useState<DispatchSettings>({
    enabled: false,
    scheduledTime: "12:00",
    targetService: "bale",
    baleBotToken: "",
    baleChatId: "",
    whatsappType: "callmebot",
    whatsappPhone: "",
    whatsappApiKey: "",
    whatsappWebhookUrl: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [logs, setLogs] = useState<DispatchLogItem[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Load existing dispatch settings
  useEffect(() => {
    if (!isOpen) return;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/dispatch/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
          if (Array.isArray(data.logs)) {
            setLogs(data.logs);
          }
        }
      } catch (err) {
        console.error("Failed to load dispatch settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate formatted text for the 3 price lists
  const generatePriceListText = () => {
    const dateStr = new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());

    let text = `📢 لیست قیمت روز محصولات\n`;
    text += `🗓 تاریخ: ${dateStr}\n`;
    text += `💵 نرخ مبنای دلار: ${formatNumberWithCommas(currentRateInToman)} تومان\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    products.forEach((p, idx) => {
      const calc = calculateProductPrices(p, currentRateInToman, true);
      text += `📦 ${idx + 1}. ${p.name} (${p.sku})\n`;
      text += `   🔹 مشتری: ${formatNumberWithCommas(calc.priceInToman)} تومان (${formatNumberWithCommas(calc.priceInRial)} ریال)\n`;
      text += `   🔸 همکار ۳٪: ${formatNumberWithCommas(calc.cooperator3Toman)} تومان\n`;
      text += `   🔸 همکار ۶٪: ${formatNumberWithCommas(calc.cooperator6Toman)} تومان\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🌐 مشاهده آنلاین کاتالوگ قیمت: ${typeof window !== "undefined" ? window.location.origin : ""}/?view=prices`;
    return text;
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/dispatch/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        onToast("تنظیمات ارسال خودکار روزانه با موفقیت ذخیره شد", "success");
      } else {
        throw new Error(data.error || "خطا در ذخیره تنظیمات");
      }
    } catch (err: any) {
      onToast(err.message || "خطا در ذخیره", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Test dispatch right now
  const handleTestDispatch = async () => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/dispatch/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        onToast(`پیام تستی با موفقیت به ${settings.targetService === "bale" ? "بله" : "واتساپ"} ارسال شد`, "success");
        if (data.logs) setLogs(data.logs);
      } else {
        throw new Error(data.error || "خطا در ارسال پیام");
      }
    } catch (err: any) {
      onToast(err.message || "خطا در ارسال پیام تست", "error");
    } finally {
      setIsTesting(false);
    }
  };

  // Copy preview text
  const handleCopyPreview = () => {
    const text = generatePriceListText();
    navigator.clipboard.writeText(text);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2500);
  };

  // Open WhatsApp directly with text
  const handleOpenWhatsAppDirect = () => {
    const text = generatePriceListText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-indigo-100 shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>ارسال روزانه ۳ لیست قیمت (ساعت ۱۲ به وقت تهران)</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  بله و واتساپ
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ارسال خودکار لیست قیمت‌ها هر روز در ساعت ۱۲:۰۰ ظهر به بله یا واتساپ شما
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Main Activation Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div>
              <div className="font-bold text-slate-900 text-sm">فعال‌سازی ارسال خودکار روزانه</div>
              <div className="text-xs text-slate-500 mt-0.5">
                سیستم هر روز سر ساعت مشخص شده، سه دسته قیمت کالاها را آماده و ارسال می‌کند.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-dispatch-enabled"
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Automatic Live Rate Guarantee Box */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
            <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-0.5">دریافت خودکار آخرین نرخ دلار پیش از ارسال:</div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                سامانه قبل از ارسال پیام در ساعت ۱۲ (یا ارسال تستی)، به‌صورت هوشمند تازه‌ترین نرخ دلار روز را مستقیماً از تلگرام استعلام و ثبت نموده، سپس ۳ لیست قیمت را بر پایه نرخ جدید محاسبه و ارسال می‌نماید.
              </p>
            </div>
          </div>

          {/* Time & Target Service Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scheduled Time */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>ساعت ارسال روزانه (به وقت تهران):</span>
              </label>
              <input
                id="input-dispatch-time"
                type="time"
                value={settings.scheduledTime}
                onChange={(e) => setSettings({ ...settings, scheduledTime: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              <span className="text-[11px] text-slate-400 block text-right">
                پیش‌فرض: ساعت ۱۲:۰۰ ظهر
              </span>
            </div>

            {/* Target Messenger */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>پیام‌رسان مقصد:</span>
              </label>
              <select
                id="select-dispatch-target"
                value={settings.targetService}
                onChange={(e) => setSettings({ ...settings, targetService: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              >
                <option value="bale">پیام‌رسان بله (توصیه شده - رایگان و بدون فیلتر)</option>
                <option value="whatsapp">واتساپ (از طریق CallMeBot یا Webhook)</option>
                <option value="both">هر دو (بله و واتساپ)</option>
              </select>
            </div>
          </div>

          {/* Bale Bot Settings Section */}
          {(settings.targetService === "bale" || settings.targetService === "both") && (
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                    بله
                  </div>
                  <span className="font-bold text-emerald-950 text-sm">تنظیمات ربات پیام‌رسان بله</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-emerald-700 text-xs flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>راهنمای ساخت ربات بله (۱ دقیقه)</span>
                </button>
              </div>

              {showGuide && (
                <div className="bg-white border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1.5 leading-relaxed animate-in fade-in">
                  <div className="font-bold">چگونه ربات بله بسازیم؟</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>در پیام‌رسان بله به ربات <strong>@BotFather</strong> پیام دهید.</li>
                    <li>دستور <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">/newbot</code> را بفرستید و یک نام انتخاب کنید.</li>
                    <li>توکن دریافتی (شبیه <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">123456:ABC-DEF...</code>) را در کادر زیر وارد کنید.</li>
                    <li>در بله یک پیام به ربات خود بفرستید؛ شناسه عددی چت شما همان Chat ID است (می‌توانید از ربات @userinfobot یا آیدی عددی حساب خود استفاده کنید).</li>
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">توکن ربات بله (Bot Token):</label>
                  <input
                    id="input-bale-token"
                    type="text"
                    value={settings.baleBotToken || ""}
                    onChange={(e) => setSettings({ ...settings, baleBotToken: e.target.value })}
                    placeholder="مثال: 123456789:AAHK..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      شناسه‌های دریافت‌کننده بله (Chat ID، گروه یا کانال):
                    </label>
                    <span className="text-[10px] text-emerald-700 font-medium">پشتیبانی از چندین نفر همزمان</span>
                  </div>
                  <input
                    id="input-bale-chat-id"
                    type="text"
                    value={settings.baleChatId || ""}
                    onChange={(e) => setSettings({ ...settings, baleChatId: e.target.value })}
                    placeholder="مثال: 115840157, 987654321 یا @my_channel"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                    💡 <strong>ارسال به چندین نفر:</strong> می‌توانید چند شناسه عددی بله را با ویرگول (<code>,</code>) جدا کنید، یا اگر ربات را مدیر یک کانال/گروه بله کرده‌اید، آیدی آن کانال (مانند <code>@my_channel</code>) را وارد کنید تا پیام ساعت ۱۲ به همه اعضا برسد.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Settings Section */}
          {(settings.targetService === "whatsapp" || settings.targetService === "both") && (
            <div className="bg-green-50/40 border border-green-200/80 rounded-2xl p-4.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-950 text-sm">تنظیمات ارسال خودکار به واتساپ</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 flex items-center gap-1">
                    <input
                      type="radio"
                      name="wa_type"
                      checked={settings.whatsappType !== "webhook"}
                      onChange={() => setSettings({ ...settings, whatsappType: "callmebot" })}
                    />
                    <span>CallMeBot (ساده و رایگان)</span>
                  </label>
                  <label className="text-xs text-slate-600 flex items-center gap-1">
                    <input
                      type="radio"
                      name="wa_type"
                      checked={settings.whatsappType === "webhook"}
                      onChange={() => setSettings({ ...settings, whatsappType: "webhook" })}
                    />
                    <span>Webhook سفارشی</span>
                  </label>
                </div>
              </div>

              {settings.whatsappType !== "webhook" ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">شماره واتساپ (با ۹۸):</label>
                      <input
                        id="input-wa-phone"
                        type="text"
                        value={settings.whatsappPhone || ""}
                        onChange={(e) => setSettings({ ...settings, whatsappPhone: e.target.value })}
                        placeholder="+989123456789"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">کلید اختصاصی CallMeBot API:</label>
                      <input
                        id="input-wa-api-key"
                        type="text"
                        value={settings.whatsappApiKey || ""}
                        onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                        placeholder="کد فعال‌سازی ۶ رقمی"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    * برای دریافت کلید رایگان CallMeBot، کافی است در واتساپ به شماره <code className="font-mono font-bold text-slate-700">+34 644 44 20 63</code> پیام متنی <code className="font-mono bg-slate-100 px-1">I allow callmebot to send me messages</code> را بفرستید.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">آدرس وب‌هوک واتساپ (Webhook URL):</label>
                  <input
                    id="input-wa-webhook"
                    type="text"
                    value={settings.whatsappWebhookUrl || ""}
                    onChange={(e) => setSettings({ ...settings, whatsappWebhookUrl: e.target.value })}
                    placeholder="https://api.green-api.com/... یا وب‌هوک دلخواه شما"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    dir="ltr"
                  />
                </div>
              )}
            </div>
          )}

          {/* Quick Manual Actions (Send Now & Direct WhatsApp) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="font-bold text-slate-800 text-xs">ارسال سریع دستی و پیش‌نمایش:</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-test-dispatch"
                onClick={handleTestDispatch}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "در حال ارسال..." : "تست و ارسال فوری هم‌اکنون"}</span>
              </button>

              <button
                id="btn-copy-preview-text"
                onClick={handleCopyPreview}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                {copiedPreview ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPreview ? "متن ۳ لیست کپی شد!" : "کپی متن کامل ۳ لیست قیمت"}</span>
              </button>

              <button
                onClick={handleOpenWhatsAppDirect}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>باز کردن مستقیم در واتساپ</span>
              </button>
            </div>
          </div>

          {/* Recent Dispatch Logs */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-slate-700 text-xs">تاریخچه آخرین ارسال‌ها:</div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {logs.slice(0, 5).map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      log.status === "success" 
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" 
                        : "bg-rose-50/70 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-emerald-600" : "bg-rose-600"}`}></span>
                      <span className="font-semibold">{log.targetService === "bale" ? "بله" : "واتساپ"}:</span>
                      <span className="truncate max-w-[260px] text-[11px] text-slate-600 font-mono">
                        {log.messagePreview || log.errorDetail || "ارسال شد"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-medium transition cursor-pointer"
          >
            انصراف
          </button>
          <button
            id="btn-save-dispatch-settings"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{isSaving ? "در حال ذخیره..." : "ذخیره تنظیمات زمان‌بندی"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
