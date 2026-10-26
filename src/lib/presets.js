// src/lib/presets.js - 6 Marketing Style Presets for TikTok E-Commerce

export const MARKETING_MODES = [
  {
    id: "warehouse_clearance",
    title: "โกดัง ลดล้างสต๊อก",
    badge: "ขายดีสุด 📦",
    color: "#eab308", // Yellow
    icon: "Package",
    tagline: "บรรยากาศโกดัง ป้ายเหลืองตัวหนา เซลล์กระหน่ำ",
    description: "เน้นความรู้สึกของเยอะ ล้นสต๊อก ลดราคาเคลียร์พื้นที่ ป้ายแท็กสีเหลืองสะดุดตา กล่องพัสดุกองเรียงราย เหมาะกับสินค้าจัดโปรหนักและของใช้ในบ้าน",
    stylePrompt: "Busy warehouse setting, towering stacks of delivery cardboard boxes and pallets in the background, prominent bright yellow sale discount tags with bold Thai typography, dramatic commercial warehouse lighting, authentic inventory liquidation atmosphere, 9:16 vertical video composition."
  },
  {
    id: "flash_warehouse_crash",
    title: "ลดแรง โกดังแตก",
    badge: "เร่งด่วน 💥",
    color: "#ef4444", // Red
    icon: "Flame",
    tagline: "ราคาปะทะสายตา ป้ายแดงเหลือง โอกาสสุดท้าย",
    description: "บรรยากาศงานเซลล์สายฟ้าแลบ ป้ายราคาแดงตัดเหลือง ตัวอักษรหนาใหญ่เด่นชัด สร้างความรู้สึกด่วนต้องรีบกดสั่งซื้อทันทีก่อนของหมด",
    stylePrompt: "High-energy flash sale frenzy atmosphere, giant bold red and neon yellow discount signs, urgent promotion aesthetic, eye-catching price drop banners, dynamic spotlight sweeps on the product, viral TikTok flash sale aesthetic, 9:16 format."
  },
  {
    id: "ugc_realistic",
    title: "UGC สมจริง (รีวิวผู้ใช้จริง)",
    badge: "สร้างความเชื่อใจ ⭐",
    color: "#10b981", // Green
    icon: "UserCheck",
    tagline: "คนไทยรีวิวใช้งานจริง กล้องมือถือ แสงธรรมชาติ",
    description: "จำลองการถ่ายแบบ User-Generated Content (UGC) โดยคนไทยใช้งานจริง ถือสินค้ารีวิวหน้ากล้องมือถือ แสงธรรมชาติ ให้ความรู้สึกจริงใจ ไม่เหมือนโฆษณาประดิษฐ์",
    stylePrompt: "Raw authentic TikTok UGC style, shot on modern smartphone front camera in a cozy Thai modern apartment or bedroom, natural daylight, friendly attractive Thai creator holding and happily demonstrating the product, real unedited review feeling, relatable micro-influencer aesthetic, 9:16 vertical."
  },
  {
    id: "minimal_studio",
    title: "สตูดิโอมินิมอล พรีเมียม",
    badge: "หรูหรา มินิมอล ✨",
    color: "#8b5cf6", // Purple
    icon: "Sparkles",
    tagline: "แท่นวางมินิมอล แสงนวล สไตล์เกาหลี คลีนตา",
    description: "ฉากสไตล์เกาหลี แท่นหินอ่อน/อะคริลิก ดอกไม้แห้ง แสงแดดละมุนส่องผ่านหน้าต่าง เหมาะกับเครื่องสำอาง ลิปสติก สกินแคร์ น้ำหอม ให้ภาพลักษณ์ดูแพงเกินราคา",
    stylePrompt: "Clean aesthetic Korean minimalism, product placed elegantly on a modern cream travertine stone pedestal, soft morning sunlight casting gentle botanical shadows, subtle pastel luxury backdrop, 4k ultra-crisp studio product photography, commercial elegance, 9:16 vertical."
  },
  {
    id: "problem_solver",
    title: "สาธิตแก้ปัญหาจริง (Problem-Solver)",
    badge: "เห็นผลชัดเจน 🎯",
    color: "#06b6d4", // Cyan
    icon: "Target",
    tagline: "เน้นผลลัพธ์ Before/After สินค้าแก้ปัญหาชีวิตประจำวัน",
    description: "เล่าเรื่องแบบชี้ปัญหาที่คนดูเจอในชีวิตประจำวัน (เช่น คราบสกปรก, กลิ่นอับ, ปากแห้งแตก, ขนสัตว์ติดเสื้อ) แล้วให้สินค้านี้เข้ามาแก้ปัญหาทันทีอย่างเห็นผล",
    stylePrompt: "Problem-solution demonstration, split focus showcasing the real-life pain point solving in action, clear close-up detail of the product in effective use, dramatic satisfying before-and-after visual contrast, engaging TikTok problem-solver pacing, 9:16."
  },
  {
    id: "live_seller",
    title: "ไลฟ์สดสไตล์แม่ค้า (TikTok Live Vibe)",
    badge: "กระตุ้นปักตะกร้า 🎤",
    color: "#ec4899", // Pink
    icon: "Radio",
    tagline: "บรรยากาศห้องไลฟ์สด ไฟสตูดิโอ ป้ายโปรโมชั่นจัดเต็ม",
    description: "จำลองบรรยากาศห้องไลฟ์สด TikTok มีไฟวงแหวน (Ring light) ป้ายโปร 1 แถม 1 หรือป้ายราคาลดพิเศษ แม่ค้ายิ้มแย้มถือโชว์สินค้า เชิญชวนกดที่ตะกร้าสีเหลือง",
    stylePrompt: "Vibrant TikTok Live studio setup, professional ring light reflections, streamer microphone on desk, promotional acrylic stands and sale cards in background, enthusiastic Thai female streamer presenting the item close to lens, high-conversion live e-commerce atmosphere, 9:16 vertical."
  }
];

export function getPresetById(id) {
  return MARKETING_MODES.find(m => m.id === id) || MARKETING_MODES[0];
}
