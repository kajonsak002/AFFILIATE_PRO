// src/lib/deepseek.js - DeepSeek API Client with Zero-Key Fallback Generator
// Integrates strict TikTok Compliance, 100% Thai Dialogue, Anti-Ban & Auto-Sanitization

import { sanitizeComplianceText } from "./compliance.js";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
export const CHEAPEST_MODEL = "deepseek-chat"; // DeepSeek-V3 ($0.14 / 1M tokens)

/**
 * Built-in high fidelity generator used when API Key is absent or network is unavailable
 */
export function generateFallbackPrompts({
  product,
  mode,
  engine = "flow",
  videoDuration = "8 วินาที",
  lockProductReference = true
}) {
  const prodTitle = product?.title || "สินค้าขายดี TikTok Shop";
  const cleanTitle = prodTitle.slice(0, 28);
  const price = product?.price || "ราคาพิเศษ";

  const imagePrompt = `Strictly maintain 100% visual fidelity to the reference image: preserve exact product packaging, container shape, brand logo typography, bottle label, cap, and original colors without any changes or distortion. Commercial product photography of ${prodTitle}, ${mode?.stylePrompt || "clean minimalist commercial background, studio lighting, hyperrealistic 8k"}, 9:16 vertical orientation, elegant soft reflections, razor-sharp details.`;

  const videoPrompt = `Maintain 100% product identity from the reference image. The exact product packaging, brand logo, and label remain sharp, legible, and unchanged throughout the clip. Smooth cinematic slow panning camera motion orbiting around ${prodTitle}, dynamic soft studio light sweep accentuating packaging curves, cinematic depth of field, steady smooth motion for ${videoDuration}.`;

  const rawDialogue = `สวัสดีค่ะทุกคน วันนี้มีไอเทมเด็ดมาบอกต่อ สำหรับคนที่มองหา ${cleanTitle} ตัวนี้คือตอบโจทย์มาก เนื้อสัมผัสดี คุณภาพเกินคุ้ม ในราคาเพียง ${price} ใครสนใจรีบกดที่ตะกร้าสีเหลืองมุมล่างซ้ายได้เลยนะคะ`;
  const dialogue = sanitizeComplianceText(rawDialogue);

  const rawCaption = `${cleanTitle} ตัวนี้บอกเลยว่าห้ามพลาด คุ้มค่าเกินราคามากๆ พิกัดในตะกร้าสีเหลืองเลยนะคะ #รีวิวของดีบอกต่อ #TikTokShopครีเอเตอร์ #พิกัดในตะกร้า #ของดีบอกต่อ #ช้อปกันวันละนิด`;
  const caption = sanitizeComplianceText(rawCaption);

  const basketName = sanitizeComplianceText(cleanTitle);

  return {
    imagePrompt,
    videoPrompt,
    dialogue,
    caption,
    basketName
  };
}

