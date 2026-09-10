import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Product } from "../types";
import { formatUSD } from "../utils/formatters";

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product: Product | null;
  isDeleting?: boolean;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  isDeleting = false,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-right flex-1">
              <h3 className="font-bold text-slate-900 text-base">
                تأیید حذف محصول از کاتالوگ
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                آیا از حذف این کالا اطمینان دارید؟ با حذف این محصول، سوابق قیمت و مشخصات آن از کاتالوگ پاک خواهد شد.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">نام کالا:</span>
              <span className="font-bold text-slate-800">{product.name}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500 font-sans">کد کالا (SKU):</span>
              <span className="text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200" dir="ltr">{product.sku}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-500 font-sans">قیمت دلاری:</span>
              <span className="font-bold text-slate-800" dir="ltr">{formatUSD(product.usdPrice)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? "در حال حذف..." : "بله، حذف قطعی محصول"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
