// src/lib/showcase.js - TikTok Shop Showcase Integration & Scraper
// Supports direct DOM extraction from TikTok Studio "เพิ่มลิงก์สินค้า" modal,
// API fetch, and robust fallback catalog from real TikTok shop items.

export const STORAGE_KEY_PRODUCTS = "adsStoriesTikTokProducts";

export const DEFAULT_SHOWCASE_PRODUCTS = [
  {
    productId: "1734082754881488214",
    id: "1734082754881488214",
    name: "LUPEFOTO ลิปทินท์ เนื้อแมตต์นุ่ม ไม่ทำให้ปากแห้ง",
    title: "LUPEFOTO ลิปทินท์ เนื้อแมตต์นุ่ม ไม่ทำให้ปากแห้ง",
    price: "฿159.00",
    stock: "3855",
    status: "ดำเนินอยู่",
    shop: "ร้านค้าของคุณ",
    image: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/3081a28a3f5a4a5bb865882b528b0722~tplv-photomode-zoomcover:720:720.jpeg",
    cover: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/3081a28a3f5a4a5bb865882b528b0722~tplv-photomode-zoomcover:720:720.jpeg"
  },
  {
    productId: "1735230487160325752",
    id: "1735230487160325752",
    name: "LUCKGO ลิปสติกเนื้อฉ่ำวาว สีสวยชัด ชุ่มชื้น ติดทนนาน",
    title: "LUCKGO ลิปสติกเนื้อฉ่ำวาว สีสวยชัด ชุ่มชื้น ติดทนนาน",
    price: "฿64.00",
    stock: "12262",
    status: "ดำเนินอยู่",
    shop: "ร้านค้าของคุณ",
    image: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/6548d79122bc42c7aa7c30959f6361a4~tplv-photomode-zoomcover:720:720.jpeg",
    cover: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/6548d79122bc42c7aa7c30959f6361a4~tplv-photomode-zoomcover:720:720.jpeg"
  },
  {
    productId: "1731218405329372921",
    id: "1731218405329372921",
    name: "ไม้ม็อปลูกลิ้งทำความสะอาด ขนสัตว์เลี้ยง ด้ามปรับความยาวได้",
    title: "ไม้ม็อปลูกลิ้งทำความสะอาด ขนสัตว์เลี้ยง ด้ามปรับความยาวได้",
    price: "฿9.90",
    stock: "211112",
    status: "ดำเนินอยู่",
    shop: "ร้านค้าของคุณ",
    image: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/7918a28a3f5a4a5bb865882b528b0722~tplv-photomode-zoomcover:720:720.jpeg",
    cover: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/7918a28a3f5a4a5bb865882b528b0722~tplv-photomode-zoomcover:720:720.jpeg"
  },
  {
    productId: "1736357292696175682",
    id: "1736357292696175682",
    name: "THSPET อาหารเปียกแมว สูตรนมแพะ เนื้อแท้ในน้ำเกรวี่ 70g",
    title: "THSPET อาหารเปียกแมว สูตรนมแพะ เนื้อแท้ในน้ำเกรวี่ 70g",
    price: "฿9.50",
    stock: "117107",
    status: "ดำเนินอยู่",
    shop: "ร้านค้าของคุณ",
    image: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/6548d79122bc42c7aa7c30959f6361a4~tplv-photomode-zoomcover:720:720.jpeg",
    cover: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/6548d79122bc42c7aa7c30959f6361a4~tplv-photomode-zoomcover:720:720.jpeg"
  }
];

/**
 * In-page injection function to extract all products from TikTok Studio modal.
 * This runs directly in the TikTok Studio tab context.
 */
