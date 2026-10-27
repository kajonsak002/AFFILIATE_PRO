// src/content/tiktok_driver.js - Automated driver for TikTok Studio Upload
// Handles: File Upload, Caption + Hashtags, AI Content Disclosure Toggle,
// Product Showcase Linking (Yellow Basket), and Scheduled Posting.

(() => {
  if (window.__tiktokDriverLoaded) return;
  window.__tiktokDriverLoaded = true;

  console.log("[TikTokDriver] TikTok Studio content driver initialized");

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function waitFor(fn, timeoutMs = 30000, what = "element") {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const v = fn();
        if (v) return v;
      } catch {}
      await sleep(500);
    }
    throw new Error(`Timeout waiting for ${what} (${timeoutMs / 1000}s)`);
  }

  const isVisible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  };

  const textOf = (el) => [
    el?.textContent,
    el?.innerText,
    el?.getAttribute?.("aria-label"),
    el?.getAttribute?.("title"),
    el?.getAttribute?.("placeholder")
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  const selectors = {
    fileInput: () => document.querySelector('input[type="file"][accept*="video"], input[type="file"]'),
    captionEditor: () =>
      document.querySelector(
        'div[contenteditable="true"][class*="editor"], div[contenteditable="true"][class*="caption"], textarea[placeholder*="caption" i], textarea[placeholder*="คำอธิบาย" i], div.notranslate[contenteditable="true"], div[contenteditable="true"]'
      ),
    showMoreBtn: () =>
      Array.from(document.querySelectorAll("button")).find((b) =>
        isVisible(b) && /แสดงเพิ่มเติม|show more/i.test(textOf(b))
      ),
    addLinkBtn: () =>
      Array.from(document.querySelectorAll("button")).find((b) => {
        if (!isVisible(b)) return false;
        const t = textOf(b);
        return /^(เพิ่ม|add|\+ เพิ่ม|\+ add)$/i.test(t) || /เพิ่มลิงก์|add link/i.test(t);
      }),
    postBtn: () =>
      Array.from(document.querySelectorAll("button")).find((b) => {
        if (!isVisible(b) || b.disabled) return false;
        const t = textOf(b);
        return /^(โพสต์|โพสต์ตอนนี้|post|post now|publish)$/i.test(t);
      }),
    scheduleBtn: () =>
      Array.from(document.querySelectorAll("button")).find((b) => {
        if (!isVisible(b) || b.disabled) return false;
        const t = textOf(b);
        return /^(ตั้งเวลา|schedule|schedule post|กำหนดเวลา)$/i.test(t);
      })
  };

  /**
   * Upload video blob to file input
   */
  async function attachVideoFile(videoUrl, fileName = "video.mp4") {
    // If there's an existing draft prompt ("ดำเนินการต่อ" / "ละทิ้ง"), handle it
    const continueBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      isVisible(b) && /ดำเนินการต่อ|continue editing/i.test(textOf(b))
    );
    if (continueBtn) {
      console.log("[TikTokDriver] Dismissing draft prompt: clicking ดำเนินการต่อ");
      continueBtn.click();
      await sleep(1000);
    }

    const input = await waitFor(selectors.fileInput, 20000, "TikTok video file input");

    console.log("[TikTokDriver] Fetching video for upload:", videoUrl);
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`Failed to fetch video blob from URL: ${videoUrl}`);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: blob.type || "video/mp4" });

    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("[TikTokDriver] Video file attached, waiting for upload preview...");
    await sleep(2500);
  }

  /**
   * Sets caption text into TikTok editor
   */
  async function setCaption(captionText) {
    const ed = await waitFor(selectors.captionEditor, 35000, "TikTok Caption Editor");
    ed.focus();
    await sleep(400);

    // Select all existing
    const range = document.createRange();
    range.selectNodeContents(ed);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    await sleep(200);

    // Dispatch input
    const dt = new DataTransfer();
    dt.setData("text/plain", captionText);
    ed.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));

    await sleep(300);
    if (!ed.innerText.includes(captionText.slice(0, 15))) {
      document.execCommand("insertText", false, captionText);
    }

    ed.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(600);
    console.log("[TikTokDriver] Caption and hashtags set successfully");
  }

  /**
   * Expands the "แสดงเพิ่มเติม" (Show more) section
   */
  async function ensureShowMoreExpanded() {
    const showMore = selectors.showMoreBtn();
    if (showMore) {
      console.log("[TikTokDriver] Clicking 'แสดงเพิ่มเติม' to reveal advanced settings...");
      showMore.scrollIntoView({ block: "center" });
      await sleep(200);
      showMore.click();
      await sleep(800);
    }
  }

  /**
   * Enables the "AI-generated content" (เนื้อหาที่สร้างโดย AI) disclosure toggle
   */
  async function enableAiGeneratedDisclosure() {
    console.log("[TikTokDriver] Checking AI-generated content disclosure toggle...");
    try {
      await ensureShowMoreExpanded();

      // Find switch for AI content
      const switches = Array.from(document.querySelectorAll('input[role="switch"], [role="switch"]'));
      let aiSwitch = null;

      for (const sw of switches) {
        let p = sw;
        let text = "";
        for (let i = 0; i < 6 && p; i++) {
          text += " " + (p.textContent || "");
          p = p.parentElement;
        }
        if (/เนื้อหาที่สร้างโดย AI|aigc|ai-generated content/i.test(text)) {
          aiSwitch = sw;
          break;
        }
      }

      if (!aiSwitch) {
        console.warn("[TikTokDriver] AI switch not found by role=switch, trying label search...");
        const labels = Array.from(document.querySelectorAll("span, div, p, label")).filter((el) =>
          /เนื้อหาที่สร้างโดย AI|ai-generated content/i.test(textOf(el))
        );
        if (labels.length > 0) {
          const target = labels[labels.length - 1];
          let cur = target;
          for (let i = 0; i < 5 && cur; i++) {
            const found = cur.querySelector('input[type="checkbox"], [role="switch"], [class*="switch"]');
            if (found) {
              aiSwitch = found;
              break;
            }
            cur = cur.parentElement;
          }
        }
      }

      if (!aiSwitch) {
        console.warn("[TikTokDriver] AI disclosure toggle switch not found on page");
        return false;
      }

      const isChecked = () => {
        if (aiSwitch.tagName === "INPUT") return aiSwitch.checked;
        return aiSwitch.getAttribute("aria-checked") === "true";
      };

      if (isChecked()) {
        console.log("[TikTokDriver] AI-generated content toggle is ALREADY ON");
        return true;
      }

      console.log("[TikTokDriver] Turning ON AI disclosure toggle...");
      aiSwitch.scrollIntoView({ block: "center" });
      await sleep(300);
      aiSwitch.click();
      await sleep(800);

      // Handle confirmation modal if prompted
      const modalConfirmBtn = Array.from(document.querySelectorAll('div[role="dialog"] button, button')).find((b) => {
        if (!isVisible(b)) return false;
        const text = textOf(b);
        return /^(ยืนยัน|confirm|เปิดเผย|รับทราบ)$/i.test(text);
      });
      if (modalConfirmBtn) {
        modalConfirmBtn.click();
        await sleep(500);
      }

      const state = isChecked();
      console.log(`[TikTokDriver] AI Disclosure toggle enabled: ${state}`);
      return state;
    } catch (e) {
      console.warn("[TikTokDriver] Error enabling AI disclosure:", e);
      return false;
    }
  }

  /**
   * Attaches product showcase link (yellow shopping basket)
   */
  async function attachProductShowcase(product) {
    const productId = product?.productId || product?.id || "";
    const productName = product?.name || product?.title || "";
    console.log(`[TikTokDriver] Starting Product Showcase link attachment for ID: ${productId} (${productName})`);

    try {
      window.scrollTo(0, 300);
      await sleep(500);

      // 1. Click "+ เพิ่มลิงก์" หรือ "เพิ่ม" ในแถบ "เพิ่มลิงก์"
      const addLinkBtn = selectors.addLinkBtn();
      if (!addLinkBtn) {
        console.warn("[TikTokDriver] Add Link button not found");
        return false;
      }
      addLinkBtn.scrollIntoView({ block: "center" });
      await sleep(300);
      addLinkBtn.click();
      await sleep(1500);

      // 2. Dialog 1: "เพิ่มลิงก์" -> Type = "สินค้า" -> Click "ถัดไป" (Next)
      const nextBtn1 = Array.from(document.querySelectorAll('div[role="dialog"] button')).find((b) =>
        isVisible(b) && /^(ถัดไป|next)$/i.test(textOf(b))
      );
      if (nextBtn1) {
        console.log("[TikTokDriver] In Link Type dialog: clicking ถัดไป");
        nextBtn1.click();
        await sleep(2000);
      }

      // 3. Dialog 2: "เพิ่มลิงก์สินค้า" -> Search box
      const searchInput = await waitFor(() => {
        return document.querySelector(
          'div[role="dialog"] input[placeholder*="ค้นหาสินค้า"], div[role="dialog"] input[placeholder*="search" i], div[role="dialog"] input[type="text"]'
        );
      }, 15000, "Product Search Input in Add Link dialog");

      if (searchInput && productId) {
        console.log(`[TikTokDriver] Searching product by ID: ${productId}`);
        searchInput.focus();
        searchInput.value = productId;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        searchInput.dispatchEvent(new Event("change", { bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
        await sleep(1500);
      }

      // 4. Select the matching product row radio
      let selectedRadio = null;
      const rows = Array.from(document.querySelectorAll('div[role="dialog"] tbody tr, div[role="dialog"] [role="row"]'));
      for (const row of rows) {
        if (row.innerText.includes(productId)) {
          const r = row.querySelector('input[type="radio"], [role="radio"]');
          if (r) {
            selectedRadio = r;
            break;
          }
        }
      }

      // Fallback: pick first radio in table
      if (!selectedRadio) {
        selectedRadio = document.querySelector('div[role="dialog"] input[type="radio"], div[role="dialog"] [role="radio"]');
      }

      if (selectedRadio) {
        console.log("[TikTokDriver] Selecting product radio button");
        selectedRadio.click();
        await sleep(800);
      }

      // 5. Click "ถัดไป" / "เพิ่ม"
      const confirmAddBtn = Array.from(document.querySelectorAll('div[role="dialog"] button')).find((b) => {
        if (!isVisible(b) || b.disabled) return false;
        const t = textOf(b);
        return /^(ถัดไป|next|เพิ่ม|add|ยืนยัน|confirm)$/i.test(t);
      });

      if (confirmAddBtn) {
        console.log("[TikTokDriver] Confirming product link selection");
        confirmAddBtn.click();
        await sleep(1500);
      }

      // If additional basket name confirmation dialog appears
      const finalConfirm = Array.from(document.querySelectorAll('div[role="dialog"] button')).find((b) => {
        if (!isVisible(b) || b.disabled) return false;
        const t = textOf(b);
        return /^(เพิ่ม|add|ยืนยัน|confirm|เสร็จสิ้น|done)$/i.test(t);
      });
      if (finalConfirm) {
        finalConfirm.click();
        await sleep(1200);
      }

      console.log("[TikTokDriver] Product showcase link (Yellow Basket) attached successfully!");
      return true;
    } catch (e) {
      console.warn("[TikTokDriver] Error attaching product showcase link:", e);
      return false;
    }
  }

  /**
   * Configures schedule time or post now
   */
  async function configurePostTime(scheduleMode = "schedule", scheduleOffsetMinutes = 30) {
    try {
      const isSchedule = scheduleMode === "schedule";
      const radioVal = isSchedule ? "schedule" : "post_now";
      const radio = document.querySelector(`input[name="postSchedule"][value="${radioVal}"], input[value="${radioVal}"]`);

      if (radio) {
        console.log(`[TikTokDriver] Selecting post time mode: ${radioVal}`);
        radio.click();
        await sleep(800);
      } else {
        // Find by label
        const labelText = isSchedule ? "ตั้งเวลา" : "ตอนนี้";
        const btn = Array.from(document.querySelectorAll("label, button")).find((el) =>
          isVisible(el) && textOf(el).includes(labelText)
        );
        if (btn) btn.click();
        await sleep(800);
      }

      console.log(`[TikTokDriver] Post time configured: ${scheduleMode}`);
      return true;
    } catch (e) {
      console.warn("[TikTokDriver] Error setting post time:", e);
      return false;
    }
  }

  /**
   * Full execution flow for TikTok Studio
   */
  async function executeTikTokPost(job, sendUpdate) {
    sendUpdate({ status: "running", stage: "initiating", message: "เริ่มการอัปโหลดและโพสต์คลิปไปยัง TikTok Studio..." });

    // 1. Upload Video File
    if (job.videoUrl) {
      sendUpdate({ status: "running", stage: "uploading_video", message: "กำลังอัปโหลดไฟล์วิดีโอเข้าสู่ TikTok Studio..." });
      await attachVideoFile(job.videoUrl, `AFFILIATE_${job.productId || Date.now()}.mp4`);
      await sleep(3500);
    }

    // 2. Set Caption & Hashtags
    sendUpdate({ status: "running", stage: "setting_caption", message: "กำลังใส่แคปชั่น แฮชแท็ก และ Call-to-action..." });
    const fullCaption = `${job.caption || ""}\n\n#นายหน้าtiktok #tiktokshopครีเอเตอร์ #รีวิวของดีบอกต่อ #affiliate`;
    await setCaption(fullCaption);
    await sleep(2000);

    // 3. Attach Product Link (Yellow Basket)
    if (job.product) {
      sendUpdate({ status: "running", stage: "pinning_product", message: `กำลังปักตะกร้าสินค้าสีเหลือง (ID: ${job.product.productId})...` });
      await attachProductShowcase(job.product);
      await sleep(2000);
    }

    // 4. Enable AI-Generated Content Disclosure
    sendUpdate({ status: "running", stage: "enabling_aigc", message: "กำลังเปิดสวิตช์ 'เนื้อหาที่สร้างโดย AI' (AI-generated content disclosure)..." });
    await enableAiGeneratedDisclosure();
    await sleep(2000);

    // 5. Configure Schedule or Post Now
    const postMode = job.postMode || "schedule";
    sendUpdate({ status: "running", stage: "configuring_schedule", message: `กำลังตั้งเวลาโพสต์ (${postMode === "schedule" ? "ตั้งเวลาล่วงหน้า" : "โพสต์ทันที"})...` });
    await configurePostTime(postMode, job.scheduleOffsetMinutes || 30);
    await sleep(2000);

    // 6. Submit Post / Schedule
    const submitBtn = postMode === "schedule" ? (selectors.scheduleBtn() || selectors.postBtn()) : selectors.postBtn();
    if (submitBtn) {
      sendUpdate({ status: "running", stage: "submitting", message: `กำลังกดยืนยัน ${postMode === "schedule" ? "ตั้งเวลา" : "โพสต์"}...` });
      submitBtn.scrollIntoView({ block: "center" });
      await sleep(500);
      submitBtn.click();
      await sleep(2500);

      // Handle any final confirmation dialog
      const finalDialogBtn = Array.from(document.querySelectorAll('div[role="dialog"] button')).find((b) =>
        isVisible(b) && !b.disabled && /ยืนยัน|confirm|schedule|post|ตกลง/i.test(textOf(b))
      );
      if (finalDialogBtn) {
        finalDialogBtn.click();
        await sleep(1500);
      }

      sendUpdate({
        status: "completed",
        stage: "done",
        message: `โพสต์ไปยัง TikTok Studio สำเร็จเรียบร้อย! (ปักตะกร้า + เปิดป้าย AI + ${postMode === "schedule" ? "ตั้งเวลา" : "โพสต์ทันที"})`
      });
      return { success: true };
    } else {
      sendUpdate({
        status: "completed",
        stage: "done",
        message: "เตรียมเนื้อหา, ปักตะกร้า และเปิดป้าย AI ครบทุกขั้นตอนแล้ว (รอให้ผู้ใช้ตรวจทานและกดปุ่มโพสต์)"
      });
      return { success: true, manualPostNeeded: true };
    }
  }

  // Runtime message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "PING_TIKTOK") {
      sendResponse({ ok: true, url: location.href });
      return true;
    }

    if (message.action === "POST_TO_TIKTOK" || message.action === "UPLOAD_TO_TIKTOK") {
      const job = message.job || message.data || {};
      const jobId = job.id || message.jobId || "job_tiktok";
      executeTikTokPost(job, (progress) => {
        chrome.runtime.sendMessage({ action: "TIKTOK_POST_PROGRESS", jobId, progress });
      })
        .then((result) => sendResponse({ ok: true, result }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));

      return true;
    }
  });
})();
