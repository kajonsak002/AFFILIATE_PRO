// src/lib/deepseek.js - DeepSeek API Client (Using cheapest deepseek-chat model)
// Integrates strict TikTok Compliance, 100% Thai Dialogue, Anti-Ban & Auto-Sanitization

import { sanitizeComplianceText, validate100PercentThaiDialogue } from "./compliance.js";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
export const CHEAPEST_MODEL = "deepseek-chat"; // DeepSeek-V3 ($0.14 / 1M tokens)

export async function generateProductPrompts({
  apiKey,
  product,
  mode,
  engine = "flow",
  videoDuration = "8 วินาที",
  lockProductReference = true
}) {
  if (!apiKey) throw new Error("กรุณากรอก DeepSeek API Key ในการตั้งค่า");

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
3. "caption": High-converting THAI caption (1-2 punchy lines) highlighting product benefits, urgent CTA directing viewers to the yellow basket ("กดสั่งซื้อที่ตะกร้าสีเหลืองมุมล่างซ้ายได้เลยค่ะ"), followed by 4-6 trending Thai hashtags (e.g. #รีวิวของดีบอกต่อ #TikTokShopครีเอเตอร์ #พิกัดในตะกร้า #ของดีบอกต่อ).
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
- Title: ${product.title || "สินค้าขายดี TikTok Shop"}
- Price: ${product.price || "ราคาพิเศษ"}
- Shop: ${product.shop || "TikTok Shop"}
- Marketing Style Preset: ${mode.title} (${mode.tagline})
- Style Visual Direction: ${mode.stylePrompt}
- Target Platform: ${engine === "flow" ? `Google Flow (Veo 3.1) - Duration: ${videoDuration}` : "Meta AI (10s)"} (9:16 vertical video)
- Product Locking: ${lockProductReference ? "100% strict identity locking to product reference image, logo, and label." : "Standard"}

Remember:
1. "dialogue" must be 100% Thai spoken script without any English words (ภาษาไทยแท้ 100%).
2. Both "dialogue", "caption", and "basketName" must be free of medical claims and false guarantees.
3. Output valid JSON only.`;

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
    let errMessage = `DeepSeek Error: HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) errMessage = `DeepSeek Error: ${errData.error.message}`;
    } catch {}
    throw new Error(errMessage);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(rawContent);

    // Run compliance sanitizer across all Thai fields
    const sanitizedCaption = sanitizeComplianceText(parsed.caption || `${product.title} ${product.price} รีบกดในตะกร้าเหลืองเลยค่ะ! #รีวิวของดี #TikTokShopครีเอเตอร์`);
    const sanitizedDialogue = sanitizeComplianceText(parsed.dialogue || `ใครที่กำลังมองหา${product.title} ตัวนี้ตอบโจทย์มากค่ะ คุ้มค่าคุ้มราคา กดที่ตะกร้าเหลืองได้เลยนะคะ`);
    const sanitizedBasketName = sanitizeComplianceText(parsed.basketName || product.title.slice(0, 25));

    // Ensure dialogue is 100% Thai without English
    let finalDialogue = sanitizedDialogue.sanitized;
    const thaiCheck = validate100PercentThaiDialogue(finalDialogue);
    if (!thaiCheck.is100Thai) {
      // Strip any accidental English characters from spoken dialogue
      finalDialogue = finalDialogue.replace(/[a-zA-Z]/g, "").replace(/\s{2,}/g, " ").trim();
    }

    return {
      imagePrompt: parsed.imagePrompt || `${mode.stylePrompt}, featuring ${product.title}`,
      videoPrompt: parsed.videoPrompt || "Cinematic camera slowly glides closer to the product, soft natural reflections, commercial lighting",
      dialogue: finalDialogue,
      caption: sanitizedCaption.sanitized,
      basketName: sanitizedBasketName.sanitized.slice(0, 28),
      replacementsMade: [
        ...sanitizedCaption.replacementsMade,
        ...sanitizedDialogue.replacementsMade
      ]
    };
  } catch (e) {
    throw new Error("Failed to parse DeepSeek response: " + e.message);
  }
}
