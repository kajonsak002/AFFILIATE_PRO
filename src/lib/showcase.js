// src/lib/showcase.js - TikTok Shop Showcase API Integration with Offline Fallback

const SHOWCASE_API_URL = "https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list";

export const DEFAULT_SHOWCASE_PRODUCTS = [
  {
    id: "prod_demo_1",
    title: "ครีมบำรุงผิวหน้า ไวท์เทนนิ่ง คอมเพล็กซ์ สูตรเข้มข้น ผิวแลดูกระจ่างใส",
    price: "฿299.00",
    shop: "Official Beauty Store",
    sellerId: "seller_01",
    cover: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/3081a28a3f5a4a5bb865882b528b0722~tplv-photomode-zoomcover:720:720.jpeg"
  },
  {
    id: "prod_demo_2",
    title: "เซรั่มวิตามินซีสด บริสุทธิ์ บำรุงผิวล้ำลึก สัมผัสบางเบา ซึมไว",
    price: "฿390.00",
    shop: "Glow Skin Thailand",
    sellerId: "seller_02",
    cover: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/6548d79122bc42c7aa7c30959f6361a4~tplv-photomode-zoomcover:720:720.jpeg"
  },
  {
    id: "prod_demo_3",
    title: "ลิปแมทต์เนื้อนุ่ม ติดทนนาน ไม่ตกร่อง โทนสีธรรมชาติ",
    price: "฿159.00",
    shop: "Charm Cosmetics",
    sellerId: "seller_03",
    cover: "https://p16-va.tiktokcdn.com/tos-maliva-i-photomode-sg/7918a28a3f5a4a5bb865882b528b0722~tplv-photomode-zoomcover:720:720.jpeg"
  }
];

/**
 * Fetches products currently pinned/listed in the user's TikTok Shop Showcase.
 * Falls back to default showcase items if not logged in.
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
      console.warn("[Showcase] Active session not found on shop.tiktok.com, using showcase presets");
      return DEFAULT_SHOWCASE_PRODUCTS;
    }

    const json = await response.json();
    if (json.code !== 0 && json.code !== "0") {
      console.warn("[Showcase] API response code non-zero, using showcase presets:", json.message);
      return DEFAULT_SHOWCASE_PRODUCTS;
    }

    const items = json.data?.products || [];
    if (items.length === 0) {
      return DEFAULT_SHOWCASE_PRODUCTS;
    }

    return items.map((p) => ({
      id: String(p.product_id),
      title: p.title || "สินค้า TikTok Shop",
      price: p.format_available_price || "฿0.00",
      shop: p.seller_info?.shop_name || "TikTok Shop",
      sellerId: p.seller_info?.seller_id || "",
      cover: p.cover?.url_list?.[0] || p.cover?.thumb_url_list?.[0] || DEFAULT_SHOWCASE_PRODUCTS[0].cover,
      raw: p
    }));
  } catch (err) {
    console.warn("[Showcase] fetchShowcaseProducts notice:", err.message, "— loading showcase presets");
    return DEFAULT_SHOWCASE_PRODUCTS;
  }
}
