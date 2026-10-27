# 🎬 AFFILIATE_PRO — TikTok AI Studio v2.0
> **ระบบสร้างคลิปวิดีโอ Affiliate อัตโนมัติผ่าน Google Flow และ Meta AI พร้อมโพสต์ ปักตะกร้า และเปิดสวิตช์ AI บน TikTok Studio**

Chrome Extension (สร้างด้วย **Vite + React + Tailwind CSS**) สำหรับครีเอเตอร์และนายหน้า TikTok Affiliate:
- ดึงสินค้าจาก TikTok Shop Showcase ได้ด้วยการคลิกปุ่มเพียงครั้งเดียว
- สร้างวิดีโอผ่าน **Google Flow** แบบ 2-Step Pipeline (ภาพเดี่ยว 360p &rarr; Frame to Video &rarr; Upscale 720p) หรือผ่าน **Meta AI** 10 วินาทีแนวตั้ง
- นำคลิปเข้า **TikTok Studio** อัตโนมัติ: ปักตะกร้าเหลืองตาม Product ID, ใส่แคปชั่น, **เปิดสวิตช์เนื้อหาที่สร้างโดย AI**, และตั้งเวลาโพสต์ล่วงหน้า

---

## ✨ ไฮไลท์ฟังก์ชันเวอร์ชัน 2.0 (New & Enhanced)

### 1. 🛍️ ปุ่มดึงสินค้าจาก Showcase (Fetch Showcase Button)
- มีปุ่ม **"ดึงสินค้าจาก Showcase"** ในส่วนหัวของโปรแกรม กดคลิกเดียวจะสแกนตารางสินค้าในหน้าต่าง "เพิ่มลิงก์สินค้า" ของ TikTok Studio
- ดึง Product ID (12–24 หลัก), ชื่อสินค้า, ราคา, สต็อก, สถานะ และรูปภาพปกความละเอียดสูง
- มีระบบ Pagination สแกนครบทุกหน้าอัตโนมัติ
- รองรับ Offline Demo Catalog สำรอง ทำให้เปิดใช้งานและทดสอบระบบได้ทันทีตลอด 24 ชม.

### 2. ⚡ Google Flow 2-Step Sequential Pipeline
- **Step 1 (สร้างภาพเดี่ยว):** สลับโหมดรูปภาพ &rarr; อัตราส่วน `9:16` (หรือ 16:9, 1:1) &rarr; จำนวน `x1` &rarr; Model `Omni 360p` &rarr; แนบภาพสินค้าจาก Showcase ล็อกอัตลักษณ์ 100% &rarr; ใส่ Prompt สร้างภาพ &rarr; รอเรนเดอร์เสร็จ 100%
- **Step 2 (Frame to Video):** นำภาพที่ได้เข้าสู่โหมดเฟรม &rarr; เลือกความยาวคลิป (`4s`, `6s`, `8s`, `10s`) &rarr; Model `Omni 360p` &rarr; กรอก Motion Prompt &rarr; เริ่มสร้างวิดีโอ
- **Step 3 (Download & Upscale):** ตรวจสอบถ้าเป็น Omni 360p จะสั่งดาวน์โหลดพร้อม **Upscale เป็น 720p HD** อัตโนมัติ! (หากเป็นโมเดลที่เป็น 720p อยู่แล้วจะดาวน์โหลดแบบปกติ)
- บันทึกไฟล์ลงในโฟลเดอร์เครื่อง **`AFFILIATE_PRO/`**

### 3. 🤖 Meta AI Dual Engine
- ทางเลือกสลับไปใช้ **Meta AI** สำหรับการสร้างคลิปแนวตั้ง 9:16 ความยาว 10 วินาที ลิปซิงก์เสียงไทยธรรมชาติ พร้อมแนบรูปสินค้าอ้างอิง

