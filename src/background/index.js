// src/background/index.js - Background Service Worker with Sequential Queue Engine
// Handles: Queue Execution, Flow/Meta generation, Download, and TikTok Studio Upload (AI disclosure, yellow basket link, schedule, hashtags)

import { generateProductPrompts } from "../lib/deepseek.js";

console.log("[Background] Service worker started");

// Open sidepanel when clicking the extension icon
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

async function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

async function setStorage(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
}

// Find open tab matching a domain pattern
async function findTab(urlPattern) {
  const tabs = await chrome.tabs.query({});
  return tabs.find((t) => t.url && t.url.includes(urlPattern)) || null;
}

// Wait for a tab to finish loading
async function waitForTabComplete(tabId, timeoutMs = 35000) {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }, timeoutMs);

    function listener(tid, changeInfo) {
      if (tid === tabId && changeInfo.status === "complete") {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Automatically open, focus, or create a tab for Flow/TikTok Studio
async function ensureTab(urlPattern, targetUrl, forceNew = false) {
  if (!forceNew) {
    const existing = await findTab(urlPattern);
    if (existing) {
      await chrome.tabs.update(existing.id, { active: true });
      return existing;
    }
  }
  const newTab = await chrome.tabs.create({ url: targetUrl, active: true });
  await waitForTabComplete(newTab.id);
  await new Promise((r) => setTimeout(r, 2500)); // allow DOM to settle
  return newTab;
}

// Prefetch image and convert to base64 for reliable reference feeding
async function fetchImageAsBase64(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || "image/jpeg";
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, chunk);
    }
    return {
      base64: btoa(binary),
      mimeType
    };
  } catch (e) {
    console.warn("[Background] fetchImageAsBase64 notice:", e.message);
    return null;
  }
}

// Ensure driver is injected into the target tab
async function ensureDriverInjected(tabId, scriptFile) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptFile]
    });
  } catch (e) {
    console.warn(`Injection note: ${e.message}`);
  }
}

// Download media file via chrome.downloads into AFFILIATE_PRO folder
async function downloadMedia(url, filename) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url,
        filename: `AFFILIATE_PRO/${filename}`,
        saveAs: false,
        conflictAction: "uniquify"
      },
      (downloadId) => {
        if (chrome.runtime.lastError || !downloadId) {
          reject(new Error(chrome.runtime.lastError?.message || "Download failed"));
        } else {
          resolve(downloadId);
        }
      }
    );
  });
}

// Active queue state
let isQueueRunning = false;
let stopRequested = false;

/**
 * Sequential Queue Pipeline:
 * Processes each queue item one after another.
 * For each item, generates N clips, saves them, schedules on TikTok, then moves to next item.
 */
