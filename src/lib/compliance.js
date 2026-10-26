// src/lib/compliance.js
// TikTok Compliance & Anti-Violation Engine
// Extracted and enhanced from AZ Creator Extension (trendRadar, GrokMode, popup)
// Strictly enforces TikTok Community Guidelines, TikTok Shop Creator Policies,
// 100% Thai dialogue, and removes medical claims, extreme before/after, and false guarantees.

export const FORBIDDEN_CATEGORIES = {
  MEDICAL: [
    "หายขาด", "รักษาโรค", "รักษา", "บำบัด", "ป้องกันโรค", "ยา", "Cider", "cider", "Apple Cider", "ไซเดอร์", "ยาเทวดา", "ยาวิเศษ"
  ],
  MEDICAL_INDIRECT: [
    "กู้ชีพ", "ฟื้นฟู", "สมานแผล", "ต้านทาน", "ต้านอนุมูลอิสระ", "ลดการอักเสบ", "ฆ่าเชื้อ", "ต้านเชื้อ",
    "ต้านไวรัส", "ต้านแบคทีเรีย", "แก้อักเสบ", "ลดไข้", "แก้ปวด", "หายปวด", "แก้คัน", "หายคัน",
    "แก้เมื่อย", "หายเมื่อย", "หายผื่น", "หายสิว", "ล้างสารพิษ", "ดีท็อกซ์", "detox"
  ],
  BEAUTY_WEIGHT: [
    "ขาวไว", "ขาวถาวร", "ผอมทันที", "ลดน้ำหนัก", "ลดความอ้วน", "ระเบิดไขมัน", "สลายไขมัน", "ดักจับไขมัน",
    "อกฟู", "รูฟิต", "เพิ่มขนาด", "ชะลอวัย", "ย้อนวัย"
  ],
  GUARANTEES: [
    "เห็นผลทันที", "เห็นผลใน 3 นาที", "เห็นผล 100%", "เห็นผล100%", "การันตี 100%", "การันตี100%",
    "การันตี", "รับประกัน 100%", "รับประกัน", "100%", "Guaranteed", "Sure", "Cure", "Best in the world",
    "ปลอดภัย 100%", "ปลอดภัย100%", "ไม่มีผลข้างเคียง 100%", "ไม่เห็นผลยินดีคืนเงิน"
  ],
  SUPERLATIVES: [
    "ดีที่สุดในโลก", "ดีที่สุด", "อันดับ1", "อันดับ 1", "หนึ่งเดียวในโลก", "หนึ่งเดียว", "เจ้าแรกในไทย",
    "เจ้าแรก", "มหัศจรรย์", "ปาฏิหาริย์", "ศักดิ์สิทธิ์"
  ],
  FINANCIAL: [
    "รวยเร็ว", "ปลดหนี้ทันที", "ลงทุนผลตอบแทนสูง", "ได้เงินง่ายๆ", "แจกฟรีทุกคน"
  ],
  REDIRECT: [
    "แอดไลน์", "ทักแชท", "ทักไลน์", "โอนเงินเข้าบัญชี", "Lazada", "Shopee", "Facebook", "Line"
  ],
  MEDICAL_CONDITIONS: [
    "โรคอ้วน", "เบาหวาน", "มะเร็ง", "ท้องผูก", "ความดันโลหิต", "ไขมันในเลือด", "โรคหัวใจ", "โรคไต",
    "โรคตับ", "โรคกระเพาะ", "โรคซึมเศร้า", "โรคผิวหนัง", "ภูมิแพ้", "กรดไหลย้อน", "ไมเกรน", "ผมร่วง", "หลอดเลือด"
  ]
};

// Flattened list of all forbidden terms
export const ALL_FORBIDDEN_WORDS = Object.values(FORBIDDEN_CATEGORIES).flat();

