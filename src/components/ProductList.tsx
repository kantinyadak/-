import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  ArrowUpDown, 
  Printer, 
  Package, 
  Sparkles,
  Layers,
  History,
  Database,
  Copy,
  Check
} from "lucide-react";
import { Product } from "../types";
import { calculateProductPrices, formatNumberWithCommas, formatUSD } from "../utils/formatters";

interface ProductListProps {
  products: Product[];
  rateInToman: number;
  shouldRound?: boolean;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onViewHistory?: (product: Product) => void;
  onLoadSampleProducts?: () => void;
  onOpenDatabaseModal?: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  rateInToman,
  shouldRound = true,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onViewHistory,
  onLoadSampleProducts,
  onOpenDatabaseModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"usd_desc" | "usd_asc" | "toman_desc" | "toman_asc" | "name">("usd_desc");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  const copyTextToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const handleCopyAllPrices = async () => {
    const text = filteredProducts.map((p) => {
      const calc = calculateProductPrices(p, rateInToman, shouldRound);
      const rial = shouldRound ? calc.priceInRial : calc.rawPriceInRial;
      return `${p.name} - ${formatNumberWithCommas(rial)} ریال`;
    }).join("\n");

    await copyTextToClipboard(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter and Sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        const calcA = calculateProductPrices(a, rateInToman, shouldRound);
        const calcB = calculateProductPrices(b, rateInToman, shouldRound);

        if (sortBy === "usd_desc") return (b.usdPrice + (b.shippingUsd || 0)) - (a.usdPrice + (a.shippingUsd || 0));
        if (sortBy === "usd_asc") return (a.usdPrice + (a.shippingUsd || 0)) - (b.usdPrice + (b.shippingUsd || 0));
        if (sortBy === "toman_desc") return calcB.priceInRial - calcA.priceInRial;
        if (sortBy === "toman_asc") return calcA.priceInRial - calcB.priceInRial;
        if (sortBy === "name") return a.name.localeCompare(b.name, "fa");
        return 0;
      });
  }, [products, searchQuery, selectedCategory, sortBy, rateInToman, shouldRound]);


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>کاتالوگ و لیست قیمت محصولات</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
              {filteredProducts.length} محصول
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            قیمت‌های رند شده و گرد نشده بر اساس نرخ لحظه‌ای دلار محاسبه شده‌اند
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenDatabaseModal && (
            <button
              onClick={onOpenDatabaseModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-98 text-indigo-700 font-semibold text-xs transition cursor-pointer border border-indigo-200"
              title="پشتیبان‌گیری، دانلود دیتابیس و دسترسی روی هر سیستم"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>پشتیبان‌گیری دیتابیس</span>
            </button>
          )}

          <button
            onClick={handleCopyAllPrices}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              copiedAll 
                ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200"
            }`}
            title="کپی متن ساده: اسم محصول - قیمت به ریال (بدون اضافه)"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiedAll ? "قیمت‌ها کپی شد!" : "کپی متن ساده قیمت‌ها"}</span>
          </button>

          <button
            id="print-catalog-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-98 text-slate-700 font-medium text-xs transition cursor-pointer"
            title="چاپ یا ذخیره PDF کاتالوگ قیمت"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>چاپ / خروجی</span>
          </button>

          <button
            id="add-product-btn"
            onClick={onAddProduct}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ افزودن محصول جدید</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            id="product-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام محصول، کد کالا (SKU) یا توضیحات..."
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-xs outline-hidden transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 absolute left-3 top-2.5 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none outline-hidden text-xs cursor-pointer"
            >
              <option value="all">همه دسته‌ها ({products.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none outline-hidden text-xs cursor-pointer"
            >
              <option value="usd_desc">گران‌ترین دلاری</option>
              <option value="usd_asc">ارزان‌ترین دلاری</option>
              <option value="toman_desc">بیشترین قیمت تومانی</option>
              <option value="toman_asc">کمترین قیمت تومانی</option>
              <option value="name">نام کالا (الفبا)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {filteredProducts.length > 0 ? (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">ردیف</th>
                <th className="py-3 px-4">مشخصات کالا</th>
                <th className="py-3 px-4">دسته‌بندی</th>
                <th className="py-3 px-4 text-left font-mono">قیمت دلار ($)</th>
                <th className="py-3 px-4 text-center">سود ٪</th>
                <th className="py-3 px-4 text-left">
                  <div>
                    <span>قیمت رند شده (ریال)</span>
                    <span className="block text-[9px] font-normal text-slate-500">مبنای ۵,۰۰۰ ریال</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-left">قیمت گرد نشده (ریال)</th>
                <th className="py-3 px-4 text-center">موجودی</th>
                <th className="py-3 px-4 text-center w-24">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredProducts.map((product, index) => {
                const calc = calculateProductPrices(product, rateInToman, shouldRound);
                return (
                  <tr 
                    key={product.id}
                    className="hover:bg-indigo-50/30 transition group"
                  >
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Product Name and SKU */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-950">
                        {product.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded-sm text-slate-600" dir="ltr">
                          {product.sku}
                        </span>
                        {product.notes && (
                          <span className="truncate max-w-xs text-slate-500">
                            • {product.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {product.category || "عمومی"}
                      </span>
                    </td>

                    {/* USD Price */}
                    <td className="py-3.5 px-4 text-left font-mono" dir="ltr">
                      <div className="font-bold text-slate-800 text-sm">
                        {formatUSD(product.usdPrice)}
                      </div>
                      {product.shippingUsd > 0 && (
                        <div className="text-[10px] text-slate-400">
                          + {formatUSD(product.shippingUsd)} حمل
                        </div>
                      )}
                    </td>

                    {/* Profit Margin */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-semibold text-[11px] border border-emerald-100">
                        {product.profitMarginPercent || 0}%
                      </span>
                    </td>

                    {/* Rounded Rial Price */}
                    <td 
                      onClick={async () => {
                        const rial = shouldRound ? calc.priceInRial : calc.rawPriceInRial;
                        await copyTextToClipboard(`${product.name} - ${formatNumberWithCommas(rial)} ریال`);
                        setCopiedRowId(product.id);
                        setTimeout(() => setCopiedRowId(null), 2000);
                      }}
                      className="py-3.5 px-4 text-left font-mono cursor-pointer hover:bg-indigo-50/50 transition"
                      title="کلیک برای کپی: اسم محصول - قیمت به ریال"
                    >
                      <div className="font-bold text-slate-900 text-sm flex items-center justify-end gap-1">
                        {copiedRowId === product.id ? (
                          <span className="text-[11px] font-sans font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            کپی شد!
                          </span>
                        ) : (
                          <>
                            <span>{formatNumberWithCommas(calc.priceInRial)}</span>
                            <span className="text-[10px] font-sans font-bold text-indigo-600">ریال</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Exact Unrounded Rial Price */}
                    <td className="py-3.5 px-4 text-left font-mono">
                      <div className="font-semibold text-slate-600 text-xs">
                        {formatNumberWithCommas(calc.rawPriceInRial)}
                        <span className="text-[10px] font-sans text-slate-400 mr-1">ریال (دقیق)</span>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-mono text-[11px] ${
                        Number(product.stock) > 0 
                          ? "bg-slate-100 text-slate-700"
                          : "bg-rose-50 text-rose-600 font-bold"
                      }`}>
                        {Number(product.stock) > 0 ? product.stock : "ناموجود"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={async () => {
                            const rial = shouldRound ? calc.priceInRial : calc.rawPriceInRial;
                            await copyTextToClipboard(`${product.name} - ${formatNumberWithCommas(rial)} ریال`);
                            setCopiedRowId(product.id);
                            setTimeout(() => setCopiedRowId(null), 2000);
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            copiedRowId === product.id 
                              ? "text-emerald-600 bg-emerald-50" 
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title="کپی متن ساده: اسم کالا - قیمت به ریال"
                        >
                          {copiedRowId === product.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {onViewHistory && (
                          <button
                            onClick={() => onViewHistory(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                            title="تاریخچه قیمت ریالی کالا"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="ویرایش کالا"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="حذف کالا"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-slate-700 font-semibold text-sm">
              هیچ محصولی با مشخصات جستجو شده یافت نشد
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              می‌توانید محصول جدیدی اضافه کنید یا جستجو را تغییر دهید
            </p>
            {onLoadSampleProducts && products.length === 0 && (
              <button
                onClick={onLoadSampleProducts}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>بارگذاری نمونه محصولات اولیه</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer information */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          فرمول محاسبه: <span className="font-mono text-slate-700 font-medium">(قیمت دلاری + حمل) × (۱ + سود٪) × {formatNumberWithCommas(rateInToman * 10)} ریال</span>
        </div>
        <div className="text-slate-400 text-[11px]">
          ستون اول: رند شده به ۱۰۰ هزار ریال | ستون دوم: قیمت دقیق و گرد نشده ریال
        </div>
      </div>
    </div>
  );
};