export async function generateProductPrompts({
  apiKey,
  product,
  mode,
  engine = "flow",
  videoDuration = "8 วินาที",
  lockProductReference = true
}) {
  // If no API key provided, seamlessly generate built-in compliant prompts immediately
  if (!apiKey || !apiKey.trim()) {
    console.log("[DeepSeek] No API Key provided, using built-in high fidelity generator");
    return generateFallbackPrompts({ product, mode, engine, videoDuration, lockProductReference });
  }

  const systemPrompt = `You are a world-class TikTok E-commerce Creative Director and AI Prompt Engineering Expert specializing in viral TikTok Shop videos.
You strictly enforce TikTok Community Guidelines and TikTok Shop Advertising Policies to guarantee accounts never receive policy violations or shadowbans.

STRICT PRODUCT FIDELITY & IDENTITY LOCKING (CRITICAL):
- The physical product image from TikTok Shop Showcase is attached as an Image Reference Element in the generation pipeline.
- "imagePrompt": MUST instruct the model to maintain 100% exact fidelity to the reference image. Begin with: "Strictly maintain 100% visual fidelity to the reference image: preserve exact product packaging, container shape, brand logo typography, bottle label, cap, and original colors without any changes or distortion." Followed by commercial product photography staging adhering to the chosen marketing style.
- "videoPrompt": MUST instruct the model to maintain 100% consistent product identity throughout the ${videoDuration} duration. Begin with: "Maintain 100% product identity from the reference image. The exact product packaging, brand logo, and label remain sharp, legible, and unchanged throughout the clip." Followed by dynamic cinematic camera motion tailored for ${videoDuration} runtime.

STRICT COMPLIANCE RULES:
1. "dialogue": Spoken voiceover script MUST BE 100% NATURAL SPOKEN THAI. ABSOLUTELY NO ENGLISH WORDS OR LATIN CHARACTERS IN DIALOGUE.
2. ABSOLUTELY NO PROHIBITED MEDICAL WORDS OR EXTREME CLAIMS:
   - FORBIDDEN: รักษา, บำบัด, หายขาด, ป้องกันโรค, ยา, ฆ่าเชื้อ, ต้านไวรัส, ลดไข้, แก้ปวด, แก้คัน, หายสิว, ดีท็อกซ์, ล้างสารพิษ.
   - FORBIDDEN CLAIMS: ขาวไว, ขาวถาวร, สลายไขมัน, ระเบิดไขมัน, ลดน้ำหนักทันที, ชะลอวัย, ย้อนวัย.
   - FORBIDDEN GUARANTEES: การันตี 100%, เห็นผลทันที, ปลอดภัย 100%, รับประกัน, ดีที่สุดในโลก, อันดับ 1, มหัศจรรย์.
   - ALLOWED: Use safe, engaging UGC phrases like "ดูแลสุขภาพ", "ผิวแลดูกระจ่างใส", "ดูแลรูปร่างให้มั่นใจ", "รู้สึกผ่อนคลายสบายขึ้น", "ได้รับความนิยมสูง", "คุ้มค่าคุ้มราคา".
3. "caption": High-converting THAI caption (1-2 punchy lines) highlighting product benefits, urgent CTA directing viewers to the yellow basket ("กดสั่งซื้อที่ตะกร้าสีเหลืองมุมล่างซ้ายได้เลยค่ะ"), followed by 4-6 trending Thai hashtags.
4. "imagePrompt": Detailed prompt in ENGLISH for generating the product's first frame (aspect ratio 9:16). Framed in the chosen marketing style, with realistic textures and lighting.
5. "videoPrompt": Professional cinematic motion instruction in ENGLISH (for Google Flow Veo 3.1 or Meta AI animate) describing dynamic camera movement for ${videoDuration}.
6. "basketName": Clean, concise product name in Thai for the TikTok yellow basket tag (max 28 characters, strictly compliant, NO claims).

Return strictly JSON format:
{
  "imagePrompt": "...",
  "videoPrompt": "...",
  "dialogue": "...",
  "caption": "...",
  "basketName": "..."
}`;

  const userPrompt = `Product Details:
- Title: ${product?.title || "สินค้าขายดี TikTok Shop"}
- Price: ${product?.price || "ราคาพิเศษ"}
- Shop: ${product?.shop || "TikTok Shop"}
- Marketing Style Preset: ${mode?.title || "มาตรฐาน"} (${mode?.tagline || ""})
- Style Visual Direction: ${mode?.stylePrompt || "commercial studio photography"}
- Target Platform: ${engine === "flow" ? `Google Flow (Veo 3.1) - Duration: ${videoDuration}` : "Meta AI (10s)"} (9:16 vertical video)
- Product Locking: ${lockProductReference ? "100% strict identity locking to product reference image, logo, and label." : "Standard"}

Remember:
1. "dialogue" must be 100% Thai spoken script without any English words (ภาษาไทยแท้ 100%).
2. Both "dialogue", "caption", and "basketName" must be free of medical claims and false guarantees.
3. Output valid JSON only.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: CHEAPEST_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.75,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      console.warn(`[DeepSeek] API response error HTTP ${response.status}, using built-in generator`);
      return generateFallbackPrompts({ product, mode, engine, videoDuration, lockProductReference });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawContent);

    const sanitizedCaption = sanitizeComplianceText(parsed.caption || `${product.title} ${product.price} รีบกดในตะกร้าเหลืองเลยค่ะ! #รีวิวของดี #TikTokShopครีเอเตอร์`);
    const sanitizedDialogue = sanitizeComplianceText(parsed.dialogue || `ใครที่กำลังมองหา${product.title} ตัวนี้ตอบโจทย์มากค่ะ คุ้มค่าคุ้มราคา กดที่ตะกร้าเหลืองได้เลยนะคะ`);
    const sanitizedBasketName = sanitizeComplianceText(parsed.basketName || product.title.slice(0, 25));

    return {
      imagePrompt: parsed.imagePrompt || generateFallbackPrompts({ product, mode, engine, videoDuration }).imagePrompt,
      videoPrompt: parsed.videoPrompt || generateFallbackPrompts({ product, mode, engine, videoDuration }).videoPrompt,
      dialogue: sanitizedDialogue,
      caption: sanitizedCaption,
      basketName: sanitizedBasketName
    };
  } catch (err) {
    console.warn("[DeepSeek] API call exception, using built-in generator:", err.message);
    return generateFallbackPrompts({ product, mode, engine, videoDuration, lockProductReference });
  }
}
