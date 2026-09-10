import React, { useState } from "react";
import { X, Edit3, Check, AlertCircle } from "lucide-react";
import { formatNumberWithCommas } from "../utils/formatters";

interface ManualRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRateInToman: number;
  onSaveManualRate: (rateInToman: number, notes?: string) => Promise<void>;
}

export const ManualRateModal: React.FC<ManualRateModalProps> = ({
  isOpen,
  onClose,
  currentRateInToman,
  onSaveManualRate,
}) => {
  const [rate, setRate] = useState<number | string>(currentRateInToman);
  const [notes, setNotes] = useState("تعیین دستی توسط مدیر");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const numRate = Number(rate) || 0;
  const numRial = numRate * 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numRate || numRate <= 0) {
      setError("لطفاً یک نرخ معتبر برای دلار وارد کنید");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSaveManualRate(numRate, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || "خطا در ثبت نرخ دستی");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                تنظیم دستی نرخ دلار
              </h3>
              <p className="text-xs text-slate-500">
                وارد کردن مستقیم قیمت دلار بدون نیاز به استعلام تلگرام
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              نرخ دلار (به تومان) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="manual-rate-input"
                type="number"
                step="100"
                min="1000"
                value={rate}
                onChange={(e) => {
                  setRate(e.target.value);
                  setError("");
                }}
                placeholder="مثال: 93500"
                dir="ltr"
                className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-base outline-hidden transition font-mono font-bold"
                required
              />
              <span className="absolute left-3 top-3 text-slate-400 font-medium text-xs">تومان</span>
            </div>
          </div>

          {/* Real-time Toman & Rial preview */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>قیمت به تومان:</span>
              <span className="font-bold font-mono text-slate-900 text-sm">
                {formatNumberWithCommas(numRate)} تومان
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>معادل به ریال:</span>
              <span className="font-semibold font-mono text-slate-800">
                {formatNumberWithCommas(numRial)} ریال
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              توضیحات یا علت تغییر نرخ (اختیاری)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: نرخ نقدی صرافی پارس، نرخ توافقی..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm outline-hidden transition"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              id="confirm-manual-rate-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-sm font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "در حال ثبت..." : "اعمال نرخ جدید"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
