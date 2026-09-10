import React, { useState, useEffect } from "react";
import { 
  BadgeDollarSign, 
  Send, 
  HelpCircle,
  Database,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Product, RateSource, ExchangeSettings } from "./types";
import { RateBar } from "./components/RateBar";
import { SummaryCards } from "./components/SummaryCards";
import { ProductList } from "./components/ProductList";
import { ProductModal } from "./components/ProductModal";
import { TelegramSettingsModal } from "./components/TelegramSettingsModal";
import { ManualRateModal } from "./components/ManualRateModal";
import { TelegramPreviewModal } from "./components/TelegramPreviewModal";
import { QuickConverter } from "./components/QuickConverter";
import { DollarTrendChart } from "./components/DollarTrendChart";
import { TierPricingView } from "./components/TierPricingView";
import { PriceHistoryModal } from "./components/PriceHistoryModal";
import { DeleteProductModal } from "./components/DeleteProductModal";
import { DatabaseModal } from "./components/DatabaseModal";
import { PublicPriceList } from "./components/PublicPriceList";
import { PublicLinkModal } from "./components/PublicLinkModal";
import { DispatchSettingsModal } from "./components/DispatchSettingsModal";
import { 
  Layers, 
  Copy, 
  Sparkles,
  SlidersHorizontal,
  FileSpreadsheet,
  Globe,
  Share2,
  Clock
} from "lucide-react";


