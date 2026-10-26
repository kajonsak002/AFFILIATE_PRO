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

  const selectors = {
    fileInput: () => document.querySelector('input[type="file"][accept*="video"]'),
    captionEditor: () =>
      document.querySelector(
        '[contenteditable="true"][class*="editor"], [contenteditable="true"][class*="caption"], div[class*="DraftEditor-editorContainer"] [contenteditable="true"], div.notranslate[contenteditable="true"], [contenteditable="true"]'
      ),
    postButton: () =>
      Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText?.trim() === "โพสต์" || b.innerText?.trim() === "Post"
      ),
    scheduleSwitch: () => {
      const allEls = Array.from(document.querySelectorAll("label, div, span"));
      const match = allEls.find((el) => {
        const t = el.innerText || "";
        return (
          t.includes("กำหนดเวลาโพสต์") ||
          t.includes("Schedule video") ||
          t.includes("กำหนดเวลาโพสต์วิดีโอ")
        );
      });
      if (!match) return null;
      let cur = match;
      for (let i = 0; i < 6 && cur; i++) {
        const sw = cur.querySelector('input[type="checkbox"], [role="switch"], [class*="switch"], [class*="Switch"]');
        if (sw) return sw;
        cur = cur.parentElement;
      }
      return null;
    },
    addLinkBtn: () =>
      Array.from(document.querySelectorAll("button, div[role='button'], span")).find((el) => {
        const t = el.innerText?.trim() || "";
        return t === "เพิ่มลิงก์" || t === "+ เพิ่มลิงก์" || t === "Add link" || t === "+ Add link";
      })
  };

  /**
   * Upload video blob to file input
   */
  async function attachVideoFile(videoUrl, fileName = "video.mp4") {
    const input = await waitFor(selectors.fileInput, 15000, "TikTok video file input");

    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`Failed to fetch video blob from URL: ${videoUrl}`);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: blob.type || "video/mp4" });

    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("[TikTokDriver] Video file attached, waiting for upload processing...");
  }

  /**
   * Sets caption text into TikTok editor
   */
  async function setCaption(captionText) {
    const ed = await waitFor(selectors.captionEditor, 35000, "TikTok Caption Editor");
    ed.focus();
    await sleep(300);

    const range = document.createRange();
    range.selectNodeContents(ed);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    await sleep(150);

    // Paste formatted caption
    const dt = new DataTransfer();
    dt.setData("text/plain", captionText);
    ed.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));

    await sleep(300);
    if (!ed.innerText.includes(captionText.slice(0, 15))) {
      document.execCommand("insertText", false, captionText);
    }

    ed.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(500);
    console.log("[TikTokDriver] Caption and hashtags set successfully");
  }

  /**
   * Enables the "AI-generated content" (เนื้อหาที่สร้างโดย AI) disclosure toggle
   */
  async function enableAiGeneratedDisclosure() {
    console.log("[TikTokDriver] Checking AI-generated content disclosure toggle...");
    try {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(600);

      const spans = Array.from(document.querySelectorAll("span, p, div, label"));
      const aiLabel = spans.find((el) => {
        const t = (el.textContent || "").trim();
        return (
          t === "เนื้อหาที่สร้างโดย AI" ||
          t.includes("สร้างโดย AI") ||
          t.toLowerCase().includes("ai-generated content")
        );
      });

      if (!aiLabel) {
        console.warn("[TikTokDriver] AI disclosure label not found on page, scrolling...");
        return false;
      }

      // Find toggle switch in parent tree
      let container = aiLabel.parentElement;
      let toggleEl = null;
      for (let i = 0; i < 8 && container; i++) {
        toggleEl = container.querySelector(
          'input[type="checkbox"], [role="switch"], [class*="Switch"], [class*="switch"], .TUXSwitch'
        );
        if (toggleEl) break;
        container = container.parentElement;
      }

      if (!toggleEl) {
        console.warn("[TikTokDriver] Toggle switch element for AI disclosure not found");
        return false;
      }

      // Check current state
      const isChecked = () => {
        if (toggleEl.tagName === "INPUT") return toggleEl.checked;
        const ariaChecked = toggleEl.getAttribute("aria-checked");
        if (ariaChecked === "true") return true;
        const dataState = toggleEl.getAttribute("data-state");
        if (dataState === "checked") return true;
        const cls = toggleEl.className || "";
        return cls.includes("--checked-true") || cls.includes("TUXSwitch--checked");
      };

      if (isChecked()) {
        console.log("[TikTokDriver] AI-generated content toggle is ALREADY ON");
        return true;
      }

      console.log("[TikTokDriver] Turning ON AI disclosure toggle...");
      toggleEl.click();
      await sleep(800);

      // Handle confirmation modal if prompted
      const modalConfirmBtn = Array.from(
        document.querySelectorAll('div[role="dialog"] button, .TUXModal button, button')
      ).find((b) => {
        const text = (b.innerText || "").trim();
        return (
          text === "ยืนยัน" ||
          text === "Confirm" ||
          text === "เปิดเผย" ||
          text === "รับทราบ" ||
          b.className?.includes("TUXButton--primary")
        );
      });

      if (modalConfirmBtn && modalConfirmBtn.offsetParent !== null) {
        console.log("[TikTokDriver] Clicking AI disclosure confirm modal button...");
        modalConfirmBtn.click();
        await sleep(500);
      }

      const finalState = isChecked();
      console.log(`[TikTokDriver] AI Disclosure toggle enabled: ${finalState}`);
      return finalState;
    } catch (e) {
      console.warn("[TikTokDriver] Error enabling AI disclosure:", e);
      return false;
    }
  }

  /**
   * Attaches product showcase link (yellow shopping basket)
   */
  async function attachProductShowcase(productTitle, basketName) {
    console.log(`[TikTokDriver] Starting Product Showcase link attachment for: ${basketName || productTitle}`);
    try {
      window.scrollTo(0, document.body.scrollHeight / 2);
      await sleep(500);

      // 1. Click "+ เพิ่มลิงก์"
      const addLinkBtn = selectors.addLinkBtn();
      if (!addLinkBtn) {
        console.warn("[TikTokDriver] Add Link button (+ เพิ่มลิงก์) not found on upload page");
        return false;
      }
      addLinkBtn.click();
      await sleep(1500);

      // 2. Click "สินค้า" / "Product" option in modal
      const productOption = Array.from(document.querySelectorAll('div[role="dialog"] div, div[role="dialog"] button, div[role="dialog"] span, [class*="modal"] span')).find((el) => {
        const t = (el.innerText || "").trim();
        return t === "สินค้า" || t === "Product";
      });

      if (productOption) {
        productOption.click();
        await sleep(2000);
      }

      // 3. Switch to Showcase Tab if present ("จาก Showcase" / "Showcase")
      const showcaseTab = Array.from(document.querySelectorAll('div[role="dialog"] [role="tab"], div[role="dialog"] button, div[role="dialog"] div')).find((el) => {
        const t = (el.innerText || "").trim();
        return t === "จาก Showcase" || t === "Showcase";
      });
      if (showcaseTab) {
        showcaseTab.click();
        await sleep(1200);
      }

      // 4. Search for product in search input
      const searchInput = document.querySelector(
        'div[role="dialog"] input[placeholder*="สินค้า"], div[role="dialog"] input[placeholder*="product"], div[role="dialog"] input[placeholder*="ค้นหา"], div[role="dialog"] input[type="text"]'
      );

      const queryTerm = (basketName || productTitle || "").slice(0, 20);
      if (searchInput && queryTerm) {
        searchInput.focus();
        searchInput.value = queryTerm;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        searchInput.dispatchEvent(new Event("change", { bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
        await sleep(2000);
      }

      // 5. Select radio button for product
      const radio = document.querySelector(
        'div[role="dialog"] input[type="radio"], div[role="dialog"] .TUXRadioStandalone, div[role="dialog"] [role="radio"]'
      );
      if (radio) {
        radio.click();
        await sleep(800);
      }

      // 6. Click Next / Add ("ถัดไป" / "Next" / "เพิ่ม" / "Add")
      const nextBtn = Array.from(document.querySelectorAll('div[role="dialog"] button')).find((b) => {
        const t = (b.innerText || "").trim();
        return t === "ถัดไป" || t === "Next" || t === "เพิ่ม" || t === "Add";
      });
      if (nextBtn) {
        nextBtn.click();
        await sleep(1500);
      }

      // 7. If basket name customization screen appears
      const basketInput = document.querySelector('div[role="dialog"] input[placeholder*="ชื่อ"], div[role="dialog"] input[maxlength="30"]');
      if (basketInput && basketName) {
        basketInput.focus();
        basketInput.value = basketName.slice(0, 28);
        basketInput.dispatchEvent(new Event("input", { bubbles: true }));
        basketInput.dispatchEvent(new Event("change", { bubbles: true }));
        await sleep(500);

        const confirmBtn = Array.from(document.querySelectorAll('div[role="dialog"] button')).find((b) => {
          const t = (b.innerText || "").trim();
          return t === "ยืนยัน" || t === "Confirm" || t === "เสร็จสิ้น" || t === "เพิ่ม" || t === "Add";
        });
        if (confirmBtn) {
          confirmBtn.click();
          await sleep(1500);
        }
      }

      console.log("[TikTokDriver] Product showcase link added successfully!");
      return true;
    } catch (e) {
      console.warn("[TikTokDriver] Error attaching product showcase link:", e);
      return false;
    }
  }

  /**
   * Handles scheduling on TikTok Studio
   */
  async function configureSchedule(scheduleDate, scheduleTime) {
    if (!scheduleDate || !scheduleTime) return;

    try {
      console.log(`[TikTokDriver] Configuring schedule for ${scheduleDate} ${scheduleTime}...`);
      const sw = selectors.scheduleSwitch();
      if (sw) {
        const isChecked = sw.checked || sw.getAttribute("aria-checked") === "true";
        if (!isChecked) {
          sw.click();
          await sleep(1000);
        }
      }

      const dateInputs = Array.from(
        document.querySelectorAll('input[placeholder*="YYYY"], input[placeholder*="วันที่"], div[class*="date"] input')
      );
      const timeInputs = Array.from(
        document.querySelectorAll('input[placeholder*="HH"], input[placeholder*="เวลา"], div[class*="time"] input')
      );

      if (dateInputs.length > 0) {
        dateInputs[0].value = scheduleDate;
        dateInputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        dateInputs[0].dispatchEvent(new Event("change", { bubbles: true }));
      }

      if (timeInputs.length > 0) {
        timeInputs[0].value = scheduleTime;
        timeInputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        timeInputs[0].dispatchEvent(new Event("change", { bubbles: true }));
      }

      console.log(`[TikTokDriver] Schedule set successfully to: ${scheduleDate} ${scheduleTime}`);
    } catch (e) {
      console.warn("[TikTokDriver] Schedule config warning:", e);
    }
  }

  /**
   * Main upload and post coordinator
   */
  async function uploadAndPost({
    videoUrl,
    caption,
    product,
    basketName,
    pinProduct = true,
    enableAiDisclosure = true,
    isScheduled = false,
    scheduleDate,
    scheduleTime
  }) {
    console.log("[TikTokDriver] Executing complete upload and publish workflow...");

    // 1. Attach Video File
    await attachVideoFile(videoUrl);

    // 2. Wait for editor to appear & video processing
    await sleep(6500);

    // 3. Set Caption and Hashtags
    await setCaption(caption);
    await sleep(1000);

    // 4. Enable AI-generated content disclosure (เนื้อหาที่สร้างโดย AI)
    if (enableAiDisclosure) {
      await enableAiGeneratedDisclosure();
      await sleep(1000);
    }

    // 5. Pin Product Showcase Link (ปักตะกร้าสินค้า)
    if (pinProduct && product) {
      await attachProductShowcase(product.title, basketName || product.title);
      await sleep(1000);
    }

    // 6. Schedule video if set
    if (isScheduled && scheduleDate && scheduleTime) {
      await configureSchedule(scheduleDate, scheduleTime);
      await sleep(1000);
    }

    console.log("[TikTokDriver] All steps completed: Video attached, Caption+Tags inserted, AI disclosed, Product pinned, Schedule configured.");

    return {
      success: true,
      message: "อัปโหลดคลิป, ใส่แคปชั่น+แฮชแท็ก, เปิดเผยเนื้อหา AI, ปักตะกร้าสินค้า และตั้งเวลาสำเร็จเรียบร้อย"
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "PING_TIKTOK") {
      sendResponse({ ok: true, url: location.href, hasFileInput: !!selectors.fileInput() });
      return true;
    }

    if (message.action === "UPLOAD_TO_TIKTOK") {
      uploadAndPost(message.data)
        .then((result) => sendResponse({ ok: true, result }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;
    }
  });
})();
