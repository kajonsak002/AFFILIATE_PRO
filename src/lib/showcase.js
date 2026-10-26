// src/lib/showcase.js - TikTok Shop Showcase API Integration

const SHOWCASE_API_URL = "https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list";

/**
 * Fetches products currently pinned/listed in the user's TikTok Shop Showcase.
 * Uses browser credentials (cookies) from the active TikTok Shop session.
 * @param {number} count Number of products to fetch (default 30)
 * @param {number} offset Pagination offset (default 0)
 */
export async function fetchShowcaseProducts(count = 30, offset = 0) {
  const url = `${SHOWCASE_API_URL}?offset=${offset}&count=${count}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ตรวจสอบว่าคุณล็อกอินเข้า shop.tiktok.com ในเบราว์เซอร์แล้วหรือไม่`);
    }

    const json = await response.json();
    if (json.code !== 0 && json.code !== "0") {
      throw new Error(`TikTok Showcase API Error: ${json.message || "Failed to load showcase"}`);
    }

    const items = json.data?.products || [];
    return items.map(p => ({
      id: String(p.product_id),
      title: p.title || "สินค้า TikTok Shop",
      price: p.format_available_price || "฿0.00",
      shop: p.seller_info?.shop_name || "TikTok Shop",
      sellerId: p.seller_info?.seller_id || "",
      cover: p.cover?.url_list?.[0] || p.cover?.thumb_url_list?.[0] || "",
      raw: p
    }));
  } catch (err) {
    console.error("fetchShowcaseProducts failed:", err);
    throw err;
  }
}
