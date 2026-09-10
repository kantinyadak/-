import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  RefreshCw, 
  Copy, 
  Check, 
  Clock, 
  Tag, 
  X
} from "lucide-react";
import { formatNumberWithCommas } from "../utils/formatters";

interface PublicProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  priceRial: number;
  priceToman: number;
}

interface PublicPriceResponse {
  tier: "customer" | "coop3" | "coop6" | "all";
  lastUpdated: string;
  rateInToman: number;
  rateInRial: number;
  products: PublicProductItem[];
}

export const PublicPriceList: React.FC = () => {
  // Determine requested tier from URL query (?tier=customer | ?tier=coop3 | ?tier=coop6)
  const tier: "customer" | "coop3" | "coop6" = useMemo(() => {
    if (typeof window === "undefined") return "customer";
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tier");
    if (t === "coop3") return "coop3";
    if (t === "coop6") return "coop6";
    return "customer";
  }, []);

  const [data, setData] = useState<PublicPriceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [displayUnit, setDisplayUnit] = useState<"toman" | "rial">("toman");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Dynamic titles depending strictly on tier (no cross-tier exposure)
  const tierInfo = useMemo(() => {
    if (tier === "coop3") {
      return {
        title: "لیست قیمت همکاران",
        badge: "سطح ۱",
        color: "indigo",
      };
    }
    if (tier === "coop6") {
      return {
        title: "لیست قیمت همکاران ویژه و عمده",
        badge: "سطح ۲ / عمده",
        color: "emerald",
      };
    }
    return {
      title: "لیست قیمت روز محصولات",
      badge: "قیمت رسمی",
      color: "slate",
    };
  }, [tier]);

  // Load public prices from server strictly filtered for this tier
  const loadPrices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/prices?tier=${tier}`);
      if (!res.ok) {
        throw new Error("خطا در برقراری ارتباط با سرور");
      }
      const json: PublicPriceResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Failed to load public prices:", err);
      setError(err.message || "خطا در دریافت لیست قیمت‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [tier]);

  // Categories list
  const categories = useMemo(() => {
    if (!data?.products) return [];
    const set = new Set<string>();
    data.products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [data]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    return data.products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [data, searchQuery, selectedCategory]);

  // Copy single product info
  const handleCopyProduct = (item: PublicProductItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const unitLabel = displayUnit === "toman" ? "تومان" : "ریال";
    const price = displayUnit === "toman" ? item.priceToman : item.priceRial;

    const text = `📦 ${item.name} (${item.sku}): ${formatNumberWithCommas(price)} ${unitLabel}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy entire list as text
  const handleCopyAll = () => {
    if (!data?.products || data.products.length === 0) return;
    const unitLabel = displayUnit === "toman" ? "تومان" : "ریال";
    const dateStr = new Date().toLocaleDateString("fa-IR");
    
    let text = `📋 ${tierInfo.title} (${dateStr})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    filteredProducts.forEach((item, idx) => {
      const price = displayUnit === "toman" ? item.priceToman : item.priceRial;
      text += `${idx + 1}. ${item.name}: ${formatNumberWithCommas(price)} ${unitLabel}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Format date
  const lastUpdatedFormatted = useMemo(() => {
    if (!data?.lastUpdated) return "هم‌اکنون";
    try {
      const d = new Date(data.lastUpdated);
      return new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    } catch {
      return data.lastUpdated;
    }
  }, [data?.lastUpdated]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-16 overflow-x-hidden" dir="rtl">
      {/* Clean, Mobile-First Header */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2.5">
          {/* Brand & Page Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-white flex items-center justify-center shadow-xs shrink-0 ${
              tier === "coop3" 
                ? "bg-indigo-600" 
                : tier === "coop6" 
                ? "bg-emerald-600" 
                : "bg-slate-900"
            }`}>
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate flex items-center gap-1.5">
                <span className="truncate">{tierInfo.title}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md hidden sm:inline-block ${
                  tier === "coop3" 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                    : tier === "coop6" 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {tierInfo.badge}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">بروزرسانی: {lastUpdatedFormatted}</span>
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toman / Rial Unit Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
              <button
                id="btn-unit-toman"
                onClick={() => setDisplayUnit("toman")}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                  displayUnit === "toman"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                تومان
              </button>
              <button
                id="btn-unit-rial"
                onClick={() => setDisplayUnit("rial")}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                  displayUnit === "rial"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                ریال
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadPrices}
              disabled={isLoading}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="بروزرسانی"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            {/* Copy All Button */}
            <button
              id="btn-copy-all-public"
              onClick={handleCopyAll}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedAll ? "کپی شد" : "کپی کل لیست"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-public-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام یا کد کالا..."
              className="w-full pl-8 pr-10 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                همه ({data?.products.length || 0})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-slate-800 text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && !data && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
            <RefreshCw className="w-7 h-7 text-slate-600 animate-spin mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-bold text-slate-700">در حال دریافت قیمت‌ها...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center text-rose-700 shadow-xs">
            <p className="font-bold text-xs sm:text-sm">{error}</p>
            <button
              onClick={loadPrices}
              className="mt-2.5 px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {/* Product Items: Simple, Clean, Mobile-First */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
            {filteredProducts.map((product, idx) => {
              const price = displayUnit === "toman" ? product.priceToman : product.priceRial;
              const isCopied = copiedId === product.id;

              return (
                <div
                  key={product.id}
                  onClick={(e) => handleCopyProduct(product, e)}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group select-none"
                >
                  {/* Right side: Number + Product Name + SKU */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <span className="text-[11px] font-mono text-slate-400 w-5 sm:w-6 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug truncate group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-mono">{product.sku}</span>
                        {product.category && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-500">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Left side: Single Price + Copy Button */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-left">
                      <div className="font-black font-mono text-slate-900 text-xs sm:text-base">
                        {formatNumberWithCommas(price)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {displayUnit === "toman" ? "تومان" : "ریال"}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleCopyProduct(product, e)}
                      className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer ${
                        isCopied 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      }`}
                      title="کپی قیمت"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
            <p className="text-xs sm:text-sm font-bold text-slate-700">کالایی یافت نشد</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-2 text-xs text-indigo-600 hover:underline"
            >
              نمایش همه کالاها
            </button>
          </div>
        )}

        {/* Minimal Footer */}
        <div className="text-center pt-3 text-[11px] text-slate-400">
          سامانه اعلام قیمت لحظه‌ای • بروزرسانی خودکار
        </div>
      </main>
    </div>
  );
};
