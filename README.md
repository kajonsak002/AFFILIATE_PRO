# 🎬 AFFILIATE_PRO — TikTok AI Studio (Google Flow & Meta AI Auto Video Engine)

ส่วนขยาย Chrome Extension (สร้างด้วย **Vite + React + Tailwind CSS**) สำหรับสร้างภาพและวิดีโอโปรโมทสินค้า TikTok Shop Showcase อัตโนมัติ โดยเชื่อมต่อกับ **Google Flow** และ **Meta AI** พร้อมระบบ AI Prompt Generator ด้วย **DeepSeek-V3 (`deepseek-chat`)** ในราคาประหยัดที่สุด และระบบนำคลิปขึ้น TikTok Studio เพื่อปักตะกร้าสินค้า

---

## ✨ ฟีเจอร์หลัก (Key Features)

1. **ดึงสินค้าจาก TikTok Shop Showcase อัตโนมัติ**:
   - ดึงข้อมูลสินค้า (รูปปก, ชื่อสินค้า, ราคา, ชื่อร้าน) จาก API ทางการของ TikTok Showcase
   - รองรับการเลือกสินค้าเป็นรายชิ้น หรือจัดคิวงานผลิตอัตโนมัติ

2. **ระบบล็อกอัตลักษณ์สินค้า โลโก้ และฉลาก 100% (Product Reference Element)**:
   - นำภาพปกจริงจาก Showcase เข้าระบบ Google Flow เป็น **องค์ประกอบอ้างอิง (Element Reference Chip)**
   - สลับเข้า **โหมดรูปภาพ (Image Mode)** ก่อนเสมอ เพื่อปลดล็อกปุ่มบวก (`+`)
   - ล็อกทรงกระปุก/ขวด โลโก้ และฉลาก 100% ก่อนสร้างภาพฉากแรก

3. **การตั้งค่าอัตราส่วนภาพ (Aspect Ratio)**:
   - รองรับทุกอัตราส่วนตาม Google Flow:
     - `9:16` (แนวตั้ง TikTok / Reels / Shorts — แนะนำ)
     - `16:9` (แนวนอน)
     - `1:1` (จัตุรัส)
     - `4:3` (คลาสสิก)
     - `3:4` (แนวตั้ง)

4. **การตั้งค่าโมเดล AI และความละเอียด (Model & Resolution)**:
   - **Omni 1.1 Flash**:
     - `360p`: สร้างเร็ว ประหยัดเครดิต (ใช้เพียง 6 เครดิต) + สั่ง **อัปสเกลเป็น 720p HD** อัตโนมัติขณะดาวน์โหลด
     - `720p`: สร้างที่ความละเอียด 720p ดั้งเดิม
   - **Veo 3.1 - Fast / Veo 3.1 - Quality**:
     - สร้างที่ความละเอียด `720p ขนาดดั้งเดิม` (ไม่ต้องอัปสเกล)
   - **บังคับผลลัพธ์ทีละ 1 ชิ้น (`x1`)**: ป้องกันการเรนเดอร์ซ้ำซ้อนและควบคุมเครดิต

5. **การตั้งค่าความยาวคลิป (Video Duration)**:
   - Google Flow: เลือกได้ `4 วินาที`, `6 วินาที`, `8 วินาที (แนะนำ)`, `10 วินาที`
   - Meta AI: กำหนดมาตรฐานคงที่ไว้ที่ `10 วินาที`

6. **โฟลเดอร์ดาวน์โหลดเฉพาะ (Download Destination)**:
   - บันทึกไฟล์วิดีโอที่ดาวน์โหลดเข้าโฟลเดอร์ **`AFFILIATE_PRO`** เสมอ (ผ่าน `chrome.downloads` และตัวดักจับ `onDeterminingFilename`)

7. **ระบบ TikTok Studio อัตโนมัติ (Anti-Ban 100%)**:
   - **ปักตะกร้าสินค้าสีเหลือง**: ค้นหาและผูกตะกร้าสินค้าจาก Showcase อัตโนมัติ
   - **บทพูดภาษาไทย 100%**: บทพากย์ภาษาไทยล้วน ไม่มีคำอังกฤษ
   - **กรองคำต้องห้าม**: กรองคำทางการแพทย์และคำเคลมเกินจริงตามมาตรฐาน TikTok Anti-Ban
   - **เปิดเผยเนื้อหา AI (AI Content Disclosure)**: เปิดสวิตช์ "สร้างโดย AI" บน TikTok Studio อัตโนมัติ
   - **ตั้งเวลาโพสต์ (Post Scheduling)**: กำหนดวัน เวลา และระยะห่างของแต่ละคลิป (เช่น ทุกๆ 1, 2, 3 ชม.)

---

## 🚀 วิธีติดตั้งส่วนขยายเข้า Google Chrome

1. เปิดเบราว์เซอร์ Google Chrome ไปที่หน้า:
   ```text
   chrome://extensions
   ```
2. เปิดสวิตช์ **โหมดนักพัฒนาซอฟต์แวร์ (Developer mode)** ที่มุมขวาบน
3. คลิกปุ่ม **โหลดส่วนขยายที่คลายการบีบอัดแล้ว (Load unpacked)**
4. เลือกโฟลเดอร์:
   ```text
   C:\Users\USER\.gemini\antigravity\scratch\flow-tiktok-studio\dist
   ```
5. ส่วนขยาย **TikTok AI Studio** จะปรากฏขึ้นในแถบ Extensions ให้กดปักหมุด (Pin) ไว้เพื่อเปิดใช้งานเป็น Side Panel แผงด้านข้างได้ทันที!

---

## 🛠 คำสั่งสำหรับพัฒนา (Development)

```bash
# คอมไพล์โปรดักชัน
npm run build
```

---

## 📦 GitHub Repository
- **URL:** [https://github.com/kajonsak002/AFFILIATE_PRO.git](https://github.com/kajonsak002/AFFILIATE_PRO.git)
- **Branch:** `main`
