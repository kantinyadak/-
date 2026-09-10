import React, { useRef, useState } from "react";
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle, 
  Cloud, 
  Laptop, 
  Smartphone,
  RefreshCw
} from "lucide-react";
import { Product, RateSource, ExchangeSettings } from "../types";
import { calculateProductPrices, formatNumberWithCommas, formatUSD } from "../utils/formatters";

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentRate: RateSource;
  settings?: ExchangeSettings;
  onDatabaseRestored: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  products,
  currentRate,
  onDatabaseRestored,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download JSON Backup
  const handleDownloadBackup = async () => {
    try {
      setIsExporting(true);
      const res = await fetch("/api/database/backup");
      if (!res.ok) throw new Error("خطا در دریافت فایل پشتیبان از سرور");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `exchange_products_database_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setStatusMsg({ text: "فایل پشتیبان کامل دیتابیس (JSON) با موفقیت دانلود شد.", type: "success" });
    } catch (err: any) {
      setStatusMsg({ text: err.message || "خطا در دانلود دیتابیس", type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export to Excel / CSV with unrounded and rounded prices
  const handleExportCSV = () => {
    try {
      const headers = [
        "ردیف",
        "کد کالا (SKU)",
        "نام محصول",
        "دسته‌بندی",
        "قیمت دلاری ($)",
        "هزینه حمل دلاری ($)",
        "سود درصد",
        "قیمت رند شده (ریال)",
        "قیمت رند نشده / دقیق (ریال)",
        "موجودی",
        "توضیحات"
      ];

      const rows = products.map((p, idx) => {
        const calc = calculateProductPrices(p, currentRate.rateInToman, true);
        return [
          idx + 1,
          `"${(p.sku || "").replace(/"/g, '""')}"`,
          `"${(p.name || "").replace(/"/g, '""')}"`,
          `"${(p.category || "").replace(/"/g, '""')}"`,
          p.usdPrice,
          p.shippingUsd || 0,
          p.profitMarginPercent || 0,
          calc.priceInRial,
          calc.rawPriceInRial,
          p.stock || 0,
          `"${(p.notes || "").replace(/"/g, '""')}"`
        ].join(",");
      });

      // UTF-8 BOM for proper Persian support in Excel
      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `products_list_prices_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ text: "فایل اکسل / CSV با هر دو ستون قیمت رند شده و رند نشده دانلود شد.", type: "success" });
    } catch (err: any) {
      setStatusMsg({ text: "خطا در ساخت فایل CSV: " + err.message, type: "error" });
    }
  };

  // 3. Restore from File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setStatusMsg(null);

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      const res = await fetch("/api/database/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          text: `پایگاه داده با موفقیت بازیابی شد! (${data.count} محصول بارگذاری گردید).`,
          type: "success",
        });
        onDatabaseRestored();
      } else {
        setStatusMsg({ text: data.error || "خطا در بازیابی اطلاعات", type: "error" });
      }
    } catch (err: any) {
      setStatusMsg({ text: "فایل نامعتبر است: " + err.message, type: "error" });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 4. Copy raw products JSON
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(products, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                مدیریت، پشتیبان‌گیری و همگام‌سازی دیتابیس
              </h3>
              <p className="text-xs text-slate-500">
                دسترسی به محصولات روی هر سیستمی، دانلود پشتیبان و بازیابی اطلاعات
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Cloud Sync & Cross-Device Info Card */}
          <div className="p-4 rounded-2xl bg-linear-to-l from-indigo-50/80 via-sky-50/50 to-white border border-indigo-100/80">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-2">
              <Cloud className="w-4 h-4 text-indigo-600" />
              <span>دیتابیس شما آنلاین و متمرکز است (دسترسی از همه سیستم‌ها):</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              اطلاعات محصولات و نرخ‌ها در سرور مرکزی ابری نگهداری می‌شوند. این بدان معناست که <strong>نیازی به انتقال دستی دیتابیس برای استفاده روی سیستم‌های دیگر ندارید</strong>؛ کافی است همین آدرس وب‌سایت (لینک سامانه) را در مرورگر کامپیوتر محل کار، لپ‌تاپ شخصی یا گوشی همراه خود باز کنید. هر ویرایش یا افزودنی که انجام دهید، به‌صورت همزمان روی تمام سیستم‌ها ذخیره و اعمال می‌شود.
            </p>
            <div className="mt-3 pt-2.5 border-t border-indigo-100/60 flex items-center justify-around text-[11px] text-indigo-800 font-medium">
              <div className="flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-indigo-500" />
                <span>کامپیوتر و لپ‌تاپ</span>
              </div>
              <span className="text-indigo-300">⇄</span>
              <div className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-sky-500" />
                <span>سرور پایدار ابری</span>
              </div>
              <span className="text-indigo-300">⇄</span>
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>گوشی و تبلت</span>
              </div>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Download JSON Backup */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs">
                  دانلود فایل کامل پشتیبان (JSON)
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  یک نسخه کامل از تمام {products.length} محصول، تاریخچه قیمت‌ها و نرخ فعال را روی کامپیوتر خود ذخیره کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>دانلود پشتیبان دیتابیس</span>
              </button>
            </div>

            {/* Restore from JSON Backup */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs">
                  بازیابی دیتابیس از فایل پشتیبان
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  فایل پشتیبان ذخیره‌شده قبلی را انتخاب نمایید تا تمام محصولات و داده‌ها سریعاً جایگزین و بازیابی گردند.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  {isRestoring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>انتخاب و بازگردانی فایل</span>
                </button>
              </div>
            </div>

            {/* Export to CSV / Excel */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs">
                  خروجی اکسل / CSV با قیمت‌های رند و رند نشده
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  فایل جدول اکسل شامل ستون‌های مجزای قیمت رند شده و قیمت دقیق گرد نشده ریال جهت پرینت یا بایگانی.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>دانلود فایل اکسل (CSV)</span>
              </button>
            </div>

            {/* Copy JSON */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 transition space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
                  <Copy className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs">
                  کپی متن خام اطلاعات کالاها
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  کپی ساختار JSON محصولات برای چسباندن (Paste) مستقیم در پیام‌رسان‌ها یا ویرایشگرهای متنی.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyJSON}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "در حافظه کپی شد!" : "کپی ساختار متن محصولات"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>تعداد کالاهای فعلی در دیتابیس: <strong className="text-slate-800 font-mono">{products.length}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
