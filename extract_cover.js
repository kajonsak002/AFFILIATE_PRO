import fs from 'fs';

const txt = fs.readFileSync('C:/Users/USER/.gemini/antigravity/brain/42572f50-a59d-40f1-9164-750a2ccf56f3/.system_generated/steps/1289/output.txt', 'utf8');
const startIdx = txt.indexOf('{"dataUrl":"data:image/jpeg;base64,');
if (startIdx !== -1) {
  const jsonStr = txt.slice(startIdx).trim();
  const obj = JSON.parse(jsonStr);
  const base64 = obj.dataUrl.split(',')[1];
  fs.writeFileSync('C:/Users/USER/.gemini/antigravity/brain/42572f50-a59d-40f1-9164-750a2ccf56f3/tiktok_showcase_product_cover.jpeg', Buffer.from(base64, 'base64'));
  console.log('Saved product cover image successfully! Bytes:', fs.statSync('C:/Users/USER/.gemini/antigravity/brain/42572f50-a59d-40f1-9164-750a2ccf56f3/tiktok_showcase_product_cover.jpeg').size);
} else {
  console.log('Start index not found');
}