// Safe substitution dictionary based on AZ Creator rules (zero recursive violations)
export const WORD_REPLACEMENTS = {
  // Medical condition softening
  "โรคอ้วน": "ปัญหาน้ำหนัก",
  "เบาหวาน": "ปัญหาสุขภาพ",
  "มะเร็ง": "ปัญหาสุขภาพ",
  "ท้องผูก": "ปัญหาการขับถ่าย",
  "ความดันโลหิต": "ระบบไหลเวียน",
  "ไขมันในเลือด": "ดูแลสุขภาพ",
  "โรคหัวใจ": "ปัญหาสุขภาพ",
  "โรคไต": "ปัญหาสุขภาพ",
  "โรคตับ": "ปัญหาสุขภาพ",
  "โรคกระเพาะ": "ปัญหาช่องท้อง",
  "โรคซึมเศร้า": "ดูแลสุขภาพจิตใจ",
  "โรคผิวหนัง": "ปัญหาผิว",
  "ภูมิแพ้": "ปัญหาผิวแพ้ง่าย",
  "กรดไหลย้อน": "ปัญหาท้องอืดแน่น",
  "ไมเกรน": "อาการปวดตึงหัว",
  "ผมร่วง": "ปัญหาเส้นผมบาง",
  "หลอดเลือด": "ระบบไหลเวียน",

  // Medical action softening
  "หายขาด": "จบปัญหากังวลใจ",
  "รักษาโรค": "ดูแลสุขภาพองค์รวม",
  "รักษา": "ช่วยดูแล",
  "บำบัด": "ช่วยดูแลอย่างอ่อนโยน",
  "ป้องกันโรค": "ช่วยดูแลสุขภาพ",
  "แก้ปวด": "รู้สึกสบายตัวขึ้น",
  "หายปวด": "รู้สึกสบายขึ้น",
  "แก้คัน": "ปลอบประโลมผิว",
  "หายคัน": "รู้สึกสบายผิว",
  "แก้เมื่อย": "ช่วยให้รู้สึกผ่อนคลาย",
  "หายเมื่อย": "รู้สึกเบาสบายขึ้น",
  "หายผื่น": "ช่วยดูแลผิวให้เรียบเนียน",
  "หายสิว": "ช่วยดูแลผิวให้แลดูกระจ่างใส",
  "ฟื้นฟู": "บำรุงล้ำลึก",
  "ลดการอักเสบ": "ปลอบประโลมผิว",
  "ลดไข้": "ช่วยให้สดชื่นขึ้น",
  "ล้างสารพิษ": "ดูแลระบบภายใน",
  "ดีท็อกซ์": "ช่วยปรับสมดุล",
  "detox": "ปรับสมดุล",

  // Claims & Beauty
  "เห็นผลทันทีใน 3 นาที": "รู้สึกถึงความเปลี่ยนแปลงได้น่าพอใจ",
  "เห็นผลทันที": "รู้สึกประทับใจตั้งแต่ครั้งแรก",
  "เห็นผลไว": "รู้สึกดีขึ้นอย่างต่อเนื่อง",
  "หายทันที": "รู้สึกสบายขึ้นทันใจ",
  "ลดทันที": "ช่วยดูแลสัดส่วน",
  "ลดน้ำหนัก": "ดูแลรูปร่างให้มั่นใจ",
  "ลดความอ้วน": "ดูแลหุ่นให้ฟิตเฟิร์ม",
  "ระเบิดไขมัน": "ช่วยกระชับสัดส่วน",
  "สลายไขมัน": "ดูแลความกระชับของรูปร่าง",
  "ดักจับไขมัน": "ช่วยดูแลโภชนาการ",
  "ผิวขาว": "ผิวแลดูกระจ่างใสเป็นธรรมชาติ",
  "ขาวไว": "ผิวแลดูสว่างกระจ่างใส",
  "ขาวถาวร": "ผิวแลดูเนียนใสสุขภาพดี",
  "หน้าใส": "ผิวหน้าแลดูเรียบเนียนสดใส",
  "ชะลอวัย": "ดูแลผิวให้อ่อนเยาว์",
  "ย้อนวัย": "ผิวแลดูสดใสมีชีวิตชีวา",

  // Guarantees & Superlatives
  "การันตี 100%": "มั่นใจในคุณภาพได้เต็มที่",
  "การันตี100%": "มั่นใจในคุณภาพได้เต็มที่",
  "การันตี": "มั่นใจได้เลย",
  "รับประกัน 100%": "มั่นใจในคุณภาพจริง",
  "รับประกัน": "มั่นใจได้",
  "เห็นผล 100%": "ผลลัพธ์น่าพึงพอใจอย่างยิ่ง",
  "เห็นผล100%": "ผลลัพธ์น่าพึงพอใจอย่างยิ่ง",
  "ปลอดภัย 100%": "ผ่านการตรวจสอบมาตรฐานปลอดภัย",
  "ปลอดภัย100%": "ได้มาตรฐานความปลอดภัย",
  "ไม่เห็นผลยินดีคืนเงิน": "มั่นใจในคุณภาพคุ้มค่า",
  "ดีที่สุดในโลก": "ได้รับความนิยมสูงมาก",
  "ดีที่สุด": "คุณภาพพรีเมียมยอดเยี่ยม",
  "อันดับ 1": "สินค้ายอดนิยม",
  "อันดับ1": "สินค้ายอดนิยม",
  "หนึ่งเดียวในโลก": "โดดเด่นไม่ซ้ำใคร",
  "หนึ่งเดียว": "โดดเด่นน่าใช้",
  "เจ้าแรกในไทย": "รุ่นยอดนิยมนำเข้า",
  "เจ้าแรก": "รุ่นยอดฮิต",
  "มหัศจรรย์": "น่าประทับใจสุดๆ",
  "ปาฏิหาริย์": "น่าทึ่งมาก"
};