### 4. 🎯 TikTok Studio Automated Poster (100% Anti-Ban)
- **อัปโหลดคลิป MP4** ลงในช่องอัปโหลดวิดีโอของ TikTok Studio
- **กรอกคำอธิบาย (Caption)** พร้อมแฮชแท็กนายหน้าและ Call-to-action
- **ปักตะกร้าสินค้าสีเหลือง (Yellow Basket):** เปิดหน้าต่างค้นหาด้วย Product ID ตรงจุด &rarr; ติ๊กเลือกสินค้า &rarr; ยืนยันผูกตะกร้า
- **เปิดสวิตช์ "เนื้อหาที่สร้างโดย AI" (AIGC Toggle):** กด "แสดงเพิ่มเติม" (Show more) แล้วเปิดสวิตช์ AIGC อัตโนมัติ ปฏิบัติตามกฎเกณฑ์ TikTok 100%
- **ตั้งเวลาโพสต์ (Post Scheduling):** รองรับทั้งแบบตั้งเวลาล่วงหน้า (เช่น 30 นาที) หรือโพสต์ทันที

### 5. 💎 Bento Grid Modern Neon UI
- ออกแบบใหม่ทั้งหมดด้วย Bento Grid สไตล์ Dark Neon Cyberpunk ทันสมัย สวยงาม ครบทุกปุ่มฟังก์ชัน
- ปุ่ม **"เริ่มสร้างคลิปและโพสต์ TikTok ทันที (1-Click Start)"** เริ่มทำงานได้ทันทีโดยไม่ต้องตั้งค่าซับซ้อน

---

## 🛠️ สถาปัตยกรรมโค้ด (Codebase Structure)

```
flow-tiktok-studio/
├── dist/                     # ไฟล์คอมไพล์สำหรับโหลดเข้า Chrome (Load unpacked)
│   ├── manifest.json
│   ├── background.js
│   ├── flow_driver.js
│   ├── meta_driver.js
│   ├── tiktok_driver.js
│   └── sidepanel.html
├── src/
│   ├── background/           # Background Service Worker & Queue Engine
│   │   └── index.js
│   ├── content/              # In-page Drivers สำหรับควบคุมเว็บเป้าหมาย
│   │   ├── flow_driver.js    # ขับเคลื่อน Google Flow (2-step image-to-video & upscale)
│   │   ├── meta_driver.js    # ขับเคลื่อน Meta AI
│   │   └── tiktok_driver.js  # ขับเคลื่อน TikTok Studio (Upload, Basket, AI switch, Schedule)
│   ├── lib/
│   │   ├── showcase.js       # ระบบดึงสินค้า Showcase + Pagination Scraper
│   │   ├── deepseek.js       # ระบบสร้าง Prompt ภาษาไทย คัดกรองคำต้องห้าม
│   │   ├── presets.js        # พรีเซ็ต 6 สไตล์โฆษณายอดนิยม
│   │   └── compliance.js     # กฎเกณฑ์ Anti-Ban
│   └── sidepanel/
│       ├── App.jsx           # Bento Grid Modern Neon UI
│       └── sidepanel.css
└── public/
    └── manifest.json         # Chrome Extension Manifest V3
```

---

## 🚀 วิธีติดตั้งและใช้งานใน Chrome

1. เปิดเบราว์เซอร์ Google Chrome แล้วเข้าไปที่ `chrome://extensions/`
2. เปิดสวิตช์ **Developer mode** ที่มุมขวาบน
3. กดปุ่ม **Load unpacked** (โหลดส่วนขยายที่คลายการบีบอัดแล้ว)
4. เลือกโฟลเดอร์:
   `C:\Users\USER\.gemini\antigravity\scratch\flow-tiktok-studio\dist`
5. คลิกไอคอนส่วนขยายที่แถบเครื่องมือของ Chrome เพื่อเปิด Sidepanel `AFFILIATE PRO`
6. กดปุ่ม **"ดึงสินค้าจาก Showcase"** แล้วกด **"เริ่มสร้างคลิปและโพสต์ TikTok ทันที (1-Click Start)"**!