export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentRate, setCurrentRate] = useState<RateSource>({
    channelUsername: "tgju_org",
    sourceType: "manual",
    rateInToman: 93500,
    rateInRial: 935000,
    lastUpdated: new Date().toISOString(),
    rawPostText: "دلار تهران: ۹۳,۵۰۰ تومان",
    detectedPostTime: "هم‌اکنون",
    status: "success",
    confidenceScore: 100,
    extractedFromChannel: "tgju_org",
  });
  const [settings, setSettings] = useState<ExchangeSettings>({
    activeChannel: "tgju_org",
    fallbackRateInToman: 93500,
    defaultProfitMargin: 10,
    autoRefreshInterval: 30,
    priceDisplayUnit: "both",
    roundCalculations: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [previewMessages, setPreviewMessages] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [productForHistory, setProductForHistory] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState<boolean>(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);
  const [isPublicLinkModalOpen, setIsPublicLinkModalOpen] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);

  // Check if current user is viewing the isolated public read-only link
  const [isPublicView] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        window.location.pathname === "/prices" ||
        window.location.search.includes("view=prices") ||
        window.location.search.includes("public=true")
      );
    }
    return false;
  });

  // Active view: 'catalog' (full products list) or 'tierPricing' (3 categories: مشتری، همکار ۳٪، همکار ۶٪)
  const [activeTab, setActiveTab] = useState<'catalog' | 'tierPricing'>('tierPricing');
  // Rounding toggle state
  const [shouldRound, setShouldRound] = useState<boolean>(true);

  // Helper toast notification
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to refresh products list
  const fetchProducts = async () => {
    try {
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.products) setProducts(prodData.products);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  // Initial load from server
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        await fetchProducts();

        // Load current rate
        const rateRes = await fetch("/api/rates/current");
        if (rateRes.ok) {
          const rateData = await rateRes.json();
          if (rateData.currentRate) setCurrentRate(rateData.currentRate);
          if (rateData.settings) setSettings(rateData.settings);
        }
      } catch (err) {
        console.error("Initial load failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Fetch exchange rate from Telegram
  const handleRefreshTelegramRate = async (channelOverride?: string) => {
    setIsFetchingRate(true);
    try {
      const channelToUse = channelOverride || settings.activeChannel || "tgju_org";
      const res = await fetch("/api/rates/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: channelToUse }),
      });

      const data = await res.json();
      if (data.success && data.currentRate) {
        setCurrentRate(data.currentRate);
        if (data.previewMessages) setPreviewMessages(data.previewMessages);
        showToast(
          `نرخ جدید دلار (${data.currentRate.rateInToman.toLocaleString("fa-IR")} تومان) با موفقیت از کانال @${data.currentRate.channelUsername} دریافت شد`,
          "success"
        );
      } else if (data.warning) {
        if (data.previewMessages) setPreviewMessages(data.previewMessages);
        showToast(data.warning, "info");
      } else {
        showToast(data.error || "خطا در استعلام آنلاین از تلگرام", "error");
      }
    } catch (err: any) {
      console.error("Fetch rate error:", err);
      showToast("خطا در برقراری ارتباط با سرور یا تلگرام", "error");
    } finally {
      setIsFetchingRate(false);
    }
  };

  // Save product (Add or Edit)
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (productToEdit) {
        // Edit existing
        const res = await fetch(`/api/products/${productToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        if (res.ok) {
          const data = await res.json();
          setProducts((prev) => prev.map((p) => (p.id === productToEdit.id ? data.product : p)));
          showToast("اطلاعات محصول با موفقیت بروزرسانی شد");
        }
      } else {
        // Add new
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        if (res.ok) {
          const data = await res.json();
          setProducts((prev) => [data.product, ...prev]);
          showToast("محصول دلاری جدید با موفقیت به کاتالوگ اضافه شد");
        }
      }
      setIsProductModalOpen(false);
      setProductToEdit(null);
    } catch (err) {
      console.error("Save product failed:", err);
      showToast("خطا در ذخیره‌سازی محصول", "error");
    }
  };

  // Delete product handling
  const handleRequestDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        showToast(`محصول "${productToDelete.name}" با موفقیت از سیستم حذف گردید`, "success");
        setProductToDelete(null);
      } else {
        showToast(data.error || "خطا در حذف محصول", "error");
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      showToast("خطا در ارتباط با سرور جهت حذف محصول", "error");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Save manual rate
  const handleSaveManualRate = async (rateInToman: number, notes?: string) => {
    const res = await fetch("/api/rates/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rateInToman, notes }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.currentRate) {
        setCurrentRate(data.currentRate);
        showToast(`نرخ دلار به صورت دستی بر روی ${rateInToman.toLocaleString("fa-IR")} تومان تنظیم شد`);
      }
    } else {
      throw new Error("خطا در ذخیره نرخ دستی");
    }
  };

  // Save settings
  const handleSaveSettings = async (newSettings: Partial<ExchangeSettings>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        showToast("تنظیمات کانال تلگرام ذخیره شد");
        // Automatically test new channel
        if (newSettings.activeChannel && newSettings.activeChannel !== currentRate.channelUsername) {
          handleRefreshTelegramRate(newSettings.activeChannel);
        }
      }
    } catch (err) {
      console.error("Settings save failed:", err);
      showToast("خطا در ذخیره تنظیمات", "error");
    }
  };

  // Test channel in settings modal
  const handleTestChannel = async (channel: string) => {
    const res = await fetch("/api/rates/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    const data = await res.json();
    if (data.success && data.currentRate) {
      setCurrentRate(data.currentRate);
      if (data.previewMessages) setPreviewMessages(data.previewMessages);
    }
    return data;
  };

  // If visiting via public link (?view=prices or /prices), render clean isolated public view
  if (isPublicView) {
    return <PublicPriceList />;
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === "success" 
              ? "bg-emerald-600 text-white border-emerald-500" 
              : toastMessage.type === "error"
              ? "bg-rose-600 text-white border-rose-500"
              : "bg-slate-800 text-white border-slate-700"
          }`}>
            {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toastMessage.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top App Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <BadgeDollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-slate-900 text-xs sm:text-base lg:text-lg leading-tight truncate">
                سامانه محاسبه قیمت ارزی محصولات
              </h1>
              <p className="text-[11px] text-slate-500 hidden md:block">
                ورود قیمت به دلار • استعلام خودکار از تلگرام • محاسبه آنی به تومان و ریال
              </p>
            </div>
          </div>

          {/* Action Buttons: Responsive & Touch-Friendly */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Public Link Generator Button */}
            <button
              id="btn-open-public-link-modal"
              onClick={() => setIsPublicLinkModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer shadow-2xs shrink-0"
              title="ایجاد لینک‌های اختصاصی برای مشتریان و همکاران"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">لینک‌های اختصاصی</span>
            </button>

            {/* Daily 12:00 Dispatch to Bale / WhatsApp */}
            <button
              id="btn-open-dispatch-modal"
              onClick={() => setIsDispatchModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition cursor-pointer shadow-2xs shrink-0"
              title="تنظیم ارسال خودکار روزانه ساعت ۱۲ به واتساپ یا بله"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline">ارسال ۱۲</span>
            </button>

            {/* Database indicator and backup button */}
            <button
              onClick={() => setIsDatabaseModalOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer shrink-0"
              title="پشتیبان‌گیری دیتابیس و دسترسی روی سیستم‌های دیگر"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline mr-1">پشتیبان</span>
            </button>

            {/* Telegram channel settings */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer shrink-0"
              title="تنظیم کانال تلگرام"
            >
              <Send className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden md:inline mr-1">تلگرام</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. Live Telegram Rate Bar */}
        <RateBar
          currentRate={currentRate}
          settings={settings}
          isFetching={isFetchingRate}
          onRefreshFromTelegram={() => handleRefreshTelegramRate()}
          onOpenManualModal={() => setIsManualModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
        />

        {/* 2. Quick Summary Cards */}
        <SummaryCards
          products={products}
          rateInToman={currentRate.rateInToman}
        />

        {/* 3. Quick Currency Converter & Dollar Trend Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <QuickConverter
              rateInToman={currentRate.rateInToman}
            />
          </div>
          <div className="lg:col-span-7">
            <DollarTrendChart
              currentRateInToman={currentRate.rateInToman}
              onRefresh={() => handleRefreshTelegramRate()}
            />
          </div>
        </div>

        {/* Navigation Tabs: Tier Pricing (مشتری، همکار ۳٪، همکار ۶٪) vs Product Management */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit">
            <button
              id="tab-tier-pricing"
              onClick={() => setActiveTab('tierPricing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tierPricing'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Copy className="w-4 h-4 text-indigo-600" />
              <span>قیمت‌های ریالی سه دسته (مشتری، همکار ۳٪، همکار ۶٪)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono">
                ویژه کپی سریع
              </span>
            </button>

            <button
              id="tab-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>مدیریت و ویرایش کالاها</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[10px] font-mono">
                {products.length} کالا
              </span>
            </button>
          </div>

          {/* Quick Rounding Switch */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">گرد کردن قیمت‌ها:</span>
            <button
              id="toggle-rounding-btn"
              onClick={() => {
                setShouldRound((prev) => !prev);
                showToast(
                  !shouldRound
                    ? "گرد کردن قیمت‌ها به نزدیک‌ترین ۱۰ هزار تومان فعال شد"
                    : "گرد کردن قیمت‌ها غیرفعال شد (محاسبه دقیق)",
                  "info"
                );
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                shouldRound
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              {shouldRound ? "✓ رند کردن فعال است" : "✕ رند غیرفعال"}
            </button>
          </div>
        </div>

        {/* 4. Active Tab Content */}
        {activeTab === 'tierPricing' ? (
          <TierPricingView
            products={products}
            rateInToman={currentRate.rateInToman}
            shouldRound={shouldRound}
            onToggleRound={() => setShouldRound((prev) => !prev)}
          />
        ) : (
          <ProductList
            products={products}
            rateInToman={currentRate.rateInToman}
            shouldRound={shouldRound}
            onAddProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(p) => {
              setProductToEdit(p);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleRequestDelete}
            onViewHistory={(p) => {
              setProductForHistory(p);
              setIsHistoryModalOpen(true);
            }}
            onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        rateInToman={currentRate.rateInToman}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        product={productToDelete}
        isDeleting={isDeletingProduct}
      />

      {/* Database Backup & Portability Modal */}
      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        products={products}
        currentRate={currentRate}
        settings={settings}
        onDatabaseRestored={() => {
          fetchProducts();
          fetch("/api/rates/current")
            .then(res => res.json())
            .then(data => {
              if (data.currentRate) setCurrentRate(data.currentRate);
              if (data.settings) setSettings(data.settings);
            });
        }}
      />

      <TelegramSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onTestChannel={handleTestChannel}
      />

      <ManualRateModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        currentRateInToman={currentRate.rateInToman}
        onSaveManualRate={handleSaveManualRate}
      />

      <TelegramPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        currentRate={currentRate}
        previewMessages={previewMessages}
        onRateUpdated={(newRate) => {
          setCurrentRate(newRate);
          fetchProducts();
          showToast(`نرخ دلار با موفقیت به ${newRate.rateInToman.toLocaleString("fa-IR")} تومان تغییر یافت`, "success");
        }}
      />

      {/* Price History Modal */}
      <PriceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setProductForHistory(null);
        }}
        product={productForHistory}
        currentRateInToman={currentRate.rateInToman}
      />

      {/* Public Link Generator Modal */}
      <PublicLinkModal
        isOpen={isPublicLinkModalOpen}
        onClose={() => setIsPublicLinkModalOpen(false)}
        rateInToman={currentRate.rateInToman}
        productCount={products.length}
      />

      {/* Daily 12:00 Dispatch to Bale & WhatsApp Modal */}
      <DispatchSettingsModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        products={products}
        currentRateInToman={currentRate.rateInToman}
        onToast={showToast}
      />

    </div>
  );
}