/**
 * Sanitizes input text by replacing prohibited TikTok words with safe alternatives
 * @param {string} text
 * @returns {{ sanitized: string, replacementsMade: Array<{from: string, to: string}> }}
 */
export function sanitizeComplianceText(text) {
  if (!text || typeof text !== "string") return { sanitized: text || "", replacementsMade: [] };

  let sanitized = text;
  const replacementsMade = [];

  // Sort keys by descending length so multi-word phrases match first
  const sortedKeys = Object.keys(WORD_REPLACEMENTS).sort((a, b) => b.length - a.length);

  for (const fromWord of sortedKeys) {
    if (sanitized.includes(fromWord)) {
      const toWord = WORD_REPLACEMENTS[fromWord];
      const regex = new RegExp(escapeRegExp(fromWord), "gi");
      sanitized = sanitized.replace(regex, toWord);
      replacementsMade.push({ from: fromWord, to: toWord });
    }
  }

  // Clean double spaces
  sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

  return { sanitized, replacementsMade };
}

/**
 * Detects any remaining forbidden words in text
 * @param {string} text
 * @returns {Array<{ word: string, category: string }>}
 */
export function detectForbiddenWords(text) {
  if (!text || typeof text !== "string") return [];
  const found = [];

  for (const [category, words] of Object.entries(FORBIDDEN_CATEGORIES)) {
    for (const w of words) {
      if (text.includes(w)) {
        found.push({ word: w, category });
      }
    }
  }

  return found;
}

/**
 * Validates that spoken dialogue is 100% Thai without English alphabet mixing
 * (Numbers, standard punctuation and Thai characters are allowed)
 * @param {string} dialogueText
 * @returns {{ is100Thai: boolean, foreignChars: string[] }}
 */
export function validate100PercentThaiDialogue(dialogueText) {
  if (!dialogueText) return { is100Thai: true, foreignChars: [] };

  // Match English alphabet [a-zA-Z]
  const englishMatches = dialogueText.match(/[a-zA-Z]/g) || [];
  const uniqueChars = Array.from(new Set(englishMatches));

  return {
    is100Thai: uniqueChars.length === 0,
    foreignChars: uniqueChars
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
