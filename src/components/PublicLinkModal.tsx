import React, { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Globe, 
  Send,
  Users,
  UserCheck,
  Building2,
  Sparkles
} from "lucide-react";

interface PublicLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateInToman: number;
  productCount: number;
}

export const PublicLinkModal: React.FC<PublicLinkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedTier, setCopiedTier] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const tiers = [
    {
      id: "customer",
      name: "لینک اختصاصی مشتریان (مصرف‌کننده)",
      subtitle: "مشتری فقط نام کالا و قیمت مصرف‌کننده را می‌بیند و از قیمت همکار کاملاً بی‌خبر می‌ماند.",
      url: `${origin}/?view=prices&tier=customer`,
      icon: Users,
      badge: "قیمت تک‌فروشی",
      colorClasses: {
        bg: "bg-slate-50 border-slate-200",
        badge: "bg-slate-100 text-slate-800 border-slate-300",
        icon: "bg-slate-800 text-white",
        btn: "bg-slate-900 hover:bg-slate-800 text-white",
      },
    },
    {
      id: "coop3",
      name: "لینک اختصاصی همکاران (سطح ۱ - تخفیف ۳٪)",
      subtitle: "مخصوص همکاران معمولی؛ قیمت مشتری یا قیمت ۶٪ عمده برای همکار مخفی است.",
      url: `${origin}/?view=prices&tier=coop3`,
      icon: UserCheck,
      badge: "همکار ۳٪",
      colorClasses: {
        bg: "bg-indigo-50/50 border-indigo-200",
        badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: "bg-indigo-600 text-white",
        btn: "bg-indigo-600 hover:bg-indigo-700 text-white",
      },
    },
    {
      id: "coop6",
      name: "لینک اختصاصی همکاران ویژه (سطح ۲ - عمده ۶٪)",
      subtitle: "مخصوص همکاران عمده و مشتریان ویژه؛ سایر سطوح برای کاربر نمایش داده نمی‌شود.",
      url: `${origin}/?view=prices&tier=coop6`,
      icon: Building2,
      badge: "همکار ۶٪ / عمده",
      colorClasses: {
        bg: "bg-emerald-50/50 border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: "bg-emerald-600 text-white",
        btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
      },
    },
  ];

  const handleCopy = (tierId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTier(tierId);
    setTimeout(() => setCopiedTier(null), 2500);
  };

  const handleOpen = (url: string) => {
    window.open(url, "_blank");
  };

  const handleShareWhatsApp = (tierName: string, url: string) => {
    const msg = `سلام، لیست قیمت روز کالاها:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">لینک‌های مجزای لیست قیمت</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                هر دسته لینک جداگانه دارد تا هیچ‌کس از قیمت دسته دیگر مطلع نشود
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

        {/* Content: 3 Tier Cards */}
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {tiers.map((t) => {
            const Icon = t.icon;
            const isCopied = copiedTier === t.id;

            return (
              <div 
                key={t.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${t.colorClasses.bg}`}
              >
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${t.colorClasses.icon}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {t.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${t.colorClasses.badge}`}>
                    {t.badge}
                  </span>
                </div>

                {/* Subtitle / Guarantee of isolation */}
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  {t.subtitle}
                </p>

                {/* URL Display Bar */}
                <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-xl mb-2.5">
                  <span className="text-[11px] font-mono text-slate-600 truncate flex-1 px-1.5" dir="ltr">
                    {t.url}
                  </span>
                  <button
                    onClick={() => handleCopy(t.id, t.url)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                      isCopied ? "bg-emerald-600 text-white" : t.colorClasses.btn
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "کپی شد" : "کپی لینک"}</span>
                  </button>
                </div>

                {/* Action Shortcuts */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpen(t.url)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>مشاهده صفحه</span>
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp(t.name, t.url)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ارسال در واتساپ</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Privacy & Security Note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>امنیت کامل:</strong> قیمت خرید دلاری، حاشیه سود و نرخ سایر همکاران در هیچ‌یک از لینک‌ها برای شخص مقابل قابل مشاهده نخواهد بود.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