async function processQueuePipeline(options = {}) {
  if (isQueueRunning) return { error: "คิวงานกำลังทำงานอยู่แล้ว" };
  isQueueRunning = true;
  stopRequested = false;

  const { apiKey, scheduleDate, scheduleTime, intervalHours = 2 } = options;

  let { queueItems = [] } = await getStorage("queueItems");
  const pendingItems = queueItems.filter((item) => item.status !== "completed");

  if (pendingItems.length === 0) {
    isQueueRunning = false;
    return;
  }

  // Calculate cumulative clip index for continuous schedule timing
  let globalClipIndex = 0;
  const startDateTime = scheduleDate && scheduleTime ? new Date(`${scheduleDate}T${scheduleTime}`) : new Date();

  await setStorage({
    queueState: {
      running: true,
      status: "starting",
      message: `เริ่มต้นรันคิวงานทั้งหมด (${pendingItems.length} รายการสินค้า)...`
    }
  });

  try {
    for (let i = 0; i < queueItems.length; i++) {
      if (stopRequested) break;
      const currentItem = queueItems[i];
      if (currentItem.status === "completed") continue;

      // Mark current item as running
      currentItem.status = "running";
      currentItem.completedClips = currentItem.completedClips || 0;
      await setStorage({ queueItems });

      const totalClips = currentItem.clipsCount || 1;

      for (let clipNum = currentItem.completedClips + 1; clipNum <= totalClips; clipNum++) {
        if (stopRequested) break;

        // Calculate staggered posting time for each clip in queue
        const clipPostTime = new Date(startDateTime.getTime() + globalClipIndex * intervalHours * 3600 * 1000);
        const scheduleSlot = {
          rawDate: clipPostTime.toISOString().split("T")[0],
          rawTime: `${String(clipPostTime.getHours()).padStart(2, "0")}:${String(clipPostTime.getMinutes()).padStart(2, "0")}`,
          dateFormatted: clipPostTime.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
          timeFormatted: `${String(clipPostTime.getHours()).padStart(2, "0")}:${String(clipPostTime.getMinutes()).padStart(2, "0")} น.`
        };
        globalClipIndex++;

        const label = `[คิว ${i + 1}/${queueItems.length}] ${currentItem.product.title.slice(0, 25)}... (คลิปที่ ${clipNum}/${totalClips})`;

        const durationChoice = currentItem.videoDuration || (currentItem.engine === "flow" ? "8 วินาที" : "10 วินาที");

        await setStorage({
          queueState: {
            running: true,
            currentItemId: currentItem.id,
            product: currentItem.product,
            currentClip: clipNum,
            totalClips,
            status: "generating_prompts",
            message: `${label} — DeepSeek กำลังร่างสคริปต์ภาษาไทย 100% (${currentItem.mode.title}, ${durationChoice})...`
          }
        });

        // Pre-fetch product reference image for 100% appearance locking
        let productMedia = null;
        if (currentItem.lockProductReference !== false && currentItem.product?.cover) {
          productMedia = await fetchImageAsBase64(currentItem.product.cover);
        }

        // 1. Generate Prompts & 100% Thai Dialogue via DeepSeek with Compliance Filter
        const prompts = await generateProductPrompts({
          apiKey,
          product: currentItem.product,
          mode: currentItem.mode,
          engine: currentItem.engine,
          videoDuration: durationChoice,
          lockProductReference: currentItem.lockProductReference !== false
        });

        const jobData = {
          id: `job_${Date.now()}_${i}_${clipNum}`,
          product: currentItem.product,
          mode: currentItem.mode,
          engine: currentItem.engine,
          videoDuration: durationChoice,
          aspectRatio: currentItem.aspectRatio || "9:16",
          model: currentItem.flowModel || "Omni 1.1 Flash",
          resolution: currentItem.resolution || "360p",
          shouldUpscale: currentItem.shouldUpscale !== false,
          lockProductReference: currentItem.lockProductReference !== false,
          productImageBase64: productMedia?.base64 || null,
          productImageMime: productMedia?.mimeType || "image/jpeg",
          imagePrompt: prompts.imagePrompt,
          videoPrompt: prompts.videoPrompt,
          dialogue: prompts.dialogue,
          caption: prompts.caption,
          basketName: prompts.basketName
        };

        // 2. Execute on chosen Engine (Google Flow or Meta AI)
        let mediaResult = null;
        let flowTab = null;

        if (currentItem.engine === "flow") {
          // Open Google Flow automatically (or navigate to home for fresh project)
          await setStorage({
            queueState: {
              running: true,
              currentItemId: currentItem.id,
              product: currentItem.product,
              currentClip: clipNum,
              totalClips,
              status: "opening_flow",
              message: `${label} — กำลังเปิด Google Flow และสร้างโปรเจ็กต์ใหม่...`
            }
          });

          flowTab = await ensureTab("flow.google.com", "https://flow.google.com");
          await new Promise((r) => setTimeout(r, 2500));

          await ensureDriverInjected(flowTab.id, "flow_driver.js");
          await setStorage({
            queueState: {
              running: true,
              currentItemId: currentItem.id,
              product: currentItem.product,
              currentClip: clipNum,
              totalClips,
              status: "running_flow",
              message: `${label} — กำลังสร้างภาพสินค้าและเรนเดอร์วิดีโอ (${durationChoice})...`
            }
          });

          mediaResult = await new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(flowTab.id, { action: "RUN_FLOW_JOB", job: jobData }, (resp) => {
              if (chrome.runtime.lastError || !resp?.ok) {
                reject(new Error(chrome.runtime.lastError?.message || resp?.error || "Google Flow job failed"));
              } else {
                resolve(resp.result);
              }
            });
          });

          // Close Google Flow tab cleanly so next item starts fresh
          try {
            await new Promise((r) => setTimeout(r, 2000));
            if (flowTab?.id) {
              await chrome.tabs.remove(flowTab.id);
              flowTab = null;
            }
          } catch (e) {
            console.warn("[Background] Could not close flow tab:", e.message);
          }
        } else {
          // Meta AI Engine
          let metaTab = await ensureTab("meta.ai", "https://www.meta.ai");
          await new Promise((r) => setTimeout(r, 2500));

          await ensureDriverInjected(metaTab.id, "meta_driver.js");
          await setStorage({
            queueState: {
              running: true,
              currentItemId: currentItem.id,
              product: currentItem.product,
              currentClip: clipNum,
              totalClips,
              status: "running_meta",
              message: `${label} — กำลังสร้างภาพและวิดีโอใน Meta AI...`
            }
          });

          mediaResult = await new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(metaTab.id, { action: "RUN_META_JOB", job: jobData }, (resp) => {
              if (chrome.runtime.lastError || !resp?.ok) {
                reject(new Error(chrome.runtime.lastError?.message || resp?.error || "Meta AI job failed"));
              } else {
                resolve(resp.result);
              }
            });
          });
        }

        // Attach prompt metadata
        if (mediaResult) {
          mediaResult.dialogue = prompts.dialogue;
          mediaResult.caption = prompts.caption;
          mediaResult.basketName = prompts.basketName;
        }

        // 3. Download media locally
        if (mediaResult?.videoUrl) {
          const safeTitle = currentItem.product.title.replace(/[^\wก-๙]/g, "_").slice(0, 30);
          const fileName = `${safeTitle}_clip${clipNum}_${Date.now()}.mp4`;
          try {
            await downloadMedia(mediaResult.videoUrl, fileName);
          } catch (e) {
            console.warn("Download error:", e);
          }
          await new Promise((r) => setTimeout(r, 2000));
        }

        // 4. Auto Post / Schedule to TikTok if enabled
        if (currentItem.autoPost && mediaResult?.videoUrl) {
          // Open TikTok Studio upload tab automatically
          let tiktokTab = await ensureTab("tiktok.com/tiktokstudio/upload", "https://www.tiktok.com/tiktokstudio/upload");
          await new Promise((r) => setTimeout(r, 3500));

          await ensureDriverInjected(tiktokTab.id, "tiktok_driver.js");
          await setStorage({
            queueState: {
              running: true,
              currentItemId: currentItem.id,
              product: currentItem.product,
              currentClip: clipNum,
              totalClips,
              status: "uploading_tiktok",
              message: `${label} — อัปโหลด, ปักตะกร้า, เปิดเผยเนื้อหา AI และตั้งเวลา (${scheduleSlot.dateFormatted} ${scheduleSlot.timeFormatted})...`
            }
          });

          await new Promise((resolve) => {
            chrome.tabs.sendMessage(
              tiktokTab.id,
              {
                action: "UPLOAD_TO_TIKTOK",
                data: {
                  videoUrl: mediaResult.videoUrl,
                  caption: prompts.caption,
                  product: currentItem.product,
                  basketName: prompts.basketName,
                  pinProduct: currentItem.pinProduct ?? true,
                  enableAiDisclosure: currentItem.enableAiDisclosure ?? true,
                  isScheduled: currentItem.isScheduled,
                  scheduleDate: scheduleSlot.rawDate,
                  scheduleTime: scheduleSlot.rawTime,
                  scheduleSlot
                }
              },
              resolve
            );
          });

          // Wait then close TikTok Studio tab cleanly
          await new Promise((r) => setTimeout(r, 3000));
          try {
            if (tiktokTab?.id) {
              await chrome.tabs.remove(tiktokTab.id);
            }
          } catch (e) {
            console.warn("[Background] Could not close tiktok tab:", e.message);
          }
        }

        // Update progress of current item
        currentItem.completedClips = clipNum;
        await setStorage({ queueItems });

        // Add to history
        const { history = [] } = await getStorage("history");
        history.unshift({
          id: jobData.id,
          queueItemId: currentItem.id,
          product: currentItem.product,
          mode: currentItem.mode.title,
          engine: currentItem.engine,
          dialogue: prompts.dialogue,
          caption: prompts.caption,
          basketName: prompts.basketName,
          replacementsMade: prompts.replacementsMade || [],
          mediaResult,
          scheduleSlot,
          completedAt: Date.now()
        });
        await setStorage({ history: history.slice(0, 50) });

        // Cooldown between clips
        if (clipNum < totalClips || i < queueItems.length - 1) {
          await new Promise((r) => setTimeout(r, 4000));
        }
      }

      // Mark current item as completed
      currentItem.status = "completed";
      await setStorage({ queueItems });
    }

    await setStorage({
      queueState: {
        running: false,
        status: "completed",
        message: stopRequested ? "หยุดการประมวลผลคิวงานแล้ว" : "รันคิวงานทั้งหมดสำเร็จสมบูรณ์ทุกรายการ!"
      }
    });
  } catch (error) {
    console.error("[Background] Queue Pipeline error:", error);
    await setStorage({
      queueState: {
        running: false,
        status: "error",
        message: `เกิดข้อผิดพลาด: ${error.message}`
      }
    });
  } finally {
    isQueueRunning = false;
  }
}

// Runtime message dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "START_QUEUE") {
    processQueuePipeline(message.options)
      .then((res) => sendResponse({ ok: true, res }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.action === "STOP_QUEUE") {
    stopRequested = true;
    sendResponse({ ok: true, message: "กำลังสั่งหยุดคิวงาน..." });
    return true;
  }

  if (message.action === "GET_QUEUE_STATE") {
    getStorage(["queueState", "queueItems"]).then((res) => {
      sendResponse({ ok: true, state: res.queueState, items: res.queueItems });
    });
    return true;
  }

  if (message.action === "CHECK_TABS") {
    Promise.all([findTab("flow.google.com"), findTab("meta.ai"), findTab("tiktok.com/tiktokstudio/upload")]).then(
      ([flow, meta, tiktok]) => {
        sendResponse({
          flowTab: !!flow,
          metaTab: !!meta,
          tiktokTab: !!tiktok
        });
      }
    );
    return true;
  }
});
