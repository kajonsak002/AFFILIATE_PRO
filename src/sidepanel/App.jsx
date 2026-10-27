import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShoppingBag,
  Layers,
  Settings,
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  Clock,
  Video,
  Copy,
  Download,
  AlertCircle,
  Calendar,
  Hourglass,
  PlusCircle,
  Trash2,
  ListOrdered,
  Check,
  ShieldCheck,
  Mic,
  Tag,
  Sliders,
  Lock,
  Timer,
  Zap,
  ArrowRight,
  ExternalLink,
  Info
} from "lucide-react";
import { MARKETING_MODES } from "../lib/presets";
import { getShowcaseCatalog, scrapeShowcaseFromActiveTab } from "../lib/showcase";

export default function App() {
  const [engine, setEngine] = useState("flow"); // "flow" | "meta"
  const [videoDuration, setVideoDuration] = useState("8 วินาที"); // "4 วินาที", "6 วินาที", "8 วินาที", "10 วินาที"
  const [aspectRatio, setAspectRatio] = useState("9:16"); // "9:16", "16:9", "1:1"
  const [flowModel, setFlowModel] = useState("Omni 1.1 Flash"); // "Omni 1.1 Flash", "Veo 3.1 - Fast"
  const [omniResolution, setOmniResolution] = useState("360p"); // "360p", "720p"
  const [lockProductReference, setLockProductReference] = useState(true);
  const [selectedModeId, setSelectedModeId] = useState("warehouse_clearance");

  // Product Catalog State
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [fetchingShowcase, setFetchingShowcase] = useState(false);
  const [showcaseFeedback, setShowcaseFeedback] = useState("");

  // Automation & TikTok Settings
  const [autoPost, setAutoPost] = useState(true);
  const [pinProduct, setPinProduct] = useState(true);
  const [enableAiDisclosure, setEnableAiDisclosure] = useState(true);
  const [postMode, setPostMode] = useState("schedule"); // "schedule" | "instant"
  const [scheduleOffsetMinutes, setScheduleOffsetMinutes] = useState(30);

  // App UI State
  const [activeTab, setActiveTab] = useState("studio"); // "studio" | "showcase" | "queue" | "settings"
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");

  // Queue & Background State
  const [queueItems, setQueueItems] = useState([]);
  const [queueState, setQueueState] = useState({ running: false, status: "idle", message: "" });
  const [history, setHistory] = useState([]);

  // Load saved settings & state on mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["settings", "queueItems", "queueState", "history"], (res) => {
        if (res.settings?.apiKey) setApiKey(res.settings.apiKey);
        if (res.settings?.engine) setEngine(res.settings.engine);
        if (res.settings?.videoDuration) setVideoDuration(res.settings.videoDuration);
        if (res.settings?.aspectRatio) setAspectRatio(res.settings.aspectRatio);
        if (res.settings?.flowModel) setFlowModel(res.settings.flowModel);
        if (res.settings?.omniResolution) setOmniResolution(res.settings.omniResolution);
        if (res.settings?.lockProductReference !== undefined) setLockProductReference(res.settings.lockProductReference);
        if (res.settings?.autoPost !== undefined) setAutoPost(res.settings.autoPost);
        if (res.settings?.pinProduct !== undefined) setPinProduct(res.settings.pinProduct);
        if (res.settings?.enableAiDisclosure !== undefined) setEnableAiDisclosure(res.settings.enableAiDisclosure);
        if (res.settings?.postMode) setPostMode(res.settings.postMode);
        if (res.queueItems) setQueueItems(res.queueItems);
        if (res.queueState) setQueueState(res.queueState);
        if (res.history) setHistory(res.history);
      });

      const listener = (changes, area) => {
        if (area === "local") {
          if (changes.queueItems) setQueueItems(changes.queueItems.newValue || []);
          if (changes.queueState) setQueueState(changes.queueState.newValue || { running: false });
          if (changes.history) setHistory(changes.history.newValue || []);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  // Initial load of Showcase Catalog
  useEffect(() => {
    (async () => {
      const catalog = await getShowcaseCatalog();
      setProducts(catalog);
      if (catalog.length > 0 && !selectedProductId) {
        setSelectedProductId(catalog[0].productId || catalog[0].id);
      }
    })();
  }, []);

  // Save settings helper
  const saveSettings = (updates = {}) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({
        settings: {
          apiKey,
          engine,
          videoDuration,
          aspectRatio,
          flowModel,
          omniResolution,
          lockProductReference,
          autoPost,
          pinProduct,
          enableAiDisclosure,
          postMode,
          scheduleOffsetMinutes,
          ...updates
        }
      });
    }
  };

  // Direct Showcase Fetch Button Handler
  const handleFetchShowcase = async () => {
    setFetchingShowcase(true);
    setShowcaseFeedback("กำลังเชื่อมต่อและดึงรายการสินค้าจาก TikTok Studio...");
    try {
      const res = await scrapeShowcaseFromActiveTab();
      if (res.products && res.products.length > 0) {
        setProducts(res.products);
        if (!selectedProductId || !res.products.some((p) => (p.productId || p.id) === selectedProductId)) {
          setSelectedProductId(res.products[0].productId || res.products[0].id);
        }
        setShowcaseFeedback(
          res.source === "tiktok_tab"
            ? `ดึงสินค้าจากหน้าจอ TikTok Studio สำเร็จ ${res.count} รายการ!`
            : `โหลดคลังสินค้าพร้อมใช้งานแล้ว ${res.count} รายการ (${res.note || "พร้อมทำงานทันที"})`
        );
      } else {
        setShowcaseFeedback("ไม่พบข้อมูลสินค้า กำลังใช้คลังสินค้าตัวอย่าง");
      }
    } catch (err) {
      setShowcaseFeedback(`ข้อความ: ${err.message}`);
    } finally {
      setFetchingShowcase(false);
      setTimeout(() => setShowcaseFeedback(""), 5000);
    }
  };

  // 1-Click Instant Automation Handler
  const handleStartAutomation = () => {
    let targetProduct = products.find((p) => (p.productId || p.id) === selectedProductId) || products[0];
    if (!targetProduct) {
      alert("กรุณาเลือกหรือดึงสินค้าก่อนเริ่มงานครับ");
      return;
    }

    const mode = MARKETING_MODES.find((m) => m.id === selectedModeId) || MARKETING_MODES[0];
    const chosenDuration = engine === "flow" ? videoDuration : "10 วินาที";
    const isOmni = flowModel.toLowerCase().includes("omni");
    const chosenRes = isOmni ? omniResolution : "720p";
    const shouldUpscale = isOmni && omniResolution === "360p";

    const jobItem = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product: {
        id: targetProduct.productId || targetProduct.id,
        productId: targetProduct.productId || targetProduct.id,
        title: targetProduct.name || targetProduct.title,
        name: targetProduct.name || targetProduct.title,
        price: targetProduct.price,
        stock: targetProduct.stock,
        cover: targetProduct.image || targetProduct.cover,
        image: targetProduct.image || targetProduct.cover,
        shop: targetProduct.shop || "ร้านค้าของคุณ"
      },
      mode,
      clipsCount: 1,
      completedClips: 0,
      engine,
      videoDuration: chosenDuration,
      aspectRatio,
      flowModel,
      resolution: chosenRes,
      shouldUpscale,
      lockProductReference,
      autoPost,
      pinProduct,
      enableAiDisclosure,
      postMode,
      scheduleOffsetMinutes,
      status: "pending",
      createdAt: Date.now()
    };

    const newQueue = [jobItem, ...queueItems];
    setQueueItems(newQueue);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ queueItems: newQueue });
      chrome.runtime.sendMessage({
        action: "START_QUEUE",
        options: {
          apiKey: apiKey.trim(),
          scheduleOffsetMinutes
        }
      });
    }
  };

  const handleStopQueue = () => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ action: "STOP_QUEUE" });
    }
  };

  const currentProduct = products.find((p) => (p.productId || p.id) === selectedProductId) || products[0];

  return (
    <div className="flex flex-col h-screen bg-[#0a0d14] text-slate-100 font-sans select-none antialiased overflow-hidden">
      {/* Top Bento Header */}
      <header className="px-4 py-3 bg-[#0f1422]/90 backdrop-blur-md border-b border-cyan-500/20 flex items-center justify-between shrink-0 shadow-lg shadow-black/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400/40">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                AFFILIATE PRO
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Flow & Meta AI Auto Video to TikTok Studio</p>
          </div>
        </div>

        {/* Header Action Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchShowcase}
            disabled={fetchingShowcase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/40 transition-all active:scale-95 disabled:opacity-50"
            title="ดึงสินค้าจากตาราง Showcase ในหน้าจอ TikTok Studio"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fetchingShowcase ? "animate-spin" : ""}`} />
            <span>ดึงสินค้าจาก Showcase</span>
          </button>
        </div>
      </header>

      {/* Showcase Feedback Toast */}
      {showcaseFeedback && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-xs text-cyan-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="flex-1">{showcaseFeedback}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 custom-scrollbar">
        {/* Active Product Showcase Card (Bento Row 1) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#141b2d] to-[#0f1422] border border-cyan-500/20 shadow-md">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">สินค้าใน Showcase สำหรับทำคลิป</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {products.length} รายการ
            </span>
          </div>

          {currentProduct ? (
            <div className="flex gap-3 bg-black/30 p-2.5 rounded-xl border border-white/5 items-center">
              <img
                src={currentProduct.image || currentProduct.cover}
                alt={currentProduct.name || currentProduct.title}
                className="w-16 h-16 rounded-lg object-cover ring-1 ring-cyan-500/30 shrink-0 bg-slate-800"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-white truncate">
                    {currentProduct.name || currentProduct.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-extrabold text-cyan-400 font-mono">
                    {currentProduct.price}
                  </span>
                  {currentProduct.stock && (
                    <span className="text-slate-400">
                      สต็อก: {Number(currentProduct.stock).toLocaleString()}
                    </span>
                  )}
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentProduct.status || "ดำเนินอยู่"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                  <span className="text-slate-500">ID:</span>
                  <span>{currentProduct.productId || currentProduct.id}</span>
                </div>
              </div>

              {/* Product Lock Badge */}
              <button
                onClick={() => {
                  const nextLock = !lockProductReference;
                  setLockProductReference(nextLock);
                  saveSettings({ lockProductReference: nextLock });
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] font-medium transition-all ${
                  lockProductReference
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                    : "bg-slate-800/40 border-slate-700 text-slate-500"
                }`}
                title="ล็อกภาพสินค้าและโลโก้ 100% ไม่ให้ AI เพี้ยน"
              >
                <Lock className={`w-3.5 h-3.5 mb-0.5 ${lockProductReference ? "text-cyan-400" : ""}`} />
                <span>{lockProductReference ? "ล็อกภาพ" : "ปลดล็อก"}</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-400">
              ยังไม่มีสินค้า คลิก "ดึงสินค้าจาก Showcase" ด้านบนเพื่อโหลดสินค้า
            </div>
          )}

          {/* Product Dropdown Selector */}
          {products.length > 1 && (
            <div className="mt-2.5">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {products.map((p) => (
                  <option key={p.productId || p.id} value={p.productId || p.id}>
                    {p.name || p.title} ({p.price})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Engine & Video Studio Settings (Bento Row 2) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#141b2d] to-[#0f1422] border border-cyan-500/20 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">สตูดิโอสร้างคลิป (Dual AI Engine)</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-medium">
              {engine === "flow" ? "Google Flow 2-Step" : "Meta AI 9:16"}
            </span>
          </div>

          {/* Engine Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setEngine("flow");
                saveSettings({ engine: "flow" });
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                engine === "flow"
                  ? "bg-cyan-500/20 border-cyan-500 text-white shadow-md shadow-cyan-950"
                  : "bg-black/30 border-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Google Flow</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300">
                สเต็ป 1 ภาพ + วิดีโอ
              </span>
            </button>
            <button
              onClick={() => {
                setEngine("meta");
                saveSettings({ engine: "meta" });
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                engine === "meta"
                  ? "bg-indigo-500/20 border-indigo-500 text-white shadow-md shadow-indigo-950"
                  : "bg-black/30 border-white/5 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Meta AI</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-400/20 text-indigo-300">
                10s แนวตั้ง
              </span>
            </button>
          </div>

          {/* Duration Selector (4s, 6s, 8s, 10s) */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1.5">
              ความยาววิดีโอ (เลือก 4, 6, 8 หรือ 10 วินาที):
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {["4 วินาที", "6 วินาที", "8 วินาที", "10 วินาที"].map((dur) => (
                <button
                  key={dur}
                  onClick={() => {
                    setVideoDuration(dur);
                    saveSettings({ videoDuration: dur });
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    videoDuration === dur
                      ? "bg-cyan-500/25 border-cyan-400 text-white"
                      : "bg-black/20 border-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {dur.replace(" วินาที", "s")}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Model Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Aspect Ratio */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">อัตราส่วน:</label>
              <div className="flex gap-1.5">
                {["9:16", "16:9", "1:1"].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => {
                      setAspectRatio(ratio);
                      saveSettings({ aspectRatio: ratio });
                    }}
                    className={`flex-1 py-1 text-xs rounded-lg border font-mono font-bold transition-all ${
                      aspectRatio === ratio
                        ? "bg-cyan-500/25 border-cyan-400 text-white"
                        : "bg-black/20 border-white/5 text-slate-400"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Model & Upscale Notice */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">โมเดลสร้าง:</label>
              <select
                value={flowModel}
                onChange={(e) => {
                  setFlowModel(e.target.value);
                  saveSettings({ flowModel: e.target.value });
                }}
                className="w-full px-2 py-1 text-xs rounded-lg bg-black/40 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Omni 1.1 Flash">Omni 1.1 (360p &rarr; Upscale 720p)</option>
                <option value="Veo 3.1 - Fast">Veo 3.1 Fast (720p มาตรฐาน)</option>
              </select>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="text-[11px] bg-black/40 p-2.5 rounded-xl border border-white/5 text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ลำดับการทำงานอัตโนมัติ (Flow Pipeline)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              1. โหมดภาพ 9:16 x1 Omni 360p &rarr; 2. ส่งภาพเข้า Frame to Video ({videoDuration}) &rarr; 3. โหลดแบบ Upscale 720p &rarr; 4. ส่งไฟล์เข้า TikTok Studio
            </p>
          </div>
        </div>

        {/* Marketing Mode Selector */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#141b2d] to-[#0f1422] border border-cyan-500/20 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>สไตล์ฉากโฆษณา (Marketing Mode)</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MARKETING_MODES.slice(0, 4).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedModeId(mode.id)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  selectedModeId === mode.id
                    ? "bg-cyan-500/15 border-cyan-400 text-white ring-1 ring-cyan-400/40"
                    : "bg-black/20 border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="text-xs font-bold text-slate-100 truncate">{mode.title}</div>
                <div className="text-[10px] text-slate-400 truncate">{mode.badge}</div>
              </button>
            ))}
          </div>
        </div>

        {/* TikTok Studio Automation Controls (Bento Row 3) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#141b2d] to-[#0f1422] border border-cyan-500/20 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>การตั้งค่าโพสต์ TikTok Studio</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              Auto Post On
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Auto Pin Product (Yellow Basket) */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5 cursor-pointer">
              <span className="text-slate-300">ปักตะกร้าสินค้าสีเหลืองอัตโนมัติ (Yellow Basket)</span>
              <input
                type="checkbox"
                checked={pinProduct}
                onChange={(e) => {
                  setPinProduct(e.target.checked);
                  saveSettings({ pinProduct: e.target.checked });
                }}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
              />
            </label>

            {/* AI Disclosure Toggle Switch */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 cursor-pointer">
              <div className="pr-2">
                <span className="text-cyan-200 font-semibold block">เปิดสวิตช์ 'เนื้อหาที่สร้างโดย AI'</span>
                <span className="text-[10px] text-slate-400 block">เปิดป้าย AIGC disclosure บน TikTok Studio อัตโนมัติ</span>
              </div>
              <input
                type="checkbox"
                checked={enableAiDisclosure}
                onChange={(e) => {
                  setEnableAiDisclosure(e.target.checked);
                  saveSettings({ enableAiDisclosure: e.target.checked });
                }}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
              />
            </label>

            {/* Post Timing Mode (Schedule vs Instant) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setPostMode("schedule");
                  saveSettings({ postMode: "schedule" });
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  postMode === "schedule"
                    ? "bg-cyan-500/20 border-cyan-400 text-white"
                    : "bg-black/20 border-white/5 text-slate-400"
                }`}
              >
                ตั้งเวลาล่วงหน้า ({scheduleOffsetMinutes} นาที)
              </button>
              <button
                onClick={() => {
                  setPostMode("instant");
                  saveSettings({ postMode: "instant" });
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  postMode === "instant"
                    ? "bg-cyan-500/20 border-cyan-400 text-white"
                    : "bg-black/20 border-white/5 text-slate-400"
                }`}
              >
                โพสต์ตอนนี้ (Instant)
              </button>
            </div>
          </div>
        </div>

        {/* Live Queue Progress Status */}
        {queueState.running && (
          <div className="p-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 shadow-lg shadow-cyan-950 animate-pulse">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>กำลังทำงานอัตโนมัติ...</span>
              </span>
              <button
                onClick={handleStopQueue}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
              >
                หยุดงาน
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {queueState.message || "กำลังประมวลผล..."}
            </p>
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar (1-Click Start) */}
      <footer className="p-3 bg-[#0d121e]/95 backdrop-blur-md border-t border-cyan-500/20 shrink-0">
        <button
          onClick={handleStartAutomation}
          disabled={queueState.running}
          className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-cyan-300/40"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>
            {queueState.running
              ? "ระบบกำลังทำงานอัตโนมัติ..."
              : "เริ่มสร้างคลิปและโพสต์ TikTok ทันที (1-Click Start)"}
          </span>
        </button>
      </footer>
    </div>
  );
}
