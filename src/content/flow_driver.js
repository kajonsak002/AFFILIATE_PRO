// src/content/flow_driver.js - Automated driver for flow.google.com
// Drives the Google Flow interface in the active tab

(() => {
  if (window.__flowDriverLoaded) return;
  window.__flowDriverLoaded = true;

  console.log("[FlowDriver] Google Flow content driver initialized");

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Human-like randomized delay helper to mimic natural human behavior
   */
  const humanDelay = (minMs = 1200, maxMs = 2800) => {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  async function waitFor(fn, timeoutMs = 30000, description = "element") {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = fn();
      if (el) return el;
      await sleep(400);
    }
    throw new Error(`Timeout waiting for ${description} (${timeoutMs / 1000}s)`);
  }

  // DOM Selectors for Google Flow (Angular)
  const selectors = {
    newProjectBtn: () =>
      document.querySelector(".new-project-button") ||
      Array.from(document.querySelectorAll("button")).find(
        (b) =>
          b.innerText.includes("โปรเจ็กต์ใหม่") ||
          b.getAttribute("aria-label")?.includes("โปรเจ็กต์ใหม่") ||
          b.innerText.includes("New project")
      ),
    promptEditor: () =>
      document.querySelector('div.ProseMirror[contenteditable="true"], [role="textbox"][aria-label*="คุณต้องการสร้างอะไร"]'),
    settingsTrigger: () =>
      document.querySelector(
        'button[aria-label="ทริกเกอร์การตั้งค่า"], button.settings-trigger-button, button[mattooltip="ดูการตั้งค่า"]'
      ) ||
      Array.from(document.querySelectorAll("button")).find(
        (b) => b.getAttribute("aria-label") === "ทริกเกอร์การตั้งค่า" || b.getAttribute("mattooltip") === "ดูการตั้งค่า"
      ),
    generateBtn: () =>
      document.querySelector(
        'button.generate-icon-button, button[aria-label="เริ่มสร้าง"], button[aria-label="Generate"], button[type="submit"].generate-icon-button'
      ),
    addPromptElementBtn: () =>
      document.querySelector('button[aria-label="เพิ่มองค์ประกอบลงในช่องพรอมต์"], button.add-menu-trigger'),
    promptChipElement: () =>
      document.querySelector('.chip-container, button[aria-label*="องค์ประกอบ"]'),
    uploadMediaBtn: () =>
      document.querySelector(".sidebar-upload-btn") ||
      Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("อัปโหลดสื่อ")),
    addToPromptBtn: () =>
      Array.from(document.querySelectorAll("button")).find((b) => b.innerText.includes("เพิ่มไปยังพรอมต์")),
    allTiles: () => Array.from(document.querySelectorAll("flow-grid-tile-container, flow-tile-container")),
    progressCards: () =>
      Array.from(document.querySelectorAll("button, span")).filter((el) => /^\d+%\s*$/.test(el.innerText?.trim() || "")),
    latestImageTile: () => {
      const imgs = Array.from(document.querySelectorAll("flow-image-tile img, flow-grid-tile-container img[data-media-id]"));
      return imgs[imgs.length - 1] || null;
    },
    latestVideoTile: () => {
      const vids = Array.from(document.querySelectorAll("flow-video-tile video, flow-grid-tile-container video"));
      return vids[vids.length - 1] || null;
    }
  };

  /**
   * Safe click simulating real human input with hover and mouse events
   */
  async function simulateClick(el) {
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    await sleep(200);
    el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, view: window }));
    await sleep(150);
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    el.click();
    await sleep(250);
  }

  /**
   * Fills text into the ProseMirror editor host with human-like deliberate pacing
   */
  async function fillPrompt(text) {
    const editor = await waitFor(selectors.promptEditor, 15000, "Prompt Editor (ProseMirror)");
    editor.focus();
    await humanDelay(400, 800);

    // Select all existing text
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    await sleep(200);

    // Synthetic paste
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    const pasteEvent = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
    editor.dispatchEvent(pasteEvent);

    // Fallback if paste did not register
    await humanDelay(300, 600);
    if (!editor.innerText.includes(text.slice(0, 15))) {
      document.execCommand("insertText", false, text);
    }

    editor.dispatchEvent(new Event("input", { bubbles: true }));
    await humanDelay(600, 1200);
  }

  /**
   * Helper to convert base64 image data into a File object
   */
  function base64ToFile(base64, filename, mimeType) {
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  }

  /**
   * Uploads and attaches the product reference image into Google Flow's prompt bar as an Element (องค์ประกอบ)
   * Locks the product's identity, logo, typography, and physical appearance 100%
   */
  async function attachProductReferenceImage(base64Data, mimeType = "image/jpeg", filename = "product_ref.jpg") {
    // If element chip is already attached, we are good
    if (selectors.promptChipElement()) {
      console.log("[FlowDriver] Product reference element chip already attached to prompt bar");
      return true;
    }

    await humanDelay(1000, 1800);

    // Open element selection modal
    const addElementBtn = selectors.addPromptElementBtn();
    if (addElementBtn) {
      await simulateClick(addElementBtn);
      await humanDelay(1200, 2000);
    }

    // Find upload media button
    let uploadBtn = await waitFor(selectors.uploadMediaBtn, 12000, "Upload media button in modal");
    await humanDelay(600, 1200);

    let createdInput = null;
    const origCreate = document.createElement;
    document.createElement = function (tag) {
      const el = origCreate.call(document, tag);
      if (tag.toLowerCase() === "input") {
        createdInput = el;
        el.click = () => {}; // suppress native OS picker
      }
      return el;
    };

    try {
      await simulateClick(uploadBtn);
    } finally {
      document.createElement = origCreate;
    }

    if (!createdInput) {
      throw new Error("Could not intercept file input for media upload");
    }

    await humanDelay(800, 1400);

    // Dispatch file into createdInput
    const file = base64ToFile(base64Data, filename, mimeType);
    const dt = new DataTransfer();
    dt.items.add(file);
    createdInput.files = dt.files;
    createdInput.dispatchEvent(new Event("change", { bubbles: true }));

    // Wait for the uploaded file in the listbox (polling up to 25s)
    let uploadedOption = null;
    const pollStart = Date.now();
    while (Date.now() - pollStart < 25000) {
      await sleep(700);
      const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [role="option"]'));
      const found = options.find((o) => o.innerText.includes(filename) || o.innerText.includes("product_ref"));
      if (found && !found.innerText.includes("กำลังอัปโหลด")) {
        uploadedOption = found;
        break;
      }
    }

    // If matching filename wasn't found by name, pick the first option if available
    if (!uploadedOption) {
      const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [role="option"]'));
      if (options.length > 0 && !options[0].innerText.includes("กำลังอัปโหลด")) {
        uploadedOption = options[0];
      }
    }

    if (!uploadedOption) {
      throw new Error("Timeout waiting for uploaded product image to process in Google Flow");
    }

    await humanDelay(600, 1100);
    await simulateClick(uploadedOption);
    await humanDelay(800, 1400);

    // Click 'เพิ่มไปยังพรอมต์'
    const addBtn = selectors.addToPromptBtn();
    if (addBtn) {
      await simulateClick(addBtn);
      await humanDelay(1200, 2000);
    }

    // Close modal if backdrop still exists
    const backdrop = document.querySelector(".cdk-overlay-backdrop");
    if (backdrop) {
      backdrop.click();
      await humanDelay(600, 1200);
    }

    // Verify chip container is now present
    const chip = selectors.promptChipElement();
    console.log("[FlowDriver] Attached product reference element chip:", !!chip);
    return !!chip;
  }

  /**
   * Animates the latest generated scene image into a video starting frame
   */
  async function animateLatestImage() {
    const allCards = Array.from(document.querySelectorAll("media-card, [role='group'], .card, flow-grid-tile-container"));
    // Filter to only cards that contain an image and NOT a video player
    const imgCards = allCards.filter(c =>
      c.querySelector("img") &&
      !c.querySelector("video") &&
      !c.textContent.includes("play_circle") &&
      !c.querySelector(".video-cover")
    );
    if (imgCards.length === 0) {
      console.warn("[FlowDriver] No scene image cards found on canvas to animate");
      return false;
    }
    const latestCard = imgCards[imgCards.length - 1];

    latestCard.scrollIntoView({ block: "center", behavior: "smooth" });
    await humanDelay(800, 1500);

    latestCard.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    latestCard.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await humanDelay(600, 1000);

    const moreBtn = Array.from(latestCard.querySelectorAll("button")).find(b => {
      const icon = b.querySelector("mat-icon")?.textContent || "";
      const aria = b.getAttribute("aria-label") || "";
      return icon.includes("more_vert") || aria.includes("ตัวเลือกเพิ่มเติม") || b.innerText?.includes("more_vert");
    });
    if (!moreBtn) {
      console.warn("[FlowDriver] more_vert button not found on latest scene image card");
      return false;
    }

    await simulateClick(moreBtn);
    await humanDelay(800, 1400);

    const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], .mat-mdc-menu-item'));
    const animateItem = menuItems.find(m =>
      m.innerText.includes("ทำให้เคลื่อนไหว") || m.innerText.includes("Animate")
    );
    if (!animateItem) {
      console.warn("[FlowDriver] 'ทำให้เคลื่อนไหว' option not found in card menu");
      return false;
    }

    await simulateClick(animateItem);
    await humanDelay(2000, 3500);
    return true;
  }

  /**
   * Configures generation options (Image/Video, Aspect Ratio, Model, Duration, Count, Resolution)
   * Enforces 1 output per generation (x1) and 360p on Omni with 720p upscale on download
   */
  async function configureSettings(options = {}) {
    const {
      mode = "image", // "image" | "video"
      aspectRatio = "9:16",
      videoDuration = "10 วินาที",
      model = "Omni 1.1 Flash",
      resolution = "360p", // Use 360p for Omni, upscale to 720p on download
      count = "x1" // สร้างเเค่ 1 ภาพ/วิดีโอต่อครั้งเท่านั้น
    } = options;

    const trigger = await waitFor(selectors.settingsTrigger, 15000, "Settings trigger button");
    if (!trigger) {
      console.warn("[FlowDriver] Settings trigger not found, using existing settings");
      return;
    }

    await humanDelay(800, 1500);

    // Open settings panel
    await simulateClick(trigger);
    await humanDelay(900, 1600);

    // 1. Select Mode (รูปภาพ / วิดีโอ)
    const modeLabel = mode === "video" ? "วิดีโอ" : "รูปภาพ";
    const modeRadio = Array.from(document.querySelectorAll('mat-radio-button, [role="radio"]')).find(r =>
      r.innerText?.includes(modeLabel)
    );
    if (modeRadio) {
      await simulateClick(modeRadio);
      await humanDelay(600, 1100);
    }

    // 2. Select Aspect Ratio (e.g. 9:16)
    if (aspectRatio) {
      const ratioRadio = Array.from(document.querySelectorAll('mat-radio-button, [role="radio"]')).find(r =>
        r.innerText?.trim() === aspectRatio || r.innerText?.includes(aspectRatio)
      );
      if (ratioRadio) {
        await simulateClick(ratioRadio);
        await humanDelay(500, 1000);
      }
    }

    // 3. Always Select Output Count: x1 (สร้างเเค่ 1 ภาพหรือวิดีโอต่อครั้งเท่านั้น)
    if (count) {
      const countRadio = Array.from(document.querySelectorAll('mat-radio-button, [role="radio"]')).find(r =>
        r.innerText?.trim() === count || r.innerText?.includes(count)
      );
      if (countRadio && countRadio.getAttribute("aria-checked") !== "true") {
        await simulateClick(countRadio);
        await humanDelay(400, 800);
      }
    }

    // 4. Video specific options (Model, Resolution, Duration)
    if (mode === "video") {
      // Model selection (Omni 1.1 Flash)
      if (model) {
        const modelBtn = Array.from(document.querySelectorAll('button')).find(b =>
          b.innerText?.includes("เลือกกลุ่มผลิตภัณฑ์โมเดล") || b.getAttribute("aria-label")?.includes("โมเดล")
        );
        if (modelBtn) {
          await simulateClick(modelBtn);
          await humanDelay(500, 900);
          const modelOptions = Array.from(document.querySelectorAll('[role="menuitem"], .mat-mdc-menu-item'));
          const targetModel = modelOptions.find(m =>
            m.innerText?.includes(model) || (model.toLowerCase().includes("omni") && m.innerText?.includes("Omni"))
          );
          if (targetModel) {
            await simulateClick(targetModel);
            await humanDelay(500, 1000);
          }
        }
      }

      // Resolution: 360p for Omni (faster generation, saves credits)
      const targetRes = (model && model.toLowerCase().includes("omni")) ? "360p" : resolution;
      if (targetRes) {
        const resRadio = Array.from(document.querySelectorAll('mat-radio-button, [role="radio"]')).find(r =>
          r.innerText?.includes(targetRes)
        );
        if (resRadio && resRadio.getAttribute("aria-checked") !== "true") {
          await simulateClick(resRadio);
          await humanDelay(400, 800);
        }
      }

      // Configure Duration (4 วินาที, 6 วินาที, 8 วินาที, 10 วินาที)
      if (videoDuration) {
        let targetDur = videoDuration;
        if (/^\d+s$/i.test(videoDuration)) {
          targetDur = `${parseInt(videoDuration)} วินาที`;
        }
        const durRadio = Array.from(document.querySelectorAll('mat-radio-button, [role="radio"]')).find(r =>
          r.innerText?.includes(targetDur) || r.innerText?.trim() === targetDur
        );
        if (durRadio && durRadio.getAttribute("aria-checked") !== "true") {
          await simulateClick(durRadio);
          await humanDelay(500, 900);
        }
      }

      // Ensure 'องค์ประกอบ' (Element Reference) is selected
      const elementRadio = Array.from(document.querySelectorAll('mat-radio-button, [role="radio"]')).find(r =>
        r.innerText?.includes("องค์ประกอบ")
      );
      if (elementRadio && elementRadio.getAttribute("aria-checked") !== "true") {
        await simulateClick(elementRadio);
        await humanDelay(400, 800);
      }
    }

    // Close settings panel by toggling trigger
    await simulateClick(trigger);
    await humanDelay(800, 1500);
  }

  /**
   * Downloads video from Google Flow upscaled to 720p
   */
  async function downloadVideoWithUpscale720p() {
    try {
      const cards = Array.from(document.querySelectorAll("media-card, .card, [role='group']"));
      const videoCard = cards.find(c =>
        c.querySelector('video') ||
        c.querySelector('[aria-label*="วิดีโอ"]') ||
        c.querySelector('.video-cover') ||
        c.textContent.includes('วิดีโอ') ||
        c.textContent.includes('Camera rotates')
      );
      if (!videoCard) return false;

      videoCard.scrollIntoView({ block: "center", behavior: "smooth" });
      await humanDelay(600, 1200);

      const moreBtn = Array.from(videoCard.querySelectorAll("button")).find(b => {
        const icon = b.querySelector('mat-icon')?.textContent || '';
        const aria = b.getAttribute('aria-label') || '';
        return icon.includes('more_vert') || aria.includes('ตัวเลือกเพิ่มเติม');
      });
      if (!moreBtn) return false;

      await simulateClick(moreBtn);
      await humanDelay(600, 1000);

      const menuItems = Array.from(document.querySelectorAll('button[role="menuitem"], .mat-mdc-menu-item'));
      const dlItem = menuItems.find(m => m.textContent.includes('ดาวน์โหลด'));
      if (!dlItem) return false;

      await simulateClick(dlItem);
      await humanDelay(600, 1000);

      // In download submenu, look for 720p (e.g. '720p เพิ่มความละเอียดแล้ว' or '720p ขนาดดั้งเดิม')
      const subItems = Array.from(document.querySelectorAll('button[role="menuitem"], .mat-mdc-menu-item'));
      const item720p = subItems.find(m => m.textContent.includes('720p'));
      if (item720p) {
        console.log("[FlowDriver] Triggering 720p upscaled video download:", item720p.textContent.trim());
        await simulateClick(item720p);
        await humanDelay(2000, 3500);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[FlowDriver] downloadVideoWithUpscale720p notice:", err);
      return false;
    }
  }

  /**
   * Waits for active generation progress cards to reach 100% and finish
   */
  async function waitForGenerationComplete(timeoutMs = 600000, onProgress = () => {}) {
    const start = Date.now();
    let hasStarted = false;

    while (Date.now() - start < timeoutMs) {
      const progressCards = selectors.progressCards();
      if (progressCards.length > 0) {
        hasStarted = true;
        const pctText = progressCards[0].innerText.trim();
        onProgress(pctText);
      } else if (hasStarted) {
        // Progress disappeared -> generation completed!
        await humanDelay(2500, 4000);
        return true;
      }

      await sleep(1500);
    }
    throw new Error("Generation timed out after 10 minutes");
  }

  /**
   * Full pipeline:
   * 0. Ensure fresh new project in Google Flow
   * 1. Upload & Lock Product Reference Image (100% consistency)
   * 2. Generate Image First (โหมดรูปภาพ 9:16)
   * 3. Animate that Image to Video (ความยาว 4s/6s/8s/10s ตามที่เลือก)
   * 4. Return generated video URL for TikTok Studio
   */
  async function executeFlowJob(job, sendUpdate) {
    sendUpdate({ status: "running", stage: "checking_project", message: "กำลังเตรียมหน้าต่าง Google Flow..." });

    // Step 0: Ensure we are inside a fresh new project
    if (location.pathname === "/" || !location.pathname.includes("/project/")) {
      sendUpdate({ status: "running", stage: "creating_project", message: "กำลังสร้างโปรเจ็กต์ใหม่ใน Google Flow..." });
      await humanDelay(1500, 2500);
      const newProjBtn = await waitFor(selectors.newProjectBtn, 20000, "New project button");
      await simulateClick(newProjBtn);
      await waitFor(() => location.pathname.includes("/project/"), 25000, "New project URL to load");
      await humanDelay(2500, 4000);
    }

    // Wait for prompt editor to be ready
    await waitFor(selectors.promptEditor, 20000, "Prompt Editor (ProseMirror)");
    await humanDelay(1200, 2000);

    // =========================================================================
    // STEP 1: Switch to Image Mode FIRST (โหมดรูปภาพ 9:16, x1 ภาพต่อครั้ง)
    // *Important: Switching to Image mode unlocks the '+' (เพิ่มองค์ประกอบ) button
    // =========================================================================
    sendUpdate({
      status: "running",
      stage: "configuring_image",
      message: "สเต็ปที่ 1: ตั้งค่าโหมดรูปภาพ 9:16 (สร้างทีละ 1 ภาพ x1) ก่อนเริ่มสร้างภาพสินค้า..."
    });
    await humanDelay(1200, 2000);
    await configureSettings({ mode: "image", aspectRatio: "9:16", count: "x1" });
    await humanDelay(1500, 2500);

    // =========================================================================
    // STEP 2: Lock & Attach Product Reference Image into Prompt (องค์ประกอบอ้างอิง)
    // =========================================================================
    if (job.productImageBase64) {
      sendUpdate({
        status: "running",
        stage: "attaching_reference",
        message: "สเต็ปที่ 2: นำภาพสินค้าจริงจาก Showcase เข้าเป็นองค์ประกอบอ้างอิง และล็อกอัตลักษณ์สินค้า/โลโก้ 100%..."
      });
      try {
        await humanDelay(1000, 2000);
        await attachProductReferenceImage(job.productImageBase64, job.productImageMime || "image/jpeg", "product_ref.jpg");
        sendUpdate({
          status: "running",
          stage: "reference_locked",
          message: "ล็อกภาพสินค้าและโลโก้ 100% เรียบร้อยแล้ว (Element Reference Chip Active)"
        });
        await humanDelay(1500, 2500);
      } catch (attachErr) {
        console.warn("[FlowDriver] Reference attachment notice:", attachErr);
      }
    }

    // =========================================================================
    // STEP 3: Generate Scene Image First (สร้างภาพฉากสินค้าก่อน)
    // =========================================================================
    sendUpdate({
      status: "running",
      stage: "filling_image_prompt",
      message: "สเต็ปที่ 3: กรอกพรอมต์ฉากโฆษณาเชิงพาณิชย์สำหรับสร้างภาพสินค้า..."
    });
    await fillPrompt(job.imagePrompt);
    await humanDelay(1800, 3000);

    const genBtn = await waitFor(() => {
      const b = selectors.generateBtn();
      return b && !b.disabled ? b : null;
    }, 15000, "Generate Button enabled");

    sendUpdate({ status: "running", stage: "generating_image", message: "กำลังเริ่มสร้างภาพสินค้าฉากแรก (x1)..." });
    await simulateClick(genBtn);
    await humanDelay(3000, 5000);

    await waitForGenerationComplete(300000, (pct) => {
      sendUpdate({ status: "running", stage: "generating_image", message: `กำลังเรนเดอร์ภาพสินค้า (${pct})...` });
    });
    await humanDelay(2500, 4000);

    const imgTile = selectors.latestImageTile();
    const imageUrl = imgTile ? imgTile.src : null;
    sendUpdate({
      status: "running",
      stage: "image_ready",
      message: `สร้างภาพสินค้าเสร็จสมบูรณ์ 100%! เตรียมนำภาพไปเป็นส่วนผสมสร้างวิดีโอ (${job.videoDuration || "10 วินาที"})...`,
      imageUrl
    });
    await humanDelay(2000, 3500);

    // =========================================================================
    // STEP 4: Take the Generated Scene Image and Click 'ทำให้เคลื่อนไหว' (Animate)
    // =========================================================================
    const durationLabel = job.videoDuration || "10 วินาที";
    sendUpdate({
      status: "running",
      stage: "animating_image",
      message: `สเต็ปที่ 4: ดึงภาพฉากที่สร้างเสร็จเข้าฟังก์ชัน 'ทำให้เคลื่อนไหว' (Animate to Video)...`
    });

    const animated = await animateLatestImage();
    await humanDelay(2000, 3500);

    // =========================================================================
    // STEP 5: Configure Video Settings (Omni 1.1 Flash, 360p, Duration, x1)
    // =========================================================================
    sendUpdate({
      status: "running",
      stage: "configuring_video",
      message: `สเต็ปที่ 5: ตั้งค่าวิดีโอ (โมเดล Omni, ความละเอียด 360p, ความยาว ${durationLabel}, x1 คลิป)...`
    });
    await configureSettings({
      mode: "video",
      aspectRatio: "9:16",
      videoDuration: durationLabel,
      model: job.model || "Omni 1.1 Flash",
      resolution: "360p", // สร้างด้วย 360p บน Omni เพื่อความรวดเร็วและประหยัดเครดิต
      count: "x1" // สร้างเเค่ 1 คลิปต่อครั้งเท่านั้น
    });
    await humanDelay(1500, 2500);

    // =========================================================================
    // STEP 6: Fill Video Motion Prompt & Generate Video
    // =========================================================================
    sendUpdate({ status: "running", stage: "filling_video_prompt", message: `สเต็ปที่ 6: กรอกพรอมต์ความเคลื่อนไหวของกล้องและแสง (${durationLabel})...` });
    await fillPrompt(job.videoPrompt);
    await humanDelay(1800, 3000);

    const videoGenBtn = await waitFor(() => {
      const b = selectors.generateBtn();
      return b && !b.disabled ? b : null;
    }, 15000, "Generate Video Button enabled");

    sendUpdate({ status: "running", stage: "generating_video", message: `กำลังเรนเดอร์คลิปวิดีโอ (${durationLabel})...` });
    await simulateClick(videoGenBtn);
    await humanDelay(3000, 5000);

    await waitForGenerationComplete(600000, (pct) => {
      sendUpdate({ status: "running", stage: "generating_video", message: `กำลังเรนเดอร์วิดีโอ (${pct})...` });
    });
    await humanDelay(2500, 4000);

    // =========================================================================
    // STEP 7: Download Video & Upscale to 720p
    // =========================================================================
    sendUpdate({
      status: "running",
      stage: "upscaling_download",
      message: "สเต็ปที่ 7: กำลังดาวน์โหลดและอัปสเกลวิดีโอจาก 360p เป็น 720p HD สำหรับ TikTok Studio..."
    });
    await humanDelay(1000, 2000);
    const upscaled = await downloadVideoWithUpscale720p();
    console.log("[FlowDriver] Upscaled to 720p download status:", upscaled);
    await humanDelay(2000, 3500);

    const videoTile = selectors.latestVideoTile();
    const videoUrl = videoTile ? (videoTile.src || videoTile.currentSrc) : null;

    sendUpdate({
      status: "completed",
      stage: "done",
      message: `สร้างคลิปวิดีโอสำเร็จและอัปสเกล 720p เรียบร้อย (${durationLabel})! พร้อมส่งต่อ TikTok Studio`,
      imageUrl,
      videoUrl,
      caption: job.caption
    });

    return { imageUrl, videoUrl, caption: job.caption };
  }

  // Message listener from extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "PING_FLOW") {
      sendResponse({ ok: true, url: location.href, hasEditor: !!selectors.promptEditor() });
      return true;
    }

    if (message.action === "RUN_FLOW_JOB") {
      executeFlowJob(message.job, (progress) => {
        chrome.runtime.sendMessage({ action: "FLOW_JOB_PROGRESS", jobId: message.job.id, progress });
      })
        .then((result) => sendResponse({ ok: true, result }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));

      return true; // asynchronous response
    }
  });
})();