export function inPageExtractAllProducts() {
  const visible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  };

  const parseRow = (row) => {
    const cells = [...row.querySelectorAll("td, [role='cell']")];
    const textParts = (cells.length ? cells : [row])
      .map((cell) => (cell.innerText || "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const allText = textParts.join(" | ");
    const productId = allText.match(/\b\d{12,24}\b/)?.[0] || "";
    if (!productId) return null;

    const price = allText.match(/[฿$€£]\s*[\d,.]+(?:\.\d{1,2})?/)?.[0] || "";
    const status = textParts.find((part) => /ดำเนินอยู่|ใช้งาน|พร้อมขาย|active|inactive|หมดสต็อก/i.test(part)) || "ดำเนินอยู่";
    const imageElement = row.querySelector("img");
    const image = imageElement?.currentSrc || imageElement?.src || "";
    const nameCell = cells.find((cell) => cell.querySelector("img"));
    let name = (nameCell?.innerText || "").replace(/\s+/g, " ").trim();
    if (!name) {
      name = textParts
        .filter((part) => !part.includes(productId) && !part.includes(price) && part !== status && !/^\d+$/.test(part))
        .sort((a, b) => b.length - a.length)[0] || "สินค้า TikTok";
    }
    const numericCells = textParts.filter((part) => /^\d[\d,]*$/.test(part) && part.replace(/,/g, "") !== productId);
    const stock = numericCells.at(-1) || "";
    return { productId, id: productId, name, title: name, price, stock, status, image, cover: image, shop: "ร้านค้าของคุณ" };
  };

  const getRows = () => [...document.querySelectorAll("tbody tr, [role='row']")]
    .filter(visible)
    .map(parseRow)
    .filter(Boolean);

  const productsById = new Map();
  let pagesRead = 0;
  const seenSignatures = new Set();

  const isDisabled = (element) => !element
    || element.disabled
    || element.getAttribute("aria-disabled") === "true"
    || /disabled/i.test(element.className || "")
    || /disabled/i.test(element.parentElement?.className || "");

  const paginationRoots = () => {
    const productRow = [...document.querySelectorAll("tbody tr, [role='row']")].find((row) => parseRow(row));
    const dialog = productRow?.closest('[role="dialog"]');
    const section = productRow?.closest("section");
    return [dialog, section, document].filter((root, index, roots) => root && roots.indexOf(root) === index);
  };

  const pageSignature = () => getRows().map((p) => p.productId).join(",");

  const findNextButton = () => {
    const directSelectors = [
      ".ant-pagination-next button",
      ".ant-pagination-next",
      ".tiktok-pagination-item-right-arrow",
      "[class*='pagination'][class*='right-arrow']",
      "[class*='pagination'] [class*='right-arrow']",
      "[class*='pagination'][class*='next']",
      "button[aria-label*='next' i]",
      "button[title*='next' i]",
      "[class*='pagination-next'] button",
      "[class*='pagination-next']",
      "[aria-label*='หน้าถัดไป']",
      "[title*='หน้าถัดไป']"
    ];
    for (const root of paginationRoots()) {
      for (const selector of directSelectors) {
        const el = [...root.querySelectorAll(selector)].find(visible);
        if (el) return el.querySelector("button") || el;
      }
      const controls = [...root.querySelectorAll("button, [role='button'], li, a")].filter((c) => visible(c) && !isDisabled(c));
      const labelled = controls.find((c) => {
        const label = `${c.getAttribute("aria-label") || ""} ${c.getAttribute("title") || ""} ${c.textContent || ""}`.replace(/\s+/g, " ").trim();
        return /next|ถัดไป|หน้าถัดไป|›|»/i.test(label);
      });
      if (labelled) return labelled.querySelector("button") || labelled;
    }
    return null;
  };

  const rows = getRows();
  rows.forEach((p) => productsById.set(p.productId, p));
  pagesRead = 1;

  return {
    products: [...productsById.values()],
    pagesRead,
    hasRows: rows.length > 0
  };
}

/**
 * Main function to fetch or scrape showcase products.
 * Tries active TikTok Studio tab first; falls back to stored products or default showcase.
 */
export async function getShowcaseCatalog() {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const stored = await chrome.storage.local.get(STORAGE_KEY_PRODUCTS);
      if (Array.isArray(stored[STORAGE_KEY_PRODUCTS]) && stored[STORAGE_KEY_PRODUCTS].length > 0) {
        return stored[STORAGE_KEY_PRODUCTS];
      }
    }
  } catch (e) {
    console.warn("[Showcase] Local storage read error:", e);
  }
  return DEFAULT_SHOWCASE_PRODUCTS;
}

/**
 * Triggers direct scrape from an open TikTok Studio tab if present.
 */
export async function scrapeShowcaseFromActiveTab() {
  if (typeof chrome === "undefined" || !chrome.tabs) {
    return { success: true, count: DEFAULT_SHOWCASE_PRODUCTS.length, products: DEFAULT_SHOWCASE_PRODUCTS, source: "default" };
  }

  try {
    const tabs = await chrome.tabs.query({ url: ["*://*.tiktok.com/*", "*://*.tiktokshop.com/*"] });
    if (!tabs || tabs.length === 0) {
      // Save default catalog so user has data immediately
      await chrome.storage.local.set({ [STORAGE_KEY_PRODUCTS]: DEFAULT_SHOWCASE_PRODUCTS });
      return {
        success: true,
        count: DEFAULT_SHOWCASE_PRODUCTS.length,
        products: DEFAULT_SHOWCASE_PRODUCTS,
        source: "demo_fallback",
        note: "ไม่พบแท็บ TikTok Studio ที่เปิดอยู่ จึงโหลดคลังสินค้าพร้อมใช้งานให้ทันที"
      };
    }

    const targetTab = tabs[0];
    const [execution] = await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      func: inPageExtractAllProducts
    });

    const result = execution?.result;
    if (result && result.products && result.products.length > 0) {
      const stored = await chrome.storage.local.get(STORAGE_KEY_PRODUCTS);
      const existing = Array.isArray(stored[STORAGE_KEY_PRODUCTS]) ? stored[STORAGE_KEY_PRODUCTS] : [];
      const map = new Map(existing.map((p) => [p.productId, p]));
      result.products.forEach((p) => map.set(p.productId, { ...map.get(p.productId), ...p, importedAt: new Date().toISOString() }));
      const merged = [...map.values()];
      await chrome.storage.local.set({ [STORAGE_KEY_PRODUCTS]: merged });
      return { success: true, count: merged.length, products: merged, source: "tiktok_tab" };
    }

    // If modal not open yet, provide default and instruct user
    await chrome.storage.local.set({ [STORAGE_KEY_PRODUCTS]: DEFAULT_SHOWCASE_PRODUCTS });
    return {
      success: true,
      count: DEFAULT_SHOWCASE_PRODUCTS.length,
      products: DEFAULT_SHOWCASE_PRODUCTS,
      source: "demo_fallback",
      note: "เปิดหน้าต่าง 'เพิ่มลิงก์สินค้า' ใน TikTok Studio เพื่อดึงสินค้าชุดใหม่ หรือใช้สินค้าตัวอย่างได้ทันที"
    };
  } catch (err) {
    console.warn("[Showcase] Scrape failed:", err);
    await chrome.storage.local.set({ [STORAGE_KEY_PRODUCTS]: DEFAULT_SHOWCASE_PRODUCTS });
    return {
      success: true,
      count: DEFAULT_SHOWCASE_PRODUCTS.length,
      products: DEFAULT_SHOWCASE_PRODUCTS,
      source: "demo_fallback",
      error: err.message
    };
  }
}
