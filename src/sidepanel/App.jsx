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
  Timer
} from "lucide-react";
import { MARKETING_MODES } from "../lib/presets";
import { fetchShowcaseProducts } from "../lib/showcase";

export default function App() {
  const [engine, setEngine] = useState("flow"); // "flow" | "meta"
  const [videoDuration, setVideoDuration] = useState("8 วินาที"); // "4 วินาที", "6 วินาที", "8 วินาที", "10 วินาที"
  const [lockProductReference, setLockProductReference] = useState(true); // 100% Product Reference Lock
  const [selectedModeId, setSelectedModeId] = useState("warehouse_clearance");
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemClipsCount, setItemClipsCount] = useState(2); // clips for the selected item
  const [apiKey, setApiKey] = useState("");
  const [autoPost, setAutoPost] = useState(true);
  const [pinProduct, setPinProduct] = useState(true);
  const [enableAiDisclosure, setEnableAiDisclosure] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCaptionId, setCopiedCaptionId] = useState(null);
  const [copiedDialogueId, setCopiedDialogueId] = useState(null);

  // Queue List State
  const [queueItems, setQueueItems] = useState([]);

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(true);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [scheduleTime, setScheduleTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    return `${String(now.getHours()).padStart(2, "0")}:00`;
  });
  const [intervalHours, setIntervalHours] = useState(2);

  // Background queue state & history
  const [queueState, setQueueState] = useState({ running: false, status: "idle", message: "" });
  const [history, setHistory] = useState([]);

  // Load saved settings & state on mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["settings", "queueItems", "queueState", "history"], (res) => {
        if (res.settings?.apiKey) setApiKey(res.settings.apiKey);
        if (res.settings?.engine) setEngine(res.settings.engine);
        if (res.settings?.videoDuration) setVideoDuration(res.settings.videoDuration);
        if (res.settings?.lockProductReference !== undefined) setLockProductReference(res.settings.lockProductReference);
        if (res.settings?.autoPost !== undefined) setAutoPost(res.settings.autoPost);
        if (res.settings?.pinProduct !== undefined) setPinProduct(res.settings.pinProduct);
        if (res.settings?.enableAiDisclosure !== undefined) setEnableAiDisclosure(res.settings.enableAiDisclosure);
        if (res.settings?.intervalHours) setIntervalHours(res.settings.intervalHours);
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

  const saveSettings = (newKey, newDur, newLock) => {
    const keyToSave = newKey !== undefined ? newKey : apiKey;
    const durToSave = newDur !== undefined ? newDur : videoDuration;
    const lockToSave = newLock !== undefined ? newLock : lockProductReference;
    setApiKey(keyToSave);
    if (newDur) setVideoDuration(newDur);
    if (newLock !== undefined) setLockProductReference(newLock);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({
        settings: {
          apiKey: keyToSave,
          engine,
          videoDuration: durToSave,
          lockProductReference: lockToSave,
          autoPost,
          pinProduct,
          enableAiDisclosure,
          intervalHours
        }
      });
    }
  };

  const updateQueueStorage = (newItems) => {
    setQueueItems(newItems);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ queueItems: newItems });
    }
  };

  // Load showcase products
  const handleLoadProducts = async () => {
    setLoadingProducts(true);
    setProductError("");
    try {
      const items = await fetchShowcaseProducts(30);
      setProducts(items);
      if (items.length > 0 && !selectedProductId) {
        setSelectedProductId(items[0].id);
      }
    } catch (err) {
      setProductError(err.message || "ไม่สามารถดึงข้อมูล Showcase ได้");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    handleLoadProducts();
  }, []);

  // Add Item to Queue
  const handleAddToQueue = () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      alert("กรุณาเลือกสินค้าจากรายการด้านล่างก่อนเพิ่มลงคิวครับ");
      return;
    }

    const mode = MARKETING_MODES.find((m) => m.id === selectedModeId) || MARKETING_MODES[0];
    const chosenDuration = engine === "flow" ? videoDuration : "10 วินาที";

    const newItem = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product,
      mode,
      clipsCount: Number(itemClipsCount) || 1,
      completedClips: 0,
      engine,
      videoDuration: chosenDuration,
      lockProductReference: lockProductReference !== false,
      autoPost,
      pinProduct,
      enableAiDisclosure,
      isScheduled,
      status: "pending",
      createdAt: Date.now()
    };

    const updated = [...queueItems, newItem];
    updateQueueStorage(updated);
  };

  // Remove Item from Queue
  const handleRemoveQueueItem = (id) => {
    const updated = queueItems.filter((item) => item.id !== id);
    updateQueueStorage(updated);
  };

  // Clear All Queue
  const handleClearQueue = () => {
    if (window.confirm("ต้องการล้างคิวงานทั้งหมดหรือไม่?")) {
      updateQueueStorage([]);
    }
  };

  // Total clips in queue
  const totalClipsInQueue = queueItems.reduce((sum, item) => sum + (item.clipsCount || 0), 0);
  const remainingClipsInQueue = queueItems
    .filter((item) => item.status !== "completed")
    .reduce((sum, item) => sum + ((item.clipsCount || 0) - (item.completedClips || 0)), 0);

  // Start processing Queue
  const handleStartQueue = () => {
    if (!apiKey) {
      setShowSettings(true);
      alert("กรุณากรอก DeepSeek API Key ในหน้าการตั้งค่าก่อนเริ่มรันคิวครับ");
      return;
    }

    const pending = queueItems.filter((item) => item.status !== "completed");
    if (pending.length === 0) {
      alert("ไม่มีรายการงานที่รอทำในคิว กรุณาเลือกสินค้าแล้วกด '➕ เพิ่มลงในคิวงาน' ก่อนครับ");
      return;
    }

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: "START_QUEUE",
        options: {
          apiKey,
          scheduleDate,
          scheduleTime,
          intervalHours: Number(intervalHours)
        }
      });
    }
  };

  const handleStopQueue = () => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ action: "STOP_QUEUE" });
    }
  };

  const handleCopyCaption = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCaptionId(id);
    setTimeout(() => setCopiedCaptionId(null), 2000);
  };

  const handleCopyDialogue = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedDialogueId(id);
    setTimeout(() => setCopiedDialogueId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-3.5 pb-16 flex flex-col gap-3.5">
      {/* Header */}
      <header className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#fe2c55] to-[#25f4ee] flex items-center justify-center font-black text-white text-base shadow-lg shadow-pink-500/20">
            T
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              TikTok AI Studio
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-mono">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Google Flow & Meta AI Auto Video Engine</p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded-lg border transition-colors ${
            showSettings
              ? "bg-slate-800 border-slate-600 text-white"
              : "border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
          }`}
          title="ตั้งค่า API & Engine"
        >
          <Settings size={16} />
        </button>
      </header>

      {/* Settings Panel Modal / Dropdown */}
      {showSettings && (
        <section className="glass-card p-3 flex flex-col gap-2.5 border-amber-500/40 bg-slate-900/90 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Settings size={13} /> ตั้งค่าระบบ & API Key
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>DeepSeek API Key (ถูกที่สุด $0.14/1M)</span>
              {apiKey ? (
                <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                  <CheckCircle size={10} /> บันทึกแล้ว
                </span>
              ) : (
                <span className="text-red-400 text-[10px]">จำเป็นต้องกรอก</span>
              )}
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => saveSettings(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[9px] text-slate-400">
              ใช้โมเดล <code className="text-blue-400">deepseek-chat</code> ประหยัดต้นทุนที่สุด ร่างสคริปต์ภาษาไทย 100% พร้อมตรวจคำต้องห้าม
            </p>
          </div>
        </section>
      )}

      {/* Compliance & Anti-Ban Security Badge */}
      <section className="glass-card p-2.5 bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border-emerald-700/50 flex flex-col gap-1.5 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            TikTok Anti-Ban Compliance (100%)
          </span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-mono">
            AZ Rules Active
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[9px] text-slate-300">
          <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
            <Mic size={11} className="text-blue-400 shrink-0" />
            <span>บทพูดไทย 100% (ไม่มีอังกฤษ)</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
            <ShieldCheck size={11} className="text-amber-400 shrink-0" />
            <span>กรองคำแพทย์/เคลมแรง</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
            <Tag size={11} className="text-pink-400 shrink-0" />
            <span>ปักตะกร้า & แฮชแท็กออโต้</span>
          </div>
        </div>
      </section>

      {/* Engine Selector */}
      <section className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-300">เลือกเครื่องมือสร้างวิดีโอ (Engine)</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setEngine("flow")}
            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
              engine === "flow"
                ? "bg-slate-800 border-blue-500 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${engine === "flow" ? "bg-blue-600 text-white" : "bg-slate-800"}`}>
              <Sparkles size={15} />
            </div>
            <div>
              <div className="text-xs font-bold">Google Flow</div>
              <div className="text-[10px] opacity-75">Veo 3.1 Fast</div>
            </div>
          </button>

          <button
            onClick={() => setEngine("meta")}
            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
              engine === "meta"
                ? "bg-slate-800 border-blue-500 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${engine === "meta" ? "bg-blue-600 text-white" : "bg-slate-800"}`}>
              <Layers size={15} />
            </div>
            <div>
              <div className="text-xs font-bold">Meta AI</div>
              <div className="text-[10px] opacity-75">Video Animate</div>
            </div>
          </button>
        </div>
      </section>

      {/* Video Duration Selector */}
      <section className="glass-card p-2.5 flex flex-col gap-2 rounded-xl bg-slate-900/60 border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Timer size={13} className="text-blue-400" />
            <span>ความยาวคลิป (Video Duration)</span>
          </label>
          <span className="text-[10px] text-blue-400 font-mono">
            {engine === "flow" ? `Google Flow (${videoDuration})` : "Meta AI (10 วินาทีคงที่)"}
          </span>
        </div>

        {engine === "flow" ? (
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "4 วินาที", label: "4 วินาที", sub: "4s" },
              { id: "6 วินาที", label: "6 วินาที", sub: "6s" },
              { id: "8 วินาที", label: "8 วินาที", sub: "8s (แนะนำ)" },
              { id: "10 วินาที", label: "10 วินาที", sub: "10s" }
            ].map((dur) => {
              const isSelected = videoDuration === dur.id;
              return (
                <button
                  key={dur.id}
                  onClick={() => {
                    setVideoDuration(dur.id);
                    saveSettings(apiKey, dur.id, lockProductReference);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all border ${
                    isSelected
                      ? "bg-blue-600 border-blue-400 text-white font-bold shadow-sm shadow-blue-500/30"
                      : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-750 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">{dur.label}</div>
                  <div className="text-[9px] opacity-75">{dur.sub}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300">คลิป Meta AI กำหนดมาตรฐานไว้ที่:</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              10 วินาที (Fixed 10s)
            </span>
          </div>
        )}
      </section>

      {/* 100% Product & Logo Appearance Locking */}
      <section className="glass-card p-2.5 bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border-blue-700/50 flex flex-col gap-1.5 rounded-xl">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-1.5">
            <Lock size={14} className="text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-blue-200">
                ล็อกภาพสินค้า, ชื่อ, โลโก้ 100% (Product Reference Element)
              </div>
              <div className="text-[10px] text-slate-300">
                นำภาพปกจริงจาก Showcase เข้าระบบ AI เป็น Reference ล็อกทรงกระปุก/ขวด โลโก้ และฉลาก 100%
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={lockProductReference}
            onChange={(e) => {
              setLockProductReference(e.target.checked);
              saveSettings(apiKey, videoDuration, e.target.checked);
            }}
            className="accent-blue-500 w-4 h-4 ml-2 shrink-0"
          />
        </label>
      </section>

      {/* Omni 360p + 720p Upscale & Single Output (x1) Specification */}
      <section className="glass-card p-2.5 bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border-emerald-700/50 flex flex-col gap-1 rounded-xl">
        <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-400 shrink-0" />
            <span>สร้าง 1 ชิ้นต่อครั้ง (x1) & 360p ➔ 720p Upscale</span>
          </div>
          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-600/40 font-mono">
            Omni 1.1 Flash
          </span>
        </div>
        <div className="text-[10px] text-slate-300 leading-relaxed">
          สร้างด้วย Omni 360p ทีละ 1 ชิ้น (ประหยัดเหลือ 7 เครดิต และเรนเดอร์เร็วกว่าเดิม 3 เท่า) จากนั้นระบบจะสั่งอัปสเกลความละเอียดเป็น 720p อัตโนมัติขณะดาวน์โหลดเข้าสู่ TikTok Studio
        </div>
      </section>

      {/* Marketing Style Presets (6 Modes) */}
      <section className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>สไตล์การนำเสนอ (Marketing Mode)</span>
          <span className="text-[10px] text-amber-400 font-mono">6 โหมดพรีเซ็ต</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {MARKETING_MODES.map((mode) => {
            const isSelected = selectedModeId === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedModeId(mode.id)}
                className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-800 border-amber-400 shadow-md shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: `${mode.color}20`, color: mode.color }}
                  >
                    {mode.badge}
                  </span>
                  {isSelected && <Check size={13} className="text-amber-400" />}
                </div>
                <div className="text-xs font-bold text-white mb-0.5">{mode.title}</div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {mode.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 1: Select Product from TikTok Showcase */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-pink-400" />
            <span>1. เลือกสินค้าเพื่อใส่คิว ({products.length} รายการ)</span>
          </label>
          <button
            onClick={handleLoadProducts}
            disabled={loadingProducts}
            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={11} className={loadingProducts ? "animate-spin" : ""} />
            {loadingProducts ? "กำลังโหลด..." : "โหลดใหม่"}
          </button>
        </div>

        {productError && (
          <div className="p-2 text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-lg flex items-start gap-1.5">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{productError}</span>
          </div>
        )}

        <div className="glass-card p-2 max-h-40 overflow-y-auto flex flex-col gap-1.5">
          {products.length === 0 && !loadingProducts ? (
            <div className="text-center py-4 text-xs text-slate-400">
              ไม่พบสินค้า หรือยังไม่ได้ล็อกอินที่ <code className="text-blue-400">shop.tiktok.com</code>
            </div>
          ) : (
            products.map((p) => {
              const isSelected = selectedProductId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`flex items-center gap-2.5 p-1.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-950/40 border-blue-500 shadow-sm shadow-blue-500/20"
                      : "bg-slate-900/30 border-slate-800/80 hover:bg-slate-850"
                  }`}
                >
                  <input
                    type="radio"
                    name="product_select"
                    checked={isSelected}
                    onChange={() => setSelectedProductId(p.id)}
                    className="accent-blue-500"
                  />
                  {p.cover ? (
                    <img src={p.cover} alt={p.title} className="w-8 h-8 rounded object-cover shrink-0 bg-slate-800" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-800 shrink-0 flex items-center justify-center text-xs">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-slate-200 truncate">{p.title}</div>
                    <div className="text-[10px] text-pink-400 font-bold">{p.price}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quantity selector & Add to Queue Button */}
        <div className="glass-card p-2.5 flex items-center justify-between gap-3 bg-slate-900/70 border-slate-700/60 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">สร้างสินค้านี้:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setItemClipsCount(cnt)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                    Number(itemClipsCount) === cnt
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cnt}
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-1">คลิป</span>
            </div>
          </div>

          <button
            onClick={handleAddToQueue}
            disabled={!selectedProductId}
            className="btn-primary text-xs py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
          >
            <PlusCircle size={14} /> เพิ่มลงคิวงาน
          </button>
        </div>
      </section>

      {/* Step 2: Queue Task List (คิวงานรอผลิต) */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <ListOrdered size={14} className="text-amber-400" />
            <span>2. คิวงานรอผลิต ({queueItems.length} รายการ, รวม {totalClipsInQueue} คลิป)</span>
          </label>
          {queueItems.length > 0 && (
            <button
              onClick={handleClearQueue}
              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
            >
              <Trash2 size={11} /> ล้างคิว
            </button>
          )}
        </div>

        {queueItems.length === 0 ? (
          <div className="glass-card p-3 text-center text-xs text-slate-400 border-dashed border-slate-700">
            ยังไม่มีงานในคิว — เลือกสินค้าด้านบนแล้วกด <span className="text-blue-400 font-semibold">"เพิ่มลงคิวงาน"</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {queueItems.map((item, idx) => {
              const isCurrent = queueState.running && queueState.currentItemId === item.id;
              return (
                <div
                  key={item.id}
                  className={`glass-card p-2 flex items-center justify-between gap-2.5 transition-all ${
                    isCurrent
                      ? "border-blue-400 bg-blue-950/30 shadow-md shadow-blue-500/20"
                      : item.status === "completed"
                      ? "border-emerald-800/80 bg-emerald-950/20 opacity-80"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-slate-400 w-4 shrink-0 font-bold">
                      #{idx + 1}
                    </span>
                    {item.product?.cover && (
                      <img
                        src={item.product.cover}
                        alt=""
                        className="w-8 h-8 rounded object-cover shrink-0 bg-slate-800 border border-slate-700"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-slate-200 truncate">
                        {item.product?.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-amber-300 font-medium">
                          {item.mode?.title}
                        </span>
                        <span className="text-[10px] text-pink-400 font-bold">
                          {item.clipsCount} คลิป
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700/40 font-mono">
                          {item.videoDuration || "8 วินาที"}
                        </span>
                        {item.lockProductReference !== false && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/30 font-medium flex items-center gap-0.5">
                            <Lock size={8} /> ล็อกภาพ 100%
                          </span>
                        )}
                        {item.status === "completed" && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                            <CheckCircle size={10} /> เสร็จแล้ว
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-0.5">
                            <RefreshCw size={10} className="animate-spin" /> กำลังทำ ({queueState.currentClip}/{item.clipsCount})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveQueueItem(item.id)}
                    disabled={isCurrent}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-20 shrink-0"
                    title="ลบออกจากคิว"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Schedule & Post Options */}
      <section className="glass-card p-3 flex flex-col gap-2.5">
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-slate-300">ดาวน์โหลดคลิปลงเครื่องอัตโนมัติ</span>
            <input type="checkbox" checked={true} readOnly className="accent-blue-500" />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-slate-300 font-medium">อัปโหลดขึ้น TikTok Studio อัตโนมัติ</span>
            <input
              type="checkbox"
              checked={autoPost}
              onChange={(e) => setAutoPost(e.target.checked)}
              className="accent-pink-500"
            />
          </label>

          {autoPost && (
            <div className="flex flex-col gap-2 pl-3 border-l-2 border-pink-500/80 pt-1">
              {/* Product link toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs text-pink-300 font-semibold">ปักตะกร้าสินค้า (Product Showcase Link)</div>
                  <div className="text-[10px] text-slate-400">ค้นหาและผูกตะกร้าสีเหลืองอัตโนมัติ</div>
                </div>
                <input
                  type="checkbox"
                  checked={pinProduct}
                  onChange={(e) => setPinProduct(e.target.checked)}
                  className="accent-pink-500"
                />
              </label>

              {/* AI Content Disclosure toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs text-emerald-300 font-semibold">เปิดเผยเนื้อหา AI (AI Content Disclosure)</div>
                  <div className="text-[10px] text-slate-400">เปิดสวิตช์ "สร้างโดย AI" บน TikTok Studio ป้องกันผิดกฎ</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableAiDisclosure}
                  onChange={(e) => setEnableAiDisclosure(e.target.checked)}
                  className="accent-emerald-400"
                />
              </label>
            </div>
          )}
        </div>

        {/* Schedule & Time Interval Settings */}
        {autoPost && (
          <div className="border-t border-slate-800/80 pt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Calendar size={13} /> กำหนดเวลา & ระยะห่างแต่ละคลิป
              </span>
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="accent-amber-400"
                />
                เปิดตั้งเวลา
              </label>
            </div>

            {isScheduled && (
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400">วันที่เริ่มคลิปแรก:</span>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="text-xs bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400">เวลาเริ่มคลิปแรก:</span>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="text-xs bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1">
                    <Hourglass size={12} className="text-amber-400" />
                    เว้นห่างกันแต่ละคลิป:
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 6, 12, 24].map((hrs) => (
                      <button
                        key={hrs}
                        onClick={() => setIntervalHours(hrs)}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          Number(intervalHours) === hrs
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {hrs} ชม.
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Start / Stop Execution Section */}
      <section className="flex flex-col gap-2">
        {queueState.running ? (
          <div className="glass-card p-3 border-blue-500/50 bg-blue-950/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <RefreshCw size={13} className="animate-spin text-blue-400" />
                กำลังรันคิวงานอัตโนมัติ...
              </span>
              <button
                onClick={handleStopQueue}
                className="text-xs bg-red-600/30 text-red-400 border border-red-500/40 px-2 py-0.5 rounded hover:bg-red-600 hover:text-white transition-all flex items-center gap-1"
              >
                <Square size={11} /> หยุดการทำงาน
              </button>
            </div>
            <p className="text-[11px] text-slate-200 font-medium">
              {queueState.message}
            </p>
          </div>
        ) : (
          <button
            onClick={handleStartQueue}
            disabled={queueItems.length === 0}
            className="btn-primary w-full py-3 text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
          >
            <Play size={17} fill="currentColor" />
            เริ่มรันคิวงานทั้งหมด ({remainingClipsInQueue} คลิปที่รอทำ)
          </button>
        )}
      </section>

      {/* History / Created Gallery */}
      {history.length > 0 && (
        <section className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>คลิปและสคริปต์ที่สร้างสำเร็จ ({history.length})</span>
          </label>

          <div className="flex flex-col gap-2.5">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="glass-card p-2.5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                        {item.mode}
                      </span>
                      {item.scheduleSlot && (
                        <span className="text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-mono">
                          📅 {item.scheduleSlot.timeFormatted}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white truncate mt-1">
                      {item.product?.title}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(item.completedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* 100% Thai Dialogue script box */}
                {item.dialogue && (
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                        <Mic size={10} /> บทพูดพากย์ภาษาไทย 100% (ไม่มีคำอังกฤษ/คำต้องห้าม):
                      </span>
                      <button
                        onClick={() => handleCopyDialogue(item.id, item.dialogue)}
                        className="text-[9px] text-slate-400 hover:text-white flex items-center gap-0.5"
                      >
                        <Copy size={9} />
                        {copiedDialogueId === item.id ? "คัดลอกแล้ว!" : "คัดลอกบทพูด"}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                      "{item.dialogue}"
                    </p>
                  </div>
                )}

                {/* Media Preview & Caption */}
                <div className="flex items-center gap-2">
                  {item.mediaResult?.imageUrl && (
                    <img
                      src={item.mediaResult.imageUrl}
                      alt="Base Image"
                      className="w-16 h-24 object-cover rounded-lg border border-slate-700 bg-slate-900 shrink-0"
                    />
                  )}
                  {item.mediaResult?.videoUrl && (
                    <video
                      src={item.mediaResult.videoUrl}
                      controls
                      className="w-16 h-24 object-cover rounded-lg border border-slate-700 bg-slate-900 shrink-0"
                    />
                  )}
                  <div className="flex-1 text-[10px] text-slate-300 line-clamp-4 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    {item.caption || item.mediaResult?.caption || "ไม่มีแคปชั่น"}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                  <div className="text-[9px] text-slate-400">
                    {item.basketName ? `ตะกร้า: "${item.basketName}"` : ""}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.caption && (
                      <button
                        onClick={() => handleCopyCaption(item.id, item.caption)}
                        className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
                      >
                        <Copy size={11} />
                        {copiedCaptionId === item.id ? "คัดลอกแล้ว!" : "คัดลอกแคปชั่น"}
                      </button>
                    )}
                    {item.mediaResult?.videoUrl && (
                      <a
                        href={item.mediaResult.videoUrl}
                        download={`video_${item.id}.mp4`}
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/40 border border-blue-800/60 px-2 py-1 rounded"
                      >
                        <Download size={11} /> ดาวน์โหลดซ้ำ
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
