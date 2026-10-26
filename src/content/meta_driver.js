// src/content/meta_driver.js - Automated driver for Meta AI
// Adapted from proven meta_client.js

(() => {
  if (window.__metaDriverLoaded) return;
  window.__metaDriverLoaded = true;

  console.log("[MetaDriver] Meta AI content driver initialized");

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function waitFor(fn, timeoutMs = 40000, what = "element") {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const v = fn();
      if (v) return v;
      await sleep(500);
    }
    throw new Error(`Timeout waiting for ${what} (${timeoutMs / 1000}s)`);
  }

  const editor = () => document.querySelector('[data-lexical-editor][contenteditable="true"]');
  const sendBtn = () => document.querySelector('button[aria-label="Send"], button[aria-label="ส่ง"]');
  const stopBtn = () => document.querySelector('button[aria-label="Stop"], button[aria-label="Stop generating"], button[aria-label="หยุด"]');
  const newChatLink = () => [...document.querySelectorAll('a[href="/"]')].find(a => /New chat|แชทใหม่/i.test(a.innerText));
  const hydrated = (el) => Object.keys(el || {}).some(k => k.startsWith("__react"));

  async function startNewChat() {
    const link = await waitFor(() => (newChatLink() && hydrated(newChatLink()) ? newChatLink() : null), 30000, "New chat button");
    link.click();
    await waitFor(() => location.pathname === "/" && editor(), 20000, "clean composer in new chat");
    await sleep(1500);
  }

  async function sendPrompt(text) {
    const ed = await waitFor(editor, 15000, "Meta AI text editor");
    ed.focus();
    await sleep(200);

    const probe = text.slice(0, 20);
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    ed.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));

    await sleep(300);
    if (!ed.innerText.includes(probe)) {
      document.execCommand("insertText", false, text);
    }

    const btn = await waitFor(() => (sendBtn() && !sendBtn().disabled ? sendBtn() : null), 20000, "Send button enabled");
    btn.click();
    await sleep(2000);
  }

  const images = () => {
    return [...document.querySelectorAll("img")].filter(i => /fbcdn\.net/.test(i.src) && i.naturalWidth >= 600);
  };
  const videos = () => [...document.querySelectorAll("video")].filter(v => /\.mp4/.test(v.currentSrc || v.src));
  const srcOf = (el) => el.currentSrc || el.src;

  async function waitNewMedia(kind, beforeSrcs, timeoutMs = 480000, onWait = () => {}) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const els = kind === "video" ? videos() : images();
      const fresh = els.filter(e => !beforeSrcs.has(srcOf(e)));
      if (fresh.length && !stopBtn()) {
        await sleep(2000);
        return fresh[fresh.length - 1];
      }
      onWait(Math.round((Date.now() - start) / 1000));
      await sleep(3000);
    }
    throw new Error(`Timeout waiting for Meta AI ${kind}`);
  }

  async function executeMetaJob(job, sendUpdate) {
    sendUpdate({ status: "running", stage: "new_chat", message: "เปิดห้องแชทใหม่ใน Meta AI..." });
    await startNewChat();

    // Step 1: Generate Image
    const imgBefore = new Set(images().map(srcOf));
    sendUpdate({ status: "running", stage: "generating_image", message: "กำลังสั่ง Meta AI สร้างภาพสินค้า..." });
    await sendPrompt(job.imagePrompt);

    const img = await waitNewMedia("image", imgBefore, 360000, (secs) => {
      sendUpdate({ status: "running", stage: "generating_image", message: `กำลังสร้างภาพ (${secs}s)...` });
    });
    const imageUrl = srcOf(img);

    sendUpdate({ status: "running", stage: "image_ready", message: "ภาพเสร็จแล้ว! กำลังส่งคำสั่งขยายเป็นวิดีโอ...", imageUrl });

    // Step 2: Animate Image
    const vidBefore = new Set(videos().map(srcOf));
    sendUpdate({ status: "running", stage: "generating_video", message: "กำลังสั่ง Animate ภาพเป็นคลิปวิดีโอ..." });
    await sendPrompt(`Animate this image: ${job.videoPrompt}`);

    const vid = await waitNewMedia("video", vidBefore, 600000, (secs) => {
      sendUpdate({ status: "running", stage: "generating_video", message: `กำลังเรนเดอร์วิดีโอ (${secs}s)...` });
    });
    const videoUrl = srcOf(vid);

    sendUpdate({
      status: "completed",
      stage: "done",
      message: "สร้างคลิปจาก Meta AI สำเร็จ!",
      imageUrl,
      videoUrl,
      caption: job.caption
    });

    return { imageUrl, videoUrl, caption: job.caption };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "PING_META") {
      sendResponse({ ok: true, url: location.href, hasEditor: !!editor() });
      return true;
    }

    if (message.action === "RUN_META_JOB") {
      executeMetaJob(message.job, (progress) => {
        chrome.runtime.sendMessage({ action: "META_JOB_PROGRESS", jobId: message.job.id, progress });
      })
        .then((result) => sendResponse({ ok: true, result }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));

      return true;
    }
  });
})();
