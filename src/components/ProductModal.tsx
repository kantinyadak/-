import React, { useState, useEffect } from "react";
import { X, DollarSign, Calculator, Check, AlertCircle } from "lucide-react";
import { Product } from "../types";
import { calculateProductPrices, formatNumberWithCommas, formatUSD } from "../utils/formatters";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
  productToEdit?: Product | null;
  rateInToman: number;
}

const DEFAULT_CATEGORIES = [
  "موبایل و تبلت",
  "لپ‌تاپ و کامپیوتر",
  "صوتی و لوازم جانبی",
  "کنسول و بازی",
  "ساعت هوشمند",
  "قطعات کامپیوتر",
  "لوازم خانگی",
  "ابزار و تجهیزات",
  "عمومی",
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  rateInToman,
}) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("عمومی");
  const [usdPrice, setUsdPrice] = useState<number | string>("");
  const [shippingUsd, setShippingUsd] = useState<number | string>(0);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number | string>(10);
  const [stock, setStock] = useState<number | string>(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category || "عمومی");
      setUsdPrice(productToEdit.usdPrice);
      setShippingUsd(productToEdit.shippingUsd || 0);
      setProfitMarginPercent(productToEdit.profitMarginPercent || 0);
      setStock(productToEdit.stock || 0);
      setNotes(productToEdit.notes || "");
    } else {
      setName("");
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory("عمومی");
      setUsdPrice("");
      setShippingUsd(0);
      setProfitMarginPercent(10);
      setStock(1);
      setNotes("");
    }
    setError("");
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Live calculation preview
  const numUsdPrice = Number(usdPrice) || 0;
  const numShippingUsd = Number(shippingUsd) || 0;
  const numProfitMargin = Number(profitMarginPercent) || 0;
  
  const dummyProduct: Product = {
    id: "preview",
    name: name || "پیش‌نمایش",
    sku: sku || "SKU",
    category,
    usdPrice: numUsdPrice,
    shippingUsd: numShippingUsd,
    profitMarginPercent: numProfitMargin,
    stock: Number(stock) || 1,
    createdAt: "",
    updatedAt: "",
  };

  const previewCalculation = calculateProductPrices(dummyProduct, rateInToman);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("لطفاً نام کالا را وارد کنید");
      return;
    }
    if (usdPrice === "" || isNaN(Number(usdPrice)) || Number(usdPrice) < 0) {
      setError("لطفاً قیمت دلاری معتبر وارد کنید");
      return;
    }

    onSave({
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      category: category.trim() || "عمومی",
      usdPrice: Number(usdPrice),
      shippingUsd: Number(shippingUsd) || 0,
      profitMarginPercent: Number(profitMarginPercent) || 0,
      stock: Number(stock) || 0,
      notes: notes.trim(),
    });
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {productToEdit ? "ویرایش اطلاعات محصول" : "افزودن محصول دلاری جدید"}
              </h3>
              <p className="text-xs text-slate-500">
                قیمت دلاری را ثبت کنید تا ارزش ریالی و تومانی آن خودکار محاسبه گردد
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              نام کالا / محصول <span className="text-rose-500">*</span>
            </label>
            <input
              id="product-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: لپ‌تاپ لنوو تینک‌پد، گوشی سامسونگ A55..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition"
              required
            />
          </div>

          {/* SKU and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                کد کالا (SKU)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="مثال: PRD-102"
                dir="ltr"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition font-mono text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                دسته‌بندی
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="categories-list"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="انتخاب یا تایپ دسته‌بندی..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition"
                />
                <datalist id="categories-list">
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Pricing Row: USD Price, Shipping USD, Profit % */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                قیمت خرید ($ USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="product-usd-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={usdPrice}
                  onChange={(e) => setUsdPrice(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition font-mono font-bold"
                  required
                />
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                هزینه حمل/جانبی ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingUsd}
                  onChange={(e) => setShippingUsd(e.target.value)}
                  placeholder="0"
                  dir="ltr"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition font-mono"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                درصد سود مورد نظر (٪)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={profitMarginPercent}
                  onChange={(e) => setProfitMarginPercent(e.target.value)}
                  placeholder="10"
                  dir="ltr"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition font-mono"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">%</span>
              </div>
            </div>
          </div>

          {/* Stock & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                موجودی انبار (تعداد)
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                یادداشت یا ویژگی‌ها
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="رنگ، گارانتی، مبدا..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-hidden transition"
              />
            </div>
          </div>

          {/* Live Calculation Preview Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-950 pb-1 border-b border-indigo-200/50">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                محاسبه زنده بر اساس نرخ روز تلگرام ({formatNumberWithCommas(rateInToman)} تومان)
              </span>
              <span className="font-mono text-indigo-700">
                جمع دلاری: {formatUSD(previewCalculation.finalUsd)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block">قیمت مشتری (رند شده):</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {formatNumberWithCommas(previewCalculation.priceInRial)}
                </span>
                <span className="text-xs font-bold text-indigo-600 mr-1">ریال</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">قیمت مشتری (گرد نشده):</span>
                <span className="text-sm font-semibold text-slate-700 font-mono">
                  {formatNumberWithCommas(previewCalculation.rawPriceInRial)}
                </span>
                <span className="text-xs text-slate-500 mr-1">ریال</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-indigo-100/60 text-xs">
              <div>
                <span className="text-[10px] text-emerald-700 font-semibold block">همکار ۳٪ (۳٪ کمتر از مشتری):</span>
                <span className="font-bold text-emerald-900 font-mono">
                  {formatNumberWithCommas(previewCalculation.cooperator3Rial)}
                </span>
                <span className="text-[10px] text-emerald-600 mr-1">ریال</span>
              </div>

              <div>
                <span className="text-[10px] text-amber-700 font-semibold block">همکار ۶٪ (۶٪ کمتر از مشتری):</span>
                <span className="font-bold text-amber-900 font-mono">
                  {formatNumberWithCommas(previewCalculation.cooperator6Rial)}
                </span>
                <span className="text-[10px] text-amber-600 mr-1">ریال</span>
              </div>
            </div>
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
              id="save-product-submit-btn"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{productToEdit ? "ذخیره تغییرات" : "ثبت محصول در سیستم"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
